// A site's own card at the top of every generator's settings column, above
// the settings groups, with saved presets moved to the bottom of the column.
// Set once in a site's layout, read by GeneratorPage, so no generator has to
// pass it on; a site that sets none keeps presets at the top. The card gets
// `apply`, to load settings into the generator (an example figure's, say).

import type { Component } from 'svelte'
import { getContext, setContext } from 'svelte'

export type GeneratorLead = Component<{ apply: (settings: object) => void }>

const KEY = Symbol('generator-lead')

export const setGeneratorLead = (lead: GeneratorLead) => setContext(KEY, lead)
export const getGeneratorLead = (): GeneratorLead | undefined => getContext<GeneratorLead | undefined>(KEY)
