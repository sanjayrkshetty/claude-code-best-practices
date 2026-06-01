#!/usr/bin/env node
/**
 * Repo Improver Agent
 *
 * Each day:
 *  1. Selects one feature repo (rotating by day-of-year)
 *  2. Reads README.md, picks a section to improve
 *  3. Groq Pass 1 — generates improvement
 *  4. Groq Pass 2 — critic reviews; revises if needed
 *  5. Commits + pushes the improved README
 *  6. Appends a daily research insight to the profile repo + pushes
 */

const { execSync } = require("child_process");
const fs   = require("fs");
const path = require("path");
const https = require("https");

// ── Config ────────────────────────────────────────────────────────────────────

const FEATURE_REPOS = [
  { name: "proposal-engine",           path: "C:\\Users\\sanja\\Documents\\proposal-engine",            branch: "master" },
  { name: "presales-automation",        path: "C:\\Users\\sanja\\Documents\\presales-automation",         branch: "master" },
  { name: "claude-code-best-practices", path: "C:\\Users\\sanja\\Documents\\claude-code-best-practices",  branch: "master" },
  { name: "portfolio",                  path: "C:\\Users\\sanja\\Documents\\portfolio",                   branch: "master" },
];

const PROFILE_REPO = {
  name: "sanjayrkshetty",
  path: "C:\\Users\\sanja\\Documents\\github-profile",
  branch: "main",
};

const AI_SECURITY_INSIGHTS = [
  "Prompt injection remains #1 OWASP LLM risk — indirect injection via RAG sources is underdetected",
  "LLM hallucination in security context: models confidently output fake CVE IDs — always verify",
  "Jailbreak taxonomy: direct (DAN), indirect (data poisoning), multi-turn (erosion attacks)",
  "Model inversion attacks can reconstruct training data — PII in fine-tune sets is a real threat",
  "Adversarial suffixes (Zou et al., 2023) transfer across GPT-3.5/Claude — alignment is brittle",
  "RAG poisoning: attacker controls a web page the retriever indexes → arbitrary instructions injected",
  "Tool-use abuse: LLM agents with shell access are lateral movement vectors if prompt-injectable",
  "RLHF doesn't eliminate harmful behavior — it shifts distribution, doesn't hard-block",
  "Membership inference: ~60% accuracy on LLMs for detecting if a record was in training data",
  "Supply chain risk: fine-tuning on poisoned HuggingFace datasets is underexplored attack surface",
  "Claude's Constitutional AI: model critiques and revises own outputs — red-team the constitution itself",
  "Gradient-based attacks (PGD, FGSM) on vision-language models can bypass safety classifiers",
  "Shadow alignment: uncensored behavior activated by specific prompt patterns post-RLHF",
  "LLM-as-judge manipulation: adversarially crafted outputs fool automated evaluation pipelines",
  "Model collapse in iterative training on synthetic data — diversity decay over generations",
  "Multi-agent coordination attacks: one compromised agent poisons shared context window",
  "Embedding inversion: from output embeddings, reconstruct input text with ~75% token accuracy",
  "Timing side-channels in autoregressive models can leak information about cached prefixes",
  "Zero-shot transfer of adversarial examples across architectures — architecture diversity ≠ safety",
  "Reward hacking: RL agent exploits reward model bugs rather than learning intended behavior",
  "OWASP LLM Top 10 2025: data and model poisoning now separate from supply chain",
  "Agentic AI risk: irreversible real-world actions need hard guardrails before execution",
  "Synthetic data laundering: train on AI-generated data to remove data lineage — legal grey area",
  "Few-shot jailbreak: 3-5 examples of compliant harmful responses break alignment reliably",
  "LLM memorization scales with model size — GPT-4 class models memorize more training verbatim",
  "Context window poisoning: long-context models more susceptible to late-turn instruction hijack",
  "Fine-tune attack: public fine-tuning APIs can be used to remove safety training",
  "Multimodal attack surface: images can encode adversarial text instructions invisible to humans",
  "Differential privacy in LLM training: ε=8 provides weak protection, ε=1 kills utility",
  "Threat modeling LLM systems: STRIDE doesn't map cleanly — need LLM-specific threat taxonomy",
];

// ── Env loader (Task Scheduler doesn't inherit shell env vars) ────────────────

function loadEnv() {
  const candidates = [
    path.join(process.env.USERPROFILE || process.env.HOME || "", ".env"),
    path.join(__dirname, ".env"),
    path.join(__dirname, "..", ".env"),
  ];
  for (const loc of candidates) {
    if (!fs.existsSync(loc)) continue;
    for (const line of fs.readFileSync(loc, "utf8").split("\n")) {
      const m = line.match(/^([A-Z_][A-Z_0-9]*)=(.*)$/);
      if (m) {
        process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
      }
    }
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function today() {
  return new Date().toISOString().split("T")[0];
}

function dayOfYear() {
  const now   = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now - start) / 86400000);
}

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(path.join(__dirname, "run.log"), line + "\n");
}

