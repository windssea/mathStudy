// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { practice, publicQuestion, questions } from '@mathstudy/content';
import QuestionRunner from '../apps/web/src/components/QuestionRunner';
import { clearPracticeDrafts } from '../apps/web/src/lib/practice-drafts';

afterEach(() => {
  cleanup();
  clearPracticeDrafts();
});

it.each([
  { topic: 'u4-budget', question: 'bank-u4-budget-01', expected: /买4本本子/, irrelevant: /租车/ },
  { topic: 'u2-cut', question: 'full-p01-s3-q1-3', expected: /凸起/, irrelevant: /剪去/ },
])('opens a related example for $question rather than the broad topic default', (sample) => {
  const question = publicQuestion(questions.find((item) => item.id === sample.question)!);
  const topic = practice.topics.find((item) => item.id === sample.topic)!;
  const { container } = render(<QuestionRunner question={question} method={topic} />);
  fireEvent.keyDown(screen.getByRole('tab', { name: '方法' }), { key: 'Enter' });
  expect(container.querySelector('.method-active-prompt')?.textContent).toMatch(sample.expected);
  expect(container.querySelector('.method-active-prompt')?.textContent).not.toMatch(
    sample.irrelevant,
  );
  expect(
    within(screen.getByRole('region', { name: `${topic.title}方法卡` })).getByRole('img'),
  ).toBeTruthy();
});
