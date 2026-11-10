// Admin-only. Every request must carry the signed-in admin's Supabase session
// token (Authorization: Bearer <access_token>), and that user must have
// profiles.is_admin. Deploy with JWT verification ON (the default) so the
// gateway also rejects token-less requests before this code runs.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { CURRICULUM, getCurriculum } from './caps_curriculum.ts';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SB_SERVICE_KEY = Deno.env.get('SB_SERVICE_KEY') ?? '';
const PDF_API = 'https://www.curiolearning.co.za/api/generate-pdf';
const MODEL = 'claude-haiku-4-5-20251001';

// Only the admin panel calls this. CORS isn't the security boundary (the admin
// check is); it just stops other sites' pages from reading the responses.
const ALLOWED_ORIGINS = ['https://www.curiolearning.co.za', 'https://curiolearning.co.za'];

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') ?? '';
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Vary': 'Origin',
  };
}

// ── SA NAMES ──────────────────────────────────────────────────────────────────
const SA_NAMES = `Use a diverse mix of South African names from ALL communities — do NOT default to only Zulu/Xhosa names.
- Nguni: Sipho, Thabo, Nomsa, Zinhle, Lungelo, Bongani, Nandi, Nokwanda, Mbuso
- Sotho/Tswana/Pedi: Lerato, Keamo, Mpho, Refilwe, Lesego, Katlego, Tshepiso, Kagiso
- Venda/Tsonga: Khanyisa, Murendeni, Tinyiko, Nkhensani
- Afrikaans: Liezel, Ruan, Mia, Liam, Jané, Corné, Riaan, Anke
- English SA: Dylan, Chloe, Jason, Amber, Kyle, Samantha, Jordan, Paige
- Indian SA: Priya, Aryan, Kavya, Rohan, Nisha, Vikram, Aisha, Deven
- Cape Malay/Coloured: Gadija, Faried, Sameera, Ashraf, Nuraan, Marlon, Celeste
- Portuguese SA: Marco, Tiago, Sofia, Luís, Catarina
SA settings: Soweto, Bo-Kaap, Sea Point, Khayelitsha, Chatsworth, Johannesburg, Pretoria, Polokwane, Limpopo farm, Free State dorpie, township school, suburban school, Cape beach.`;

// ── TOPIC SPINNER ─────────────────────────────────────────────────────────
// Wide topic pool grouped by grade band
const TOPICS_LOWER = [ // Gr 4-6
  // People & Community
  'a helpful neighbour in a South African township',
  'a child who starts a recycling project at their school',
  'a grandmother who teaches her grandchildren to cook traditional food',
  'a young soccer player who overcomes an injury',
  'a class trip to the Cradle of Humankind',
  'a family preparing for Heritage Day celebrations',
  'a market day at a South African primary school',
  // Nature & Environment
  'how the baobab tree got its shape (African legend)',
  'the importance of saving water in South Africa',
  'a rainy season flood and how a community helped each other',
  'growing vegetables in a township garden',
  'cleaning up a local beach or river',
  // Science & Technology
  'how rainbows are formed',
  'why we need to sleep',
  'how a simple machine like a lever works',
  'the life cycle of a butterfly',
  'what happens when you mix baking soda and vinegar',
  // History & Culture
  'Nelson Mandela as a child growing up in the Eastern Cape',
  'the story of the San people and rock art',
  'a traditional Zulu, Sotho, or Venda ceremony for children',
  'the history of Cape Town\'s Bo-Kaap neighbourhood',
  // Sport & Health
  'a young South African runner training for a race',
  'why eating fruit and vegetables is important',
  'learning to swim at a community pool',
  // Narrative / Fable
  'Aesop\'s fable: the tortoise and the hare',
  'a traditional African story about how the zebra got its stripes',
  'a story about a child who learns honesty is the best policy',
  'a folktale about why the sun and moon are in the sky',
];

