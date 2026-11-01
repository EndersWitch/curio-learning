import { mount } from 'svelte'
import './app.css'
import App from './App.svelte'

// Cloudflare Web Analytics beacon; the token is set in Vercel's production env only.
const token = import.meta.env.VITE_CF_BEACON_TOKEN
if (token) {
  const script = document.createElement('script')
  script.src = 'https://static.cloudflareinsights.com/beacon.min.js'
  script.dataset.cfBeacon = JSON.stringify({ token })
  document.head.append(script)
}

const app = mount(App, {
  target: document.getElementById('app'),
})

export default app
