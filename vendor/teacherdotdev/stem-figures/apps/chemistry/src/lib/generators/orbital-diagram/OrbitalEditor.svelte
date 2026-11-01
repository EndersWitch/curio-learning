<script lang="ts">
  // A small copy of the diagram's orbitals to click, each click moving an
  // orbital on to its next fill: empty, up, down, a pair, two up, two down.
  // Orbitals that differ from the ground state are marked.
  import { FILL_NAMES, ORBITAL_FILLS, type Diagram, type OrbitalFill } from './diagram'

  interface Props {
    diagram: Diagram
    ground: Diagram
    onchange: (sublevel: string, orbitals: OrbitalFill[]) => void
  }
  let { diagram, ground, onchange }: Props = $props()

  const ARROWS: Record<OrbitalFill, string> = { '': '', u: '↑', d: '↓', ud: '↑↓', uu: '↑↑', dd: '↓↓' }
  const groundOf = $derived(Object.fromEntries(ground.sublevels.map((sub) => [sub.name, sub.orbitals])))

  function cycle(name: string, orbitals: OrbitalFill[], i: number) {
    const next = ORBITAL_FILLS[(ORBITAL_FILLS.indexOf(orbitals[i]) + 1) % ORBITAL_FILLS.length]
    onchange(
      name,
      orbitals.map((fill, j) => (j === i ? next : fill)),
    )
  }
</script>

<div class="editor">
  {#if diagram.core}<span class="core">[{diagram.core}]</span>{/if}
  {#each diagram.sublevels as sub (sub.name)}
    <div class="sublevel">
      <div class="orbitals">
        {#each sub.orbitals as fill, i (i)}
          <button
            type="button"
            class="orbital"
            class:changed={fill !== groundOf[sub.name]?.[i]}
            aria-label="{sub.name} orbital {i + 1}: {FILL_NAMES[fill]}"
            onclick={() => cycle(sub.name, sub.orbitals, i)}>{ARROWS[fill]}</button
          >
        {/each}
      </div>
      <span class="name">{sub.name}</span>
    </div>
  {/each}
</div>

<style>
  .editor { display: flex; flex-wrap: wrap; align-items: flex-start; gap: 0.6rem 0.7rem; margin-top: 0.8rem; }
  .core { align-self: flex-start; padding-top: 0.35rem; font-weight: 700; }
  .sublevel { display: flex; flex-direction: column; align-items: center; gap: 0.2rem; }
  .orbitals { display: flex; }
  .orbital {
    width: 2.1rem;
    height: 2.1rem;
    margin-left: -1px;
    padding: 0;
    border: 1.5px solid var(--ink, #111);
    border-radius: 0;
    background: #fff;
    font: 700 1rem/1 Arial, Helvetica, sans-serif;
    letter-spacing: -0.05em;
    cursor: pointer;
  }
  .orbital:first-child { margin-left: 0; }
  .orbital:hover { background: var(--blue-soft); }
  .orbital:focus-visible { position: relative; outline: 2px solid var(--blue); outline-offset: 1px; }
  .orbital.changed { background: #fef3c7; }
  .name { font-size: 0.82rem; color: var(--muted); }
</style>
