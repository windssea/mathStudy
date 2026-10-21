"""Turn source exercises into self-contained topic-bank items and original vector figures."""
from common import *
import math

BLUE='#3563e9'; FILL='#e6eeff'; GREEN='#dceee5'; GOLD='#fff0cd'
FIGURES={}
STEMS={}
REASONS={}

def t(x,y,s,size=20):return text(x,y,s,size)
def line(x1,y1,x2,y2,color=BLUE,width=2,dash=False):
 return f'<path d="M{x1} {y1}L{x2} {y2}" fill="none" stroke="{color}" stroke-width="{width}"'+(' stroke-dasharray="6 5"' if dash else '')+'/>'
def poly(points,fill=FILL,stroke=BLUE):
 return '<polygon points="'+' '.join(f'{x},{y}' for x,y in points)+f'" fill="{fill}" fill-opacity=".72" stroke="{stroke}" stroke-width="2"/>'
def group(x,y,body,scale=1):return f'<g transform="translate({x} {y}) scale({scale})">{body}</g>'
def grid(cols,rows,cell=32,filled=None):
 filled=set(filled or [])
 return ''.join(f'<rect x="{x*cell}" y="{y*cell}" width="{cell}" height="{cell}" fill="{FILL if (x,y) in filled else "white"}" stroke="#a5b4cf" stroke-width="1"/>' for y in range(rows) for x in range(cols))
def cells(points,cell=32):return ''.join(rectangle(x*cell,y*cell,cell,cell) for x,y in points)
def rect_diagram(l,w,unit='厘米'):
 scale=min(420/l,190/w)
 return group(100,65,rectangle(0,0,l*scale,w*scale)+t(8,-18,f'{l}{unit}')+t(l*scale+15,w*scale/2,f'{w}{unit}'))
def define(qid,body,stem=None,steps=None):
 FIGURES[qid]=body
 if stem:STEMS[qid]=stem
 if steps:REASONS[qid]=steps
def alternatives(bodies,labels=None):
 labels=labels or list('ABCD')[:len(bodies)]
 n=len(bodies)
 return ''.join(group(20+i*690/n,60,body)+t(45+i*690/n,290,labels[i]) for i,body in enumerate(bodies))
def notch(l,w,cw,ch,where='corner'):
 x=(l-cw)/2 if where=='top' else l-cw
 if where=='left':
  pts=[(0,0),(l,0),(l,w),(0,w),(0,(w+ch)/2),(cw,(w+ch)/2),(cw,(w-ch)/2),(0,(w-ch)/2)]
 elif where=='inside':
  return rectangle(0,0,l,w)+rectangle(x,(w-ch)/2,cw,ch,'white')
 elif where=='top':
  pts=[(0,0),(x,0),(x,ch),(x+cw,ch),(x+cw,0),(l,0),(l,w),(0,w)]
 else:
  pts=[(0,0),(x,0),(x,ch),(l,ch),(l,w),(0,w)]
 return poly(pts)
def partition(curved=False):
 path='M0 0 C190 15 30 155 300 190' if curved else 'M0 0 L65 50 L65 130 L210 130 L300 190'
 return group(180,55,rectangle(0,0,300,190)+f'<path d="{path} L300 0 Z" fill="{GREEN}"/>'+f'<path d="{path}" fill="none" stroke="{BLUE}" stroke-width="3"/>'+t(190,70,'甲')+t(65,160,'乙'))
def ray(values,label=''):
 x=0;body=''
 for i,v in enumerate(values):
  body+=line(x,0,x+v*18,0)+line(x,-6,x,6)+t(x+v*9-8,32,str(v),16)
  x+=v*18
 return body+line(x,-6,x,6)+t(0,-20,label,18)

# Areas are independently checked from the final grid-coordinate polygons.
REASONS['full-p01-s1-q5']=['①面积4×1＋2×2÷2＝6平方米。','②面积2×4＋2×4÷2＝12平方米；③为5×3长方形，面积15平方米。','④沿方格分割，面积4×2＋4×2÷2＝12平方米。','③最大，①最小，②和④相等。']
define('full-p01-s1-q7',alternatives([
 cells([(1,0),(2,0),(1,1),(0,2),(1,2)],38),
 cells([(1,0),(0,1),(1,1),(2,1),(1,2)],38)],['①','②']),
 '每个小正方形边长1厘米。两幅图各由5个小正方形拼成。分别求周长和面积。')
