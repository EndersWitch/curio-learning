'use client'

import { cleanGeometry, reasonLabel, toNumber, type GeometrySpec } from '@/lib/testbuilder/geometry'

// A drawn angle diagram. The learner types a value and chooses the reason.
export default function GeometryWidget({
  spec, value, onChange, locked, answer,
}: {
  spec: GeometrySpec
  value: unknown
  onChange: (v: unknown) => void
  locked: boolean
  answer?: { values?: Record<string, number>; reasons?: string[]; working?: string; tol?: number }
}) {
  const ids = spec.fields.map(f => f.id)
  const given = cleanGeometry(value, ids) ?? { fields: {}, reason: '' }
  const set = (patch: Partial<typeof given>) => onChange({ fields: { ...given.fields, ...(patch.fields ?? {}) }, reason: patch.reason ?? given.reason })
  const img = `data:image/svg+xml;utf8,${encodeURIComponent(spec.svg)}`

  return (
    <div className="tb-widget">
      <div className="tb-figure">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img} alt="Geometry diagram. Not drawn to scale." />
        <p className="tb-muted" style={{ margin: '0.3rem 0 0' }}>Not drawn to scale</p>
      </div>
      <div className="tb-geo">
        {spec.fields.map(f => {
          const right = answer?.values ? (() => { const g = toNumber(given.fields[f.id]); return g !== null && Math.abs(g - answer.values![f.id]!) <= (answer.tol ?? 0) + 1e-9 })() : undefined
          return (
            <label key={f.id} className={`tb-geo-field ${right === undefined ? '' : right ? 'right' : 'wrong'}`}>
              <span>{f.label}</span>
              <input
                inputMode="decimal"
                autoComplete="off"
                maxLength={12}
                disabled={locked}
                value={given.fields[f.id] ?? ''}
                onChange={e => set({ fields: { [f.id]: e.target.value } })}
                aria-label={f.label}
              />
              <span>{f.unit ?? ''}</span>
            </label>
          )
        })}
        {spec.reasons.length > 0 && <label className={`tb-geo-reason ${answer ? (answer.reasons?.includes(given.reason) ? 'right' : 'wrong') : ''}`}>
          <span>Reason</span>
          <select disabled={locked} value={given.reason} onChange={e => set({ reason: e.target.value })} aria-label="Reason">
            <option value="">Choose a reason</option>
            {spec.reasons.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
          </select>
        </label>}
      </div>
      {answer && (
        <p className="tb-muted">
          Answer: {spec.fields.map(fl => `${answer.values?.[fl.id]}${fl.unit ?? ''}`).join(', ')}.{answer.reasons?.length ? ` Reason: ${reasonLabel(answer.reasons[0] ?? '')}.` : ''} {answer.working}
        </p>
      )}
    </div>
  )
}