const TOPICS_UPPER = [ // Gr 7-9
  // Social Issues
  'youth unemployment in South Africa and what young people are doing about it',
  'the impact of load-shedding on South African students and schools',
  'gender-based violence awareness campaigns in SA',
  'social media\'s effect on teenagers\' mental health',
  'the importance of voting in South Africa\'s democracy',
  'food security and hunger in rural South African communities',
  // Environment
  'South Africa\'s drought crisis and water conservation efforts',
  'rhino poaching and anti-poaching efforts in Kruger National Park',
  'the impact of plastic pollution on South African coastal ecosystems',
  'climate change and its effects on SA agriculture',
  'solar energy as a solution to South Africa\'s electricity crisis',
  // History & Heritage
  'the history of District Six in Cape Town',
  'the role of women in the 1956 anti-pass march',
  'South Africa\'s transition to democracy in 1994',
  'Steve Biko and the Black Consciousness Movement',
  'the impact of apartheid on education in South Africa',
  // Science & Technology
  'how vaccines work and why herd immunity matters',
  'artificial intelligence and its effect on future jobs',
  'the James Webb Space Telescope and new discoveries about the universe',
  'how misinformation spreads on social media',
  // Inspiring People
  'a young South African entrepreneur solving a local problem',
  'a South African scientist or inventor making a difference',
  'the story of a Paralympic athlete from South Africa',
];

function randomTopic(grade: number): string {
  const pool = grade <= 6 ? TOPICS_LOWER : TOPICS_UPPER;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ── GRADE-APPROPRIATE QUESTION COUNTS ──────────────────────────────────────────
function questionCount(grade: number, sectionType: string): number {
  // Randomised within grade-appropriate bands, matching real CAPS paper norms
  if (sectionType === 'Language Practice') {
    // Lang practice: fixed short sets
    if (grade <= 4) return 10 + Math.floor(Math.random() * 3);  // 10-12
    if (grade <= 6) return 12 + Math.floor(Math.random() * 3);  // 12-14
    return 15 + Math.floor(Math.random() * 3);                   // 15-17
  }
  if (sectionType === 'Poetry Analysis') {
    if (grade <= 5) return 10 + Math.floor(Math.random() * 3);  // 10-12
    if (grade <= 7) return 12 + Math.floor(Math.random() * 3);  // 12-14
    return 12 + Math.floor(Math.random() * 4);                   // 12-15
  }
  if (sectionType === 'Summary') {
    return 8 + Math.floor(Math.random() * 3);                    // 8-10
  }
  // Comprehension & Visual Literacy
  if (grade <= 4) return 12 + Math.floor(Math.random() * 3);    // 12-14
  if (grade <= 6) return 13 + Math.floor(Math.random() * 3);    // 13-15
  if (grade <= 7) return 14 + Math.floor(Math.random() * 3);    // 14-16
  return 15 + Math.floor(Math.random() * 4);                     // 15-18
}

// ── STRIP AI ARTEFACTS FROM SEARCH OUTPUT ──────────────────────────────────────
// Haiku narrates its thinking between tool use blocks. Strip those lines.
function stripArtefacts(raw: string): string {
  const ARTEFACT_PATTERNS = [
    /^I('ll| will| am going to| need to| found| have| can| should| must| will now)\b.*/i,
    /^Let me\b.*/i,
    /^Now I('ll| will)?\b.*/i,
    /^Perfect[!.]?.*/i,
    /^Great[!.]?.*/i,
    /^Excellent[!.]?.*/i,
    /^Here('s| is)\b.*/i,
    /^Based on (my |the |this )?(search|research|information|results|source|article|text|passage|content|findings).*/i,
    /^Looking at\b.*/i,
    /^After (searching|reviewing|reading|finding|checking).*/i,
    /^The (search|article|source|text|passage|information|results) (shows?|reveals?|provides?|indicates?|suggests?|contains?).*/i,
    /^From (the |my |this )?(search|article|source|results|research|text).*/i,
    /^Using (this|the) (information|source|text|article|passage).*/i,
    /^---+$/,  // horizontal rules
    /^\*\*Step \d/i,
    /^Step \d[:.]/i,
  ];

  return raw
    .split('\n')
    .filter(line => {
      const t = line.trim();
      if (!t) return true; // keep blank lines
      return !ARTEFACT_PATTERNS.some(p => p.test(t));
    })
    .join('\n')
    // Collapse 3+ consecutive blank lines to 1
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ── CLAUDE CALLS ─────────────────────────────────────────────────────────────────
async function callClaudeWithSearch(prompt: string): Promise<string> {
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4096,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!resp.ok) throw new Error(`Claude search ${resp.status}: ${await resp.text()}`);
  const data = await resp.json();
  // Only take the LAST text block — intermediate blocks are thinking/narration
  const textBlocks = (data.content ?? []).filter((b: {type:string}) => b.type === 'text');
  const raw = textBlocks.length > 0 ? (textBlocks[textBlocks.length - 1] as {text:string}).text.trim() : '';
  return stripArtefacts(raw);
}

async function callClaude(prompt: string): Promise<string> {
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: MODEL, max_tokens: 4096, messages: [{ role: 'user', content: prompt }] }),
  });
  if (!resp.ok) throw new Error(`Claude ${resp.status}: ${await resp.text()}`);
  return (await resp.json()).content[0].text.trim();
}

