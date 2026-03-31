import re, math
from io import BytesIO
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor, white
from reportlab.pdfgen import canvas
from reportlab.pdfbase.pdfmetrics import stringWidth

# ── Colours ──────────────────────────────────────────────────────────────────
PLUM    = HexColor('#2B1E3F')
CYAN    = HexColor('#6DD3CE')
CORAL   = HexColor('#FF5E5B')
AMBER   = HexColor('#F5C842')
INK     = HexColor('#2A1E41')
MIDGREY = HexColor('#887890')
LINEGR  = HexColor('#D2CED8')
XLITE   = HexColor('#F5F3F8')
GREENBG = HexColor('#EBF8ED')
GREENBRD= HexColor('#96D2A0')
REDBOLD = HexColor('#FFB0AE')

W, H     = A4
ML       = 20*mm
MR       = 20*mm
CW       = W - ML - MR
HEADER_H = 36*mm
CONT_H   = 12*mm
FOOTER_H = 18*mm
PAGE_TOP = H - HEADER_H - 8*mm
CONT_TOP = H - CONT_H  - 8*mm

# ── Helpers ───────────────────────────────────────────────────────────────────
def sanitise(t):
    o = str(t)
    o = re.sub(r'[\u2713\u2714\u2705]', '', o)
    reps = [
        ('\u2022', '-'), ('\u2018', "'"), ('\u2019', "'"),
        ('\u201c', '"'), ('\u201d', '"'), ('\u2014', '--'),
        ('\u2013', '-'), ('\u2026', '...'), ('\u00a0', ' '),
        ('\r\n', '\n'), ('\r', '\n'),
        ('\u2192', '->'), ('\u2190', '<-'),
        ('\u00d7', 'x'), ('\u00f7', '/'),
        ('\u00b2', '2'), ('\u00b3', '3'),
        ('\u00bd', '1/2'), ('\u00bc', '1/4'), ('\u00be', '3/4'),
        ('[BREAK]', '\n\n'),
    ]
    for old, new in reps:
        o = o.replace(old, new)
    out = []
    for ch in o:
        try:
            ch.encode('latin-1')
            out.append(ch)
        except UnicodeEncodeError:
            out.append('*')
    return ''.join(out)

def sanitise_memo(t):
    r = {'\u2022':'-','\u2018':"'",'\u2019':"'",'\u201c':'"','\u201d':'"',
         '\u2014':'--','\u2013':'-','\u2026':'...','\u00a0':' ','\r\n':'\n','\r':'\n'}
    o = str(t)
    o = re.sub(r'[\u2713\u2714\u2705]', '|TICK|', o)
    for k, v in r.items(): o = o.replace(k, v)
    return o.encode('latin-1', 'replace').decode('latin-1')

def wrap(text, font, size, max_w):
    words = text.split(' ')
    lines, cur = [], ''
    for w in words:
        test = (cur + ' ' + w).strip()
        if stringWidth(test, font, size) <= max_w: cur = test
        else:
            if cur: lines.append(cur)
            cur = w
    if cur: lines.append(cur)
    return lines or ['']

# ── Logo ──────────────────────────────────────────────────────────────────────
def draw_bloom(c, cx, cy, size):
    """Draw Bloom logo natively from SVG geometry. Fully transparent background."""
    scale = size / 200.0
    pRx = 22 * scale
    pRy = 42 * scale
    alphas = [1.0, 0.7, 0.5, 0.5, 0.7]
    N = 32
    for i, deg in enumerate([0, 72, 144, 216, 288]):
        a = alphas[i]
        c.setFillColorRGB(
            (109*a + 43*(1-a))/255,
            (211*a + 30*(1-a))/255,
            (206*a + 63*(1-a))/255
        )
        svg_rad = math.radians(deg)
        pts = []
        for t in range(N):
            theta = 2 * math.pi * t / N
            ex = 22 * math.cos(theta)
            ey = 42 * math.sin(theta) - 50
            rot_x = ex * math.cos(svg_rad) - ey * math.sin(svg_rad)
            rot_y = ex * math.sin(svg_rad) + ey * math.cos(svg_rad)
            pts.append((cx + rot_x * scale, cy - rot_y * scale))
        p = c.beginPath()
        p.moveTo(pts[0][0], pts[0][1])
        for px, py in pts[1:]: p.lineTo(px, py)
        p.close()
        c.drawPath(p, fill=1, stroke=0)
    c.setFillColor(HexColor('#FF5E5B'))
    c.circle(cx, cy, 22 * scale, fill=1, stroke=0)

