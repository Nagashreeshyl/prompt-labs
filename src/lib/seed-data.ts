import type { CollectionDoc, PromptDoc, UserProfile } from "@/lib/types";

/**
 * Synthetic seed content, authored for this build.
 * Demo authors and prompts are not real users or testimonials.
 */

export const DEMO_UID = "demo-user-0001";

export const DEMO_PROFILE: UserProfile = {
  uid: DEMO_UID,
  email: "demo@promptlabs.app",
  displayName: "Demo User",
  handle: "demo",
  createdAt: Date.UTC(2026, 7, 14, 9, 12),
};

export const DEMO_PASSWORD = "demo1234";

export const SEED_AUTHORS: Record<string, { name: string; handle: string }> = {
  mira: { name: "Mira Kessler", handle: "mira.k" },
  daniel: { name: "Daniel Kahn", handle: "d.kahn" },
  avery: { name: "Avery Lin", handle: "averyln" },
  jules: { name: "Jules Okafor", handle: "jules" },
  sam: { name: "Sam Ortega", handle: "s.ortega" },
};

const DAY = 86_400_000;
const now = Date.UTC(2026, 9, 10, 12, 0);

interface SeedInput {
  id: string;
  author: keyof typeof SEED_AUTHORS | "demo";
  title: string;
  description: string;
  content: string;
  category: string;
  tags: string[];
  visibility: "private" | "public";
  collectionId?: string | null;
  ageDays: number;
  updatedDaysAgo?: number;
  sourcePromptId?: string;
  sourceAttribution?: string;
}

function authorOf(key: SeedInput["author"]) {
  if (key === "demo") return { ownerId: DEMO_UID, ownerName: DEMO_PROFILE.displayName, ownerHandle: DEMO_PROFILE.handle };
  const a = SEED_AUTHORS[key];
  return { ownerId: `seed-${key}`, ownerName: a.name, ownerHandle: a.handle };
}

function toPrompt(input: SeedInput): PromptDoc {
  const author = authorOf(input.author);
  const createdAt = now - input.ageDays * DAY;
  const updatedAt = now - (input.updatedDaysAgo ?? input.ageDays) * DAY;
  return {
    id: input.id,
    ownerId: author.ownerId,
    ownerName: author.ownerName,
    ownerHandle: author.ownerHandle,
    title: input.title,
    description: input.description,
    content: input.content,
    category: input.category,
    tags: input.tags,
    variables: [],
    visibility: input.visibility,
    collectionId: input.collectionId ?? null,
    sourcePromptId: input.sourcePromptId ?? null,
    sourceAttribution: input.sourceAttribution ?? null,
    createdAt,
    updatedAt,
  };
}

