import { mount } from 'svelte'
// Fonts are served from this site, so no font service sees who visits.
import '@fontsource-variable/fredoka/wght.css'
import '@fontsource/atkinson-hyperlegible/latin-400.css'
import '@fontsource/atkinson-hyperlegible/latin-700.css'
import './app.css'
import App from './App.svelte'
import { preloadSounds } from './lib/sound'
import Teacher from './Teacher.svelte'
import { embedded, report } from './lib/curio'

// /teacher is the same single-page app (vercel.json rewrites it to index.html).
const forTeachers = new RegExp('^' + import.meta.env.BASE_URL + 'teacher/?$').test(location.pathname)
if (!forTeachers) preloadSounds()

const app = mount(forTeachers ? Teacher : App, {
  target: document.getElementById('app')!,
})

if (embedded) document.documentElement.classList.add('embedded')
report('ready')

export default app
