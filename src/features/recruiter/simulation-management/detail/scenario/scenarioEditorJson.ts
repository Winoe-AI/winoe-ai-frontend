export function stringifyJson(value: unknown, fallback: string): string {
  if (value == null) return fallback;
  try {
    const serialized = JSON.stringify(value, null, 2);
    return typeof serialized === 'string' ? serialized : fallback;
  } catch {
    return fallback;
  }
}

export function parseTaskPrompts(input: string): {
  value: Array<Record<string, unknown>> | null;
  error: string | null;
} {
  try {
    const parsed = JSON.parse(input);
    if (!Array.isArray(parsed)) {
      return { value: null, error: 'Task prompts must be a JSON array.' };
    }
    return { value: parsed as Array<Record<string, unknown>>, error: null };
  } catch {
    return { value: null, error: 'Task prompts JSON is invalid.' };
  }
}

export function parseRubric(input: string): {
  value: Record<string, unknown> | null;
  error: string | null;
} {
  try {
    const parsed = JSON.parse(input);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { value: null, error: 'Rubric must be a JSON object.' };
    }
    return { value: parsed as Record<string, unknown>, error: null };
  } catch {
    return { value: null, error: 'Rubric JSON is invalid.' };
  }
}