define('full-p01-s1-q8',group(130,35,grid(10,7,32,[(i,i) for i in range(7)]+[(7,5),(8,4),(9,3)]))+t(145,305,'每格边长1厘米',18))
define('full-p01-s2-q2',alternatives([
 cells([(x,y) for y in range(2) for x in range(4)],27),
 cells([(0,0),(1,0),(0,1),(0,2),(1,2),(2,2)],27),
 cells([(0,0),(0,1),(0,2),(1,2),(2,2),(3,2),(3,1),(3,0)],27),
 cells([(0,2),(1,2),(2,2),(3,2),(3,1),(3,0),(4,0)],27)],['①','②','③','④']),
 '每个方格边长1厘米。四个涂色图形中，哪个周长最长？',
 ['只数图形外边界，内部共用边不计入周长。','①是4×2长方形，周长12厘米；②有6格、5条共用边，周长14厘米。','③有8格、7条共用边，周长18厘米；④有7格、6条共用边，周长16厘米。','所以③的周长最长。'])
define('full-p01-s2-q5',partition(True))
for qid,l,w in [('full-p01-s3-q1-1',19,12),('full-p01-s3-q2-1',8,4),('full-p01-s3-q2-2',16,16),('full-p02-s2-q2-1',42,18),('full-p05-s3-q1',9,4),('full-p05-s3-q2',5,5),('full-p10-s3-q1',22,7),('full-p15-s3-q1',14,8),('full-p15-s3-q2',13,13)]:
 define(qid,rect_diagram(l,w,'米' if qid=='full-p01-s3-q2-2' or qid=='full-p02-s2-q2-1' else '分米' if qid=='full-p15-s3-q2' else '厘米'))
define('full-p01-s3-q1-2',poly([(120,240),(280,65),(390,65),(550,240)])+t(290,45,'13厘米')+t(290,275,'37厘米')+t(95,145,'24厘米')+t(495,145,'24厘米'))
define('full-p01-s3-q1-3',group(160,60,poly([(0,60),(140,60),(140,0),(220,0),(220,60),(360,60),(360,220),(0,220)])+t(145,252,'16米')+t(-60,160,'8米')+t(235,30,'4米')))
define('full-p01-s3-q2-3',group(140,45,poly([(0,0),(360,0),(360,120),(240,120),(240,240),(0,240)])+t(140,-15,'30分米')+t(-95,130,'20分米')+t(250,150,'10分米',17)+t(245,215,'10分米',17)))
define('full-p01-s4-q1',alternatives([poly([(0,100),(100,100),(80,20)])+t(0,150,'三边：3、4、5厘米',17),poly([(0,40),(35,0),(90,0),(125,40),(90,80),(35,80)])+t(0,150,'六条边均为3厘米',17)],['三角形','六边形']),
 '三角形三边长3、4、5厘米，正六边形每边长3厘米。用线段依次表示各边展开后的长度，比较两图的周长。',
 ['三角形依次展开3、4、5厘米，周长3＋4＋5＝12厘米。','六边形六条边各3厘米，周长3×6＝18厘米。','以相同起点、相同比例画12厘米与18厘米的线段。','18＞12，六边形周长较长。尺寸以标注为准，不用直尺量屏幕。'])
define('full-p01-s4-q2-1',group(130,45,grid(12,6,32,[(x,y) for y in range(4) for x in range(4)]))+t(150,290,'每格1平方厘米；涂色为给定正方形',18))
define('full-p02-s1-q2',alternatives([ray([3,2,2,3]),ray([2,3,3,2]),ray([3,2,3,2])],['A','B','C']),
 '三根铁丝分别分成图示的四段，数字表示各段厘米数。按分点弯折，哪根能围成长方形？')
