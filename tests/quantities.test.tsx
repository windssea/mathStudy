// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { quantityRelation, purchaseChange, travelComparison } from '@mathstudy/math-core';
import { quantityFrames } from '@mathstudy/animation-engine';
import QuantityLessonPlayer from '../apps/web/src/components/QuantityLessonPlayer';
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
describe('multiplicative quantity relationships', () => {
  it('preserves multiplication and both inverse divisions across valid classroom ranges', () => {
    for (let unit = 1; unit <= 100; unit++)
      for (let count = 1; count <= 12; count++) {
        const result = quantityRelation(unit, count);
        expect(result.total / result.count).toBe(unit);
        expect(result.total / result.unitValue).toBe(count);
        expect(result.repeated.at(-1)).toBe(result.total);
      }
    for (const values of [
      [0, 3],
      [-1, 2],
      [3, 1.5],
      [Infinity, 1],
    ])
      expect(() => quantityRelation(...(values as [number, number]))).toThrow();
  });
  it('compares distance per equal time and conserves the purchase budget', () => {
    const trips = travelComparison([
      { name: '小明', distance: 280, time: 4 },
      { name: '小红', distance: 240, time: 4 },
      { name: '小刚', distance: 240, time: 3 },
    ]);
    expect(trips.map((t) => t.speed)).toEqual([70, 60, 80]);
    const purchase = purchaseChange(18, 3, 8, 70);
    expect(purchase).toEqual({ unitValue: 6, cost: 48, change: 22 });
    expect(purchase.cost + purchase.change).toBe(70);
    expect(() => travelComparison([{ name: '错误', distance: 5, time: 0 }])).toThrow();
  });
  it('creates replayable accumulation and inverse frames with paired units', () => {
    const frames = quantityFrames(8, 2, 'shopping', 'total');
    expect(frames.map((f) => f.groups)).toEqual([0, 1, 1, 2, 2]);
    expect(frames.at(-1)!.text).toContain('8 × 2 = 16');
    expect(quantityFrames(60, 3, 'journey', 'unit', true).at(-1)!.text).toContain('千米/时');
    expect(quantityFrames(70, 4, 'journey', 'count').at(-1)!.text).toContain('280 ÷ 70 = 4');
  });
  it('replays equal groups, switches the unknown and clears completion when parameters change', () => {
    const done = vi.fn();
    render(
      <QuantityLessonPlayer
        demo={{ kind: 'equalGroups', unitValue: 4, count: 3 }}
        onExplored={done}
      />,
    );
    fireEvent.change(screen.getByRole('slider', { name: '演示步骤' }), { target: { value: 5 } });
    expect(screen.getByText('4 × 3 = 12')).toBeTruthy();
    expect(done).toHaveBeenLastCalledWith(true);
    fireEvent.click(screen.getByRole('button', { name: '上一步' }));
    expect(done).toHaveBeenLastCalledWith(false);
    fireEvent.click(screen.getByRole('button', { name: '求每组人数' }));
    fireEvent.change(screen.getByRole('slider', { name: '演示步骤' }), { target: { value: 3 } });
    expect(screen.getByText('12÷3＝4（人）')).toBeTruthy();
    fireEvent.change(screen.getByRole('slider', { name: '组数' }), { target: { value: 5 } });
    expect(done).toHaveBeenLastCalledWith(false);
    expect(screen.getByRole('slider', { name: '演示步骤' }).getAttribute('value')).toBe('0');
  });
  it('switches shopping examples and derives all three unknowns', () => {
    render(
      <QuantityLessonPlayer
        demo={{ kind: 'shopping', unitValue: 8, count: 2 }}
        onExplored={() => {}}
      />,
    );
    fireEvent.change(screen.getByRole('combobox', { name: '购物情境' }), {
      target: { value: 'notebook' },
    });
    fireEvent.click(screen.getByRole('button', { name: '求数量' }));
    fireEvent.change(screen.getByRole('slider', { name: '演示步骤' }), { target: { value: 3 } });
    expect(screen.getByText('10 ÷ 2 = 5')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '查看静态步骤' }));
    expect(screen.getByRole('list')).toBeTruthy();
  });
  it('keeps a fixed route scale when speeds change and compares textbook trips fairly', () => {
    render(
      <QuantityLessonPlayer
        demo={{ kind: 'journey', unitValue: 70, count: 4 }}
        onExplored={() => {}}
      />,
    );
    fireEvent.change(screen.getByRole('slider', { name: '演示步骤' }), { target: { value: 3 } });
    expect(screen.getByRole('img').getAttribute('aria-label')).toContain('共140米');
    fireEvent.change(screen.getByRole('slider', { name: '速度' }), { target: { value: 80 } });
    expect(screen.getByRole('img').getAttribute('aria-label')).toContain('0到800米');
    expect(screen.getByRole('img').getAttribute('aria-label')).toContain('共0米');
    fireEvent.change(screen.getByRole('combobox', { name: '行进情境' }), {
      target: { value: 'compare' },
    });
    fireEvent.change(screen.getByRole('slider', { name: '演示步骤' }), { target: { value: 3 } });
    expect(screen.getByText('80米/分')).toBeTruthy();
    expect(screen.getByRole('img').getAttribute('aria-label')).toContain('0到320米');
  });
  it('selects useful conditions and visualizes equal return distances with different time partitions', () => {
    render(
      <QuantityLessonPlayer
        demo={{ kind: 'quantityProblems', unitValue: 6, count: 8 }}
        onExplored={() => {}}
      />,
    );
    for (const text of ['3本同样的笔记本共18元', '要买8本这样的笔记本', '带了70元'])
      fireEvent.click(screen.getByRole('button', { name: text }));
    expect(screen.getByRole('status').textContent).toContain('选对了');
    fireEvent.click(screen.getByRole('button', { name: '商店上午8时开门' }));
    expect(screen.getByRole('status').textContent).toContain('无关信息');
    fireEvent.change(screen.getByRole('slider', { name: '演示步骤' }), { target: { value: 3 } });
    expect(screen.getByText('70 − 48 = 22 元')).toBeTruthy();
    fireEvent.change(screen.getByRole('combobox', { name: '应用题情境' }), {
      target: { value: 'return' },
    });
    fireEvent.change(screen.getByRole('slider', { name: '演示步骤' }), { target: { value: 3 } });
    expect(screen.getByRole('img').getAttribute('aria-label')).toContain('同为240千米');
    expect(screen.getByText('240 ÷ 3 = 80 千米/时')).toBeTruthy();
    const bars = screen.getByRole('img').querySelectorAll('rect');
    expect(bars[0].getAttribute('width')).toBe(bars[1].getAttribute('width'));
  });
  it('respects reduced motion with a static alternative instead of autoplay', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    const done = vi.fn();
    render(
      <QuantityLessonPlayer
        demo={{ kind: 'shopping', unitValue: 8, count: 2 }}
        onExplored={done}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: '演示设置' }));
    fireEvent.click(screen.getByRole('button', { name: '播放演示' }));
    expect(screen.getByRole('button', { name: '返回动态演示' })).toBeTruthy();
    expect(done).toHaveBeenLastCalledWith(true);
  });
});
