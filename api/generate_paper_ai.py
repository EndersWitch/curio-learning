"""
api/generate-paper-ai.py
Curio Learning — Bulk AI Paper Generator
Calls Claude to generate CAPS-aligned papers, renders PDFs via _pdf_generator.py,
uploads to Supabase Storage via REST API (no supabase SDK — stdlib urllib only),
and inserts rows into the papers table.
"""

import json
import os
import re
import time
import uuid
import urllib.request
from http.server import BaseHTTPRequestHandler

import anthropic
from _pdf_generator import generate_pdf_bytes

# ── Config ────────────────────────────────────────────────────────────────────
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://inmrsgujgfktapjnekjs.supabase.co")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
BUCKET = "Papers"

# ── CAPS knowledge ────────────────────────────────────────────────────────────
CAPS_GRADE4_ENGLISH_HL = {
    "Term 1": {
        "skills": ["Narrative writing", "Sentence construction", "Nouns", "Verbs", "Adjectives"],
        "text_types": ["Personal narrative", "Simple story"],
        "grammar_focus": ["Types of nouns (common, proper, collective)", "Action verbs", "Descriptive adjectives"],
    },
    "Term 2": {
        "skills": ["Descriptive writing", "Pronouns", "Punctuation", "Prefixes"],
        "text_types": ["Description of a person or place", "Simple descriptive paragraph"],
        "grammar_focus": ["Personal & possessive pronouns", "Capital letters & full stops", "Common prefixes (un-, re-, pre-)"],
    },
    "Term 3": {
        "skills": ["Informational writing", "Direct & indirect speech", "Tenses"],
        "text_types": ["Simple report", "Factual recount"],
        "grammar_focus": ["Direct speech punctuation", "Reported speech", "Present, past, future tense"],
    },
    "Term 4": {
        "skills": ["Persuasive writing", "Comprehension", "Poetry"],
        "text_types": ["Simple persuasive letter", "Short poem", "Reading comprehension passage"],
        "grammar_focus": ["Persuasive language features", "Reading for detail", "Rhyme and rhythm"],
    },
}

QUESTION_DISTRIBUTION = (
    "Assessment question distribution (DBE-aligned): "
    "40% Recall (literal), 30% Comprehension (explain in own words), "
    "20% Application (rewrite/use in context), 10% Analysis (infer/compare)."
)
SA_CONTEXTS = (
    "Use South African names (Thabo, Naledi, Sipho, Amara, Liezel, Ruan) "
    "and SA settings (townships, farms, beaches, Johannesburg, Cape Town, Durban, village schools)."
)

PAPER_STRUCTURE = """
A Grade 4 English HL paper has three sections:
SECTION A: Comprehension (passage 150-200 words + 6-8 questions, 30 marks)
SECTION B: Language in Context / Grammar (5-6 questions on the term grammar focus, 15 marks)
SECTION C: Writing (clear prompt with scaffolding, 15 marks)
Total: 60 marks
"""


# ── Supabase REST helpers (no SDK, stdlib urllib only) ────────────────────────

def _sb_headers(extra=None):
    h = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
    }
    if extra:
        h.update(extra)
    return h


def sb_get(path):
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/{path}",
        headers=_sb_headers(),
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read())


def sb_post(path, data):
    body = json.dumps(data).encode()
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/{path}",
        data=body,
        method="POST",
        headers=_sb_headers({"Prefer": "return=representation"}),
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read())


def sb_upload(filename, pdf_bytes):
    """Upload PDF bytes to Supabase Storage bucket via REST."""
    url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET}/{filename}"
    req = urllib.request.Request(
        url,
        data=pdf_bytes,
        method="POST",
        headers={
            "apikey": SUPABASE_SERVICE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
            "Content-Type": "application/pdf",
            "x-upsert": "true",
        },
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        resp.read()
    return f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET}/{filename}"


def get_existing_titles():
    try:
        rows = sb_get("papers?select=title&subject=eq.english&grade=eq.4")
        return [r["title"] for r in rows]
    except Exception:
        return []


# ── Prompt builders ───────────────────────────────────────────────────────────

