// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import MethodDemonstration from '../apps/web/src/components/MethodDemonstration';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
it('pauses on demand, stops at the final frame, and does not keep playing in a hidden answer tab', () => {
  vi.useFakeTimers();
  const ui = render(<MethodDemonstration topicId="u2-fence" title="围栏与靠墙" />);
  fireEvent.click(screen.getByRole('button', { name: '播放演示' }));
  act(() => vi.advanceTimersByTime(6000));
  expect(screen.getByText('长 = 32 − 6 × 2 = 20 米')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: '暂停演示' }));
  act(() => vi.advanceTimersByTime(8000));
  expect(screen.getByText('长 = 32 − 6 × 2 = 20 米')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: '播放演示' }));
  ui.rerender(<MethodDemonstration topicId="u2-fence" title="围栏与靠墙" active={false} />);
  act(() => vi.advanceTimersByTime(8000));
  expect(screen.getByText('长 = 32 − 6 × 2 = 20 米')).toBeTruthy();
  ui.rerender(<MethodDemonstration topicId="u2-fence" title="围栏与靠墙" active />);
  fireEvent.click(screen.getByRole('button', { name: '播放演示' }));
  act(() => vi.advanceTimersByTime(6000));
  expect(screen.getByText('20 × 6 = 120 平方米')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: '暂停演示' }));
  expect(screen.getByText('20 × 6 = 120 平方米')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: '播放演示' }));
  act(() => vi.advanceTimersByTime(6000));
  act(() => vi.advanceTimersByTime(6000));
  act(() => vi.advanceTimersByTime(6000));
  expect(screen.getByRole('button', { name: '播放演示' })).toBeTruthy();
});

it('returns keyboard focus to the same enlarge button and keeps the current step after closing', async () => {
  render(<MethodDemonstration topicId="u1-remainder" title="余数与验算" />);
  fireEvent.click(screen.getByRole('button', { name: '下一步' }));
  const trigger = screen.getByRole('button', { name: '放大演示' });
  trigger.focus();
  fireEvent.click(trigger);
  const dialog = await screen.findByRole('dialog');
  expect(screen.getByRole('img', { name: '剩下的还能再组成一份' })).toBeTruthy();
  fireEvent.keyDown(dialog, { key: 'Escape', code: 'Escape' });
  await vi.waitFor(() => {
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });
  expect(screen.getByRole('img', { name: '剩下的还能再组成一份' })).toBeTruthy();
});

it('checks a new wall orientation after explaining the original mistake', () => {
  render(<MethodDemonstration topicId="u2-fence" title="围栏与靠墙" />);
  for (let i = 0; i < 4; i++) fireEvent.click(screen.getByRole('button', { name: '下一步' }));
  fireEvent.click(screen.getByRole('button', { name: '易错对照' }));
  expect(screen.queryByRole('button', { name: '换一组数试试' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: '不是，只是另外三边' }));
  fireEvent.click(screen.getByRole('button', { name: '换一组数试试' }));
  expect(screen.getByRole('img', { name: /换个靠墙方向/ })).toBeTruthy();
  expect(screen.queryByRole('status')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: '28 米：10 + 10 + 8' }));
  expect(screen.getByRole('status').textContent).toContain('不能照抄');
});

it('selects the question subskill and resets a longer previous story safely', () => {
  const ui = render(<MethodDemonstration topicId="u1-remainder" title="余数与验算" />);
  for (let i = 0; i < 4; i++) fireEvent.click(screen.getByRole('button', { name: '下一步' }));
  ui.rerender(
    <MethodDemonstration topicId="u1-remainder" questionId="full-p11-s2-q2" title="余数与验算" />,
  );
  expect(screen.getByRole('img', { name: '总数和每份量一样大' })).toBeTruthy();
  expect(screen.getByRole('button', { name: '上一步' }).hasAttribute('disabled')).toBe(true);
  ui.rerender(
    <MethodDemonstration topicId="u1-remainder" questionId="full-p09-s1-q6" title="余数与验算" />,
  );
  expect(screen.getByRole('img', { name: '剩下 14 个，就还能再分一份' })).toBeTruthy();
});