const PUBLIC_SEEDS: SeedInput[] = [
  {
    id: "sp_socratic_tutor",
    author: "mira",
    title: "Socratic tutor",
    description: "Guide a learner to the answer with questions instead of lectures. Works for school topics, interview prep, and self-study.",
    category: "Education",
    tags: ["tutor", "learning", "questions"],
    visibility: "public",
    ageDays: 46,
    updatedDaysAgo: 9,
    content: `You are a patient Socratic tutor helping me learn {{subject}} at a {{level}} level.

Rules:
1. Never give me the final answer directly.
2. Ask one focused question at a time that moves me closer to it.
3. When I answer, tell me in one sentence what is right and what is missing, then ask the next question.
4. If I am stuck twice in a row, give a small hint — an example, a definition, or a related fact — then continue questioning.
5. Keep every reply under 120 words.

Start by asking what I already know about {{subject}}, then build from there.`,
  },
  {
    id: "sp_code_review",
    author: "daniel",
    title: "Pull request review checklist",
    description: "Structured code review that separates blocking issues from nits, with concrete suggested diffs.",
    category: "Coding",
    tags: ["review", "quality", "pull-request"],
    visibility: "public",
    ageDays: 61,
    updatedDaysAgo: 14,
    content: `Review the following diff as a senior engineer on my team would.

Context about the change:
{{context}}

The diff:
{{diff}}

Respond in exactly this structure:

## Verdict
One of: APPROVE, APPROVE WITH NITS, REQUEST CHANGES — plus one sentence why.

## Blocking issues
Numbered list. Each entry: file and line, the problem, and a concrete suggested change. If none, write "None."

## Nits
Optional style or naming suggestions. If none, write "None."

## Test gaps
What behavior is untested. Name the test cases you would add.

Do not restate the diff. Do not praise filler. Be specific enough that I can act without opening the code again.`,
  },
  {
    id: "sp_paper_extractor",
    author: "avery",
    title: "Paper claims extractor",
    description: "Turn a dense academic paper into a claim/evidence/limitation table you can trust.",
    category: "Research",
    tags: ["papers", "extraction", "evidence"],
    visibility: "public",
    ageDays: 33,
    updatedDaysAgo: 4,
    content: `Extract the core argument structure from this paper:

{{paper_text}}

Return a table with three columns: Claim, Evidence, Limitation.

Rules:
- One row per distinct claim the authors actually make (usually 3–7).
- Claim: paraphrase in plain language, under 25 words.
- Evidence: name the specific experiment, dataset, or citation the authors use. If the evidence is asserted but not shown, write "asserted, not shown".
- Limitation: the paper's own stated limitation; if none is stated, write "none stated" — do not invent one.

After the table, write two sentences: who should read this paper, and the single most quotable finding.`,
  },
  {
    id: "sp_tone_shifter",
    author: "jules",
    title: "Tone shifter",
    description: "Rewrite any draft into a different register without losing a single fact.",
    category: "Writing",
    tags: ["editing", "tone", "rewrite"],
    visibility: "public",
    ageDays: 27,
    updatedDaysAgo: 2,
    content: `Rewrite the text below in the register of {{tone}}, aimed at {{audience}}.

Original text:
{{text}}

Rules:
- Keep every fact, number, and proper noun exactly as written.
- Match the original length within ±15%.
- Do not add apologies, hedges, or enthusiasm the original did not have.
- Output only the rewritten text — no preamble, no notes about what you changed.

If the requested tone would make a statement misleading, keep the statement and note the conflict in a single line at the end.`,
  },
  {
    id: "sp_decision_log",
    author: "sam",
    title: "Meeting to decision log",
    description: "Convert messy meeting notes into a decision log with owners and dates.",
    category: "Productivity",
    tags: ["meetings", "notes", "decisions"],
    visibility: "public",
    ageDays: 52,
    updatedDaysAgo: 18,
    content: `Convert these meeting notes into a decision log:

{{notes}}

Format:

DECISIONS
- [date if known] Decision — owner — follow-up date if stated

OPEN QUESTIONS
- Question — who was asked to resolve it

ACTION ITEMS
- Task — owner — due date (write "no date" when absent)

Facts only. Do not create owners or dates that are not in the notes. If the notes contain no decisions, say so in one line and list the open questions instead.`,
  },
  {
    id: "sp_regex_builder",
    author: "daniel",
    title: "Regex builder with test cases",
    description: "Get a working regular expression plus the cases that prove it, in your engine of choice.",
    category: "Coding",
    tags: ["regex", "parsing", "tools"],
    visibility: "public",
    ageDays: 70,
    updatedDaysAgo: 22,
    content: `Write a regular expression for this task in {{flavor}} syntax:

Task: {{task}}

Examples that must match:
{{positive_examples}}

Examples that must NOT match:
{{negative_examples}}

Respond with:
1. The regex, on a single line, ready to copy.
2. A short plain-language explanation of each part of the pattern.
3. A table of every example above with MATCH / NO MATCH and the substring it captures.
4. One edge case the pattern does not handle, and how to handle it.

Prefer readability over cleverness. No lookbehind unless the task requires it.`,
  },
  {
    id: "sp_analogy",
    author: "mira",
    title: "Explain it with an analogy",
    description: "Explain a hard concept three ways: analogy, concrete example, then the technical truth.",
    category: "Education",
    tags: ["explaining", "concepts", "teaching"],
    visibility: "public",
    ageDays: 41,
    updatedDaysAgo: 11,
    content: `Explain {{concept}} to me. My background: {{background}}.

Structure your answer in exactly three parts:

1. Analogy — one everyday analogy, max 80 words. End with one sentence naming where the analogy breaks down.
2. Concrete example — a worked example with real numbers or real steps, not placeholders.
3. Technical truth — the precise definition, with the terms I will encounter in papers and docs, each defined in one line.

Do not use the words "simply", "just", or "basically". Do not ask me questions.`,
  },
  {
    id: "sp_bug_repro",
    author: "avery",
    title: "Bug report distiller",
    description: "Turn a rambling bug description into a minimal, reproducible report a team can act on.",
    category: "Coding",
    tags: ["bugs", "debugging", "reports"],
    visibility: "public",
    ageDays: 24,
    updatedDaysAgo: 6,
    content: `Rewrite this bug description as a minimal reproducible report:

{{report}}

Include:
- Title: symptom first, component second (max 12 words)
- Environment: version, OS, browser or runtime — only what the report mentions
- Steps to reproduce: numbered, starting from a clean state
- Expected vs actual: one sentence each
- Minimal signal: the smallest snippet, log line, or config that triggers it
- Suspected area: one line, marked as a guess

Strip opinions, blame, and workarounds that hide the root cause. If a required field is missing from the report, write "MISSING:" and name it.`,
  },
  {
    id: "sp_weekly_review",
    author: "sam",
    title: "Weekly review questions",
    description: "A short, honest end-of-week review that produces next week's plan.",
    category: "Personal",
    tags: ["reflection", "planning", "weekly"],
    visibility: "public",
    ageDays: 19,
    updatedDaysAgo: 3,
    content: `Guide me through a weekly review. My notes from this week:

{{week_notes}}

Ask me one question at a time, in this order:
1. What actually moved forward?
2. What did I avoid, and what was the real reason?
3. What drained time without producing value?
4. What one thing should be smaller or dropped?
5. What are the three outcomes that matter next week?

After my fifth answer, produce:
- A three-item priority list for next week, each with a first concrete step
- One thing to stop doing
- One sentence describing the week in a way I would agree with

Keep every reply under 100 words. Be direct, not gentle.`,
  },
  {
    id: "sp_announcement",
    author: "jules",
    title: "Launch announcement draft",
    description: "Draft a launch announcement from raw changelog notes, in two lengths.",
    category: "Marketing",
    tags: ["launch", "announcement", "copy"],
    visibility: "public",
    ageDays: 58,
    updatedDaysAgo: 15,
    content: `Draft a launch announcement from these changelog notes:

{{changelog}}

Audience: {{audience}}
Brand voice: {{voice}}

Write two versions:
1. Short — 60 words max, suitable for social or in-app message. Lead with the user benefit, not the feature name.
2. Long — 180 words max, suitable for email or a blog section. Structure: what shipped, who it is for, one concrete before/after, one line on what is next.

Rules: no exclamation marks, no "we're excited", no superlatives you cannot support from the notes. If a note is internal-only, skip it and list what you skipped in one line.`,
  },
];

