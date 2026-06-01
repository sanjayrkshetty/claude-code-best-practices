<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=180&section=header&text=Claude%20Code%20Best%20Practices&fontSize=34&fontColor=fff&animation=twinkling&fontAlignY=38&desc=Production%20Patterns%20for%20Claude%20Code%20%7C%20Built%20from%20Real%20Engineering%20Work&descAlignY=58&descSize=14" />
</p>

<p align="center">
  <a href="https://github.com/sanjayrkshetty"><img src="https://img.shields.io/badge/by-@sanjayrkshetty-7C3AED?style=flat-square&logo=github&logoColor=white" /></a>
  &nbsp;
  <img src="https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Anthropic%20Claude-D4A843?style=flat-square" />
</p>

---

# Claude Code Best Practices

A practical reference for getting production-quality output from Claude Code — built from real engineering work, not tutorials.

## Included Tools

| Tool | What it does |
|---|---|
| [`readme-generator/`](./readme-generator/) | CLI that generates a GitHub profile README from a JSON config using Claude API — run once, pipe to `README.md` |

**Quick start (README generator):**
```bash
cd readme-generator
npm install
cp profile.example.json profile.json   # edit with your details
ANTHROPIC_API_KEY=sk-ant-... node generate.js > ../output-README.md
```

---

## Core Mental Model

Claude Code is a **software engineer**, not a chatbot. Treat it as a capable junior-to-mid engineer who needs:
- **Clear task definition** — not "fix the bug," but "in `server/routes/opportunities.js:83`, the PUT handler uses `COALESCE` which means sending `null` clears a field — is that intentional?"
- **Enough context to make judgment calls** — include why, not just what
- **Explicit constraints** — file paths, line numbers, which files to touch and which to leave alone

The best prompt format:
```
Context: [what exists, what it does]
Problem: [exactly what is wrong or needed]
Constraint: [what not to touch, performance limits, security requirements]
Output: [file to edit, format expected]
```

---

## CLAUDE.md — Your Persistent Context Layer

`CLAUDE.md` files are automatically loaded into every session. Use them to encode:

```markdown
# Project conventions
- No comments unless the WHY is non-obvious
- Never mock the DB in tests — integration tests only
- All monetary values stored in Cr (crore), not rupees

# Architecture decisions
- Express routes use req.app.locals.db, not a module-level singleton
- SQLite via better-sqlite3 (synchronous) — no async/await in DB calls
- Generated files live in server/generated/, never committed

# Security rules
- Never echo user input into SQL strings — always parameterize
- All routes validate enum inputs against VALID_* constants before touching DB
```

**Where to put them:**
- `~/.claude/CLAUDE.md` — global rules (tone, response style, your identity)
- `project-root/CLAUDE.md` — project architecture, conventions, what not to touch
- `src/CLAUDE.md` — frontend-specific conventions

---

## Prompting Patterns That Work

### 1. Reference exact locations
```
# Bad
Fix the CORS issue

# Good
In server/index.js:36, the CORS config uses `origin: '*'` — lock it to
`process.env.ALLOWED_ORIGIN || 'http://localhost:5173'` only, and restrict
methods to GET/POST/PUT/DELETE
```

### 2. Give the "why" when it's non-obvious
```
Add rate limiting to /api/ai routes — these call Claude and each call costs
money. Stricter limit than the general API: 20 req/min, not 200.
```

### 3. State what NOT to do
```
Refactor the import handler to use a named function so multer errors reach
the global handler. Do NOT change the route signature or add new middleware.
```

### 4. For multi-step tasks, use tasks
```
/task create "Security hardening pass"
```
Claude will track what's done, mark tasks complete as it goes, and you can
see progress without re-reading the whole conversation.

---

## Agents — When to Use Them

Claude Code can spawn subagents. Use them to:

| Use case | Agent type |
|---|---|
| Find a file or symbol across a large codebase | `Explore` |
| Research a library API or feature | `general-purpose` |
| Design an implementation plan before writing code | `Plan` |
| Answer questions about Claude Code itself | `claude-code-guide` |

**Don't spawn an agent** when you already know the file and line — just read it directly. Agent spawning has overhead; reserve it for genuinely open-ended searches or parallelizable work.

---

## Security — Non-Negotiables for Any Backend

If Claude is building backend code, enforce these via CLAUDE.md:

