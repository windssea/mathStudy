// @vitest-environment jsdom
import { cleanup, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { practice, publicQuestion, questions } from '@mathstudy/content';
import { methodStory } from '@mathstudy/animation-engine';
import QuestionRunner from '../apps/web/src/components/QuestionRunner';
import { clearPracticeDrafts, writeDraft } from '../apps/web/src/lib/practice-drafts';
import { currentLearningOwner, useProgress } from '../apps/web/src/lib/progress';
import { app } from '../apps/web/worker';

const topic = practice.topics.find((item) => item.id === 'u1-mental')!;
const source = questions.find((item) => item.id === topic.questionIds[0])!;
const question = publicQuestion(source);
const storyboard = methodStory(topic.id, question.id)!;
afterEach(() => {
  cleanup();
  clearPracticeDrafts();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it('leaves unopened methods unmounted and records no assistance for simply displaying a question', () => {
  const progress = renderHook(useProgress);
  const before = progress.result.current.answers[question.id];
  const view = render(<QuestionRunner question={question} method={topic} />);
  expect(screen.getByRole('tab', { name: '方法' })).toBeTruthy();
  expect(view.container.querySelector('.topic-method')).toBeNull();
  expect(view.container.querySelector('svg.method-diagram')).toBeNull();
  expect(progress.result.current.answers[question.id]).toBe(before);
});
it('mounts a method once, preserves its step and answer across tab switches, and marks the submitted answer assisted', async () => {
  const submissions: { assisted: boolean; answers: Record<string, string> }[] = [];
  vi.stubGlobal('fetch', (input: string, init?: RequestInit) => {
    if (input.endsWith('/check')) submissions.push(JSON.parse(String(init?.body)));
    return app.request(new URL(input, 'http://localhost').href, init);
  });
  const result = vi.fn();
  const progress = renderHook(useProgress);
  const view = render(<QuestionRunner question={question} method={topic} onResult={result} />);
  const fields = question.fields.filter((field) => field.fixedValue === undefined);
  for (const field of fields)
    fireEvent.change(screen.getByLabelText(field.label), {
      target: { value: source.expected[field.key] },
    });
  fireEvent.keyDown(screen.getByRole('tab', { name: '方法' }), { key: 'Enter' });
  expect(screen.getByRole('img', { name: storyboard.frames[0].title })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: '下一步' }));
  const diagram = view.container.querySelector('svg.method-diagram');
  const assistedAt = progress.result.current.answers[question.id]?.date;
  expect(screen.getByRole('img', { name: storyboard.frames[1].title })).toBeTruthy();
  fireEvent.keyDown(screen.getByRole('tab', { name: '作答' }), { key: 'Enter' });
  expect(view.container.querySelector('svg.method-diagram')).toBe(diagram);
  for (const field of fields)
    expect((screen.getByLabelText(field.label) as HTMLInputElement).value).toBe(
      source.expected[field.key],
    );
  fireEvent.keyDown(screen.getByRole('tab', { name: '方法' }), { key: 'Enter' });
  expect(screen.getByRole('img', { name: storyboard.frames[1].title })).toBeTruthy();
  expect(view.container.querySelector('svg.method-diagram')).toBe(diagram);
  expect(progress.result.current.answers[question.id]?.date).toBe(assistedAt);
  fireEvent.keyDown(screen.getByRole('tab', { name: '作答' }), { key: 'Enter' });
  fireEvent.click(screen.getByRole('button', { name: '核对答案' }));
  await waitFor(() => expect(result).toHaveBeenLastCalledWith('correct', true));
  expect(submissions).toHaveLength(1);
  expect(submissions[0].assisted).toBe(true);
});
it('immediately mounts the method when restoring a draft whose active view is method', () => {
  const progress = renderHook(useProgress);
  const before = progress.result.current.answers[question.id];
  writeDraft(currentLearningOwner(), `question:${question.id}`, {
    answers: {},
    hint: false,
    usedHelp: true,
    revealed: false,
    view: 'method',
  });
  const view = render(<QuestionRunner question={question} method={topic} />);
  expect(screen.getByRole('img', { name: storyboard.frames[0].title })).toBeTruthy();
  expect(view.container.querySelectorAll('svg.method-diagram')).toHaveLength(1);
  expect(progress.result.current.answers[question.id]).toBe(before);
});