define('full-p02-s1-q3',group(230,40,grid(4,4,52,[(0,0)]+[(i,1) for i in range(3)]+[(i,2) for i in range(4)])))
define('full-p02-s1-q7',partition())
define('full-p02-s1-q9',group(235,45,rectangle(0,0,240,240)+poly([(120,0),(240,120),(120,240),(0,120)],'white')+rectangle(60,60,120,120,FILL)))
define('full-p02-s1-q10',group(225,40,rectangle(0,0,240,240)+rectangle(0,0,180,60,GREEN)+rectangle(180,0,60,180,GREEN)+rectangle(60,180,180,60,GREEN)+rectangle(0,60,60,180,GREEN)+t(0,275,'四条长方形纸片均为3厘米×1厘米',17)))
define('full-p02-s2-q2-2',group(215,40,poly([(0,0),(240,0),(240,240),(95,240),(95,72),(0,72)])+t(65,-15,'10分米')+t(250,145,'10分米')+t(-80,40,'3分米',18)+t(5,170,'7分米',18)+t(10,300,'缺口宽未给出，不能由图形比例推算',17)))
define('full-p02-s3-q6',group(120,50,poly([(120,0),(200,0),(200,45),(240,45),(240,90),(320,90),(320,135),(0,135),(0,90),(80,90),(80,45),(120,45)],'white')+t(130,30,'2分米',16)+t(125,75,'4分米',16)+t(125,120,'8分米',16)+t(370,40,'每条高1分米',18)),
 '砖墙上的洞可分成三条高1分米的横条，从上到下宽分别为2分米、4分米、8分米。洞的面积是多少平方分米？')
define('full-p02-s3-q10',group(170,45,grid(7,4,48,[(0,0),(1,1),(2,2),(3,3),(4,2),(5,1),(6,0)]))+t(170,280,'每块砖边长1米',18))
define('full-p02-s3-q12',group(140,70,rectangle(0,30,300,125,GREEN)+rectangle(230,0,150,150,GOLD)+t(10,195,'12厘米×5厘米')+t(310,-20,'边长6厘米',18)))
define('full-p02-s3-q13',group(220,40,rectangle(0,0,240,240)+rectangle(0,80,160,160,FILL)+rectangle(160,0,80,80,GREEN)+line(0,80,240,80)+line(160,0,160,240)+t(0,280,'两块涂色正方形周长之和32厘米',17)))
define('full-p02-s4-q1',group(140,50,poly([(0,80),(45,0),(135,0),(180,80),(135,160),(45,160)])+t(0,220,'每边长2厘米')+group(250,80,ray([2,2,2,2,2,2]))),
 '一个正六边形每边长2厘米。把六条边的长度依次展开到同一条射线上，求它的周长。',
 ['从射线起点起，依次截取六段2厘米长的线段，每段首尾相接。','六段总长2×6＝12厘米。','正六边形的周长是12厘米。按标注求长度，不测量屏幕。'])
define('full-p02-s4-q2-1',group(140,50,grid(12,6,32,[(x,y) for x in range(8) for y in range(2)])))
floor=group(160,40,rectangle(0,0,360,220)+line(144,0,144,220)+line(0,76,144,76)+line(144,165,360,165)+t(8,45,'科学实验室',17)+t(22,150,'音乐教室',17)+t(208,95,'微机房')+t(205,203,'舞蹈房',17)+t(24,-16,'12米')+t(156,260,'30米')+t(375,100,'15米'))
define('full-p02-s5-q3-1',floor)
define('full-p02-s5-q3-2',floor)
define('full-p02-s5-q5',rect_diagram(32,9))
define('full-p04-s5-q7-1',group(175,40,t(125,0,'1 □',28)+line(70,20,260,20)+line(70,20,70,70)+t(0,60,'49',28)+t(100,60,'6 □ □',28)+t(100,110,'□ □',28)+line(90,130,260,130)+t(100,175,'□ □ □',28)+t(100,215,'□ □ 7',28)+line(90,230,260,230)+t(225,265,'0',28)),
 '补全竖式：除数49，商十位1；被除数是6□□，最后一次乘积是□□7，余数0。')
define('full-p04-s5-q7-2',group(175,40,t(130,0,'3 □',28)+line(70,20,260,20)+line(70,20,70,70)+t(-15,60,'□□',28)+t(100,60,'6 □ 4',28)+t(100,110,'5 □',28)+line(90,130,260,130)+t(100,175,'□ □ □',28)+t(100,215,'□ □ □',28)+line(90,230,260,230)+t(225,265,'0',28)),
 '补全竖式：除数两位数，商十位3，被除数6□4；第一次乘积5□，第二次相减余0。找出所有成立的算式。')
