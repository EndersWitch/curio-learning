<!--
  "Fraction Fun" with its icon, beside the teacher.dev logo in the top-left corner.
  On the teacher page it links back to the activity; in the activity it's just a label.
-->
<script lang="ts">
  let { href, scrolls = false }: { href?: string; scrolls?: boolean } = $props()
</script>

<svelte:element this={href ? 'a' : 'div'} class="brand-box" class:scrolls {href}>
  <img src="/favicon.svg" alt="" width="30" height="30" />
  <span>Fraction Fun</span>
</svelte:element>

<style>
  .brand-box {
    position: fixed;
    top: 18px;
    left: 82px;
    z-index: 6;
    height: 52px;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 0 18px 0 11px;
    border-radius: 14px;
    background: #fff;
    box-shadow: 0 4px 16px #2b2b3a1f;
    color: var(--ink);
    font: 700 19px/1 var(--font);
    text-decoration: none;
  }

  .brand-box.scrolls {
    position: absolute;
  }

  img {
    border-radius: 7px;
  }

  /* In the activity the pinned question sits top-middle, so the box gives way on
     narrower screens: icon only, then nothing. */
  @media (max-width: 960px) {
    .brand-box:not(.scrolls) {
      padding: 0 11px;
    }

    .brand-box:not(.scrolls) span {
      display: none;
    }
  }

  @media (max-width: 600px) {
    .brand-box:not(.scrolls) {
      display: none;
    }
  }
</style>
