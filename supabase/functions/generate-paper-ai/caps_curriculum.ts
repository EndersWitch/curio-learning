export interface TermCurriculum {
  newSkills: string[];
  grammar: string[];
  writingTypes: string[];
  sectionTypes: string[];
  textTypes: string[];
  comprehensionFormats: string[];
  languageQuestionTypes: string[];
  poetrySkills: string[];
}

export const GRADE_4: Record<string, TermCurriculum> = {
  'Term 1': {
    newSkills: ['common nouns','proper nouns','collective nouns','action verbs','descriptive adjectives','singular and plural nouns','basic sentence structure'],
    grammar: ['common nouns','proper nouns (capital letters)','collective nouns (herd, flock, bunch, pride, team)','action verbs','descriptive adjectives','singular and plural nouns','capital letters at start of sentences','full stops at end of statements'],
    writingTypes: ['personal narrative','simple sentences','short paragraph'],
    sectionTypes: ['Comprehension','Language Practice'],
    textTypes: ['simple narrative story','personal recount','short informational text'],
    comprehensionFormats: ['Circle the correct answer (A/B/C/D)','Answer TRUE or FALSE with a reason','Complete the sentence (fill in the blank)','Who are the main characters?','Factual recall (who/what/where/when)','Number sentences in correct order (1–4)','Why did [character] do [action]?','Personal response: YES/NO + reason (2 marks)'],
    languageQuestionTypes: ['Underline the action verb in: [sentence]','Circle ONE adjective in: [sentence]','Circle ONE common noun in: [sentence]','Write down the proper noun in: [sentence]','Write down the collective noun in: [sentence]','Write the plural of: [noun]','Fill in a suitable collective noun: A __________ of [animals]','Add a suitable adjective: The __________ dog barked loudly'],
    poetrySkills: [],
  },
  'Term 2': {
    newSkills: ['personal pronouns','possessive pronouns','punctuation (. ! ?)','prefixes (un-, re-, pre-)','synonyms (basic)'],
    grammar: ['common nouns','proper nouns','collective nouns','action verbs','descriptive adjectives','plurals','full stops and capital letters','personal pronouns (I, you, he, she, it, we, they)','possessive pronouns (my, your, his, her, its, our, their)','question marks (?)','exclamation marks (!)','commas in lists','prefixes: un-, re-, pre-','basic synonyms'],
    writingTypes: ['personal narrative','descriptive paragraph','simple recount'],
    sectionTypes: ['Comprehension','Language Practice','Poetry Analysis'],
    textTypes: ['simple narrative','descriptive passage','simple poem with rhyme'],
    comprehensionFormats: ['Circle the correct answer (A/B/C/D)','Answer TRUE or FALSE with a reason','Complete the sentence','Factual recall','Number sentences in correct order','Why did [character] do [action]?','How did [character] feel?','Personal response (2 marks)','What lesson can we learn? (2 marks)'],
    languageQuestionTypes: ['Underline the verb / Circle the noun / Circle the adjective','Replace noun with correct pronoun','Fill in possessive pronoun','Add correct punctuation mark (. / ! / ?)','Rewrite with correct capital letters','Add the prefix un-/re-/pre-','Give a synonym for: [word]','Punctuate this sentence correctly'],
    poetrySkills: ['What is the title of this poem?','How many stanzas does the poem have?','Write down TWO words that rhyme','Identify the rhyme scheme (AABB/ABAB)','What is the mood/feeling? Give a reason','Do you like this poem? YES/NO + TWO reasons'],
  },
  'Term 3': {
    newSkills: ['direct speech','reported/indirect speech','present tense','past tense','future tense','informational writing'],
    grammar: ['all nouns','action verbs','adjectives','plurals','pronouns','punctuation (. ! ? ,)','prefixes','synonyms','present tense','past tense','future tense','direct speech (inverted commas)','reported/indirect speech','antonyms','adverbs'],
    writingTypes: ['personal narrative','descriptive paragraph','simple informational report','factual recount'],
    sectionTypes: ['Comprehension','Language Practice','Poetry Analysis'],
    textTypes: ['narrative story','informational/factual passage','simple report text','poem'],
    comprehensionFormats: ['Circle correct answer (A/B/C/D)','TRUE or FALSE with reason','Fill in the blank','Factual recall','Number sentences in order','Why did [character] do [action]?','How did [character] feel?','What does the word [X] mean?','Personal response (2 marks)','What lesson can we learn? (2 marks)'],
    languageQuestionTypes: ['Rewrite in the PAST TENSE: [present tense sentence]','Rewrite in the FUTURE TENSE: [sentence]','Rewrite in the PRESENT TENSE: [past tense sentence]','Choose the correct tense: (walk/walked/will walk)','Identify the tense: PAST/PRESENT/FUTURE','Add punctuation to direct speech: [name] said I am hungry','Change to reported speech: [name] said, "I am going" → [name] said that __________','Change to direct speech: [name] said that he was tired → [name] said, "__________"','Give an antonym for: [word]','Underline the adverb in: [sentence]'],
    poetrySkills: ['Title and subject of poem','Number of stanzas and lines','TWO rhyming words','Rhyme scheme (AABB/ABAB)','Find example of alliteration','Explain meaning of a line (2 marks)','Mood with reason (2 marks)','Adjective/verb in line [X]','Personal response: YES/NO + reasons (2 marks)'],
  },
  'Term 4': {
    newSkills: ['conjunctions','sentence types (statement/question/command/exclamation)','similes','persuasive writing'],
    grammar: ['all nouns','verbs','adjectives','plurals','pronouns','tenses (past/present/future)','direct/indirect speech','all punctuation','prefixes','synonyms','antonyms','adverbs','conjunctions (and, but, because, so, or)','sentence types: statement/question/command/exclamation','similes (as fast as lightning)','persuasive language features','paragraph structure'],
    writingTypes: ['personal narrative','descriptive paragraph','informational report','persuasive letter/paragraph'],
    sectionTypes: ['Comprehension','Language Practice','Poetry Analysis'],
    textTypes: ['narrative','informational','persuasive text','advertisement','poem'],
    comprehensionFormats: ['Circle correct answer','TRUE/FALSE with reason','Fill in blank','Factual recall','Vocabulary in context','Identify persuasive language','Non-prose text questions (advertisement/table)','Personal response (2 marks)'],
    languageQuestionTypes: ['Give a synonym for: [word]','Give an antonym for: [word]','Identify sentence type (statement/question/command/exclamation): [sentence]','Join sentences using conjunction (because/and/but/so)','Circle correct word: (is/are)','Rewrite as a question: [statement]','Underline the conjunction in: [sentence]','Write your own command sentence','Find the simile and explain it'],
    poetrySkills: ['Title/subject/stanzas/lines','Rhyme scheme','Simile: find and explain','Personification: find and explain','Alliteration: find','Meaning of a line (2 marks)','Tone/mood with evidence (2 marks)','Personal response with reasons (2 marks)'],
  },
};

