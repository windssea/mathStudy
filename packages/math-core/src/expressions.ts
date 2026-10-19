export type ArithmeticOperator = '+' | '-' | '*' | '/';
export type ExpressionNode =
  | { kind: 'number'; id: string; value: number }
  | { kind: 'group'; id: string; bracket: 'round' | 'square'; child: ExpressionNode }
  | {
      kind: 'binary';
      id: string;
      op: ArithmeticOperator;
      left: ExpressionNode;
      right: ExpressionNode;
    };
export type OperationNode = Extract<ExpressionNode, { kind: 'binary' }>;
export const operatorLabels: Record<ArithmeticOperator, string> = {
  '+': '+',
  '-': '−',
  '*': '×',
  '/': '÷',
};
export function parseExpression(source: string): ExpressionNode {
  const normalized = source
    .normalize('NFKC')
    .replace(/[−—]/g, '-')
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/\s/g, '');
  if (!normalized || normalized.length > 240) throw new Error('算式长度不正确。');
  const tokens = normalized.match(/\d+|[+\-*/()[\]]/g) ?? [];
  if (tokens.join('') !== normalized || tokens.length > 80)
    throw new Error('算式含有不支持的字符。');
  let position = 0;
  function atom(depth: number): ExpressionNode {
    if (depth > 8) throw new Error('括号层级过多。');
    const index = position,
      token = tokens[position++];
    if (token === '(' || token === '[') {
      const child = sum(depth + 1);
      if (tokens[position++] !== (token === '(' ? ')' : ']')) throw new Error('括号不匹配。');
      return { kind: 'group', id: `g${index}`, bracket: token === '(' ? 'round' : 'square', child };
    }
    if (!token || !/^\d+$/.test(token)) throw new Error('缺少整数或括号。');
    const value = Number(token);
    if (!Number.isSafeInteger(value) || value > 1000000) throw new Error('数值超出课堂演示范围。');
    return { kind: 'number', id: `n${index}`, value };
  }
  function product(depth: number): ExpressionNode {
    let node = atom(depth);
    while (tokens[position] === '*' || tokens[position] === '/') {
      const index = position,
        op = tokens[position++] as ArithmeticOperator;
      node = { kind: 'binary', id: `o${index}`, op, left: node, right: atom(depth) };
    }
    return node;
  }
  function sum(depth: number): ExpressionNode {
    let node = product(depth);
    while (tokens[position] === '+' || tokens[position] === '-') {
      const index = position,
        op = tokens[position++] as ArithmeticOperator;
      node = { kind: 'binary', id: `o${index}`, op, left: node, right: product(depth) };
    }
    return node;
  }
  const root = sum(0);
  if (position !== tokens.length) throw new Error('算式格式不正确。');
  return collapseGroups(root);
}
export function literalValue(node: ExpressionNode): number | undefined {
  return node.kind === 'number'
    ? node.value
    : node.kind === 'group'
      ? literalValue(node.child)
      : undefined;
}
function collapseGroups(node: ExpressionNode): ExpressionNode {
  if (node.kind === 'number') return node;
  if (node.kind === 'group') {
    const child = collapseGroups(node.child),
      value = literalValue(child);
    return value === undefined ? { ...node, child } : { kind: 'number', id: node.id, value };
  }
  return { ...node, left: collapseGroups(node.left), right: collapseGroups(node.right) };
}
export function expressionOperations(root: ExpressionNode) {
  const operations: { node: OperationNode; depth: number; scope: string }[] = [];
  function walk(node: ExpressionNode, depth: number, scope: string) {
    if (node.kind === 'group')
      walk(node.child, depth + 1, node.bracket === 'round' ? '小括号内' : '中括号内');
    else if (node.kind === 'binary') {
      walk(node.left, depth, scope);
      operations.push({ node, depth, scope });
      walk(node.right, depth, scope);
    }
  }
  walk(root, 0, '括号外');
  return operations;
}
export function readyOperations(root: ExpressionNode) {
  const all = expressionOperations(root);
  const depth = Math.max(...all.map((item) => item.depth));
  const ready = all.filter(
    (item) =>
      item.depth === depth &&
      literalValue(item.node.left) !== undefined &&
      literalValue(item.node.right) !== undefined,
  );
  const priority = Math.max(
    ...ready.map((item) => (item.node.op === '*' || item.node.op === '/' ? 2 : 1)),
  );
  return ready.filter(
    (item) => (item.node.op === '*' || item.node.op === '/' ? 2 : 1) === priority,
  );
}
export function expressionText(node: ExpressionNode): string {
  if (node.kind === 'number') return String(node.value);
  if (node.kind === 'group')
    return `${node.bracket === 'round' ? '(' : '['}${expressionText(node.child)}${node.bracket === 'round' ? ')' : ']'}`;
  return `${expressionText(node.left)} ${operatorLabels[node.op]} ${expressionText(node.right)}`;
}
export function expressionTokens(
  root: ExpressionNode,
): { id: string; text: string; kind: 'number' | 'operator' | 'bracket'; depth: number }[] {
  function tokens(node: ExpressionNode, depth: number): ReturnType<typeof expressionTokens> {
    if (node.kind === 'number')
      return [{ id: node.id, text: String(node.value), kind: 'number', depth }];
    if (node.kind === 'group')
      return [
        {
          id: node.id + '-open',
          text: node.bracket === 'round' ? '(' : '[',
          kind: 'bracket',
          depth: depth + 1,
        },
        ...tokens(node.child, depth + 1),
        {
          id: node.id + '-close',
          text: node.bracket === 'round' ? ')' : ']',
          kind: 'bracket',
          depth: depth + 1,
        },
      ];
    return [
      ...tokens(node.left, depth),
      { id: node.id, text: operatorLabels[node.op], kind: 'operator', depth },
      ...tokens(node.right, depth),
    ];
  }
  return tokens(root, 0);
}
export function operationRule(root: ExpressionNode, id: string): string {
  const selected = expressionOperations(root).find((item) => item.node.id === id);
  if (!selected) return '这个运算已经完成。';
  const ready = readyOperations(root),
    next = ready[0];
  if (!ready.some((item) => item.node.id === id)) {
    if (!next) return '这个算式已经计算完成。';
    if (next.depth > selected.depth)
      return `先算${next.scope}的 ${expressionText(next.node)}；括号里的结果算出后，才能参与外面的运算。`;
    if (
      literalValue(selected.node.left) === undefined ||
      literalValue(selected.node.right) === undefined
    )
      return `这一步的数还没有都算出来。先算 ${expressionText(next.node)}；同一级的乘除或加减要从左往右，乘除也要先于加减。`;
    return `先算 ${expressionText(next.node)}。${selected.depth ? '括号里面也要' : '没有括号时要'}先乘除、后加减，不能只按算式的位置选择。`;
  }
  const hasOther = ready.length > 1;
  return `${selected.depth ? `先处理${selected.scope}；` : ''}${selected.node.op === '*' || selected.node.op === '/' ? '乘除同级，从左往右；先完成乘除，再做加减。' : '加减同级，从左往右。'}${hasOther ? '这里有互不依赖的乘除分支，可以先算其中任一支。' : ''}`;
}
export function reduceOperation(root: ExpressionNode, id: string) {
  const selected = readyOperations(root).find((item) => item.node.id === id);
  if (!selected) throw new Error(operationRule(root, id));
  const left = literalValue(selected.node.left)!,
    right = literalValue(selected.node.right)!;
  if (selected.node.op === '/' && (right === 0 || left % right !== 0))
    throw new RangeError('本演示只使用除数非零、能整除的整数算式。');
  const value =
    selected.node.op === '+'
      ? left + right
      : selected.node.op === '-'
        ? left - right
        : selected.node.op === '*'
          ? left * right
          : left / right;
  if (!Number.isSafeInteger(value) || value < 0) throw new RangeError('结果须为非负安全整数。');
  function replace(node: ExpressionNode): ExpressionNode {
    if (node.id === id) return { kind: 'number', id: node.id, value };
    if (node.kind === 'group') return { ...node, child: replace(node.child) };
    if (node.kind === 'binary')
      return { ...node, left: replace(node.left), right: replace(node.right) };
    return node;
  }
  return {
    root: collapseGroups(replace(root)),
    operation: `${expressionText(selected.node)} = ${value}`,
    reason: operationRule(root, id),
    scope: selected.scope,
    id,
  };
}
