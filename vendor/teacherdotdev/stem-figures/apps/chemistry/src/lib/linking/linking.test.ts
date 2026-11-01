import { describe, expect, it } from 'vitest'
import { CATALOG } from '$shared/catalog/index'
import { SITE_URL } from '$lib/site/config'
import { aboutOf, exampleHref, exampleQuery, exampleSettings, paramRows, type ParamDoc } from './define'
import { LINKED } from './index'
import { llmsFullTxt, llmsTxt } from './llms'

const chemistry = CATALOG.filter((g) => g.site === 'chemistry' && g.kind !== 'editor')

describe('every generator’s link parameters', () => {
  it('covers every Chemistry Figures generator', () => {
    expect(LINKED.map((l) => l.generator.id)).toEqual(chemistry.map((g) => g.id))
    for (const { generator, linking } of LINKED) expect(linking.id).toBe(generator.id)
  })

  for (const { generator, linking } of LINKED) {
    const { definition } = linking
    const docs = linking.params as Record<string, ParamDoc>

    describe(generator.name, () => {
      it('describes exactly the parameters its address can carry', () => {
        // toQuery writes only these names, each when it differs from its default
        expect(Object.keys(definition.defaults as object).sort()).toEqual([...definition.names].sort())
        expect(Object.keys(docs).sort()).toEqual([...definition.names].sort())
        for (const name of definition.names) expect(docs[name].what.trim(), name).not.toBe('')
      })

      it('says what values each parameter takes, once', () => {
        for (const name of definition.names) {
          const field = definition.fields[name]
          // said by the field, or by linking.ts for a field that can't say
          expect(!!field.about !== !!docs[name].about, `${name}: say its values in one place`).toBe(true)
          expect(() => aboutOf(linking, name)).not.toThrow()
        }
        expect(paramRows(linking)).toHaveLength(definition.names.length)
      })

      it('takes exactly the values it says it does', () => {
        for (const name of definition.names) {
          const field = definition.fields[name]
          const about = aboutOf(linking, name)
          const parsed = (text: string) => field.parse(text)
          if (about.type === 'choice') {
            for (const option of about.options) expect(field.format(parsed(option)), `${name}=${option}`).toBe(option)
            expect(parsed('not-an-option'), name).toBeUndefined()
          } else if (about.type === 'number') {
            expect(parsed(String(about.min)), name).toBe(about.min)
            expect(parsed(String(about.max)), name).toBe(about.max)
            expect(parsed(String(about.max + 1)), `${name} clamps`).toBe(about.max)
            expect(parsed(String(about.min - 1)), `${name} clamps`).toBe(about.min)
          } else if (about.type === 'bool') {
            expect([parsed('1'), parsed('0')], name).toEqual([true, false])
          } else if (about.type === 'text') {
            expect(parsed('a'.repeat(about.maxLength + 5)), name).toBe('a'.repeat(about.maxLength))
          }
        }
      })

      it('has two to four example links that open the settings they claim', () => {
        expect(linking.examples.length).toBeGreaterThanOrEqual(2)
        expect(linking.examples.length).toBeLessThanOrEqual(4)
        for (const ex of linking.examples) {
          const query = exampleQuery(linking, ex)
          expect(query, ex.shows).not.toBe('')
          const opened = definition.fromParams(new URLSearchParams(query))
          // the link opens exactly the example's figure…
          expect(definition.keyOf(opened), ex.shows).toBe(definition.keyOf(exampleSettings(linking, ex)))
          // …with every setting the example names as it names it, not
          // rounded, clamped or switched by the settings' own rules…
          for (const [name, value] of Object.entries(ex.settings)) expect((opened as Record<string, unknown>)[name], `${ex.shows}: ${name}`).toEqual(value)
          // …and writes the same link back
          expect(definition.toQuery(opened), ex.shows).toBe(query)
          for (const name of new URLSearchParams(query).keys()) expect(definition.names, ex.shows).toContain(name)
          expect(exampleHref(generator.path, linking, ex)).toBe(`${generator.path}?${query}`)
        }
      })
    })
  }
})

describe('/llms.txt', () => {
  const text = llmsTxt()

  it('follows the llms.txt layout', () => {
    const lines = text.split('\n')
    expect(lines[0]).toBe('# Chemistry Figures')
    expect(lines[2].startsWith('> ')).toBe(true)
    expect(text).toContain('## Generators')
    expect(text).toContain('## Optional')
  })

  it('lists every generator at its absolute address', () => {
    for (const g of chemistry) expect(text).toContain(`[${g.name}](${SITE_URL}${g.path}): ${g.description}`)
  })

  it('points to the parameter reference, with working example links', () => {
    expect(text).toContain(`${SITE_URL}/linking`)
    expect(text).toContain(`${SITE_URL}/llms-full.txt`)
    for (const { generator, linking } of LINKED) expect(text).toContain(`${SITE_URL}${exampleHref(generator.path, linking, linking.examples[0])}`)
  })
})

describe('/llms-full.txt', () => {
  const text = llmsFullTxt()

  it('has every parameter and example of every generator', () => {
    for (const { generator, linking } of LINKED) {
      expect(text).toContain(`## ${generator.name}`)
      for (const row of paramRows(linking)) expect(text).toContain(`- ${row.name} (`)
      for (const ex of linking.examples) expect(text).toContain(`[${ex.shows}](${SITE_URL}${exampleHref(generator.path, linking, ex)})`)
    }
  })
})
