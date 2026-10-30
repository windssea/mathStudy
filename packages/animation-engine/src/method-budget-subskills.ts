import { unit34Stories } from './methods-u34';
import { frame, line, rect, text, type MethodNode, type MethodStory } from './method-primitives';

/** These associations are reviewed question by question, never guessed from student-facing copy. */
export const budgetQuestionSubskills: Record<string, string> = {
  'bank-u4-budget-01': 'budget-shopping-change',
  'bank-u4-budget-02': 'budget-remaining-wholes',
  'bank-u4-budget-03': 'budget-groups-and-shared-fee',
  'u4-05': 'budget-remaining-wholes',
  'bank-u4-budget-04': 'budget-two-materials',
  'bank-u4-budget-05': 'budget-feasible-fleet',
  'u4-08': 'budget-shopping-change',
  'u4-12': 'budget-two-materials',
};

function balance(total: number, spent: number): MethodNode[] {
  const cut = (spent / total) * 352;
  return [
    text(200, 28, `原款${total}元分成两段`, 'known', 21),
    rect(24, 76, cut - 2, 62, 'known', `已花${spent}`),
    rect(24 + cut, 76, 352 - cut, 62, 'focus', `余款${total - spent}`),
    line(24, 155, 24 + cut, 155, 'known'),
    line(24 + cut, 155, 376, 155, 'focus'),
    text(200, 222, '已花的钱不能再买东西', 'focus', 21),
  ];
}

function pricedObjects(count: number, price: number): MethodNode[] {
  const width = 352 / count;
  return [
    text(200, 29, `每件${price}元，一共${count}件`, 'known', 21),
    ...Array.from({ length: count }, (_, index) =>
      rect(24 + index * width, 81, width - 4, 58, 'known', String(price)),
    ),
    text(200, 221, `已花${price}×${count}＝${price * count}元`, 'focus', 22),
  ];
}

function wholePurchases(funds: number, price: number): MethodNode[] {
  const count = Math.floor(funds / price),
    remainder = funds % price,
    width = 352 / funds;
  return [
    text(200, 28, `只有余款${funds}元可以分`, 'known', 21),
    ...Array.from({ length: count }, (_, index) =>
      rect(24 + index * price * width, 80, price * width - 2, 60, 'focus', String(price)),
    ),
    ...(remainder ? [rect(24 + count * price * width, 80, remainder * width, 60, 'warm')] : []),
    text(200, 180, `每个完整框买1个，每个${price}元`, 'known', 20),
    text(200, 229, `${count}个用${count * price}元，还剩${remainder}元`, 'focus', 21),
  ];
}

/** Both bars use one scale; the red tail is the exact amount that cannot be paid. */
function exceedsAvailable(available: number, needed: number, heading: string): MethodNode[] {
  const width = 352 / needed,
    enoughWidth = available * width;
  return [
    text(200, 28, heading, 'error', 21),
    rect(24, 62, enoughWidth, 43, 'known', String(available)),
    rect(24, 137, enoughWidth, 43, 'known', String(available)),
    rect(24 + enoughWidth, 137, 352 - enoughWidth, 43, 'error'),
    text(200, 127, `需要${needed}，超出右边这一段`, 'error', 20),
    text(200, 232, `只有${available}，还差${needed - available}`, 'error', 22),
  ];
}