// ── PROMPT FACTORY ───────────────────────────────────────────────────────────
function buildPrompt(grade: number, term: string, sectionType: string, topic: string, existing: string[], qCount: number): string {
  const curr = getCurriculum(grade, term);
  const existingList = existing.length ? existing.map(t => `- ${t}`).join('\n') : 'None yet';
  const gradeLabel = `Grade ${grade}`;
  const gradeBand = grade <= 6 ? 'Intermediate Phase (Grades 4–6)' : 'Senior Phase (Grades 7–9)';
  const grammarContext = curr.grammar.slice(0, 18).join('; ');
  const newSkillsContext = curr.newSkills.join('; ');
  const complexity = grade <= 4 ? 'very simple (1-2 mark questions, circle/underline/fill-in, Grade 4 reading level)'
    : grade <= 6 ? 'moderate (mix of 1-3 mark questions, some extended answers)'
    : 'challenging (1-5 mark questions, inference required, evidence-based responses)';
  const passageLength = grade <= 4 ? '150-200' : grade <= 6 ? '200-280' : grade <= 7 ? '280-380' : '350-500';
  const markRange = grade <= 4 ? '(1) or (2)' : grade <= 6 ? '(1), (2), or (3)' : '(1), (2), (3), (4), or (5)';

  // CRITICAL: these instructions go in EVERY prompt regardless of section type
  const STRICT_OUTPUT_RULES = `
CRITICAL OUTPUT RULES — VIOLATION WILL BREAK THE PDF:
1. Output ONLY the formatted exercise. NO preamble, NO narration, NO explanations.
2. Do NOT write sentences like "I'll search for...", "Here is...", "Based on my search...", "Perfect!", "Let me...", "I found..."
3. Start your output IMMEDIATELY with: Source: ...
4. The ONLY text in your response is: Source line, passage/content, QUESTIONS header, numbered questions, MEMORANDUM header, numbered answers.
5. Nothing before "Source:", nothing after the last memorandum answer.`;

  if (sectionType === 'Comprehension') {
    const formats = curr.comprehensionFormats.slice(0, 8).join('\n- ');
    return `You are creating a ${gradeLabel} English Home Language Comprehension exercise for SA CAPS.
${SA_NAMES}
${STRICT_OUTPUT_RULES}

TASK: Search for a real text about "${topic}" to adapt.
Suggested sources: News24, BBC, NatGeo Kids, AllAfrica, Wikipedia, Britannica, Aesop fables, African folklore.
Adapt to ${passageLength} words at ${gradeLabel} reading level. Keep core facts accurate. Simplify language.${grade <= 6 ? ' Short sentences, common words.' : ''}

PHASE: ${gradeBand} | TERM: ${term} | COMPLEXITY: ${complexity}
GRAMMAR STUDENTS KNOW: ${grammarContext}
NEW SKILLS THIS TERM: ${newSkillsContext}

OUTPUT FORMAT:

Source: [Real citation: Publication, title, year]

[PASSAGE TITLE IN CAPITALS — 3-6 words]

[Adapted passage. ONE blank line between paragraphs.]

QUESTIONS
[EXACTLY ${qCount} questions numbered 1 to ${qCount}. NO section labels. EASIEST to HARDEST. Every question ends with ${markRange}.]

QUESTION TYPES — mix ALL of these:
- ${formats}

MEMORANDUM
[EXACTLY ${qCount} answers numbered 1 to ${qCount}. Use ✔ per mark. Multiple choice: letter only. TRUE/FALSE: T/F + reason.]

EXISTING TITLES TO AVOID: ${existingList}`;
  }

  if (sectionType === 'Poetry Analysis') {
    const poetrySkills = curr.poetrySkills.join('\n- ');
    const poemLength = grade <= 5 ? '10-14 lines' : grade <= 7 ? '12-18 lines' : '14-24 lines';
    return `You are creating a ${gradeLabel} English Home Language Poetry Analysis exercise for SA CAPS.
${SA_NAMES}
${STRICT_OUTPUT_RULES}

TASK: Search for a published poem about "${topic}".
Prefer: SA poets (Oswald Mtshali, Ingrid Jonker, Don Mattera) or (Robert Frost, Langston Hughes${grade <= 6 ? ', Shel Silverstein' : ''}).
Poem must be ${poemLength} and suitable for ${gradeLabel}.
If no suitable real poem: write ORIGINAL poem inspired by SA poetry style.

POETRY FORMATTING: EVERY line on its OWN line. ONE blank line between stanzas. NEVER merge lines.

PHASE: ${gradeBand} | TERM: ${term} | COMPLEXITY: ${complexity}

OUTPUT FORMAT:

Source: [Poet, title, collection, year. If original: "Original poem (Curio Learning)"]

[POEM TITLE IN CAPITALS]

[Poem — each line on its own line, blank line between stanzas]

QUESTIONS
[EXACTLY ${qCount} questions numbered 1 to ${qCount}. EASIEST to HARDEST. Every question ends with ${markRange}.]

QUESTION TYPES — use all that apply:
- ${poetrySkills}

MEMORANDUM
[EXACTLY ${qCount} answers. Use ✔. Accept reasonable opinion answers.]

EXISTING TITLES TO AVOID: ${existingList}`;
  }

  if (sectionType === 'Visual Literacy') {
    return `You are creating a ${gradeLabel} English Home Language Visual Literacy exercise for SA CAPS.
${SA_NAMES}
${STRICT_OUTPUT_RULES}

TASK: Search for a real South African public awareness campaign, poster, or advertisement about "${topic}".
If nothing suitable: create a detailed fictional SA visual text.
Describe it fully — layout, all text, colours, data values, slogans, dialogue.

PHASE: ${gradeBand} | TERM: ${term} | COMPLEXITY: ${complexity}

OUTPUT FORMAT:

Source: [Real source, or "Fictional visual text (Curio Learning)"]

[VISUAL TITLE IN CAPITALS — 3-5 words]

[Detailed description of every visible element.]

QUESTIONS
[EXACTLY ${qCount} questions numbered 1 to ${qCount}. EASIEST to HARDEST. Every question ends with (1), (2), or (3).]

QUESTION TYPES:
- Purpose of this visual? (1)
- Target audience? Give a reason (2)
- Identify the slogan. What effect does it have? (2)
- What persuasion technique is used? Explain (2)
- What does the data show about [element]? (2)
- Is this information trustworthy? Explain (3)
- How do visual elements support the message? (3)
- Is this visual effective? YES/NO + reason (2)

MEMORANDUM
[EXACTLY ${qCount} answers. Use ✔.]

EXISTING TITLES TO AVOID: ${existingList}`;
  }

  if (sectionType === 'Summary') {
    return `You are creating a ${gradeLabel} English Home Language Summary exercise for SA CAPS.
${SA_NAMES}
${STRICT_OUTPUT_RULES}

TASK: Search for a real informational/news article about "${topic}".
Adapt to ${passageLength} words at ${gradeLabel} level — informational/report style.

PHASE: ${gradeBand} | TERM: ${term}

OUTPUT FORMAT:

Source: [Real citation]

[TEXT TITLE IN CAPITALS — 3-5 words]

[Adapted passage — well-structured, clear main ideas.]

QUESTIONS
[EXACTLY ${qCount} questions. Comprehension questions (1-2 marks) + summary task worth 8 marks as the last question.]

SUMMARY TASK (last question): "Write a summary in your OWN WORDS: 4-6 sentences. Use these points:
1. [Point 1]
2. [Point 2]
3. [Point 3]
4. [Point 4]" (8)

MEMORANDUM
[EXACTLY ${qCount} answers. Use ✔. Summary: model answer + rubric.]

EXISTING TITLES TO AVOID: ${existingList}`;
  }

  if (sectionType === 'Transactional Writing') {
    const formats = grade <= 6
      ? 'informal letter to a friend, formal letter of complaint, simple notice, invitation'
      : 'formal letter (complaint/application/enquiry), email (formal or informal), report, speech, review';
    return `You are creating a ${gradeLabel} English Home Language Transactional Writing exercise for SA CAPS.
${SA_NAMES}
${STRICT_OUTPUT_RULES}

CHOOSE a format from: ${formats}
Use SA names and settings in the scenario.

PHASE: ${gradeBand} | TERM: ${term} | COMPLEXITY: ${complexity}

OUTPUT FORMAT:

Source: Transactional Writing — ${gradeLabel} English Home Language (${term})

QUESTIONS
[Main writing TASK: scenario, format, audience, purpose, length. Then 3-4 shorter format/language questions. Every question ends with mark value.]

MEMORANDUM
[Layout checklist, model answer (first paragraph), marking rubric.]

EXISTING TITLES TO AVOID: ${existingList}`;
  }

  // LANGUAGE PRACTICE (default)
  const langQTypes = curr.languageQuestionTypes.join('\n- ');
  return `You are creating a ${gradeLabel} English Home Language Language Practice exercise for ${term} (SA CAPS).
${SA_NAMES}
${STRICT_OUTPUT_RULES}

PHASE: ${gradeBand} | COMPLEXITY: ${complexity}
GRAMMAR STUDENTS KNOW: ${grammarContext}
NEW SKILLS THIS TERM (focus 60-70% of questions here): ${newSkillsContext}
${topic ? 'CONTEXT/THEME: ' + topic : ''}

RULES:
1. NO reading passage. Standalone language questions ONLY.
2. Every question includes sentence/word/options INSIDE the question.
3. Short direct questions like real SA tests.
4. Use diverse SA names — vary them.
5. Do NOT repeat the same format more than twice.
6. 60-70% new term skills, 30-40% review.

QUESTION TYPES:
- ${langQTypes}

OUTPUT FORMAT:

Source: Language Practice — ${gradeLabel} English Home Language (${term})

QUESTIONS
[EXACTLY ${qCount} questions numbered 1 to ${qCount}. NO section labels. EASIEST to HARDEST. Every question ends with ${markRange}.]

MEMORANDUM
[EXACTLY ${qCount} answers. Use ✔. Exact answer. Rewrites: full sentence.]

EXISTING SETS TO AVOID: ${existingList}`;
}

