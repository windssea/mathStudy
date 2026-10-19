// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import ArithmeticLessonPlayer from '../apps/web/src/components/ArithmeticLessonPlayer';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
it('explains a wrong operation without advancing, calculates a valid branch and replays stable equations', () => {
  const done = vi.fn();
  render(
    <ArithmeticLessonPlayer
      demo={{ kind: 'operationOrder', exampleId: 'choir' }}
      onExplored={done}
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: '计算 18 + 18 × 2' }));
  expect(screen.getByRole('status').textContent).toContain('先算 18 × 2');
  expect(screen.getByRole('slider').getAttribute('value')).toBe('0');
  fireEvent.click(screen.getByRole('button', { name: '计算 18 × 2' }));
  expect(screen.getByLabelText('当前完整算式').textContent).toBe('18+36−6');
  fireEvent.click(screen.getByRole('button', { name: '下一步' }));
  fireEvent.click(screen.getByRole('button', { name: '下一步' }));
  expect(done).toHaveBeenLastCalledWith(true);
  fireEvent.click(screen.getByRole('button', { name: '上一步' }));
  expect(done).toHaveBeenLastCalledWith(false);
  expect(screen.getByLabelText('当前完整算式').textContent).toBe('54−6');
  fireEvent.change(screen.getByRole('combobox', { name: '选择演示例题' }), {
    target: { value: 'two-products' },
  });
  fireEvent.click(screen.getByRole('button', { name: '计算 2 × 17' }));
  expect(screen.getByLabelText('当前完整算式').textContent).toBe('240÷6−34');
  fireEvent.click(screen.getByRole('button', { name: '上一步' }));
  expect(screen.getByLabelText('当前完整算式').textContent).toBe('240÷6−2×17');
});
it('preserves brackets until their whole expression is reduced, and resets completion on example changes', () => {
  const done = vi.fn();
  render(
    <ArithmeticLessonPlayer
      demo={{ kind: 'nestedBrackets', exampleId: 'nested' }}
      onExplored={done}
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: '计算 81 − 56' }));
  expect(screen.getByLabelText('当前完整算式').textContent).toBe('525÷[25×3]');
  fireEvent.click(screen.getByRole('button', { name: '计算 25 × 3' }));
  expect(screen.getByLabelText('当前完整算式').textContent).toBe('525÷75');
  fireEvent.click(screen.getByRole('button', { name: '计算 525 ÷ 75' }));
  expect(done).toHaveBeenLastCalledWith(true);
  fireEvent.change(screen.getByRole('combobox', { name: '选择演示例题' }), {
    target: { value: 'inside-order' },
  });
  expect(done).toHaveBeenLastCalledWith(false);
  fireEvent.click(screen.getByRole('button', { name: '计算 20 − 78 ÷ 13' }));
  expect(screen.getByRole('status').textContent).toContain('先算 78 ÷ 13');
});
it('shows backward and forward analysis, rejects an invalid model and verifies conserved quantities', () => {
  const done = vi.fn();
  render(
    <ArithmeticLessonPlayer
      demo={{ kind: 'multiStepProblems', exampleId: 'books' }}
      onExplored={done}
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: '下一步' }));
  const backward = screen.getByRole('list', { name: '从问题倒推的分析过程' });
  expect(within(backward).getAllByRole('listitem')[0].textContent).toContain('包数');
  fireEvent.click(screen.getByRole('button', { name: '从条件推算' }));
  const forward = screen.getByRole('list', { name: '从条件推算的分析过程' });
  expect(within(forward).getAllByRole('listitem')[0].textContent).toContain('分出的本数');
  fireEvent.click(screen.getByRole('button', { name: '下一步' }));
  fireEvent.click(screen.getByRole('button', { name: '360 − 45 × 4 ÷ 30' }));
  expect(screen.getByRole('status').textContent).toContain('改变题意');
  expect(screen.getByRole('slider').getAttribute('value')).toBe('2');
  fireEvent.click(screen.getByRole('button', { name: '计算 45 × 4' }));
  expect(screen.getByText('分给各班：180本')).toBeTruthy();
  expect(screen.getByText('余下装包：待计算')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: '计算 360 − 180' }));
  expect(screen.getByText('余下装包：180本')).toBeTruthy();
  fireEvent.change(screen.getByRole('slider'), { target: { value: '6' } });
  expect(screen.getByRole('status').textContent).toContain('6×30＋45×4＝360');
  expect(screen.getByText('余下装包：180本')).toBeTruthy();
  expect(done).toHaveBeenLastCalledWith(true);
  fireEvent.change(screen.getByRole('combobox', { name: '选择演示例题' }), {
    target: { value: 'change' },
  });
  fireEvent.change(screen.getByRole('slider'), { target: { value: '2' } });
  fireEvent.click(screen.getByRole('button', { name: '300 − 48 × 3 − 36 × 2' }));
  expect(screen.getByRole('status').textContent).toContain('也正确');
  fireEvent.change(screen.getByRole('slider'), { target: { value: '7' } });
  expect(screen.getByRole('status').textContent).toContain('144＋72＋84＝300');
});
it('pauses playback and provides full static steps for reduced motion', () => {
  vi.useFakeTimers();
  const done = vi.fn();
  render(
    <ArithmeticLessonPlayer
      demo={{ kind: 'nestedBrackets', exampleId: 'nested' }}
      onExplored={done}
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: '播放演示' }));
  act(() => vi.advanceTimersByTime(2200));
  expect(screen.getByRole('slider').getAttribute('value')).toBe('1');
  fireEvent.click(screen.getByRole('button', { name: '暂停' }));
  act(() => vi.advanceTimersByTime(10000));
  expect(screen.getByRole('slider').getAttribute('value')).toBe('1');
  vi.stubGlobal('matchMedia', () => ({ matches: true }));
  fireEvent.click(screen.getByRole('button', { name: '播放演示' }));
  expect(screen.getByRole('heading', { name: '逐步阅读' })).toBeTruthy();
  expect(done).toHaveBeenLastCalledWith(true);
});