define('full-p05-s1-q2',alternatives([cells([(0,1),(1,1),(2,1),(1,0)],37),cells([(0,0),(0,1),(1,1),(1,2)],37),cells([(0,0),(1,0),(0,1),(1,1)],37)],['黑黑','灰灰','黄黄']))
define('full-p05-s1-q3',group(150,35,grid(7,6,36,[(i,i) for i in range(6)]+[(6,0)]))+t(150,300,'每格代表1张扑克牌',18))
define('full-p05-s1-q9',group(220,55,rectangle(48,0,48,48)+rectangle(24,48,48,48)+rectangle(72,48,48,48)+''.join(rectangle(i*48,96,48,48) for i in range(3)))+t(180,280,'每个小正方形边长1厘米',18))
define('full-p05-s1-q10',alternatives([cells([(0,0),(1,0)],25),cells([(0,0),(1,0),(0,1),(1,1),(2,1)],25),cells([(x,y) for y in range(3) for x in range(3)],25)],['第1个','第2个','第3个']),
 '一列方格图，面积依次为2、5、9平方厘米，相邻两幅增加的方格数依次为3、4、5、6……按此规律，第4、5个图形面积各是多少？面积35平方厘米的是第几个？')
define('full-p05-s2-q1',alternatives([ray([3,3,2,2]),ray([2,2,3,3]),ray([3,2,3,2]),ray([3,2,2,3])]),
 '长方形长3厘米、宽2厘米。把四条边沿边界依次展开，下面哪组线段顺序正确？')
define('full-p05-s2-q4',alternatives([group(0,35,notch(140,84,56,56)),group(0,35,notch(140,84,56,56,'inside')),group(0,35,notch(140,84,56,56,'top'))],['剪角','挖孔','开凹口']))
define('full-p05-s2-q5',group(150,45,grid(6,4,48,[(0,0),(1,1),(2,1),(3,2),(4,3),(5,3)]))+t(155,280,'外框长6厘米，每行高1厘米',18),
 '图中长方形长6厘米，每行高1厘米。阴影从上到下分别占1格、2格、1格、2格，水平平移后可首尾相接铺满一整行。阴影面积是多少平方厘米？')
define('full-p05-s3-q3',group(140,40,poly([(0,60),(150,60),(150,0),(210,0),(210,60),(360,60),(360,240),(0,240)])+t(150,275,'12厘米')+t(380,165,'6厘米')+t(225,30,'2厘米')))
define('full-p05-s4-q1',group(170,40,grid(10,6,32,[(x,y) for y,n in enumerate([5,4,3]) for x in range(n)])))
define('full-p10-s1-q5',group(240,40,cells([(1,0),(0,1),(1,1),(2,1),(1,2)],60)))
define('full-p10-s1-q6',group(160,40,rectangle(0,0,360,216)+line(216,0,216,216)+line(216,144,360,144)+t(250,195,'20×10',18)+t(245,270,'单位：厘米',17)))
define('full-p10-s1-q8',group(70,75,rectangle(0,0,180,135)+line(0,135,180,0)+t(45,170,'8厘米×6厘米')+t(215,75,'→',30)+group(290,0,poly([(0,135),(180,0),(360,135)])+line(180,0,180,135))))
define('full-p10-s1-q9',group(180,35,poly([(0,0),(280,0),(280,160),(160,160),(160,280),(0,280)])+rectangle(0,0,160,160,GREEN)+t(205,70,'4厘米',17)+t(165,310,'7厘米',17)))
def hexagon(cx,cy,r=47):
 return poly([(cx+r*math.cos(math.radians(60*i-30)),cy+r*math.sin(math.radians(60*i-30))) for i in range(6)])
