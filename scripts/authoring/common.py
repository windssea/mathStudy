from pathlib import Path
import json, ast, operator, html, re
ROOT=Path(__file__).resolve().parents[2]
OUT=[]; P=1; PAGE=1; U=2
PAPERS=json.loads((ROOT/'content/practice/papers.json').read_text(encoding='utf-8'))
def context(p,page,u):
 global P,PAGE,U
 P,PAGE,U=p,page,u

def table(headings,rows):return {'kind':'table','headings':headings,'rows':[[str(v) for v in row] for row in rows]}
def flow(text):return {'kind':'flow','headings':[],'rows':[['推导',text]]}
def bars(labels,values):return {'kind':'bars','headings':labels,'rows':[],'values':values}
def crop(q,box):
 # Retain the authoring marker; bank.py supplies a vector redraw or explicit text.
 # Original scans remain local reference material and are not build inputs.
 q['promptImage']={'src':f'/papers/crops/{q["id"]}.webp','alt':f'原卷第{PAGE}页{q["sources"][0]["number"]}的题图'}

def ident(no):
 chapter='一二三四五六七八九十'
 section='s'+str(chapter.index(no[0])+1)+'-' if no[0] in chapter else ''
 rest=no[1:] if section else no
 rest=rest.replace('附加','extra').replace('附','extra')
 rest=re.sub(r'[^a-zA-Z0-9]+','-',rest).strip('-')
 return f'full-p{P:02}-{section}q{rest}'

def question(no,stem,answers,steps,analysis='',labels=None,kind='fill',topic=None,diff='advanced',options=None,box=None,stages=None,review=False,rules=None):
 assert 1<=len(answers)<=8
 qid=ident(no)
 if not isinstance(answers,dict):answers={f'a{i+1}':str(v) for i,v in enumerate(answers if isinstance(answers,list) else [answers])}
 answers={k:str(v) for k,v in answers.items()}
 labels=labels or list(answers)
 sources=[{'paperId':f'P{P:02}','page':PAGE,'number':no}]
 if P in [2,9]:sources.append({'paperId':'P03' if P==2 else 'P12','page':PAGE,'number':no})
 q={'id':qid,'unitId':f'U0{U}','title':no+' · '+ {'fill':'填空','choice':'选择','judgement':'判断','application':'解决问题','calculation':'计算','drawing':'操作' }[kind], 'stem':stem,'type':kind,'difficulty':diff,'fields':[{'key':k,'label':labels[i],'inputMode':'numeric' if answers[k].isdigit() else 'text'} for i,k in enumerate(answers)],'hint':analysis or steps[0],'sourceKind':'collected','sources':sources,'topicIds':[f'u{U}-{topic or ("calculation" if U==1 else "measure")}'],'knowledge':analysis or steps[0],'pages':[2,16] if U==1 else [18,43],'hasVisual':stages is not None,'expected':answers,'explanation':{'analysis':analysis or steps[0],'steps':steps,'answer':'；'.join(f'{labels[i]}：{v}' for i,v in enumerate(answers.values())),'pitfall':''}}
 if options:q['options']=options;q['explanation']['answer']=options[int(next(iter(answers.values())))]
 if stages:
  assert len(stages)==len(steps),(qid,len(stages),len(steps))
  q['explanation']['visual']={'kind':'reasoning','title':q['title'],'labels':[],'values':[],'captions':steps,'stages':stages}
 if rules:q['answerRules']=rules
 if review:
  q['responseMode']='selfReview';q['expected']={'review':'已核对'};q['fields']=[{'key':'review','label':'核对记录'}];q['explanation']['answer']='；'.join(steps[-2:])
 if box:crop(q,box)
 OUT.append(q);return q

def fill(no,stem,answers,steps,labels=None,**kw):
 if not isinstance(answers,list):answers=[answers]
 return question(no,stem,answers,steps,labels=labels,**kw)