# ── Shared page furniture ─────────────────────────────────────────────────────
def draw_header_full(c, title, grade, subject, section, total_marks, is_memo):
    c.setFillColor(PLUM)
    c.rect(0, H-HEADER_H, W, HEADER_H, fill=1, stroke=0)
    draw_bloom(c, 5*mm+15*mm, H-HEADER_H+3*mm+15*mm, 30*mm)
    c.setFillColor(white); c.setFont('Helvetica-Bold', 22)
    c.drawString(42*mm, H-14*mm, 'curio learning')
    c.setFillColor(CYAN); c.setFont('Helvetica', 10)
    sub = (title + ' \u2014 Marking Memorandum') if is_memo else title
    c.drawString(42*mm, H-21*mm, sub)
    if is_memo:
        c.setFillColor(REDBOLD); c.setFont('Helvetica-Bold', 8)
        c.drawString(42*mm, H-27.5*mm,
                     'MARKING GUIDELINES \u00b7 NOT FOR DISTRIBUTION TO LEARNERS')
    c.setFillColor(HexColor('#B4A8C8')); c.setFont('Helvetica', 8)
    gs = f"Grade: {grade}    Subject: {subject}"
    if section: gs += f"  \u00b7  {section}"
    c.drawString(42*mm, H-(33 if is_memo else 27.5)*mm, gs)
    if not is_memo:
        c.setFillColor(HexColor('#B4A8C8')); c.setFont('Helvetica', 8)
        c.drawRightString(W-8*mm, H-20*mm, 'Date: _______________')
        c.setFillColor(AMBER); c.setFont('Helvetica-Bold', 10)
        c.drawRightString(W-8*mm, H-28*mm, f'Marks: _____ / {total_marks}')
    else:
        c.setFillColor(HexColor('#B4A8C8')); c.setFont('Helvetica', 8)
        c.drawRightString(W-8*mm, H-28*mm, f'Total Marks: {total_marks}')

def draw_header_cont(c, title, is_memo):
    c.setFillColor(PLUM)
    c.rect(0, H-CONT_H, W, CONT_H, fill=1, stroke=0)
    draw_bloom(c, 4*mm+5*mm, H-CONT_H+1*mm+5*mm, 10*mm)
    c.setFillColor(white); c.setFont('Helvetica-Bold', 10)
    c.drawString(17*mm, H-7*mm, 'curio learning')
    c.setFillColor(CYAN); c.setFont('Helvetica', 8)
    c.drawString(55*mm, H-7*mm,
                 title + (' \u2014 Marking Memorandum' if is_memo else ''))

def draw_footer(c):
    c.setStrokeColor(LINEGR); c.setLineWidth(0.5)
    c.line(ML, 12*mm, W-MR, 12*mm)
    c.setFillColor(MIDGREY); c.setFont('Helvetica', 7)
    c.drawString(ML, 8*mm,
        'curio learning  \u00b7  curiolearning.co.za  \u00b7  Free for every South African student')
    c.drawRightString(W-MR, 8*mm, f'\u00a9 Curio Learning {datetime.now().year}')