// ── PARSER ───────────────────────────────────────────────────────────────────
function parse(raw: string) {
  const lines = raw.split('\n');
  let qStart = -1, mStart = -1;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trim();
    if (/^questions?$/i.test(l) && qStart === -1) qStart = i;
    if (/^(marking\s+)?memo(randum)?$/i.test(l) && mStart === -1) mStart = i;
  }
  let source = '';
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    if (/^source:/i.test(lines[i].trim())) { source = lines[i].trim().replace(/^source:\s*/i, ''); break; }
  }
  const passEnd = qStart > -1 ? qStart : (mStart > -1 ? mStart : lines.length);
  const passLines: string[] = []; let fc = false;
  for (let i = 0; i < passEnd; i++) {
    const l = lines[i].trim();
    if (/^source:/i.test(l)) continue;
    if (!l) { if (fc) passLines.push(''); } else { fc = true; passLines.push(l); }
  }
  while (passLines.length && passLines[passLines.length - 1] === '') passLines.pop();
  const passage = passLines.join('\n').trim();
  const qEnd = mStart > -1 ? mStart : lines.length;
  const questions: { num: number; text: string; marks: number }[] = []; let totalMarks = 0;
  if (qStart > -1) {
    for (let i = qStart + 1; i < qEnd; i++) {
      const l = lines[i].trim(), rl = lines[i];
      if (!l) continue;
      if (/^\d+[.)]/.test(l)) questions.push({ num: questions.length + 1, text: l, marks: 1 });
      else if (questions.length > 0) {
        const bullet = /^\s*[*-]\s/.test(rl), bank = /\//.test(l) && l.split('/').length >= 2 && !/^\d+[.)]/.test(l), indent = /^\s{3,}/.test(rl);
        if (bullet || bank || indent) questions[questions.length - 1].text += '\n' + l;
        else questions[questions.length - 1].text += ' ' + l;
      }
    }
    questions.forEach(q => { const m = q.text.match(/\((\d+)\)\s*$/m); q.marks = m ? parseInt(m[1]) : 1; totalMarks += q.marks; });
  }
  const memo: { num: number; text: string }[] = [];
  if (mStart > -1) {
    for (let i = mStart + 1; i < lines.length; i++) {
      const l = lines[i].trim();
      if (!l) continue;
      if (/^\d+[.)]/.test(l)) memo.push({ num: memo.length + 1, text: l });
      else if (memo.length > 0) memo[memo.length - 1].text += '\n' + l;
    }
  }
  return { source, passage, questions, memo, totalMarks };
}

