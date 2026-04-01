"""
api/generate-paper-ai.py
Curio Learning — Bulk AI Paper Generator
Generates CAPS-aligned exam papers for Grade 4 English HL using Claude,
produces PDFs via _pdf_generator.py, uploads to Supabase Storage,
and inserts rows into the papers table.
"""

import json
import os
import re
import time
import uuid
from http.server import BaseHTTPRequestHandler

import anthropic
from supabase import create_client, Client

from _pdf_generator import generate_pdf_bytes

# ── Supabase ──────────────────────────────────────────────────────────────────
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://inmrsgujgfktapjnekjs.supabase.co")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")

BUCKET = "Papers"

# ── CAPS curriculum knowledge ─────────────────────────────────────────────────
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

QUESTION_DISTRIBUTION = """
Assessment question distribution (DBE-aligned):
- 40% Recall: straightforward literal questions (What, Who, Where, When)
- 30% Comprehension: show understanding (Why, How, Explain in your own words)
- 20% Application: use knowledge in a new way (Give an example, Rewrite the sentence)
- 10% Analysis: higher order (Compare, Infer, What does the author mean by)
"""

SA_CONTEXTS = "Use South African names (Thabo, Naledi, Sipho, Amara, Liezel, Ruan) and SA settings (townships, farms, beaches, Johannesburg, Cape Town, Durban, village schools)."

PAPER_STRUCTURE_INSTRUCTIONS = """
A Grade 4 English HL paper has these sections:
SECTION A: Comprehension (reading passage + questions, 30 marks)
SECTION B: Language in Context / Grammar (15 marks)
SECTION C: Writing (a short creative or informational paragraph, 15 marks)
Total: 60 marks

For SECTION A, write a short passage (150–200 words) appropriate for Grade 4 reading level,
followed by 6–8 comprehension questions with marks indicated in brackets.

For SECTION B, include 5–6 grammar/language questions covering the term's grammar focus.

For SECTION C, provide a clear writing prompt with a scaffolding guide (e.g. planning box or sentence starters).
"""


def build_prompt(term: str, topic: str, existing_titles: list[str]) -> str:
    caps = CAPS_GRADE4_ENGLISH_HL.get(term, CAPS_GRADE4_ENGLISH_HL["Term 1"])
    existing = "\n".join(f"- {t}" for t in existing_titles) if existing_titles else "None yet"
    skills = ", ".join(caps["skills"])
    grammar = ", ".join(caps["grammar_focus"])
    text_types = ", ".join(caps["text_types"])

    return f"""You are a South African Grade 4 English Home Language teacher writing a formal exam paper
that is closely aligned with the CAPS curriculum. {SA_CONTEXTS}

TERM: {term}
TOPIC FOCUS: {topic}
CAPS SKILLS THIS TERM: {skills}
GRAMMAR FOCUS: {grammar}
TEXT TYPES: {text_types}

{PAPER_STRUCTURE_INSTRUCTIONS}

{QUESTION_DISTRIBUTION}

EXISTING PAPER TITLES (do NOT repeat these — your paper must be on a fresh topic/theme):
{existing}

OUTPUT FORMAT — respond with ONLY a JSON object (no markdown, no explanation) in this exact structure:
{{
  "title": "Grade 4 English HL — [short descriptive title] ({term})",
  "topic": "{term}: {topic}",
  "section_a": {{
    "passage_title": "string",
    "passage_text": "string (150-200 words, use blank lines between paragraphs)",
    "questions": [
      {{"number": 1, "question": "string", "marks": 2, "bloom": "recall"}},
      ...
    ]
  }},
  "section_b": {{
    "instructions": "string",
    "questions": [
      {{"number": 1, "question": "string", "marks": 3, "bloom": "application"}},
      ...
    ]
  }},
  "section_c": {{
    "instructions": "string",
    "prompt": "string",
    "scaffolding": "string (planning box labels or sentence starters)",
    "marks": 15
  }}
}}"""


