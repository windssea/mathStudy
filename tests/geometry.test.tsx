// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, act } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  areaPairs,
  cornerCutMetrics,
  perimeterPairs,
  rectangleMetrics,
  tilingMetrics,
} from '@mathstudy/math-core';
import GeometryLessonPlayer from '../apps/web/src/components/GeometryLessonPlayer';
import VisualExplanation from '../apps/web/src/components/VisualExplanation';
import { lessons, questions } from '@mathstudy/content';
import type { GeometryDemo } from '@mathstudy/contracts';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
const next = () => fireEvent.click(screen.getByRole('button', { name: '下一步' }));
function mount(id: string) {
  const demo = lessons.find((l) => l.id === id)!.demo as GeometryDemo;
  const observed = vi.fn();
  const view = render(<GeometryLessonPlayer demo={demo} onExplored={observed} />);
  return { ...view, observed };
}
describe('geometry quantities and complete enumerations', () => {
  it('preserves area while changing the size of the measuring unit', () => {
    expect(tilingMetrics(8, 4, 1)).toMatchObject({ count: 32, tileArea: 1, area: 32 });
    expect(tilingMetrics(8, 4, 2)).toMatchObject({ count: 8, tileArea: 4, area: 32 });
    for (let a = 1; a <= 12; a++)
      for (let b = 1; b <= 10; b++) {
        const r = rectangleMetrics(a, b),
          t = tilingMetrics(a, b);
        expect(r.edges.reduce((s, n) => s + n, 0)).toBe(r.perimeter);
        expect(t.count * t.tileArea).toBe(r.area);
      }
    for (const args of [
      [0, 4, 1],
      [8, 4, 3],
      [1.5, 4, 1],
      [8, 4, 0],
    ])
      expect(() => tilingMetrics(...(args as [number, number, number]))).toThrow(RangeError);
  });
  it('enumerates every integer pair once and proves the extrema through comparison', () => {
    const perimeter = perimeterPairs(24),
      area = areaPairs(36);
    expect(perimeter.map((p) => [p.length, p.width])).toEqual([
      [11, 1],
      [10, 2],
      [9, 3],
      [8, 4],
      [7, 5],
      [6, 6],
    ]);
    expect(area.map((p) => [p.length, p.width])).toEqual([
      [36, 1],
      [18, 2],
      [12, 3],
      [9, 4],
      [6, 6],
    ]);
    expect(Math.max(...perimeter.map((p) => p.area))).toBe(36);
    expect(Math.min(...area.map((p) => p.perimeter))).toBe(24);
    expect(perimeter.every((p) => p.perimeter === 24)).toBe(true);
    expect(area.every((p) => p.area === 36)).toBe(true);
    expect(() => perimeterPairs(23)).toThrow(RangeError);
    expect(() => areaPairs(-36)).toThrow(RangeError);
  });
  it('removes the corner area while replacing equal boundary lengths', () => {
    expect(cornerCutMetrics(12, 12, 4, 3)).toEqual({
      removedArea: 12,
      remainingArea: 132,
      perimeter: 48,
    });
    expect(() => cornerCutMetrics(12, 12, 12, 3)).toThrow(RangeError);
  });
});
describe('unit-two manipulatives', () => {
  it('records each edge without double counting, then unfolds to equal-length segments', () => {
    const { container, observed } = mount('U02-L02');
    for (let i = 1; i <= 4; i++)
      fireEvent.click(screen.getByRole('button', { name: new RegExp(`测量第${i}条边`) }));
    fireEvent.click(screen.getByRole('button', { name: /测量第1条边/ }));
    expect(screen.getByText('4 / 4 条边已记录')).toBeTruthy();
    expect(screen.getByText(/起点对准0刻度，终点读6厘米/)).toBeTruthy();
    next();
    expect(screen.getByText('6＋4＋6＋4＝20 厘米')).toBeTruthy();
    const segments = [...container.querySelectorAll('line[y1="267"]')];
    expect(
      segments.map((line) => Number(line.getAttribute('x2')) - Number(line.getAttribute('x1'))),
    ).toEqual([156, 104, 156, 104]);
    next();
    expect(observed).toHaveBeenLastCalledWith(true);
    fireEvent.change(screen.getByRole('combobox', { name: '选择测量图形' }), {
      target: { value: 'triangle' },
    });
    expect(observed).toHaveBeenLastCalledWith(false);
    expect(screen.getAllByRole('button', { name: /测量第/ })).toHaveLength(3);
    next();
    next();
    expect(screen.getByText('4＋5＋3＝12 厘米')).toBeTruthy();
  });
  it('builds a row, all rows, and the formula; backward replay and parameter changes stay synchronized', () => {
    const { container, observed } = mount('U02-L05');
    fireEvent.click(screen.getByRole('button', { name: '铺一排' }));
    expect(screen.getByRole('img').getAttribute('aria-label')).toContain('已铺8格');
    fireEvent.click(screen.getByRole('button', { name: '铺满方格' }));
    expect(screen.getByRole('img').getAttribute('aria-label')).toContain('已铺40格');
    next();
    expect(screen.getByText('S = 8 × 5 = 40 平方厘米')).toBeTruthy();
    expect(observed).toHaveBeenLastCalledWith(true);
    fireEvent.click(screen.getByRole('button', { name: '上一步' }));
    fireEvent.click(screen.getByRole('button', { name: '上一步' }));
    expect(screen.getByRole('img').getAttribute('aria-label')).toContain('已铺8格');
    fireEvent.change(screen.getByRole('slider', { name: '长' }), { target: { value: '10' } });
    expect(screen.getByRole('img').getAttribute('aria-label')).toContain('已铺0格');
    expect(observed).toHaveBeenLastCalledWith(false);
    next();
    next();
    next();
    expect(screen.getByText('S = 10 × 5 = 50 平方厘米')).toBeTruthy();
    expect(container.querySelectorAll('.unit-tile')).toHaveLength(50);
  });
  it('keeps the same physical rectangle when one large tile replaces four small tiles', () => {
    const { container } = mount('U02-L04');
    fireEvent.click(screen.getByRole('button', { name: '铺满方格' }));
    const outline = container.querySelector('.rectangle-canvas > rect')!;
    const width = outline.getAttribute('width'),
      height = outline.getAttribute('height');
    expect(screen.getByRole('img').getAttribute('aria-label')).toContain('已铺32格');
    fireEvent.click(screen.getByRole('button', { name: '边长 2 厘米的方格' }));
    fireEvent.click(screen.getByRole('button', { name: '铺满方格' }));
    expect(screen.getByRole('img').getAttribute('aria-label')).toContain('已铺8格');
    expect(screen.getByText('1格＝4平方厘米')).toBeTruthy();
    expect(outline.getAttribute('width')).toBe(width);
    expect(outline.getAttribute('height')).toBe(height);
    next();
    expect(screen.getByText(/面积仍是32平方厘米/)).toBeTruthy();
  });
  it('derives the conversion factor with ten rows of ten and resets on a unit change', () => {
    mount('U02-L06');
    next();
    expect(screen.getByRole('img').getAttribute('aria-label')).toContain('已铺10格');
    next();
    expect(screen.getByRole('img').getAttribute('aria-label')).toContain('已铺100格');
    next();
    expect(screen.getByText(/1平方分米＝1×100＝100平方厘米/)).toBeTruthy();
    fireEvent.change(screen.getByRole('combobox', { name: '选择面积单位换算' }), {
      target: { value: 'm' },
    });
    fireEvent.change(screen.getByRole('slider', { name: '大单位数量' }), {
      target: { value: '3' },
    });
    next();
    next();
    next();
    expect(screen.getByText(/3平方米＝3×100＝300平方分米/)).toBeTruthy();
  });
  it('compares all pairs under either invariant and keeps the drawing proportional', () => {
    const { container } = mount('A01-L01');
    expect(screen.getAllByRole('button', { name: /观察长/ })).toHaveLength(6);
    next();
    next();
    expect(screen.getByRole('img').getAttribute('aria-label')).toContain('长6厘米、宽6厘米');
    const square = container.querySelector('.rectangle-canvas > rect')!;
    expect(square.getAttribute('width')).toBe(square.getAttribute('height'));
    fireEvent.click(screen.getByRole('button', { name: '固定面积 36 平方厘米' }));
    expect(screen.getAllByRole('button', { name: /观察长/ })).toHaveLength(5);
    fireEvent.click(screen.getByRole('button', { name: '观察长9厘米宽4厘米的图形' }));
    expect(screen.getByRole('img').getAttribute('aria-label')).toContain('长9厘米、宽4厘米');
    expect(screen.getByText(/周长26厘米，面积36平方厘米/)).toBeTruthy();
  });
  it('plays, pauses, exposes complete static explanations, and resets without stale completion', () => {
    vi.useFakeTimers();
    const { observed } = mount('U02-L05');
    fireEvent.click(screen.getByRole('button', { name: '播放演示' }));
    act(() => {
      vi.advanceTimersByTime(2600);
    });
    expect(screen.getByRole('img').getAttribute('aria-label')).toContain('已铺8格');
    fireEvent.click(screen.getByRole('button', { name: '暂停演示' }));
    act(() => {
      vi.advanceTimersByTime(5200);
    });
    expect(screen.getByRole('img').getAttribute('aria-label')).toContain('已铺8格');
    fireEvent.click(screen.getByRole('button', { name: '查看静态步骤' }));
    expect(screen.getAllByRole('listitem')).toHaveLength(4);
    expect(observed).toHaveBeenLastCalledWith(true);
    fireEvent.click(screen.getByRole('button', { name: '返回动态演示' }));
    fireEvent.click(screen.getByRole('button', { name: '重置几何演示' }));
    expect(observed).toHaveBeenLastCalledWith(false);
    expect(screen.getByRole('img').getAttribute('aria-label')).toContain('已铺0格');
  });
  it('renders the corner cut only after locating the missing part, with a square original shape', () => {
    const { container } = render(
      <VisualExplanation visual={questions.find((q) => q.id === 'u2-08')!.explanation.visual!} />,
    );
    expect(screen.getByRole('img').querySelectorAll('rect')).toHaveLength(0);
    const outline = screen
      .getByRole('img')
      .querySelector('path')!
      .getAttribute('d')!
      .match(/[\d.]+/g)!
      .map(Number);
    expect(outline[2] - outline[0]).toBe(outline[3] - outline[1]);
    next();
    expect(screen.getByText('4×3=12')).toBeTruthy();
    next();
    expect(screen.getByText('132 平方厘米')).toBeTruthy();
    expect(screen.getByRole('img').querySelector('path')!.getAttribute('d')).toContain('V');
  });
});
