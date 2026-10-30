// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { lessons, practice, publicQuestion, questions } from '@mathstudy/content';
import { gradeAnswers } from '@mathstudy/math-core';
import { questionSchema } from '@mathstudy/contracts';
import QuantityLessonPlayer from '../apps/web/src/components/QuantityLessonPlayer';
import VisualExplanation from '../apps/web/src/components/VisualExplanation';

afterEach(cleanup);

it('keeps table and equal-part labels as readable text when switching explanation steps', () => {
  const q = questions.find((q) => q.id === 'concept-u3-price-inverse')!;
  const { container } = render(<VisualExplanation visual={q.explanation.visual!} />);
  expect(screen.getByRole('table', { name: '数量关系表' })).toBeTruthy();
  expect(screen.getByRole('columnheader', { name: '总价' })).toBeTruthy();
  expect(screen.getByRole('cell', { name: '40元' })).toBeTruthy();
  expect(container.querySelector('svg[role="img"]')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: '下一步' }));
  const bars = screen.getByRole('group', { name: '数量条形图' });
  expect(bars.textContent).toBe('第1支8第2支8第3支8');
  expect(bars.querySelectorAll('.quantity-bar-track')).toHaveLength(3);
  expect(screen.queryByRole('table')).toBeNull();
});

it('connects six concept exercises to lessons, topics and deterministic grading', () => {
  const answers = {
    'equal-addends': { value: '1' },
    'two-divisions': { people: String(12 / 3), groups: String(12 / 4) },
    'price-reading': { value: '2' },
    'price-inverse': { price: String(40 / 5), count: String(24 / (40 / 5)) },
    'speed-reading': { value: '0' },
    'speed-inverse': { speed: String(350 / 5), time: String(560 / (350 / 5)) },
  };
  expect(questions.filter((q) => q.id.startsWith('concept-u3-'))).toHaveLength(6);
  for (const [id, expected] of Object.entries(answers)) {
    const q = questions.find((q) => q.id === `concept-u3-${id}`)!;
    expect(questionSchema.safeParse(q).success).toBe(true);
    expect(q.expected).toEqual(expected);
    expect(gradeAnswers(q, expected)).toBe(true);
    expect(gradeAnswers(q, Object.fromEntries(q.fields.map((f) => [f.key, '999'])))).toBe(false);
    expect(lessons.find((l) => l.id === q.lessonId)!.questionIds).toContain(q.id);
    expect(practice.topics.find((t) => t.id === q.topicIds![0])!.questionIds).toContain(q.id);
    expect(q.explanation.visual!.stages).toHaveLength(q.explanation.steps.length);
    expect(publicQuestion(q)).not.toHaveProperty('expected');
    expect(publicQuestion(q)).not.toHaveProperty('explanation');
  }
});

it('keeps the same twelve people while contrasting both meanings of division', () => {
  render(
    <QuantityLessonPlayer
      demo={{ kind: 'equalGroups', unitValue: 4, count: 3 }}
      onExplored={() => {}}
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: '每份量＝总量÷份数' }));
  const drawing = screen.getByRole('img');
  expect(drawing.querySelectorAll('circle')).toHaveLength(12);
  expect(drawing.querySelectorAll('rect')).toHaveLength(0);
  fireEvent.change(screen.getByRole('slider', { name: '演示步骤' }), { target: { value: 2 } });
  expect(screen.getByRole('img').querySelectorAll('rect')).toHaveLength(3);
  expect(screen.getByText('12÷3＝？')).toBeTruthy();
  fireEvent.change(screen.getByRole('slider', { name: '演示步骤' }), { target: { value: 3 } });
  expect(screen.getByText('12÷3＝4（人）')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: '份数＝总量÷每份量' }));
  expect(screen.getByRole('slider', { name: '演示步骤' }).getAttribute('value')).toBe('0');
  fireEvent.change(screen.getByRole('slider', { name: '演示步骤' }), { target: { value: 3 } });
  expect(screen.getByText('12÷4＝3（组）')).toBeTruthy();
  expect(screen.getByRole('img').querySelectorAll('circle')).toHaveLength(12);
});

it('reads and writes unit rates and follows parameter and scenario changes', () => {
  const { unmount } = render(
    <QuantityLessonPlayer
      demo={{ kind: 'shopping', unitValue: 8, count: 2 }}
      onExplored={() => {}}
    />,
  );
  expect(screen.getByText('八元每件')).toBeTruthy();
  fireEvent.change(screen.getByRole('combobox', { name: '购物情境' }), {
    target: { value: 'notebook' },
  });
  expect(screen.getByText('二元每件')).toBeTruthy();
  unmount();
  render(
    <QuantityLessonPlayer
      demo={{ kind: 'journey', unitValue: 70, count: 4 }}
      onExplored={() => {}}
    />,
  );
  expect(screen.getByText('七十米每分')).toBeTruthy();
  expect(screen.getByText('一分钟行70米')).toBeTruthy();
  fireEvent.change(screen.getByRole('combobox', { name: '行进情境' }), {
    target: { value: 'car' },
  });
  expect(screen.getByText('六十千米每时')).toBeTruthy();
  expect(screen.getByText('一小时行60千米')).toBeTruthy();
  fireEvent.change(screen.getByRole('combobox', { name: '行进情境' }), {
    target: { value: 'compare' },
  });
  expect(screen.queryByRole('region', { name: '数量关系图解' })).toBeNull();
});
