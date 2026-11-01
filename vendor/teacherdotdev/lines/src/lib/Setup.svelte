<script>
  // The teacher's page: pick the settings on the left, watch a live preview and
  // grab the link to send to students on the right.
  import NumberLine from './NumberLine.svelte'
  import { makeQr, qrPng } from './qr.js'
  import { fmt, sampleProblem } from './rounding.js'
  import {
    DEFAULT_SETTINGS, MAXES, MAX_QUESTIONS, UNITS,
    clampCount, describeSettings, settingsToQuery, usableUnits,
  } from './settings.js'

  let settings = $state(structuredClone(DEFAULT_SETTINGS))

  const link = $derived(`${window.location.origin}${import.meta.env.BASE_URL}practice?${settingsToQuery(settings)}`)
  const qr = $derived(makeQr(link))

  // A sample question for the preview: the largest selected unit, with a
  // number a little past halfway so the arrow points right.
  const sample = $derived.by(() => sampleProblem(settings))

  function toggleUnit(u) {
    const has = settings.units.includes(u)
    if (has && settings.units.length === 1) return // keep at least one
    settings.units = has ? settings.units.filter((x) => x !== u) : [...settings.units, u].sort((a, b) => a - b)
  }

  function setMax(m) {
    settings.max = m
    settings.units = usableUnits(m, settings.units)
  }

  let copied = $state(false)
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link)
      copied = true
      setTimeout(() => (copied = false), 1600)
    } catch {
      /* the link is still on screen to copy by hand */
    }
  }

  async function saveQr() {
    const blob = await qrPng(link)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'rounding-practice-qr.png'
    a.click()
    URL.revokeObjectURL(url)
  }
</script>

