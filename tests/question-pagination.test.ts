import { describe, expect, it } from 'vitest';
import { app } from '../apps/web/worker';

describe('bounded question browsing and history lookup', () => {
  it('paginates after filtering and clamps a page after filters shrink', async () => {
    const all = (await (await app.request('/api/v1/questions?unit=U04')).json()).data;
    const first = (
      await (await app.request('/api/v1/questions?unit=U04&page=1&pageSize=12')).json()
    ).data;
    const second = (
      await (await app.request('/api/v1/questions?unit=U04&page=2&pageSize=12')).json()
    ).data;
    expect(first.total).toBe(all.total);
    expect(first.items).toEqual(all.items.slice(0, 12));
    expect(second.items).toEqual(all.items.slice(12, 24));
    expect(JSON.stringify(first.items)).not.toContain('"expected"');
    expect(JSON.stringify(first.items)).not.toContain('"explanation"');
    const last = (
      await (await app.request('/api/v1/questions?unit=U04&page=999&pageSize=12')).json()
    ).data;
    expect(last.page).toBe(last.pageCount);
    expect(last.items).toEqual(all.items.slice((last.page - 1) * 12));
    expect(new TextEncoder().encode(JSON.stringify(first)).length).toBeLessThan(
      new TextEncoder().encode(JSON.stringify(all)).length / 2,
    );
  });
  it('returns only requested history IDs, including an explicitly empty selection', async () => {
    const response = await app.request(
      '/api/v1/questions?scope=history&ids=u1-01,u4-03,missing-id',
    );
    const { data } = await response.json();
    expect(data.items.map((q: { id: string }) => q.id).sort()).toEqual(['u1-01', 'u4-03']);
    expect(data.total).toBe(2);
    expect(
      (await (await app.request('/api/v1/questions?scope=history&ids=')).json()).data.items,
    ).toEqual([]);
  });
  it('filters real solving topics independently from answer format', async () => {
    const practice = (await (await app.request('/api/v1/practice')).json()).data;
    const topic = practice.topics.find((t: { id: string }) => t.id === 'u1-remainder');
    const { data } = await (
      await app.request('/api/v1/questions?topic=u1-remainder&page=1&pageSize=100')
    ).json();
    expect(data.items.map((q: { id: string }) => q.id).sort()).toEqual(
      [...topic.questionIds].sort(),
    );
  });
  it.each([
    'page=0',
    'page=1.5',
    'pageSize=0',
    'pageSize=101',
    'topic=unknown',
    `ids=${Array.from({ length: 101 }, (_, i) => `q${i}`).join(',')}`,
  ])('rejects invalid bounded query %s', async (query) => {
    expect((await app.request(`/api/v1/questions?${query}`)).status).toBe(400);
  });
});