def build_prompt(term, topic, existing_titles):
    caps = CAPS_GRADE4_ENGLISH_HL.get(term, CAPS_GRADE4_ENGLISH_HL["Term 1"])
    existing = "\n".join(f"- {t}" for t in existing_titles) if existing_titles else "None yet"

    return f"""You are a South African Grade 4 English Home Language teacher writing a CAPS-aligned exam paper.
{SA_CONTEXTS}

TERM: {term}
TOPIC FOCUS: {topic}
CAPS SKILLS: {", ".join(caps["skills"])}
GRAMMAR FOCUS: {", ".join(caps["grammar_focus"])}
TEXT TYPES: {", ".join(caps["text_types"])}

{PAPER_STRUCTURE}
{QUESTION_DISTRIBUTION}

EXISTING TITLES (make a fresh topic/theme):
{existing}

Respond with ONLY a JSON object — no markdown fences, no preamble:
{{
  "title": "Grade 4 English HL — [short theme] ({term})",
  "topic": "{term}: {topic}",
  "section_a": {{
    "passage_title": "string",
    "passage_text": "string (150-200 words, blank line between paragraphs)",
    "questions": [
      {{"number": 1, "question": "string", "marks": 2, "bloom": "recall"}},
      {{"number": 2, "question": "string", "marks": 2, "bloom": "recall"}},
      {{"number": 3, "question": "string", "marks": 3, "bloom": "comprehension"}},
      {{"number": 4, "question": "string", "marks": 3, "bloom": "comprehension"}},
      {{"number": 5, "question": "string", "marks": 3, "bloom": "application"}},
      {{"number": 6, "question": "string", "marks": 4, "bloom": "application"}},
      {{"number": 7, "question": "string", "marks": 5, "bloom": "analysis"}},
      {{"number": 8, "question": "string", "marks": 8, "bloom": "comprehension"}}
    ]
  }},
  "section_b": {{
    "instructions": "string",
    "questions": [
      {{"number": 1, "question": "string", "marks": 3}},
      {{"number": 2, "question": "string", "marks": 3}},
      {{"number": 3, "question": "string", "marks": 3}},
      {{"number": 4, "question": "string", "marks": 3}},
      {{"number": 5, "question": "string", "marks": 3}}
    ]
  }},
  "section_c": {{
    "instructions": "string",
    "prompt": "string",
    "scaffolding": "string",
    "marks": 15
  }}
}}"""


def build_memo_prompt(paper_json):
    return f"""Generate a complete marking memo for this Grade 4 English HL exam paper.

PAPER:
{json.dumps(paper_json, indent=2)}

Respond with ONLY a JSON object — no markdown fences, no preamble:
{{
  "section_a_memo": [
    {{"number": 1, "answer": "string", "marks": 2, "notes": "accept any answer that..."}},
    {{"number": 2, "answer": "string", "marks": 2, "notes": "string"}},
    {{"number": 3, "answer": "string", "marks": 3, "notes": "string"}},
    {{"number": 4, "answer": "string", "marks": 3, "notes": "string"}},
    {{"number": 5, "answer": "string", "marks": 3, "notes": "string"}},
    {{"number": 6, "answer": "string", "marks": 4, "notes": "string"}},
    {{"number": 7, "answer": "string", "marks": 5, "notes": "string"}},
    {{"number": 8, "answer": "string", "marks": 8, "notes": "string"}}
  ],
  "section_b_memo": [
    {{"number": 1, "answer": "string", "marks": 3, "notes": "string"}},
    {{"number": 2, "answer": "string", "marks": 3, "notes": "string"}},
    {{"number": 3, "answer": "string", "marks": 3, "notes": "string"}},
    {{"number": 4, "answer": "string", "marks": 3, "notes": "string"}},
    {{"number": 5, "answer": "string", "marks": 3, "notes": "string"}}
  ],
  "section_c_rubric": {{
    "criteria": [
      {{"criterion": "Content & Ideas", "max": 5, "descriptors": {{"5": "string", "3-4": "string", "1-2": "string"}}}},
      {{"criterion": "Language & Grammar", "max": 5, "descriptors": {{"5": "string", "3-4": "string", "1-2": "string"}}}},
      {{"criterion": "Structure & Organisation", "max": 5, "descriptors": {{"5": "string", "3-4": "string", "1-2": "string"}}}}
    ]
  }}
}}"""


# ── JSON → PDF payload converters ─────────────────────────────────────────────

def paper_to_payload(paper_json, grade):
    sa = paper_json.get("section_a", {})
    sb_sec = paper_json.get("section_b", {})
    sc = paper_json.get("section_c", {})

    sections = [
        {"type": "heading", "content": "SECTION A: COMPREHENSION"},
        {"type": "passage", "title": sa.get("passage_title", "PASSAGE"), "content": sa.get("passage_text", "")},
        {"type": "instruction", "content": "Answer ALL the questions that follow."},
    ]
    for q in sa.get("questions", []):
        sections.append({"type": "question", "content": f"{q['number']}. {q['question']} ({q['marks']})"})

    sections.append({"type": "heading", "content": "SECTION B: LANGUAGE IN CONTEXT"})
    if sb_sec.get("instructions"):
        sections.append({"type": "instruction", "content": sb_sec["instructions"]})
    for q in sb_sec.get("questions", []):
        sections.append({"type": "question", "content": f"{q['number']}. {q['question']} ({q['marks']})"})

    sections.append({"type": "heading", "content": f"SECTION C: WRITING ({sc.get('marks', 15)} marks)"})
    if sc.get("instructions"):
        sections.append({"type": "instruction", "content": sc["instructions"]})
    sections.append({"type": "question", "content": sc.get("prompt", "")})
    if sc.get("scaffolding"):
        sections.append({"type": "question", "content": f"Planning guide:\n{sc['scaffolding']}"})

    return {"grade": grade, "subject": "English HL", "type": "paper", "sections": sections}