export const GRADE_5: Record<string, TermCurriculum> = {
  'Term 1': {
    newSkills: ['concrete and abstract nouns','compound nouns','degrees of comparison','simple and compound sentences'],
    grammar: ['all Grade 4 grammar','concrete nouns','abstract nouns','compound nouns','degrees of comparison (big → bigger → biggest)','simple sentences','compound sentences (and/but/or/so)'],
    writingTypes: ['personal narrative','paragraph','recount'],
    sectionTypes: ['Comprehension','Language Practice','Poetry Analysis'],
    textTypes: ['narrative','simple informational','persuasive paragraph','simple poem'],
    comprehensionFormats: ['Multiple choice (A/B/C/D)','TRUE/FALSE with reason','Fill in blank','Factual recall','Sequence events (number 1–5)','Inference (why? what do you think?)','Vocabulary in context','Personal response (2–3 marks)','Main idea of paragraph [X]?'],
    languageQuestionTypes: ['Classify noun as concrete or abstract: [noun]','Write comparative and superlative of: [adjective]','Identify compound noun in: [sentence]','Rewrite as compound sentence using [and/but/or]: [two simple sentences]','Is this a simple or compound sentence? [sentence]','Write degrees of comparison: fast → __________ → __________','All Grade 4 types at higher complexity'],
    poetrySkills: ['Title and subject','Stanza and line count','Rhyme scheme','Find simile/alliteration/personification','Meaning of a line (2 marks)','Tone/mood with evidence','Personal response (2 marks)'],
  },
  'Term 2': {
    newSkills: ['complex sentences','homophones','homonyms','suffixes (-ful, -less, -ness, -ment)'],
    grammar: ['all Grade 4 + Gr5 T1 grammar','subordinating conjunctions (because, although, if, when)','complex sentences','homophones (their/there, to/too/two)','homonyms','suffixes: -ful, -less, -ness, -ment'],
    writingTypes: ['personal narrative','descriptive paragraph','recount','informal letter'],
    sectionTypes: ['Comprehension','Language Practice','Poetry Analysis'],
    textTypes: ['narrative','informational','advertisement','poem','table/chart'],
    comprehensionFormats: ['Multiple choice','TRUE/FALSE with reason','Fill in blank','Factual recall','Inference with evidence','Vocabulary in context','Non-prose text extraction','Personal response (3 marks)'],
    languageQuestionTypes: ["Choose correct homophone: (their/there/they're)",'Add suffix to form new word: help → help__________','Join sentences using subordinating conjunction','Identify main clause and subordinate clause','All Grade 4 + Gr5 T1 types'],
    poetrySkills: ['Title/stanzas/lines/rhyme scheme','Simile: identify and explain','Personification: identify and explain','Alliteration: find','Tone and mood with evidence (2 marks)','Meaning of a stanza (2 marks)','Personal response (2 marks)'],
  },
  'Term 3': {
    newSkills: ['active and passive voice','subject-verb agreement','formal vs informal language'],
    grammar: ['all previous grammar','active voice','passive voice','subject-verb agreement','formal language','informal language','reported speech with tense backshift'],
    writingTypes: ['narrative','descriptive','recount','informal letter','simple report/essay'],
    sectionTypes: ['Comprehension','Language Practice','Poetry Analysis'],
    textTypes: ['narrative','informational','transactional','non-prose (graph/table)','poem'],
    comprehensionFormats: ['Multiple choice','TRUE/FALSE with reason','Factual recall','Inference with evidence','Vocabulary in context',"Author's purpose/viewpoint",'Non-prose extraction','Personal response (3–4 marks)'],
    languageQuestionTypes: ['Change active to passive: [sentence]','Change passive to active: [sentence]','Correct subject-verb agreement: (run/runs)','Identify formal or informal: [sentence]','Change to formal language: [informal sentence]','All previous types at higher complexity'],
    poetrySkills: ['All Grade 4/5 T1+T2 skills','Identify and explain metaphor','Compare two stanzas: mood change','Extended analysis of literary device (2–3 marks)'],
  },
  'Term 4': {
    newSkills: ['idioms','paragraph essay planning','persuasive devices'],
    grammar: ['all previous','active/passive voice','subject-verb agreement (concord)','idioms','paragraph structure (TISC)','persuasive devices: emotive language, repetition, rhetorical questions'],
    writingTypes: ['narrative','descriptive','recount','informal letter','essay/report','persuasive paragraph'],
    sectionTypes: ['Comprehension','Language Practice','Poetry Analysis'],
    textTypes: ['narrative','informational','persuasive','non-prose','poem'],
    comprehensionFormats: ['Multiple choice','TRUE/FALSE with reason','Factual recall','Inference','Vocabulary in context','Identify persuasive device',"Author's purpose/tone",'Personal response (4 marks)'],
    languageQuestionTypes: ['Identify idiom and explain meaning: [sentence]','Change active ↔ passive','Correct concord error: [sentence]','Identify persuasive device in: [sentence]','All previous types'],
    poetrySkills: ['Full analysis: title/subject/stanzas/rhyme','Simile/metaphor/personification/alliteration (identify + explain)','Tone/mood/atmosphere with evidence',"Poet's message/theme (2–3 marks)",'Personal response (3 marks)'],
  },
};