const remainingWholes: MethodStory = {
  prompt: '带360元，先买4件每件45元的用品。余款买每个25元的球，最多买几个？还剩多少元？',
  frames: [
    frame(
      '先把已经花掉的钱算清',
      '4件用品各用45元。先合并这4份，得到已经花掉的180元。',
      '45 × 4 = 180元',
      pricedObjects(4, 45),
    ),
    frame(
      '从原款拿走已花的部分',
      '原款360元由已花180元和余款组成。只有剩下180元还能买球。',
      '360 − 180 = 180元',
      balance(360, 180),
    ),
    frame(
      '余款每25元圈成一个完整份',
      '每个完整框够买一个球。180元能圈7份，还剩5元；5元不够再买一个。',
      '180 ÷ 25 = 7……5',
      wholePurchases(180, 25),
    ),
    frame(
      '再检查第8个是否付得起',
      '8个球要200元，比余款180元多20元。最多只能买7个，不把余数凑成一个球。',
      '25 × 8 = 200 > 180；最多7个，余5元',
      exceedsAvailable(180, 200, '第8个要多花20元，买不起'),
    ),
  ],
  mistake: {
    question: '有360元，先花180元，球每个25元。能直接用360÷25，算成14个球吗？',
    wrong: '能，直接拿原款360元去分',
    right: '不能，只能拿余款180元去分',
    why: '14个球要350元，但180元已经花掉，现在只剩180元。错用原款会把已花的钱再用一次。实际最多7个，还剩5元。',
    nodes: wholePurchases(180, 25),
    wrongNodes: exceedsAvailable(180, 350, '错买14个球，要350元'),
  },
  transfer: {
    question: '换一组：带420元，先买3件每件60元的用品，余款买每个35元的球。最多买几个，剩多少元？',
    wrong: '7个，余数不够也向上凑一个',
    right: '6个，还剩30元',
    why: '先花180元，剩240元。6个球用210元，剩30元；第7个要245元，超过余款5元，不能买。',
    nodes: wholePurchases(240, 35),
    wrongNodes: exceedsAvailable(240, 245, '错买第7个，还差5元'),
  },
};

function oneGroupMaterials(): MethodNode[] {
  return [
    text(200, 28, '一组：2张板材和3盒彩泥', 'known', 21),
    ...[10, 10, 8, 8, 8].map((price, index) =>
      rect(24 + index * 70, 74, 66, 58, index < 2 ? 'known' : 'focus', String(price)),
    ),
    text(94, 177, '板材20元', 'known', 20),
    text(269, 177, '彩泥24元', 'focus', 20),
    text(200, 232, '不同单价，分别算再合起来', 'focus', 20),
  ];
}

function groupFeeParts(): MethodNode[] {
  return [
    text(200, 29, '一组的44元里，两种材料都在', 'known', 21),
    rect(24, 83, 158, 60, 'known', '板材20'),
    rect(184, 83, 192, 60, 'focus', '彩泥24'),
    text(200, 222, '每组：20 + 24 = 44元', 'focus', 22),
  ];
}

function copyGroups(): MethodNode[] {
  return [
    text(200, 28, '每框都是一整组材料44元', 'known', 21),
    ...Array.from({ length: 6 }, (_, index) =>
      rect(24 + (index % 3) * 118, 55 + Math.floor(index / 3) * 70, 112, 54, 'focus', '44'),
    ),
    text(200, 231, '6组一共264元，工具费还没加', 'focus', 20),
  ];
}

function sharedFee(groups: number, perGroup: number, fee: number, wrong = false): MethodNode[] {
  const width = 352 / groups,
    feeCopies = wrong ? groups : 1;
  return [
    text(200, 27, `${groups}组材料，每组${perGroup}元`, 'known', 21),
    ...Array.from({ length: groups }, (_, index) =>
      rect(24 + index * width, 45, width - 4, 48, 'known', String(perGroup)),
    ),
    text(
      200,
      125,
      wrong ? '错：公共工具也收了每组一份' : '公共工具只收1份',
      wrong ? 'error' : 'focus',
      20,
    ),
    ...Array.from({ length: feeCopies }, (_, index) =>
      rect(24 + index * width, 147, width - 4, 48, wrong ? 'error' : 'focus', String(fee)),
    ),
    text(
      200,
      236,
      wrong
        ? `公共费错收${groups * fee}，多${(groups - 1) * fee}元`
        : `${groups * perGroup} + ${fee} = ${groups * perGroup + fee}元`,
      wrong ? 'error' : 'focus',
      21,
    ),
  ];
}

