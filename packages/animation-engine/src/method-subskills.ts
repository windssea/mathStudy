import {
  text,
  rect,
  line,
  frame,
  bars,
  division,
  grouping,
  regroupRemainder,
  story,
  type MethodNode,
  type MethodStory,
} from './method-primitives';

const sameQuantity = story(
  '24 个圆点，每 24 个分成一份，能分成几份？',
  [
    frame(
      '总数和每份量一样大',
      '这里总共 24 个，每一份也要 24 个。先把这两个量对应起来。',
      '总数 24；每份 24',
      [
        text(200, 27, '每一个圆点表示 1 个', 'known', 21),
        ...Array.from(
          { length: 24 },
          (_, i): MethodNode => ({
            kind: 'dot',
            x: 54 + (i % 6) * 57,
            y: 58 + Math.floor(i / 6) * 39,
            tone: 'known',
          }),
        ),
      ],
    ),
    frame(
      '把全部圆点圈成一份',
      '24 个正好圈满一份，外面没有剩下的圆点。这里每份量大于 0，分组才有意义。',
      '1 份 × 每份 24 = 总数 24',
      [
        rect(28, 36, 340, 157, 'focus'),
        ...Array.from(
          { length: 24 },
          (_, i): MethodNode => ({
            kind: 'dot',
            x: 54 + (i % 6) * 57,
            y: 58 + Math.floor(i / 6) * 39,
            tone: 'focus',
          }),
        ),
        text(200, 233, '正好 1 份，没有余下', 'focus', 22),
      ],
    ),
    frame(
      '商数的是份数，不是圆点个数',
      '商表示“这样的完整份有几份”。总数和每份量相同且不为 0，就正好只有一份。',
      '24 ÷ 24 = 1，余数 0',
      grouping(1, 24, 0, true),
    ),
  ],
  '36 个，每 36 个一份，商表示什么？',
  '36 个圆点，所以商是 36',
  '能分成 1 份，所以商是 1',
  '商数完整的份数。36 个圆点只够组成一份每份 36 个的整体，不能把圆点个数直接当份数。',
  grouping(1, 36, 0),
);

sameQuantity.transfer = {
  question: '换一组数：45 个，每份 45 个，分成几份？',
  wrong: '45 份',
  right: '1 份',
  why: '全部 45 个放进同一份，正好用完。总量和每份量同样大，完整份数仍是 1。',
  nodes: grouping(1, 45, 0),
};

const largestRemainder = story(
  '除数是 14，商是 7，余数最大时，原来有多少个？',
  [
    frame(
      '剩下 14 个，就还能再分一份',
      '每份要 14 个，剩下的 14 个可以直接圈成一份。商就要增加，不能把它当最后的余数。',
      '余数必须小于 14',
      regroupRemainder(14, 14, true),
    ),
    frame(
      '少 1 个，就刚好不够一份',
      '14 减 1 得 13。剩下 13 个不能凑够每份的 14 个，所以最大余数是 13。',
      '最大余数 = 14 − 1 = 13',
      grouping(7, 14, 13),
    ),
    frame(
      '把整份和最大余数合起来',
      '7 份共 98 个，再把剩下的 13 个接回去，得到原来的总量。商固定不变时，余数越大，总量越大。',
      '14 × 7 + 13 = 111',
      bars(
        [
          { label: '7 份，共 98', weight: 98 },
          { label: '剩 13', weight: 13, tone: 'warm' },
        ],
        '最多共 111 个',
      ),
    ),
  ],
  '除数是 14，余数能取 14 吗？',
  '能，和除数一样大',
  '不能，最多是 13',
  '余下 14 个会再组成一份，商必须增加。余数是整数且不足一份，因此最大是 13。',
  regroupRemainder(14, 14, true),
);

largestRemainder.transfer = {
  question: '换一组数：除数 16，商 4，余数最大时总数是多少？',
  wrong: '64：只算 16 × 4',
  right: '79：16 × 4 + 15',
  why: '余数最大是 15。四个完整份共 64，加上这 15 个，原来的总数是 79。',
  nodes: grouping(4, 16, 15),
};

const verifyDivision = story(
  '有人写 229 ÷ 17 = 13……7，怎样验算这个结果？',
  [
    frame(
      '先把商对应的完整份合起来',
      '13 份，每份 17 个，共 221 个。乘回去只能得到完整份，还不能代表全部总数。',
      '17 × 13 = 221',
      grouping(13, 17, 7),
    ),
    frame(
      '加上写出的余数，比较原数',
      '221 加 7 是 228，比原来的 229 少 1。虽然 7 小于除数，合回去的总数却不对，所以这个结果仍然错了。',
      '17 × 13 + 7 = 228 ≠ 229',
      bars(
        [
          { label: '完整份 221', weight: 221 },
          { label: '错写余 7', weight: 7, tone: 'error' },
          { label: '还少 1', weight: 1, tone: 'warm' },
        ],
        '原来 229 个',
      ),
    ),
    frame(
      '同时检查总数和余数范围',
      '229 减 221 剩 8。合起来等于原数，而且 8 小于 17，这两项都通过才算验算成功。',
      '17 × 13 + 8 = 229；8 < 17',
      grouping(13, 17, 8),
    ),
  ],
  '验算有余数除法，乘回去以后还要做什么？',
  '只要乘积不超过原数就可以',
  '加余数核对原数，再检查余数小于除数',
  '乘积只对应完整的份，余数也属于原总量。合计要等于原数，而且余数必须不足一份，两个条件缺一不可。',
);

