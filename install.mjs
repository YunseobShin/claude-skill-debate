#!/usr/bin/env node

import { mkdirSync, copyFileSync, readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { homedir } from "os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const skillDir = join(homedir(), ".claude", "skills", "debate");
const src = join(__dirname, "SKILL.md");
const dest = join(skillDir, "SKILL.md");

const green = (s) => `\x1b[32m${s}\x1b[0m`;
const cyan = (s) => `\x1b[36m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;
const bold = (s) => `\x1b[1m${s}\x1b[0m`;

console.log();
console.log(bold("  claude-skill-debate"));
console.log(dim("  Claude vs GPT multi-turn debate with fact-checking"));
console.log();

mkdirSync(skillDir, { recursive: true });
copyFileSync(src, dest);

console.log(green("  ✓ ") + `Installed to ${cyan(dest)}`);
console.log();
console.log(dim("  Usage in Claude Code:"));
console.log(`    ${cyan("/debate")} <topic>`);
console.log();
console.log(dim("  Examples:"));
console.log(`    ${cyan("/debate")} Will AI replace programmers?`);
console.log(`    ${cyan("/debate")} React vs Vue for new projects in 2026`);
console.log(`    ${cyan("/debate")} Tesla stock outlook`);
console.log();

if (!existsSync(join(homedir(), ".codex"))) {
  console.log(
    dim("  ⚠  Codex CLI not detected. Install: ") +
      cyan("npm i -g @openai/codex")
  );
  console.log();
}
