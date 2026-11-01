// The round food a problem is worked on, and the words students see for it.

export type Item = 'donut' | 'pizza' | 'cookie' | 'cake' | 'watermelon' | 'cheese'

/** Every item, in the order teacher setup lists them. The donut is the default. */
export const ITEMS: Item[] = ['donut', 'pizza', 'cookie', 'cake', 'watermelon', 'cheese']

export type ItemWords = {
  /** For a list of items to choose from: "Donut". */
  label: string
  /** The food itself: "donut". */
  name: string
  /** One topping dealt onto it: "sprinkle". */
  topping: string
  /** More than one topping: "sprinkles". */
  toppings: string
}

export const ITEM_WORDS: Record<Item, ItemWords> = {
  donut: { label: 'Donut', name: 'donut', topping: 'sprinkle', toppings: 'sprinkles' },
  // "How many pepperoni in one group?" reads more naturally than "pepperonis".
  pizza: { label: 'Pizza', name: 'pizza', topping: 'pepperoni', toppings: 'pepperoni' },
  // "Chips", not "chocolate chips": next to a cookie it can't mean potato chips, and
  // the longer words wrap under the stepper's number on a phone, resizing the cookie.
  cookie: { label: 'Cookie', name: 'cookie', topping: 'chip', toppings: 'chips' },
  cake: { label: 'Cake', name: 'cake', topping: 'candle', toppings: 'candles' },
  watermelon: { label: 'Watermelon', name: 'watermelon', topping: 'seed', toppings: 'seeds' },
  cheese: { label: 'Cheese', name: 'cheese', topping: 'hole', toppings: 'holes' },
}

/**
 * How an item's toppings arrive: thrown in an arc from the edge of the screen, or
 * popping up in place, for toppings that grow out of the food (seeds, holes).
 */
export type Arrival = 'throw' | 'pop'

export const ARRIVAL: Record<Item, Arrival> = {
  donut: 'throw',
  pizza: 'throw',
  cookie: 'throw',
  cake: 'throw',
  watermelon: 'pop',
  cheese: 'pop',
}

/** Reads `?item=pizza`, `?item=cheese` and so on. Anything else is a donut. */
export function itemFromParams(params: URLSearchParams): Item {
  const value = params.get('item')
  return ITEMS.find((item) => item === value) ?? 'donut'
}

/** "1 sprinkle", "2 sprinkles": the topping word for a count. */
export function toppingsFor(item: Item, count: number): string {
  const words = ITEM_WORDS[item]
  return count === 1 ? words.topping : words.toppings
}
