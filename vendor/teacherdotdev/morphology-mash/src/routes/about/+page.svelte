<script lang="ts">
	import { resolve } from '$app/paths';
	import edtechathonLogo from '$lib/assets/edtechathon-logo.svg';
	import participants from '$lib/assets/2026participants.jpg';
</script>

<svelte:head>
	<title>About · Morphology Mash</title>
</svelte:head>

<div class="doc">
	<header>
		<div>
			<h1>About</h1>
			<p class="lede">
				A word-building practice tool for prefixes, bases and suffixes, built for teachers and their
				students.
			</p>
		</div>
		<a class="back" href={resolve('/')}>← Back to settings</a>
	</header>

	<section class="panel">
		<div class="head">
			<img src={edtechathonLogo} alt="" width="40" height="40" />
			<h2>From the EdTech-a-thon</h2>
		</div>
		<p>
			Morphology Mash is a project from the
			<a href="https://edtechathon.com" target="_blank" rel="noopener noreferrer">EdTech-a-thon</a>,
			a community of builders making free tools for classrooms. Learn more about who we are and what
			else we're building at
			<a href="https://edtechathon.com" target="_blank" rel="noopener noreferrer">edtechathon.com</a
			>.
		</p>

		<figure>
			<img src={participants} alt="Participants of the 2026 EdTech-a-thon" />
			<figcaption>EdTech-a-thon 2026</figcaption>
		</figure>
	</section>

	<section class="panel">
		<h2>Our promise</h2>
		<ul>
			<li><strong>Zero paywalls.</strong></li>
			<li><strong>Zero ads.</strong></li>
			<li><strong>Zero tracking of personal data.</strong></li>
		</ul>
	</section>

	<section class="panel">
		<h2>Feedback &amp; ideas</h2>
		<p>
			We'd love to hear from you. Tell us what's working, what's not, or pitch us an idea for a tool
			you wish existed. We're here to help.
		</p>
		<a class="btn-dark" href="mailto:support@teacher.dev?subject=morphology%20mash%20feedback">
			Email support@teacher.dev
		</a>
	</section>
</div>

<style>
	/* The EdTech-a-thon logo sits beside its heading. */
	.head {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.5rem;
	}
	.head h2 {
		margin: 0;
	}
	ul {
		margin: 0;
		padding-left: 1.1rem;
		font-size: 0.95rem;
		line-height: 1.9;
	}
	/* A snapshot pinned to the page, so the tool feels like it came from people. */
	figure {
		max-width: 28rem;
		margin: 1.5rem auto 0.5rem;
		background: var(--paper);
		border: 1px solid var(--line);
		border-radius: 4px;
		padding: 0.75rem 0.75rem 1.5rem;
		box-shadow: 0 8px 20px rgb(0 0 0 / 0.12);
		transform: rotate(-1deg);
	}
	figure img {
		display: block;
		width: 100%;
		background: var(--paper-low);
	}
	figcaption {
		padding-top: 1.1rem;
		text-align: center;
		font-size: 1.15rem;
		color: var(--muted);
		font-family: 'Segoe Script', 'Bradley Hand', 'Snell Roundhand', 'Comic Sans MS', cursive;
	}
	.btn-dark {
		text-decoration: none;
	}
</style>