const OWN_SEEDS: SeedInput[] = [
  {
    id: "own_cold_email",
    author: "demo",
    title: "Cold email opener",
    description: "First-touch outreach that references something real about the recipient's work.",
    category: "Marketing",
    tags: ["outreach", "sales", "email"],
    visibility: "private",
    collectionId: "col_client",
    ageDays: 30,
    updatedDaysAgo: 5,
    content: `Write a cold email to {{recipient}}, who {{recipient_context}}.

Our product: {{product}}
Their likely problem: {{pain_point}}

Rules:
- Subject line under 7 words, no clickbait, no "quick question".
- Open with the specific thing about their work — not a compliment, an observation.
- One sentence on the problem, one sentence on the mechanism of the fix, one clear ask.
- Under 120 words total. No "hope this finds you well". Sign off as {{sender_name}}.`,
  },
  {
    id: "own_pr_description",
    author: "demo",
    title: "PR description writer",
    description: "Turn a diff summary into a reviewer-ready pull request description.",
    category: "Coding",
    tags: ["git", "review", "workflow"],
    visibility: "private",
    collectionId: "col_ship",
    ageDays: 21,
    updatedDaysAgo: 2,
    content: `Write a pull request description for this change:

{{changes}}

Testing done: {{testing}}

Format:

## What
2–4 bullets describing the change in reviewer language.

## Why
1–2 sentences on the problem being solved. Link the ticket number if I gave one: {{ticket}}

## How
The approach taken and any alternative that was rejected, one line each.

## Risk & rollout
Risk level (low/medium/high) with one line of reasoning. Rollback plan in one line.

## Testing
Paste my testing notes, cleaned up.

No emoji. No restating file names unless they explain the design.`,
  },
  {
    id: "own_interview_bank",
    author: "demo",
    title: "Interview question bank",
    description: "Generate role-specific interview questions with strong and weak signal answers.",
    category: "Education",
    tags: ["interview", "hiring", "prep"],
    visibility: "private",
    collectionId: "col_study",
    ageDays: 44,
    updatedDaysAgo: 12,
    content: `Build an interview question bank for a {{role}} position at {{level}} level at a {{company_type}} company.

Include 8 questions across: craft depth, system design judgment, collaboration, and failure handling.

For each question provide:
- The question
- What strong signal looks like (2 bullets)
- What weak signal looks like (2 bullets)
- One follow-up probe

Avoid trivia and brainteasers. Prefer questions whose answers reveal how the person works, not what they memorized.`,
  },
  {
    id: "own_thread_summary",
    author: "demo",
    title: "Summarize this thread",
    description: "Compress a long discussion into decisions, disagreements, and next steps.",
    category: "Productivity",
    tags: ["summary", "threads", "async"],
    visibility: "private",
    ageDays: 16,
    updatedDaysAgo: 1,
    content: `Summarize this discussion thread in {{format}} format for {{audience}}.

Thread:
{{thread}}

Capture:
1. Decisions made, with who proposed them if stated
2. Open disagreements, with each side's position in one line
3. Action items with owners
4. Context that will matter in a week but was never decided

Do not smooth over disagreement. Do not invent consensus. Under 300 words.`,
  },
  {
    id: "own_standup_digest",
    author: "demo",
    title: "Daily standup digest",
    description: "Published so teammates can save their own copy. Turns raw notes into a standup update.",
    category: "Productivity",
    tags: ["standup", "async", "team"],
    visibility: "public",
    ageDays: 12,
    updatedDaysAgo: 3,
    content: `Turn my raw notes into a standup update:

{{notes}}
Team context: {{team}}

Format, under 90 words:
- Yesterday: what actually shipped, not what was started
- Today: the one focus, plus anything time-boxed
- Blockers: only blockers that need someone else; write "none" otherwise

Strip status theater. If my "today" list has more than three items, keep the three that matter and say so in one line.`,
  },
  {
    id: "own_arch_advisor",
    author: "demo",
    title: "Architecture advisor",
    description: "Long-form decision partner for system design. Includes constraints checklist and failure-mode review.",
    category: "Coding",
    tags: ["architecture", "systems", "long-form"],
    visibility: "private",
    collectionId: "col_ship",
    ageDays: 9,
    updatedDaysAgo: 0,
    content: `You are a pragmatic staff engineer advising on an architecture decision. Be direct. Prefer boring technology unless the problem earns novelty.

## Decision to make
{{decision}}

## Constraints
{{constraints}}

## Current system
{{current_system}}

## Required output

### 1. Recommendation
One architecture, named plainly. Two sentences of reasoning. If the decision is premature, say what evidence is missing instead of hedging.

### 2. Options considered
A table: Option | Fits constraints | Operational cost | Rejected because. Include the obvious default even if it loses.

### 3. Failure modes
The three ways this breaks in production, each with the early signal that would reveal it and the mitigation.

### 4. Migration path
If there is an existing system: the incremental path from current to recommended, in ordered steps, each independently shippable. If greenfield, write "greenfield".

### 5. Open questions
Questions I should answer before committing, max five, each with how to answer it cheaply.

## Style rules
- No marketing language. No "it depends" without a named variable.
- Every claim about a technology must be something you would defend in a design review.
- If my constraints contradict each other, name the contradiction first, then recommend which to relax.
- Keep code samples minimal and in {{language}}; pseudocode is fine when the structure matters more than the syntax.
- Assume I will paste this into a design doc: no chit-chat, no preamble.`,
  },
];

