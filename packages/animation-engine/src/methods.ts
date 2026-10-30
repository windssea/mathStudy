import { unit12Stories } from './methods-u12';
import { unit34Stories } from './methods-u34';
import { unit56Stories } from './methods-u56';
import {
  methodQuestionSubskills as remainderQuestionSubskills,
  methodSubskillStories as remainderSubskillStories,
} from './method-subskills';
import { budgetQuestionSubskills, budgetSubskillStories } from './method-budget-subskills';
import { cutQuestionSubskills, cutSubskillStories } from './method-cut-subskills';
import { extraQuestionSubskills, extraSubskillStories } from './method-extra-subskills';
import { priorityQuestionSubskills, prioritySubskillStories } from './method-priority-subskills';
import { round2U34QuestionSubskills, round2U34SubskillStories } from './method-round2-u34';
import { round2U56QuestionSubskills, round2U56SubskillStories } from './method-round2-u56';
import { round2U12QuestionSubskills, round2U12SubskillStories } from './method-round2-u12';
import type { MethodStory } from './method-primitives';
export type {
  MethodTone,
  MethodNode,
  MethodFrame,
  MethodCheck,
  MethodStory,
} from './method-primitives';

type QuestionSubskillMap = Record<string, Record<string, string>>;

function mergeQuestionSubskills(...sources: QuestionSubskillMap[]): QuestionSubskillMap {
  const result: QuestionSubskillMap = {};
  for (const source of sources)
    for (const [topic, questions] of Object.entries(source))
      result[topic] = { ...result[topic], ...questions };
  return result;
}

export const methodQuestionSubskills = mergeQuestionSubskills(
  remainderQuestionSubskills,
  extraQuestionSubskills,
  priorityQuestionSubskills,
  { 'u4-budget': budgetQuestionSubskills, 'u2-cut': cutQuestionSubskills },
  round2U34QuestionSubskills,
  round2U56QuestionSubskills,
  round2U12QuestionSubskills,
);
export const methodSubskillStories: Record<string, MethodStory> = {
  ...remainderSubskillStories,
  ...budgetSubskillStories,
  ...cutSubskillStories,
  ...extraSubskillStories,
  ...prioritySubskillStories,
  ...round2U34SubskillStories,
  ...round2U56SubskillStories,
  ...round2U12SubskillStories,
};

export const methodStories: Record<string, MethodStory> = {
  ...unit12Stories,
  ...unit34Stories,
  ...unit56Stories,
};

export function methodStory(topicId: string, questionId?: string): MethodStory | undefined {
  const subskill = questionId && methodQuestionSubskills[topicId]?.[questionId];
  return (subskill && methodSubskillStories[subskill]) || methodStories[topicId];
}
