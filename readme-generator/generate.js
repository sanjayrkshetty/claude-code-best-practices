#!/usr/bin/env node
/**
 * GitHub Profile README Generator
 * Usage: node generate.js [config.json]
 * Defaults to profile.json in same directory
 */

const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');

const configPath = process.argv[2] || path.join(__dirname, 'profile.json');

if (!fs.existsSync(configPath)) {
  console.error(`Config not found: ${configPath}`);
  console.error('Copy profile.example.json to profile.json and fill it in.');
  process.exit(1);
}

const profile = JSON.parse(fs.readFileSync(configPath, 'utf8'));

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('ANTHROPIC_API_KEY not set');
  process.exit(1);
}

const client = new Anthropic();

const SYSTEM = {
  type: 'text',
  text: 'You are an expert at writing GitHub profile READMEs for technical professionals. You write concise, sharp, signal-dense profiles — no filler, no clichés, no "passionate developer" language. Every sentence earns its place.',
  cache_control: { type: 'ephemeral' },
};

function buildPrompt(p) {
  return `Generate a GitHub profile README for this person.

Name: ${p.name}
Role: ${p.role}
Company: ${p.company || 'Not specified'}
Education: ${p.education || 'Not specified'}
Bio (use this as source, rewrite it sharper): ${p.bio || 'Not provided'}

Technical focus areas:
${(p.focus || []).map(f => `- ${f}`).join('\n')}

Shipped repos to highlight:
${(p.repos || []).map(r => `- ${r.name}: ${r.description} [${r.url}]`).join('\n')}

Stack/tools: ${(p.stack || []).join(', ')}

Current goals:
${(p.goals || []).map(g => `- ${g}`).join('\n')}

LinkedIn: ${p.linkedin || 'not provided'}

Rules:
- Use GitHub-flavored Markdown
- Lead with name as H1, then a single bold tagline (role + company + key areas)
- 2-3 sentence bio after the tagline — direct, specific, no clichés
- Technical focus as a code block with aligned columns (like: "AI Security → Adversarial ML · LLM threat modelling")
- Shipped repos as a table: | Repo | What it is |
- Current goals as a checkbox list
- Stack as badge img tags (shields.io flat style)
- LinkedIn badge at the bottom
- End with a 1-line quote that reflects their actual work ethos (not generic)
- No HTML except for the badges
- Output only the README markdown, nothing else`;
}

async function main() {
  console.error('Generating README...');

  const msg = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1500,
    system: [SYSTEM],
    messages: [{ role: 'user', content: buildPrompt(profile) }],
  });

  const readme = msg.content[0].text.trim();
  process.stdout.write(readme + '\n');

  console.error(`\nDone. Tokens used: ${msg.usage.input_tokens} in / ${msg.usage.output_tokens} out`);
  if (msg.usage.cache_creation_input_tokens) {
    console.error(`Cache: ${msg.usage.cache_creation_input_tokens} written / ${msg.usage.cache_read_input_tokens || 0} read`);
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
