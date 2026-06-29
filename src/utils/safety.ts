export function redactSecret(value: string): string {
  if (value.length <= 8) return "[redacted]";
  return `${value.slice(0, 4)}...[redacted]...${value.slice(-4)}`;
}

export function isDangerousAction(action: string): boolean {
  return [
    "ban",
    "tempban",
    "massban",
    "masskick",
    "nuke",
    "lockdown",
    "backup-load",
    "serverbuilder-load",
    "panic",
    "restoreperms",
    "delete-case",
    "reset-config"
  ].includes(action);
}