def choice(no,stem,options,index,steps,**kw):return question(no,stem,{'value':str(index)},steps,kind='choice',options=options,labels=['选择'],**kw)
def judge(no,stem,correct,reason):return question(no,stem,{'value':'0' if correct else '1'},[reason,'因此判断为'+('对。' if correct else '错。')],kind='judgement',options=['对','错'],labels=['判断'],diff='basic')
def app(no,stem,answers,steps,labels=None,**kw):return fill(no,stem,answers,steps,labels=labels,kind='application',**kw)
def review(no,stem,steps,**kw):return question(no,stem,['已核对'],steps,kind='drawing',review=True,**kw)
def calc(no,a,b):
 d,r=divmod(a,b)
 from_steps=[];partial=0;started=False
 for i,ch in enumerate(str(a)):
  partial=partial*10+int(ch)
  if not started and partial<b and i<len(str(a))-1:continue
  started=True;digit=partial//b;product=b*digit;rem=partial-product
  from_steps.append(f'取{partial}，商{digit}，{b}×{digit}＝{product}，减后余{rem}。'+('落下下一位继续除。' if i<len(str(a))-1 else ''))
  partial=rem
 return fill(no,f'列竖式计算并验算：{a}÷{b}。',[d,r],from_steps+[f'验算：{b}×{d}＋{r}＝{a}，余数{r}小于除数{b}。'],labels=['商','余数'],kind='calculation',diff='basic',topic='calculation' if U==1 else 'measure')
OPS={ast.Add:operator.add,ast.Sub:operator.sub,ast.Mult:operator.mul,ast.Div:operator.truediv}
def evaluate(s):
 def walk(n):
  if isinstance(n,ast.Constant) and type(n.value) is int:return n.value
  if isinstance(n,ast.BinOp) and type(n.op) in OPS:return OPS[type(n.op)](walk(n.left),walk(n.right))
  raise ValueError(s)
 v=walk(ast.parse(s.replace('×','*').replace('÷','/').replace('−','-'),mode='eval').body)
 return int(v) if v==int(v) else v

def arithmetic(section,expressions):
 for i,expr in enumerate(expressions.split('|'),1):
  v=evaluate(expr)
  # Exact integer-division examples use column explanations, including remainders.
  normalized=expr.replace(' ','')
  if '÷' in expr and normalized.count('÷')==1 and all(x.isdigit() for x in normalized.split('÷')):
   a,b=map(int,normalized.split('÷'));item=calc(f'{section}（{i}）',a,b)
   assert a%b==0,('mental division must be exact',a,b)
   item['stem']=f'计算：{expr}。'
   item['fields'][0]['label']='得数';item['fields'][1]['fixedValue']='0'
   d=a//b
   if b in [25,50,125]:
    factor={25:4,50:2,125:8}[b]
    steps=[f'被除数和除数同时乘{factor}，商不变。',f'{a}÷{b}＝({a}×{factor})÷({b}×{factor})＝{a*factor}÷{b*factor}＝{d}。']
   elif a%10==0 and b%10==0:
    steps=['被除数和除数同时除以10，商不变。',f'{a}÷{b}＝{a//10}÷{b//10}＝{d}。']
   else:
    steps=[f'想乘法：{b}×{d}＝{a}。',f'所以{a}÷{b}＝{d}，可以用乘法验算。']
   item['hint']=steps[0];item['knowledge']=steps[0];item['explanation']={'analysis':steps[0],'steps':steps,'answer':f'得数：{d}','pitfall':''}
  else:
   tree=ast.parse(expr.replace('×','*').replace('÷','/').replace('−','-'),mode='eval').body
   detail=[]
   def trace(n):
    if isinstance(n,ast.Constant):return n.value
    a,b=trace(n.left),trace(n.right);res=OPS[type(n.op)](a,b)
    fmt=lambda x:str(int(x)) if x==int(x) else str(x)
    detail.append(f'{fmt(a)}{ {ast.Add:"＋",ast.Sub:"−",ast.Mult:"×",ast.Div:"÷"}[type(n.op)]}{fmt(b)}＝{fmt(res)}。')
    return res
   trace(tree)
   fill(f'{section}（{i}）',f'计算：{expr}。',[v],['先算括号；再算乘除，最后算加减。同级运算从左往右。']+detail,labels=['得数'],kind='calculation',diff='basic')

