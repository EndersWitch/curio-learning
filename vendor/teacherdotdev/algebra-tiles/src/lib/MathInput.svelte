<script lang="ts">
	// A math field: ^ starts a power, brackets pair themselves, and the value
	// stays as plain text. Other attributes (id, aria-label, placeholder…) go
	// to the field's text box.
	import { MathField } from '@caret-js/svelte';
	import { commands, fromText, schema, toText } from './math';

	let { value = $bindable(''), ...rest }: { value?: string; [attribute: string]: unknown } =
		$props();
</script>

<MathField {schema} bind:value {fromText} {toText} {commands} {...rest} />

<style>
	:global(.caret-field) {
		--caret-border: var(--line-strong);
		--caret-focus: var(--accent);
		--caret-invalid: var(--bad);
		--caret-color: var(--ink);
		--caret-font-size: 1.35rem;
		--caret-placeholder-font: var(--sans);
	}
</style>
