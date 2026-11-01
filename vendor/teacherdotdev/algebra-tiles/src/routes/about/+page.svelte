<script lang="ts">
	import logo from '$lib/assets/edtechathon-logo.svg';
	import SitePage from '$lib/SitePage.svelte';
	import { SUPPORT_EMAIL } from '$lib/support';
</script>

<SitePage
	title="About"
	lede="A free tool for multiplying and factoring polynomials with algebra tiles."
>
	<section>
		<div class="heading">
			<img src={logo} alt="" width="40" height="40" />
			<h2>From the EdTech-a-thon</h2>
		</div>
		<p>
			Algebra Tiles is a project from the
			<a href="https://edtechathon.com" target="_blank" rel="noopener noreferrer">EdTech-a-thon</a>,
			a community of builders making free tools for classrooms. Learn more about who we are and what
			else we’re building at
			<a href="https://edtechathon.com" target="_blank" rel="noopener noreferrer">edtechathon.com</a
			>.
		</p>
		<figure>
			<figcaption>EdTech-a-thon 2026</figcaption>
		</figure>
	</section>

	<section>
		<h2>Our promise</h2>
		<ul>
			<li><strong>Zero paywalls.</strong></li>
			<li><strong>Zero ads.</strong></li>
			<li><strong>Zero tracking of personal data.</strong></li>
		</ul>
	</section>

	<section>
		<h2>Feedback &amp; ideas</h2>
		<p>
			We’d love to hear from you. Tell us what’s working, what’s not, or pitch us an idea for a tool
			you wish existed. We’re here to help.
		</p>
		<a class="btn-primary" href="mailto:{SUPPORT_EMAIL}?subject=Algebra%20Tiles%20feedback">
			Email {SUPPORT_EMAIL}
		</a>
	</section>
</SitePage>

<style>
	.heading {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.6rem;
	}
	.heading h2 {
		margin: 0;
	}
	ul {
		padding-left: 1.25rem;
		line-height: 1.8;
	}
	/* The group photo, pinned up like a print someone brought back from the event. */
	figure {
		max-width: 32rem;
		margin: 1.5rem auto 0.5rem;
		padding: 0.75rem 0.75rem 0.5rem;
		border: 1px solid var(--line);
		background: #fff;
		box-shadow: 0 8px 24px rgb(29 40 56 / 0.16);
		transform: rotate(-1deg);
	}
	figure img {
		display: block;
		width: 100%;
		height: auto;
		background: var(--paper-low);
	}
	figcaption {
		padding-top: 0.8rem;
		color: var(--ink-soft);
		font-family: 'Segoe Script', 'Bradley Hand', 'Snell Roundhand', 'Comic Sans MS', cursive;
		font-size: 1.2rem;
		text-align: center;
	}
</style>