// ── AUTH ─────────────────────────────────────────────────────────────────────
// Returns the caller's access token if it belongs to an admin, otherwise null.
// The token is passed on to the PDF API, which runs the same admin check.
async function adminToken(req: Request, sb: ReturnType<typeof createClient>): Promise<string | null> {
  const auth = req.headers.get('Authorization') ?? '';
  if (!auth.startsWith('Bearer ')) return null;
  const token = auth.slice('Bearer '.length);
  try {
    const { data: { user }, error } = await sb.auth.getUser(token);
    if (error || !user) return null;
    const { data: profile } = await sb.from('profiles').select('is_admin').eq('id', user.id).single();
    return profile?.is_admin ? token : null;
  } catch {
    return null;
  }
}

// ── PDF + UPLOAD ─────────────────────────────────────────────────────────────
async function genPdf(payload: unknown, type: 'paper' | 'memo', token: string): Promise<Uint8Array> {
  const r = await fetch(`${PDF_API}?type=${type}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(payload) });
  if (!r.ok) throw new Error(`PDF ${r.status}: ${await r.text()}`);
  return new Uint8Array(await r.arrayBuffer());
}
async function uploadFile(sb: ReturnType<typeof createClient>, path: string, bytes: Uint8Array): Promise<string> {
  const { error } = await sb.storage.from('Papers').upload(path, bytes, { contentType: 'application/pdf', upsert: true });
  if (error) throw new Error(`Upload: ${error.message}`);
  return `${SUPABASE_URL}/storage/v1/object/public/Papers/${path}`;
}

// ── HANDLER ──────────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  const cors = corsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  const sb = createClient(SUPABASE_URL, SB_SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const token = await adminToken(req, sb);
  if (!token) {
    return new Response(JSON.stringify({ error: 'Admin sign-in required.' }), {
      status: 401, headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  if (req.method === 'GET') {
    const url = new URL(req.url);
    const grade = Number(url.searchParams.get('grade') ?? 4);
    const term = url.searchParams.get('term') ?? 'Term 1';
    const curr = getCurriculum(grade, term);
    return new Response(JSON.stringify({
      status: 'ok', v: 13, model: MODEL, grade, term,
      sectionTypes: curr.sectionTypes,
      grammarFocus: curr.grammar.slice(0, 8),
      newSkills: curr.newSkills,
      textTypes: curr.textTypes,
    }), { headers: { ...cors, 'Content-Type': 'application/json' } });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const grade = Number(body.grade ?? 4);
    // getCurriculum() silently falls back to Grade 4 for unknown grades, which
    // would file a mislabelled paper, so reject anything it doesn't cover.
    if (!CURRICULUM[grade]) {
      return new Response(JSON.stringify({ success: false, error: 'Unsupported grade.' }), {
        status: 400, headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }
    const subject = String(body.subject ?? 'English Home Language');
    const term = String(body.term ?? 'Term 1');
    const sectionType = String(body.section_type ?? 'Comprehension');
    const count = Math.max(1, Math.min(Math.trunc(Number(body.count ?? 1)) || 1, 5));
    const topicInput = String(body.topic ?? '').trim().slice(0, 200);
    const sectionTypeSlug = sectionType.toLowerCase().replace(/\s+/g, '_');

    const { count: existingCount } = await sb
      .from('papers').select('*', { count: 'exact', head: true })
      .eq('subject', 'english').eq('grade', grade).eq('section_type', sectionTypeSlug);
    let nextPaperNumber = (existingCount ?? 0) + 1;

    const { data: ex } = await sb.from('papers').select('title')
      .eq('subject', 'english').eq('grade', grade).eq('section_type', sectionTypeSlug);
    const existingTitles = (ex ?? []).map((r: { title: string }) => r.title);

    const results: unknown[] = [], errors: unknown[] = [];

    for (let i = 0; i < count; i++) {
      try {
        // Pick topic: use admin input if given, otherwise spin the wheel
        const topic = topicInput || randomTopic(grade);
        const qCount = questionCount(grade, sectionType);

        const prompt = buildPrompt(grade, term, sectionType, topic, existingTitles, qCount);
        const usesSearch = ['Comprehension','Poetry Analysis','Visual Literacy','Summary'].includes(sectionType);
        const raw = usesSearch ? await callClaudeWithSearch(prompt) : await callClaude(prompt);

        const parsed = parse(raw);
        if (parsed.questions.length === 0) throw new Error('No questions parsed. Raw: ' + raw.slice(0, 400));

        const passage = sectionType === 'Language Practice' ? '' : parsed.passage;
        const paperTitle = `Grade ${grade} English HL · ${sectionType} · Paper ${nextPaperNumber}`;
        const dbTitle = `Grade ${grade} English HL · ${sectionType} · Paper ${nextPaperNumber} (${term})`;
        nextPaperNumber++;
        existingTitles.push(dbTitle);

        const pdfPayload = {
          title: paperTitle,
          grade: String(grade), subject, section_type: sectionType,
          topic, source: parsed.source, passage,
          grade_band: grade <= 7 ? '4-7' : '8-12',
          questions: parsed.questions, memo: parsed.memo,
        };

        const [paperPdf, memoPdf] = await Promise.all([genPdf(pdfPayload, 'paper', token), genPdf(pdfPayload, 'memo', token)]);

        const slug = paperTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
        const uid = crypto.randomUUID().slice(0, 8);
        const paperUrl = await uploadFile(sb, `gr${grade}-english-hl/${slug}-${uid}.pdf`, paperPdf);
        const memoUrl = await uploadFile(sb, `gr${grade}-english-hl/${slug}-${uid}-memo.pdf`, memoPdf);

        const { data: ins, error: ie } = await sb.from('papers').insert({
          grade, subject: 'english', title: dbTitle,
          topic: `${term}: ${sectionType} — ${topic}`,
          file_url: paperUrl, memo_url: memoUrl,
          has_memo: true, is_premium: false, section_type: sectionTypeSlug,
        }).select('id').single();
        if (ie) throw new Error(`DB: ${ie.message}`);

        results.push({ paper_number: i + 1, id: ins?.id, title: dbTitle, topic, section_type: sectionType, questions: parsed.questions.length, marks: parsed.totalMarks, paper_url: paperUrl, memo_url: memoUrl });
      } catch (e) { errors.push({ paper_number: i + 1, error: String(e) }); }
    }

    return new Response(JSON.stringify({ success: results.length > 0, generated: results.length, results, errors }), {
      status: results.length > 0 ? 200 : 500, headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: String(e) }), {
      status: 500, headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