<div class="page">
  <header class="intro">
    <div class="title-row">
      <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" width="40" height="40" />
      <h1>Set up a rounding drill</h1>
    </div>
    <p>
      Choose the number line your class is using and how many questions to give. Then share the
      link — students work through it on their own and get a report at the end.
    </p>
  </header>

  <div class="layout">
    <section class="settings card">
      <fieldset>
        <h3 class="legend">Round to the nearest</h3>
        <p class="hint">Pick more than one for a mix.</p>
        <div class="chips">
          {#each UNITS as u (u)}
            <button type="button" class="chip" class:on={settings.units.includes(u)}
              disabled={u > settings.max} onclick={() => toggleUnit(u)}>{fmt(u)}</button>
          {/each}
        </div>
      </fieldset>

      <fieldset>
        <h3 class="legend">Numbers up to</h3>
        <p class="hint">Use 1 for decimal place-value practice, or larger ranges for thousands and millions.</p>
        <div class="chips">
          {#each MAXES as m (m)}
            <button type="button" class="chip" class:on={settings.max === m} onclick={() => setMax(m)}>{fmt(m)}</button>
          {/each}
        </div>
      </fieldset>

      <fieldset>
        <h3 class="legend">How students answer</h3>
        <div class="modes">
          <label class="mode" class:on={settings.mode === 'guided'}>
            <input type="radio" name="mode" value="guided" bind:group={settings.mode} />
            <span class="mode-title">Guided</span>
            <span class="mode-desc">Find the starting point, end point and midpoint, then round.</span>
          </label>
          <label class="mode" class:on={settings.mode === 'quick'}>
            <input type="radio" name="mode" value="quick" bind:group={settings.mode} />
            <span class="mode-title">Quick</span>
            <span class="mode-desc">See the number on the line and just choose which way it rounds.</span>
          </label>
        </div>
        <label class="switch plot-switch">
          <input type="checkbox" bind:checked={settings.plot} />
          <span>Have students plot the number first <small>(they choose the closest tick before deciding which way to round)</small></span>
        </label>
      </fieldset>

      <fieldset>
        <h3 class="legend">Drill</h3>
        <label class="limit">
          <span>Number of questions</span>
          <input type="number" min="1" max={MAX_QUESTIONS} step="1"
            value={settings.count}
            onchange={(e) => (settings.count = clampCount(e.currentTarget.value, DEFAULT_SETTINGS.count))} />
        </label>
        <label class="switch">
          <input type="checkbox" bind:checked={settings.labels} />
          <span>Number every tick mark <small>(easier — the start and end are shown)</small></span>
        </label>
        <label class="switch">
          <input type="checkbox" bind:checked={settings.retry} />
          <span>Allow retries <small>(students try again after a miss; the miss still shows in the report)</small></span>
        </label>
      </fieldset>
    </section>

    <div class="side">
      <aside class="preview card">
        <p class="cardtitle">Preview</p>
        <p class="sample">Round <b>{fmt(sample.n)}</b> to the nearest {fmt(sample.unit)}</p>
        <NumberLine n={sample.n} start={sample.start} end={sample.end} mid={sample.mid}
          showStart showEnd showMid labels={settings.labels} highlight={sample.answer} />
        <p class="summary">{describeSettings(settings)}</p>
      </aside>

      <aside class="share card">
        <p class="cardtitle">Share with students</p>
        <div class="linkrow">
          <a class="linktext" href={link} target="_blank" rel="noopener" title={link}>{link}</a>
          <button type="button" class="btn-ghost" onclick={copyLink}>{copied ? 'Copied ✓' : 'Copy'}</button>
          <a class="btn-primary" href={link} target="_blank" rel="noopener">Open ↗</a>
        </div>
        <div class="qrrow">
          <svg viewBox="0 0 {qr.extent} {qr.extent}" class="qr" role="img" aria-label="QR code for this practice link">
            <rect width={qr.extent} height={qr.extent} fill="#fff" />
            <path d={qr.path} fill="#000" />
          </svg>
          <div class="qrtext">
            <p>Students can scan this from the board.</p>
            <button type="button" class="btn-ghost" onclick={saveQr}>Save QR code</button>
          </div>
        </div>
      </aside>
    </div>
  </div>
</div>

<style>
  .page { max-width: 66rem; margin: 0 auto; padding: 1.5rem 1.25rem 3rem; }
  .intro { margin-bottom: 1.5rem; }
  .title-row { display: flex; align-items: center; gap: 0.65rem; margin-bottom: 0.4rem; }
  .title-row img { flex: none; }
  .intro h1 { font-size: 1.9rem; font-weight: 800; }
  .intro p { margin: 0; color: var(--muted); max-width: 44rem; }

  .layout { display: grid; gap: 1.5rem; align-items: start; }
  @media (min-width: 60rem) {
    .layout { grid-template-columns: minmax(0, 1fr) 24rem; }
    .side { position: sticky; top: 1rem; }
  }
  .side { display: grid; gap: 1.25rem; }

  .settings { padding: 0.5rem 1.5rem 1rem; }
  fieldset { border: 0; padding: 1.25rem 0; margin: 0; border-bottom: 1px solid var(--border); }
  fieldset:last-child { border-bottom: 0; }
  .legend { font-weight: 800; font-size: 1.05rem; margin: 0 0 0.3rem; }
  .hint { margin: 0 0 0.7rem; color: var(--muted); font-size: 0.9rem; }
  .chip:disabled { opacity: 0.4; cursor: default; }

  .modes { display: grid; gap: 0.6rem; margin-top: 0.5rem; }
  @media (min-width: 40rem) { .modes { grid-template-columns: 1fr 1fr; } }
  .mode {
    display: grid;
    grid-template-columns: auto 1fr;
    grid-template-rows: auto auto;
    column-gap: 0.6rem;
    padding: 0.8rem 0.9rem;
    border: 1.5px solid var(--border);
    border-radius: 12px;
    cursor: pointer;
    background: #fff;
    transition: border-color 0.15s, background 0.15s;
  }
  .mode:hover { border-color: var(--blue-border); }
  .mode.on { border-color: var(--blue); background: var(--blue-soft); }
  .mode input { grid-row: 1 / span 2; align-self: start; margin-top: 0.2rem; accent-color: var(--blue); }
  .mode-title { font-weight: 700; }
  .mode-desc { font-size: 0.88rem; color: var(--muted); }
  .plot-switch { margin-top: 0.8rem; }

  .limit { display: flex; align-items: center; gap: 0.9rem; font-weight: 600; margin: 0.4rem 0 0.8rem; }
  .limit input {
    width: 5.5rem;
    padding: 0.5rem 0.6rem;
    font: inherit;
    font-weight: 700;
    border: 1.5px solid var(--border);
    border-radius: 10px;
    text-align: center;
  }
  .limit input:focus { outline: none; border-color: var(--blue); }
  .switch { display: flex; gap: 0.6rem; align-items: flex-start; padding: 0.35rem 0; font-weight: 600; cursor: pointer; }
  .switch input { margin-top: 0.3rem; accent-color: var(--blue); width: 1.05rem; height: 1.05rem; }
  .switch small { display: block; font-weight: 500; color: var(--muted); }

  .preview, .share { padding: 1rem 1.25rem 1.25rem; }
  .cardtitle {
    margin: 0 0 0.5rem;
    font-size: 0.8rem;
    font-weight: 800;
    letter-spacing: 1.2px;
    text-transform: uppercase;
    color: var(--muted);
  }
  .sample { margin: 0 0 0.25rem; font-size: 1.05rem; }
  .sample b { color: var(--purple); font-size: 1.3rem; }
  .summary { margin: 0.5rem 0 0; font-size: 0.85rem; color: var(--muted); }

  .linkrow { display: grid; grid-template-columns: 1fr auto auto; gap: 0.5rem; align-items: center; }
  .linktext {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.85rem;
    color: var(--blue-dark);
    padding: 0.55rem 0.7rem;
    border: 1.5px solid var(--border);
    border-radius: 10px;
    background: var(--bg);
    text-decoration: none;
  }
  .qrrow { display: flex; gap: 1rem; align-items: center; margin-top: 1rem; }
  .qr { width: 8rem; height: 8rem; flex: none; border: 1px solid var(--border); border-radius: 8px; }
  .qrtext p { margin: 0 0 0.6rem; font-size: 0.9rem; color: var(--muted); }
</style>