const groupsAndFee: MethodStory = {
  prompt: '6组活动，每组买2张每张10元的板材、3盒每盒8元的彩泥。另付公共工具费30元，共需多少元？',
  frames: [
    frame(
      '先分别算一组的两种材料',
      '同组里有两种单价。板材是2份10元，彩泥是3份8元，不能把5件按同一单价算。',
      '2 × 10 = 20；3 × 8 = 24',
      oneGroupMaterials(),
    ),
    frame(
      '把两种费用圈成完整的一组',
      '板材20元和彩泥24元合起来是44元。这整个44元，才是一组需要的钱。',
      '20 + 24 = 44元/组',
      groupFeeParts(),
    ),
    frame(
      '把完整的一组复制6次',
      '6组都需要板材和彩泥，所以重复的是整组44元。公共工具还没有计算。',
      '44 × 6 = 264元',
      copyGroups(),
    ),
    frame(
      '公共费用只在最后加一次',
      '30元是所有小组共用工具的一笔费用。不是每组都再付30元，所以只放入一个30元框。',
      '264 + 30 = 294元',
      sharedFee(6, 44, 30),
    ),
  ],
  mistake: {
    question: '6组材料每组44元，另付公共工具费30元。公共工具费应该付几次？',
    wrong: '每组都付，共付6次',
    right: '只付1次，总费294元',
    why: '“公共”说明6组共用这一笔30元。把它乘6会收180元，多收5份30元，也就是150元。',
    nodes: sharedFee(6, 44, 30),
    wrongNodes: sharedFee(6, 44, 30, true),
  },
  transfer: {
    question:
      '换一组：4组各买3张每张12元的板材、2盒每盒9元的彩泥，另付公共工具费36元。一共多少钱？',
    wrong: '360元，把36元也放进每组',
    right: '252元，4组费加一次公共费',
    why: '每组12×3+9×2=54元，4组216元，再加一次36元是252元。错法多收3份公共费，共108元。',
    nodes: sharedFee(4, 54, 36),
    wrongNodes: sharedFee(4, 54, 36, true),
  },
};

function unpackSupplies(): MethodNode[] {
  return [
    text(200, 26, '红纸：3包，每包24张', 'known', 21),
    ...Array.from({ length: 3 }, (_, index) => rect(24 + index * 118, 45, 112, 48, 'known', '24')),
    text(200, 128, '蓝纸：2包，每包25张', 'focus', 21),
    ...Array.from({ length: 2 }, (_, index) => rect(24 + index * 178, 148, 174, 48, 'focus', '25')),
    text(200, 239, '先求两种材料各有多少张', 'quiet', 20),
  ];
}

function materialPairs(
  red: number,
  redPer: number,
  blue: number,
  bluePer: number,
  paired: boolean,
): MethodNode[] {
  const redCount = Math.floor(red / redPer),
    blueCount = Math.floor(blue / bluePer),
    count = Math.min(redCount, blueCount),
    width = 352 / Math.max(redCount, blueCount);
  return [
    text(200, 29, `红纸每${redPer}张一份，最多${redCount}份`, 'known', 20),
    ...Array.from({ length: redCount }, (_, index) =>
      rect(
        24 + index * width,
        49,
        width - 2,
        38,
        paired ? (index < count ? 'focus' : 'warm') : 'known',
      ),
    ),
    ...Array.from({ length: blueCount }, (_, index) =>
      rect(
        24 + index * width,
        149,
        width - 2,
        38,
        paired ? (index < count ? 'focus' : 'warm') : 'known',
      ),
    ),
    ...(paired
      ? Array.from({ length: count }, (_, index) =>
          line(24 + (index + 0.5) * width, 91, 24 + (index + 0.5) * width, 145, 'focus'),
        )
      : []),
    text(200, 213, `蓝纸每${bluePer}张一份，最多${blueCount}份`, 'known', 20),
    text(
      200,
      239,
      paired ? `要两种份数配成对，只能配${count}套` : '每个框＝一套需要的该种材料',
      paired ? 'focus' : 'quiet',
      20,
    ),
  ];
}

