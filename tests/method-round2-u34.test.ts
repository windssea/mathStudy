import { describe, expect, it } from 'vitest';
import { practice, questions } from '@mathstudy/content';
import {
  round2U34QuestionSubskills,
  round2U34SubskillStories,
} from '../packages/animation-engine/src/method-round2-u34';
import type { MethodNode } from '@mathstudy/animation-engine';

function rects(nodes: MethodNode[], y?: number) {
  return nodes.filter(
    (n): n is Extract<MethodNode, { kind: 'rect' }> =>
      n.kind === 'rect' && (y === undefined || n.y === y),
  );
}
function labels(nodes: MethodNode[]) {
  return nodes
    .flatMap((n) => (n.kind === 'text' ? [n.text] : n.kind === 'rect' && n.label ? [n.label] : []))
    .join('；');
}
function numericQuantity(nodes: MethodNode[]) {
  return rects(nodes).reduce(
    (sum, n) => sum + (/^\d+$/.test(n.label ?? '') ? Number(n.label) : 0),
    0,
  );
}

describe('second-pass U03–U04 quantity relationships', () => {
  it('maps only reviewed existing members and keeps every mathematical stage on the canvas', () => {
    expect(Object.keys(round2U34SubskillStories)).toHaveLength(15);
    expect(Object.values(round2U34QuestionSubskills).flatMap(Object.keys)).toHaveLength(19);
    for (const [topicId, map] of Object.entries(round2U34QuestionSubskills)) {
      const topic = practice.topics.find((t) => t.id === topicId)!;
      expect(topic).toBeDefined();
      for (const [id, key] of Object.entries(map)) {
        expect(topic.questionIds, id).toContain(id);
        expect(
          questions.some((q) => q.id === id),
          id,
        ).toBe(true);
        expect(round2U34SubskillStories[key], id).toBeDefined();
      }
    }
    for (const [key, story] of Object.entries(round2U34SubskillStories)) {
      expect(story.frames.length, key).toBeGreaterThanOrEqual(3);
      expect(new Set(story.frames.map((f) => JSON.stringify(f.nodes))).size, key).toBe(
        story.frames.length,
      );
      expect(story.transfer, key).toBeDefined();
      for (const check of [story.mistake, story.transfer!]) {
        expect(check.nodes, key).not.toEqual(check.wrongNodes);
        expect(check.question, key).not.toMatch(/这些|这个图|上图/);
      }
      const diagrams = [
        ...story.frames.map((f) => f.nodes),
        story.mistake.nodes,
        story.mistake.wrongNodes!,
        story.transfer!.nodes,
        story.transfer!.wrongNodes!,
      ];
      for (const nodes of diagrams) {
        expect(
          nodes.some((n) => n.kind === 'rect' || n.kind === 'line'),
          key,
        ).toBe(true);
        for (const node of nodes) {
          expect(node.x, key).toBeGreaterThanOrEqual(0);
          expect(node.y, key).toBeGreaterThanOrEqual(0);
          expect(node.x, key).toBeLessThanOrEqual(400);
          expect(node.y, key).toBeLessThanOrEqual(250);
          if (node.kind === 'rect') {
            expect(node.w, key).toBeGreaterThan(0);
            expect(node.h, key).toBeGreaterThan(0);
            expect(node.x + node.w, key).toBeLessThanOrEqual(400);
            expect(node.y + node.h, key).toBeLessThanOrEqual(250);
          }
          if (node.kind === 'line') {
            expect(node.x2, key).toBeGreaterThanOrEqual(0);
            expect(node.x2, key).toBeLessThanOrEqual(400);
            expect(node.y2, key).toBeGreaterThanOrEqual(0);
            expect(node.y2, key).toBeLessThanOrEqual(250);
          }
        }
      }
    }
  });
  it('divides the same total into 3 and 6 actual equal parts', () => {
    const s = round2U34SubskillStories['r2-same-total-inverse-compare'];
    expect(rects(s.frames[0].nodes)).toHaveLength(2);
    const final = s.frames[2].nodes;
    expect(rects(final, 58)).toHaveLength(3);
    expect(rects(final, 153)).toHaveLength(6);
    expect(numericQuantity(rects(final, 58))).toBe(96);
    expect(numericQuantity(rects(final, 153))).toBe(96);
    expect(rects(final, 58)[0].w).toBeGreaterThan(rects(final, 153)[0].w);
    expect(labels(final)).toContain('32与16相差16本');
  });
  it('removes 36 physical units before repacking, rather than keeping 180', () => {
    const s = round2U34SubskillStories['r2-remove-before-repack'];
    expect(numericQuantity(s.frames[0].nodes)).toBe(180);
    expect(rects(s.mistake.nodes)).toHaveLength(8);
    expect(numericQuantity(s.mistake.nodes)).toBe(180 - 36);
    expect(numericQuantity(s.mistake.wrongNodes!)).toBe(180);
    expect(numericQuantity(s.transfer!.nodes)).toBe(240 - 60);
  });
  it('excludes both change and the other item before finding an unknown unit price', () => {
    const s = round2U34SubskillStories['r2-reverse-shopping-price'];
    expect(rects(s.mistake.nodes)).toHaveLength(8);
    expect(numericQuantity(s.mistake.nodes) + 24 + 32).toBe(200);
    expect(numericQuantity(s.mistake.wrongNodes!) + 24 + 32).toBe(264);
    expect(rects(s.transfer!.nodes)).toHaveLength(6);
    expect(numericQuantity(s.transfer!.nodes) + 18 + 30).toBe(180);
  });
  it('moves refund money into the hand without losing the original change', () => {
    const s = round2U34SubskillStories['r2-shopping-refund'];
    const final = rects(s.mistake.nodes);
    expect(final.map((r) => r.label)).toEqual(['留书144', '退款48', '原找零48']);
    expect(final.map((r) => Number(r.label!.match(/\d+/)![0])).reduce((a, b) => a + b, 0)).toBe(
      240,
    );
    expect(labels(s.mistake.nodes)).toContain('留下9本；手中96元');
    expect(labels(s.mistake.wrongNodes!)).toContain('手中48元');
    expect(labels(s.transfer!.nodes)).toContain('留下10本；手中50元');
  });
  it('makes the compared purchase quantities equal before comparing money', () => {
    const s = round2U34SubskillStories['r2-compare-unit-prices'];
    expect(rects(s.frames[0].nodes, 58)).toHaveLength(3);
    expect(rects(s.frames[0].nodes, 155)).toHaveLength(5);
    expect(rects(s.mistake.nodes, 58)).toHaveLength(6);
    expect(rects(s.mistake.nodes, 155)).toHaveLength(6);
    expect(numericQuantity(rects(s.mistake.nodes, 58))).toBe(84);
    expect(numericQuantity(rects(s.mistake.nodes, 155))).toBe(78);
    expect(
      numericQuantity(rects(s.transfer!.nodes, 155)) -
        numericQuantity(rects(s.transfer!.nodes, 58)),
    ).toBe(8);
  });
  it('redraws a fixed budget as more smaller purchase units after a price reduction', () => {
    const s = round2U34SubskillStories['r2-discount-more-items'];
    expect(rects(s.mistake.nodes, 57)).toHaveLength(9);
    expect(rects(s.mistake.nodes, 150)).toHaveLength(12);
    expect(rects(s.mistake.nodes, 57)[0].w).toBeGreaterThan(rects(s.mistake.nodes, 150)[0].w);
    expect(labels(s.mistake.wrongNodes!)).toContain('要210元');
    expect(rects(s.transfer!.nodes, 150).length - rects(s.transfer!.nodes, 57).length).toBe(2);
  });
  it('converts both hour and kilometre before multiplying minutes', () => {
    const s = round2U34SubskillStories['r2-speed-same-units'];
    expect(rects(s.frames[1].nodes).filter((r) => r.label === '10')).toHaveLength(6);
    expect(labels(s.frames[1].nodes)).toContain('48000÷60＝800米/分');
    expect(rects(s.mistake.nodes).map((r) => r.label)).toEqual(['3600米', '4800米']);
    expect(rects(s.mistake.wrongNodes!).map((r) => r.label)).toEqual(['3600米', '288米']);
    expect(labels(s.transfer!.nodes)).toContain('相差400米');
  });
  it('reserves early-arrival time before allocating rest', () => {
    const s = round2U34SubskillStories['r2-rest-before-deadline'];
    expect(rects(s.mistake.nodes).map((r) => r.label)).toEqual(['走12分', '休3分', '早3分']);
    expect(rects(s.mistake.wrongNodes!).map((r) => r.label)).toEqual(['走12分', '休6分']);
    expect(labels(s.mistake.wrongNodes!)).toContain('第18分，没能早到');
    expect(labels(s.transfer!.nodes)).toContain('休息最多4分');
  });
  it('retains elapsed production time when the remaining rate changes', () => {
    const s = round2U34SubskillStories['r2-production-rate-change'];
    expect(numericQuantity(s.frames[0].nodes)).toBe(20);
    expect(labels(s.frames[1].nodes)).toContain('新速度6朵/分');
    expect(labels(s.mistake.nodes)).toContain('全程15分');
    expect(labels(s.mistake.wrongNodes!)).toContain('全程10分');
    expect(labels(s.transfer!.nodes)).toContain('全程12分');
  });
  it('keeps multiplication outside the divisor separate from multiplication inside it', () => {
    const s = round2U34SubskillStories['r2-bracket-scope'];
    expect(rects(s.mistake.nodes, 58)).toHaveLength(2);
    expect(numericQuantity(rects(s.mistake.nodes, 58))).toBe(80);
    expect(labels(s.mistake.nodes)).toContain('乙480÷24＝20');
    expect(labels(s.mistake.wrongNodes!)).toContain('两式相差0');
    expect(labels(s.transfer!.nodes)).toContain('两式相差80');
    expect(rects(s.frames[1].nodes, 58)[0].w).toBe(rects(s.frames[2].nodes, 58)[0].w);
  });
  it('uses the entire middle division as the final divisor', () => {
    const s = round2U34SubskillStories['r2-nested-division'];
    expect(rects(s.frames[1].nodes)).toHaveLength(12);
    expect(numericQuantity(s.frames[1].nodes)).toBe(240);
    expect(rects(s.mistake.nodes)).toHaveLength(10);
    expect(rects(s.mistake.nodes).every((r) => r.label === '12')).toBe(true);
    expect(rects(s.mistake.wrongNodes!)).toHaveLength(6);
    expect(numericQuantity(s.mistake.nodes)).toBe(120);
    expect(numericQuantity(s.mistake.wrongNodes!)).toBe(120);
  });
  it('reconnects the subtracted piece when reversing a bracket equation', () => {
    const s = round2U34SubskillStories['r2-reverse-bracket-equation'];
    expect(numericQuantity(s.frames[0].nodes)).toBe(720);
    expect(numericQuantity(s.frames[1].nodes)).toBe(90);
    expect(rects(s.frames[1].nodes)).toHaveLength(3);
    expect(rects(s.mistake.nodes).map((r) => r.label)).toEqual(['减去12', '余30']);
    expect(labels(s.mistake.nodes)).toContain('原数42');
    expect(labels(s.mistake.wrongNodes!)).toContain('原数18');
    expect(labels(s.transfer!.nodes)).toContain('原数40');
    expect(s.frames[1].title).toBe('把90平均分成3份');
  });
  it('compares extra-item bundles when the requirement says at least, without assuming they always win', () => {
    const s = round2U34SubskillStories['r2-at-least-purchase'];
    const books = (nodes: MethodNode[]) => rects(nodes).filter((n) => n.h === 60);
    expect(books(s.frames[1].nodes)).toHaveLength(7);
    expect(books(s.frames[2].nodes)).toHaveLength(8);
    expect(labels(s.frames[1].nodes)).toContain('1×24＋3×10＝54元');
    expect(labels(s.mistake.nodes)).toContain('2×24＋0×10＝48元');
    expect(books(s.mistake.wrongNodes!)).toHaveLength(7);
    expect(books(s.transfer!.nodes)).toHaveLength(5);
    expect(books(s.transfer!.wrongNodes!)).toHaveLength(6);
    expect(labels(s.transfer!.nodes)).toContain('1×21＋2×10＝41元');
    expect(labels(s.transfer!.wrongNodes!)).toContain('2×21＋0×10＝42元');
    const nodes = s.frames[2].nodes;
    expect(nodes.findIndex((n) => n.kind === 'rect' && n.dashed)).toBeLessThan(
      nodes.findIndex((n) => n.kind === 'rect' && n.h === 60),
    );
  });
  it('uses the corresponding total and count to find a unit quantity, ignoring unrelated numbers', () => {
    const s = round2U34SubskillStories['r2-useful-unit-quantity'];
    expect(numericQuantity(s.frames[1].nodes)).toBe(18 + 36);
    expect(rects(s.mistake.nodes)).toHaveLength(9);
    expect(numericQuantity(s.mistake.nodes)).toBe(54);
    expect(numericQuantity(s.mistake.wrongNodes!)).toBe(45);
    expect(rects(s.transfer!.nodes)).toHaveLength(7);
    expect(numericQuantity(s.transfer!.nodes)).toBe(63);
    expect(numericQuantity(s.transfer!.wrongNodes!)).toBe(350);
  });
  it('adds only the requested person’s walking and rest, not another person’s time', () => {
    const s = round2U34SubskillStories['r2-second-person-elapsed'];
    expect(rects(s.frames[0].nodes)).toHaveLength(15);
    expect(rects(s.frames[1].nodes)).toHaveLength(12);
    expect(rects(s.mistake.nodes).map((r) => r.label)).toEqual(['乙12', '2']);
    expect(rects(s.mistake.wrongNodes!).map((r) => r.label)).toEqual(['甲15', '乙12', '2']);
    expect(labels(s.mistake.nodes)).toContain('乙共14分');
    expect(labels(s.mistake.wrongNodes!)).toContain('乙共29分');
    expect(labels(s.transfer!.nodes)).toContain('乙共16分');
    expect(rects(s.mistake.nodes)[0].w).toBe(rects(s.mistake.wrongNodes!)[1].w);
  });
});
