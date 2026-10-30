// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import DemoPlayer from '../apps/web/src/components/DemoPlayer';
import VisualExplanation from '../apps/web/src/components/VisualExplanation';
import {
  useProgress,
  recordAnswer,
  visitLesson,
  completeLesson,
} from '../apps/web/src/lib/progress';
import { questions } from '@mathstudy/content';

afterEach(cleanup);
describe('learning UI and subscriptions', () => {
  it('updates multiple progress subscribers without reentrant notification loops', () => {
    let renders = 0;
    const a = renderHook(() => {
      if (++renders > 30) throw new Error('Subscription loop');
      return useProgress();
    });
    const b = renderHook(() => useProgress());
    act(() => {
      visitLesson('U01-L03');
      completeLesson('U01-L03');
      recordAnswer('u1-07', false, false);
    });
    expect(a.result.current.lastLessonId).toBe('U01-L03');
    expect(b.result.current.completed).toContain('U01-L03');
    act(() => recordAnswer('u1-07', true, false));
    expect(a.result.current.answers['u1-07'].independentCorrect).toBe(false);
    act(() => recordAnswer('u1-08', true, false));
    expect(b.result.current.answers['u1-08'].independentCorrect).toBe(true);
    expect(renders).toBeLessThan(15);
  });
  it('keeps the zero in the quotient correctly aligned through forward/backward playback', () => {
    const observed = vi.fn();
    const view = render(
      <DemoPlayer
        demo={{ kind: 'longDivision', dividend: 612, divisor: 30 }}
        onExplored={observed}
      />,
    );
    for (let i = 0; i < 8; i++) fireEvent.click(screen.getByRole('button', { name: '下一步' }));
    const svg = view.container.querySelector('svg.division-svg')!;
    const quotient = [...svg.querySelectorAll('text[y="70"]')];
    expect(quotient.map((t) => t.textContent)).toEqual(['2', '0']);
    expect(Number(quotient[1].getAttribute('x')) - Number(quotient[0].getAttribute('x'))).toBe(48);
    const state = svg.innerHTML;
    fireEvent.click(screen.getByRole('button', { name: '上一步' }));
    fireEvent.click(screen.getByRole('button', { name: '下一步' }));
    expect(svg.innerHTML).toBe(state);
    expect(observed).toHaveBeenLastCalledWith(true);
    fireEvent.change(screen.getByRole('combobox', { name: '选择演示例题' }), {
      target: { value: '156,12' },
    });
    expect(observed).toHaveBeenLastCalledWith(false);
    expect(view.container.querySelectorAll('text[y="70"]')).toHaveLength(0);
  });
  it('synchronizes a changed trial quotient with multiplication, remainder, and narration', () => {
    render(
      <DemoPlayer demo={{ kind: 'trial', dividend: 172, divisor: 28 }} onExplored={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole('button', { name: '下一步' }));
    fireEvent.click(screen.getByRole('button', { name: '下一步' }));
    expect(screen.getByText(/余下 32，不小于除数 28/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '把试商增大1' }));
    expect(screen.getByText('余下 4，小于除数 28，商 6 正合适。')).toBeTruthy();
    expect(screen.getByText('28 × 6 = 168')).toBeTruthy();
  });
  it.each(questions.filter((q) => q.difficulty === 'challenge'))(
    'renders every step of challenge $id without losing its mathematical context',
    (q) => {
      const v = q.explanation.visual!;
      render(<VisualExplanation visual={v} />);
      const diagram = () => screen.queryByRole('figure') ?? screen.getByRole('img');
      for (let i = 0; i < v.captions.length; i++) {
        expect(diagram().getAttribute('aria-label')).toContain(v.captions[i]);
        if (i < v.captions.length - 1)
          fireEvent.click(screen.getByRole('button', { name: '下一步' }));
      }
      expect((screen.getByRole('button', { name: '下一步' }) as HTMLButtonElement).disabled).toBe(
        true,
      );
      fireEvent.click(screen.getByRole('button', { name: '上一步' }));
      expect(diagram().getAttribute('aria-label')).toContain(v.captions.at(-2));
    },
  );
});
