// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import MethodDiagram from '../apps/web/src/components/MethodDiagram';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

it('keeps actual text readable when a drawing is narrower than its coordinate space', () => {
  vi.spyOn(SVGSVGElement.prototype, 'getBoundingClientRect').mockReturnValue({
    x: 0,
    y: 0,
    width: 280,
    height: 280,
    top: 0,
    right: 280,
    bottom: 280,
    left: 0,
    toJSON: () => ({}),
  });
  const { container } = render(
    <MethodDiagram
      label="比较每份量"
      nodes={[
        { kind: 'rect', x: 30, y: 60, w: 70, h: 60, tone: 'known', label: '18' },
        { kind: 'text', x: 200, y: 200, text: '每份18个', size: 18, tone: 'focus' },
      ]}
    />,
  );
  const actualScale = 280 / 400;
  for (const text of container.querySelectorAll('text')) {
    expect(Number(text.getAttribute('font-size')) * actualScale).toBeGreaterThanOrEqual(18);
  }
  expect(
    screen.getByRole('img', { name: '比较每份量' }).getAttribute('aria-describedby'),
  ).toBeTruthy();
});

it('moves a long label out of a narrow mathematical segment instead of shrinking it', () => {
  const { container } = render(
    <MethodDiagram
      label="完整份与余数"
      nodes={[
        { kind: 'rect', x: 30, y: 70, w: 300, h: 60, tone: 'known', label: '完整份 234' },
        { kind: 'rect', x: 334, y: 70, w: 16, h: 60, tone: 'warm', label: '余下 1 个' },
      ]}
    />,
  );
  expect(screen.getByRole('list', { name: '分块标注' }).textContent).toContain('余下 1 个');
  expect(container.querySelector('.diagram-label-marker')?.textContent).toBe('1');
  expect(
    container.querySelector('[data-node-label="余下 1 个"] text')?.getAttribute('font-size'),
  ).toBe('18');
});

it('keeps single place-value digits inside their slots on a tablet-sized canvas', () => {
  vi.spyOn(SVGSVGElement.prototype, 'getBoundingClientRect').mockReturnValue({
    x: 0,
    y: 0,
    width: 200,
    height: 125,
    top: 0,
    right: 200,
    bottom: 125,
    left: 0,
    toJSON: () => ({}),
  });
  const { container } = render(
    <MethodDiagram
      label="数位表"
      nodes={[{ kind: 'rect', x: 32, y: 70, w: 38, h: 70, tone: 'focus', label: '8' }]}
    />,
  );
  expect(screen.queryByRole('list', { name: '分块标注' })).toBeNull();
  const digit = container.querySelector('[data-node-label="8"] text')!;
  expect(digit.textContent).toBe('8');
  expect(Number(digit.getAttribute('font-size')) * 0.5).toBeGreaterThanOrEqual(18);
});
