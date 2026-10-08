const KNOWN_KEYS = new Set([
  'required',
  'tooShort',
  'invalid',
  'invalidEmail',
  'invalidPhone',
  'expired',
  'notFound',
  'past',
  'taken',
  'disabled',
  'tooMany',
]);

export function validationKey(codes?: string[]): string {
  const code = codes?.[0];
  if (code && KNOWN_KEYS.has(code)) return code;
  return 'generic';
}
