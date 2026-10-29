// @vitest-environment jsdom
import {
  act,
  cleanup,
  configure,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import App from '../apps/web/src/app/App';
import QuestionRunner from '../apps/web/src/components/QuestionRunner';
import { app } from '../apps/web/worker';
import { practice, publicQuestion, questions } from '@mathstudy/content';
import {
  clearPracticeDrafts,
  questionDraftSchema,
  readDraft,
  writeDraft,
} from '../apps/web/src/lib/practice-drafts';
import {
  currentLearningOwner,
  recordAnswer,
  refreshAccount,
  useProgress,
} from '../apps/web/src/lib/progress';
import { emptyLearning } from '@mathstudy/contracts';

configure({ asyncUtilTimeout: 5000 });
afterEach(() => {
  cleanup();
  clearPracticeDrafts();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
const problem = questions.find((q) => q.id === 'u4-03')!;
function wireChecks() {
  const attempts: { assisted: boolean }[] = [];
  vi.stubGlobal('fetch', (input: string, init?: RequestInit) => {
    if (input.endsWith('/check')) attempts.push(JSON.parse(String(init?.body)));
    return app.request(new URL(input, 'http://localhost').href, init);
  });
  return attempts;
}
function answer(value: string) {
  fireEvent.change(screen.getByRole('textbox'), { target: { value } });
  fireEvent.click(screen.getByRole('button', { name: '核对答案' }));
}
it('records a wrong answer followed by independent self-correction without marking fetched explanations as viewed', async () => {
  const attempts = wireChecks();
  const result = vi.fn();
  render(<QuestionRunner question={publicQuestion(problem)} onResult={result} />);
  const state = renderHook(useProgress);
  answer('8');
  await waitFor(() => expect(result).toHaveBeenLastCalledWith('incorrect', false));
  answer(problem.expected.value);
  await waitFor(() => expect(result).toHaveBeenLastCalledWith('correct', false));
  expect(attempts.map((a) => a.assisted)).toEqual([false, false]);
  expect(state.result.current.history[0]).toMatchObject({
    questionId: problem.id,
    correct: true,
    assisted: false,
  });
  expect(state.result.current.answers[problem.id].needsReview).toBe(false);
});
it('marks explicit explanation viewing after a wrong attempt as help for the next submission', async () => {
  const attempts = wireChecks();
  render(<QuestionRunner question={publicQuestion(problem)} />);
  answer('8');
  await screen.findByRole('button', { name: '展开解析' });
  fireEvent.click(screen.getByRole('button', { name: '展开解析' }));
  fireEvent.click(screen.getByRole('button', { name: '收起解析' }));
  answer(problem.expected.value);
  await screen.findByText('答对了。');
  expect(attempts.map((a) => a.assisted)).toEqual([false, true]);
});
it('updates the round result if help is opened after an independent correct submission', async () => {
  wireChecks();
  const result = vi.fn();
  render(<QuestionRunner question={publicQuestion(problem)} onResult={result} />);
  answer(problem.expected.value);
  await waitFor(() => expect(result).toHaveBeenLastCalledWith('correct', false));
  fireEvent.click(screen.getByRole('button', { name: '展开解析' }));
  expect(result).toHaveBeenLastCalledWith('correct', true);
});
it('restores the input, shown hint and grading when the same question remounts', async () => {
  wireChecks();
  const view = render(<QuestionRunner question={publicQuestion(problem)} />);
  fireEvent.click(screen.getByRole('button', { name: '提示' }));
  answer(problem.expected.value);
  await screen.findByText('答对了。');
  view.unmount();
  render(<QuestionRunner question={publicQuestion(problem)} />);
  expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe(problem.expected.value);
  expect(screen.getByRole('button', { name: '收起提示' })).toBeTruthy();
  expect(screen.getByText('答对了。')).toBeTruthy();
});
it('uses ordinary question typography for a repeated prose title and display typography only for a compact equation', () => {
  const question = publicQuestion(problem);
  const view = render(
    <QuestionRunner
      question={{
        ...question,
        title: '被除数和除数相同且不为0，商不一定是1',
        stem: '被除数和除数相同且不为0，商不一定是1。',
      }}
      standalone
    />,
  );
  expect(screen.getByRole('heading', { level: 1 }).className).toBe('question-stem-title');
  view.unmount();
  render(
    <QuestionRunner
      question={{ ...question, title: '235÷18', stem: '计算：235÷18。' }}
      standalone
    />,
  );
  expect(screen.getByRole('heading', { level: 1 }).className).toBe('question-equation-title');
});
function openPractice(path: string) {
  window.history.replaceState({}, '', path);
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  wireChecks();
  return render(<App />);
}
it('preserves the records source, including its filters and pages, through question navigation and the round result', async () => {
  const source = '/records?review=resolved&reviewPage=2&historyPage=3';
  openPractice(`/practice/topics/u1-mental?returnTo=${encodeURIComponent(source)}`);
  const jump = await screen.findByRole('combobox', { name: '跳转题目' });
  expect(screen.getByRole('link', { name: '返回' }).getAttribute('href')).toBe(source);
  fireEvent.change(jump, { target: { value: '7' } });
  expect(new URLSearchParams(window.location.search).get('returnTo')).toBe(source);
  fireEvent.click(screen.getByRole('button', { name: '跳过' }));
  expect(screen.getByRole('link', { name: '返回记录' }).getAttribute('href')).toBe(source);
  expect(new URLSearchParams(window.location.search).get('returnTo')).toBe(source);
});
it('restores the current question and its unsent draft across leaving the page and reloading', async () => {
  const topic = practice.topics.find((t) => t.id === 'u1-mental')!;
  let view = openPractice('/practice/topics/u1-mental');
  const jump = await screen.findByRole('combobox', { name: '跳转题目' });
  fireEvent.change(jump, { target: { value: '1' } });
  const secondId = topic.questionIds[1];
  fireEvent.change(screen.getByRole('textbox', { name: '得数' }), { target: { value: '321' } });
  expect(new URLSearchParams(window.location.search).get('question')).toBe(secondId);
  view.unmount();
  view = openPractice('/practice/topics/u1-mental');
  await screen.findByRole('combobox', { name: '跳转题目' });
  expect((screen.getByRole('textbox', { name: '得数' }) as HTMLInputElement).value).toBe('321');
  expect(new URLSearchParams(window.location.search).get('question')).toBe(secondId);
  fireEvent.click(screen.getByRole('link', { name: '练习记录' }));
  await screen.findByRole('heading', { name: /练习记录/ });
  act(() => {
    window.history.pushState({}, '', `/practice/topics/u1-mental?question=${topic.questionIds[0]}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  await screen.findByRole('combobox', { name: '跳转题目' });
  expect(screen.getByText('第 1 / 8 题')).toBeTruthy();
  act(() => {
    window.history.replaceState({}, '', `/practice/topics/u1-mental?question=${secondId}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  await waitFor(() =>
    expect((screen.getByRole('textbox', { name: '得数' }) as HTMLInputElement).value).toBe('321'),
  );
});
it('completes a short round and continues with new questions while retaining overall progress', async () => {
  openPractice('/practice/topics/u1-mental');
  await screen.findByRole('combobox', { name: '跳转题目' });
  expect(screen.getByText('第 1 / 8 题')).toBeTruthy();
  for (let i = 0; i < 8; i++) fireEvent.click(screen.getByRole('button', { name: '跳过' }));
  expect(screen.getByRole('heading', { name: '本轮完成' })).toBeTruthy();
  expect(screen.getByText(/已练 8 \/ /)).toBeTruthy();
  const topic = practice.topics.find((t) => t.id === 'u1-mental')!;
  fireEvent.click(screen.getByRole('button', { name: '继续练 8 题' }));
  expect(new URLSearchParams(window.location.search).get('question')).toBe(topic.questionIds[8]);
  expect(screen.getByText('第 1 / 8 题')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: '练全部' }));
  expect(screen.getByText(`第 9 / ${topic.questionIds.length} 题`)).toBeTruthy();
  act(() => {
    window.history.replaceState(
      {},
      '',
      `/practice/topics/u1-mental?question=${topic.questionIds[8]}`,
    );
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  await screen.findByText('第 1 / 8 题');
});
it('opens a fixed review queue and does not remove a question when it becomes correct during that round', async () => {
  const topic = practice.topics.find((t) => t.id === 'u1-mental')!;
  act(() => {
    recordAnswer(topic.questionIds[0], false, false);
    recordAnswer(topic.questionIds[1], false, false);
  });
  openPractice('/practice/topics/u1-mental?review=1');
  const jump = await screen.findByRole('combobox', { name: '跳转题目' });
  expect(jump.querySelectorAll('option')).toHaveLength(2);
  act(() => recordAnswer(topic.questionIds[0], true, false));
  expect(jump.querySelectorAll('option')).toHaveLength(2);
  expect(screen.getByText('第 1 / 2 题')).toBeTruthy();
});
it('does not count unvisited questions as completed after jumping to the end of a short round', async () => {
  openPractice('/practice/topics/u1-mental');
  const jump = await screen.findByRole('combobox', { name: '跳转题目' });
  fireEvent.change(jump, { target: { value: '7' } });
  fireEvent.click(screen.getByRole('button', { name: '跳过' }));
  expect(screen.getByText(/已练 1 \/ /)).toBeTruthy();
});
it('restores a fixed review pool, corrected answers and unsent drafts after refresh and continues to the remaining batch', async () => {
  const topic = practice.topics.find((t) => t.id === 'u1-mental')!;
  const queue = topic.questionIds.slice(0, 12);
  act(() => {
    for (const id of topic.questionIds) recordAnswer(id, true, false);
    for (const id of queue) recordAnswer(id, false, false);
  });
  let view = openPractice('/practice/topics/u1-mental?review=1');
  let jump = await screen.findByRole('combobox', { name: '跳转题目' });
  const first = questions.find((q) => q.id === queue[0])!;
  for (const field of first.fields.filter((f) => f.fixedValue === undefined))
    fireEvent.change(screen.getByLabelText(field.label), {
      target: { value: first.expected[field.key] },
    });
  fireEvent.click(screen.getByRole('button', { name: '核对答案' }));
  await screen.findByText('答对了。');
  fireEvent.click(screen.getByRole('button', { name: '下一题' }));
  fireEvent.change(screen.getByRole('textbox', { name: '得数' }), { target: { value: '333' } });
  let path = window.location.pathname + window.location.search;
  view.unmount();
  view = openPractice(path);
  jump = await screen.findByRole('combobox', { name: '跳转题目' });
  expect(jump.querySelectorAll('option')).toHaveLength(12);
  expect((screen.getByRole('textbox', { name: '得数' }) as HTMLInputElement).value).toBe('333');
  fireEvent.change(jump, { target: { value: '0' } });
  expect(screen.getByText('答对了。')).toBeTruthy();
  fireEvent.change(jump, { target: { value: '1' } });
  for (let i = 1; i < 8; i++) fireEvent.click(screen.getByRole('button', { name: '跳过' }));
  fireEvent.click(screen.getByRole('button', { name: '继续练 4 题' }));
  path = window.location.pathname + window.location.search;
  expect(new URLSearchParams(window.location.search).get('question')).toBe(queue[8]);
  view.unmount();
  openPractice(path);
  await screen.findByRole('combobox', { name: '跳转题目' });
  expect(screen.getByText('第 1 / 4 题')).toBeTruthy();
  expect(new URLSearchParams(window.location.search).get('question')).toBe(queue[8]);
});
it('rebuilds a fresh review queue from pending questions without reusing the old question draft', async () => {
  const topic = practice.topics.find((t) => t.id === 'u2-fence')!;
  const editable = topic.questionIds
    .map((id) => questions.find((q) => q.id === id)!)
    .find(
      (q) =>
        q.responseMode !== 'selfReview' &&
        !q.options &&
        !q.construction &&
        q.fields.filter((f) => f.fixedValue === undefined).length === 1,
    )!;
  act(() => {
    for (const id of topic.questionIds) recordAnswer(id, true, false);
  });
  let view = openPractice(`/practice/topics/${topic.id}?review=1`);
  await screen.findByText('这一组暂时没有待复习题。');
  expect(screen.queryByRole('combobox', { name: '跳转题目' })).toBeNull();
  view.unmount();
  act(() => recordAnswer(editable.id, false, false));
  view = openPractice(`/practice/topics/${topic.id}?review=1&fresh=1`);
  await screen.findByRole('combobox', { name: '跳转题目' });
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'private-draft' } });
  view.unmount();
  openPractice(`/practice/topics/${topic.id}?review=1&fresh=1`);
  await screen.findByRole('combobox', { name: '跳转题目' });
  expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('');
  expect(screen.getByText('第 1 / 1 题')).toBeTruthy();
});
it('restores the preceding batch result and all-question result when browser history changes', async () => {
  const topic = practice.topics.find((t) => t.id === 'u1-mental')!;
  openPractice('/practice/topics/u1-mental');
  await screen.findByRole('combobox', { name: '跳转题目' });
  for (let i = 0; i < 8; i++) fireEvent.click(screen.getByRole('button', { name: '跳过' }));
  const firstResult = window.location.pathname + window.location.search;
  fireEvent.click(screen.getByRole('button', { name: '继续练 8 题' }));
  fireEvent.click(screen.getByRole('button', { name: '练全部' }));
  fireEvent.change(screen.getByRole('combobox', { name: '跳转题目' }), {
    target: { value: String(topic.questionIds.length - 1) },
  });
  fireEvent.click(screen.getByRole('button', { name: '跳过' }));
  const allResult = window.location.pathname + window.location.search;
  fireEvent.click(screen.getByRole('button', { name: '重练这些题' }));
  act(() => {
    window.history.replaceState({}, '', firstResult);
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  await screen.findByRole('heading', { name: '本轮完成' });
  const reviewList = document.querySelector('.review-list')!;
  expect(reviewList.querySelector('a')?.getAttribute('href')).toBe(
    `/questions/${topic.questionIds[0]}`,
  );
  act(() => {
    window.history.replaceState({}, '', allResult);
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  await waitFor(() =>
    expect(document.querySelector('.result-numbers b')?.textContent).toBe(
      String(topic.questionIds.length),
    ),
  );
});
it('clears only scoped drafts on an identity change, including drafts saved on another page', async () => {
  const owner = currentLearningOwner();
  const draft = {
    answers: { value: 'private' },
    hint: false,
    usedHelp: false,
    revealed: false,
    view: 'answer',
  };
  writeDraft(owner, 'question:private', draft);
  localStorage.setItem('unrelated-learning-record', 'retained');
  vi.stubGlobal('fetch', (input: string) =>
    Promise.resolve(
      new Response(
        JSON.stringify({
          data: input.endsWith('/account')
            ? {
                user: { id: 'draft-test-user', name: 'Student', email: 'student@example.test' },
                available: true,
              }
            : { snapshot: emptyLearning(), acknowledged: [], serverTime: new Date().toISOString() },
        }),
        { headers: { 'Content-Type': 'application/json' } },
      ),
    ),
  );
  await refreshAccount();
  expect(currentLearningOwner()).toBe('draft-test-user');
  expect(readDraft(owner, 'question:private', questionDraftSchema)).toBeUndefined();
  expect(readDraft('draft-test-user', 'question:private', questionDraftSchema)).toBeUndefined();
  expect(localStorage.getItem('unrelated-learning-record')).toBe('retained');
  localStorage.removeItem('unrelated-learning-record');
});
