"""Audit additions and expose one derivation at a time without source bitmaps."""
from common import *

def enhance():
 for q in OUT:
  source=q['sources'][0]
  # Written reasoning is an application, rather than pretending every self-check is a drawing.
  if q.get('responseMode')=='selfReview' and not any(word in q['stem'] for word in ['画','方格','展开','连线','竖式','表格','表，']):q['type']='application'
  if q['promptImage'] if 'promptImage' in q else False:
   if not q['hasVisual']:
    stages=[flow(step) for step in q['explanation']['steps']]
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
