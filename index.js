import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

if (!existsSync("dist/index.js")) {
  const build = spawnSync("npm", ["run", "build"], { stdio: "inherit", shell: true });

  if (build.status !== 0) {
    process.exit(build.status ?? 1);
  }
}

await import("./dist/index.js");