# ── Question Paper ────────────────────────────────────────────────────────────
def generate_paper(data):
    buf = BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)

    title     = sanitise(data.get('title', 'Curio Study Material'))
    grade     = str(data.get('grade', ''))
    subject   = sanitise(data.get('subject', ''))
    section   = sanitise(data.get('section_type', ''))
    topic     = sanitise(data.get('topic', ''))
    source    = sanitise(data.get('source', ''))
    passage   = sanitise(data.get('passage', ''))
    questions = data.get('questions', [])
    is_junior = (data.get('grade_band', '4-7') == '4-7')
    total_marks = sum(q.get('marks', 1) for q in questions)

    c.setTitle(title)

    def new_page():
        draw_footer(c); c.showPage()
        draw_header_cont(c, title, False)
        return CONT_TOP

    draw_header_full(c, title, grade, subject, section, total_marks, False)
    y = PAGE_TOP

    # Student name field
    y -= 4*mm
    c.setFillColor(INK); c.setFont('Helvetica', 9)
    c.drawString(ML, y, 'Student Name:')
    c.setFillColor(white)
    c.rect(ML+32*mm, y-2*mm, 100*mm, 7*mm, fill=1, stroke=0)
    c.setStrokeColor(LINEGR); c.setLineWidth(0.5)
    c.rect(ML+32*mm, y-2*mm, 100*mm, 7*mm, fill=0, stroke=1)
    y -= 11*mm

    # Source / topic
    if source or topic:
        parts = []
        if source: parts.append(f'Source: {source}')
        if topic:  parts.append(f'Topic: {topic}')
        c.setFillColor(MIDGREY); c.setFont('Helvetica-Oblique', 8)
        c.drawString(ML, y, '  \u00b7  '.join(parts))
        y -= 6*mm
    c.setStrokeColor(LINEGR); c.setLineWidth(0.5)
    c.line(ML, y, W-MR, y); y -= 6*mm

    # Passage
    if passage:
        c.setFillColor(INK); c.setFont('Helvetica-Bold', 9.5)
        c.drawString(ML, y,
            'Read the passage and answer the questions that follow.' if is_junior
            else 'Read the following passage carefully and answer all questions.')
        y -= 8*mm
        pfs = 11 if is_junior else 10
        plh = 5.5*mm if is_junior else 5.0*mm
        is_poetry = 'poet' in section.lower() or 'verse' in section.lower() or 'stanza' in section.lower() or 'poem' in title.lower() or 'lyric' in section.lower()
        raw_lines = passage.split('\n')
        p_lines = []
        for raw_line in raw_lines:
            stripped = raw_line.strip()
            if not stripped:
                # Blank line = stanza break — keep as empty line
                p_lines.append('')
            elif is_poetry:
                # Poetry: preserve each line exactly, only wrap if truly too long
                if stringWidth(stripped, 'Helvetica', pfs) <= CW-14*mm:
                    p_lines.append(stripped)
                else:
                    p_lines.extend(wrap(stripped, 'Helvetica', pfs, CW-14*mm))
            else:
                # Prose: normal word wrap
                p_lines.extend(wrap(stripped, 'Helvetica', pfs, CW-14*mm))
        # Remove leading/trailing blank lines
        while p_lines and p_lines[0] == '': p_lines.pop(0)
        while p_lines and p_lines[-1] == '': p_lines.pop()
        # Count blank lines as 1.5x for poetry stanza gaps
        if is_poetry:
            blank_count = sum(1 for l in p_lines if not l)
            text_count = len(p_lines) - blank_count
            box_h = (text_count * plh) + (blank_count * plh * 1.5) + 10*mm
        else:
            box_h = len(p_lines)*plh + 10*mm
        if y - box_h < FOOTER_H+10*mm: y = new_page(); y -= 4*mm
        c.setFillColor(white)
        c.rect(ML, y-box_h, CW, box_h, fill=1, stroke=0)
        c.setStrokeColor(LINEGR); c.setLineWidth(0.5)
        c.rect(ML, y-box_h, CW, box_h, fill=0, stroke=1)
        c.setFillColor(CYAN)
        c.rect(ML, y-box_h, 3*mm, box_h, fill=1, stroke=0)
        c.setFillColor(INK); c.setFont('Helvetica', pfs)
        ty = y - 6*mm
        for line in p_lines:
            if line:
                c.drawString(ML+5*mm, ty, line)
                ty -= plh
            else:
                # Blank line = stanza break — extra half-line gap
                ty -= plh * (1.5 if is_poetry else 1)
        y = y - box_h - 8*mm

    # Section header
    if y < FOOTER_H+20*mm: y = new_page()
    c.setStrokeColor(LINEGR); c.setLineWidth(0.5)
    c.line(ML, y, W-MR, y); y -= 4*mm
    c.setFillColor(PLUM)
    c.rect(ML, y-9*mm, CW, 9*mm, fill=1, stroke=0)
    c.setFillColor(white); c.setFont('Helvetica-Bold', 10)
    c.drawString(ML+4*mm, y-5.5*mm,
                 'Questions' if is_junior else f'QUESTION 1  {section.upper()}')
    c.setFillColor(CORAL); c.setFont('Helvetica-Bold', 10)
    c.drawRightString(W-MR-2*mm, y-5.5*mm, f'[{total_marks} marks]')
    y -= 9*mm + 6*mm

    # Questions
    qfs = 11 if is_junior else 10.5
    qlh = 5.5*mm if is_junior else 5.0*mm
    for q in questions:
        raw = sanitise(q.get('text', ''))
        raw = re.sub(r'^\d+[.)]\s*', '', raw)
        raw = re.sub(r'\s*\(\d+\)\s*$', '', raw).strip()
        marks = q.get('marks', 1); num = q.get('num', 1)
        q_lines = wrap(raw, 'Helvetica', qfs, CW-20*mm)
        ans_lines = 0
        if is_junior:
            ans_lines = 1 if marks<=1 else 2 if marks<=2 else 3 if marks<=3 else 4
        needed = len(q_lines)*qlh + ans_lines*8*mm + 8*mm
        if y - needed < FOOTER_H+5*mm: y = new_page()
        # Split question on \n to get main line + sub-lines/bullets
        q_parts = raw.split('\n')
        main_text = q_parts[0].strip() if q_parts else raw
        # Sub-parts: everything after the first line
        # Marks in brackets at end of last sub-part belong to the question not the sub-line
        sub_parts_raw = [p.strip() for p in q_parts[1:] if p.strip()]
        # Move trailing marks from last sub-part to main_text if main_text has no marks
        import re as _re
        if sub_parts_raw and not _re.search(r'\(\d+\)\s*$', main_text):
            last = sub_parts_raw[-1]
            _marks_match = _re.search(r'\(\d+\)\s*$', last)
            if _marks_match:
                sub_parts_raw[-1] = last[:_marks_match.start()].strip()
                if not sub_parts_raw[-1]:
                    sub_parts_raw.pop()
        sub_parts = sub_parts_raw

        main_lines = wrap(main_text, 'Helvetica', qfs, CW-20*mm)

        # Calculate total height including sub-parts
        sub_heights = []
        for sp in sub_parts:
            is_bullet = sp.startswith('*') or sp.startswith('-')
            sp_text = sp.lstrip('*- ').strip() if is_bullet else sp
            sp_lines = wrap(sp_text, 'Helvetica', qfs, CW-26*mm)
            sub_heights.append((is_bullet, sp_text, sp_lines))

        total_sub_h = sum(len(sl)*qlh + 1.5*mm for _, _, sl in sub_heights)
        needed = len(main_lines)*qlh + 2*mm + total_sub_h + ans_lines*8*mm + 8*mm
        if y - needed < FOOTER_H+5*mm: y = new_page()

        # Draw question number
        c.setFillColor(PLUM); c.setFont('Helvetica-Bold', qfs)
        c.drawString(ML, y, f'{num}.')

        # Draw main question text
        c.setFillColor(INK); c.setFont('Helvetica', qfs)
        for i, line in enumerate(main_lines):
            c.drawString(ML+9*mm, y-i*qlh, line)

        # Draw marks on right of first line
        c.setFillColor(CORAL); c.setFont('Helvetica-Bold', qfs)
        c.drawRightString(W-MR, y, f'({marks})')

        y -= len(main_lines)*qlh + 2*mm

        # Draw sub-lines and bullet items
        for is_bullet, sp_text, sp_lines in sub_heights:
            if is_bullet:
                # Coral circle bullet — small dot matching the Bloom centre
                bullet_r = 1.2*mm
                c.setFillColor(CORAL)
                c.circle(ML+11*mm, y - qlh*0.35, bullet_r, fill=1, stroke=0)
                c.setFillColor(INK); c.setFont('Helvetica', qfs)
                for i, line in enumerate(sp_lines):
                    c.drawString(ML+15*mm, y - i*qlh, line)
            else:
                # Continuation line — indented, same font
                c.setFillColor(INK); c.setFont('Helvetica', qfs)
                for i, line in enumerate(sp_lines):
                    c.drawString(ML+9*mm, y - i*qlh, line)
            y -= len(sp_lines)*qlh + 1.5*mm
        if is_junior:
            c.setStrokeColor(HexColor('#AAA5B9')); c.setLineWidth(0.4)
            for _ in range(ans_lines):
                c.line(ML+9*mm, y-2*mm, W-MR, y-2*mm); y -= 8*mm
        c.setStrokeColor(XLITE); c.setLineWidth(0.4)
        c.line(ML, y-1*mm, W-MR, y-1*mm); y -= 5*mm

    # Total box
    y -= 3*mm
    if y < FOOTER_H+20*mm: y = new_page()
    c.setStrokeColor(LINEGR); c.setLineWidth(0.5)
    c.line(ML, y, W-MR, y); y -= 6*mm
    c.setFillColor(INK); c.setFont('Helvetica-Bold', 9.5)
    c.drawString(ML, y, 'Total Marks:' if is_junior else 'TOTAL:')
    c.setFillColor(white)
    c.rect(W-MR-35*mm, y-2*mm, 35*mm, 8*mm, fill=1, stroke=0)
    c.setStrokeColor(LINEGR); c.setLineWidth(0.5)
    c.rect(W-MR-35*mm, y-2*mm, 35*mm, 8*mm, fill=0, stroke=1)
    c.setFillColor(MIDGREY); c.setFont('Helvetica', 8)
    c.drawRightString(W-MR-2*mm, y+1*mm, f'/ {total_marks}')

    draw_footer(c)
    c.save()
    return buf.getvalue()