define('full-p10-s1-q10',group(170,45,hexagon(50,50)+hexagon(50+47*math.sqrt(3)/2,120.5)+hexagon(50+47*math.sqrt(3)*1.5,120.5))+t(185,285,'每条边长1厘米',18))
define('full-p10-s2-q2',alternatives([cells([(0,1),(1,1),(2,1),(3,1),(3,0)],27),cells([(0,0),(1,0),(1,1),(2,1)],27),cells([(x,y) for x in range(3) for y in range(2)],27),cells([(0,1),(1,1),(2,1),(1,0)],27)]))
define('full-p10-s2-q5',group(100,70,rectangle(0,0,360,180)+rectangle(0,0,60,180,GREEN)+t(18,100,'甲')+t(185,100,'乙')+t(15,-20,'4厘米')+t(145,215,'24厘米')+t(-85,95,'12厘米')+t(430,25,'12×24',24)+t(430,75,'12×4＝48')+t(430,125,'12×20＝240')))
define('full-p10-s2-q7',alternatives([notch(140,100,55,45),notch(140,100,55,45,'top'),poly([(0,0),(85,0),(140,45),(140,100),(0,100)])],['①','②','③']))
define('full-p10-s3-q2',group(140,50,notch(384,144,128,64,'top')+t(150,190,'24厘米')+t(400,95,'9厘米')+t(150,-15,'8厘米')+t(270,42,'4厘米')))
define('full-p10-s5-q2',group(150,50,rectangle(0,0,360,180)+line(0,0,360,0,'#8c775c',9)+line(0,0,0,180,'#8c775c',9)+t(100,215,'16米')+t(25,265,'棕色两边为墙；两条蓝边共用篱笆24米',17)))
define('full-p11-qextra',group(180,40,t(125,0,'□ □',28)+line(75,20,255,20)+line(75,20,75,75)+t(0,65,'□2',28)+t(100,65,'□ 0 □',28)+t(100,110,'4 □',28)+line(95,125,255,125)+t(100,165,'1 8 0',28)+t(100,210,'□ □ 8',28)+line(95,225,255,225)+t(170,260,'1 2',28)))
define('full-p13-s3-q1',alternatives([
 t(0,25,'20＋20＋20',18)+t(0,70,'另余5根小棒',18),
 ''.join(rectangle(i*43,0,38,85) for i in range(3))+t(4,45,'20',16)+t(47,45,'20',16)+t(90,45,'20',16)+t(0,120,'另余5个圆点',18),
 line(0,90,150,90)+''.join(line(i*23,85,i*23,95) for i in range(7))+t(0,125,'0 10 20 30…',15)+t(0,35,'每大步跳10',18)]),
 '下面三种分组表示中，哪一种不能表示65÷20＝3……5？')
define('full-p14-s2-q5',group(100,120,line(0,0,500,0)+''.join(line(i*100,-8,i*100,8)+t(i*100-10,38,str(i*5)) for i in range(6))+f'<circle cx="240" cy="0" r="5" fill="{BLUE}"/>'+t(230,-20,'P')))
define('full-p17-s1-q8',FIGURES['full-p14-s2-q5'])
A=[[(1,2),(2,1),(3,1),(2,2)],[(1,2),(5,2),(5,3),(1,3)],[(3,1.5),(5,1.5),(5,2),(3,2)]]
B=[(0,0),(3,0),(3,1),(2,1),(2,2),(3,2),(3,3),(2,3),(2,4),(0,2),(1,1)]
C=[(0,0),(2,0),(3,1),(3,2),(2,3),(0,3)]
define('full-p15-s1-q5',group(210,30,grid(4,4,58,[(x,y) for x in range(2) for y in range(3)]))+t(245,300,'大正方形边长24厘米',18))
define('full-p15-s1-q6',group(130,60,rectangle(0,0,180,120)+rectangle(180,0,90,120,GREEN)+line(180,0,180,120,BLUE,3,True)+t(20,155,'直立部分长10厘米',17)+t(285,65,'底座正方形',18)+t(285,100,'面积25平方厘米',18)))
define('full-p15-s2-q2',alternatives([
 rectangle(0,0,140,100)+poly([(80,0),(140,0),(140,100)],GREEN),
 rectangle(0,0,140,100)+rectangle(0,0,35,100,GREEN)+rectangle(105,0,35,100,GREEN),
 rectangle(0,0,140,100)+poly([(0,0),(0,100),(95,100)],GREEN),
 rectangle(0,0,140,100)+poly([(0,0),(70,0),(70,50),(140,50),(140,100),(0,100)],GREEN)
 ]),'四幅图外框均为相同的长方形。蓝色为活动区，绿色为绿植区（绿色分开时，周长相加）。哪幅图两区的周长、面积都相等？')
# D: congruent halves related by a half-turn, with a central step boundary.
FIGURES['full-p15-s2-q2']=alternatives([
 rectangle(0,0,140,100)+poly([(80,0),(140,0),(140,100)],GREEN),
 rectangle(0,0,140,100)+rectangle(0,0,35,100,GREEN)+rectangle(105,0,35,100,GREEN),
 rectangle(0,0,140,100)+poly([(0,0),(0,100),(95,100)],GREEN),
 rectangle(0,0,140,100)+poly([(0,0),(50,0),(50,50),(90,50),(90,100),(0,100)],GREEN)])
define('full-p15-s2-q3',alternatives([grid(4,4,28,[(0,0)]),grid(5,3,28,[(0,0)]),grid(5,4,28,[(0,0)]),grid(4,5,28,[(0,0)])]),
 '每格1平方分米，下面哪个长方形的面积能用“每行5格，共4行”即5×4计算？')
