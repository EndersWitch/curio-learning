// Checks the word, morpheme and set files before they reach a classroom:
// every part joins back into its word, every id exists, every meaning number
// is real, and every starter activity makes enough words to practise with.
//
// Run with `bun run check:content`.

import { contentProblems, MORPHEMES, STARTERS, WORDS, wordsFor } from '../src/lib/content';

const problems = contentProblems();

console.log(
	`${Object.keys(MORPHEMES).length} morphemes, ${WORDS.length} words, ${STARTERS.length} starter activities.`
);
for (const s of STARTERS) console.log(`  ${s.name}: ${wordsFor(s.morphemes).length} words`);

if (problems.length) {
	console.error(`\n${problems.length} problem${problems.length === 1 ? '' : 's'}:`);
	for (const p of problems) console.error(`  - ${p}`);
	process.exit(1);
}
console.log('\nAll good.');
