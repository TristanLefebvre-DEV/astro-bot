export function isDiscordSnowflake(value: string): boolean {
  return /^\d{17,20}$/.test(value);
}

export function isHexColor(value: string): boolean {
  return /^#?[0-9a-f]{6}$/i.test(value);
}
