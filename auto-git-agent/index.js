#!/usr/bin/env node
/**
 * Auto Git Agent
 *
 * Scans all configured repos, detects uncommitted changes, asks Groq to write
 * a meaningful commit message from the actual diff, stages safe files, commits,
 * and pushes — all without human input.
 *
 * Usage:
 *   node index.js               run normally
 *   node index.js --dry-run     preview only, no commits
 *   node index.js --repo=name   run for one repo only
 *   node index.js --add-repo    interactive: register a new repo in config
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const https = require("https");

// ── Config ────────────────────────────────────────────────────────────────────

const CONFIG_PATH = path.join(__dirname, "repos.json");
const LOG_PATH    = path.join(__dirname, "auto-git.log");

const DEFAULT_REPOS = [
  { name: "claude-code-best-practices", path: "C:\\Users\\sanja\\Documents\\claude-code-best-practices", branch: "master" },
  { name: "presales-automation",         path: "C:\\Users\\sanja\\Documents\\presales-automation",         branch: "master" },
  { name: "portfolio",                   path: "C:\\Users\\sanja\\Documents\\portfolio",                   branch: "master" },
];

// Never stage files matching these patterns — ever.
const BLOCKED = [
  /\.env(\.|local|production|staging|$)/i,
  /\.pem$/i,
  /\.key$/i,
  /\.pfx$/i,
  /\.p12$/i,
  /id_rsa/i,
  /credentials/i,
  /secret/i,
  /token.*\.json/i,
  /auto-git\.log/i,  // don't commit our own log
];

const DRY_RUN    = process.argv.includes("--dry-run");
const ONLY_REPO  = (process.argv.find((a) => a.startsWith("--repo=")) ?? "").replace("--repo=", "");
const ADD_REPO   = process.argv.includes("--add-repo");

// ── Persistent repo config ────────────────────────────────────────────────────

function loadRepos() {
  if (!fs.existsSync(CONFIG_PATH)) {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(DEFAULT_REPOS, null, 2));
  }
  return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
}

function saveRepos(repos) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(repos, null, 2));
}

// ── Logging ───────────────────────────────────────────────────────────────────

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_PATH, line + "\n");
}

// ── Git helpers ───────────────────────────────────────────────────────────────

function git(cmd, cwd) {
  try {
    return execSync(`git ${cmd}`, { cwd, encoding: "utf8", stdio: "pipe" }).trim();
  } catch (e) {
    return "";
  }
}

function isBlocked(filePath) {
  return BLOCKED.some((p) => p.test(filePath));
}

function getChangedFiles(repoPath) {
  const raw = git("status --porcelain", repoPath);
  if (!raw) return [];
  return raw
    .split("\n")
    .filter(Boolean)
    .map((line) => ({
      xy:   line.slice(0, 2),
      file: line.slice(3).trim().replace(/^"(.*)"$/, "$1"), // unquote git-quoted paths
    }))
    .filter((f) => !isBlocked(f.file));
}

function getDiffContext(repoPath, isObsidian = false) {
  const newFiles = git("ls-files --others --exclude-standard", repoPath)
    .split("\n").filter(Boolean).filter((f) => !isBlocked(f)).slice(0, 20);

  if (isObsidian) {
    // For vaults: list note names (more meaningful than diff noise)
    const modified = git("diff --name-only HEAD", repoPath).split("\n").filter(Boolean);
    const notes    = [...new Set([...newFiles, ...modified])].filter((f) => f.endsWith(".md") || f.endsWith(".canvas"));
    const other    = [...new Set([...newFiles, ...modified])].filter((f) => !f.endsWith(".md") && !f.endsWith(".canvas"));
    const parts    = [];
    if (notes.length)  parts.push("Notes changed/added:\n" + notes.join("\n"));
    if (other.length)  parts.push("Other files:\n" + other.join("\n"));
    return parts.join("\n\n") || "Vault changes";
  }

  const trackedStat = git("diff --stat HEAD", repoPath);
  const diffSnippet = git("diff HEAD --unified=2 -- . ':(exclude)package-lock.json' ':(exclude)*.lock'", repoPath)
    .slice(0, 2000);

  const parts = [];
  if (trackedStat)       parts.push("Changed files:\n" + trackedStat);
  if (newFiles.length)   parts.push("New untracked files:\n" + newFiles.join("\n"));
  if (diffSnippet)       parts.push("Diff (truncated):\n" + diffSnippet);
  return parts.join("\n\n") || "New files added";
}

function stageAndVerify(repoPath, files) {
  for (const f of files) {
    git(`add -- "${f.file}"`, repoPath);
  }
  const staged = git("diff --cached --name-only", repoPath);
  return staged.trim().length > 0;
}

// ── Groq: AI commit message ───────────────────────────────────────────────────

function callGroq(prompt) {
  return new Promise((resolve) => {
    const key = process.env.GROQ_API_KEY;
    if (!key) return resolve(null);

    const body = JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 120,
      temperature: 0.2,
    });

    const req = https.request({
      hostname: "api.groq.com",
      path:     "/openai/v1/chat/completions",
      method:   "POST",
      headers: {
        "Content-Type":   "application/json",
        "Authorization":  `Bearer ${key}`,
        "Content-Length": Buffer.byteLength(body),
      },
    }, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        try {
          const msg = JSON.parse(data).choices?.[0]?.message?.content?.trim();
          resolve(msg || null);
        } catch {
          resolve(null);
        }
      });
    });

    req.on("error", () => resolve(null));
    req.setTimeout(10000, () => { req.destroy(); resolve(null); });
    req.write(body);
    req.end();
  });
}

async function buildCommitMessage(repoName, diffContext) {
  const prompt = `Write a git commit message for these changes in the "${repoName}" repo.

Rules:
- Subject line: max 72 chars, imperative mood ("Add", "Fix", "Update"), no period
- Optional body: 1-2 lines explaining WHAT changed and WHY, wrapped at 72 chars
- No emojis, no "Generated by AI", no preamble — output the commit message only

Changes:
${diffContext.slice(0, 1800)}`;

  const ai = await callGroq(prompt);
  if (ai) return ai;

  // Fallback: derive from stat without AI
  const today = new Date().toISOString().split("T")[0];
  return `Update ${repoName} — ${today}`;
}

// ── Per-repo pipeline ─────────────────────────────────────────────────────────

async function processRepo(repo) {
  const { name, path: repoPath, branch = "master" } = repo;
  log(`\n── ${name} ──`);

  if (!fs.existsSync(repoPath)) {
    log(`  SKIP: path not found`);
    return { repo: name, status: "skipped" };
  }

  // Pull first to avoid push conflicts
  if (!DRY_RUN) {
    const pull = git(`pull origin ${branch} --rebase --autostash`, repoPath);
    const pullLine = pull.split("\n")[0];
    if (pullLine && pullLine !== "Current branch master is up to date.") {
      log(`  pull: ${pullLine}`);
    }
  }

  const changes = getChangedFiles(repoPath);
  if (!changes.length) {
    log(`  clean — nothing to commit`);
    return { repo: name, status: "clean" };
  }

  const blockedCount = git("status --porcelain", repoPath)
    .split("\n").filter(Boolean)
    .filter((l) => isBlocked(l.slice(3).trim())).length;

  log(`  ${changes.length} file(s) to stage${blockedCount ? ` (${blockedCount} sensitive file(s) skipped)` : ""}`);
  changes.forEach((f) => log(`    ${f.xy} ${f.file}`));

  const diffContext = getDiffContext(repoPath, !!repo.obsidian);

  if (DRY_RUN) {
    log(`  [dry-run] would generate commit message and push`);
    return { repo: name, status: "dry-run" };
  }

  const staged = stageAndVerify(repoPath, changes);
  if (!staged) {
    log(`  nothing staged after filtering — skipping`);
    return { repo: name, status: "nothing-staged" };
  }

  const message = await buildCommitMessage(name, diffContext);
  log(`  message: ${message.split("\n")[0]}`);

  try {
    // Write message to temp file to avoid shell quoting issues with multi-line
    const tmpMsg = path.join(repoPath, ".git", "_auto_commit_msg");
    fs.writeFileSync(tmpMsg, message);
    execSync(`git commit -F ".git/_auto_commit_msg"`, { cwd: repoPath, stdio: "pipe" });
    fs.unlinkSync(tmpMsg);
    log(`  committed`);

    git(`push origin ${branch}`, repoPath);
    log(`  pushed → origin/${branch}`);
    return { repo: name, status: "pushed", message: message.split("\n")[0] };
  } catch (err) {
    log(`  ERROR: ${err.message?.slice(0, 300)}`);
    return { repo: name, status: "error", error: err.message };
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  log(`\n${"═".repeat(55)}`);
  log(`Auto Git Agent${DRY_RUN ? " [DRY RUN]" : ""} — ${new Date().toLocaleString()}`);
  log(`${"═".repeat(55)}`);

  let repos = loadRepos();

  if (ONLY_REPO) {
    repos = repos.filter((r) => r.name === ONLY_REPO);
    if (!repos.length) {
      log(`No repo named "${ONLY_REPO}" in config. Run with --add-repo to register it.`);
      process.exit(1);
    }
  }

  const results = [];
  for (const repo of repos) {
    results.push(await processRepo(repo));
  }

  log(`\n── Summary ──`);
  const pushed = results.filter((r) => r.status === "pushed");
  const clean  = results.filter((r) => r.status === "clean");
  const errors = results.filter((r) => r.status === "error");
  log(`  pushed: ${pushed.length}  clean: ${clean.length}  errors: ${errors.length}`);
  if (pushed.length) pushed.forEach((r) => log(`  ✓ ${r.repo}: ${r.message}`));
  if (errors.length) errors.forEach((r) => log(`  ✗ ${r.repo}: ${r.error}`));
  log(`${"═".repeat(55)}\n`);
}

main().catch((err) => log(`FATAL: ${err.message}`));