define('full-p15-s2-q5',alternatives([
 rectangle(0,0,180,120)+rectangle(0,60,180,120,GREEN)+rectangle(0,60,180,60,GOLD)+t(20,220,'重叠6×2',18),
 rectangle(0,0,180,120)+rectangle(0,0,120,180,GREEN)+rectangle(0,0,120,120,GOLD)+t(20,220,'重叠4×4',18)
 ],['①','②']))
define('full-p15-s2-q6',group(140,50,line(0,220,400,220)+line(400,220,400,0)+f'<path d="M0 220V180H90V125H190V70H300V0H400" stroke="{BLUE}" stroke-width="3" fill="none"/>'+t(-10,255,'起点')+t(410,0,'糖')+t(30,300,'第一条：阶梯线；第二条：下边与右边',18)))
define('full-p15-s2-q7',alternatives([notch(144,108,36,36,'top'),notch(144,108,54,54),notch(144,108,72,72)],['①','②','③']))
define('full-p15-s3-q3',group(180,45,notch(320,240,80,80)+t(125,280,'8厘米')+t(-80,140,'6厘米')+t(240,-15,'2厘米')+t(330,50,'2厘米')))
define('full-p16-s1-q7',group(150,40,grid(9,5,40,[(x,y) for x in range(9) for y in range(5) if x in [0,8] or y in [0,4]]))+t(180,285,'边框每格边长1厘米',18))
define('full-p16-s1-q9',alternatives([notch(140,140,84,56),notch(140,140,84,56,'top'),notch(140,140,56,84,'top')],['剪角6×4','凹口宽6深4','凹口宽4深6']))
define('full-p16-s2-q4',alternatives([poly([(0,100),(60,0),(120,100)]),poly([(0,100),(120,20),(60,70)]),poly([(0,100),(20,0),(120,100)]),poly([(0,100),(120,100),(60,65)])]),
 '三角形三边展开后，两条短边一样长，第三条较长。下面哪种三角形符合条件？')
define('full-p16-s3-q4',group(190,25,grid(8,8,30)+poly([(0,210),(0,60),(30,0),(60,60),(90,0),(120,60),(150,0),(180,60),(180,210)]))+t(200,300,'每个方格1平方厘米',18))
define('full-p18-q6',group(55,55,rectangle(0,0,160,180)+f'<path d="M80 0L100 30L75 60L100 90L75 120L100 150L80 180" stroke="{BLUE}" fill="none" stroke-width="3"/>'+t(35,230,'图1')+t(200,100,'→',30)+group(275,0,poly([(0,0),(240,0),(260,30),(235,60),(260,90),(235,120),(260,150),(240,180),(0,180),(20,150),(-5,120),(20,90),(-5,60),(20,30)])+line(120,0,120,180)+t(100,230,'图2'))))
define('full-p18-q10',group(210,45,grid(4,3,55,[(3,0),(2,1),(0,2),(1,2)])))
define('full-p18-q22-1',group(210,45,notch(280,210,140,70,'left')+t(100,250,'4厘米')+t(-85,35,'1厘米')+t(15,125,'2厘米')+t(-85,110,'1厘米')+t(-85,190,'1厘米')))
define('full-p18-q22-2',group(170,45,notch(330,275,165,165)+t(125,310,'6厘米')+t(-80,140,'5厘米')+t(190,145,'3厘米')+t(345,230,'2厘米')))

# Same mathematical exercise appearing in another source keeps its identity and shared artwork.
FIGURES['full-p01-s1-q5']=alternatives([
 grid(5,4,24)+poly([(0,48),(48,0),(48,48),(96,48),(96,72),(0,72)]),
 grid(5,4,24)+poly([(0,48),(48,0),(96,0),(96,96),(48,96)]),
 grid(5,4,24)+poly([(0,0),(120,0),(120,72),(0,72)]),
 grid(5,4,24)+poly([(0,0),(96,48),(96,96),(0,96)])
 ],['①','②','③','④'])+t(220,325,'每个方格边长1米',18)
