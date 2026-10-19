import {
  parseExpression,
  readyOperations,
  reduceOperation,
  type ExpressionNode,
} from '@mathstudy/math-core';
export interface CalculationFrame {
  root: ExpressionNode;
  operation: string;
  reason: string;
  scope: string;
  id?: string;
}
export function calculationFrames(source: string | ExpressionNode): CalculationFrame[] {
  let root = typeof source === 'string' ? parseExpression(source) : source;
  const frames: CalculationFrame[] = [
    {
      root,
      operation: '先观察完整算式',
      reason: '先看括号，再看运算级别；同一级运算按从左往右的顺序。',
      scope: '完整算式',
    },
  ];
  for (let index = 0; readyOperations(root).length; index++) {
    if (index >= 32) throw new Error('运算步骤过多。');
    const result = reduceOperation(root, readyOperations(root)[0].node.id);
    root = result.root;
    frames.push(result);
  }
  return frames;
}
