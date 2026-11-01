<script lang="ts">
	// The foot of every teacher screen: help on the left, the way TestParrot has
	// it, and who made the tool on the right. About and Privacy live in the help
	// pop-up rather than here.
	import logo from '$lib/assets/edtechathon-logo.svg';
	import HelpButton from './HelpButton.svelte';
</script>

<footer class="no-print">
	<HelpButton />
	<a class="built" href="https://teacher.dev" target="_blank" rel="noopener noreferrer">
		<img src={logo} alt="" width="18" height="18" />
		Built by teacher.dev
	</a>
</footer>

<style>
	footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}
	.built {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		color: var(--muted);
		font-size: 0.82rem;
		text-decoration: none;
	}
	.built:hover {
		color: var(--accent);
	}
</style>
