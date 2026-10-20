"""Audit additions; diagrams retain the supplied scan and expose one derivation at a time."""
from common import *
import base64

def enhance():
 for q in OUT:
  source=q['sources'][0]
  # Written reasoning is an application, rather than pretending every self-check is a drawing.
  if q.get('responseMode')=='selfReview' and not any(word in q['stem'] for word in ['画','方格','展开','连线','竖式','表格','表，']):q['type']='application'
  if q['promptImage'] if 'promptImage' in q else False:
   if not q['hasVisual']:
    data=base64.b64encode((ROOT/'apps/web/public'/q['promptImage']['src'].lstrip('/')).read_bytes()).decode()
    stages=[]
    for i,step in enumerate(q['explanation']['steps']):
     equations=re.findall(r'\d+(?:[×÷＋+−＝=]\d+)+',step)[:2]
     # The source stays in view while the calculation for this step is added below it.
     body=f'<image href="data:image/webp;base64,{data}" x="35" y="10" width="650" height="{220 if equations else 320}" preserveAspectRatio="xMidYMid meet"/>'
     if equations:
      body+='<rect x="20" y="240" width="680" height="90" rx="6" fill="#edf3ff"/>'
      body+=''.join(text(70,274+j*33,line,24) for j,line in enumerate(equations))
     stages.append(svg(q['id']+f'-step{i+1}',body))
    q['hasVisual']=True
    q['explanation']['visual']={'kind':'reasoning','title':q['title'],'labels':[],'values':[],'captions':q['explanation']['steps'],'stages':stages}
  if source['paperId']=='P18' and source['number'] in ['25','26','27','28','32']:
   q['difficulty']='challenge'
 # Exact shaded polygons: use a checked geometry, not just an OCR interpretation.
 q=next(q for q in OUT if q['sources'][0]['paperId']=='P15' and q['sources'][0]['number']=='一2')
 polygons=[[(1,2),(2,1),(3,1),(2,2)],[(1,2),(5,2),(5,3),(1,3)],[(3,1.5),(5,1.5),(5,2),(3,2)]]
 grid=''.join(f'<path d="M{100+i*65} 50V290" stroke="#c5d0e3"/>' for i in range(6))+''.join(f'<path d="M100 {50+i*65}H425" stroke="#c5d0e3"/>' for i in range(4))
 shapes=''.join(f'<polygon points="'+ ' '.join(f'{100+x*65},{50+y*65}' for x,y in pts)+'" fill="'+['#65a58c','#d7e5ff','#ffe3a3'][i]+'" stroke="#3563e9" stroke-width="2"/>' for i,pts in enumerate(polygons))
 q['explanation']['visual']['stages'][0]=svg('p15-A-area',grid+shapes+text(460,100,'下部：4格',20)+text(460,150,'斜块：1格',20)+text(460,200,'半高条：1格',20)+text(460,260,'合计6格',22))
