// Shared monoline icon set for the static (non-React) pages — mirrors
// components/icons.tsx so every page in the app uses the same icon language
// instead of emoji. Usage: ICONS.check(14) returns a ready-to-insert <svg> string.
const ICONS = (function () {
  const ATTRS = 'fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"';
  function svg(size, path) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" ${ATTRS} style="flex-shrink:0">${path}</svg>`;
  }
  return {
    fileText:  (s = 15) => svg(s, '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 13h6M9 17h6M9 9h1"/>'),
    penLine:   (s = 15) => svg(s, '<path d="M13 4 20 11 9 22H2v-7z"/><path d="M11.5 5.5 18.5 12.5"/>'),
    user:      (s = 15) => svg(s, '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.6-4 5-6 8-6s6.4 2 8 6"/>'),
    star:      (s = 15) => svg(s, '<path d="M12 2.5 15 9l7 1-5 5 1.3 7L12 18.5 5.7 22 7 15 2 10l7-1z"/>'),
    check:     (s = 15) => svg(s, '<path d="M4 12.5 9.5 18 20 6"/>'),
    x:         (s = 15) => svg(s, '<path d="M5 5 19 19M19 5 5 19"/>'),
    lock:      (s = 15) => svg(s, '<rect x="4.5" y="11" width="15" height="10" rx="2"/><path d="M7.5 11V7.5a4.5 4.5 0 0 1 9 0V11"/>'),
    search:    (s = 15) => svg(s, '<circle cx="10.5" cy="10.5" r="7"/><path d="M20.5 20.5 15.8 15.8"/>'),
    flame:     (s = 15) => svg(s, '<path d="M12 2c1 3-2 4.5-2 7.5a2 2 0 0 0 4 0c1 1 2 2.5 2 4.5a6 6 0 1 1-12 0c0-4 3-5.5 3-9 0-1.2.5-2.2 1-3z"/>'),
    zap:       (s = 15) => svg(s, '<path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z"/>'),
    mail:      (s = 15) => svg(s, '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>'),
    wrench:    (s = 15) => svg(s, '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.8 2.8-2-2z"/>'),
    creditCard:(s = 15) => svg(s, '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>'),
    building:  (s = 15) => svg(s, '<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M9 8h1M14 8h1M9 12h1M14 12h1M9 16h1M14 16h1"/>'),
    pin:       (s = 15) => svg(s, '<path d="M12 21s7-6.5 7-11.5a7 7 0 1 0-14 0C5 14.5 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.3"/>'),
    alert:     (s = 15) => svg(s, '<path d="M12 3.5 22 20H2z"/><path d="M12 10v4"/><circle cx="12" cy="17.3" r="0.9" fill="currentColor" stroke="none"/>'),
    sparkle:   (s = 15) => svg(s, '<path d="M12 3v5M12 16v5M3 12h5M16 12h5M6 6l3 3M15 15l3 3M18 6l-3 3M9 15l-3 3"/>'),
    brain:     (s = 15) => svg(s, '<path d="M9 4.5A2.5 2.5 0 0 0 6.5 7c-1.4.3-2.5 1.5-2.5 3 0 .6.2 1.1.4 1.6C3.6 12.1 3 13 3 14.2 3 15.8 4.3 17 5.8 17c.1 1.7 1.5 3 3.2 3A2.5 2.5 0 0 0 11.5 17.5V7A2.5 2.5 0 0 0 9 4.5z"/><path d="M15 4.5A2.5 2.5 0 0 1 17.5 7c1.4.3 2.5 1.5 2.5 3 0 .6-.2 1.1-.4 1.6.8.5 1.4 1.4 1.4 2.6 0 1.6-1.3 2.8-2.8 2.8-.1 1.7-1.5 3-3.2 3a2.5 2.5 0 0 1-2.5-2.5V7A2.5 2.5 0 0 1 15 4.5z"/>'),
    bookOpen:  (s = 15) => svg(s, '<path d="M12 6c-1.8-1.6-4.3-2.3-8-2v14c3.7-.3 6.2.4 8 2 1.8-1.6 4.3-2.3 8-2V4c-3.7-.3-6.2.4-8 2z"/><path d="M12 6v14"/>'),
    globe:     (s = 15) => svg(s, '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 3.8 5.6 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.6-3.8-9S9.5 5.5 12 3z"/>'),
    calculator:(s = 15) => svg(s, '<rect x="4.5" y="2.5" width="15" height="19" rx="2"/><path d="M8 6.5h8"/><path d="M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h.01M12 19h.01M16 19h.01"/>'),
    flask:     (s = 15) => svg(s, '<path d="M9 2h6M10 2v6.5L4.5 18a2 2 0 0 0 1.7 3h11.6a2 2 0 0 0 1.7-3L14 8.5V2"/><path d="M7.5 14.5h9"/>'),
    trendingUp:(s = 15) => svg(s, '<path d="m3 16 6-6 4 4 8-9"/><path d="M15 5h6v6"/>'),
    clock:     (s = 15) => svg(s, '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>'),
    cog:       (s = 15) => svg(s, '<circle cx="12" cy="12" r="3.2"/><path d="M12 3v2.2M12 18.8V21M4.9 7.5l1.9 1.1M17.2 15.4l1.9 1.1M3 12h2.2M18.8 12H21M4.9 16.5l1.9-1.1M17.2 8.6l1.9-1.1M7.5 19.1l1.1-1.9M15.4 6.8l1.1-1.9M9.5 4.9l.6-2M14 4.9l-.6-2"/>'),
    refresh:   (s = 15) => svg(s, '<path d="M20 8a8 8 0 0 0-14.6-3.4M4 4v5h5"/><path d="M4 16a8 8 0 0 0 14.6 3.4M20 20v-5h-5"/>'),
    gradCap:   (s = 15) => svg(s, '<path d="M2 9 12 4l10 5-10 5z"/><path d="M6 11.5V17c0 1.5 2.7 3 6 3s6-1.5 6-3v-5.5"/><path d="M22 9v6"/>'),
    target:    (s = 15) => svg(s, '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.8"/><circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none"/>'),
    sprout:    (s = 15) => svg(s, '<path d="M7 20h10M12 20v-8"/><path d="M12 12c0-3.5-2.5-6-7-6 0 4.5 2.5 6.5 7 6z"/><path d="M12 10c0-3 2-5 6-5 0 3.5-2 5.5-6 5z"/>'),
    facebook:  (s = 18) => svg(s, '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>'),
    instagram: (s = 18) => svg(s, '<rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.5" y2="6.5"/>'),
  };
})();