function git(cmd, cwd) {
  try {
    return execSync(`git ${cmd}`, { cwd, encoding: "utf8", stdio: "pipe" }).trim();
  } catch (e) {
    return "";
  }
}

// ── Groq API ──────────────────────────────────────────────────────────────────

function callGroq(prompt, maxTokens = 700) {
  return new Promise((resolve) => {
    const key = process.env.GROQ_API_KEY;
    if (!key) { resolve(null); return; }

    const body = JSON.stringify({
      model:       "llama-3.3-70b-versatile",
      messages:    [{ role: "user", content: prompt }],
      max_tokens:  maxTokens,
      temperature: 0.3,
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
        } catch { resolve(null); }
      });
    });

    req.on("error", () => resolve(null));
    req.setTimeout(15000, () => { req.destroy(); resolve(null); });
    req.write(body);
    req.end();
  });
}

// ── README section picker ─────────────────────────────────────────────────────

function parseSections(readme) {
  const lines    = readme.split("\n");
  const sections = [];
  let i = 0;

  while (i < lines.length) {
    if (/^#{1,3} /.test(lines[i])) {
      const startIdx = i;
      i++;
      while (i < lines.length && !/^#{1,3} /.test(lines[i]) && !lines[i].startsWith("---")) i++;
      sections.push({
        header:   lines[startIdx],
        content:  lines.slice(startIdx, i).join("\n"),
        startIdx,
        endIdx:   i,
      });
    } else {
      i++;
    }
  }
  return sections;
}

function pickSection(sections) {
  // Skip very short sections, badge-only sections, and connect/log sections
  const skip = /connect|research log|stack|stats|trophies|trophy|badge|shield/i;
  const candidates = sections.filter(
    (s) => s.content.length > 80 && !skip.test(s.header)
  );
  if (!candidates.length) return sections[0] ?? null;
  return candidates[dayOfYear() % candidates.length];
}

// ── Two-pass Groq improvement ─────────────────────────────────────────────────

async function improveRepoReadme(repoPath, repoName) {
  const readmePath = path.join(repoPath, "README.md");
  if (!fs.existsSync(readmePath)) {
    log(`  ${repoName}: no README.md found, skipping improvement`);
    return false;
  }

  const readme   = fs.readFileSync(readmePath, "utf8");
  const sections = parseSections(readme);
  const section  = pickSection(sections);

  if (!section) {
    log(`  ${repoName}: no improvable sections found`);
    return false;
  }

  log(`  ${repoName}: improving section "${section.header}"`);

  // ── Pass 1: Improve ──────────────────────────────────────────────────────
  const improvePrompt = `You are a technical writer improving a GitHub README for an AI security / cybersecurity project called "${repoName}".

Rewrite the section below to be more specific, technical, and impressive. Keep the same markdown structure. Do not invent fake metrics. Sound like a senior engineer, not a student job application.

Output ONLY the improved section (including the ## header). No explanation, no preamble.

---
${section.content.slice(0, 1500)}
---`;

  const pass1 = await callGroq(improvePrompt, 700);
  if (!pass1 || pass1.length < 30) {
    log(`  ${repoName}: Pass 1 returned nothing useful`);
    return false;
  }
  log(`  Pass 1 complete (${pass1.length} chars)`);

  // ── Pass 2: Critic ───────────────────────────────────────────────────────
  const criticPrompt = `You are a critical reviewer checking a GitHub README section improvement for an AI security project.

ORIGINAL:
${section.content.slice(0, 800)}

PROPOSED IMPROVEMENT:
${pass1.slice(0, 800)}

Is the improvement actually better? Check: Is it more specific? Does it sound genuine, not generic? Are there any hallucinated claims?

If it passes, output exactly: APPROVED
If it needs fixes, output only the corrected version (the full section, no preamble).`;

  const pass2 = await callGroq(criticPrompt, 600);
  log(`  Pass 2 complete — ${pass2?.startsWith("APPROVED") ? "approved" : "revised"}`);

  const finalContent = (!pass2 || pass2.trim().toUpperCase().startsWith("APPROVED"))
    ? pass1.trim()
    : pass2.trim();

  // ── Apply replacement ────────────────────────────────────────────────────
  const lines    = readme.split("\n");
  const newLines = [
    ...lines.slice(0, section.startIdx),
    ...finalContent.split("\n"),
    ...lines.slice(section.endIdx),
  ];
  const newReadme = newLines.join("\n");

  if (newReadme === readme) {
    log(`  ${repoName}: no change after improvement`);
    return false;
  }

  fs.writeFileSync(readmePath, newReadme);
  log(`  ${repoName}: README.md updated`);
  return true;
}

// ── Profile repo update ───────────────────────────────────────────────────────

function updateProfileRepo(repoPath) {
  const readmePath = path.join(repoPath, "README.md");
  if (!fs.existsSync(readmePath)) return false;

  const readme  = fs.readFileSync(readmePath, "utf8");
  const marker  = "<!-- RESEARCH-LOG-START -->";
  const idx     = readme.indexOf(marker);
  if (idx === -1) return false;

  const t       = today();
  const insight = AI_SECURITY_INSIGHTS[dayOfYear() % AI_SECURITY_INSIGHTS.length];
  const newRow  = `| ${t} | ${insight} |`;

  // Check if today's entry already exists
  if (readme.includes(`| ${t} |`)) {
    log("  profile: already updated today, skipping");
    return false;
  }

  // Insert new row right after the table header separator line
  const headerSep = "|------|---------|";
  const sepIdx    = readme.indexOf(headerSep, idx);
  if (sepIdx === -1) return false;

  const insertAt   = sepIdx + headerSep.length + 1; // after \n
  const newReadme  = readme.slice(0, insertAt) + newRow + "\n" + readme.slice(insertAt);

  fs.writeFileSync(readmePath, newReadme);
  log(`  profile: research log updated — ${t}`);
  return true;
}

// ── Git operations ────────────────────────────────────────────────────────────

async function commitAndPush(repoPath, branch, message) {
  if (!fs.existsSync(repoPath)) return;

  git("add README.md", repoPath);

  const staged = git("diff --cached --name-only", repoPath);
  if (!staged) {
    log(`  nothing staged in ${path.basename(repoPath)}`);
    return;
  }

  const tmpMsg = path.join(repoPath, ".git", "_agent_commit_msg");
  fs.writeFileSync(tmpMsg, message);
  execSync(`git commit -F ".git/_agent_commit_msg"`, { cwd: repoPath, stdio: "pipe" });
  fs.unlinkSync(tmpMsg);

  git(`push origin ${branch}`, repoPath);
  log(`  pushed → origin/${branch}: ${message.split("\n")[0]}`);
}

async function buildCommitMessage(repoName, sectionHeader) {
  const prompt = `Write a short git commit message (max 72 chars, imperative mood, no period) for: improved the "${sectionHeader}" section of ${repoName} README via AI critic loop. Output ONLY the message.`;
  const ai = await callGroq(prompt, 60);
  return ai || `Improve ${sectionHeader} section in ${repoName} README`;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  loadEnv();
  log(`\n${"═".repeat(55)}`);
  log(`Repo Improver Agent — ${today()}`);
  log(`${"═".repeat(55)}`);

  // Select today's feature repo
  const repo = FEATURE_REPOS[dayOfYear() % FEATURE_REPOS.length];
  log(`\nTarget repo: ${repo.name}`);

  if (!fs.existsSync(repo.path)) {
    log(`  SKIP: path not found — ${repo.path}`);
  } else {
    // Pull latest
    git(`pull origin ${repo.branch} --rebase --autostash`, repo.path);

    // Improve README
    const readmePath = path.join(repo.path, "README.md");
    const sections   = fs.existsSync(readmePath)
      ? parseSections(fs.readFileSync(readmePath, "utf8"))
      : [];
    const section    = pickSection(sections);

    const improved = await improveRepoReadme(repo.path, repo.name);

    if (improved) {
      const msg = await buildCommitMessage(repo.name, section?.header ?? "README");
      try {
        await commitAndPush(repo.path, repo.branch, msg);
      } catch (err) {
        log(`  ERROR committing ${repo.name}: ${err.message?.slice(0, 200)}`);
      }
    }
  }

  // Update profile repo
  log(`\nUpdating profile repo`);
  if (!fs.existsSync(PROFILE_REPO.path)) {
    log(`  SKIP: profile repo path not found`);
  } else {
    git(`pull origin ${PROFILE_REPO.branch} --rebase --autostash`, PROFILE_REPO.path);
    const updated = updateProfileRepo(PROFILE_REPO.path);
    if (updated) {
      try {
        await commitAndPush(
          PROFILE_REPO.path,
          PROFILE_REPO.branch,
          `Research log: ${today()} — daily AI security insight`
        );
      } catch (err) {
        log(`  ERROR committing profile: ${err.message?.slice(0, 200)}`);
      }
    }
  }

  log(`\n${"═".repeat(55)}\n`);
}

main().catch((err) => log(`FATAL: ${err.message}`));