export const GRADE_6: Record<string, TermCurriculum> = {
  'Term 1': {
    newSkills: ['gerunds','infinitives','prepositions','paragraph writing with topic sentences'],
    grammar: ['all Gr4–5 grammar','gerunds (swimming is fun)','infinitives (I like to swim)','prepositions (in, on, under, between, beside, through)'],
    writingTypes: ['narrative','descriptive','recount','informal letter','report'],
    sectionTypes: ['Comprehension','Language Practice','Poetry Analysis'],
    textTypes: ['narrative','informational','persuasive','non-prose (advertisement/map/graph)','poem'],
    comprehensionFormats: ['Multiple choice','TRUE/FALSE with reason + evidence','Fill in blank','Inference with evidence','Vocabulary in context','Main idea of paragraph?',"Author's purpose/tone",'Non-prose: extract and interpret data','Personal response (4 marks)'],
    languageQuestionTypes: ['Identify gerund or infinitive in: [sentence]','Rewrite using a gerund: [sentence]','Fill in correct preposition: The book is __________ the shelf (on/under/beside)','Identify preposition and object in: [sentence]','All Grade 5 types at greater complexity'],
    poetrySkills: ['Full analysis: title/subject/stanzas/lines/rhyme scheme','Identify + explain: simile, metaphor, personification, alliteration, onomatopoeia','Tone and mood with evidence',"Poet's message with reference to text (3 marks)",'Personal response (3 marks)'],
  },
  'Term 2': {
    newSkills: ['modal verbs','relative clauses','full reported speech with tense backshift'],
    grammar: ['all previous','modal verbs (can, could, may, might, must, should, would)','relative clauses (who/which/that)','full reported speech with tense backshift'],
    writingTypes: ['narrative','descriptive','report','informal letter','dialogue'],
    sectionTypes: ['Comprehension','Language Practice','Poetry Analysis'],
    textTypes: ['narrative','informational','report','non-prose (graph/table/form)','poem','dialogue'],
    comprehensionFormats: ['All Gr6 T1 formats',"Author's viewpoint vs fact",'Identify tone of paragraph','How does title relate to passage? (2 marks)'],
    languageQuestionTypes: ['Change verb using modal: She __________ complete her homework','Identify modal verb and explain (ability/permission/obligation)','Add relative clause: The boy __________ won the race','All previous types at Grade 6 complexity'],
    poetrySkills: ['All Gr6 T1 skills','Identify and explain irony/contrast','How does poet use language to create mood? (3 marks)'],
  },
  'Term 3': {
    newSkills: ['conditional sentences (if clauses)','reported questions','colons','semicolons','parentheses'],
    grammar: ['all previous','conditional Type 0 and Type 1','reported questions','parentheses/brackets','ellipsis (...)','colon (:) for lists','semicolon (;) for related clauses'],
    writingTypes: ['narrative','descriptive','report/essay (formal)','informal/formal letter','review'],
    sectionTypes: ['Comprehension','Language Practice','Poetry Analysis'],
    textTypes: ['narrative','informational','persuasive','report','poem','visual text (cartoon/caption)'],
    comprehensionFormats: ['All previous','Visual text supports written text (2 marks)','Identify structure: intro/body/conclusion'],
    languageQuestionTypes: ['Complete conditional: If it rains, __________','Change to reported question: She asked, "Where is the library?" → She asked __________','Add parentheses to sentence','Replace semicolon with full stop (two sentences)','All previous types'],
    poetrySkills: ['All previous','How does structure support meaning? (3 marks)','Identify contrast/juxtaposition'],
  },
  'Term 4': {
    newSkills: ['formal essay','literary analysis essay (intro)','full Gr4–6 grammar consolidation'],
    grammar: ['Full review of all Gr4–6 grammar','compound-complex sentences','all punctuation','all literary devices'],
    writingTypes: ['narrative','descriptive','report/essay','formal letter','review','short literary analysis'],
    sectionTypes: ['Comprehension','Language Practice','Poetry Analysis'],
    textTypes: ['all Gr4–6 text types','visual literacy (poster/cartoon/advertisement)'],
    comprehensionFormats: ['All Gr4–6 formats at highest complexity','Visual literacy questions','Compare two short texts (2–3 marks)','Personal response (4–5 marks)'],
    languageQuestionTypes: ['Full review of all Gr4–6 types at higher complexity'],
    poetrySkills: ['Full analysis','All literary devices',"Poet's message and purpose (4 marks)",'Comparative question (3 marks)'],
  },
};

