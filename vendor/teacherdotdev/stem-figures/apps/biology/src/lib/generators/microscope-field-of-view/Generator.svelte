<script lang="ts">
  // The Microscope Field of View generator: pick a magnification and what's
  // on the slide, and get the circle seen down the eyepiece, drawn to scale,
  // with a question and an answer box. Settings live in the page address.
  import { CircleDashed, CircleQuestionMark, Dices, ListChecks, Microscope, Ruler, Shapes, Type } from '@lucide/svelte'
  import GeneratorPage from '$shared/GeneratorPage.svelte'
  import LabelField from '$shared/LabelField.svelte'
  import ReadingField from '$shared/ReadingField.svelte'
  import Section from '$shared/Section.svelte'
  import { generatorState } from '$shared/generatorState.svelte'
  import MicroscopeFigure from './MicroscopeFigure.svelte'
  import {
    EYEPIECES, OBJECTIVES, OBJECTIVE_NAMES, UM_PER_MM, fitAcross, formatFit, mmText, sizeFromFit, totalMagnification, umText,
  } from './microscope'
  import { QUESTION_NAMES, autoQuestion, questionsFor } from './questions'
  import {
    ARROWS, MAG_CAPTIONS, SETUPS, microscopeSettings, newSeed, setupSettings, slideOf, tooSmall, viewsOf,
    type Arrow, type MagCaption,
  } from './settings'
  import { MOST_ACROSS, SPECIMENS, SPECIMEN_INFO, type Specimen } from './specimens'

  const gen = generatorState(microscopeSettings, 'microscope-field-of-view')
  const s = gen.s
  let svg = $state<SVGSVGElement>()

  const CAPTION_NAMES: Record<MagCaption, string> = { total: 'Total', lenses: 'Lenses', both: 'Both', none: 'None' }
  const ARROW_NAMES: Record<Arrow, string> = { none: 'None', mm: 'mm', um: 'µm', blank: 'Blank' }

  const info = $derived(SPECIMEN_INFO[s.specimen])
  const views = $derived(viewsOf(s))
  const field = $derived(views[0].field)
  const slide = $derived(slideOf(s))
  const missing = $derived(slide.kind === 'loose' ? slide.missing : 0)
  const loose = $derived(info.kind === 'loose')

  const microscopeSummary = $derived(views.map((v) => `${v.magnification}×`).join(' and ') + ` (${s.eyepiece}× eyepiece)`)
  const fieldSummary = $derived(views.map((v) => mmText(v.field)).join(' and ') + ' across')
  const specimenSummary = $derived(
    info.kind === 'none' ? 'Nothing' : `${info.name}, ${umText(s.size)}${info.kind === 'letter' ? '' : `, ${formatFit(fitAcross(field, s.size))} across`}`,
  )
  const aidsSummary = $derived(
    [s.ruler && 'ruler', s.scaleBar && 'scale bar', s.arrow !== 'none' && `diameter ${s.arrow === 'blank' ? 'blank' : `in ${ARROW_NAMES[s.arrow]}`}`]
      .filter(Boolean)
      .join(', ') || 'None',
  )
  const questionSummary = $derived(
    `${s.questionMode === 'none' ? 'No question' : s.questionMode === 'text' ? 'Your question' : QUESTION_NAMES[s.question]}, answer ${s.answer}`,
  )

  /** Another specimen starts at its usual size. */
  function changeSpecimen(specimen: Specimen) {
    if (specimen === s.specimen) return
    s.specimen = specimen
    s.size = SPECIMEN_INFO[specimen].typical
  }
</script>

