<script lang="ts">
  // The selected person's settings: their sex and status, their marks, and
  // buttons to add family around them or remove them. Every change gives a
  // new family, and the person to select after it.
  import { Baby, Trash, UserPlus, Users, X } from '@lucide/svelte'
  import {
    addChild,
    addPartner,
    addSibling,
    canAddChild,
    canAddPartner,
    canAddSibling,
    canBeUnknownSex,
    canRemove,
    changePerson,
    memberAt,
    personAt,
    removePerson,
    setConsanguineous,
    setTwin,
    type Member,
    type Ref,
    type Sex,
    type Twin,
  } from './family'

  interface Props {
    family: Member
    at: Ref
    /** the person's name in the pedigree, e.g. "II-3" */
    name: string
    carriersShown: boolean
    onchange: (change: { family: Member; select: Ref | null }) => void
    onclose: () => void
  }
  let { family, at, name, carriersShown, onchange, onclose }: Props = $props()

  const who = $derived(personAt(family, at)!)
  const blood = $derived(memberAt(family, at.path)!)
  const siblings = $derived(at.path.length ? memberAt(family, at.path.slice(0, -1))!.children : [])
  const index = $derived(at.path[at.path.length - 1])
  const hasNext = $derived(!at.partner && at.path.length > 0 && index < siblings.length - 1 && !siblings[index - 1]?.twin)
  const status = $derived(who.affected ? 'affected' : who.carrier ? 'carrier' : 'unaffected')

  const SEXES: [Sex, string][] = [['m', 'Male'], ['f', 'Female'], ['u', 'Unknown']]
  const STATUSES = [['unaffected', 'Unaffected'], ['carrier', 'Carrier'], ['affected', 'Affected']] as const
  const TWINS: [Twin | null, string][] = [[null, 'No'], ['dz', 'Fraternal'], ['mz', 'Identical']]

  const setStatus = (v: (typeof STATUSES)[number][0]) => onchange(changePerson(family, at, { affected: v === 'affected', carrier: v === 'carrier' }))
</script>

<div class="editor" id="pedigree-person">
  <div class="head">
    <h3>{name} <span>{at.partner ? 'married in' : at.path.length ? '' : 'founder'}</span></h3>
    <button type="button" class="icon-btn" aria-label="Done changing {name}" data-tip="Done" onclick={onclose}><X size={18} /></button>
  </div>

  <div class="segmented" role="radiogroup" aria-label="{name}’s sex">
    {#each SEXES as [value, label] (value)}
      <button
        type="button"
        role="radio"
        aria-checked={who.sex === value}
        class:on={who.sex === value}
        disabled={value === 'u' && !canBeUnknownSex(family, at)}
        onclick={() => onchange(changePerson(family, at, { sex: value }))}
      >
        {label}
      </button>
    {/each}
  </div>
  <div class="segmented" role="radiogroup" aria-label="{name}’s status">
    {#each STATUSES as [value, label] (value)}
      <button type="button" role="radio" aria-checked={status === value} class:on={status === value} onclick={() => setStatus(value)}>{label}</button>
    {/each}
  </div>
  {#if status === 'carrier' && !carriersShown}
    <p class="note">Carriers are drawn only when Symbols shows them.</p>
  {/if}

  <div class="checks">
    <label><input type="checkbox" checked={who.deceased} onchange={(e) => onchange(changePerson(family, at, { deceased: e.currentTarget.checked }))} /> Deceased</label>
    <label><input type="checkbox" checked={who.proband} onchange={(e) => onchange(changePerson(family, at, { proband: e.currentTarget.checked }))} /> Proband</label>
    {#if blood.partner}
      <label>
        <input type="checkbox" checked={!!blood.consanguineous} onchange={(e) => onchange(setConsanguineous(family, at.path, e.currentTarget.checked))} />
        Partners are related
      </label>
    {/if}
  </div>

  {#if hasNext}
    <p class="field-label">Twin of the next sibling</p>
    <div class="segmented" role="radiogroup" aria-label="{name} a twin of the next sibling">
      {#each TWINS as [value, label] (label)}
        <button
          type="button"
          role="radio"
          aria-checked={(blood.twin ?? null) === value}
          class:on={(blood.twin ?? null) === value}
          onclick={() => onchange(setTwin(family, at.path, value))}
        >
          {label}
        </button>
      {/each}
    </div>
  {/if}

  <div class="actions">
    <button type="button" class="btn-ghost small" disabled={!canAddChild(family, at)} onclick={() => onchange(addChild(family, at))}>
      <Baby size={16} aria-hidden="true" /> Child
    </button>
    <button type="button" class="btn-ghost small" disabled={!canAddPartner(family, at)} onclick={() => onchange(addPartner(family, at))}>
      <UserPlus size={16} aria-hidden="true" /> Partner
    </button>
    <button type="button" class="btn-ghost small" disabled={!canAddSibling(family, at)} onclick={() => onchange(addSibling(family, at))}>
      <Users size={16} aria-hidden="true" /> Sibling
    </button>
    <button type="button" class="btn-ghost small remove" disabled={!canRemove(at)} onclick={() => onchange(removePerson(family, at))}>
      <Trash size={16} aria-hidden="true" /> Remove
    </button>
  </div>
  {#if !canRemove(at)}
    <p class="note">The founder stays; change or remove anyone else.</p>
  {:else if at.partner ? blood.children.length > 0 : !!blood.partner}
    <p class="note">Removing {at.partner ? 'a partner removes their children too' : 'someone removes their partner and children too'}.</p>
  {/if}
</div>

<style>
  .editor { display: flex; flex-direction: column; gap: 0.55rem; margin-top: 0.9rem; padding: 0.8rem; border: 1.5px solid var(--blue-border); border-radius: 12px; background: var(--blue-soft); }
  .head { display: flex; align-items: center; justify-content: space-between; }
  h3 { font-size: 1rem; font-weight: 800; }
  h3 span { font-weight: 500; font-size: 0.84rem; color: var(--muted); }
  .head .icon-btn { width: 2rem; height: 2rem; }
  .editor .segmented { background: #fff; }
  .editor .segmented button.on { background: var(--blue); color: #fff; }
  .editor .segmented button:disabled { color: #b5bac4; cursor: default; }
  .checks { display: flex; flex-wrap: wrap; gap: 0.35rem 1rem; font-size: 0.9rem; }
  .checks label { display: inline-flex; align-items: center; gap: 0.4rem; cursor: pointer; }
  .checks input { width: 1rem; height: 1rem; accent-color: var(--blue); }
  .field-label { margin: 0.2rem 0 0; font-size: 0.84rem; font-weight: 700; }
  .actions { display: grid; grid-template-columns: 1fr 1fr; gap: 0.4rem; }
  .small { padding: 0.5rem 0.6rem; font-size: 0.88rem; }
  .remove:not(:disabled) { color: #b91c1c; border-color: #fecaca; }
  .remove:hover:not(:disabled) { background: var(--red-soft); }
  .note { margin: 0; color: var(--muted); font-size: 0.8rem; }
</style>