const OWN_COLLECTIONS: CollectionDoc[] = [
  {
    id: "col_client",
    ownerId: DEMO_UID,
    name: "Client work",
    description: "Outreach and deliverable prompts for client engagements.",
    createdAt: now - 28 * DAY,
    updatedAt: now - 5 * DAY,
  },
  {
    id: "col_study",
    ownerId: DEMO_UID,
    name: "Study",
    description: "Learning, interview prep, and research helpers.",
    createdAt: now - 40 * DAY,
    updatedAt: now - 12 * DAY,
  },
  {
    id: "col_ship",
    ownerId: DEMO_UID,
    name: "Shipping",
    description: "Engineering workflow: PRs, reviews, architecture.",
    createdAt: now - 20 * DAY,
    updatedAt: now - 2 * DAY,
  },
];

export const SEED_PUBLIC_PROMPTS: PromptDoc[] = PUBLIC_SEEDS.map(toPrompt);
export const SEED_OWN_PROMPTS: PromptDoc[] = OWN_SEEDS.map(toPrompt);
export const SEED_COLLECTIONS: CollectionDoc[] = OWN_COLLECTIONS;
export const SEED_FAVORITES: string[] = ["sp_socratic_tutor", "own_cold_email", "sp_paper_extractor"];
export const SEED_RECENTS: { promptId: string; accessedAt: number }[] = [
  { promptId: "own_pr_description", accessedAt: now - 2 * 3600_000 },
  { promptId: "own_arch_advisor", accessedAt: now - 26 * 3600_000 },
  { promptId: "sp_code_review", accessedAt: now - 50 * 3600_000 },
  { promptId: "own_thread_summary", accessedAt: now - 74 * 3600_000 },
  { promptId: "sp_tone_shifter", accessedAt: now - 98 * 3600_000 },
];
