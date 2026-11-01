// Sound effects: Kenney CC0 clips (see public/sounds/CREDITS.md) plus notes
// synthesised for the − and + buttons so each press steps up or down in pitch.

export type Effect =
  | 'whoosh'
  | 'throw'
  | 'land'
  | 'chop'
  | 'pop'
  | 'wrong'
  | 'limit'
  | 'fall'
  | 'success'
  | 'click'
  | 'intro'
  | 'cheer'

const EFFECTS: Effect[] = [
  'whoosh',
  'throw',
  'land',
  'chop',
  'pop',
  'wrong',
  'limit',
  'fall',
  'success',
  'click',
  'intro',
  'cheer',
]
const MUTE_KEY = 'fraction-fun:muted'
// A major pentatonic run, so any sequence of presses sounds musical.
const SCALE = [0, 2, 4, 7, 9]

let context: AudioContext | null = null
const buffers = new Map<Effect, AudioBuffer>()
let muted = readMuted()

function audio(): AudioContext | null {
  if (!context) {
    try {
      context = new AudioContext()
    } catch {
      return null
    }
    void loadAll(context)
  }
  if (context.state === 'suspended') void context.resume()
  return context
}

async function loadAll(ctx: AudioContext) {
  await Promise.all(
    EFFECTS.map(async (name) => {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}sounds/${name}.mp3`)
        buffers.set(name, await ctx.decodeAudioData(await response.arrayBuffer()))
      } catch {
        // A missing sound shouldn't stop the lesson.
      }
    }),
  )
}

/**
 * Start fetching every clip as the page opens. The context stays suspended until
 * the first tap, but the clips are decoded and ready, so the very first sound plays.
 */
export function preloadSounds() {
  audio()
}

/** Call from the first tap so browsers allow audio. */
export function unlockAudio() {
  audio()
}

export function play(name: Effect, { volume = 0.8, rate = 1 } = {}) {
  if (muted) return
  const ctx = audio()
  const buffer = buffers.get(name)
  if (!ctx || !buffer) return
  const source = ctx.createBufferSource()
  source.buffer = buffer
  source.playbackRate.value = rate
  const gain = ctx.createGain()
  gain.gain.value = volume
  source.connect(gain).connect(ctx.destination)
  source.start()
}

/** A coin-like two-note blip that climbs with `level`. */
export function stepUp(level: number) {
  blip(noteFor(level), noteFor(level) * 1.5)
}

/** The same blip falling, for −. */
export function stepDown(level: number) {
  blip(noteFor(level) * 1.5, noteFor(level))
}

/**
 * Notes climb through each run of five, and every new five starts a step higher,
 * so counting to 20 never repeats the same note over and over.
 */
function noteFor(level: number): number {
  const five = Math.floor(level / SCALE.length)
  const semitones = SCALE[level % SCALE.length] + (five % 6) * 2
  return 392 * 2 ** (semitones / 12)
}

/**
 * A muted cutting-board thud for the chop: a low tone that drops fast, under a
 * short, dull knock of filtered noise.
 */
export function chopThud() {
  if (muted) return
  const ctx = audio()
  if (!ctx) return
  const now = ctx.currentTime

  const body = ctx.createOscillator()
  body.type = 'sine'
  body.frequency.setValueAtTime(170, now)
  body.frequency.exponentialRampToValueAtTime(55, now + 0.12)
  const bodyGain = ctx.createGain()
  bodyGain.gain.setValueAtTime(0.0001, now)
  bodyGain.gain.exponentialRampToValueAtTime(0.55, now + 0.006)
  bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22)
  body.connect(bodyGain).connect(ctx.destination)
  body.start(now)
  body.stop(now + 0.25)

  const length = Math.floor(ctx.sampleRate * 0.05)
  const noise = ctx.createBuffer(1, length, ctx.sampleRate)
  const data = noise.getChannelData(0)
  for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length)
  const knock = ctx.createBufferSource()
  knock.buffer = noise
  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = 700
  filter.Q.value = 1.2
  const knockGain = ctx.createGain()
  knockGain.gain.value = 0.25
  knock.connect(filter).connect(knockGain).connect(ctx.destination)
  knock.start(now)
}

/** A soft puff of filtered noise, for a sprinkle vanishing. */
export function poof() {
  if (muted) return
  const ctx = audio()
  if (!ctx) return
  const now = ctx.currentTime
  const length = Math.floor(ctx.sampleRate * 0.3)
  const noise = ctx.createBuffer(1, length, ctx.sampleRate)
  const data = noise.getChannelData(0)
  for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1
  const source = ctx.createBufferSource()
  source.buffer = noise
  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(2400, now)
  filter.frequency.exponentialRampToValueAtTime(300, now + 0.25)
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(0.35, now + 0.015)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28)
  source.connect(filter).connect(gain).connect(ctx.destination)
  source.start(now)
  source.stop(now + 0.3)
}

/**
 * A soft, round "bloop" for a seed or hole popping up out of the food: a sine
 * that swoops up in pitch with a quick fade, a little higher or lower each time.
 */
export function bloop() {
  if (muted) return
  const ctx = audio()
  if (!ctx) return
  const now = ctx.currentTime
  const pitch = 0.88 + Math.random() * 0.25
  const tone = ctx.createOscillator()
  tone.type = 'sine'
  tone.frequency.setValueAtTime(260 * pitch, now)
  tone.frequency.exponentialRampToValueAtTime(720 * pitch, now + 0.07)
  tone.frequency.exponentialRampToValueAtTime(560 * pitch, now + 0.14)
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(0.32, now + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16)
  tone.connect(gain).connect(ctx.destination)
  tone.start(now)
  tone.stop(now + 0.18)
}

/**
 * A swoosh lasting `seconds`, for something swinging through the air: breathy
 * noise whose pitch sweeps up then down, loudest mid-swing when it moves fastest.
 */
export function swoosh(seconds: number, pitch = 1) {
  if (muted) return
  const ctx = audio()
  if (!ctx) return
  const now = ctx.currentTime
  const end = now + seconds
  const peak = now + seconds * 0.55
  const length = Math.floor(ctx.sampleRate * seconds)
  const noise = ctx.createBuffer(1, length, ctx.sampleRate)
  const data = noise.getChannelData(0)
  for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1
  const source = ctx.createBufferSource()
  source.buffer = noise
  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.Q.value = 1.6
  filter.frequency.setValueAtTime(500 * pitch, now)
  filter.frequency.exponentialRampToValueAtTime(1800 * pitch, peak)
  filter.frequency.exponentialRampToValueAtTime(700 * pitch, end)
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(0.5, peak)
  gain.gain.exponentialRampToValueAtTime(0.0001, end)
  source.connect(filter).connect(gain).connect(ctx.destination)
  source.start(now)
  source.stop(end)
}

function blip(first: number, second: number) {
  if (muted) return
  const ctx = audio()
  if (!ctx) return
  const now = ctx.currentTime
  const oscillator = ctx.createOscillator()
  const gain = ctx.createGain()
  oscillator.type = 'square'
  oscillator.frequency.setValueAtTime(first, now)
  oscillator.frequency.setValueAtTime(second, now + 0.06)
  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(0.12, now + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22)
  oscillator.connect(gain).connect(ctx.destination)
  oscillator.start(now)
  oscillator.stop(now + 0.25)
}

export function isMuted() {
  return muted
}

export function setMuted(value: boolean) {
  muted = value
  try {
    localStorage.setItem(MUTE_KEY, value ? '1' : '0')
  } catch {
    // Private mode: the setting just won't stick.
  }
}

function readMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === '1'
  } catch {
    return false
  }
}
