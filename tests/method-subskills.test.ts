import { describe, expect, it } from 'vitest';
import {
  methodQuestionSubskills,
  methodStories,
  methodStory,
  methodSubskillStories,
} from '@mathstudy/animation-engine';
import { practice } from '@mathstudy/content';

describe('explicit question-to-subskill teaching examples', () => {
  it('keeps topic defaults and maps only known stable question IDs inside their own topic', () => {
    expect(methodStory('u1-remainder')).toBe(methodStories['u1-remainder']);
    expect(methodStory('u1-remainder')!.frames).toHaveLength(5);
    expect(methodStory('u1-remainder', 'unmapped-question')).toBe(methodStories['u1-remainder']);
    expect(methodStory('u2-fence', 'full-p11-s2-q2')).toBe(methodStories['u2-fence']);
    for (const [topicId, questions] of Object.entries(methodQuestionSubskills)) {
      const topic = practice.topics.find((topic) => topic.id === topicId)!;
      for (const [id, subskill] of Object.entries(questions)) {
        expect(topic.questionIds).toContain(id);
        expect(methodSubskillStories[subskill]).toBeDefined();
        expect(methodStory(topicId, id)).toBe(methodSubskillStories[subskill]);
      }
    }
  });

  it('uses the same-quantity model for the equal-dividend/divisor judgement, not the generic remainder example', () => {
    const selected = methodStory('u1-remainder', 'full-p11-s2-q2')!;
    expect(selected.prompt).toContain('24 个');
    expect(selected.prompt).not.toContain('235');
    expect(selected.frames[0].nodes.filter((n) => n.kind === 'dot')).toHaveLength(24);
    expect(selected.frames[1].nodes.filter((n) => n.kind === 'rect')).toHaveLength(1);
    expect(selected.frames[1].nodes.filter((n) => n.kind === 'dot')).toHaveLength(24);
    expect(selected.transfer?.question).toContain('45');
  });

  it('matches remainder bounds, verification and inverse division to distinct independent examples', () => {
    const bounds = methodStory('u1-remainder', 'full-p09-s1-q6')!;
    const verification = methodStory('u1-remainder', 'full-p18-q11')!;
    const inverse = methodStory('u1-remainder', 'full-p09-s2-q1')!;
    expect(new Set([bounds, verification, inverse]).size).toBe(3);
    const boundGroups = bounds.frames[1].nodes.filter((n) => n.kind === 'rect');
    const boundRemaining = bounds.frames[1].nodes.filter((n) => n.kind === 'dot');
    expect(boundGroups).toHaveLength(7);
    expect(boundRemaining).toHaveLength(14 - 1);
    expect(boundGroups.length * 14 + boundRemaining.length).toBe(111);
    const checked = verification.frames[2].nodes;
    expect(
      checked.filter((n) => n.kind === 'rect').length * 17 +
        checked.filter((n) => n.kind === 'dot').length,
    ).toBe(229);
    expect(verification.frames[1].equation).toContain('228 ≠ 229');
    const restored = inverse.frames[2].nodes;
    expect(
      restored.filter((n) => n.kind === 'rect').length * 25 +
        restored.filter((n) => n.kind === 'dot').length,
    ).toBe(185);
    expect(inverse.frames[2].equation).toContain('(185 − 10) ÷ 7');
  });
});