function leftoverMaterials(): MethodNode[] {
  const width = 352 / 72;
  return [
    text(200, 28, '红纸72张：16套用64，剩8', 'known', 20),
    rect(24, 54, 64 * width - 2, 48, 'focus', '用64'),
    rect(24 + 64 * width, 54, 8 * width, 48, 'warm', '8'),
    text(200, 143, '蓝纸50张：16套用48，剩2', 'known', 20),
    rect(24, 167, 48 * width - 2, 48, 'focus', '用48'),
    rect(24 + 48 * width, 167, 2 * width, 48, 'warm'),
    text(200, 244, '先确定套数，再分别求剩余量', 'focus', 20),
  ];
}

const twoMaterials: MethodStory = {
  prompt: '有3包红纸，每包24张；2包蓝纸，每包25张。每套用4张红纸、3张蓝纸，最多配几套？各剩几张？',
  frames: [
    frame(
      '先展开包装，算两种材料总量',
      '包数不是张数。红纸一共72张，蓝纸一共50张，两种材料分别保存，不能混加。',
      '24 × 3 = 72；25 × 2 = 50',
      unpackSupplies(),
    ),
    frame(
      '两种材料各自按每套用量分份',
      '每套用4张红纸，红纸最多供18套；每套用3张蓝纸，蓝纸最多供16套，还余2张。',
      '72 ÷ 4 = 18；50 ÷ 3 = 16……2',
      materialPairs(72, 4, 50, 3, false),
    ),
    frame(
      '一份红纸和一份蓝纸才能配一套',
      '每套两种材料都要有。蓝纸只有16个完整份，就只能配16对；多出的红纸不能代替蓝纸。',
      '18与16取较小的16，最多16套',
      materialPairs(72, 4, 50, 3, true),
    ),
    frame(
      '用同一个套数，分别扣掉已用材料',
      '16套用红纸64张、蓝纸48张。余量分别算，不能直接把两种除法的余数当成最后剩余量。',
      '72 − 16 × 4 = 8；50 − 16 × 3 = 2',
      leftoverMaterials(),
    ),
  ],
  mistake: {
    question: '红纸72张，每套4张；蓝纸50张，每套3张。能只看红纸，直接配18套吗？',
    wrong: '能，红纸足够配18套',
    right: '不能，蓝纸只能配16套',
    why: '18套还要18×3=54张蓝纸，现有50张，差4张。两种材料必须同时够用，所以只能配16套。',
    nodes: materialPairs(72, 4, 50, 3, true),
    wrongNodes: exceedsAvailable(50, 54, '错选18套，蓝纸要54张'),
  },
  transfer: {
    question: '换一组：红纸80张、蓝纸57张，每套用红纸6张、蓝纸4张。最多配几套？',
    wrong: '14套，按蓝纸最多的份数选',
    right: '13套，两种材料都够才行',
    why: '红纸最多供13套，蓝纸最多供14套，取较小的13。14套要84张红纸，超过80张4张；这次是红纸限制套数。',
    nodes: materialPairs(80, 6, 57, 4, true),
    wrongNodes: exceedsAvailable(80, 84, '错选14套，红纸还差4张'),
  },
};

export const budgetSubskillStories: Record<string, MethodStory> = {
  'budget-shopping-change': unit34Stories['u3-shopping'],
  'budget-remaining-wholes': remainingWholes,
  'budget-groups-and-shared-fee': groupsAndFee,
  'budget-two-materials': twoMaterials,
  'budget-feasible-fleet': unit34Stories['u4-budget'],
};