export const GRADE_7: Record<string, TermCurriculum> = {
  'Term 1': {
    newSkills: ['transactional writing','visual literacy','formal register','transition words for coherence'],
    grammar: ['all Gr4–6 grammar','full reported speech (statements/questions/commands/exclamations)','compound-complex sentences','colons and semicolons','formal register','transition words (however, therefore, furthermore, in addition)'],
    writingTypes: ['narrative essay','descriptive essay','expository paragraph','formal letter','informal letter','notice'],
    sectionTypes: ['Comprehension','Language Practice','Poetry Analysis','Visual Literacy'],
    textTypes: ['narrative','informational','persuasive','report','transactional','visual text (poster/cartoon/advertisement/graph)','poem'],
    comprehensionFormats: ['Multiple choice','TRUE/FALSE with evidence','Inference with textual evidence','Vocabulary in context',"Author's tone/purpose/viewpoint",'Visual literacy question','Extended response (5 marks)','Compare two characters/viewpoints (3 marks)'],
    languageQuestionTypes: ['All Gr4–6 types at higher complexity','Identify register (formal/informal) and give reason','Rewrite in formal register: [informal sentence]','Identify and correct all errors in: [paragraph]','Add transition words to improve coherence: [paragraph]','Explain the effect of punctuation in: [sentence]'],
    poetrySkills: ['Full analysis: all structural and language features','Identify + explain: simile, metaphor, personification, alliteration, onomatopoeia, irony, hyperbole','Tone/mood/atmosphere with textual evidence (3 marks)',"Poet's message/theme with reference to lines (4 marks)",'Personal response: relate to own life (3 marks)'],
  },
  'Term 2': {
    newSkills: ['summary writing','newspaper/magazine article reading','argumentative writing (intro)'],
    grammar: ['All Gr7 T1 at higher complexity'],
    writingTypes: ['narrative essay','formal/informal letter','summary (short)','argumentative paragraph'],
    sectionTypes: ['Comprehension','Language Practice','Poetry Analysis','Visual Literacy','Summary'],
    textTypes: ['narrative','informational','newspaper/magazine article','visual text','poem'],
    comprehensionFormats: ['All T1 formats','Summarise main points in OWN WORDS (4–5 marks)','Identify audience and purpose (2 marks)','Find THREE facts and ONE opinion'],
    languageQuestionTypes: ['All T1 types + longer passage editing'],
    poetrySkills: ['All T1 skills','Identify irony/satire','Compare mood across two stanzas (3 marks)'],
  },
  'Term 3': {
    newSkills: ['novel/short story analysis (character/setting/theme/conflict)','summary writing (full paragraph)','discursive essay'],
    grammar: ['All previous at higher complexity','Sentence variation for effect'],
    writingTypes: ['narrative essay','discursive/argumentative paragraph','summary','formal/informal letter'],
    sectionTypes: ['Comprehension','Language Practice','Poetry Analysis','Visual Literacy','Summary'],
    textTypes: ['literary text (short story/extract)','informational','visual text','poem','report/article'],
    comprehensionFormats: ['All previous','Character analysis (3 marks)','Conflict in extract (2 marks)','Theme with evidence (3 marks)'],
    languageQuestionTypes: ['All previous types','Identify sentence structure used for effect'],
    poetrySkills: ['Full literary analysis','Theme and message with extended response (4 marks)'],
  },
  'Term 4': {
    newSkills: ['Gr7 consolidation and exam preparation'],
    grammar: ['Full review of all Gr4–7 grammar'],
    writingTypes: ['all Gr4–7 types'],
    sectionTypes: ['Comprehension','Language Practice','Poetry Analysis','Visual Literacy','Summary'],
    textTypes: ['all types Gr4–7'],
    comprehensionFormats: ['All formats at Gr7 exam level'],
    languageQuestionTypes: ['Full review'],
    poetrySkills: ['Full analysis at Gr7 exam standard'],
  },
};

