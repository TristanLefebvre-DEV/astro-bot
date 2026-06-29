const patterns = [
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
  /\b(?:\+?\d[\d .-]{7,}\d)\b/g,
  /\b(?:mfa\.[\w-]{20,}|[\w-]{24}\.[\w-]{6}\.[\w-]{27,})\b/g
];

export function redactSensitiveContent(content: string): string {
  return patterns.reduce((current, pattern) => current.replace(pattern, "[redacted]"), content);
}
