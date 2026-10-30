import { describe, expect, it } from 'vitest';
import { practice } from '@mathstudy/content';
import {
  priorityQuestionSubskills,
  prioritySubskillStories,
} from '../packages/animation-engine/src/method-priority-subskills';
import type { MethodNode } from '@mathstudy/animation-engine';

const words = (nodes: MethodNode[]) =>
  nodes
    .flatMap((node) =>
      node.kind === 'text' ? [node.text] : node.kind === 'rect' && node.label ? [node.label] : [],
    )
    .join('；');
describe('six confirmed high-priority method relationships', () => {
  it('maps only the six individually reviewed questions under their existing topics', () => {
    expect(Object.values(priorityQuestionSubskills).flatMap(Object.keys).sort()).toEqual(
      [
        'full-p10-s5-q2',
        'bank-u3-journey-02',
        'bank-u3-journey-04',
        'bank-u4-model-05',
        'full-p04-s3-q4',
        'full-p06-s4-q5',
      ].sort(),
    );
    for (const [topic, items] of Object.entries(priorityQuestionSubskills))
      for (const [id, key] of Object.entries(items)) {
        expect(practice.topics.find((t) => t.id === topic)?.questionIds).toContain(id);
        expect(prioritySubskillStories[key]).toBeTruthy();
      }
  });
  it('uses two free walls and only one remaining width before applying area density', () => {
    const story = prioritySubskillStories['priority-two-walls'];
    expect(
      story.frames[0].nodes.filter(
        (node) => node.kind === 'line' && node.dashed && node.tone === 'known',
      ),
    ).toHaveLength(2);
    expect(words(story.frames[1].nodes)).toContain('另一边20−12＝8米');
    expect(story.frames[3].equation).toContain('96×5＝480');
    expect(words(story.mistake.wrongNodes!)).toContain('宽4');
    expect(words(story.transfer!.nodes)).toContain('面积16×10＝160');
  });
  it('pairs each journey segment with its own speed and exposes the extra distance in the wrong method', () => {
    const story = prioritySubskillStories['priority-segment-distances'];
    expect(
      story.frames[1].nodes.filter((node) => node.kind === 'rect' && node.label === '36'),
    ).toHaveLength(2);
    expect(story.frames[2].equation).toContain('216');
    expect(words(story.mistake.wrongNodes!)).toContain('多算24千米');
    expect(words(story.transfer!.wrongNodes!)).toContain('多算30千米');
  });
  it('deducts rest from the deadline and makes the wrong schedule actually exceed the limit', () => {
    const story = prioritySubskillStories['priority-deadline-speed'];
    expect(words(story.frames[1].nodes)).toContain('35−10−5＝20分钟');
    expect(words(story.mistake.wrongNodes!)).toContain('错排40分，超过35分');
    expect(story.frames[2].equation).toContain('1000÷20＝50');
    expect(story.transfer!.why).toContain('25−10−3=12');
    expect(words(story.transfer!.wrongNodes!)).toContain('错排28分，超过25分');
  });
  it('combines separately counted populations before grouping', () => {
    const story = prioritySubskillStories['priority-combine-then-group'];
    expect(
      story.frames[3].nodes.filter((node) => node.kind === 'rect' && node.label === '8'),
    ).toHaveLength(23);
    expect(
      story.mistake.wrongNodes!.filter(
        (node) => node.kind === 'rect' && node.tone === 'error' && node.label === '28',
      ),
    ).toHaveLength(3);
    expect(words(story.transfer!.nodes)).toContain('120÷6＝20组');
  });
  it('counts only completed discount thresholds and subtracts the reduction from the original amount', () => {
    const story = prioritySubskillStories['priority-threshold-discount'];
    expect(
      story.frames[1].nodes.filter(
        (node) => node.kind === 'rect' && node.tone === 'focus' && node.label === '15',
      ),
    ).toHaveLength(4);
    expect(words(story.frames[2].nodes)).toContain('实付370−60＝310');
    expect(words(story.mistake.wrongNodes!)).toContain('第5份还差30元');
    expect(words(story.transfer!.nodes)).toContain('实付425−80＝345');
  });
  it('maximizes received items within a budget, including loose purchases and non-recursive gifts', () => {
    const story = prioritySubskillStories['priority-budget-gift'];
    expect(words(story.frames[1].nodes)).toContain('5组花750，得到20个；余100元');
    expect(story.frames[2].equation).toContain('20＋2＝22');
    expect(
      story.mistake.nodes.filter((node) => node.kind === 'rect' && node.tone === 'warm'),
    ).toHaveLength(5);
    expect(
      story.mistake.wrongNodes!.filter((node) => node.kind === 'rect' && node.tone === 'warm'),
    ).toHaveLength(0);
    expect(
      story.transfer!.nodes.filter((node) => node.kind === 'rect' && node.tone === 'warm'),
    ).toHaveLength(3);
    expect(
      story.transfer!.wrongNodes!.filter((node) => node.kind === 'rect' && node.tone === 'error'),
    ).toHaveLength(1);
  });
  it('keeps all new correct and wrong models inside the deterministic drawing space', () => {
    for (const story of Object.values(prioritySubskillStories)) {
      expect(story.frames.length).toBeGreaterThanOrEqual(3);
      expect(story.frames.length).toBeLessThanOrEqual(4);
      expect(new Set(story.frames.map((f) => JSON.stringify(f.nodes))).size).toBe(
        story.frames.length,
      );
      for (const nodes of [
        ...story.frames.map((f) => f.nodes),
        story.mistake.nodes,
        story.mistake.wrongNodes!,
        story.transfer!.nodes,
        story.transfer!.wrongNodes!,
      ])
        for (const node of nodes) {
          expect(node.x).toBeGreaterThanOrEqual(0);
          expect(node.y).toBeGreaterThanOrEqual(0);
          if (node.kind === 'rect') {
            expect(node.w).toBeGreaterThan(0);
            expect(node.h).toBeGreaterThan(0);
            expect(node.x + node.w).toBeLessThanOrEqual(400);
            expect(node.y + node.h).toBeLessThanOrEqual(250);
          }
          if (node.kind === 'line') {
            expect(node.x2).toBeLessThanOrEqual(400);
            expect(node.y2).toBeLessThanOrEqual(250);
          }
        }
    }
  });
});
