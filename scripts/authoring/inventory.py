"""Source inventory transcribed independently from the visible headings and item numbers."""
import json
from common import ROOT, OUT, PAPERS
R=lambda prefix,n:[f'{prefix}{i}' for i in range(1,n+1)]
S=lambda prefix,n:[f'{prefix}（{i}）' for i in range(1,n+1)]
EXPECTED={
1:R('一',3)+S('一4',3)+R('一',8)[4:]+R('二',5)+S('三1',3)+S('三2',3)+['四1']+S('四2',2)+R('五',3)+S('五4',2),
2:R('一',10)+S('二1',16)+S('二2',2)+R('三',13)+['四1']+S('四2',2)+['五1','五2']+S('五3',2)+S('五4',2)+['五5'],
4:S('一1',10)+S('一2',4)+S('一3',4)+R('二',10)+R('三',5)+S('四',2)+R('五',6)+S('五7',2),
5:S('一1',3)+R('一',10)[1:]+R('二',5)+R('三',3)+R('四',2)+R('五',3)+S('五4',2)+['附加'],
6:S('一1',12)+S('一2',4)+S('一3',3)+R('二',12)+R('三',7)+['四1']+S('四2',2)+R('四',6)[2:],
7:R('',20),8:R('',12),
9:R('一',10)+R('二',5)+S('三1',8)+S('三2',4)+S('三3',4)+S('四',2)+R('五',5)+S('附加',2),
10:R('一',10)+R('二',7)+R('三',2)+R('四',2)+R('五',5)+S('五6',2),
11:R('一',9)+R('二',5)+R('三',5)+S('四1',8)+S('四2',6)+['四3']+S('四4',2)+['五1','五2']+S('五3',2)+['五4','五5','附加'],
13:S('一1',10)+S('一2',3)+S('一3',3)+R('二',13)+R('三',6)+['四1']+S('四2',2)+['五1','五2','五3']+S('五4',2)+['五5'],
14:R('一',8)+R('二',10)+S('三1',8)+S('三2',6)+S('三3',2)+R('四',5),
15:R('一',6)+R('二',8)+R('三',3)+S('四',2)+R('五',5),
16:R('一',3)+S('一4',2)+R('一',9)[4:]+R('二',6)+S('三1',8)+S('三2',4)+S('三3',2)+['三4','四1','四2']+S('四3',2)+['四4'],
17:R('一',10)+S('二1',12)+S('二2',4)+S('二3',2)+R('三',12)+R('四',5),
18:R('',20)+S('21',3)+S('22',2)+S('23',2)+R('',28)[23:]+S('29',2)+S('30',2)+['31','32'],
}
def audit():
 rows=[]
 for paper in PAPERS:
  p=int(paper['id'][1:]); primary=int(paper.get('duplicateOf',paper['id'])[1:])
  actual=[q for q in OUT if any(s['paperId']==paper['id'] for s in q['sources'])]
  refs=[next(s for s in q['sources'] if s['paperId']==paper['id'])['number'] for q in actual]
  assert len(refs)==len(set(refs)),(p,'duplicate source number')
  assert set(refs)==set(EXPECTED[primary]),(p, sorted(set(EXPECTED[primary])-set(refs)),sorted(set(refs)-set(EXPECTED[primary])))
  rows.append({'paperId':paper['id'],'expectedNumbers':EXPECTED[primary],'unavailableNumbers':[s['number'] for q in actual if q.get('sourceIssue') for s in q['sources'] if s['paperId']==paper['id']]})
 (ROOT/'content/practice/coverage.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
