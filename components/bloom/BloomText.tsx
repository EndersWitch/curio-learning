import { Fragment, type ReactNode } from 'react'
import ActivityFrame from '@/components/ActivityFrame'
import { parseActivity } from '@/lib/activities'

// Renders a Bloom reply: the small slice of Markdown its rulebook allows
// (paragraphs, **bold**, *italics*, `code`, "- " and "1." lists, ``` blocks).
// It builds React elements, never HTML, so a reply can't inject markup into
// the page. A half-streamed reply renders fine; an unclosed ** just shows as
// text until its pair arrives.
export default function BloomText({ text }: { text: string }) {
  return <>{renderBlocks(text)}</>
}

const BULLET = /^\s*[-*•]\s+/
const NUMBERED = /^\s*\d+[.)]\s+/
const FENCE = /^\s*```/
// A line of its own, [[activity:fraction-fun?n=1&d=4&of=20]], becomes a hands-on frame (lib/activities.ts).
const ACTIVITY_LINE = /^\s*\[\[activity:([^\]]*)\]\]\s*$/
const OPEN_MARKER = /^\s*\[\[/
const INLINE = /(\*\*[^*\n]+\*\*|`[^`\n]+`|\*[^*\s][^*\n]*\*)/

function renderBlocks(text: string): ReactNode[] {
  const lines = text.replace(/\r\n?/g, '\n').split('\n')
  const out: ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    const marker = ACTIVITY_LINE.exec(line)
    if (marker) {
      // Anything that is not a known tool with valid settings shows nothing at all.
      if (parseActivity(marker[1])) {
        out.push(<div key={out.length} className="bloom-activity"><ActivityFrame activity={marker[1]} /></div>)
      }
      i++
    } else if (OPEN_MARKER.test(line)) {
      i++ // a marker still streaming in: hold it back until it is complete
    } else if (FENCE.test(line)) {
      const code: string[] = []
      i++
      while (i < lines.length && !FENCE.test(lines[i])) code.push(lines[i++])
      i++ // the closing fence (absent while still streaming)
      out.push(<pre key={out.length} className="bloom-code"><code>{code.join('\n')}</code></pre>)
    } else if (BULLET.test(line)) {
      const items: string[] = []
      while (i < lines.length && BULLET.test(lines[i])) items.push(lines[i++].replace(BULLET, ''))
      out.push(<ul key={out.length}>{items.map((item, n) => <li key={n}>{renderInline(item)}</li>)}</ul>)
    } else if (NUMBERED.test(line)) {
      const start = parseInt(line, 10)
      const items: string[] = []
      while (i < lines.length && NUMBERED.test(lines[i])) items.push(lines[i++].replace(NUMBERED, ''))
      out.push(<ol key={out.length} start={start}>{items.map((item, n) => <li key={n}>{renderInline(item)}</li>)}</ol>)
    } else if (!line.trim()) {
      i++
    } else {
      // A paragraph runs until a blank line or the start of a list or code block.
      const para: string[] = []
      while (i < lines.length && lines[i].trim() && !BULLET.test(lines[i]) && !NUMBERED.test(lines[i]) && !FENCE.test(lines[i])) {
        para.push(lines[i++].replace(/^#{1,6}\s+/, '')) // the odd heading becomes plain text
      }
      out.push(
        <p key={out.length}>
          {para.map((l, n) => <Fragment key={n}>{n > 0 && <br />}{renderInline(l)}</Fragment>)}
        </p>,
      )
    }
  }
  return out
}

function renderInline(text: string): ReactNode[] {
  // split() with a capture group puts the matches at the odd indexes.
  return text.split(INLINE).map((part, n) => {
    if (n % 2 === 0) return part
    if (part.startsWith('**')) return <strong key={n}>{part.slice(2, -2)}</strong>
    if (part.startsWith('`')) return <code key={n}>{part.slice(1, -1)}</code>
    return <em key={n}>{part.slice(1, -1)}</em>
  })
}