export const GRADE_8: Record<string, TermCurriculum> = {
  'Term 1': {
    newSkills: ['literary essay','critical reading (bias/fact/opinion)','connotation/denotation','argumentative essay'],
    grammar: ['all Gr4–7 grammar at senior phase level','Type 2 conditional (If I had money, I would buy it)','subjunctive mood','connotation vs denotation','nominalization (describe → description)','complex passive voice'],
    writingTypes: ['narrative essay','argumentative essay (full structure)','formal/informal letter','summary'],
    sectionTypes: ['Comprehension','Language Practice','Poetry Analysis','Visual Literacy','Summary','Transactional Writing'],
    textTypes: ['literary extract (novel/short story)','informational article','persuasive/argumentative text','visual text','poem (unseen)','transactional text'],
    comprehensionFormats: ['Multiple choice','TRUE/FALSE with evidence','Inference with textual proof','Vocabulary: denotation/connotation',"Author's tone/mood/style/purpose",'Visual literacy + relate to written text','Summary (4–6 sentences)','Identify fact vs opinion/bias','Extended response with argument (5–6 marks)'],
    languageQuestionTypes: ['All Gr4–7 types at Gr8 complexity','Explain effect of specific word choice in context','Explain connotation of word [X] in this context','Form nominalization: He decided → his __________','Rewrite using Type 2 conditional','Edit paragraph for multiple language errors','Explain what author achieves by using [language feature]'],
    poetrySkills: ['Full structural and language analysis','All devices: simile/metaphor/personification/alliteration/onomatopoeia/hyperbole/irony/paradox/contrast/symbol','How language choices create meaning (3–4 marks)',"Theme and poet's message (4 marks)",'Critical response: agree/disagree with interpretation (3 marks)'],
  },
  'Term 2': {
    newSkills: ['novel study (full work)','critical essay','advanced summary writing'],
    grammar: ['All Gr8 T1 grammar + further complex manipulation'],
    writingTypes: ['narrative','argumentative','literary essay (novel)','formal letter','summary'],
    sectionTypes: ['Comprehension','Language Practice','Poetry Analysis','Visual Literacy','Summary','Literary Essay'],
    textTypes: ['literary extract','informational','argumentative','visual text','poem','report/article'],
    comprehensionFormats: ['All T1 formats at higher complexity','Identify irony/satire (2–3 marks)','How does structure support purpose? (3 marks)'],
    languageQuestionTypes: ['All T1 types','Longer text editing (5+ errors)'],
    poetrySkills: ['All T1 poetry + comparative question (4 marks)'],
  },
  'Term 3': {
    newSkills: ['dramatic text','speech writing','formal report writing'],
    grammar: ['All previous','speech punctuation in plays','layout features of formal documents'],
    writingTypes: ['narrative','argumentative','literary essay','speech','formal report','summary'],
    sectionTypes: ['Comprehension','Language Practice','Poetry Analysis','Visual Literacy','Summary','Transactional Writing','Dramatic Text'],
    textTypes: ['all previous + dramatic extract (play script)','speech/debate text'],
    comprehensionFormats: ['All previous','Dramatic text: stage directions and purpose (2 marks)','How does dialogue reveal character? (3 marks)'],
    languageQuestionTypes: ['All previous at Gr8 exam standard'],
    poetrySkills: ['All previous at Gr8 exam standard'],
  },
  'Term 4': {
    newSkills: ['Gr8 consolidation and exam preparation'],
    grammar: ['Full review of all Gr4–8 grammar'],
    writingTypes: ['all types'],
    sectionTypes: ['Comprehension','Language Practice','Poetry Analysis','Visual Literacy','Summary','Transactional Writing'],
    textTypes: ['all types'],
    comprehensionFormats: ['All formats at Gr8 exam standard'],
    languageQuestionTypes: ['Full review'],
    poetrySkills: ['Full Gr8 analysis'],
  },
};

