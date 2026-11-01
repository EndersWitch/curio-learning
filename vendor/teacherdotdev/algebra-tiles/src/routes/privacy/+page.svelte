<script lang="ts">
	import SitePage from '$lib/SitePage.svelte';
	import { SUPPORT_EMAIL } from '$lib/support';
</script>

<SitePage title="Privacy" lede="What we collect, what we don’t, and why.">
	<section>
		<p>
			Algebra Tiles does not collect personal information from teachers or students. There are no
			accounts and nothing to sign in to. We use Cloudflare Web Analytics to anonymously count the
			number of visits, which helps us understand how Algebra Tiles is being used in classrooms.
			Cloudflare Web Analytics is cookieless, does not fingerprint visitors, and does not track
			users across other sites; see Cloudflare’s
			<a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer"
				>privacy policy</a
			>
			for details. We do not share, sell, or otherwise transfer any visitor data to third parties.
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
