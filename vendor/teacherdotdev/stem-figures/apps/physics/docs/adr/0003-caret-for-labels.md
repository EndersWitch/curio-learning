# Caret for labels

Physics figures carry short labels (m₁, F_N, 30°, θ, μ_k, Δx) that should look like physics as the teacher types them, so every label is typed in Caret's math field, the same friend's library Math Figures uses for its inequalities (see Math Figures' ADR 0002). Caret already handles subscripts. Greek letters and the degree sign are typing rules we add (`theta` → θ, `mu` → μ, `deg` → °), the way Math Figures adds `pi` → π.

This was chosen over lighter options knowing that labels rarely need fractions or exponents: one field that looks and types the same across Math, Chemistry and Physics Figures is worth the weight, and it keeps Caret in real use.

## Considered Options

- **Plain text box with shortcuts** (`m_1` → m₁, `theta` → θ): lightest, but subscripts become Unicode characters that only exist for digits and a few letters, so F_N or μ_k can't be written.
- **Plain text box with symbol buttons**: easy to discover, but has the same subscript limit and looks like code rather than physics.

## Consequences

- Caret comes over the way Math Figures ships it: built packages committed as tarballs under `vendor/`, installed with `npm ci` so Vercel never keeps a stale copy, and exactly one copy of `@caret-js/core` loaded. Its missing license file is still an open item with its author.
- The page address stores each label in a plain readable form (`m_1`, `theta`, `30deg`), never Caret's internal format.
- A label's Blank line and None choices sit outside the math field; only written text is typed in Caret.
- Teachers coming from Google Docs raise a degree sign as a superscript o, so a superscript holding just "o" becomes ° (typed or in an address), and Docs' Ctrl+. and Ctrl+, (⌘ on a Mac) switch a superscript or subscript on and off. The field has no hook for extra keys, so the label field turns those shortcuts into private-use characters the label's commands act on, the same way it handles spaces.
- Caret's Svelte field drops typed spaces (its editor has a `keepWhitespace` option the field doesn't pass on), and labels like "5 kg" need them. Until that's fixed in Caret, the label field swaps each typed or pasted space for a blank Braille character (U+2800), which Caret keeps, and the label's text turns it back into a space. Caret's text conversion also drops spaces and can't write subscripts, so labels have their own conversion. Both are worth reporting to Caret's author.