export const GRADE_9: Record<string, TermCurriculum> = {
  'Term 1': {
    newSkills: ['matric readiness','critical literary analysis','rhetoric devices','research-based writing'],
    grammar: ['all Gr4–8 grammar','Type 3 conditional (If I had known, I would have called)','subjunctive in formal writing','rhetoric devices: anaphora, tricolon, antithesis, rhetorical question','complex passive + perfect tenses (has been completed)','dangling participles'],
    writingTypes: ['literary essay','argumentative essay','expository essay','research essay','formal/transactional','summary','creative (narrative/descriptive/reflective)'],
    sectionTypes: ['Comprehension','Language Practice','Poetry Analysis','Visual Literacy','Summary','Literary Essay','Transactional Writing'],
    textTypes: ['literary extract (novel/drama/short story)','informational article','argumentative/persuasive text','visual text (infographic/graph/cartoon)','unseen poem','transactional text'],
    comprehensionFormats: ['Multiple choice','TRUE/FALSE with evidence','Inference with extended textual proof','Vocabulary: etymology/connotation/context',"Author's tone/style/purpose/audience",'Identify and evaluate rhetoric devices','Visual literacy: critically read and evaluate','Summary: synthesize texts (6–8 sentences)','Critical evaluation (6–7 marks)'],
    languageQuestionTypes: ['All Gr4–8 types at Gr9 complexity','Identify and explain rhetoric device in: [sentence]','Type 3 conditional: If she __________ (know), she __________ (call) him','Rewrite to improve style: [awkward sentence]','Identify and correct dangling participle: [sentence]','Explain why author chose [word/phrase]: [sentence]','Edit paragraph for grammar, style, and coherence'],
    poetrySkills: ['Full analysis at Gr9/matric prep level','All devices + explain effect on meaning','Critical analysis of tone/mood/atmosphere (4 marks)','Theme/message/social context (4–5 marks)',"Extended critical response: evaluate poet's success (5 marks)",'Comparative analysis: compare this poem to [another]'],
  },
  'Term 2': {
    newSkills: ['drama study (full work)','advanced visual literacy','media literacy'],
    grammar: ['All Gr9 T1 at higher application'],
    writingTypes: ['all types at Gr9 matric prep level'],
    sectionTypes: ['Comprehension','Language Practice','Poetry Analysis','Visual Literacy','Summary','Literary Essay','Transactional Writing','Dramatic Text'],
    textTypes: ['all types + media text (infographic/social media post/news headline)'],
    comprehensionFormats: ['All formats + media literacy: identify techniques to influence audience (3 marks)'],
    languageQuestionTypes: ['All previous at highest complexity'],
    poetrySkills: ['All previous + comparative essay (two unseen poems) (8–10 marks)'],
  },
  'Term 3': {
    newSkills: ['matric exam preparation','past paper practice'],
    grammar: ['Full consolidation Gr4–9'],
    writingTypes: ['all at matric prep standard'],
    sectionTypes: ['Comprehension','Language Practice','Poetry Analysis','Visual Literacy','Summary','Literary Essay','Transactional Writing'],
    textTypes: ['all types at matric prep level'],
    comprehensionFormats: ['Full matric prep level'],
    languageQuestionTypes: ['Full consolidation'],
    poetrySkills: ['Full matric prep level'],
  },
  'Term 4': {
    newSkills: ['final exam preparation'],
    grammar: ['Full review'],
    writingTypes: ['all types'],
    sectionTypes: ['Comprehension','Language Practice','Poetry Analysis','Visual Literacy','Summary','Literary Essay','Transactional Writing'],
    textTypes: ['all types'],
    comprehensionFormats: ['All formats at Gr9 exam standard'],
    languageQuestionTypes: ['Full review'],
    poetrySkills: ['Full Gr9 analysis'],
  },
};

export const CURRICULUM: Record<number, Record<string, TermCurriculum>> = { 4: GRADE_4, 5: GRADE_5, 6: GRADE_6, 7: GRADE_7, 8: GRADE_8, 9: GRADE_9 };

export function getCurriculum(grade: number, term: string): TermCurriculum {
  const g = CURRICULUM[grade] ?? CURRICULUM[4];
  return g[term] ?? g['Term 1'];
}