def memo_to_payload(paper_json, memo_json, grade):
    sections = [
        {"type": "heading", "content": f"MEMORANDUM\n{paper_json.get('title', '')}\nGrade {grade} English Home Language"},
        {"type": "heading", "content": "SECTION A: COMPREHENSION"},
    ]
    for item in memo_json.get("section_a_memo", []):
        note = f"\n* {item['notes']}" if item.get("notes") else ""
        sections.append({"type": "question", "content": f"{item['number']}. {item['answer']} [{item['marks']}]{note}"})

    sections.append({"type": "heading", "content": "SECTION B: LANGUAGE"})
    for item in memo_json.get("section_b_memo", []):
        note = f"\n* {item['notes']}" if item.get("notes") else ""
        sections.append({"type": "question", "content": f"{item['number']}. {item['answer']} [{item['marks']}]{note}"})

    sections.append({"type": "heading", "content": "SECTION C: WRITING RUBRIC"})
    for crit in memo_json.get("section_c_rubric", {}).get("criteria", []):
        descs = " | ".join(f"{k}: {v}" for k, v in crit.get("descriptors", {}).items())
        sections.append({"type": "question", "content": f"{crit['criterion']} (/{crit['max']})\n{descs}"})

    return {"grade": grade, "subject": "English HL", "type": "memo", "sections": sections}


# ── Claude helper ─────────────────────────────────────────────────────────────

def call_claude(client, prompt):
    resp = client.messages.create(
        model="claude-opus-4-5",
        max_tokens=4096,
        messages=[{"role": "user", "content": prompt}],
    )
    raw = resp.content[0].text.strip()
    raw = re.sub(r"^```json\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)
    return json.loads(raw)


# ── Vercel handler ────────────────────────────────────────────────────────────

class handler(BaseHTTPRequestHandler):

    def do_OPTIONS(self):
        self._cors()
        self.end_headers()

    def do_GET(self):
        self._cors()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({
            "status": "ok",
            "description": "Curio AI Paper Generator",
            "params": {"grade": 4, "subject": "english", "term": "Term 1-4", "count": "1-5"},
        }).encode())

    def do_POST(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length) or b"{}")
        except Exception:
            body = {}

        grade = int(body.get("grade", 4))
        subject = body.get("subject", "english")
        term = body.get("term", "Term 1")
        count = min(int(body.get("count", 1)), 5)
        topic = body.get("topic") or CAPS_GRADE4_ENGLISH_HL.get(term, {}).get("skills", ["Writing"])[0]

        anth = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
        existing_titles = get_existing_titles()

        results = []
        errors = []

        for i in range(count):
            try:
                paper_json = call_claude(anth, build_prompt(term, topic, existing_titles))
                title = paper_json.get("title", f"Grade {grade} English HL — {term}")
                existing_titles.append(title)

                memo_json = call_claude(anth, build_memo_prompt(paper_json))

                paper_pdf = generate_pdf_bytes(paper_to_payload(paper_json, grade))
                memo_pdf = generate_pdf_bytes(memo_to_payload(paper_json, memo_json, grade))

                slug = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")[:60]
                uid = str(uuid.uuid4())[:8]
                paper_url = sb_upload(f"gr{grade}-english-hl/{slug}-{uid}.pdf", paper_pdf)
                memo_url = sb_upload(f"gr{grade}-english-hl/{slug}-{uid}-memo.pdf", memo_pdf)

                row = {
                    "grade": grade,
                    "subject": subject,
                    "title": title,
                    "topic": paper_json.get("topic", topic),
                    "file_url": paper_url,
                    "memo_url": memo_url,
                    "has_memo": True,
                    "is_premium": False,
                    "section_type": term.lower().replace(" ", "_"),
                }
                inserted = sb_post("papers", row)
                inserted_id = inserted[0]["id"] if inserted else None

                results.append({
                    "paper_number": i + 1,
                    "id": inserted_id,
                    "title": title,
                    "paper_url": paper_url,
                    "memo_url": memo_url,
                })

                if i < count - 1:
                    time.sleep(1)

            except Exception as e:
                errors.append({"paper_number": i + 1, "error": str(e)})

        self._cors()
        self.send_response(200 if results else 500)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({
            "success": len(results) > 0,
            "generated": len(results),
            "results": results,
            "errors": errors,
        }).encode())

    def _cors(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
