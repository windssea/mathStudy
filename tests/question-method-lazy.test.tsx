// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { practice, publicQuestion, questions } from '@mathstudy/content';
import { methodStory } from '@mathstudy/animation-engine';
import QuestionRunner from '../apps/web/src/components/QuestionRunner';
import {
  clearPracticeDrafts,
  questionDraftSchema,
  readDraft,
  writeDraft,
} from '../apps/web/src/lib/practice-drafts';
import { currentLearningOwner, useProgress } from '../apps/web/src/lib/progress';
import { app } from '../apps/web/worker';

const topic = practice.topics.find((item) => item.id === 'u1-mental')!;
const source = questions.find((item) => item.id === topic.questionIds[0])!;
const question = publicQuestion(source);
const storyboard = methodStory(topic.id, question.id)!;
const ageSource = questions.find((item) => item.id === 'full-p06-s3-q2')!;
const ageQuestion = publicQuestion(ageSource);
const ageTopic = practice.topics.find((item) => item.id === 'u1-units')!;
afterEach(() => {
  cleanup();
  clearPracticeDrafts();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it('leaves unopened methods unmounted and records no assistance for simply displaying a question', () => {
  const progress = renderHook(useProgress);
  const before = progress.result.current.answers[question.id];
  const view = render(<QuestionRunner question={question} method={topic} />);
  expect(screen.getByRole('tab', { name: '方法' })).toBeTruthy();
  expect(view.container.querySelector('.topic-method')).toBeNull();
  expect(view.container.querySelector('svg.method-diagram')).toBeNull();
  expect(progress.result.current.answers[question.id]).toBe(before);
});

it('does not activate assistance when keyboard focus reaches the method tab', () => {
  const progress = renderHook(useProgress);
  const before = progress.result.current.answers[question.id];
  const view = render(<QuestionRunner question={question} method={topic} />);
  const method = screen.getByRole('tab', { name: '方法' });
  act(() => method.focus());
  expect(method.getAttribute('aria-selected')).toBe('false');
  expect(view.container.querySelector('.topic-method')).toBeNull();
  expect(progress.result.current.answers[question.id]).toBe(before);
  fireEvent.keyDown(method, { key: 'Enter' });
  expect(screen.getByRole('img', { name: storyboard.frames[0].title })).toBeTruthy();
});
it('mounts a method once, preserves its step and answer across tab switches, and marks the submitted answer assisted', async () => {
  const submissions: { assisted: boolean; answers: Record<string, string> }[] = [];
  vi.stubGlobal('fetch', (input: string, init?: RequestInit) => {
    if (input.endsWith('/check')) submissions.push(JSON.parse(String(init?.body)));
    return app.request(new URL(input, 'http://localhost').href, init);
  });
  const result = vi.fn();
  const progress = renderHook(useProgress);
  const view = render(<QuestionRunner question={question} method={topic} onResult={result} />);
  const fields = question.fields.filter((field) => field.fixedValue === undefined);
  for (const field of fields)
    fireEvent.change(screen.getByLabelText(field.label), {
      target: { value: source.expected[field.key] },
    });
  fireEvent.keyDown(screen.getByRole('tab', { name: '方法' }), { key: 'Enter' });
  expect(screen.getByRole('img', { name: storyboard.frames[0].title })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: '下一步' }));
  const diagram = view.container.querySelector('svg.method-diagram');
  const assistedAt = progress.result.current.answers[question.id]?.date;
  expect(screen.getByRole('img', { name: storyboard.frames[1].title })).toBeTruthy();
  fireEvent.keyDown(screen.getByRole('tab', { name: '作答' }), { key: 'Enter' });
  expect(view.container.querySelector('svg.method-diagram')).toBe(diagram);
  for (const field of fields)
    expect((screen.getByLabelText(field.label) as HTMLInputElement).value).toBe(
      source.expected[field.key],
    );
  fireEvent.keyDown(screen.getByRole('tab', { name: '方法' }), { key: 'Enter' });
  expect(screen.getByRole('img', { name: storyboard.frames[1].title })).toBeTruthy();
  expect(view.container.querySelector('svg.method-diagram')).toBe(diagram);
  expect(progress.result.current.answers[question.id]?.date).toBe(assistedAt);
  fireEvent.keyDown(screen.getByRole('tab', { name: '作答' }), { key: 'Enter' });
  fireEvent.click(screen.getByRole('button', { name: '核对答案' }));
  await waitFor(() => expect(result).toHaveBeenLastCalledWith('correct', true));
  expect(submissions).toHaveLength(1);
  expect(submissions[0].assisted).toBe(true);
});
it('immediately mounts the method when restoring a draft whose active view is method', () => {
  const progress = renderHook(useProgress);
  const before = progress.result.current.answers[question.id];
  writeDraft(currentLearningOwner(), `question:${question.id}`, {
    answers: {},
    hint: false,
    usedHelp: true,
    revealed: false,
    view: 'method',
  });
  const view = render(<QuestionRunner question={question} method={topic} />);
  expect(screen.getByRole('img', { name: storyboard.frames[0].title })).toBeTruthy();
  expect(view.container.querySelectorAll('svg.method-diagram')).toHaveLength(1);
  expect(progress.result.current.answers[question.id]).toBe(before);
});

