'use client'

import { useEffect, useRef, useState } from 'react'
import { isActivityMessage, parseActivity } from '@/lib/activities'

interface ActivityFrameProps {
  /** A stored reference, e.g. "fraction-fun?n=1&d=4&of=20". */
  activity: string
  /** Called when the learner finishes the activity, with whatever the tool reported. */
  onComplete?: (detail: Record<string, unknown>) => void
  /** Show a small "well done" line under the frame once finished. Default true. */
  showDone?: boolean
}

// Shows one of curio's maths activities inside the page. The address is rebuilt from a
// whitelist (lib/activities.ts), so only our own tools can ever load here.
export default function ActivityFrame({ activity, onComplete, showDone = true }: ActivityFrameProps) {
  const frame = parseActivity(activity)
  const ref = useRef<HTMLIFrameElement>(null)
  const [done, setDone] = useState(false)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    setDone(false)
    function onMessage(e: MessageEvent) {
      if (e.origin !== window.location.origin) return
      if (e.source !== ref.current?.contentWindow) return
      if (!isActivityMessage(e.data) || e.data.type !== 'complete') return
      setDone(true)
      onCompleteRef.current?.(e.data)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [activity])

  if (!frame) return null

  return (
    <div>
      <iframe
        ref={ref}
        key={frame.src}
        src={frame.src}
        title={frame.title}
        loading="lazy"
        style={{
          width: '100%',
          height: frame.height,
          maxHeight: '80vh',
          border: '1px solid var(--line)',
          borderRadius: 12,
          background: 'var(--paper)',
          display: 'block',
        }}
      />
      {showDone && done && (
        <p
          role="status"
          style={{ margin: '.6rem 0 0', fontFamily: 'var(--h)', fontWeight: 700, color: 'var(--moss)' }}
        >
          Well done, you finished it.
        </p>
      )}
    </div>
  )
}
