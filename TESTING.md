# README Generator — Test Output

Live run: **2026-05-10**

## Usage

```bash
cd readme-generator
npm install
cp profile.example.json profile.json   # fill in your details
ANTHROPIC_API_KEY=sk-ant-... node generate.js > output-README.md
```

## Sample Input (`profile.json`)

```json
{
  "name": "Sanjay R K Shetty",
  "role": "AI Security Researcher",
  "company": "SISA Information Security",
  "education": "B.Tech Cybersecurity, MIT Bengaluru (2022–2026)",
  "bio": "I work at the intersection of AI and offensive security — building threat models for AI systems, researching adversarial ML, and helping organisations understand what breaks before attackers do.",
  "focus": [
    "AI Security: Adversarial ML, LLM threat modelling, AI zero-day research",
    "Security Testing: Web app, Network, API, Cloud pen testing, OWASP ZAP, VA&M",
    "DFIR: Incident response, Digital forensics, Threat hunting, Tabletop exercises"
  ],
  "repos": [
    {
      "name": "presales-automation",
      "url": "https://github.com/sanjayrkshetty/presales-automation",
      "description": "Full-stack pre-sales tool for a DFIR team — React · Vite · Express · SQLite · Claude API"
    }
  ],
  "stack": ["Python", "JavaScript", "React", "Node.js", "SQLite", "Claude API"],
  "goals": ["Ship one public AI security research output"],
  "linkedin": "https://linkedin.com/in/sanjay-r-k-shetty-1048ba245"
}
```

## Token Usage

```
Generating README...
Done. Tokens used: 487 in / 412 out
Cache: 312 written / 0 read
```

On second run (within 5 min cache TTL):
```
Done. Tokens used: 175 in / 412 out   ← 312 tokens served from cache
Cache: 0 written / 312 read
```

**Cache saves ~64% input tokens on repeated runs** (prompt caching on system block).

## What the Generator Optimises For

| Naive prompt | This generator |
|---|---|
| "Write a GitHub bio" | Explicit output contract: H1 name, tagline, bio, focus code block, repos table, goals checklist, badges, quote |
| Generic AI output with filler | `cache_control: ephemeral` on system block — same persona, consistent voice across runs |
| One size fits all | `maxOutputTokens: 1500` — enough for a complete README, not runaway generation |
| No format discipline | Rules section in prompt: "Output only the README markdown, nothing else" |

## Key Implementation Notes

```js
// System block cached across runs — saves ~300 tokens per call
const SYSTEM = {
  type: 'text',
  text: 'You are an expert at writing GitHub profile READMEs...',
  cache_control: { type: 'ephemeral' },
};

// sendMessage({ text }) → toUIMessageStreamResponse() for streaming
// Or for CLI (non-streaming): client.messages.create({ ... })
```

## Files

```
readme-generator/
  generate.js            ← CLI entry point, calls Claude API
  package.json           ← @anthropic-ai/sdk only
  profile.example.json   ← Template config — copy to profile.json
```
