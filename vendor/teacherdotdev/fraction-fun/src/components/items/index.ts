// The drawings for each item other than the donut and the pizza (which Donut.svelte
// draws itself): the food, in the same 400×400 box centred on (200, 200), and one
// topping, centred on (0, 0).
import type { Component } from 'svelte'
import type { Item } from '../../lib/items'
import CakeArt from './CakeArt.svelte'
import CakeTopping from './CakeTopping.svelte'
import CheeseArt from './CheeseArt.svelte'
import CheeseTopping from './CheeseTopping.svelte'
import CookieArt from './CookieArt.svelte'
import CookieTopping from './CookieTopping.svelte'
import WatermelonArt from './WatermelonArt.svelte'
import WatermelonTopping from './WatermelonTopping.svelte'

type Drawn = Exclude<Item, 'donut' | 'pizza'>

/** `shine`: a kept group, drawn with brighter highlights. */
export type ArtProps = { shine?: boolean }
/** `rotation`: a random turn, 0–180°. `toward`: the direction of the item's centre, in degrees. */
export type ToppingProps = { rotation?: number; toward?: number }

export const ITEM_ART: Record<Drawn, Component<ArtProps>> = {
  cookie: CookieArt,
  cake: CakeArt,
  watermelon: WatermelonArt,
  cheese: CheeseArt,
}

export const ITEM_TOPPING: Record<Drawn, Component<ToppingProps>> = {
  cookie: CookieTopping,
  cake: CakeTopping,
  watermelon: WatermelonTopping,
  cheese: CheeseTopping,
}