# ── Memorandum ────────────────────────────────────────────────────────────────
def generate_memo(data):
    buf = BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)

    title     = sanitise(data.get('title', 'Curio Study Material'))
    grade     = str(data.get('grade', ''))
    subject   = sanitise(data.get('subject', ''))
    section   = sanitise(data.get('section_type', ''))
    memo      = data.get('memo', [])
    is_junior = (data.get('grade_band', '4-7') == '4-7')
    total_marks = sum(q.get('marks', 1) for q in data.get('questions', []))

    c.setTitle(title + ' — Marking Memorandum')

    def new_page():
        draw_footer(c); c.showPage()
        draw_header_cont(c, title, True)
        return CONT_TOP - 5*mm

    draw_header_full(c, title, grade, subject, section, total_marks, True)
    y = PAGE_TOP

    # Preamble
    y -= 4*mm
    c.setFillColor(INK); c.setFont('Helvetica-Bold', 9.5)
    c.drawString(ML, y,
        'These marking guidelines are for teacher use only.' if is_junior
        else 'These marking guidelines are prepared for teacher/examiner use only.')
    y -= 6*mm
    c.setFont('Helvetica', 8.5)
    c.drawString(ML, y,
        'Award marks for correct meaning. Half marks (\u00bd) may be awarded for partial answers.' if is_junior
        else 'Credit valid alternative responses where meaning is correct.')
    y -= 8*mm
    c.setStrokeColor(CYAN); c.setLineWidth(0.8)
    c.line(ML, y, W-MR, y); y -= 7*mm

    # Column headers
    c.setFillColor(INK); c.setFont('Helvetica-Bold', 9)
    c.drawString(ML+4*mm, y, 'Q')
    c.drawString(ML+22*mm, y, 'Answer / Marking Points')
    c.drawRightString(W-MR, y, 'Marks')
    y -= 4*mm
    c.setStrokeColor(INK); c.setLineWidth(0.5)
    c.line(ML, y, W-MR, y); y -= 4*mm

    tick_lbl = ' \u2713 '

    for m in memo:
        mraw = sanitise_memo(m.get('text', ''))
        mraw = re.sub(r'^\d+[.)]\s*', '', mraw)
        mm_m = re.search(r'\((\d+)\)\s*$', mraw)
        marks_val = mm_m.group(1) if mm_m else ''
        display = re.sub(r'\s*\(\d+\)\s*$', '', mraw).strip()
        display_plain = display.replace('|TICK|', tick_lbl)
        m_lines = wrap(display_plain, 'Helvetica', 10, CW-34*mm)
        m_h = max(len(m_lines)*5.2*mm + 8*mm, 13*mm)

        if y - m_h < FOOTER_H+5*mm: y = new_page()

        # Green answer box
        c.setFillColor(GREENBG)
        c.rect(ML, y-m_h, CW, m_h, fill=1, stroke=0)
        c.setStrokeColor(GREENBRD); c.setLineWidth(0.6)
        c.rect(ML, y-m_h, CW, m_h, fill=0, stroke=1)
        # Plum number box
        c.setFillColor(PLUM)
        c.rect(ML, y-m_h, 16*mm, m_h, fill=1, stroke=0)
        c.setFillColor(white); c.setFont('Helvetica-Bold', 10)
        c.drawCentredString(ML+8*mm, y-m_h/2-1.5*mm, str(m.get('num', 1)))

        # Answer text with cyan tick markers
        ty = y - 5.5*mm
        for line in m_lines:
            tx_x = ML+20*mm
            parts = line.split(tick_lbl.strip())
            for pi, part in enumerate(parts):
                if part:
                    c.setFillColor(INK); c.setFont('Helvetica', 10)
                    c.drawString(tx_x, ty, part)
                    tx_x += stringWidth(part, 'Helvetica', 10)
                if pi < len(parts)-1:
                    c.setFillColor(CYAN); c.setFont('Helvetica-Bold', 9)
                    c.drawString(tx_x, ty, tick_lbl)
                    tx_x += stringWidth(tick_lbl, 'Helvetica-Bold', 9)
            ty -= 5.2*mm

        # Marks
        if marks_val:
            c.setFillColor(CORAL); c.setFont('Helvetica-Bold', 9.5)
            c.drawRightString(W-MR-1*mm, y-m_h/2-1.5*mm, f'({marks_val})')

        y -= m_h + 4*mm

    draw_footer(c)
    c.save()
    return buf.getvalue()

# ── Legacy wrapper (returns both) ─────────────────────────────────────────────
def generate(data):
    return generate_paper(data)
