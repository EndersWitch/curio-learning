<script lang="ts">
	import SitePage from '$lib/SitePage.svelte';
	import { SUPPORT_EMAIL } from '$lib/support';
</script>

<SitePage title="Privacy" lede="What we collect, what we don’t, and why.">
	<section>
		<p>
			Algebra Tiles does not collect personal information from teachers or students. There are no
			accounts and nothing to sign in to. This page uses no cookies or trackers.
		</p>
		<p>
			Nothing a teacher or student does here is saved by us. A problem lives only in its link, and a
			student’s tiles and answers stay in their own browser, gone when they close the page.
		</p>
		<p>
			Questions or concerns? Email
			<a href="mailto:{SUPPORT_EMAIL}?subject=Algebra%20Tiles%20privacy">{SUPPORT_EMAIL}</a>.
		</p>
	</section>
</SitePage>