<GeneratorPage name="Microscope Field of View" filename="microscope-field-of-view" settingsWidth={27} printWidth={s.compare ? 7 : 4.5} {gen} {svg}>
  {#snippet settings()}
    <Section title="Start from" summary="A common question, ready to change" icon={ListChecks}>
      <div class="setups">
        {#each SETUPS as setup (setup.name)}
          <button type="button" class="btn-ghost" onclick={() => gen.apply(setupSettings(setup.changes))}>{setup.name}</button>
        {/each}
      </div>
    </Section>

    <Section title="Microscope" summary={microscopeSummary} icon={Microscope} open>
      <p class="field-label">Eyepiece</p>
      <div class="chips" role="radiogroup" aria-label="Eyepiece">
        {#each EYEPIECES as e (e)}
          <button type="button" role="radio" aria-checked={s.eyepiece === e} class="chip" class:on={s.eyepiece === e} onclick={() => (s.eyepiece = e)}>{e}×</button>
        {/each}
      </div>
      <p class="field-label">Objective</p>
      <div class="chips" role="radiogroup" aria-label="Objective">
        {#each OBJECTIVES as o (o)}
          <button type="button" role="radio" aria-checked={s.objective === o} class="chip" class:on={s.objective === o} onclick={() => (s.objective = o)} title={OBJECTIVE_NAMES[o]}>{o}×</button>
        {/each}
      </div>
      <p class="note below">{OBJECTIVE_NAMES[s.objective]}: {s.eyepiece}× × {s.objective}× = {totalMagnification(s.eyepiece, s.objective)}× total.</p>
      <p class="field-label">Caption under the field</p>
      <div class="segmented" role="radiogroup" aria-label="Caption under the field">
        {#each MAG_CAPTIONS as c (c)}
          <button type="button" role="radio" aria-checked={s.magCaption === c} class:on={s.magCaption === c} onclick={() => (s.magCaption = c)}>{CAPTION_NAMES[c]}</button>
        {/each}
      </div>
      <p class="note below">
        {s.magCaption === 'total' ? 'The total magnification.' : s.magCaption === 'lenses' ? 'The eyepiece and objective, for students to multiply.' : s.magCaption === 'both' ? 'The total, and the lenses that give it.' : 'No magnification shown.'}
      </p>
      <div class="compare">
        <label class="check"><input type="checkbox" bind:checked={s.compare} /> Beside it, the same slide at a higher power</label>
        {#if s.compare}
          <div class="chips" role="radiogroup" aria-label="Higher power objective">
            {#each OBJECTIVES.filter((o) => Number(o) > Number(s.objective)) as o (o)}
              <button type="button" role="radio" aria-checked={s.highObjective === o} class="chip" class:on={s.highObjective === o} onclick={() => (s.highObjective = o)}>{o}× objective</button>
            {/each}
          </div>
        {/if}
      </div>
    </Section>

    <Section title="Field of view" summary={fieldSummary} icon={CircleDashed} open>
      <div class="segmented" role="radiogroup" aria-label="Field diameter">
        <button type="button" role="radio" aria-checked={s.fieldSource === 'low'} class:on={s.fieldSource === 'low'} onclick={() => (s.fieldSource = 'low')}>From low power</button>
        <button type="button" role="radio" aria-checked={s.fieldSource === 'typed'} class:on={s.fieldSource === 'typed'} onclick={() => (s.fieldSource = 'typed')}>Typed</button>
      </div>
      {#if s.fieldSource === 'low'}
        <div class="below">
          <ReadingField label="Field diameter at low power" value={s.lowField} decimals={2} min={0.5} max={10} unit="mm" onchange={(v) => (s.lowField = v)} />
        </div>
        <p class="field-label">Measured with the</p>
        <div class="chips" role="radiogroup" aria-label="Measured with the">
          {#each ['4', '10'] as const as o (o)}
            <button type="button" role="radio" aria-checked={s.lowObjective === o} class="chip" class:on={s.lowObjective === o} onclick={() => (s.lowObjective = o)}>
              {o}× objective ({totalMagnification(s.eyepiece, o)}×)
            </button>
          {/each}
        </div>
        <p class="note below">
          Every other field follows: field = {mmText(s.lowField)} × {totalMagnification(s.eyepiece, s.lowObjective)} ÷ magnification.
          {#each views as v (v.objective)}<br />At {v.magnification}×: {mmText(v.field)} = {umText(v.field * UM_PER_MM)}.{/each}
        </p>
      {:else}
        <div class="below">
          <ReadingField
            label="Field diameter at {totalMagnification(s.eyepiece, s.objective)}×"
            value={s.field} decimals={2} min={0.05} max={10} unit="mm"
            onchange={(v) => (s.field = v)}
          />
        </div>
        {#if s.compare}
          <p class="note below">At {views[1].magnification}×: {mmText(views[1].field)}, from {mmText(s.field)} × {views[0].magnification} ÷ {views[1].magnification}.</p>
        {/if}
      {/if}
      <p class="note">A school microscope with a 10× eyepiece sees about 4.5 mm across at 40×, 1.8 mm at 100× and 0.45 mm at 400×.</p>
    </Section>

    <Section title="Specimen" summary={specimenSummary} icon={Shapes} open>
      <div class="chips" role="radiogroup" aria-label="Specimen">
        {#each SPECIMENS as sp (sp)}
          <button type="button" role="radio" aria-checked={s.specimen === sp} class="chip" class:on={s.specimen === sp} onclick={() => changeSpecimen(sp)}>{SPECIMEN_INFO[sp].name}</button>
        {/each}
      </div>
      {#if info.kind !== 'none'}
        <div class="field-row below">
          <ReadingField
            label="Its {info.measure}" value={s.size} decimals={s.size < 20 ? 1 : 0} min={1} max={5000} unit="µm"
            onchange={(v) => (s.size = v)}
          />
          {#if info.kind !== 'letter'}
            <ReadingField
              label="Fit across the field" value={fitAcross(field, s.size)} decimals={1} min={0.1} max={400}
              onchange={(v) => v > 0 && (s.size = Math.min(5000, Math.max(1, Math.round(sizeFromFit(field, v) * 10) / 10)))}
            />
          {/if}
        </div>
        <p class="note">Typical: {umText(info.typical)}. Drawn to scale, so {formatFit(fitAcross(field, s.size))} fit across the {mmText(field)} field.</p>
        {#if tooSmall(s)}
          <p class="note warn">Cells this small would be thousands; they're drawn {MOST_ACROSS} across instead, not to scale. Try a higher power.</p>
        {/if}
      {/if}
      {#if loose}
        <p class="field-label">Arrangement</p>
        <div class="segmented" role="radiogroup" aria-label="Arrangement">
          <button type="button" role="radio" aria-checked={s.arrangement === 'scatter'} class:on={s.arrangement === 'scatter'} onclick={() => (s.arrangement = 'scatter')}>Scattered</button>
          <button type="button" role="radio" aria-checked={s.arrangement === 'row'} class:on={s.arrangement === 'row'} onclick={() => (s.arrangement = 'row')}>In a row across</button>
        </div>
        {#if s.arrangement === 'scatter'}
          <label class="field below">
            Whole {info.many} in the field
            <input type="number" min="1" max="60" step="1" value={s.count} onchange={(e) => (s.count = Math.min(60, Math.max(1, Math.round(e.currentTarget.valueAsNumber || 1))))} />
          </label>
          {#if missing}<p class="note warn">Only {s.count - missing} fit in the field.</p>{/if}
          <label class="check"><input type="checkbox" bind:checked={s.edges} /> More cut off by the edge</label>
        {/if}
      {/if}
      {#if info.kind === 'letter'}
        <p class="field-label">The letter is shown</p>
        <div class="segmented" role="radiogroup" aria-label="The letter is shown">
          <button type="button" role="radio" aria-checked={s.orientation === 'seen'} class:on={s.orientation === 'seen'} onclick={() => (s.orientation = 'seen')}>As seen</button>
          <button type="button" role="radio" aria-checked={s.orientation === 'slide'} class:on={s.orientation === 'slide'} onclick={() => (s.orientation = 'slide')}>As on the slide</button>
        </div>
        <p class="note below">{s.orientation === 'seen' ? 'Upside down and backwards, as the lenses show it.' : 'The right way up, as it was placed on the slide.'}</p>
      {/if}
      {#if info.kind === 'tissue' || loose}
        <div class="row below">
          <label class="check"><input type="checkbox" bind:checked={s.color} /> Stained colors</label>
          <button type="button" class="btn-ghost small" onclick={() => (s.seed = newSeed())}><Dices size={17} aria-hidden="true" /> Shuffle</button>
        </div>
      {/if}
    </Section>

    <Section title="Scale aids" summary={aidsSummary} icon={Ruler}>
      <label class="check"><input type="checkbox" bind:checked={s.ruler} /> Clear mm ruler across the field</label>
      <label class="check"><input type="checkbox" bind:checked={s.scaleBar} /> Scale bar</label>
      <p class="field-label">Diameter arrow</p>
      <div class="segmented" role="radiogroup" aria-label="Diameter arrow">
        {#each ARROWS as a (a)}
          <button type="button" role="radio" aria-checked={s.arrow === a} class:on={s.arrow === a} onclick={() => (s.arrow = a)}>{ARROW_NAMES[a]}</button>
        {/each}
      </div>
      {#if s.compare && (s.arrow === 'mm' || s.arrow === 'um')}
        <label class="check below"><input type="checkbox" bind:checked={s.arrowHighBlank} /> Leave the higher power’s blank</label>
      {/if}
    </Section>

    <Section title="Question and answer" summary={questionSummary} icon={CircleQuestionMark}>
      <p class="field-label">Question</p>
      <div class="chips" role="radiogroup" aria-label="Question">
        {#each questionsFor(s) as q (q)}
          <button type="button" role="radio" aria-checked={s.question === q} class="chip" class:on={s.question === q} onclick={() => (s.question = q)}>{QUESTION_NAMES[q]}</button>
        {/each}
      </div>
      <p class="field-label">Question text</p>
      <div class="segmented" role="radiogroup" aria-label="Question text">
        <button type="button" role="radio" aria-checked={s.questionMode === 'auto'} class:on={s.questionMode === 'auto'} onclick={() => (s.questionMode = 'auto')}>Written for you</button>
        <button type="button" role="radio" aria-checked={s.questionMode === 'text'} class:on={s.questionMode === 'text'} onclick={() => { if (!s.questionText) s.questionText = autoQuestion(s); s.questionMode = 'text' }}>Your own</button>
        <button type="button" role="radio" aria-checked={s.questionMode === 'none'} class:on={s.questionMode === 'none'} onclick={() => (s.questionMode = 'none')}>None</button>
      </div>
      {#if s.questionMode === 'text'}
        <textarea class="below" rows="3" aria-label="Question text" maxlength="300" bind:value={s.questionText}></textarea>
      {:else if s.questionMode === 'auto'}
        <p class="note below">“{autoQuestion(s)}”</p>
      {/if}
      <p class="field-label">Answer box</p>
      <div class="segmented" role="radiogroup" aria-label="Answer box">
        <button type="button" role="radio" aria-checked={s.answer === 'shown'} class:on={s.answer === 'shown'} onclick={() => (s.answer = 'shown')}>Answer</button>
        <button type="button" role="radio" aria-checked={s.answer === 'blank'} class:on={s.answer === 'blank'} onclick={() => (s.answer = 'blank')}>Blank</button>
        <button type="button" role="radio" aria-checked={s.answer === 'none'} class:on={s.answer === 'none'} onclick={() => (s.answer = 'none')}>None</button>
      </div>
      <p class="note below">The answer always matches the figure; it doesn’t follow a question you type.</p>
    </Section>

    <Section title="Chart title" summary={s.titleMode === 'text' && s.title ? `“${s.title}”` : 'No title'} icon={Type}>
      <LabelField name="Chart title" bind:mode={s.titleMode} bind:text={s.title} placeholder="e.g. Onion skin at 100×" blank={false} />
    </Section>
  {/snippet}
  {#snippet figure()}
    <MicroscopeFigure settings={s} bind:svg />
  {/snippet}
</GeneratorPage>

<style>
  .field-label { margin: 0.9rem 0 0.45rem; font-weight: 700; font-size: 0.9rem; }
  .field-label:first-child { margin-top: 0; }
  .below { margin-top: 0.7rem; }
  .setups { display: flex; flex-wrap: wrap; gap: 0.5rem; }
  .setups button { padding: 0.45rem 0.75rem; font-size: 0.88rem; }
  .compare { margin-top: 1rem; padding-top: 0.9rem; border-top: 1px solid var(--border); }
  .compare .chips { margin-top: 0.6rem; }
  .row { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; }
  .row .check { margin: 0; }
  .small { padding: 0.4rem 0.75rem; font-size: 0.88rem; }
  .warn { color: #a14b00; }
  textarea {
    width: 100%;
    padding: 0.5rem 0.6rem;
    border: 1.5px solid var(--border);
    border-radius: 10px;
    font: inherit;
    font-size: 0.92rem;
    resize: vertical;
  }
  textarea:focus { outline: none; border-color: var(--blue); }
</style>
