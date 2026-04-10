const rawTestNow = process.env.NEXT_PUBLIC_WINOE_TEST_NOW_UTC?.trim() ?? '';
const parsedTestNowMs = rawTestNow ? Date.parse(rawTestNow) : Number.NaN;
const fixedNowMs = Number.isFinite(parsedTestNowMs) ? parsedTestNowMs : null;

export function resolveNowMs(): number {
  return fixedNowMs ?? Date.now();
}
