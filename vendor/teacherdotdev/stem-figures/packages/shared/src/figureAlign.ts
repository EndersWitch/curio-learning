// Where a figure sits when it's drawn smaller than the space it's given: in
// the middle, as usual, or tucked into a corner, as on a directory card that
// shows two figures split by a diagonal (see SplitPreview). Set by whatever
// holds the figure, read by FigureFrame, so no generator has to pass it on.

import { getContext, setContext } from 'svelte'

/** An SVG preserveAspectRatio alignment. */
export type FigureAlign = 'xMidYMid' | 'xMinYMin' | 'xMaxYMax'

const KEY = Symbol('figure-align')

export const setFigureAlign = (align: FigureAlign) => setContext(KEY, align)
export const getFigureAlign = (): FigureAlign => getContext<FigureAlign | undefined>(KEY) ?? 'xMidYMid'
