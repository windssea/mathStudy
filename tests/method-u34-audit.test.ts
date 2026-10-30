import { describe, expect, it } from 'vitest';
import { unit34Stories } from '../packages/animation-engine/src/methods-u34';
import type { MethodNode } from '@mathstudy/animation-engine';

const textContent = (nodes: MethodNode[]) =>
  nodes
    .flatMap((node) =>
      node.kind === 'text' ? [node.text] : node.kind === 'rect' && node.label ? [node.label] : [],
    )
    .join('；');
const rectangles = (nodes: MethodNode[]) => nodes.filter((node) => node.kind === 'rect');

describe('U03/U04 child-facing audit regressions', () => {
  it('makes every misconception question understandable without the hidden main-example prompt', () => {
    const conditions: Record<string, string[]> = {
      'u3-inverse': ['12行', '30人', '18行'],
      'u3-shopping': ['4本', '12元', '3支', '5元'],
      'u3-compare': ['3本', '30元', '11元', '8本'],
      'u3-speed': ['12分钟', '840米', '70'],
      'u3-journey': ['3时', '2时', '1时'],
      'u3-conditions': ['40箱', '9千克', '12千克'],
      'u4-order': ['96÷4×3−18', '4×3'],
      'u4-brackets': ['840÷[20×3]', '840÷20×3'],
      'u4-model': ['500元', '4件', '35元', '12元'],
      'u4-steps': ['6段', '9米', '17米'],
      'u4-budget': ['63人', '16座', '140元', '三辆'],
    };
    for (const [topic, values] of Object.entries(conditions)) {
      const question = unit34Stories[topic].mistake.question.replaceAll(' ', '');
      for (const value of values) expect(question, topic).toContain(value);
    }
  });

  it('keeps the same eight books visible and identifies packages by position rather than every dashed frame', () => {
    const story = unit34Stories['u3-compare'];
    for (const frame of story.frames.slice(0, 2)) {
      expect(rectangles(frame.nodes).filter((node) => !node.dashed)).toHaveLength(8);
      expect(textContent(frame.nodes)).not.toContain('虚线框内才是完整的一包');
    }
    const first = rectangles(story.frames[0].nodes),
      second = rectangles(story.frames[1].nodes);
    expect(first.filter((node) => node.dashed)).toHaveLength(1);
    expect(first.filter((node) => !node.dashed && node.tone === 'focus')).toHaveLength(3);
    expect(first.filter((node) => !node.dashed && node.tone === 'quiet')).toHaveLength(5);
    expect(second.filter((node) => node.dashed && node.tone === 'focus')).toHaveLength(2);
    expect(second.filter((node) => node.dashed && node.tone === 'warm')).toHaveLength(1);
    expect(textContent(story.frames[1].nodes)).toContain('左侧整包，右侧散买');
  });

  it('puts the actual pack and loose prices in the corrected model and the undercharge in the wrong model', () => {
    const story = unit34Stories['u3-compare'];
    expect(textContent(story.mistake.nodes)).toContain('整包30元；散本11元/本');
    expect(textContent(story.mistake.wrongNodes!)).toContain('散本错按10元，少算2元');
    expect(textContent(story.transfer!.nodes)).toContain('整包36元；散本10元/本');
    expect(textContent(story.transfer!.wrongNodes!)).toContain('散本错按9元，少算2元');
    // The discrepancy belongs only to loose books: two full packages retain their price.
    expect(
      rectangles(story.mistake.wrongNodes!).filter((node) => node.dashed && node.tone === 'focus'),
    ).toHaveLength(2);
    expect(
      rectangles(story.transfer!.wrongNodes!).filter(
        (node) => !node.dashed && node.tone === 'error',
      ),
    ).toHaveLength(2);
  });

  it('shows the changed intermediate quantity when multiplying the divisor first', () => {
    const story = unit34Stories['u4-order'];
    expect(textContent(story.mistake.wrongNodes!)).toContain('先除以 12，得 8');
    expect(textContent(story.mistake.wrongNodes!)).toContain('减18前：原来72，错法8');
    expect(story.mistake.why).toContain('96÷12=8');
    expect(story.mistake.why).toContain('再取3倍是72');
  });

  it('draws available empty seats instead of asking the child to infer them solely from a caption', () => {
    const story = unit34Stories['u4-budget'];
    for (const [nodes, seats, people] of [
      [story.frames[3].nodes, 64, 63],
      [story.mistake.nodes, 64, 63],
      [story.transfer!.nodes, 52, 50],
    ] as const) {
      const passengers = nodes.filter((node) => node.kind === 'dot');
      const emptySeats = rectangles(nodes).filter((node) => node.dashed && node.tone === 'quiet');
      expect(passengers).toHaveLength(people);
      expect(emptySeats).toHaveLength(seats - people);
      expect(passengers.length + emptySeats.length).toBe(seats);
      for (const empty of emptySeats) {
        expect(empty.y + empty.h).toBeLessThan(218);
        expect(
          passengers.some((person) => person.x === empty.x + 8 && person.y === empty.y + 8),
        ).toBe(false);
      }
    }
    expect(
      story.mistake.wrongNodes!.filter((node) => node.kind === 'dot' && node.tone === 'error'),
    ).toHaveLength(15);
    expect(rectangles(story.mistake.wrongNodes!).filter((node) => node.dashed)).toHaveLength(0);
  });
});
