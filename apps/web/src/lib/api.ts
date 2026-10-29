import { useEffect, useState } from 'react';
import type { ApiEnvelope } from '@mathstudy/contracts';
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/v1${path}`, {
    credentials: 'same-origin',
    ...init,
    signal: init?.signal
      ? AbortSignal.any([init.signal, AbortSignal.timeout(15000)])
      : AbortSignal.timeout(15000),
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  const body = (await response.json()) as ApiEnvelope<T> & { error?: { message: string } };
  if (!response.ok)
    throw new ApiError(body.error?.message ?? '暂时无法加载，请稍后重试。', response.status);
  return body.data;
}
export function useRemote<T>(path: string | null) {
  const [state, setState] = useState<{ data?: T; error?: string; loading: boolean }>({
    loading: true,
  });
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (path === null) {
      setState({ loading: false });
      return;
    }
    const controller = new AbortController();
    setState({ loading: true });
    request<T>(path, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) setState({ data, loading: false });
      })
      .catch((e: Error) => {
        if (!controller.signal.aborted) setState({ error: e.message, loading: false });
      });
    return () => controller.abort();
  }, [path, retry]);
  return { ...state, retry: () => setRetry((n) => n + 1) };
}
