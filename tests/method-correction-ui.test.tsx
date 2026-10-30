// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { methodStory } from '@mathstudy/animation-engine';
import MethodDemonstration from '../apps/web/src/components/MethodDemonstration';

afterEach(cleanup);
function openCheck() {
  const story = methodStory('u1-remainder', 'full-p11-s2-q2')!;
  render(
    <MethodDemonstration topicId="u1-remainder" questionId="full-p11-s2-q2" title="余数与验算" />,
  );
  for (let i = 1; i < story.frames.length; i++)
    fireEvent.click(screen.getByRole('button', { name: '下一步' }));
  fireEvent.click(screen.getByRole('button', { name: '易错对照' }));
  return story;
}

it('shows a concrete wrong grouping and repairs it without rewriting the student choice', () => {
  const story = openCheck();
  fireEvent.click(screen.getByRole('button', { name: story.mistake.wrong }));
  expect(
    screen.getByRole('img').getAttribute('aria-label') ?? screen.getByRole('img').textContent,
  ).toContain('错误示范');
  expect(screen.getByRole('img').querySelectorAll('rect')).toHaveLength(36);
  const repair = screen.getByRole('button', { name: '看图订正' });
  expect(document.activeElement).toBe(repair);
  fireEvent.click(repair);
  expect(screen.getByRole('img').querySelectorAll('rect')).toHaveLength(1);
  expect(screen.getByText(`你选了：${story.mistake.wrong}`)).toBeTruthy();
  expect(screen.getByRole('status').textContent).toContain('看图找原因');
  fireEvent.click(screen.getByRole('button', { name: '对照错法' }));
  expect(screen.getByRole('img').querySelectorAll('rect')).toHaveLength(36);
});

it('keeps a correct answer correct while inspecting the alternative wrong model', () => {
  const story = openCheck();
  fireEvent.click(screen.getByRole('button', { name: story.mistake.right }));
  fireEvent.click(screen.getByRole('button', { name: '对照错法' }));
  expect(screen.getByRole('status').textContent).toContain('判断正确');
  expect(screen.getByText(`你选了：${story.mistake.right}`)).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: '重选' }));
  expect(screen.queryByRole('status')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: story.mistake.wrong }));
  fireEvent.click(screen.getByRole('button', { name: '换一组数试试' }));
  expect(screen.queryByRole('status')).toBeNull();
  expect(screen.queryByRole('img')).toBeNull();
  expect(screen.getByText(story.transfer!.question)).toBeTruthy();
  expect(screen.queryByText(story.prompt)).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: story.transfer!.right }));
  expect(screen.getByRole('img').textContent).toContain('45');
});

it('withholds the conclusion graph until a choice and hides it again on reselect', () => {
  const story = openCheck();
  expect(screen.queryByRole('img')).toBeNull();
  expect(screen.getByText(story.mistake.question)).toBeTruthy();
  const question = screen.getByText(story.mistake.question);
  expect(screen.getByRole('group', { name: '易错判断' }).getAttribute('aria-describedby')).toBe(
    question.id,
  );
  expect(screen.queryByText(story.prompt)).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: story.mistake.right }));
  expect(screen.getByRole('img')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: '重选' }));
  expect(screen.queryByRole('img')).toBeNull();
  expect(document.activeElement?.closest('.mistake-options')).toBeTruthy();
});
