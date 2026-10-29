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
