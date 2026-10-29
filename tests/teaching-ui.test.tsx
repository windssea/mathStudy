// @vitest-environment jsdom
import { cleanup, configure, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import App from '../apps/web/src/app/App';
import { app } from '../apps/web/worker';
import { practice, questions } from '@mathstudy/content';

configure({ asyncUtilTimeout: 5000 });
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
function open(
  path: string,
  onCheck?: (body: { assisted: boolean; answers: Record<string, string> }) => void,
) {
  window.history.replaceState({}, '', path);
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  vi.stubGlobal('fetch', (input: string, init?: RequestInit) => {
    if (input.endsWith('/check') && init?.body) onCheck?.(JSON.parse(String(init.body)));
    return app.request(new URL(input, 'http://localhost').href, init);
  });
  render(<App />);
}

it('connects sixth-unit categories, a worked method and practice without losing the selected unit', async () => {
  open('/?unit=U06');
  const heading = await screen.findByRole('heading', { name: '三位数乘两位数' });
  expect(screen.getByRole('heading', { name: '计算与规律探索' })).toBeTruthy();
  expect(screen.getByRole('combobox', { name: '作答形式' })).toBeTruthy();
  fireEvent.click(heading.closest('section')!.querySelector('button')!);
  const method = await screen.findByRole('region', { name: '三位数乘两位数方法卡' });
  expect(window.location.search).toContain('unit=U06');
  expect(window.location.search).toContain('method=u6-written');
  expect(method.querySelector('svg[role="img"]')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: '下一步' }));
  expect(screen.getByText('213 × 20 = 4260')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: '下一步' }));
  expect(screen.getByText('4260 + 852 = 5112')).toBeTruthy();
  fireEvent.click(screen.getByRole('link', { name: '练这类题' }));
  await screen.findByRole('button', { name: '核对答案' });
  expect(window.location.pathname).toBe('/practice/topics/u6-written');
});

it('preserves an answer while consulting the method and submits it as assisted, without requesting the current solution', async () => {
  let submitted: { assisted: boolean; answers: Record<string, string> } | undefined;
  open('/practice/topics/u6-written', (body) => {
    submitted = body;
  });
  const input = await screen.findByRole('textbox', { name: '你的答案' });
  const firstId = practice.topics.find((t) => t.id === 'u6-written')!.questionIds[0];
  const answer = questions.find((q) => q.id === firstId)!.expected.value;
  fireEvent.change(input, { target: { value: answer } });
  fireEvent.keyDown(screen.getByRole('tab', { name: '方法' }), { key: 'Enter' });
  await screen.findByRole('region', { name: '三位数乘两位数方法卡' });
  expect(screen.queryByRole('button', { name: '收起解析' })).toBeNull();
  fireEvent.keyDown(screen.getByRole('tab', { name: '作答' }), { key: 'Enter' });
  expect((screen.getByRole('textbox', { name: '你的答案' }) as HTMLInputElement).value).toBe(
    answer,
  );
  fireEvent.click(screen.getByRole('button', { name: '核对答案' }));
  await screen.findByText('答对了。');
  expect(submitted).toMatchObject({ assisted: true, answers: { value: answer } });
}, 15000);

it('explains an actual fence misconception, replays steps and supports an enlarged keyboard dialog', async () => {
  open('/?unit=U02&view=methods&method=u2-fence');
  await screen.findByRole('region', { name: '围栏与靠墙方法卡' });
  expect(screen.getByRole('img', { name: '先划掉不用围的那一边' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: '下一步' }));
  expect(screen.getByText('长 = 32 − 6 × 2 = 20 米')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: '下一步' }));
  fireEvent.click(screen.getByRole('button', { name: '下一步' }));
  fireEvent.click(screen.getByRole('button', { name: '下一步' }));
  fireEvent.click(screen.getByRole('button', { name: '易错对照' }));
  expect(screen.queryByText('正确的想法：不是，只是另外三边')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: '是，先算 32 ÷ 2' }));
  expect(screen.getByRole('status').textContent).toContain('靠墙的一边没有用围栏');
  fireEvent.click(screen.getByRole('button', { name: '不是，只是另外三边' }));
  expect(screen.getByRole('status').textContent).toContain('对，关键就在这里');
  fireEvent.click(screen.getByRole('button', { name: '放大演示' }));
  expect(await screen.findByRole('dialog')).toBeTruthy();
  fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape', code: 'Escape' });
  await vi.waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  fireEvent.click(screen.getByRole('button', { name: '重看图解' }));
  expect(screen.getByRole('img', { name: '先划掉不用围的那一边' })).toBeTruthy();
});