STEMS['full-p01-s1-q5']='下面四个花圃画在边长1米的方格上。面积最大、最小的分别是哪一个？哪两个面积相等？填序号，相等的两个序号用顿号分开。'
FIGURES['full-p15-s1-q2']=''.join(group(20+i*230,25,body)+t(55+i*230,200,label) for i,(body,label) in enumerate([
 (grid(6,5,24)+''.join(poly([(x*24,y*24) for x,y in points]) for points in A),'A'),
 (grid(6,5,24)+group(24,24,poly([(x*24,y*24) for x,y in B])),'B'),
 (grid(6,5,24)+group(24,24,poly([(x*24,y*24) for x,y in C])),'C')
 ]))+t(205,240,'每个方格1平方厘米',18)
ALIASES={'full-p09-qextra-1':'full-p04-s5-q7-1','full-p09-qextra-2':'full-p04-s5-q7-2','full-p10-s4-q1':'full-p05-s4-q1'}
for target,source in ALIASES.items():
 FIGURES[target]=FIGURES[source]
 if source in STEMS:STEMS[target]=STEMS[source]
 if source in REASONS:REASONS[target]=REASONS[source]

def write_figure(name,body):
 path=ROOT/f'apps/web/public/figures/{name}.svg'
 path.parent.mkdir(parents=True,exist_ok=True)
 height=260 if name=='full-p15-s1-q2' else 340
 path.write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 {height}" role="img"><rect width="720" height="{height}" fill="white"/>{body}</svg>',encoding='utf-8')
 return f'/figures/{name}.svg'

def clean(s):
 for a,b in [('原题方格','方格'),('原图中','图中'),('原图','图中'),('原竖式','竖式'),('原展开线段','展开线段'),('原数轴','数轴'),('原题','题目'),('原卷','题目'),('这张题目','本题'),('图示三人自行车','有3个座位的自行车'),('图中自行车有3个座位','自行车有3个座位')]:
  s=s.replace(a,b)
 return s