def rect(no,l,w,unit='厘米',**kw):
 return fill(no,f'求图中长方形的周长和面积。长{l}{unit}，宽{w}{unit}。',[2*(l+w),l*w],[f'一组长宽之和：{l}＋{w}＝{l+w}{unit}。',f'周长：{l+w}×2＝{2*(l+w)}{unit}。',f'面积：{l}×{w}＝{l*w}平方{unit}。'],labels=[f'周长（{unit}）',f'面积（平方{unit}）'],**kw)
def old(p,no):
 data=json.loads((ROOT/'content/practice/collected-questions.json').read_text(encoding='utf-8'))
 matches=[q for q in data if any(s['paperId']==f'P{p:02}' and s['number']==no for s in q.get('sources',[]))]
 assert len(matches)==1,(p,no)
 q=matches[0]
 return question(no,q['stem'],q['expected'],q['explanation']['steps'],analysis=q['explanation']['analysis'],labels=[f['label'] for f in q['fields']],kind=q['type'],topic=q['topicIds'][0].split('-',1)[1],diff=q['difficulty'],options=q.get('options'),stages=q['explanation'].get('visual',{}).get('stages'))

def svg(name,body):
 dest=ROOT/f'apps/web/public/figures/{name}.svg';dest.parent.mkdir(parents=True,exist_ok=True)
 dest.write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 340"><rect width="720" height="340" fill="white"/>{body}</svg>',encoding='utf-8')
 return {'kind':'image','image':f'/figures/{name}.svg','headings':[],'rows':[]}
def text(x,y,s,size=22):return f'<text x="{x}" y="{y}" font-family="sans-serif" font-size="{size}" fill="#243754">{html.escape(str(s))}</text>'
def rectangle(x,y,w,h,fill='#e6eeff',stroke='#3563e9'):return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{fill}" stroke="{stroke}" stroke-width="3"/>'
def rect_steps(name,l,w,unit='米'):
 scale=min(450/l,200/w)
 body=rectangle(100,65,l*scale,w*scale)+text(110,45,f'长 {l}{unit}')+text(110+l*scale,160,f'宽 {w}{unit}')
 return [svg(name+'-1',body+text(90,305,'先标出长和宽')),svg(name+'-2',body+text(90,305,f'周长：({l}＋{w})×2＝{(l+w)*2}{unit}')),svg(name+'-3',body+text(90,305,f'面积：{l}×{w}＝{l*w}'+('个单位方格' if unit=='格' else f'平方{unit}')))]

def save():
 (ROOT/'content/practice/full-questions.json').write_text(json.dumps(OUT,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 print('Full original exercises:',len(OUT))
 for p in sorted(set(q['sources'][0]['paperId'] for q in OUT)):
  qs=[q for q in OUT if q['sources'][0]['paperId']==p]
  print(p,len(qs),'review',sum(q.get('responseMode')=='selfReview' for q in qs))

def reuse(source_p,source_no,no):
 import copy
 found=next(q for q in OUT if q['sources'][0]['paperId']==f'P{source_p:02}' and q['sources'][0]['number']==source_no)
 q=copy.deepcopy(found)
 q['id']=ident(no)
 q['sources']=[{'paperId':f'P{P:02}','page':PAGE,'number':no}]
 if P in [2,9]:q['sources'].append({'paperId':'P03' if P==2 else 'P12','page':PAGE,'number':no})
 q['title']=no+' · '+q['title'].split(' · ',1)[-1]
 OUT.append(q);return q
