#!/usr/bin/env node
/**
 * Daily Commit Agent
 * Runs via Windows Task Scheduler — generates a meaningful daily update,
 * commits it across configured repos, pushes to GitHub.
 *
 * WHY meaningful content: empty/fake commits are detected by GitHub and
 * don't count reliably; real file changes to tracked files always count.
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const https = require("https");

// ── Config ────────────────────────────────────────────────────────────────────

const REPOS = [
  {
    name: "claude-code-best-practices",
    path: "C:\\Users\\sanja\\Documents\\claude-code-best-practices",
    updateFn: updateDashboardLog,
  },
  {
    name: "presales-automation",
    path: "C:\\Users\\sanja\\Documents\\presales-automation",
    updateFn: updatePresalesLog,
  },
];

// Rotating AI security insights — one surfaced per day (cycles every 30 days)
const AI_SECURITY_INSIGHTS = [
  "Prompt injection remains #1 OWASP LLM risk — indirect injection via RAG sources is underdetected.",
  "LLM hallucination in security context: models confidently output fake CVE IDs. Always verify.",
  "Jailbreak taxonomy: direct (DAN), indirect (data poisoning), multi-turn (erosion attacks).",
  "Model inversion attacks can reconstruct training data — PII in fine-tune sets is a real threat.",
  "Adversarial suffixes (Zou et al., 2023) transfer across GPT-3.5/Claude — alignment is brittle.",
  "RAG poisoning: attacker controls a web page the retriever indexes → arbitrary instructions injected.",
  "Tool-use abuse: LLM agents with shell access are lateral movement vectors if prompt-injectable.",
  "RLHF doesn't eliminate harmful behavior — it shifts distribution, doesn't hard-block.",
  "Membership inference: ~60% accuracy on LLMs for detecting if a record was in training data.",
  "Supply chain risk: fine-tuning on poisoned HuggingFace datasets is underexplored attack surface.",
  "Claude's Constitutional AI: model critiques and revises own outputs — red-team the constitution itself.",
  "Gradient-based attacks (PGD, FGSM) on vision-language models can bypass safety classifiers.",
  "Shadow alignment: uncensored behavior activated by specific prompt patterns post-RLHF.",
  "LLM-as-judge manipulation: adversarially crafted outputs fool automated evaluation pipelines.",
  "Model collapse in iterative training on synthetic data — diversity decay over generations.",
  "Multi-agent coordination attacks: one compromised agent poisons shared context window.",
  "Embedding inversion: from output embeddings, reconstruct input text with ~75% token accuracy.",
  "Timing side-channels in autoregressive models can leak information about cached prefixes.",
  "Zero-shot transfer of adversarial examples across architectures — architecture diversity ≠ safety.",
  "Reward hacking: RL agent exploits reward model bugs rather than learning intended behavior.",
  "OWASP LLM Top 10 2025 update: data and model poisoning now separate from supply chain.",
  "Agentic AI risk: irreversible real-world actions (send email, delete file) need hard guardrails.",
  "Synthetic data laundering: train on AI-generated data to remove data lineage — legal grey area.",
  "Few-shot jailbreak: 3-5 examples of 'compliant' harmful responses break alignment reliably.",
  "LLM memorization scales with model size — GPT-4 class models memorize more training verbatim.",
  "Context window poisoning: long-context models are more susceptible to late-turn instruction hijack.",
  "Fine-tune attack: public fine-tuning APIs (OpenAI) can be used to remove safety training.",
  "Multimodal attack surface: images can encode adversarial text instructions invisible to humans.",
  "Differential privacy in LLM training: ε=8 provides weak protection, ε=1 kills utility.",
  "Threat modeling LLM systems: STRIDE doesn't map cleanly — need LLM-specific threat taxonomy.",
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function today() {
  return new Date().toISOString().split("T")[0]; // YYYY-MM-DD
}

function dayOfYear() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now - start) / 86400000);
}

function todayInsight() {
  return AI_SECURITY_INSIGHTS[dayOfYear() % AI_SECURITY_INSIGHTS.length];
}

function run(cmd, cwd) {
  return execSync(cmd, { cwd, stdio: "pipe" }).toString().trim();
}

function log(msg) {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${msg}`);
  // Append to agent run log
  const logPath = path.join(__dirname, "run.log");
  fs.appendFileSync(logPath, `[${ts}] ${msg}\n`);
}

// ── Update functions ──────────────────────────────────────────────────────────

function updateDashboardLog(repoPath) {
  const logDir = path.join(repoPath, "daily-agent");
  const streakFile = path.join(logDir, "streak.json");
  const activityFile = path.join(logDir, "activity-log.md");

  // Load or init streak data
  let streak = { count: 0, lastDate: "", longestStreak: 0, totalDays: 0 };
  if (fs.existsSync(streakFile)) {
    streak = JSON.parse(fs.readFileSync(streakFile, "utf8"));
  }

  const t = today();
  if (streak.lastDate === t) {
    log("Already committed today for claude-code-best-practices, skipping.");
    return false;
  }

  // Update streak
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  streak.count = streak.lastDate === yesterday ? streak.count + 1 : 1;
  streak.longestStreak = Math.max(streak.longestStreak, streak.count);
  streak.totalDays += 1;
  streak.lastDate = t;

  fs.writeFileSync(streakFile, JSON.stringify(streak, null, 2));

  // Append to activity log
  const insight = todayInsight();
  const entry = `\n## ${t} — Day ${streak.totalDays} (Streak: ${streak.count})\n\n**AI Security Insight:** ${insight}\n\n**Stats:** Current streak ${streak.count} days · Longest ${streak.longestStreak} days · Total ${streak.totalDays} active days\n`;
  fs.appendFileSync(activityFile, entry);

  return `Daily update: streak ${streak.count} days — ${t}`;
}

function updatePresalesLog(repoPath) {
  const logFile = path.join(repoPath, "daily-activity.md");

  // Load existing or create
  let content = "";
  if (fs.existsSync(logFile)) {
    content = fs.readFileSync(logFile, "utf8");
  } else {
    content = "# Presales Activity Log\n\nAuto-generated daily activity tracker.\n";
  }

  const t = today();
  // Check if already logged today
  if (content.includes(`## ${t}`)) {
    log("Already committed today for presales-automation, skipping.");
    return false;
  }

  const presalesMetrics = generatePresalesMetrics();
  const entry = `\n## ${t}\n\n${presalesMetrics}\n`;
  fs.writeFileSync(logFile, content + entry);

  return `Daily presales log update — ${t}`;
}

function generatePresalesMetrics() {
  // Rotate through different daily focus areas
  const focuses = [
    "**Focus:** Discovery call prep — qualify budget authority, timeline, and trigger event before scoping.",
    "**Focus:** PCI DSS v4.0 SAQ eligibility review — confirm card data environment scope before pricing.",
    "**Focus:** ISO 27001 gap assessment scoping — map controls to client maturity level.",
    "**Focus:** Pen testing proposal review — verify rules of engagement, IP ranges, exclusions documented.",
    "**Focus:** SOC 2 Type II readiness — confirm observation period start date in engagement letter.",
    "**Focus:** DFIR retainer renewal — review SLA response times and escalation paths with client.",
    "**Focus:** Red team scoping — define crown jewels, OOB comms channel, abort criteria.",
  ];
  const idx = dayOfYear() % focuses.length;
  return `${focuses[idx]}\n\n**Insight:** ${todayInsight()}`;
}

// ── Git operations ────────────────────────────────────────────────────────────

function commitAndPush(repo, message) {
  const { path: repoPath, name } = repo;
  try {
    // Stage only the daily-agent files (not anything else the user may have open)
    if (name === "claude-code-best-practices") {
      run("git add daily-agent/streak.json daily-agent/activity-log.md", repoPath);
    } else {
      run("git add daily-activity.md", repoPath);
    }

    // Check if there's anything staged
    const status = run("git diff --cached --name-only", repoPath);
    if (!status) {
      log(`${name}: nothing staged, skipping commit.`);
      return;
    }

    run(`git commit -m "${message}"`, repoPath);
    run("git push origin HEAD", repoPath);
    log(`${name}: pushed — "${message}"`);
  } catch (err) {
    log(`${name}: ERROR — ${err.message}`);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

function main() {
  log("=== Daily Commit Agent starting ===");

  for (const repo of REPOS) {
    if (!fs.existsSync(repo.path)) {
      log(`Skipping ${repo.name}: path not found.`);
      continue;
    }
    log(`Processing: ${repo.name}`);
    const message = repo.updateFn(repo.path);
    if (message) {
      commitAndPush(repo, message);
    }
  }

  log("=== Done ===");
}

main();
