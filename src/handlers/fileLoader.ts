import { pathToFileURL } from "node:url";
import { readdir } from "node:fs/promises";
import path from "node:path";

export async function loadFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true }).catch(() => []);
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await loadFiles(fullPath)));
    } else if (/\.(ts|js)$/.test(entry.name) && !entry.name.endsWith(".d.ts")) {
      files.push(fullPath);
    }
  }

  return files;
}

export async function importModule<T>(filePath: string): Promise<T> {
  const moduleUrl = pathToFileURL(filePath).href;
  return import(moduleUrl) as Promise<T>;
}