def organize_bank():
 for q in OUT:
  qid=q['id'];had_image='promptImage' in q
  q.pop('promptImage',None)
  if qid in STEMS:q['stem']=STEMS[qid]
  if qid in REASONS:
   q['explanation']['steps']=REASONS[qid]
   q['explanation']['analysis']=REASONS[qid][0]
   q['hint']=REASONS[qid][0];q['knowledge']=REASONS[qid][0]
   q['explanation']['answer']='；'.join(REASONS[qid][-2:])
  # Conditions carried solely by source photographs are made explicit in text.
  if qid=='full-p05-s1-q3':q['stem']='用同样的扑克牌测玻璃板，沿长边可排7张、沿宽边可排6张。共需几张？每张50平方厘米，玻璃板面积是多少平方分米？'
  if qid=='full-p02-s1-q5':q['stem']='用圆规量取长方形的长，将开口对准直尺时，两端分别在2厘米和8厘米刻度。长方形周长16厘米，宽是多少厘米？'
  if qid=='full-p16-s4-q3-1':q['stem']='1万平方米树林平均每小时大约吸收多少千克二氧化碳？此题缺少吸收总量与时间，暂不计分。'
  if qid=='full-p05-s5-q1':q['stem']='一块长方形玻璃破损了，保留下来的完整长边为8分米、宽边为6分米。更换同样大的新玻璃，四周密封条至少多少分米？新玻璃面积至少多少平方分米？'
  if qid=='full-p06-s3-q6':q['stem']='一道除法竖式，初商6时余52，改商7时余17。被除数是多少？'
  if qid=='full-p13-s3-q1':
   q['explanation']['steps']=['A按20根一组分成3组，另余5根，表示65÷20＝3……5。','B每框20点，3框另余5点，也符合。','C每大步10，分组单位不是20，因此不能表示该算式。']
  if qid=='full-p17-s3-q8':
   q['stem']='比较四组算式的大小，说明理由：①267÷45与267÷48；②720÷6÷6与720÷36；③600÷50与60÷5；④120＋30×5与(120＋30)×5。'
   q['explanation']['steps']=['①被除数相同，除数45较小，商较大，填＞。','②连续除以6两次等于除以6×6＝36，填＝。','③被除数、除数同时除以10，商不变，两式都得12，填＝。','④左式270，右式750，填＜。']
   q['explanation']['answer']='依次填：＞、＝、＝、＜。'
   q['hint']='先看除数、被除数是否相同，再判断是否能用商不变规律。'
   q['explanation']['analysis']=q['hint']
  if qid=='full-p02-s2-q2-2':
   q['stem']='图中L形的上边与右边均为10分米，左上竖边3分米，内侧竖边7分米；缺口的宽没有给出。求周长，并说明面积能否确定。'
  q['stem']=clean(q['stem'])
  q['hint']=clean(q['hint']);q['knowledge']=clean(q['knowledge'])
  for field in ['analysis','answer','pitfall']:q['explanation'][field]=clean(q['explanation'].get(field,''))
  q['explanation']['steps']=[clean(s) for s in q['explanation']['steps']]
  if q['type']=='calculation':q['title']=q['stem'].replace('列竖式计算并验算：','竖式：').replace('计算：','').rstrip('。')
  elif qid=='full-p15-s1-q2':q['title']='整格与半格的面积'
  elif qid=='full-p01-s1-q5':q['title']='方格中的面积比较'
  else:
   first=re.split('[。？；]',q['stem'])[0]
   q['title']=first if len(first)<=26 else first[:24]+'…'
  if had_image or qid in STEMS:q['sourceKind']='adapted'
  body=FIGURES.get(qid)
  if body:
   q['promptImage']={'src':write_figure(qid,body),'alt':q['title']+'示意图'}
  vis=q['explanation'].get('visual')
  if qid=='full-p15-s1-q2':
   stage_bodies=[
    group(115,35,grid(6,5,43)+''.join(poly([(x*43,y*43) for x,y in points],fill) for points,fill in zip(A,[GREEN,FILL,GOLD])))+t(420,105,'下部4格',22)+t(420,155,'斜块合计1格',22)+t(420,205,'半高条合计1格',22)+t(140,310,'A：4＋1＋1＝6平方厘米',23),
    group(150,30,grid(3,4,58)+poly([(x*58,y*58) for x,y in B]))+''.join(t(365,67+i*58,label,21) for i,label in enumerate(['2.5格','1.5格','2.5格','0.5格']))+t(120,310,'B：2.5＋1.5＋2.5＋0.5＝7平方厘米',21),
    group(170,40,grid(3,3,65)+poly([(x*65,y*65) for x,y in C])+poly([(130,0),(195,0),(195,65)],GOLD)+poly([(130,195),(195,195),(195,130)],GOLD))+t(400,115,'补成3×3：9格',21)+t(400,170,'减去两个半格：1格',21)+t(155,305,'C：9−1＝8平方厘米',23)
   ]
   vis['stages']=[{'kind':'image','image':write_figure(qid+f'-area{i+1}',body),'headings':[],'rows':[]} for i,body in enumerate(stage_bodies)]
  if vis and vis.get('kind')=='reasoning':
   stages=vis.get('stages',[])
   # A clean redraw plus one calculation per step replaces every scan-backed stage.
   scan_backed=any(s.get('kind')=='image' and '<image' in (ROOT/'apps/web/public'/s['image'].lstrip('/')).read_text(encoding='utf-8') for s in stages)
   if scan_backed or (had_image and all(s.get('kind')=='flow' for s in stages)) or qid in REASONS or qid=='full-p17-s3-q8':
    stages=[]
    for i,step in enumerate(q['explanation']['steps']):
     equation=re.findall(r'\d+(?:[×÷＋+−＝=]\d+)+',step)
     note='；'.join(equation[:2])
     if not note:note=f'第{i+1}步：'+step[:25]
     drawing=group(0,0,body,.82) if body else ''
     drawing+=rectangle(25,282,670,48,'#f1f5ff','#d7e1f3')+t(45,313,note,19)
     path=write_figure(qid+f'-step{i+1}',drawing)
     stages.append({'kind':'image','image':path,'headings':[],'rows':[]})
    vis['stages']=stages;vis['captions']=q['explanation']['steps']
   vis['title']=q['title']
   # All runtime SVGs share one public directory; source scans are never deployed.
   for stage in vis.get('stages',[]):
    if stage.get('kind')=='image' and stage['image'].startswith('/papers/'):
     old_path=ROOT/'apps/web/public'/stage['image'].lstrip('/')
     target=ROOT/'apps/web/public/figures'/old_path.name
     target.parent.mkdir(parents=True,exist_ok=True)
     target.write_text(old_path.read_text(encoding='utf-8'),encoding='utf-8')
     stage['image']='/figures/'+target.name
  # Prompt artwork never contains solution data; complete explanations stay private.
  if body and not vis:
   q['hasVisual']=True
   q['explanation']['visual']={'kind':'reasoning','title':q['title'],'labels':[],'values':[],'captions':q['explanation']['steps'],'stages':[flow(s) for s in q['explanation']['steps']]}