verifyDivision.transfer = {
  question: '换一组数：145 ÷ 12 = 12……1，哪种核对完整？',
  wrong: '12 × 12 = 144，就算通过',
  right: '12 × 12 + 1 = 145，且 1 < 12',
  why: '把完整份与余下的合起来等于 145，再确认 1 不足每份 12，这才完整检查了分组结果。',
  nodes: grouping(12, 12, 1),
};

const findDivisor = story(
  '185 个分成 7 份后剩 10 个，每份有多少个？',
  [
    frame(
      '把剩下的和完整份分开',
      '原来的 185 个包含完整的 7 份和剩下的 10 个。余数没有放进完整份里。',
      '185 = 7 个完整份 + 10',
      bars(
        [
          { label: '7 份，尚不知道每份', weight: 175 },
          { label: '剩 10', weight: 10, tone: 'warm' },
        ],
        '原来 185 个',
      ),
    ),
    frame(
      '先取走没有分进整份的部分',
      '减去剩下的 10 个，175 个才是平均装进 7 份里的总量。',
      '185 − 10 = 175',
      bars([{ label: '7 份共有 175', weight: 175, tone: 'focus' }], '只看完整的 7 份'),
    ),
    frame(
      '用整份总量平均分，再验算',
      '175 平均分成 7 份，每份 25 个；10 比每份 25 少，结果符合余数的要求。',
      '(185 − 10) ÷ 7 = 25；25 × 7 + 10 = 185',
      grouping(7, 25, 10),
    ),
  ],
  '185个分成7个完整份后剩10个，求每份量能直接用185÷7吗？',
  '能，余数不用管',
  '不能，先减去剩下的 10',
  '185 中有 10 个不属于这 7 个完整份。先拿走余数，再把完整份的总量平均分。',
);

sameQuantity.mistake.wrongNodes = [
  text(200, 25, '错把每个圆点都当成一份', 'error', 20),
  ...Array.from({ length: 36 }, (_, i): MethodNode[] => [
    rect(32 + (i % 6) * 57, 44 + Math.floor(i / 6) * 27, 32, 22, 'error'),
    { kind: 'dot', x: 48 + (i % 6) * 57, y: 55 + Math.floor(i / 6) * 27, tone: 'error' },
  ]).flat(),
  text(200, 232, '每份应有36个，不是1个', 'error', 20),
];
sameQuantity.transfer!.wrongNodes = [
  text(200, 25, '错把45个圆点各圈成一份', 'error', 20),
  ...Array.from({ length: 45 }, (_, i): MethodNode[] => [
    rect(20 + (i % 9) * 41, 48 + Math.floor(i / 9) * 30, 32, 24, 'error'),
    { kind: 'dot', x: 36 + (i % 9) * 41, y: 60 + Math.floor(i / 9) * 30, tone: 'error' },
  ]).flat(),
  text(200, 232, '每份应有45个，不是1个', 'error', 20),
];
largestRemainder.mistake.nodes = grouping(7, 14, 13);
largestRemainder.mistake.wrongNodes = grouping(7, 14, 14).map(
  (node): MethodNode =>
    node.kind === 'dot'
      ? { ...node, tone: 'error' }
      : node.kind === 'text' && node.y === 177
        ? { ...node, text: '错把14个当作余数', tone: 'error' }
        : node,
);
largestRemainder.transfer!.wrongNodes = [
  ...grouping(4, 16, 15),
  line(25, 188, 310, 214, 'error'),
  text(200, 160, '错法：只算整份，漏掉余数', 'error', 20),
];
verifyDivision.mistake.wrongNodes = bars(
  [
    { label: '只验乘积221', weight: 221 },
    { label: '漏验余数8', weight: 8, tone: 'error' },
  ],
  '错误：只看完整份，没合回原数',
);
verifyDivision.transfer!.wrongNodes = bars(
  [
    { label: '只验144', weight: 144 },
    { label: '漏验余1', weight: 1, tone: 'error' },
  ],
  '错误：144还不是原数145',
);
findDivisor.mistake.wrongNodes = bars(
  [
    { label: '整份175', weight: 175 },
    { label: '余10', weight: 10, tone: 'error' },
  ],
  '错误：把剩下10个也平均分',
);
findDivisor.transfer = {
  question: '换一组数：196个分成6个完整份，还剩16个，每份多少个？',
  wrong: '直接算196÷6',
  right: '先减16，再算180÷6=30',
  why: '剩下的16个没有装入完整份。180个平均放进6份，每份30个，16也确实小于30。',
  nodes: grouping(6, 30, 16),
  wrongNodes: bars(
    [
      { label: '完整份180', weight: 180 },
      { label: '余16', weight: 16, tone: 'error' },
    ],
    '错误：把余数当作完整份的一部分',
  ),
};

export const methodQuestionSubskills: Record<string, Record<string, string>> = {
  'u1-remainder': {
    'full-p11-s2-q2': 'same-quantity',
    'full-p06-s2-q7': 'largest-remainder',
    'full-p09-s1-q6': 'largest-remainder',
    'full-p11-s1-q7': 'largest-remainder',
    'full-p13-s2-q11': 'largest-remainder',
    'full-p14-s1-q6': 'largest-remainder',
    'full-p17-s3-q4': 'largest-remainder',
    'full-p11-s2-q3': 'verify-division',
    'full-p11-s2-q5': 'verify-division',
    'full-p18-q11': 'verify-division',
    'full-p06-s3-q3': 'verify-division',
    'full-p09-s2-q5': 'verify-division',
    'full-p13-s2-q7': 'verify-division',
    'full-p04-s3-q1': 'find-divisor',
    'full-p09-s2-q1': 'find-divisor',
  },
};

export const methodSubskillStories: Record<string, MethodStory> = {
  'same-quantity': sameQuantity,
  'largest-remainder': largestRemainder,
  'verify-division': verifyDivision,
  'find-divisor': findDivisor,
};
