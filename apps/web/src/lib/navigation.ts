/** Keep login/return links on this application, including after URL normalization. */
export function safeReturnTo(value: string | null, fallback = '/') {
  if (!value?.startsWith('/')) return fallback;
  try {
    const decoded = decodeURIComponent(value);
    if (/^[\/]{2}|[\\\u0000-\u001f\u007f]/.test(decoded)) return fallback;
    const url = new URL(value, 'https://mathstudy.invalid');
    if (
      url.origin !== 'https://mathstudy.invalid' ||
      decodeURIComponent(url.pathname).toLowerCase().startsWith('/account')
    )
      return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
