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
import type { MethodStory } from './method-primitives';
export type {
  MethodTone,
  MethodNode,
  MethodFrame,
  MethodCheck,
  MethodStory,
} from './method-primitives';

export const methodQuestionSubskills: Record<string, Record<string, string>> = {
  ...remainderQuestionSubskills,
  ...extraQuestionSubskills,
  ...priorityQuestionSubskills,
  'u4-budget': budgetQuestionSubskills,
  'u2-cut': cutQuestionSubskills,
};
export const methodSubskillStories: Record<string, MethodStory> = {
  ...remainderSubskillStories,
  ...budgetSubskillStories,
  ...cutSubskillStories,
  ...extraSubskillStories,
  ...prioritySubskillStories,
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