def build_memo_prompt(paper_json: dict) -> str:
    return f"""You are marking a Grade 4 English HL exam paper. 
Generate a complete marking memo/memorandum for this paper.

PAPER:
{json.dumps(paper_json, indent=2)}

OUTPUT FORMAT — respond with ONLY a JSON object (no markdown, no explanation):
{{
  "section_a_memo": [
    {{"number": 1, "answer": "string", "marks": 2, "notes": "accept any reasonable answer about..."}},
    ...
  ],
  "section_b_memo": [
    {{"number": 1, "answer": "string", "marks": 3, "notes": "string"}},
    ...
  ],
  "section_c_rubric": {{
    "criteria": [
      {{"criterion": "Content & Ideas", "max": 5, "descriptors": {{"5": "...", "3-4": "...", "1-2": "..."}}}},
      {{"criterion": "Language & Grammar", "max": 5, "descriptors": {{"5": "...", "3-4": "...", "1-2": "..."}}}},
      {{"criterion": "Structure & Organisation", "max": 5, "descriptors": {{"5": "...", "3-4": "...", "1-2": "..."}}}}
    ]
  }}
}}"""


def paper_json_to_formatter_payload(paper_json: dict, grade: int) -> dict:
    """Convert the structured AI output into the payload _pdf_generator expects."""
    sections = []

    # Section A
    sa = paper_json.get("section_a", {})
    passage = sa.get("passage_text", "")
    sections.append({
        "type": "passage",
        "title": f"SECTION A: COMPREHENSION\n\nREAD THE FOLLOWING PASSAGE AND ANSWER THE QUESTIONS.\n\n{sa.get('passage_title','PASSAGE')}",
        "content": passage,
    })
    for q in sa.get("questions", []):
        sections.append({
            "type": "question",
            "content": f"{q['number']}. {q['question']} ({q['marks']})",
        })

    # Section B
    sb = paper_json.get("section_b", {})
    sections.append({
        "type": "section_header",
        "content": f"SECTION B: LANGUAGE IN CONTEXT\n\n{sb.get('instructions','')}",
    })
    for q in sb.get("questions", []):
        sections.append({
            "type": "question",
            "content": f"{q['number']}. {q['question']} ({q['marks']})",
        })

    # Section C
    sc = paper_json.get("section_c", {})
    sections.append({
        "type": "section_header",
        "content": f"SECTION C: WRITING ({sc.get('marks',15)} marks)\n\n{sc.get('instructions','')}",
    })
    sections.append({
        "type": "writing_prompt",
        "content": sc.get("prompt", ""),
    })
    if sc.get("scaffolding"):
        sections.append({
            "type": "scaffolding",
            "content": sc.get("scaffolding", ""),
        })

    return {
        "grade": grade,
        "subject": "English HL",
        "type": "paper",
        "sections": sections,
    }


def memo_json_to_formatter_payload(paper_json: dict, memo_json: dict, grade: int) -> dict:
    """Convert memo JSON into the payload _pdf_generator expects."""
    sections = []

    sections.append({
        "type": "section_header",
        "content": f"MEMORANDUM\n{paper_json.get('title','')}\nGrade {grade} English HL",
    })

    # Section A memo
    sections.append({"type": "section_header", "content": "SECTION A: COMPREHENSION"})
    for item in memo_json.get("section_a_memo", []):
        notes = f"\n* {item['notes']}" if item.get("notes") else ""
        sections.append({
            "type": "question",
            "content": f"{item['number']}. {item['answer']} [{item['marks']}]{notes}",
        })

    # Section B memo
    sections.append({"type": "section_header", "content": "SECTION B: LANGUAGE"})
    for item in memo_json.get("section_b_memo", []):
        notes = f"\n* {item['notes']}" if item.get("notes") else ""
        sections.append({
            "type": "question",
            "content": f"{item['number']}. {item['answer']} [{item['marks']}]{notes}",
        })

    # Section C rubric
    sections.append({"type": "section_header", "content": "SECTION C: WRITING RUBRIC"})
    rubric = memo_json.get("section_c_rubric", {})
    for crit in rubric.get("criteria", []):
        desc_text = "\n".join(f"  {k}: {v}" for k, v in crit.get("descriptors", {}).items())
        sections.append({
            "type": "question",
            "content": f"{crit['criterion']} (max {crit['max']})\n{desc_text}",
        })

    return {
        "grade": grade,
        "subject": "English HL",
        "type": "memo",
        "sections": sections,
    }


def upload_to_supabase(client: Client, pdf_bytes: bytes, filename: str) -> str:
    """Upload PDF bytes to Supabase Storage and return the public URL."""
    response = client.storage.from_(BUCKET).upload(
        path=filename,
        file=pdf_bytes,
        file_options={"content-type": "application/pdf", "upsert": "true"},
    )
    # Build the public URL
    public_url = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET}/{filename}"
    return public_url


def get_existing_titles(client: Client) -> list[str]:
    """Fetch existing paper titles from Supabase to avoid repetition."""
    try:
        response = client.table("papers").select("title").eq("subject", "english").eq("grade", 4).execute()
        return [row["title"] for row in (response.data or [])]
    except Exception:
        return []


