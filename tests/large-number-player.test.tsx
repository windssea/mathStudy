// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import LargeNumberLessonPlayer from '../apps/web/src/components/LargeNumberLessonPlayer';
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
it('replays a carry chain and clears completion after changing the starting number', () => {
  const done = vi.fn();
  render(
    <LargeNumberLessonPlayer
      demo={{ kind: 'countingUnits', initialNumber: 9999 }}
      onExplored={done}
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: '下一步' }));
  expect(screen.getByRole('button', { name: '个位：10' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: '下一步' }));
  expect(screen.getByRole('button', { name: '个位：0' })).toBeTruthy();
  expect(screen.getByRole('button', { name: '十位：10' })).toBeTruthy();
  fireEvent.change(screen.getByRole('slider'), {
    target: { value: screen.getByRole('slider').getAttribute('max') },
  });
  expect(screen.getByRole('status').textContent).toContain('9999＋1＝10000');
  expect(done).toHaveBeenLastCalledWith(true);
  fireEvent.click(screen.getByRole('button', { name: '上一步' }));
  expect(done).toHaveBeenLastCalledWith(false);
  fireEvent.change(screen.getByRole('combobox', { name: '选择演示例题' }), {
    target: { value: '9000' },
  });
  expect(
    (screen.getByRole('combobox', { name: '本次添的计数单位' }) as HTMLSelectElement).value,
  ).toBe('3');
  expect(screen.getByRole('slider').getAttribute('value')).toBe('0');
});
it('reads zero-containing groups, edits places and checks writing without dropping zeros', () => {
  const done = vi.fn();
  render(
    <LargeNumberLessonPlayer
      demo={{ kind: 'numberClasses', initialNumber: 600080000 }}
      onExplored={done}
    />,
  );
  fireEvent.change(screen.getByRole('slider'), { target: { value: '3' } });
  expect(screen.getByText('六亿零八万')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: '练习写数' }));
  fireEvent.click(screen.getByRole('button', { name: '练习写数' }));
  expect(screen.getByText('请写出：六亿零八万')).toBeTruthy();
  fireEvent.change(screen.getByLabelText('写出阿拉伯数字'), { target: { value: '60080000' } });
  fireEvent.click(screen.getByRole('button', { name: '写到数位表' }));
  fireEvent.click(screen.getByRole('button', { name: '核对写数' }));
  expect(screen.getByRole('status').textContent).toContain('还不一致');
  fireEvent.change(screen.getByLabelText('写出阿拉伯数字'), { target: { value: '600080000' } });
  fireEvent.click(screen.getByRole('button', { name: '写到数位表' }));
  fireEvent.click(screen.getByRole('button', { name: '核对写数' }));
  expect(screen.getByRole('status').textContent).toContain('写对了');
  expect(done).toHaveBeenLastCalledWith(true);
  fireEvent.click(screen.getByRole('button', { name: '万位：8' }));
  fireEvent.change(screen.getByRole('combobox', { name: '改变选中数位的数字' }), {
    target: { value: '9' },
  });
  expect(done).toHaveBeenLastCalledWith(false);
});
it('highlights the first deciding comparison digit and handles equality', () => {
  render(
    <LargeNumberLessonPlayer
      demo={{ kind: 'largeReading', initialNumber: 78900000 }}
      onExplored={() => {}}
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: '比较大小' }));
  fireEvent.change(screen.getByRole('slider'), { target: { value: '2' } });
  expect(screen.getByRole('status').textContent).toContain('十万位');
  expect(document.querySelectorAll('.deciding-digit')).toHaveLength(2);
  fireEvent.change(screen.getByLabelText('右边的数'), { target: { value: '78900000' } });
  fireEvent.click(screen.getByRole('button', { name: '更新右边的数' }));
  fireEvent.change(screen.getByRole('slider'), { target: { value: '3' } });
  expect(screen.getByRole('status').textContent).toContain('78900000 = 78900000');
});
it('shows rounding midpoint and carry, exact rewrite, and inclusive/exclusive range probes', () => {
  const done = vi.fn();
  render(
    <LargeNumberLessonPlayer
      demo={{ kind: 'roundingNumbers', initialNumber: 384204 }}
      onExplored={done}
    />,
  );
  fireEvent.change(screen.getByRole('slider'), { target: { value: '3' } });
  expect(screen.getByRole('img').getAttribute('aria-label')).toContain('中点385000');
  expect(screen.getByRole('status').textContent).toContain('384204 ≈ 380000');
  fireEvent.change(screen.getByRole('combobox', { name: '选择演示例题' }), {
    target: { value: '49995000' },
  });
  fireEvent.change(screen.getByRole('slider'), { target: { value: '3' } });
  expect(screen.getByRole('status').textContent).toContain('5000万');
  fireEvent.change(screen.getByRole('combobox', { name: '选择演示例题' }), {
    target: { value: '1970000000' },
  });
  expect(
    (screen.getByRole('combobox', { name: '保留或改写的单位' }) as HTMLSelectElement).value,
  ).toBe('8');
  fireEvent.change(screen.getByRole('slider'), { target: { value: '3' } });
  expect(screen.getByRole('status').textContent).toContain('20亿');
  fireEvent.click(screen.getByRole('button', { name: '精确改写' }));
  fireEvent.change(screen.getByRole('combobox', { name: '选择演示例题' }), {
    target: { value: '32000000' },
  });
  fireEvent.change(screen.getByRole('slider'), { target: { value: '2' } });
  expect(screen.getByRole('status').textContent).toContain('32000000＝3200万');
  fireEvent.change(screen.getByLabelText('输入整数'), { target: { value: '32000001' } });
  fireEvent.click(screen.getByRole('button', { name: '写到数位表' }));
  fireEvent.change(screen.getByRole('slider'), { target: { value: '2' } });
  expect(screen.getByRole('status').textContent).toContain('不能直接写成整数万');
  fireEvent.click(screen.getByRole('button', { name: '反推整数范围' }));
  fireEvent.click(screen.getByRole('button', { name: '下边界前一个：354999' }));
  expect(screen.getByRole('status').textContent).toContain('不在目标范围内');
  fireEvent.click(screen.getByRole('button', { name: '下边界：355000' }));
  expect(screen.getByRole('status').textContent).toContain('在目标范围内');
  fireEvent.click(screen.getByRole('button', { name: '上边界后一个：365000' }));
  expect(screen.getByRole('status').textContent).toContain('370000');
  fireEvent.change(screen.getByRole('slider'), { target: { value: '3' } });
  expect(screen.getByRole('status').textContent).toContain('355000 ≤ 原数 ≤ 364999');
  const rangeImage = screen.getByRole('img');
  expect(rangeImage.querySelector('circle[fill="white"]')?.getAttribute('cy')).toBe('94');
  fireEvent.change(screen.getByLabelText('目标近似数（整万或整亿）'), {
    target: { value: '355000' },
  });
  fireEvent.click(screen.getByRole('button', { name: '写到数位表' }));
  expect(screen.getByRole('status').textContent).toContain('整数倍');
});
it('generates fixed-length library codes, decodes them and rejects duplicates or missing zeros', () => {
  render(
    <LargeNumberLessonPlayer
      demo={{ kind: 'numberEncoding', initialNumber: 202604030 }}
      onExplored={() => {}}
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: '下一步' }));
  expect(screen.getByLabelText('分段图书编号').textContent).toContain('030');
  fireEvent.change(screen.getByLabelText('另一本书的编号'), { target: { value: '202604030' } });
  fireEvent.click(screen.getByRole('button', { name: '检查重复' }));
  expect(screen.getByRole('status').textContent).toContain('编号重复');
  fireEvent.change(screen.getByLabelText('要解读的编号'), { target: { value: '2026430' } });
  fireEvent.click(screen.getByRole('button', { name: '解读编号' }));
  expect(screen.getByRole('status').textContent).toContain('须为9位');
  fireEvent.change(screen.getByLabelText('要解读的编号'), { target: { value: '202704031' } });
  fireEvent.click(screen.getByRole('button', { name: '解读编号' }));
  expect(screen.getByRole('status').textContent).toContain('2027年、4号书架、第31本');
});
it('pauses playback, resets review workspaces and uses static steps for reduced motion', () => {
  vi.useFakeTimers();
  const done = vi.fn();
  render(
    <LargeNumberLessonPlayer
      demo={{ kind: 'largeReview', initialNumber: 60020070 }}
      onExplored={done}
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: '播放演示' }));
  act(() => vi.advanceTimersByTime(2400));
  fireEvent.click(screen.getByRole('button', { name: '暂停' }));
  const saved = screen.getByRole('slider').getAttribute('value');
  act(() => vi.advanceTimersByTime(10000));
  expect(screen.getByRole('slider').getAttribute('value')).toBe(saved);
  vi.stubGlobal('matchMedia', () => ({ matches: true }));
  fireEvent.click(screen.getByRole('button', { name: '播放演示' }));
  expect(screen.getByRole('heading', { name: '完整静态步骤' })).toBeTruthy();
  expect(done).toHaveBeenLastCalledWith(true);
  fireEvent.change(screen.getByRole('combobox', { name: '综合实验' }), {
    target: { value: 'rounding' },
  });
  expect(done).toHaveBeenLastCalledWith(false);
  expect(screen.getByRole('heading', { name: '在数轴上理解近似数' })).toBeTruthy();
});
