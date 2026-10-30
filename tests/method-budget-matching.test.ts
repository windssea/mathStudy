import { describe, expect, it } from 'vitest';
import { practice, questions } from '@mathstudy/content';
import {
  budgetQuestionSubskills,
  budgetSubskillStories,
} from '../packages/animation-engine/src/method-budget-subskills';
import { unit34Stories } from '../packages/animation-engine/src/methods-u34';
import type { MethodNode } from '@mathstudy/animation-engine';

const words = (nodes: MethodNode[]) =>
  nodes
    .flatMap((node) =>
      node.kind === 'text' ? [node.text] : node.kind === 'rect' && node.label ? [node.label] : [],
    )
    .join('；');

describe('budget methods follow the current mathematical relationship', () => {
  it('explicitly associates every current budget question with a reviewed subskill', () => {
    const topic = practice.topics.find((item) => item.id === 'u4-budget')!;
    expect(Object.keys(budgetQuestionSubskills).sort()).toEqual([...topic.questionIds].sort());
    const expected: Record<string, string> = {
      'bank-u4-budget-01': 'budget-shopping-change',
      'u4-08': 'budget-shopping-change',
      'bank-u4-budget-02': 'budget-remaining-wholes',
      'u4-05': 'budget-remaining-wholes',
      'bank-u4-budget-03': 'budget-groups-and-shared-fee',
      'bank-u4-budget-04': 'budget-two-materials',
      'u4-12': 'budget-two-materials',
      'bank-u4-budget-05': 'budget-feasible-fleet',
    };
    expect(budgetQuestionSubskills).toEqual(expected);
    for (const [id, key] of Object.entries(expected)) {
      expect(questions.find((item) => item.id === id)).toBeTruthy();
      expect(budgetSubskillStories[key]).toBeTruthy();
    }
    expect(budgetSubskillStories['budget-shopping-change']).toBe(unit34Stories['u3-shopping']);
    expect(budgetSubskillStories['budget-feasible-fleet']).toBe(unit34Stories['u4-budget']);
  });

  it('uses only remaining money and tests whether the next complete purchase is affordable', () => {
    const story = budgetSubskillStories['budget-remaining-wholes'];
    const purchases = story.frames[2].nodes.filter(
      (node) => node.kind === 'rect' && node.label === '25',
    );
    expect(purchases).toHaveLength(7);
    expect(7 * 25 + 5).toBe(360 - 4 * 45);
    expect(words(story.frames[3].nodes)).toContain('还差20');
    expect(words(story.mistake.wrongNodes!)).toContain('只有180，还差170');
    expect(words(story.transfer!.nodes)).toContain('6个用210元，还剩30元');
    expect(words(story.transfer!.wrongNodes!)).toContain('只有240，还差5');
  });

  it('visually charges a shared fee once rather than copying it with every group', () => {
    const story = budgetSubskillStories['budget-groups-and-shared-fee'];
    const feeRects = (nodes: MethodNode[], fee: string) =>
      nodes.filter((node) => node.kind === 'rect' && node.label === fee);
    expect(feeRects(story.mistake.nodes, '30')).toHaveLength(1);
    expect(feeRects(story.mistake.wrongNodes!, '30')).toHaveLength(6);
    expect(words(story.mistake.wrongNodes!)).toContain('多150元');
    expect((2 * 10 + 3 * 8) * 6 + 30).toBe(294);
    expect(feeRects(story.transfer!.nodes, '36')).toHaveLength(1);
    expect(feeRects(story.transfer!.wrongNodes!, '36')).toHaveLength(4);
    expect((3 * 12 + 2 * 9) * 4 + 36).toBe(252);
  });

  it('pairs both materials, changes the limiting material, and recomputes leftover stock', () => {
    const story = budgetSubskillStories['budget-two-materials'];
    const pairs = story.frames[2].nodes.filter((node) => node.kind === 'rect');
    expect(pairs.filter((node) => node.y === 49 && node.tone === 'focus')).toHaveLength(16);
    expect(pairs.filter((node) => node.y === 49 && node.tone === 'warm')).toHaveLength(2);
    expect(pairs.filter((node) => node.y === 149 && node.tone === 'focus')).toHaveLength(16);
    expect(words(story.frames[3].nodes)).toContain('红纸72张：16套用64，剩8');
    expect(words(story.frames[3].nodes)).toContain('蓝纸50张：16套用48，剩2');
    expect(words(story.mistake.wrongNodes!)).toContain('只有50，还差4');
    expect(words(story.transfer!.wrongNodes!)).toContain('只有80，还差4');
    expect(story.transfer!.why).toContain('这次是红纸限制套数');
  });

  it('keeps every new correct, wrong and transfer model in the readable drawing space', () => {
    for (const story of Object.values(budgetSubskillStories)) {
      expect(story.frames.length).toBeGreaterThanOrEqual(3);
      expect(new Set(story.frames.map((item) => JSON.stringify(item.nodes))).size).toBe(
        story.frames.length,
      );
      expect(story.mistake.wrongNodes?.length).toBeGreaterThan(0);
      expect(story.transfer?.wrongNodes?.length).toBeGreaterThan(0);
      for (const nodes of [
        ...story.frames.map((item) => item.nodes),
        story.mistake.nodes,
        story.mistake.wrongNodes!,
        story.transfer!.nodes,
        story.transfer!.wrongNodes!,
      ]) {
        for (const node of nodes) {
          expect(node.x).toBeGreaterThanOrEqual(0);
          expect(node.y).toBeGreaterThanOrEqual(0);
          if (node.kind === 'rect') {
            expect(node.x + node.w).toBeLessThanOrEqual(400);
            expect(node.y + node.h).toBeLessThanOrEqual(250);
            expect(node.w).toBeGreaterThan(0);
          }
        }
      }
    }
  });
});