class handler(BaseHTTPRequestHandler):

    def do_OPTIONS(self):
        self._send_cors()
        self.end_headers()

    def do_POST(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length) or b"{}")
        except Exception:
            body = {}

        # Params
        grade = int(body.get("grade", 4))
        subject = body.get("subject", "english")
        term = body.get("term", "Term 1")
        topic = body.get("topic", "")
        count = min(int(body.get("count", 1)), 5)  # max 5 at a time

        # Determine topic from CAPS if not provided
        if not topic:
            caps = CAPS_GRADE4_ENGLISH_HL.get(term, CAPS_GRADE4_ENGLISH_HL["Term 1"])
            topic = caps["skills"][0]

        # Initialise clients
        anth_client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
        sb_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

        results = []
        errors = []
        existing_titles = get_existing_titles(sb_client)

        for i in range(count):
            try:
                # ── 1. Generate paper JSON ────────────────────────────────────
                prompt = build_prompt(term, topic, existing_titles)
                paper_response = anth_client.messages.create(
                    model="claude-opus-4-5",
                    max_tokens=4096,
                    messages=[{"role": "user", "content": prompt}],
                )
                raw_paper = paper_response.content[0].text.strip()
                # Strip any accidental markdown fences
                raw_paper = re.sub(r"^```json\s*", "", raw_paper)
                raw_paper = re.sub(r"\s*```$", "", raw_paper)
                paper_json = json.loads(raw_paper)

                title = paper_json.get("title", f"Grade {grade} English HL — {term} Paper")
                existing_titles.append(title)  # prevent duplicates in same batch

                # ── 2. Generate memo JSON ─────────────────────────────────────
                memo_prompt = build_memo_prompt(paper_json)
                memo_response = anth_client.messages.create(
                    model="claude-opus-4-5",
                    max_tokens=4096,
                    messages=[{"role": "user", "content": memo_prompt}],
                )
                raw_memo = memo_response.content[0].text.strip()
                raw_memo = re.sub(r"^```json\s*", "", raw_memo)
                raw_memo = re.sub(r"\s*```$", "", raw_memo)
                memo_json = json.loads(raw_memo)

                # ── 3. Generate PDFs ──────────────────────────────────────────
                paper_payload = paper_json_to_formatter_payload(paper_json, grade)
                memo_payload = memo_json_to_formatter_payload(paper_json, memo_json, grade)

                paper_pdf_bytes = generate_pdf_bytes(paper_payload)
                memo_pdf_bytes = generate_pdf_bytes(memo_payload)

                # ── 4. Upload to Supabase Storage ─────────────────────────────
                slug = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
                unique_id = str(uuid.uuid4())[:8]
                paper_filename = f"gr{grade}-english-hl/{slug}-{unique_id}.pdf"
                memo_filename = f"gr{grade}-english-hl/{slug}-{unique_id}-memo.pdf"

                paper_url = upload_to_supabase(sb_client, paper_pdf_bytes, paper_filename)
                memo_url = upload_to_supabase(sb_client, memo_pdf_bytes, memo_filename)

                # ── 5. Insert into papers table ───────────────────────────────
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
                insert_response = sb_client.table("papers").insert(row).execute()
                inserted_id = insert_response.data[0]["id"] if insert_response.data else None

                results.append({
                    "id": inserted_id,
                    "title": title,
                    "paper_url": paper_url,
                    "memo_url": memo_url,
                    "paper_number": i + 1,
                })

                # Small pause between API calls to be polite
                if i < count - 1:
                    time.sleep(1)

            except Exception as e:
                errors.append({"paper_number": i + 1, "error": str(e)})

        status = 200 if results else 500
        self._send_cors()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({
            "success": len(results) > 0,
            "generated": len(results),
            "results": results,
            "errors": errors,
        }).encode())

    def do_GET(self):
        """Health check / config endpoint."""
        self._send_cors()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({
            "status": "ok",
            "description": "Curio AI Paper Generator",
            "supported": {
                "grades": [4],
                "subjects": ["english"],
                "terms": ["Term 1", "Term 2", "Term 3", "Term 4"],
            },
            "params": {
                "grade": "int (default 4)",
                "subject": "string (default 'english')",
                "term": "string (default 'Term 1')",
                "topic": "string (optional — auto-selected from CAPS if blank)",
                "count": "int 1–5 (default 1)",
            },
        }).encode())

    def _send_cors(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
