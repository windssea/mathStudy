import { describe, expect, it } from 'vitest';
import {
  methodQuestionSubskills,
  methodStory,
  methodSubskillStories,
} from '@mathstudy/animation-engine';
import { methodQuestionSubskills as remainder } from '../packages/animation-engine/src/method-subskills';
import { budgetQuestionSubskills as budget } from '../packages/animation-engine/src/method-budget-subskills';
import { cutQuestionSubskills as cut } from '../packages/animation-engine/src/method-cut-subskills';
import { extraQuestionSubskills as extra } from '../packages/animation-engine/src/method-extra-subskills';
import { priorityQuestionSubskills as priority } from '../packages/animation-engine/src/method-priority-subskills';
import { round2U34QuestionSubskills as u34 } from '../packages/animation-engine/src/method-round2-u34';
import { round2U56QuestionSubskills as u56 } from '../packages/animation-engine/src/method-round2-u56';
import { round2U12QuestionSubskills as u12 } from '../packages/animation-engine/src/method-round2-u12';

describe('question subskill registry', () => {
  it('retains previously published question links when another module extends the same topic', () => {
    const published = [remainder, extra, priority, { 'u4-budget': budget, 'u2-cut': cut }];
    for (const source of published)
      for (const [topic, mapping] of Object.entries(source))
        for (const [id, key] of Object.entries(mapping)) {
          expect(methodQuestionSubskills[topic]?.[id], `${topic}:${id}`).toBe(key);
          expect(methodStory(topic, id), `${topic}:${id}`).toBe(methodSubskillStories[key]);
        }
  });
  it('makes reviewed additions available through the practice registry', () => {
    for (const source of [u34, u56, u12])
      for (const [topic, mapping] of Object.entries(source))
        for (const [id, key] of Object.entries(mapping)) {
          expect(methodQuestionSubskills[topic]?.[id], `${topic}:${id}`).toBe(key);
          expect(methodStory(topic, id), `${topic}:${id}`).toBe(methodSubskillStories[key]);
        }
  });
});
