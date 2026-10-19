export interface GeometryStep {
  title: string;
  text: string;
}
export function perimeterSteps(edges: number[], unit: string): GeometryStep[] {
  const total = edges.reduce((sum, edge) => sum + edge, 0);
  return [
    {
      title: '找到围成一周的每条边',
      text: '从一个顶点出发，沿着边线走一周，回到起点。注意每条边只量一次。',
    },
    {
      title: '逐边测量，记录边长',
      text: `点选下方的测量按钮，把 ${edges.length} 条边依次记下来。测量单位都用${unit}。`,
    },
    {
      title: '把边线依次展开',
      text: '展开时，每一条边的长度都不变。把各条边首尾相接放到一条直线上，没有遗漏，也不重复。',
    },
    {
      title: '一周边线的总长就是周长',
      text: `${edges.join(' + ')} = ${total}（${unit}）。这条展开线段的总长度，等于原图形的周长。`,
    },
  ];
}
export function areaSteps(columns: number, rows: number, unit: string): GeometryStep[] {
  return [
    {
      title: '选好统一的面积单位',
      text: `用边长 1 ${unit}的小正方形作为单位。每一格的面积是 1 平方${unit}。先观察图形。`,
    },
    {
      title: '沿着长铺一排',
      text: `一排可以放 ${columns} 个单位方格，对应长方形的长 ${columns} ${unit}。试着一格一格铺，或者铺完整一排。`,
    },
    {
      title: '沿着宽铺成多排',
      text: `每排 ${columns} 个，铺 ${rows} 排，就能没有空隙、没有重叠地铺满。总共有 ${columns} × ${rows} = ${columns * rows} 格。`,
    },
    {
      title: '从数格子走向面积公式',
      text: `每排个数 × 排数 = 方格总数，所以长方形的面积 = 长 × 宽。S = ${columns} × ${rows} = ${columns * rows}（平方${unit}）。`,
    },
  ];
}
