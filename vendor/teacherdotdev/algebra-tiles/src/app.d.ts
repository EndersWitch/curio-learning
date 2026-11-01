// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		interface PageState {
			/** The gallery's details drawer, open on narrow screens for this activity. */
			sheet?: import('$lib/algebra').Activity;
		}
		// interface Platform {}
	}
}

export {};
