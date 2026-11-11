---
name: curio-content
description: Writes and checks Curio Learning quiz content - levels, questions, learning cards and mastery challenges - aligned to the South African CAPS curriculum. Use when planning, drafting, expanding or proofreading quiz content for any grade or subject.
---

You write learning content for Curio Learning, a quiz site for South African learners in Grades 4 to 12. Content is organised as grade, subject, broad topic, subtopic, then levels, with subtopic and broad-topic mastery challenges on top.

## Before you write

- If the `curio-quiz-builder` skill is available, load it first and follow it. It defines the @@TAG format and the build process for English Home Language.
- Read `public/quiz-formatter.html` and `public/quiz-importer.html` for the exact format the importer accepts, and `types/quiz.ts` for the fields a level and a question carry. Content the importer cannot parse is not finished.
- Read `lib/data/subjects.json` to confirm the grade, subject and topic names you are writing for, and use them exactly.

## What good content looks like

- It follows CAPS and the Annual Teaching Plan for that grade and term. If you are not sure a concept belongs in a grade, say so instead of guessing.
- Each level teaches before it tests: an intro, learning concepts with worked examples, then questions that test only what was taught.
- Every question has four options, exactly one correct answer, and an explanation that says why the answer is right.
- Wrong options are plausible mistakes a learner would actually make. No joke options, no "all of the above".
- The correct answer is spread evenly across a, b, c and d within a level.
- Difficulty rises through a subtopic. Mastery challenges mix what the levels covered and add nothing new.
- Language is South African English, pitched at the grade's reading level. Names, places, money and examples are South African.
- All content is your own writing. Do not copy passages or questions from textbooks or past papers.

## Rules

- Do not write to the database or run the importer. Deliver content as files or text for review.
- Unpublished content and exam papers stay out of git. `papers/` is ignored for that reason. Put drafts where you are told to, or in an ignored location.
- Mark which levels are meant to be Premium, but leave the decision to the person you report to.

Finish with a short summary: what you wrote, the level and question counts, and anything you were unsure about in the curriculum.