```markdown
# Security rules Claude must follow
- Parameterize all SQL — never string-concatenate user input
- Validate all enum inputs against a VALID_* allowlist before DB ops
- Use multer fileFilter + memoryStorage for file uploads — never write to disk without validation
- All file-serving routes: block path traversal, restrict extensions
- Rate limit AI endpoints separately — they're expensive and external
- Bind to 127.0.0.1 in dev, not 0.0.0.0
- Never log full error stacks in production responses
```

---

## Token Efficiency

### Prompt caching
If you call Claude API in your app with a large system prompt reused across calls:
```js
const SYSTEM_CACHE = {
  type: 'text',
  text: 'Your long system prompt here...',
  cache_control: { type: 'ephemeral' },  // Cache this block
};
```
This caches the system prompt for 5 minutes across API calls. Significant savings at scale.

### Keep system prompts tight
Vague: `"You are a helpful AI assistant for a company."`
Precise: `"You are an expert cybersecurity pre-sales assistant for a DFIR company. You write precise, professional content for proposals. Never invent client names. Output only what is asked — no preamble, no labels."`

The second is shorter AND produces better output because it removes ambiguity about format.

### maxTokens
Set `max_tokens` per function, not globally:
- Short follow-up message: `300`
- Executive summary: `400`
- Full scope + objectives JSON: `1000`

Oversized `max_tokens` doesn't cost you unless tokens are used, but it signals intent to the model and keeps outputs from ballooning.

---

## Error Handling Patterns

### Never let AI failures cascade
```js
try {
  const scopeData = await claude.generateIncidentScope(incident_description);
  objectives = scopeData.objectives || [];
} catch (e) {
  console.warn('AI scope generation failed, using empty:', e.message);
  // objectives stays []
}
```
AI features should degrade gracefully — the core workflow (DOCX generation) still works.

### Surface AI errors to the frontend
```js
// Don't return 500 when Claude fails — return a structured error
catch (err) {
  return res.json({ message: null, error: aiError(err) });
}
```

---

## Git Workflow With Claude Code

1. Let Claude do the work, review the diff before committing
2. Never let Claude run `git push --force` or `git reset --hard` without explicit confirmation
3. For large refactors: `git stash` before starting so you have an escape hatch
4. Claude commits include `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`

---

## What to Put in Memory

Claude Code has a persistent memory system at `~/.claude/projects/*/memory/`. Use it for:

| Worth saving | Not worth saving |
|---|---|
| How you like responses formatted | Current file contents |
| Project-specific conventions not in CLAUDE.md | Git history |
| Things Claude got wrong that you corrected | Debugging solutions |
| Your technical background (frames how Claude explains things) | Temporary task state |

---

## Common Mistakes

| Mistake | Fix |
|---|---|
| Asking for "the best way" without constraints | Add constraints: budget, latency, team size, existing stack |
| Long vague prompts | Shorter, specific, with file:line references |
| Not using CLAUDE.md for conventions | Encode everything you've corrected more than once |
| Skipping review of diffs | Claude is fast but not infallible — always read what changed |
| Spawning agents for single-file lookups | Use Grep/Read directly for known targets |

---

## Repo Structure That Works Well With Claude Code

```
project/
  CLAUDE.md              # Conventions, architecture decisions, what NOT to touch
  server/
    CLAUDE.md            # Backend-specific rules
  client/
    CLAUDE.md            # Frontend-specific rules
  .env.example           # Shows required vars without leaking secrets
```

---

*Built from production experience building a full-stack pre-sales automation system for a DFIR security firm. All patterns validated on real code.*

---

<p align="center">
  Part of <a href="https://github.com/sanjayrkshetty"><strong>@sanjayrkshetty</strong></a>'s AI security portfolio
</p>

<p align="center">
  <a href="https://sanjayrkshetty.vercel.app"><img src="https://img.shields.io/badge/Portfolio-Live-00d97e?style=flat-square&logo=vercel&logoColor=white" /></a>
  &nbsp;
  <a href="https://linkedin.com/in/sanjay-r-k-shetty-1048ba245"><img src="https://img.shields.io/badge/LinkedIn-Connect-0077B5?style=flat-square&logo=linkedin&logoColor=white" /></a>
  &nbsp;
  <a href="https://github.com/sanjayrkshetty"><img src="https://img.shields.io/badge/GitHub-@sanjayrkshetty-181717?style=flat-square&logo=github&logoColor=white" /></a>
  &nbsp;
  <a href="mailto:sanjayrkshetty@gmail.com"><img src="https://img.shields.io/badge/Email-Contact-EA4335?style=flat-square&logo=gmail&logoColor=white" /></a>
</p>

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=80&section=footer" />
</p>
