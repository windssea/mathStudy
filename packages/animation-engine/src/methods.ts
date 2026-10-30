import { unit12Stories } from './methods-u12';
import { unit34Stories } from './methods-u34';
import { unit56Stories } from './methods-u56';
import { methodQuestionSubskills, methodSubskillStories } from './method-subskills';
import type { MethodStory } from './method-primitives';
export type {
  MethodTone,
  MethodNode,
  MethodFrame,
  MethodCheck,
  MethodStory,
} from './method-primitives';
export { methodQuestionSubskills, methodSubskillStories } from './method-subskills';

export const methodStories: Record<string, MethodStory> = {
  ...unit12Stories,
  ...unit34Stories,
  ...unit56Stories,
};

export function methodStory(topicId: string, questionId?: string): MethodStory | undefined {
  const subskill = questionId && methodQuestionSubskills[topicId]?.[questionId];
  return (subskill && methodSubskillStories[subskill]) || methodStories[topicId];
}