it('shows read-only original choices beside the question while the inline method is open', () => {
  render(<QuestionRunner question={ageQuestion} method={ageTopic} />);
  const reading = screen.getByRole('region', { name: '题目内容' });
  expect(within(reading).queryByRole('list', { name: '题目选项' })).toBeNull();
  const chosen = screen.getAllByRole('radio')[0] as HTMLInputElement;
  fireEvent.click(chosen);
  fireEvent.keyDown(screen.getByRole('tab', { name: '方法' }), { key: 'Enter' });
  const choices = within(reading).getByRole('list', { name: '题目选项' });
  expect(
    within(choices)
      .getAllByRole('listitem')
      .map((item) => item.textContent),
  ).toEqual(ageQuestion.options);
  expect(within(reading).queryByRole('radio')).toBeNull();
  expect(
    choices.querySelector('[aria-selected], [aria-checked], .selected, .is-picked'),
  ).toBeNull();
  fireEvent.keyDown(screen.getByRole('tab', { name: '作答' }), { key: 'Enter' });
  expect(within(reading).queryByRole('list', { name: '题目选项' })).toBeNull();
  expect(chosen.checked).toBe(true);
});

it.each([false, true])(
  'shows complete neutral choices in the focused reference without changing the MCQ draft (figure: %s)',
  async (withFigure) => {
    const figure = questions.find((item) => item.id === 'full-p01-s3-q1-3')!.promptImage!;
    const referenced = {
      ...ageQuestion,
      ...(withFigure ? { promptImage: figure } : {}),
    };
    render(<QuestionRunner question={referenced} method={ageTopic} />);
    const chosen = screen.getAllByRole('radio')[0] as HTMLInputElement;
    expect(chosen.value).not.toBe(ageSource.expected.value);
    fireEvent.click(chosen);
    const owner = currentLearningOwner();
    const draftId = `question:${ageQuestion.id}`;
    const before = readDraft(owner, draftId, questionDraftSchema)!.answers;
    expect(before).toEqual({ value: chosen.value });
    fireEvent.keyDown(screen.getByRole('tab', { name: '方法' }), { key: 'Enter' });
    fireEvent.click(screen.getByRole('button', { name: '放大演示' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).queryByRole('list', { name: '题目选项' })).toBeNull();
    fireEvent.click(within(dialog).getByRole('button', { name: '查看当前题目' }));
    const reference = within(dialog).getByRole('region', { name: '当前题目参照' });
    expect(within(reference).getByText(ageQuestion.stem)).toBeTruthy();
    const choices = within(reference).getByRole('list', { name: '题目选项' });
    expect(
      within(choices)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['540秒', '540时', '540日', '540周']);
    expect(reference.querySelector('input, button, [role="radio"], [role="option"]')).toBeNull();
    expect(
      reference.querySelector(
        '[aria-selected], [aria-checked], [data-correct], .selected, .is-picked',
      ),
    ).toBeNull();
    expect(within(reference).queryByText(/正确答案|答案是|已选/)).toBeNull();
    if (withFigure) expect(within(reference).getByRole('img', { name: figure.alt })).toBeTruthy();
    else expect(within(reference).queryByRole('img')).toBeNull();
    expect(readDraft(owner, draftId, questionDraftSchema)!.answers).toEqual(before);
    fireEvent.click(within(dialog).getByRole('button', { name: '分步图解' }));
    expect(within(dialog).queryByRole('list', { name: '题目选项' })).toBeNull();
    fireEvent.click(within(dialog).getByRole('button', { name: '收起演示' }));
    fireEvent.keyDown(screen.getByRole('tab', { name: '作答' }), { key: 'Enter' });
    expect(chosen.checked).toBe(true);
    expect(readDraft(owner, draftId, questionDraftSchema)!.answers).toEqual(before);
  },
);

it.each([
  { paneWidth: 420, canvasHeight: 250 },
  { paneWidth: 700, canvasHeight: 120 },
])(
  'uses a readable focus view for $paneWidth px panes / $canvasHeight px drawings and restores answer and step',
  async ({ paneWidth, canvasHeight }) => {
    const observers: (() => void)[] = [];
    const originalMeasure = HTMLElement.prototype.getBoundingClientRect;
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: HTMLElement,
    ) {
      return this.classList.contains('method-demo-shell')
        ? { ...originalMeasure.call(this), width: paneWidth, height: 500 }
        : originalMeasure.call(this);
    });
    vi.spyOn(SVGSVGElement.prototype, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      width: 350,
      height: canvasHeight,
      top: 0,
      bottom: canvasHeight,
      left: 0,
      right: 350,
      toJSON: () => ({}),
    });
    vi.stubGlobal(
      'ResizeObserver',
      class {
        connected = true;
        constructor(private callback: () => void) {}
        observe(element: Element) {
          if (element.classList.contains('method-demo-shell'))
            observers.push(() => {
              if (this.connected) this.callback();
            });
        }
        unobserve() {}
        disconnect() {
          this.connected = false;
        }
      },
    );
    render(<QuestionRunner question={question} method={topic} />);
    const field = question.fields.find((item) => item.fixedValue === undefined)!;
    fireEvent.change(screen.getByLabelText(field.label), { target: { value: '123' } });
    fireEvent.keyDown(screen.getByRole('tab', { name: '方法' }), { key: 'Enter' });
    act(() => observers.forEach((notify) => notify()));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: '方法要点与自查' }));
    const notes = within(dialog).getByRole('region', { name: '方法要点与自查' });
    expect(within(notes).getByText(storyboard.frames[0].why)).toBeTruthy();
    fireEvent.click(within(dialog).getByText('查看当前题目'));
    expect(within(dialog).getByRole('region', { name: '当前题目参照' }).textContent).toContain(
      question.stem,
    );
    expect(within(dialog).queryByRole('img')).toBeNull();
    fireEvent.click(within(dialog).getByRole('button', { name: '分步图解' }));
    fireEvent.click(within(dialog).getByRole('button', { name: '下一步' }));
    fireEvent.keyDown(dialog, { key: 'Escape', code: 'Escape' });
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
      expect(document.activeElement).toBe(screen.getByRole('tab', { name: '作答' }));
    });
    expect((screen.getByLabelText(field.label) as HTMLInputElement).value).toBe('123');
    fireEvent.keyDown(screen.getByRole('tab', { name: '方法' }), { key: 'Enter' });
    act(() => observers.forEach((notify) => notify()));
    const reopened = await screen.findByRole('dialog');
    expect(within(reopened).getByRole('img', { name: storyboard.frames[1].title })).toBeTruthy();
    fireEvent.click(within(reopened).getByRole('button', { name: '返回作答' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect((screen.getByLabelText(field.label) as HTMLInputElement).value).toBe('123');
  },
);
