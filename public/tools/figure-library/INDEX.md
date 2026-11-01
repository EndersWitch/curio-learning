# Figure library

422 ready-made figures, each an SVG. `file` is the path under `public`; `open` is the address of the generator with that figure's settings (change them and render again).

Search: `grep -i "pie chart" public/tools/figure-library/INDEX.md`


## biology / dna-protein-synthesis

- **Coding strand with bases before the start codon and a stop codon** — Rows of base boxes for a 24-base DNA coding strand 5′ GCCA ATG GTT CAC TGG AAA TAA GC 3′, its template strand, the mRNA, the tRNA anticodons and the amino acids, with brackets under each codon of the mRNA from AUG to the stop codon UAA: Met, Val, His, Trp and Lys as a chain of beads, then Stop, and no amino acids under the four bases before AUG or the two after UAA  
  file: `public/tools/figure-library/biology/dna-protein-synthesis/coding-strand-start-codon-stop-codon-leader-bases.svg`  
  open: `/tools/figures/biology/dna-protein-synthesis?seq=GCCAATGGTTCACTGGAAATAAGC&typed=coding&brackets=1`
- **Codon chart: the standard genetic code table** — A square codon chart with the first base U, C, A, G down the left, the second base across the top and the third base down the right, each of the 16 cells listing four codons with their amino acids, AUG Met (Start) and the stop codons UAA, UAG and UGA in bold on gray  
  file: `public/tools/figure-library/biology/dna-protein-synthesis/codon-chart-genetic-code-table-start-stop-codons.svg`  
  open: `/tools/figures/biology/dna-protein-synthesis?show=chart`
- **DNA complementary strand worksheet: draw the other half** — A DNA coding strand 5′ ATG CGT ACC TTA GGC ATA 3′ in boxes, with a row of 18 empty boxes under it labeled DNA template strand, running 3′ to 5′, for students to write the complementary bases in  
  file: `public/tools/figure-library/biology/dna-protein-synthesis/dna-complementary-strand-worksheet-draw-the-other-half.svg`  
  open: `/tools/figures/biology/dna-protein-synthesis?seq=ATGCGTACCTTAGGCATA&typed=coding&template=blank&mrna=off&trna=off&amino=off`
- **Transcription multiple choice: spot the wrong base pairing in the mRNA** — Answer choice B: the DNA coding strand 5′ ATG CCT AAG TTC GGC 3′, the template strand 3′ TAC GGA TTC AAG CCG 5′ and an mRNA row 5′ AUG CCU CAG UUC GGC 3′, where the seventh base, C, does not pair with the T above it  
  file: `public/tools/figure-library/biology/dna-protein-synthesis/transcription-multiple-choice-mrna-wrong-base-pairing.svg`  
  open: `/tools/figures/biology/dna-protein-synthesis?trna=off&amino=off&mistakes=1&mistakeSeed=7&titleMode=text&title=B.`
- **Transcription and translation from a template strand starting TAC** — Five rows of base boxes lined up base under base, each with its 5′ and 3′ ends: the DNA coding strand 5′ ATG CCT AAG TTC GGC 3′, the DNA template strand 3′ TAC GGA TTC AAG CCG 5′, the mRNA 5′ AUG CCU AAG UUC GGC 3′, the tRNA anticodons UAC GGA UUC AAG CCG, and a chain of amino acid beads Met, Pro, Lys, Phe and Gly, one under each codon  
  file: `public/tools/figure-library/biology/dna-protein-synthesis/transcription-translation-template-strand-tac-mrna-trna-amino-acids.svg`  
  open: `/tools/figures/biology/dna-protein-synthesis`

## biology / enzyme-activity

- **Competitive and non-competitive inhibitor graph (rate against substrate concentration)** — Graph of rate of reaction against substrate concentration with no numbers on the axes: three curves rising and levelling off, no inhibitor (solid blue), a competitive inhibitor (dashed red) reaching the same Vmax more slowly, and a non-competitive inhibitor (dotted green) levelling off at a lower Vmax, with dashed Vmax lines labeled Vmax and Vmax (non-competitive) at the y-axis and a key under the graph  
  file: `public/tools/figure-library/biology/enzyme-activity/competitive-non-competitive-inhibitor-graph-michaelis-menten.svg`  
  open: `/tools/figures/biology/enzyme-activity?graph=substrate&show2=1&show3=1&xTitle=Substrate+concentration`
- **Enzyme activity against pH: pepsin, amylase and trypsin** — Graph of rate of reaction against pH with no numbers on the axes: three bell-shaped curves, pepsin (solid blue) peaking at pH 2, salivary amylase (dashed red) at pH 7 and trypsin (dotted green) at pH 8, each peak marked with a dot, a dashed line down to the pH axis and the label Optimum, and a key under the graph  
  file: `public/tools/figure-library/biology/enzyme-activity/enzyme-activity-ph-graph-pepsin-amylase-trypsin.svg`  
  open: `/tools/figures/biology/enzyme-activity?graph=ph&enzyme1=pepsin&show2=1&enzyme2=amylase&show3=1&enzyme3=trypsin&xTitle=pH`
- **Enzyme activity against temperature: human enzyme and Taq polymerase** — Graph of rate of reaction against temperature (°C) with no numbers on the axes: a solid blue curve for a human enzyme and a dashed red curve for Taq polymerase, each rising slowly to an optimum marked with a dot and a dashed line, labeled Optimum, then falling steeply to a dot on the axis labeled Denatured  
  file: `public/tools/figure-library/biology/enzyme-activity/enzyme-activity-temperature-graph-human-enzyme-taq-polymerase.svg`  
  open: `/tools/figures/biology/enzyme-activity?show2=1&markDen=1`
- **Enzyme and temperature graph worksheet: label the optimum and denaturation** — Black and white graph of rate of reaction against temperature (°C) with no numbers on the axes: one curve rising to a peak and falling steeply to the axis, a dot on the peak with a dashed line down and a dot where the curve meets the axis, each with a blank line for students to label  
  file: `public/tools/figure-library/biology/enzyme-activity/enzyme-temperature-graph-worksheet-label-optimum-denatured.svg`  
  open: `/tools/figures/biology/enzyme-activity?markDen=1&optLabelMode=blank&denLabelMode=blank&color=0`
- **Michaelis–Menten graph with Vmax, ½Vmax and Km** — Graph of rate of reaction against substrate concentration with no numbers on the axes: one curve rising steeply and levelling off under a dashed line labeled Vmax, with a dot at half that height joined by dashed lines to the y-axis, labeled ½Vmax, and down to the x-axis, labeled Km  
  file: `public/tools/figure-library/biology/enzyme-activity/michaelis-menten-graph-vmax-km.svg`  
  open: `/tools/figures/biology/enzyme-activity?graph=substrate&markKm=1&xTitle=Substrate+concentration`

## biology / gel-electrophoresis

- **DNA fingerprinting gel: crime scene and three suspects** — A glowing agarose gel with five lanes labeled Ladder, Crime scene, Suspect 1, Suspect 2 and Suspect 3; the 1 kb ladder is labeled from 10,000 bp down to 500 bp, and each other lane has four bands  
  file: `public/tools/figure-library/biology/gel-electrophoresis/dna-fingerprinting-gel-crime-scene-suspects.svg`  
  open: `/tools/figures/biology/gel-electrophoresis?look=glow`
- **Lambda DNA restriction digest gel with a ruler for a standard curve** — A 0.8% agarose gel with four lanes labeled Ladder, Uncut, EcoRI and BamHI, the λ DNA / HindIII ladder labeled from 23.1 kb to 0.125 kb, and a centimeter ruler beside the gel from 0 to 8 cm  
  file: `public/tools/figure-library/biology/gel-electrophoresis/lambda-dna-restriction-digest-gel-ruler-standard-curve.svg`  
  open: `/tools/figures/biology/gel-electrophoresis?lanes=%5B%7B%22type%22%3A%22ladder%22%2C%22id%22%3A1%2C%22label%22%3A%22Ladder%22%2C%22ladder%22%3A%22lambda%22%7D%2C%7B%22type%22%3A%22sample%22%2C%22id%22%3A2%2C%22label%22%3A%22Uncut%22%2C%22bands%22%3A%2248502+x8%22%7D%2C%7B%22type%22%3A%22sample%22%2C%22id%22%3A3%2C%22label%22%3A%22EcoRI%22%2C%22bands%22%3A%2221226+x3.5%2C+7421+x1.2%2C+5804%2C+5643%2C+4878+x0.8%2C+3530+x0.6%22%7D%2C%7B%22type%22%3A%22sample%22%2C%22id%22%3A4%2C%22label%22%3A%22BamHI%22%2C%22bands%22%3A%2216841+x2.7%2C+7233+x1.2%2C+6770+x1.1%2C+6527+x1.1%2C+5626+x0.9%2C+5505+x0.9%22%7D%5D&gel=0.8&sizeUnits=kb&ruler=1`
- **Paternity test gel: mother, child and two possible fathers** — A pale blue agarose gel with blue bands in five lanes labeled Ladder, Mother, Child, Father 1 and Father 2; the 1 kb ladder is labeled from 10,000 bp to 500 bp, and each other lane has four bands  
  file: `public/tools/figure-library/biology/gel-electrophoresis/paternity-test-gel-electrophoresis-mother-child-two-fathers.svg`  
  open: `/tools/figures/biology/gel-electrophoresis?lanes=%5B%7B%22type%22%3A%22ladder%22%2C%22id%22%3A1%2C%22label%22%3A%22Ladder%22%2C%22ladder%22%3A%221kb%22%7D%2C%7B%22type%22%3A%22sample%22%2C%22id%22%3A2%2C%22label%22%3A%22Mother%22%2C%22bands%22%3A%224800%2C+2900%2C+1600%2C+800%22%7D%2C%7B%22type%22%3A%22sample%22%2C%22id%22%3A3%2C%22label%22%3A%22Child%22%2C%22bands%22%3A%224800%2C+3200%2C+1600%2C+650%22%7D%2C%7B%22type%22%3A%22sample%22%2C%22id%22%3A4%2C%22label%22%3A%22Father+1%22%2C%22bands%22%3A%225600%2C+3500%2C+2200%2C+1100%22%7D%2C%7B%22type%22%3A%22sample%22%2C%22id%22%3A5%2C%22label%22%3A%22Father+2%22%2C%22bands%22%3A%224400%2C+3200%2C+1900%2C+650%22%7D%5D&look=blue`
- **Plasmid restriction digest gel worksheet: draw the double digest** — A 1% agarose gel with four lanes labeled Ladder, EcoRI, HindIII and Both; blank lines beside the ladder’s ten bands, empty circles at both ends for the electrodes, and the Both lane left empty  
  file: `public/tools/figure-library/biology/gel-electrophoresis/plasmid-restriction-digest-gel-worksheet-draw-the-bands.svg`  
  open: `/tools/figures/biology/gel-electrophoresis?lanes=%5B%7B%22type%22%3A%22ladder%22%2C%22id%22%3A1%2C%22label%22%3A%22Ladder%22%2C%22ladder%22%3A%221kb%22%7D%2C%7B%22type%22%3A%22sample%22%2C%22id%22%3A2%2C%22label%22%3A%22EcoRI%22%2C%22bands%22%3A%225000%22%7D%2C%7B%22type%22%3A%22sample%22%2C%22id%22%3A3%2C%22label%22%3A%22HindIII%22%2C%22bands%22%3A%223200%2C+1800%22%7D%2C%7B%22type%22%3A%22sample%22%2C%22id%22%3A4%2C%22label%22%3A%22Both%22%2C%22bands%22%3A%22%22%7D%5D&sizeLabels=blank&electrodes=blank`
- **PTC taster gene PCR and HaeIII digest gel with a 100 bp ladder** — A 2% agarose gel with five numbered lanes labeled Ladder, Uncut, TT, Tt and tt; the 100 bp ladder is labeled from 1517 bp down to 100 bp, the uncut and tt lanes have one band, TT has two and Tt has three  
  file: `public/tools/figure-library/biology/gel-electrophoresis/ptc-taster-gene-pcr-gel-haeiii-100-bp-ladder.svg`  
  open: `/tools/figures/biology/gel-electrophoresis?lanes=%5B%7B%22type%22%3A%22ladder%22%2C%22id%22%3A1%2C%22label%22%3A%22Ladder%22%2C%22ladder%22%3A%22100bp%22%7D%2C%7B%22type%22%3A%22sample%22%2C%22id%22%3A2%2C%22label%22%3A%22Uncut%22%2C%22bands%22%3A%22221%22%7D%2C%7B%22type%22%3A%22sample%22%2C%22id%22%3A3%2C%22label%22%3A%22TT%22%2C%22bands%22%3A%22177%2C+44+x0.3%22%7D%2C%7B%22type%22%3A%22sample%22%2C%22id%22%3A4%2C%22label%22%3A%22Tt%22%2C%22bands%22%3A%22221%2C+177%2C+44+x0.3%22%7D%2C%7B%22type%22%3A%22sample%22%2C%22id%22%3A5%2C%22label%22%3A%22tt%22%2C%22bands%22%3A%22221%22%7D%5D&gel=2&laneNumbers=1`

## biology / micropipette-reading

- **Black and white P10 micropipette set to 4.6 µL** — A black and white outline drawing of a 10 µL micropipette with no tip, its volume display reading 0, 4, 6 from top to bottom with a line above the 6  
  file: `public/tools/figure-library/biology/micropipette-reading/p10-micropipette-black-and-white-4-6-ul.svg`  
  open: `/tools/figures/biology/micropipette-reading?model=P10&volume=4.6&tip=0&color=0`
- **P1000 micropipette set to 820 µL** — A 1000 µL micropipette with a wide shaft and a blue tip, its volume display reading 0, 8, 2, 0 from the top  
  file: `public/tools/figure-library/biology/micropipette-reading/p1000-micropipette-reading-820-ul.svg`  
  open: `/tools/figures/biology/micropipette-reading?model=P1000&volume=820`
- **P2 micropipette set to 0.85 µL** — A 2 µL micropipette with a slim shaft and a clear tip, its volume display reading 0, 8, 5 from top to bottom, the 8 and 5 in red below a line  
  file: `public/tools/figure-library/biology/micropipette-reading/p2-micropipette-reading-0-85-ul.svg`  
  open: `/tools/figures/biology/micropipette-reading?model=P2&volume=0.85`
- **P20 micropipette set to 15.7 µL** — A 20 µL micropipette with a yellow tip, its volume display reading 1, 5, 7 from top to bottom, the 7 in red below a line  
  file: `public/tools/figure-library/biology/micropipette-reading/p20-micropipette-reading-15-7-ul.svg`  
  open: `/tools/figures/biology/micropipette-reading?volume=15.7`
- **P200 micropipette set to 154 µL** — A 200 µL micropipette with a yellow tip, its volume display reading 1, 5, 4 from top to bottom, all in black  
  file: `public/tools/figure-library/biology/micropipette-reading/p200-micropipette-reading-154-ul.svg`  
  open: `/tools/figures/biology/micropipette-reading?model=P200&volume=154`

## biology / osmosis

- **AP Biology dialysis tubing bag with glucose and starch** — A dialysis tubing bag tied to a rod, in a beaker of pure water, holding white glucose particles and a dark starch particle among blue water particles; water arrows point into the bag and a dashed arrow labeled glucose points out of it; then an arrow to the same bag swollen larger, with glucose particles now on both sides and the starch still inside  
  file: `public/tools/figure-library/biology/osmosis/ap-biology-dialysis-tubing-bag-glucose-starch.svg`  
  open: `/tools/figures/biology/osmosis?scene=bag&view=both&on1=0&on2=1&in2=15&on3=1&in3=3`
- **Plant cell plasmolysis in a strong sugar solution** — A plant cell with a nucleus and chloroplasts, its cell wall, vacuole and cell membrane labeled down the left, in a box crowded with gray sucrose particles, with water arrows pointing out across the wall, labeled Hypertonic solution, then an arrow to the same cell plasmolyzed, its membrane and cytoplasm pulled away from the wall into a rounded shape around a small vacuole, with the sugar solution filling the gap  
  file: `public/tools/figure-library/biology/osmosis/plant-cell-plasmolysis-hypertonic-sugar-solution.svg`  
  open: `/tools/figures/biology/osmosis?scene=plant&view=both&name1=sucrose&in1=5&out1=30&partsMode=text`
- **Red blood cell in 0.9% saline: isotonic, no net movement** — A red blood cell with gray NaCl particles inside in a box of 0.9% NaCl solution with as many particles per space, water arrows going both ways across the membrane labeled No net movement, labeled Isotonic solution, then an arrow to the same normal disc-shaped cell  
  file: `public/tools/figure-library/biology/osmosis/red-blood-cell-in-isotonic-saline-0-9-percent.svg`  
  open: `/tools/figures/biology/osmosis?view=both&out1=0.9`
- **Red blood cell in pure water: hypotonic, swells and bursts** — A red blood cell with a few gray NaCl particles inside, in a box of pure water full of blue water particles, with water arrows pointing into the cell, labeled Hypotonic solution, then an arrow to the same cell swollen and burst open, its membrane torn, labeled Bursts (lysed)  
  file: `public/tools/figure-library/biology/osmosis/red-blood-cell-in-pure-water-hypotonic-bursts.svg`  
  open: `/tools/figures/biology/osmosis?view=both&out1=0&burst=1`
- **Red blood cell in 5% salt solution: hypertonic, shrinks and crenates** — A red blood cell with a few gray NaCl particles inside, in a box crowded with NaCl particles, with water arrows pointing out of the cell, labeled Hypertonic solution, then an arrow to the same cell shrunken with spiky edges, labeled Shrinks (crenated)  
  file: `public/tools/figure-library/biology/osmosis/red-blood-cell-in-salt-solution-hypertonic-crenated.svg`  
  open: `/tools/figures/biology/osmosis?view=both`
- **Red blood cells in hypotonic, isotonic and hypertonic solutions** — Three red blood cells, each in a box of salt solution with gray NaCl particles and blue water particles: A in a hypotonic 0.45% solution, swollen round, with water arrows pointing in; B in an isotonic 0.9% solution, a normal disc with arrows both ways and the words No net movement; C in a hypertonic 1.8% solution, shrunken with spiky edges, with water arrows pointing out  
  file: `public/tools/figure-library/biology/osmosis/red-blood-cells-hypotonic-isotonic-hypertonic-solutions.svg`  
  open: `/tools/figures/biology/osmosis`
- **U-tube osmosis: sucrose solution and water, before and after** — A U-tube with a selectively permeable membrane at the bottom: side A holds 10% sucrose with gray sucrose particles and fewer blue water particles, side B holds pure water, the levels equal, with a water arrow from side B across the membrane to side A; then an arrow to the same U-tube with the level higher on side A and lower on side B  
  file: `public/tools/figure-library/biology/osmosis/u-tube-osmosis-sucrose-and-water-before-and-after.svg`  
  open: `/tools/figures/biology/osmosis?scene=utube&view=both&name1=sucrose&in1=10&out1=0`

## biology / pedigree

- **Red–green color blindness pedigree with X-linked genotypes** — A three-generation pedigree titled Red–green color blindness, with an affected grandfather, carrier daughters drawn with a center dot, two affected grandsons, and each person’s genotype written on X and Y with B or b as a superscript  
  file: `public/tools/figure-library/biology/pedigree/color-blindness-pedigree-x-linked-genotypes-carriers.svg`  
  open: `/tools/figures/biology/pedigree?mode=xr&family=M-f3fc-m3Mmfcm-f2mffc-m2fM&carriers=dot&genotypes=answers&letter=B&titleMode=text&title=Red%E2%80%93green+color+blindness`
- **Cystic fibrosis pedigree with blank genotypes (autosomal recessive)** — A three-generation pedigree titled Cystic fibrosis, with two affected daughters, II-3 and III-4, both born to unaffected parents, and a blank line under each of the 13 people for a genotype  
  file: `public/tools/figure-library/biology/pedigree/cystic-fibrosis-pedigree-autosomal-recessive-genotype-worksheet.svg`  
  open: `/tools/figures/biology/pedigree?family=mc-fc4mc-f2mfFmfc-mc3mFmc&genotypes=blank&letter=F&titleMode=text&title=Cystic+fibrosis`
- **Hemophilia pedigree: X-linked recessive in a royal family** — A four-generation pedigree titled Hemophilia in a royal family, with a half-filled carrier woman in generation I, seven affected men across generations II to IV, six more half-filled carrier women, deceased slashes, a proband arrow at IV-5 and a key  
  file: `public/tools/figure-library/biology/pedigree/hemophilia-pedigree-royal-family-x-linked-recessive-carriers.svg`  
  open: `/tools/figures/biology/pedigree?mode=xr&family=m-fc4mfc-m3fc-m2MdmMdfc-m3ffMpMd-f1fc-m2Mdmfc-m2fc-m3MdmfMd&carriers=half&letter=H&titleMode=text&title=Hemophilia+in+a+royal+family`
- **Huntington’s disease pedigree with genotypes (autosomal dominant)** — A three-generation pedigree titled Huntington’s disease, with an affected deceased man in generation I, affected people in every generation, Hh or hh written under each person, a key, and the answer key line  
  file: `public/tools/figure-library/biology/pedigree/huntingtons-disease-pedigree-autosomal-dominant-genotypes.svg`  
  open: `/tools/figures/biology/pedigree?mode=ad&family=Md-f4F-m3MfFm-f2fmM-f3Mfmf&genotypes=answers&letter=H&titleMode=text&title=Huntington%E2%80%99s+disease&answerKey=1`
- **Y-linked pedigree: a random family over 3 generations** — A three-generation pedigree of 18 people in which only I-1, his son II-2 and II-2’s sons III-1 and III-2 are affected, all men, with a key  
  file: `public/tools/figure-library/biology/pedigree/y-linked-pedigree-father-to-son.svg`  
  open: `/tools/figures/biology/pedigree?mode=y&seed=2`

## biology / photosynthesis-rate

- **CO₂ and O₂ concentration around a plant in the light and then the dark** — Graph against time in minutes, 0 to 60, on a grid, with CO₂ concentration (%) on the left axis and O₂ concentration (%) on the right: in the first 30 minutes, unshaded and labeled Light, the solid blue CO₂ line falls from 0.04 % toward 0.01 % while the dashed red O₂ line rises from 21 % to about 21.03 %; in the shaded half labeled Dark, CO₂ rises and O₂ falls in straight lines  
  file: `public/tools/figure-library/biology/photosynthesis-rate/co2-and-o2-concentration-over-time-light-and-dark.svg`  
  open: `/tools/figures/biology/photosynthesis-rate?graph=gases&show2=0&show3=0&lightsOff=1&gridlines=1&axes=numbered&xTitle=Time+%28minutes%29&yTitle=CO%E2%82%82+concentration+%28%25%29`
- **CO₂ concentration in a closed chamber in the dark, dim and bright light** — Graph of CO₂ concentration (%) against time (minutes) with no numbers on the axes: from one starting point, a solid blue line labeled Dark rises steadily, a dashed red line labeled Dim light (compensation point) stays level, and a dotted green line labeled Bright light falls and levels off near the bottom, with a key under the graph  
  file: `public/tools/figure-library/biology/photosynthesis-rate/co2-concentration-closed-chamber-dark-dim-bright-light.svg`  
  open: `/tools/figures/biology/photosynthesis-rate?graph=chamber&name1=Dark&light1=0&name2=Dim+light+%28compensation+point%29&light2=6.01&temp2=25&name3=Bright+light&light3=60&temp3=25&xTitle=Time+%28minutes%29&yTitle=CO%E2%82%82+concentration+%28%25%29`
- **Limiting factors in photosynthesis: rate against light intensity at different CO₂ and temperatures** — Graph of rate of photosynthesis against light intensity with no numbers on the axes: three curves rising together in a straight line, labeled Light is limiting, then levelling off at different heights, 0.1 % CO₂ at 25 °C (solid blue) highest, 0.1 % CO₂ at 15 °C (dashed red) lower and 0.04 % CO₂ at 15 °C (dotted green) lowest, with CO₂ or temperature is limiting written over the top plateau and a key under the graph  
  file: `public/tools/figure-library/biology/photosynthesis-rate/limiting-factors-photosynthesis-graph-light-intensity-co2-temperature.svg`  
  open: `/tools/figures/biology/photosynthesis-rate?markLimit=1`
- **Limiting factors worksheet: what limits the rate of photosynthesis at A, B, C and D?** — Black and white graph of rate of photosynthesis against light intensity with no numbers on the axes: a solid, a dashed and a dotted curve rising together and levelling off at three heights, with point A on the shared straight rise and points B, C and D on the three plateaus at the same light intensity, and a key naming 0.1 % CO₂ at 25 °C, 0.1 % CO₂ at 15 °C and 0.04 % CO₂ at 15 °C  
  file: `public/tools/figure-library/biology/photosynthesis-rate/limiting-factors-worksheet-lettered-points-black-and-white.svg`  
  open: `/tools/figures/biology/photosynthesis-rate?letters=1&color=0`
- **Pondweed and lamp distance: bubbles of oxygen per minute against distance from the lamp** — Graph of bubbles of oxygen per minute, 0 to 35, against distance from the lamp, 0 to 50 cm, on a grid: measured points scattered along a curve that stays level at about 27 bubbles a minute up to about 19 cm from the lamp, then falls, steeply at first and then more slowly, to about 4 bubbles a minute at 50 cm  
  file: `public/tools/figure-library/biology/photosynthesis-rate/pondweed-lamp-distance-bubbles-per-minute-graph.svg`  
  open: `/tools/figures/biology/photosynthesis-rate?temp1=20&show2=0&show3=0&lightAxis=distance&rateUnit=bubbles&points=on&seed=3&gridlines=1&axes=numbered&xTitle=Distance+from+lamp+%28cm%29&yTitle=Bubbles+of+oxygen+per+minute`
- **Rate of photosynthesis against CO₂ concentration at high and low light intensity** — Graph of rate of photosynthesis against CO₂ concentration (%) with no numbers on the axes: two curves rising together, the dashed red low light intensity curve levelling off early and low and the solid blue high light intensity curve rising further and levelling off about twice as high, with a key under the graph  
  file: `public/tools/figure-library/biology/photosynthesis-rate/rate-of-photosynthesis-against-co2-concentration-two-light-intensities.svg`  
  open: `/tools/figures/biology/photosynthesis-rate?graph=co2&name1=High+light+intensity&name2=Low+light+intensity&light2=30&temp2=25&show3=0&xTitle=CO%E2%82%82+concentration+%28%25%29`
- **Rate of photosynthesis against temperature at high and low light intensity** — Graph of rate of photosynthesis against temperature (°C) with no numbers on the axes: a solid blue high light intensity curve rising to a peak marked Optimum with a dot and a dashed line down to the axis, then falling steeply to zero, and a dashed red low light intensity curve with a low flat top that follows it down at both ends  
  file: `public/tools/figure-library/biology/photosynthesis-rate/rate-of-photosynthesis-against-temperature-high-low-light.svg`  
  open: `/tools/figures/biology/photosynthesis-rate?graph=temperature&name1=High+light+intensity&light1=80&name2=Low+light+intensity&light2=15&show3=0&xTitle=Temperature+%28%C2%B0C%29`

## biology / population-growth

- **Blank population growth graph for students to draw on** — Blank graph of population size (N) from 0 to 1100 against time in years from 0 to 20, with only a dashed line at 1000 labeled Carrying capacity (K)  
  file: `public/tools/figure-library/biology/population-growth/blank-population-growth-graph-worksheet.svg`  
  open: `/tools/figures/biology/population-growth?curve=0`
- **Exponential vs. logistic growth graph (J-curve and S-curve)** — Graph of population size over 20 years with a dashed red J-shaped curve labeled Exponential growth running off the top and a blue S-shaped curve labeled Logistic growth leveling off at a dashed carrying capacity line at 1000  
  file: `public/tools/figure-library/biology/population-growth/exponential-vs-logistic-growth-j-curve-s-curve.svg`  
  open: `/tools/figures/biology/population-growth?model=both&n0=10&yTo=1300`
- **Growth rate and per capita growth rate vs. population size** — Two stacked graphs against population size N from 0 to 1100: the growth rate dN/dt as a hump peaking at 125 individuals per year at N = 500, labeled Fastest growth (N = K/2), and the per capita growth rate falling in a straight line from 0.5 to 0, with a dashed carrying capacity line at 1000 on both  
  file: `public/tools/figure-library/biology/population-growth/growth-rate-and-per-capita-growth-rate-vs-population-size.svg`  
  open: `/tools/figures/biology/population-growth?n0=10&graphs=rate-percapita-n&inflection=1&xTo=1100&xStep=50&yTo=160&yStep=20&y2To=0.7&y2Step=0.1`
- **Logistic growth curve with carrying capacity (S-curve)** — S-shaped logistic growth curve of a deer population rising from 20 and leveling off at a dashed carrying capacity line at 500, labeled Carrying capacity (K), with the inflection point at 250 deer marked by a dot  
  file: `public/tools/figure-library/biology/population-growth/logistic-growth-curve-carrying-capacity-s-curve.svg`  
  open: `/tools/figures/biology/population-growth?r=0.4&k=500&span=30&organism=deer&inflection=1&nTitle=Number+of+deer&rateTitle=Growth+rate+%28deer%2Fyear%29&xTo=30&xStep=2&yTo=550&yStep=50`
- **Yeast population growth curve with census data and growth phases** — Logistic growth curve of yeast cells in thousands over 18 hours with hourly census dots scattered near it, a dashed carrying capacity line at 665, and brackets above labeled Lag phase, Exponential phase and Stationary phase  
  file: `public/tools/figure-library/biology/population-growth/yeast-population-growth-curve-census-data-phases.svg`  
  open: `/tools/figures/biology/population-growth?n0=10&r=0.54&k=665&span=18&unit=hours&organism=yeast+cells&census=1&noise=5&seed=5&phases=1&timeTitle=Time+%28hours%29&nTitle=Yeast+cells+%28thousands%29&rateTitle=Growth+rate+%28yeast+cells%2Fhour%29&pcTitle=Per+capita+growth+rate+%28per+hour%29&xTo=18&yTo=800`

## biology / predator-prey

- **Hare and lynx census data graph** — Graph of yearly census counts of hares (blue dots joined by a solid line) and lynx (red open squares joined by a dashed line), in thousands, over 40 years, rising and falling in four uneven cycles  
  file: `public/tools/figure-library/biology/predator-prey/hare-lynx-population-census-data-graph.svg`  
  open: `/tools/figures/biology/predator-prey?data=census&seed=4`
- **Snowshoe hare and lynx population graph with lag and period** — Graph of snowshoe hare and Canada lynx populations in thousands over 40 years, hares a solid blue line and lynx a dashed red line, each peak marked with a dot and a dotted line, with arrows labeled “Lag: 1.6 years” and “Period: 10 years”  
  file: `public/tools/figure-library/biology/predator-prey/hare-lynx-predator-prey-graph-lag-period.svg`  
  open: `/tools/figures/biology/predator-prey?peaks=1&lag=1&cycle=1`
- **Moose and wolf population cycles graph (Isle Royale)** — Graph of moose (solid blue line, left axis 0 to 1800) and wolves (dashed red line, right axis 0 to 45) over 90 years, three cycles, each peak marked with a dot and a dotted line down to the time axis  
  file: `public/tools/figure-library/biology/predator-prey/moose-wolf-isle-royale-population-cycles-graph.svg`  
  open: `/tools/figures/biology/predator-prey?preyName=Moose&predatorName=Wolves&prey=600&predators=20&preyAverage=1000&predatorAverage=25&period=30&alpha=0.214&beta=0.00857&gamma=0.214&delta=0.000214&span=90&scale=two&peaks=1&y2Title=Wolves&pxTitle=Moose&pyTitle=Wolves&yTitle=Moose`
- **Predator–prey graph worksheet: find the lag and period** — Black and white graph of rabbits (solid line, left axis 0 to 1000) and foxes (dashed line, right axis 0 to 100) over 20 years, with arrows labeled “Lag:” and “Period:” followed by blank lines  
  file: `public/tools/figure-library/biology/predator-prey/predator-prey-graph-worksheet-lag-period-rabbit-fox.svg`  
  open: `/tools/figures/biology/predator-prey?preyName=Rabbits&predatorName=Foxes&prey=200&predators=30&preyAverage=400&predatorAverage=40&period=5&alpha=1.31&beta=0.0326&gamma=1.31&delta=0.00326&span=20&every=0.5&scale=two&lag=1&cycle=1&markLabels=blank&color=0&y2Title=Foxes&pxTitle=Rabbits&pyTitle=Foxes&yTitle=Rabbits`
- **Predator–prey phase plane: lynx against hares** — Phase plane graph with hares (thousands) on the x-axis and lynx (thousands) on the y-axis: a closed blue loop with four arrows going round it counterclockwise  
  file: `public/tools/figure-library/biology/predator-prey/predator-prey-phase-plane-hare-lynx.svg`  
  open: `/tools/figures/biology/predator-prey?view=phase`

## biology / punnett-square

- **Blank ABO blood type Punnett square worksheet (codominance)** — A blank Punnett square under a question about blood type, with Mother Iᴬi across the top and Father Iᴮi down the side, gametes Iᴬ and i and Iᴮ and i, four empty cells, and blank lines for the genotype and phenotype ratios  
  file: `public/tools/figure-library/biology/punnett-square/abo-blood-type-punnett-square-worksheet-blank.svg`  
  open: `/tools/figures/biology/punnett-square?dominance=codominance&parents=I%5EA+i+%C3%97+I%5EB+i&names=I%5EA%3Atype+A%3BI%5EA%2BI%5EB%3Atype+AB%3BI%5EB%3Atype+B%3Bi%3Atype+O&parentLabels=mother&cells=blank&genotypeRatio=blank&phenotypeRatio=blank&question=A+mother+with+type+A+blood+and+a+father+with+type+B+blood+each+carry+the+allele+for+type+O.+Complete+the+Punnett+square+and+give+the+ratios.`
- **Color blindness Punnett square: X-linked cross of a carrier mother** — An X-linked Punnett square crossing ♀ XᴮXᵇ × ♂ XᴮY, with gametes Xᴮ and Xᵇ across the top and Xᴮ and Y down the side, offspring XᴮXᴮ, XᴮXᵇ, XᴮY and XᵇY, the color-blind cell shaded gray, and percentages for genotypes, daughters and sons below  
  file: `public/tools/figure-library/biology/punnett-square/color-blindness-punnett-square-x-linked-cross.svg`  
  open: `/tools/figures/biology/punnett-square?cross=x-linked&parents=X%5EB+X%5Eb+%C3%97+X%5EB+Y&names=X%5EB%3Anormal+vision%3BX%5Eb%3Acolor-blind&parentLabels=sex&shade=X%5Eb&form=percent`
- **Dihybrid cross Punnett square: RrYy × RrYy** — A 4 by 4 Punnett square crossing RrYy × RrYy with gametes RY, Ry, rY and ry on each side, 16 offspring genotypes shaded by phenotype, a key for round yellow, round green, wrinkled yellow and wrinkled green, and the genotype and phenotype ratios below  
  file: `public/tools/figure-library/biology/punnett-square/dihybrid-cross-punnett-square-rryy-x-rryy.svg`  
  open: `/tools/figures/biology/punnett-square?cross=dihybrid&parents=RrYy+%C3%97+RrYy&names=R%3Around%3Br%3Awrinkled%3BY%3Ayellow%3By%3Agreen&shade=each`
- **Incomplete dominance Punnett square: snapdragon flower color** — A Punnett square crossing two pink snapdragons, CᴿCᵂ × CᴿCᵂ, with offspring CᴿCᴿ red, CᴿCᵂ pink, CᴿCᵂ pink and CᵂCᵂ white, red shaded gray, pink hatched, white unshaded, a key, and the genotype and phenotype ratios below  
  file: `public/tools/figure-library/biology/punnett-square/incomplete-dominance-punnett-square-snapdragon-flower-color.svg`  
  open: `/tools/figures/biology/punnett-square?dominance=incomplete&parents=C%5ER+C%5EW+%C3%97+C%5ER+C%5EW&names=C%5ER%3Ared%3BC%5ER%2BC%5EW%3Apink%3BC%5EW%3Awhite&cellNames=1&shade=each`
- **Tt × Tt Punnett square: monohybrid cross for pea plant height** — A Punnett square titled Pea plant height crossing Tt × Tt, with gametes T and t on each side, offspring TT, Tt, Tt and tt, the tall cells shaded gray, a key for tall and short, and the genotype and phenotype ratios below  
  file: `public/tools/figure-library/biology/punnett-square/punnett-square-tt-x-tt-monohybrid-cross.svg`  
  open: `/tools/figures/biology/punnett-square?shade=each&titleMode=text&title=Pea+plant+height`

## chemistry / bohr-model

- **Blank Bohr model to fill in (aluminum)** — Bohr model of aluminum with 13 protons and 14 neutrons in the nucleus and three empty rings labeled n = 1 to n = 3  
  file: `public/tools/figure-library/chemistry/bohr-model/blank-bohr-model-aluminum.svg`  
  open: `/tools/figures/chemistry/bohr-model?protons=13&neutrons=14&nucleus=text&electrons=2-8-3&emptyRings=1&shellLabels=1`
- **Bohr model of calcium (Ca)** — Bohr model of a calcium atom: a nucleus labeled 20 protons and 20 neutrons, with 2, 8, 8 and 2 electrons on four shells  
  file: `public/tools/figure-library/chemistry/bohr-model/bohr-model-of-calcium.svg`  
  open: `/tools/figures/chemistry/bohr-model?protons=20&neutrons=20&nucleus=text&electrons=2-8-8-2`
- **Bohr model of carbon (C)** — Bohr model of a carbon atom: 6 protons and 6 neutrons in the nucleus, 2 and 4 electrons on two shells, with a key  
  file: `public/tools/figure-library/chemistry/bohr-model/bohr-model-of-carbon.svg`  
  open: `/tools/figures/chemistry/bohr-model?key=1`
- **Bohr model of a chloride ion (Cl⁻)** — Bohr model of a chloride ion in brackets with a − charge: 17 protons, 18 neutrons, and 2, 8 and 8 electrons with the gained electron in green  
  file: `public/tools/figure-library/chemistry/bohr-model/bohr-model-of-chloride-ion-cl-minus.svg`  
  open: `/tools/figures/chemistry/bohr-model?protons=17&neutrons=18&electrons=2-8-8&gainedLost=1&brackets=1&key=1`
- **Bohr model of oxygen (O)** — Bohr model of an oxygen atom: 8 protons and 8 neutrons, with 2 electrons on the first shell and 6 on the second drawn in pairs  
  file: `public/tools/figure-library/chemistry/bohr-model/bohr-model-of-oxygen.svg`  
  open: `/tools/figures/chemistry/bohr-model?protons=8&neutrons=8&electrons=2-6&placement=paired&shellLabels=1`
- **Bohr model of sodium (Na)** — Bohr model of a sodium atom: a nucleus of 11 protons and 12 neutrons, with 2, 8 and 1 electrons on three shells  
  file: `public/tools/figure-library/chemistry/bohr-model/bohr-model-of-sodium.svg`  
  open: `/tools/figures/chemistry/bohr-model?protons=11&neutrons=12&electrons=2-8-1`
- **Bohr model of a sodium ion (Na⁺)** — Bohr model of a sodium ion in brackets with a + charge: 11 protons, 12 neutrons and 2 and 8 electrons, the lost third-shell electron drawn as an empty dashed spot  
  file: `public/tools/figure-library/chemistry/bohr-model/bohr-model-of-sodium-ion-na-plus.svg`  
  open: `/tools/figures/chemistry/bohr-model?protons=11&neutrons=12&electrons=2-8&gainedLost=1&brackets=1&key=1`

## chemistry / dot-and-cross

- **Find the mistake: dot-and-cross diagram of sodium chloride (NaCl)** — A deliberately wrong dot-and-cross diagram of sodium chloride: a sodium ion with 8 crosses and a chloride ion with only 7 dots, its gained electron missing, each in square brackets with its charge  
  file: `public/tools/figure-library/chemistry/dot-and-cross/dot-and-cross-diagram-mistake-sodium-chloride.svg`  
  open: `/tools/figures/chemistry/dot-and-cross?formula=NaCl&edits=e15n`
- **Dot-and-cross diagram of a calcium atom (2, 8, 8, 2)** — A calcium atom drawn as four shells around the symbol Ca, with 2, 8, 8 and 2 electrons as dots  
  file: `public/tools/figure-library/chemistry/dot-and-cross/dot-and-cross-diagram-of-a-calcium-atom.svg`  
  open: `/tools/figures/chemistry/dot-and-cross?formula=Ca`
- **Dot-and-cross diagram of aluminum oxide (Al₂O₃)** — Dot-and-cross diagram of aluminum oxide: 2 in front of a bracketed Al³⁺ ion with 8 crosses, and 3 in front of a bracketed O²⁻ ion with 6 dots and 2 crosses  
  file: `public/tools/figure-library/chemistry/dot-and-cross/dot-and-cross-diagram-of-aluminum-oxide.svg`  
  open: `/tools/figures/chemistry/dot-and-cross?formula=Al2O3`
- **Dot-and-cross diagram of carbon dioxide (CO₂)** — Dot-and-cross diagram of carbon dioxide: a carbon circle between two oxygen circles, each overlap holding two dots and two crosses, and two lone pairs of crosses on each oxygen  
  file: `public/tools/figure-library/chemistry/dot-and-cross/dot-and-cross-diagram-of-carbon-dioxide.svg`  
  open: `/tools/figures/chemistry/dot-and-cross?formula=CO2`
- **Dot-and-cross diagram of ethanol (C₂H₅OH)** — Dot-and-cross diagram of ethanol: two carbon circles and an oxygen circle in a row, overlapped by six smaller hydrogen circles, each overlap holding one shared pair, with two lone pairs on the oxygen  
  file: `public/tools/figure-library/chemistry/dot-and-cross/dot-and-cross-diagram-of-ethanol.svg`  
  open: `/tools/figures/chemistry/dot-and-cross?formula=C2H5OH`
- **Dot-and-cross diagram of ethene (C₂H₄) for students to complete** — The overlapping outer shells of ethene, two carbons and four hydrogens, with no electrons drawn, and an answer key under them  
  file: `public/tools/figure-library/chemistry/dot-and-cross/dot-and-cross-diagram-of-ethene-for-students.svg`  
  open: `/tools/figures/chemistry/dot-and-cross?formula=C2H4&blank=1&answerKey=1`
- **Dot-and-cross diagram of magnesium chloride (MgCl₂)** — Dot-and-cross diagram of magnesium chloride: a magnesium ion with 8 crosses between two chloride ions, each with 7 dots and 1 cross, in brackets with their charges, and an answer key  
  file: `public/tools/figure-library/chemistry/dot-and-cross/dot-and-cross-diagram-of-magnesium-chloride.svg`  
  open: `/tools/figures/chemistry/dot-and-cross?formula=MgCl2&answerKey=1`
- **Dot-and-cross diagram of methane (CH₄)** — Dot-and-cross diagram of methane: a carbon circle overlapped by four hydrogen circles above, below, left and right, each overlap holding a dot and a cross  
  file: `public/tools/figure-library/chemistry/dot-and-cross/dot-and-cross-diagram-of-methane.svg`  
  open: `/tools/figures/chemistry/dot-and-cross?formula=CH4`
- **Dot-and-cross diagram of nitrogen (N₂)** — Dot-and-cross diagram of a nitrogen molecule: two overlapping circles with three dots and three crosses in the overlap and one lone pair on each atom  
  file: `public/tools/figure-library/chemistry/dot-and-cross/dot-and-cross-diagram-of-nitrogen-n2.svg`  
  open: `/tools/figures/chemistry/dot-and-cross?formula=N2`
- **Dot-and-cross diagram of sodium chloride (NaCl)** — Dot-and-cross diagram of sodium chloride: a sodium ion with 8 crosses and a chloride ion with 7 dots and 1 cross, each in square brackets with its charge  
  file: `public/tools/figure-library/chemistry/dot-and-cross/dot-and-cross-diagram-of-sodium-chloride.svg`  
  open: `/tools/figures/chemistry/dot-and-cross?formula=NaCl`
- **Dot-and-cross diagram of water (H₂O)** — Dot-and-cross diagram of water: an oxygen circle overlapping two hydrogen circles, a dot and a cross in each overlap, and two lone pairs of dots on the oxygen  
  file: `public/tools/figure-library/chemistry/dot-and-cross/dot-and-cross-diagram-of-water.svg`  
  open: `/tools/figures/chemistry/dot-and-cross`

## chemistry / gas-syringe

- **50 cm³ gas syringe reading 23.5 cm³** — A 50 cm³ gas syringe on its own, its plunger at 23.5 cm³, with a magnified view  
  file: `public/tools/figure-library/chemistry/gas-syringe/50-cm3-gas-syringe-reading-23-5-cm3.svg`  
  open: `/tools/figures/chemistry/gas-syringe?size=50&reading=23.5&setup=syringe`
- **Gas syringe collecting gas: 64.0 cm³** — A conical flask joined by a delivery tube to a 100 cm³ gas syringe on a stand, reading 64.0 cm³, with a magnified view of the plunger  
  file: `public/tools/figure-library/chemistry/gas-syringe/gas-syringe-collecting-gas-64-cm3.svg`  
  open: `/tools/figures/chemistry/gas-syringe?reading=64`
- **Gas syringe plunger close-up: 37.6 cm³** — A magnified view of a gas syringe’s scale, the plunger’s face at 37.6 cm³  
  file: `public/tools/figure-library/chemistry/gas-syringe/gas-syringe-plunger-close-up-37-6-cm3.svg`  
  open: `/tools/figures/chemistry/gas-syringe?reading=37.6&setup=syringe&view=magnifier&span=3`
- **Gas syringe reading in mL: 31.8 mL** — A conical flask joined by a delivery tube to a 50 mL gas syringe on a stand, its scale in mL, the plunger at 31.8 mL  
  file: `public/tools/figure-library/chemistry/gas-syringe/gas-syringe-reading-in-ml-31-8-ml.svg`  
  open: `/tools/figures/chemistry/gas-syringe?size=50&unit=mL&reading=31.8&view=whole`

## chemistry / half-life-graph

- **Carbon-14 decaying to nitrogen-14: parent and daughter** — Carbon-14 falling and nitrogen-14 rising as percent of atoms against time in years, crossing at 50% at one half-life, marked T½  
  file: `public/tools/figure-library/chemistry/half-life-graph/carbon-14-decaying-to-nitrogen-14.svg`  
  open: `/tools/figures/chemistry/half-life-graph?daughter=1&guides=1&guideLabels=halves&yTitle=Percent+of+atoms+%28%25%29`
- **Carbon-14 half-life graph** — Decay curve of carbon-14, percent remaining against time in years, with dashed guide lines at 5,730, 11,460 and 17,190 years  
  file: `public/tools/figure-library/chemistry/half-life-graph/carbon-14-half-life-graph.svg`  
  open: `/tools/figures/chemistry/half-life-graph?guides=3`
- **Identify the isotope from its half-life: three decay curves** — Three decay curves, solid, dashed and dotted, named Isotope A, Isotope B and Isotope C in a key, against time in years from 0 to 160  
  file: `public/tools/figure-library/chemistry/half-life-graph/identify-the-isotope-from-its-half-life.svg`  
  open: `/tools/figures/chemistry/half-life-graph?count=3&iso1=h3&names=0&xTo=160&xStep=10`
- **Iodine-131 decay: mass remaining over 45 days** — Decay curve of an 80 g sample of iodine-131, mass remaining in grams against time in days, with a dot at the start and at each half-life  
  file: `public/tools/figure-library/chemistry/half-life-graph/iodine-131-mass-remaining.svg`  
  open: `/tools/figures/chemistry/half-life-graph?iso1=i131&quantity=mass&start=80&xUnit=d&dots=1&xTo=45&xStep=5&yTo=80&xEvery=1&xTitle=Time+%28days%29&yTitle=Mass+remaining+%28g%29`
- **Plot the decay curve: Isotope X, half-life 10 years** — Dots at 100, 50, 25, 12.5, 6.25 and 3.125 percent every 10 years on an empty grid, for students to join into a decay curve  
  file: `public/tools/figure-library/chemistry/half-life-graph/plot-the-decay-curve-isotope-x.svg`  
  open: `/tools/figures/chemistry/half-life-graph?iso1=x&curve=0&dots=1&xTo=50&xStep=5&xEvery=1`
- **Technetium-99m activity: read the half-life** — Activity of technetium-99m in becquerels from 800 Bq against time in hours, with dashed guide lines from 400 and 200 Bq and blank lines by the time axis  
  file: `public/tools/figure-library/chemistry/half-life-graph/technetium-99m-activity-read-the-half-life.svg`  
  open: `/tools/figures/chemistry/half-life-graph?iso1=tc99m&quantity=activity&start=800&xUnit=h&guides=2&guideLabels=blank&xTo=32&xStep=2&yTo=800&yStep=100&xTitle=Time+%28hours%29&yTitle=Activity+%28Bq%29`

## chemistry / heating-cooling-curve

- **Cooling curve of water** — Cooling curve of water from steam at 120 °C to ice at −20 °C, with plateaus labeled Condensing at 100 °C and Freezing at 0 °C  
  file: `public/tools/figure-library/chemistry/heating-cooling-curve/cooling-curve-of-water.svg`  
  open: `/tools/figures/chemistry/heating-cooling-curve?direction=cooling&startT=120&endT=-20`
- **Cooling curve with supercooling** — Cooling curve of water from 80 °C to −20 °C that dips 5 °C below the freezing point before rising back to 0 °C and freezing, corners lettered A to D  
  file: `public/tools/figure-library/chemistry/heating-cooling-curve/cooling-curve-with-supercooling.svg`  
  open: `/tools/figures/chemistry/heating-cooling-curve?direction=cooling&startT=80&endT=-20&supercool=1&letters=1&xTo=10&yTo=100&xEvery=1`
- **Heating curve of ethanol** — Heating curve of ethanol from −140 °C to 100 °C, with plateaus at its melting point, −114.1 °C, and boiling point, 78.3 °C, written by the temperature axis  
  file: `public/tools/figure-library/chemistry/heating-cooling-curve/heating-curve-of-ethanol.svg`  
  open: `/tools/figures/chemistry/heating-cooling-curve?substance=ethanol&startT=-140&endT=100&yFrom=-140&yTo=100&yStep=20&yEvery=1`
- **Heating curve of water, lettered A to F** — Heating curve of water from ice at −20 °C to steam at 120 °C, with plateaus at 0 and 100 °C labeled Melting and Boiling, corners lettered A to F  
  file: `public/tools/figure-library/chemistry/heating-cooling-curve/heating-curve-of-water-lettered.svg`  
  open: `/tools/figures/chemistry/heating-cooling-curve?letters=1`
- **Heating curve of water to scale, against heat added** — Heating curve of 100 g of water against heat added in kJ, its boiling plateau much longer than its melting plateau, with blank lines to label each segment  
  file: `public/tools/figure-library/chemistry/heating-cooling-curve/heating-curve-of-water-to-scale-heat-added.svg`  
  open: `/tools/figures/chemistry/heating-cooling-curve?source=properties&xQuantity=heat&segmentLabels=blank&xTo=320&xStep=20&xTitle=Heat+added+%28kJ%29`
- **Heating curve worksheet: label the melting and boiling points** — Heating curve of an unknown substance from 0 °C to 160 °C, its corners lettered A to F, with blank lines for the segment labels and by the temperature axis at each plateau  
  file: `public/tools/figure-library/chemistry/heating-cooling-curve/heating-curve-worksheet-substance-x.svg`  
  open: `/tools/figures/chemistry/heating-cooling-curve?substance=x&startT=0&endT=160&letters=1&segmentLabels=blank&pointLabels=blank&yFrom=0&yTo=160`

## chemistry / length-reading

- **Caliper reading 23.45 mm** — A caliper holding a block, reading 23.45 mm on its 0.05 mm sliding scale, with a close-up strip of its scales  
  file: `public/tools/figure-library/chemistry/length-reading/caliper-reading-23-45-mm.svg`  
  open: `/tools/figures/chemistry/length-reading?instrument=caliper`
- **Caliper with a zero error** — Two 0.1 mm calipers: above, with its jaws closed, reading 0.3 mm; below, holding block A, reading 27.6 mm, each with a close-up strip of its scales  
  file: `public/tools/figure-library/chemistry/length-reading/caliper-with-a-zero-error.svg`  
  open: `/tools/figures/chemistry/length-reading?instrument=caliper&leastCount=0.1&caliper=27.6&caliperZero=0.3&jawsLabel=A`
- **Ruler marked only in centimeters: 5.3 cm** — A 15 cm ruler marked only every centimeter, with a cube lying along it from 0 to 5.3 cm  
  file: `public/tools/figure-library/chemistry/length-reading/centimeter-ruler-without-millimeters-5-3-cm.svg`  
  open: `/tools/figures/chemistry/length-reading?metricMarks=cm&object=cube&length=5.3`
- **Inch ruler reading 3 5/16 inches** — A 6 inch ruler marked in sixteenths with a row of marbles from 0 to 3 5/16 inches  
  file: `public/tools/figure-library/chemistry/length-reading/inch-ruler-reading-3-5-16-inches.svg`  
  open: `/tools/figures/chemistry/length-reading?system=imperial&imperialMarks=16&object=marbles&guides=1&length=3.3125&span=1`
- **Meter stick reading 62.4 cm** — A meter stick marked every centimeter with a long metal cylinder lying along it from 0 to 62.4 cm  
  file: `public/tools/figure-library/chemistry/length-reading/meter-stick-reading-62-4-cm.svg`  
  open: `/tools/figures/chemistry/length-reading?cm=100&metricMarks=cm&length=62.4`
- **Metric ruler reading 7.45 cm** — A 15 cm ruler marked in millimeters with a metal cylinder lying along it from 0 to 7.45 cm, with a magnified view of its right end  
  file: `public/tools/figure-library/chemistry/length-reading/metric-ruler-reading-7-45-cm.svg`  
  open: `/tools/figures/chemistry/length-reading?length=7.45`
- **Micrometer reading estimated to 0.001 mm: 6.847 mm** — A micrometer holding a cylinder, reading 6.847 mm, with a magnified view showing the datum line between the thimble’s 34th and 35th marks  
  file: `public/tools/figure-library/chemistry/length-reading/micrometer-reading-estimated-to-0-001-mm.svg`  
  open: `/tools/figures/chemistry/length-reading?instrument=micrometer&micrometer=6.847&jaws=cylinder`
- **Micrometer reading just past half a millimeter: 5.51 mm** — A micrometer holding a wire, reading 5.51 mm, with a magnified view showing the 5.5 mm mark just uncovered on the sleeve  
  file: `public/tools/figure-library/chemistry/length-reading/micrometer-reading-just-past-half-a-millimeter.svg`  
  open: `/tools/figures/chemistry/length-reading?instrument=micrometer&micrometer=5.51&micrometerRead=mark&jaws=wire`
- **Micrometer with a negative zero error** — Two micrometers: above, closed, its thimble’s 0 three marks above the datum line, reading −0.03 mm; below, holding a wire, reading 3.27 mm, each with a magnified view  
  file: `public/tools/figure-library/chemistry/length-reading/micrometer-with-a-negative-zero-error.svg`  
  open: `/tools/figures/chemistry/length-reading?instrument=micrometer&micrometer=3.27&micrometerRead=mark&micrometerZero=-0.03&jaws=wire`
- **Measuring with a ruler not starting at zero** — A 15 cm ruler with a rock lying along it from 2.00 cm to 8.35 cm, with magnified views of both ends  
  file: `public/tools/figure-library/chemistry/length-reading/ruler-measuring-not-from-zero-rock.svg`  
  open: `/tools/figures/chemistry/length-reading?object=rock&guides=1&length=6.35&start=2`

## chemistry / lewis-structures

- **Lewis dot diagram of the nitride ion (N³⁻)** — Lewis dot diagram of the nitride ion: N with a pair of dots on each of its four sides, in square brackets with a 3− charge  
  file: `public/tools/figure-library/chemistry/lewis-structures/lewis-dot-diagram-of-nitride-ion-n3.svg`  
  open: `/tools/figures/chemistry/lewis-structures?formula=N+3-`
- **Lewis dot structure of CH₄ (methane)** — Lewis dot structure of methane: a carbon with a pair of dots to each of four hydrogens  
  file: `public/tools/figure-library/chemistry/lewis-structures/lewis-dot-structure-of-ch4.svg`  
  open: `/tools/figures/chemistry/lewis-structures?formula=CH4&bondStyle=dots`
- **Lewis structure of CO₂ (carbon dioxide)** — Lewis structure of CO2: O=C=O with two double bonds and two lone pairs on each oxygen  
  file: `public/tools/figure-library/chemistry/lewis-structures/lewis-structure-of-co2.svg`  
  open: `/tools/figures/chemistry/lewis-structures?formula=CO2`
- **Lewis structure of H₂O (water)** — Lewis structure of water drawn bent: an oxygen with two lone pairs single-bonded to two hydrogens  
  file: `public/tools/figure-library/chemistry/lewis-structures/lewis-structure-of-h2o.svg`  
  open: `/tools/figures/chemistry/lewis-structures?shape=shaped`
- **Lewis structure of HCN (hydrogen cyanide)** — Lewis structure of HCN: H single-bonded to C, triple-bonded to N with one lone pair  
  file: `public/tools/figure-library/chemistry/lewis-structures/lewis-structure-of-hcn.svg`  
  open: `/tools/figures/chemistry/lewis-structures?formula=HCN`
- **Lewis structure of NH₃ (ammonia)** — Lewis structure of ammonia: a nitrogen with one lone pair single-bonded to three hydrogens spread below it  
  file: `public/tools/figure-library/chemistry/lewis-structures/lewis-structure-of-nh3.svg`  
  open: `/tools/figures/chemistry/lewis-structures?formula=NH3&shape=shaped`
- **Lewis structure of sulfate (SO₄²⁻)** — Lewis structure of the sulfate ion: sulfur single-bonded to four oxygens, each with three lone pairs, in brackets with a 2− charge and formal charges  
  file: `public/tools/figure-library/chemistry/lewis-structures/lewis-structure-of-sulfate-so4-2.svg`  
  open: `/tools/figures/chemistry/lewis-structures?formula=SO4+2-&formalCharges=1`
- **Resonance structures of nitrate (NO₃⁻)** — The three resonance structures of the nitrate ion in brackets, joined by double-headed arrows, with formal charges  
  file: `public/tools/figure-library/chemistry/lewis-structures/resonance-structures-of-nitrate-no3.svg`  
  open: `/tools/figures/chemistry/lewis-structures?formula=NO3-&resonance=all&formalCharges=1`

## chemistry / line-spectrum

- **Absorption spectra of hydrogen and helium** — Absorption spectra of hydrogen and helium: dark lines across a continuous rainbow from 400 to 700 nm  
  file: `public/tools/figure-library/chemistry/line-spectrum/absorption-spectra-hydrogen-helium.svg`  
  open: `/tools/figures/chemistry/line-spectrum?strips=%5B%7B%22type%22%3A%22element%22%2C%22id%22%3A1%2C%22element%22%3A%22H%22%7D%2C%7B%22type%22%3A%22element%22%2C%22id%22%3A2%2C%22element%22%3A%22He%22%7D%5D&style=absorption`
- **Emission spectra of hydrogen, helium and sodium with an unknown to identify** — Bright-line emission spectra of hydrogen, helium and sodium stacked on one 400–700 nm wavelength scale, with an unknown spectrum under them made of two of the three  
  file: `public/tools/figure-library/chemistry/line-spectrum/emission-spectra-hydrogen-helium-sodium-unknown-mixture.svg`  
  open: `/tools/figures/chemistry/line-spectrum`
- **Emission spectra of flame test metals: lithium, sodium, strontium and copper** — Bright-line emission spectra of lithium, sodium, strontium and copper on one wavelength scale, with an unknown made of two of them  
  file: `public/tools/figure-library/chemistry/line-spectrum/flame-test-metals-emission-spectra-lithium-sodium-strontium-copper.svg`  
  open: `/tools/figures/chemistry/line-spectrum?strips=%5B%7B%22type%22%3A%22element%22%2C%22id%22%3A1%2C%22element%22%3A%22Li%22%7D%2C%7B%22type%22%3A%22element%22%2C%22id%22%3A2%2C%22element%22%3A%22Na%22%7D%2C%7B%22type%22%3A%22element%22%2C%22id%22%3A3%2C%22element%22%3A%22Sr%22%7D%2C%7B%22type%22%3A%22element%22%2C%22id%22%3A4%2C%22element%22%3A%22Cu%22%7D%2C%7B%22type%22%3A%22mixture%22%2C%22id%22%3A5%2C%22name%22%3A%22Unknown%22%2C%22of%22%3A%5B2%2C3%5D%7D%5D`
- **Hydrogen emission spectrum: the Balmer series** — The bright-line emission spectrum of hydrogen from 400 to 700 nm: four lines, violet, blue-violet, cyan and red  
  file: `public/tools/figure-library/chemistry/line-spectrum/hydrogen-emission-spectrum-balmer-series.svg`  
  open: `/tools/figures/chemistry/line-spectrum?strips=%5B%7B%22type%22%3A%22element%22%2C%22id%22%3A1%2C%22element%22%3A%22H%22%7D%5D`
- **Identify the element: black-and-white line spectra with blank labels** — Three line spectra drawn as black lines on white, each with a blank line in place of the element’s name  
  file: `public/tools/figure-library/chemistry/line-spectrum/identify-the-element-line-spectra-black-and-white.svg`  
  open: `/tools/figures/chemistry/line-spectrum?strips=%5B%7B%22type%22%3A%22element%22%2C%22id%22%3A1%2C%22element%22%3A%22Hg%22%7D%2C%7B%22type%22%3A%22element%22%2C%22id%22%3A2%2C%22element%22%3A%22Ne%22%7D%2C%7B%22type%22%3A%22element%22%2C%22id%22%3A3%2C%22element%22%3A%22He%22%7D%5D&style=print&labels=blank`
- **Line spectra of made-up elements X, Y and Z with an unknown** — Emission spectra of three made-up elements, X, Y and Z, each with three lines, and an unknown made of two of them  
  file: `public/tools/figure-library/chemistry/line-spectrum/made-up-elements-line-spectra-unknown-mixture.svg`  
  open: `/tools/figures/chemistry/line-spectrum?strips=%5B%7B%22type%22%3A%22custom%22%2C%22id%22%3A1%2C%22name%22%3A%22Element+X%22%2C%22lines%22%3A%22425%2C+510%2C+630%22%7D%2C%7B%22type%22%3A%22custom%22%2C%22id%22%3A2%2C%22name%22%3A%22Element+Y%22%2C%22lines%22%3A%22455%2C+545%2C+600%22%7D%2C%7B%22type%22%3A%22custom%22%2C%22id%22%3A3%2C%22name%22%3A%22Element+Z%22%2C%22lines%22%3A%22480%2C+575%2C+665%22%7D%2C%7B%22type%22%3A%22mixture%22%2C%22id%22%3A4%2C%22name%22%3A%22Unknown%22%2C%22of%22%3A%5B1%2C3%5D%7D%5D`

## chemistry / mass-reading

- **Analytical balance reading 0.2537 g** — An analytical balance inside its glass draft shield, its display reading 0.2537 g  
  file: `public/tools/figure-library/chemistry/mass-reading/analytical-balance-reading-0-2537-g.svg`  
  open: `/tools/figures/chemistry/mass-reading?instrument=digital&decimals=4&mass=0.2537`
- **Mass of a metal cube on a digital balance** — A metal cube on a digital balance showing 21.6 g  
  file: `public/tools/figure-library/chemistry/mass-reading/digital-balance-metal-cube-mass-21-6-g.svg`  
  open: `/tools/figures/chemistry/mass-reading?instrument=digital&decimals=1&object=cube&mass=21.6`
- **Digital balance reading 12.47 g** — A digital balance with a weigh boat on its pan, its display reading 12.47 g  
  file: `public/tools/figure-library/chemistry/mass-reading/digital-balance-reading-12-47-g.svg`  
  open: `/tools/figures/chemistry/mass-reading?instrument=digital&mass=12.47`
- **Triple beam balance reading 263.47 g** — A triple beam balance with its riders at 200 g, 60 g and 3.47 g, with a magnified view of the front beam  
  file: `public/tools/figure-library/chemistry/mass-reading/triple-beam-balance-reading-263-47-g.svg`  
  open: `/tools/figures/chemistry/mass-reading?mass=263.47`
- **Mass of a rock on a triple beam balance** — A rock on the pan of a triple beam balance with its riders reading 72.35 g  
  file: `public/tools/figure-library/chemistry/mass-reading/triple-beam-balance-rock-mass-72-35-g.svg`  
  open: `/tools/figures/chemistry/mass-reading?object=rock&mass=72.35&view=whole`

## chemistry / mass-spectrum

- **Draw the missing peak: silicon mass spectrum** — The mass spectrum of silicon with peaks at m/z 28 and 30 and the peak at m/z 29 left out, with an answer key under the graph  
  file: `public/tools/figure-library/chemistry/mass-spectrum/draw-the-missing-peak-silicon-mass-spectrum.svg`  
  open: `/tools/figures/chemistry/mass-spectrum?element=Si&leaveOut=29&answerKey=1`
- **Identify the element from its mass spectrum** — An unnamed element’s mass spectrum with two nearly equal peaks at m/z 79 and 81, labeled 50.69% and 49.31%  
  file: `public/tools/figure-library/chemistry/mass-spectrum/identify-the-element-from-its-mass-spectrum.svg`  
  open: `/tools/figures/chemistry/mass-spectrum?element=Br&names=0`
- **Mass spectrum of a made-up element** — The mass spectrum of Element Q: a peak at m/z 20 labeled 90% and a peak at m/z 22 labeled 10%, with an answer key under the graph  
  file: `public/tools/figure-library/chemistry/mass-spectrum/mass-spectrum-of-a-made-up-element.svg`  
  open: `/tools/figures/chemistry/mass-spectrum?source=custom&isotopes=20-90_22-10&name=Element+Q&answerKey=1`
- **Mass spectrum of chlorine with its relative atomic mass** — The mass spectrum of chlorine: a peak at m/z 35 labeled 75.76% and a peak at m/z 37 labeled 24.24%, with an answer key under the graph  
  file: `public/tools/figure-library/chemistry/mass-spectrum/mass-spectrum-of-chlorine-relative-atomic-mass.svg`  
  open: `/tools/figures/chemistry/mass-spectrum?element=Cl&answerKey=1`
- **Mass spectrum of magnesium** — The mass spectrum of magnesium: three peaks at m/z 24, 25 and 26 labeled 78.99%, 10.00% and 11.01%  
  file: `public/tools/figure-library/chemistry/mass-spectrum/mass-spectrum-of-magnesium.svg`  
  open: `/tools/figures/chemistry/mass-spectrum`
- **Mass spectrum of zirconium, relative abundance** — The mass spectrum of zirconium with five peaks from m/z 90 to 96, the tallest at m/z 90 scaled to 100  
  file: `public/tools/figure-library/chemistry/mass-spectrum/mass-spectrum-of-zirconium-relative-abundance.svg`  
  open: `/tools/figures/chemistry/mass-spectrum?element=Zr&scale=relative&yTitle=Relative+abundance`

## chemistry / nuclide-notation

- **Alpha particle symbol (⁴₂He)** — The symbol for an alpha particle: He with mass number 4 at the top left and 2 at the bottom left  
  file: `public/tools/figure-library/chemistry/nuclide-notation/alpha-particle-symbol.svg`  
  open: `/tools/figures/chemistry/nuclide-notation?kind=particle`
- **Beta particle symbol (⁰₋₁β)** — The symbol for a beta particle in a serif font: the Greek letter beta with 0 at the top left and −1 at the bottom left  
  file: `public/tools/figure-library/chemistry/nuclide-notation/beta-particle-symbol.svg`  
  open: `/tools/figures/chemistry/nuclide-notation?kind=particle&particle=beta&particleSymbol=beta&font=serif`
- **Carbon-14 nuclide symbol (¹⁴₆C)** — The nuclide symbol for carbon-14: C with mass number 14 at the top left and atomic number 6 at the bottom left, with carbon-14 written under it  
  file: `public/tools/figure-library/chemistry/nuclide-notation/carbon-14-nuclide-symbol.svg`  
  open: `/tools/figures/chemistry/nuclide-notation?mass=14&notation=both`
- **Chlorine-37 ion symbol (³⁷Cl⁻)** — The symbol of the chlorine-37 ion: Cl with mass number 37 at the top left and a minus charge at the top right, with an answer key under it  
  file: `public/tools/figure-library/chemistry/nuclide-notation/chlorine-37-ion-symbol-cl-minus.svg`  
  open: `/tools/figures/chemistry/nuclide-notation?z=17&mass=37&charge=-1&zPart=off&answerKey=1`
- **Identify the element: a made-up symbol X** — A nuclide symbol with the made-up symbol X: mass number 79, atomic number 34 and a 2− charge, with an answer key under it  
  file: `public/tools/figure-library/chemistry/nuclide-notation/identify-the-element-x.svg`  
  open: `/tools/figures/chemistry/nuclide-notation?kind=custom&z=34&mass=79&charge=-2&answerKey=1`
- **Hyphen notation with the mass number blank (oxygen-18)** — The hyphen notation oxygen- followed by a blank line for the mass number  
  file: `public/tools/figure-library/chemistry/nuclide-notation/oxygen-18-hyphen-notation-blank.svg`  
  open: `/tools/figures/chemistry/nuclide-notation?z=8&mass=18&massPart=blank&blank=line&notation=hyphen`
- **Uranium-235 with the atomic number blank** — The nuclide symbol for uranium-235: U with mass number 235 at the top left and an empty box at the bottom left for the atomic number  
  file: `public/tools/figure-library/chemistry/nuclide-notation/uranium-235-find-the-atomic-number.svg`  
  open: `/tools/figures/chemistry/nuclide-notation?z=92&mass=235&zPart=blank`

## chemistry / orbital-diagram

- **Orbital diagram and electron configuration of sulfur (S)** — Orbital diagram of sulfur from 1s to 3p with its electron configuration 1s2 2s2 2p6 3s2 3p4 written underneath  
  file: `public/tools/figure-library/chemistry/orbital-diagram/orbital-diagram-and-electron-configuration-of-sulfur.svg`  
  open: `/tools/figures/chemistry/orbital-diagram?z=16&configLine=text`
- **Find the mistake: orbital diagram breaking Hund’s rule (nitrogen)** — Orbital diagram of nitrogen drawn wrong: the 2p sublevel has a pair of arrows in one box, one arrow in the next and an empty third box  
  file: `public/tools/figure-library/chemistry/orbital-diagram/orbital-diagram-hunds-rule-mistake-nitrogen.svg`  
  open: `/tools/figures/chemistry/orbital-diagram?z=7&changes=%7B%222p%22%3A%5B%22ud%22%2C%22u%22%2C%22%22%5D%7D`
- **Orbital diagram of chromium (an exception)** — Orbital diagram of chromium with an argon core: 4s has one up arrow and all five 3d boxes have one up arrow  
  file: `public/tools/figure-library/chemistry/orbital-diagram/orbital-diagram-of-chromium-exception.svg`  
  open: `/tools/figures/chemistry/orbital-diagram?z=24&core=1`
- **Orbital diagram of the Fe³⁺ ion** — Orbital diagram of Fe3+ with an argon core: an empty 4s box and five 3d boxes each with one up arrow  
  file: `public/tools/figure-library/chemistry/orbital-diagram/orbital-diagram-of-fe3-plus-ion.svg`  
  open: `/tools/figures/chemistry/orbital-diagram?z=26&charge=3&core=1`
- **Orbital diagram of iron (Fe)** — Orbital diagram of iron with boxes from 1s to 3d: 3d has one pair and four single up arrows  
  file: `public/tools/figure-library/chemistry/orbital-diagram/orbital-diagram-of-iron.svg`  
  open: `/tools/figures/chemistry/orbital-diagram?z=26`
- **Orbital diagram of oxygen (O)** — Orbital diagram of oxygen: 1s and 2s boxes each with a pair of arrows, and three 2p boxes with one pair and two single up arrows  
  file: `public/tools/figure-library/chemistry/orbital-diagram/orbital-diagram-of-oxygen.svg`  
  open: `/tools/figures/chemistry/orbital-diagram`

## chemistry / particle-diagram

- **Particle diagram before and after a reaction (hydrogen and oxygen)** — Two boxes with an arrow between: before, pairs of small white atoms and pairs of gray atoms; after, bent molecules of one gray and two white atoms and one pair of gray atoms left over, with a key naming H₂, O₂ and H₂O  
  file: `public/tools/figure-library/chemistry/particle-diagram/particle-diagram-before-and-after-reaction-hydrogen-and-oxygen.svg`  
  open: `/tools/figures/chemistry/particle-diagram?boxes=two&particles=%5B%7B%22count%22%3A4%2C%22after%22%3A0%2C%22shape%22%3A%22pair%22%2C%22look%22%3A%7B%22size%22%3A%22s%22%2C%22shade%22%3A%22white%22%2C%22charge%22%3A%22%22%7D%2C%22outer%22%3A%7B%22size%22%3A%22s%22%2C%22shade%22%3A%22white%22%2C%22charge%22%3A%22%22%7D%2C%22name%22%3A%22H_2+molecule%22%7D%2C%7B%22count%22%3A3%2C%22after%22%3A1%2C%22shape%22%3A%22pair%22%2C%22look%22%3A%7B%22size%22%3A%22m%22%2C%22shade%22%3A%22gray%22%2C%22charge%22%3A%22%22%7D%2C%22outer%22%3A%7B%22size%22%3A%22m%22%2C%22shade%22%3A%22gray%22%2C%22charge%22%3A%22%22%7D%2C%22name%22%3A%22O_2+molecule%22%7D%2C%7B%22count%22%3A0%2C%22after%22%3A4%2C%22shape%22%3A%22bent%22%2C%22look%22%3A%7B%22size%22%3A%22m%22%2C%22shade%22%3A%22gray%22%2C%22charge%22%3A%22%22%7D%2C%22outer%22%3A%7B%22size%22%3A%22s%22%2C%22shade%22%3A%22white%22%2C%22charge%22%3A%22%22%7D%2C%22name%22%3A%22H_2O+molecule%22%7D%5D&seed=3&show=both`
- **Particle diagram of an interstitial alloy (steel)** — A lattice of large gray iron atoms with small black carbon atoms in some of the gaps, with a key  
  file: `public/tools/figure-library/chemistry/particle-diagram/particle-diagram-interstitial-alloy-steel.svg`  
  open: `/tools/figures/chemistry/particle-diagram?layout=lattice&pattern=interstitial&rows=5&columns=6&main=%7B%22size%22%3A%22l%22%2C%22shade%22%3A%22gray%22%2C%22charge%22%3A%22%22%7D&second=%7B%22size%22%3A%22xs%22%2C%22shade%22%3A%22black%22%2C%22charge%22%3A%22%22%7D&secondCount=6&mainName=Fe+atom&secondName=C+atom&show=both`
- **Particle diagram of an ionic solid (NaCl lattice)** — A lattice of alternating large light gray negative ions and small dark gray positive ions, with a key naming them Cl⁻ and Na⁺  
  file: `public/tools/figure-library/chemistry/particle-diagram/particle-diagram-ionic-solid-lattice-nacl.svg`  
  open: `/tools/figures/chemistry/particle-diagram?layout=lattice&columns=6&second=%7B%22size%22%3A%22s%22%2C%22shade%22%3A%22dark%22%2C%22charge%22%3A%22%2B%22%7D&mainName=Cl%E2%81%BB+ion&secondName=Na%E2%81%BA+ion&show=both`
- **Particle diagram with a key of each atom (H₂O and CO₂)** — A box of bent molecules of one gray and two white atoms and linear molecules of one black and two gray atoms, with a key listing a gray O atom, a white H atom and a black C atom  
  file: `public/tools/figure-library/chemistry/particle-diagram/particle-diagram-key-of-each-atom-water-and-carbon-dioxide.svg`  
  open: `/tools/figures/chemistry/particle-diagram?particles=%5B%7B%22count%22%3A4%2C%22shape%22%3A%22bent%22%2C%22look%22%3A%7B%22size%22%3A%22m%22%2C%22shade%22%3A%22gray%22%2C%22charge%22%3A%22%22%7D%2C%22outer%22%3A%7B%22size%22%3A%22s%22%2C%22shade%22%3A%22white%22%2C%22charge%22%3A%22%22%7D%7D%2C%7B%22count%22%3A4%2C%22shape%22%3A%22line%22%2C%22look%22%3A%7B%22size%22%3A%22m%22%2C%22shade%22%3A%22black%22%2C%22charge%22%3A%22%22%7D%2C%22outer%22%3A%7B%22size%22%3A%22m%22%2C%22shade%22%3A%22gray%22%2C%22charge%22%3A%22%22%7D%7D%5D&seed=4&show=both&keyList=atoms&atomNames=%5B%7B%22look%22%3A%7B%22size%22%3A%22m%22%2C%22shade%22%3A%22gray%22%2C%22charge%22%3A%22%22%7D%2C%22name%22%3A%22O+atom%22%7D%2C%7B%22look%22%3A%7B%22size%22%3A%22s%22%2C%22shade%22%3A%22white%22%2C%22charge%22%3A%22%22%7D%2C%22name%22%3A%22H+atom%22%7D%2C%7B%22look%22%3A%7B%22size%22%3A%22m%22%2C%22shade%22%3A%22black%22%2C%22charge%22%3A%22%22%7D%2C%22name%22%3A%22C+atom%22%7D%5D`
- **Particle diagram of a mixture of an element and a compound** — A box with linear molecules of one black atom between two light gray atoms, mixed with diatomic molecules of two light gray atoms  
  file: `public/tools/figure-library/chemistry/particle-diagram/particle-diagram-mixture-of-element-and-compound.svg`  
  open: `/tools/figures/chemistry/particle-diagram?particles=%5B%7B%22count%22%3A4%2C%22shape%22%3A%22line%22%2C%22look%22%3A%7B%22size%22%3A%22m%22%2C%22shade%22%3A%22black%22%2C%22charge%22%3A%22%22%7D%2C%22outer%22%3A%7B%22size%22%3A%22m%22%2C%22shade%22%3A%22light%22%2C%22charge%22%3A%22%22%7D%7D%2C%7B%22count%22%3A4%2C%22shape%22%3A%22pair%22%2C%22look%22%3A%7B%22size%22%3A%22m%22%2C%22shade%22%3A%22light%22%2C%22charge%22%3A%22%22%7D%2C%22outer%22%3A%7B%22size%22%3A%22m%22%2C%22shade%22%3A%22light%22%2C%22charge%22%3A%22%22%7D%7D%5D&seed=5`
- **Particle diagram of a mixture of two elements** — A box of scattered particles: single large dark gray atoms mixed with pairs of small white atoms joined as diatomic molecules  
  file: `public/tools/figure-library/chemistry/particle-diagram/particle-diagram-mixture-of-two-elements.svg`  
  open: `/tools/figures/chemistry/particle-diagram?particles=%5B%7B%22count%22%3A5%2C%22shape%22%3A%22single%22%2C%22look%22%3A%7B%22size%22%3A%22l%22%2C%22shade%22%3A%22dark%22%2C%22charge%22%3A%22%22%7D%2C%22outer%22%3A%7B%22size%22%3A%22s%22%2C%22shade%22%3A%22white%22%2C%22charge%22%3A%22%22%7D%7D%2C%7B%22count%22%3A5%2C%22shape%22%3A%22pair%22%2C%22look%22%3A%7B%22size%22%3A%22s%22%2C%22shade%22%3A%22white%22%2C%22charge%22%3A%22%22%7D%2C%22outer%22%3A%7B%22size%22%3A%22s%22%2C%22shade%22%3A%22white%22%2C%22charge%22%3A%22%22%7D%7D%5D&seed=7`
- **Particle diagram of a pure compound (water molecules)** — A box of eight bent molecules, each a large gray atom with two small white atoms, like water  
  file: `public/tools/figure-library/chemistry/particle-diagram/particle-diagram-pure-compound-water-molecules.svg`  
  open: `/tools/figures/chemistry/particle-diagram?particles=%5B%7B%22count%22%3A8%2C%22shape%22%3A%22bent%22%2C%22look%22%3A%7B%22size%22%3A%22l%22%2C%22shade%22%3A%22gray%22%2C%22charge%22%3A%22%22%7D%2C%22outer%22%3A%7B%22size%22%3A%22s%22%2C%22shade%22%3A%22white%22%2C%22charge%22%3A%22%22%7D%7D%5D&seed=3`
- **Particle diagram of a pure element (diatomic molecules)** — A box of seven diatomic molecules, each two medium gray atoms joined together  
  file: `public/tools/figure-library/chemistry/particle-diagram/particle-diagram-pure-element-diatomic-molecules.svg`  
  open: `/tools/figures/chemistry/particle-diagram?particles=%5B%7B%22count%22%3A7%2C%22shape%22%3A%22pair%22%2C%22look%22%3A%7B%22size%22%3A%22m%22%2C%22shade%22%3A%22gray%22%2C%22charge%22%3A%22%22%7D%2C%22outer%22%3A%7B%22size%22%3A%22m%22%2C%22shade%22%3A%22gray%22%2C%22charge%22%3A%22%22%7D%7D%5D&seed=11`
- **Particle diagram of a substitutional alloy (brass)** — A lattice of light gray copper atoms with some replaced by dark gray zinc atoms of similar size, with a key  
  file: `public/tools/figure-library/chemistry/particle-diagram/particle-diagram-substitutional-alloy-brass.svg`  
  open: `/tools/figures/chemistry/particle-diagram?layout=lattice&pattern=substitute&rows=5&columns=6&main=%7B%22size%22%3A%22l%22%2C%22shade%22%3A%22light%22%2C%22charge%22%3A%22%22%7D&second=%7B%22size%22%3A%22l%22%2C%22shade%22%3A%22dark%22%2C%22charge%22%3A%22%22%7D&secondCount=8&mainName=Cu+atom&secondName=Zn+atom&show=both`

## chemistry / ph-reading

- **Analog pH meter reading 8.46** — An analog pH meter whose needle points to 8.46 on a 0 to 14 dial, with a magnified view of the needle  
  file: `public/tools/figure-library/chemistry/ph-reading/analog-ph-meter-reading-8-46.svg`  
  open: `/tools/figures/chemistry/ph-reading?instrument=analog&reading=8.46`
- **pH meter reading 3.27** — A digital pH meter with its electrode in a beaker, the display reading pH 3.27  
  file: `public/tools/figure-library/chemistry/ph-reading/ph-meter-reading-3-27.svg`  
  open: `/tools/figures/chemistry/ph-reading?reading=3.27`
- **pH paper showing an acid: pH 2** — A strip of universal indicator paper turned red, above a pH color chart from 0 to 14, matching pH 2  
  file: `public/tools/figure-library/chemistry/ph-reading/ph-paper-acid-ph-2.svg`  
  open: `/tools/figures/chemistry/ph-reading?instrument=paper&reading=2`
- **pH paper showing a base: pH 11** — A strip of universal indicator paper turned deep blue, above a pH color chart from 0 to 14, matching pH 11  
  file: `public/tools/figure-library/chemistry/ph-reading/ph-paper-base-ph-11.svg`  
  open: `/tools/figures/chemistry/ph-reading?instrument=paper&reading=11`

## chemistry / photoelectron-spectrum

- **Identify the element from its photoelectron spectrum** — An unnamed element’s photoelectron spectrum with five peaks and blank lines in place of the sublevel labels  
  file: `public/tools/figure-library/chemistry/photoelectron-spectrum/identify-the-element-from-its-photoelectron-spectrum.svg`  
  open: `/tools/figures/chemistry/photoelectron-spectrum?z=17&sublevels=blank&names=0`
- **PES comparing magnesium and sodium** — Photoelectron spectra of magnesium, solid, and sodium, dashed and gray behind it, with a key naming each  
  file: `public/tools/figure-library/chemistry/photoelectron-spectrum/pes-comparing-sodium-and-magnesium.svg`  
  open: `/tools/figures/chemistry/photoelectron-spectrum?z=12&compare=11`
- **Photoelectron spectrum of calcium on a broken axis, in eV** — The photoelectron spectrum of calcium drawn as bars on a broken binding energy axis in eV, with six sublevel labels  
  file: `public/tools/figure-library/chemistry/photoelectron-spectrum/photoelectron-spectrum-of-calcium-broken-axis-ev.svg`  
  open: `/tools/figures/chemistry/photoelectron-spectrum?z=20&unit=eV&scale=broken&peaks=bars`
- **Photoelectron spectrum of iron** — The photoelectron spectrum of iron with seven peaks from 1s² to 4s², the 3d⁶ peak just left of the 4s² peak  
  file: `public/tools/figure-library/chemistry/photoelectron-spectrum/photoelectron-spectrum-of-iron.svg`  
  open: `/tools/figures/chemistry/photoelectron-spectrum?z=26&scale=broken&counts=1`
- **PES of neon with binding energies** — The photoelectron spectrum of neon with three peaks, 1s², 2s² and 2p⁶, each labeled with its binding energy in MJ/mol  
  file: `public/tools/figure-library/chemistry/photoelectron-spectrum/photoelectron-spectrum-of-neon-with-binding-energies.svg`  
  open: `/tools/figures/chemistry/photoelectron-spectrum?z=10&counts=1&energies=1`
- **Photoelectron spectrum (PES) of sodium** — The photoelectron spectrum of sodium: four peaks labeled 1s², 2s², 2p⁶ and 3s¹, binding energy in MJ/mol decreasing from left to right on a logarithmic axis  
  file: `public/tools/figure-library/chemistry/photoelectron-spectrum/photoelectron-spectrum-of-sodium.svg`  
  open: `/tools/figures/chemistry/photoelectron-spectrum?counts=1`

## chemistry / potential-energy-diagram

- **Activation energy with and without an enzyme** — Energy diagram with no numbers on its axes: a reaction’s path without an enzyme and a lower dashed path with an enzyme, each activation energy marked  
  file: `public/tools/figure-library/chemistry/potential-energy-diagram/activation-energy-with-and-without-an-enzyme.svg`  
  open: `/tools/figures/chemistry/potential-energy-diagram?catalyst=1&catTs=90&uncatName=Without+enzyme&catName=With+enzyme&dhArrow=0&axes=shape&yTitle=Potential+energy&xEndCap=triangle&yEndCap=triangle`
- **Enthalpy level diagram for the Haber process** — Energy level diagram with N₂ + 3H₂ on a line at 0 kJ and 2NH₃ on a lower line at −92 kJ, with an arrow labeled ΔH = −92 kJ between them  
  file: `public/tools/figure-library/chemistry/potential-energy-diagram/enthalpy-level-diagram-haber-process.svg`  
  open: `/tools/figures/chemistry/potential-energy-diagram?style=levels&levels=0_100_-92&unit=kj&dhLabel=value&reactantsLabel=N_2+%2B+3H_2&productsLabel=2NH_3&yFrom=-100&yTo=20&yStep=10&yTitle=Potential+energy+%28kJ%29`
- **Potential energy diagram of an endothermic reaction** — Potential energy diagram of an endothermic reaction: products higher than the reactants, with arrows for Ea, the reverse Ea and ΔH  
  file: `public/tools/figure-library/chemistry/potential-energy-diagram/potential-energy-diagram-endothermic-reaction.svg`  
  open: `/tools/figures/chemistry/potential-energy-diagram?levels=20_150_80&revEaArrow=1`
- **Potential energy diagram of an exothermic reaction** — Potential energy diagram of an exothermic reaction: reactants at 50 kJ/mol, a transition state at 150 kJ/mol and products at 20 kJ/mol, with arrows labeled Ea = 100 kJ/mol and ΔH = −30 kJ/mol  
  file: `public/tools/figure-library/chemistry/potential-energy-diagram/potential-energy-diagram-exothermic-reaction.svg`  
  open: `/tools/figures/chemistry/potential-energy-diagram?eaLabel=value&dhLabel=value`
- **Potential energy diagram with and without a catalyst** — Potential energy diagram of an exothermic reaction with a dashed catalysed path over a lower transition state, the activation energies of both paths marked, and a key  
  file: `public/tools/figure-library/chemistry/potential-energy-diagram/potential-energy-diagram-with-and-without-a-catalyst.svg`  
  open: `/tools/figures/chemistry/potential-energy-diagram?catalyst=1`
- **Potential energy diagram worksheet: which arrow shows ΔH?** — Potential energy diagram of an exothermic reaction with three arrows lettered A, B and C for the activation energy, ΔH and the reverse activation energy  
  file: `public/tools/figure-library/chemistry/potential-energy-diagram/potential-energy-diagram-worksheet-label-the-arrows.svg`  
  open: `/tools/figures/chemistry/potential-energy-diagram?eaLabel=mark&dhLabel=mark&revEaArrow=1&revEaLabel=mark`
- **Two-step reaction energy profile with an intermediate** — Reaction energy profile of a two-step mechanism: two transition states with an intermediate in the dip between them, each step’s Ea marked, and ΔH  
  file: `public/tools/figure-library/chemistry/potential-energy-diagram/two-step-reaction-energy-profile-with-intermediate.svg`  
  open: `/tools/figures/chemistry/potential-energy-diagram?levels=40_120_70_100_10&yTo=160`

## chemistry / temperature-reading

- **Digital thermometer reading 78.4 °C** — A digital thermometer with its steel probe in a beaker, the meter reading 78.4 °C  
  file: `public/tools/figure-library/chemistry/temperature-reading/digital-thermometer-reading-78-4-celsius.svg`  
  open: `/tools/figures/chemistry/temperature-reading?instrument=digital&reading=78.4`
- **Fahrenheit thermometer reading 98.6 °F** — A liquid-in-glass thermometer in degrees Fahrenheit, marked every 2 °F, reading 98.6 °F  
  file: `public/tools/figure-library/chemistry/temperature-reading/fahrenheit-thermometer-reading-98-6-f.svg`  
  open: `/tools/figures/chemistry/temperature-reading?unit=fahrenheit&reading=98.6`
- **Kelvin thermometer reading 295.4 K** — A liquid-in-glass thermometer in kelvins, reading 295.4 K  
  file: `public/tools/figure-library/chemistry/temperature-reading/kelvin-thermometer-reading-295-4-k.svg`  
  open: `/tools/figures/chemistry/temperature-reading?unit=kelvin&reading=295.4&tint=gray`
- **Thermometer reading 22.6 °C** — A liquid-in-glass thermometer with red liquid reading 22.6 °C, with a magnified view of the top of the column  
  file: `public/tools/figure-library/chemistry/temperature-reading/thermometer-reading-22-6-celsius.svg`  
  open: `/tools/figures/chemistry/temperature-reading?reading=22.6`
- **Thermometer reading below zero: −4.5 °C** — A liquid-in-glass thermometer with blue liquid reading −4.5 °C, below the 0 °C mark  
  file: `public/tools/figure-library/chemistry/temperature-reading/thermometer-reading-below-zero-minus-4-5-celsius.svg`  
  open: `/tools/figures/chemistry/temperature-reading?reading=-4.5&tint=blue`

## chemistry / titration-curve

- **Strong acid–strong base titration curve** — Titration curve of 25.0 mL of 0.100 M HCl with 0.100 M NaOH, with the equivalence point at 25 mL and pH 7 marked  
  file: `public/tools/figure-library/chemistry/titration-curve/strong-acid-strong-base-titration-curve.svg`  
  open: `/tools/figures/chemistry/titration-curve?analyte=strong-acid`
- **Strong base–strong acid titration curve** — Titration curve of 25.0 mL of 0.100 M NaOH with 0.100 M HCl, the pH falling from about 13 to about 1.5, with the equivalence point marked  
  file: `public/tools/figure-library/chemistry/titration-curve/strong-base-strong-acid-titration-curve.svg`  
  open: `/tools/figures/chemistry/titration-curve?analyte=strong-base&xTitle=Volume+of+HCl+added+%28mL%29`
- **Titration curve worksheet: find the equivalence point** — Titration curve of a weak acid with NaOH, with the equivalence and half-equivalence points marked by dots and blank lines for students to label  
  file: `public/tools/figure-library/chemistry/titration-curve/titration-curve-worksheet-label-the-equivalence-point.svg`  
  open: `/tools/figures/chemistry/titration-curve?analyteM=0.15&analyteMl=20&titrantM=0.12&pKa=3.75&eqLabelMode=blank&halfMark=guides&halfLabelMode=blank&xTo=40`
- **Weak acid–strong base titration curve** — Titration curve of 25.0 mL of 0.100 M acetic acid with 0.100 M NaOH, with the half-equivalence and equivalence points marked  
  file: `public/tools/figure-library/chemistry/titration-curve/weak-acid-strong-base-titration-curve.svg`  
  open: `/tools/figures/chemistry/titration-curve?halfMark=guides`
- **Weak base–strong acid titration curve** — Titration curve of 25.0 mL of 0.100 M ammonia with 0.100 M HCl, the pH falling, with the equivalence and half-equivalence points marked  
  file: `public/tools/figure-library/chemistry/titration-curve/weak-base-strong-acid-titration-curve.svg`  
  open: `/tools/figures/chemistry/titration-curve?analyte=weak-base&halfMark=guides&xTitle=Volume+of+HCl+added+%28mL%29`

## chemistry / volume-by-displacement

- **Volume of a cube in cm³, on a scale marked every 2 cm³** — Two 100 cm³ graduated cylinders marked every 2 cm³: water at 46.0 cm³ before, and at 61.0 cm³ after a cube is added  
  file: `public/tools/figure-library/chemistry/volume-by-displacement/water-displacement-cube-100-cm3-graduated-cylinder-2-cm3-marks.svg`  
  open: `/tools/figures/chemistry/volume-by-displacement?size=100&marks=2&numbers=20&unit=cm3&before=46&after=61&object=cube`
- **Volume of 3 marbles by water displacement** — Two 25 mL graduated cylinders: water at 12.00 mL before, and at 15.50 mL after three marbles are added  
  file: `public/tools/figure-library/chemistry/volume-by-displacement/water-displacement-marbles-25-ml-graduated-cylinder.svg`  
  open: `/tools/figures/chemistry/volume-by-displacement?size=25&before=12&after=15.5&marbles=3`
- **Volume of a metal cube by water displacement** — Two 50 mL graduated cylinders with magnified views: water at 20.0 mL before, and at 28.0 mL after a cube is added  
  file: `public/tools/figure-library/chemistry/volume-by-displacement/water-displacement-metal-cube-50-ml-graduated-cylinder.svg`  
  open: `/tools/figures/chemistry/volume-by-displacement?size=50&before=20&after=28&object=cube&view=both`
- **Volume of a metal cylinder by water displacement** — Two 10 mL graduated cylinders: water at 5.20 mL before, and at 7.45 mL after a small metal cylinder is added  
  file: `public/tools/figure-library/chemistry/volume-by-displacement/water-displacement-metal-cylinder-10-ml-graduated-cylinder.svg`  
  open: `/tools/figures/chemistry/volume-by-displacement?before=5.2&after=7.45&object=cylinder`
- **Volume of a rock by water displacement** — Two 100 mL graduated cylinders: water at 50.0 mL before, and at 63.5 mL after a rock is added  
  file: `public/tools/figure-library/chemistry/volume-by-displacement/water-displacement-rock-100-ml-graduated-cylinder.svg`  
  open: `/tools/figures/chemistry/volume-by-displacement?size=100&before=50&after=63.5&object=rock`

## chemistry / volume-reading

- **10 mL graduated cylinder reading 7.36 mL** — A 10 mL graduated cylinder with blue liquid reading 7.36 mL, with a magnified view of the meniscus  
  file: `public/tools/figure-library/chemistry/volume-reading/10-ml-graduated-cylinder-reading-7-36-ml.svg`  
  open: `/tools/figures/chemistry/volume-reading?size=10&reading=7.36&tint=blue`
- **1000 mL graduated cylinder reading 640 mL** — A 1000 mL graduated cylinder with green liquid filled to 640 mL, marked every 10 mL  
  file: `public/tools/figure-library/chemistry/volume-reading/1000-ml-graduated-cylinder-reading-640-ml.svg`  
  open: `/tools/figures/chemistry/volume-reading?size=1000&reading=640&view=whole&tint=green`
- **25 cm³ graduated cylinder reading 18.25 cm³** — A 25 cm³ graduated cylinder reading 18.25 cm³, with a dotted line from the bottom of the meniscus to the marks and a magnified view  
  file: `public/tools/figure-library/chemistry/volume-reading/25-cm3-graduated-cylinder-reading-18-25-cm3.svg`  
  open: `/tools/figures/chemistry/volume-reading?size=25&unit=cm3&reading=18.25&guide=1`
- **250 mL beaker reading 160 mL** — A 250 mL beaker with red liquid at 160 mL, between its 150 and 175 mL marks  
  file: `public/tools/figure-library/chemistry/volume-reading/beaker-reading-160-ml.svg`  
  open: `/tools/figures/chemistry/volume-reading?instrument=beaker&reading=160&tint=red`
- **Buret reading 12.35 mL** — A 50 mL buret reading 12.35 mL, with a magnified view of the meniscus between the 12 and 13 mL marks  
  file: `public/tools/figure-library/chemistry/volume-reading/buret-reading-12-35-ml.svg`  
  open: `/tools/figures/chemistry/volume-reading?instrument=buret&reading=12.35`
- **Graduated cylinder reading 34.5 mL** — A 100 mL graduated cylinder filled to 34.5 mL, with a magnified view of the meniscus between the 30 and 40 mL marks  
  file: `public/tools/figure-library/chemistry/volume-reading/graduated-cylinder-reading-34-5-ml.svg`  
  open: `/tools/figures/chemistry/volume-reading?reading=34.5`
- **Meniscus close-up: 50 mL graduated cylinder at 26.0 mL** — A magnified view of a meniscus in a 50 mL graduated cylinder, its bottom resting on the 26 mL mark  
  file: `public/tools/figure-library/chemistry/volume-reading/meniscus-close-up-50-ml-graduated-cylinder-26-0-ml.svg`  
  open: `/tools/figures/chemistry/volume-reading?size=50&reading=26&view=magnifier&span=4`

## economics / ad-as

- **AD–AS graph worksheet: label an inflationary gap** — Black and white AD–AS graph of price level against real GDP with no numbers on the axes: a vertical line, a downward-sloping line and an upward-sloping line, the last two crossing at a dot to the right of the vertical line, with dashed lines from the dot to both axes; blank lines for students to write on beside each line, the dot, the price level at the axis, the two outputs at the real GDP axis, and under a brace below the axis between the vertical line and the dashed line  
  file: `public/tools/figure-library/economics/ad-as/ad-as-graph-worksheet-label-inflationary-gap.svg`  
  open: `/tools/figures/economics/ad-as?start=inflation&adLabelMode=blank&asLabelMode=blank&lrasLabelMode=blank&eLabelMode=blank&plLabelMode=blank&gdpLabelMode=blank&yfLabelMode=blank&inflationLabelMode=blank&ink=bw`
- **Long-run self-adjustment from a recessionary gap on the AD–AS graph (SRAS shifts right)** — AD–AS graph of price level against real GDP with no numbers on the axes: a downward-sloping blue AD line, a vertical green LRAS line, and a red SRAS₁ line crossing AD at a dot labeled E₁, to the left of LRAS; an arrow points right to SRAS₂, which crosses AD lower down on LRAS at a dot labeled E₂. Dashed lines run from E₁ to both axes and from E₂ to the price level axis, marked PL₁ and the lower PL₂ on the price level axis and Y₁ and Yf on the real GDP axis, and a brace under the axis from Y₁ to Yf is labeled Recessionary gap  
  file: `public/tools/figure-library/economics/ad-as/ad-as-long-run-self-adjustment-recessionary-gap-sras-shift-right.svg`  
  open: `/tools/figures/economics/ad-as?start=recession&srasShift=full`
- **Negative supply shock on the AD–AS graph: SRAS shifts left (stagflation)** — AD–AS graph of price level against real GDP with no numbers on the axes: a downward-sloping blue AD line, a vertical green LRAS line, and a red SRAS₁ line crossing AD on LRAS at a dot labeled E₁; two arrows point left to SRAS₂, which crosses AD higher up and to the left of LRAS at a dot labeled E₂. Dashed lines to the axes mark PL₁ and PL₂ on the price level axis and Y₂ and Yf on the real GDP axis, and a brace under the axis from Y₂ to Yf is labeled Recessionary gap  
  file: `public/tools/figure-library/economics/ad-as/ad-as-negative-supply-shock-stagflation-sras-shift-left.svg`  
  open: `/tools/figures/economics/ad-as?srasShift=left`
- **Numbered AD–AS graph from a schedule: equilibrium at price level 90 and real GDP 8,800** — AD–AS graph on numbered axes with gridlines, price level from 60 to 140 by 10 and real GDP from 6,000 to 10,500, numbered every 1,000: a blue AD line falling through a dot at each row of the schedule, from 6,400 at a price level of 130 to 10,000 at 70; a red AS curve rising through its dots from 6,500 at 70, steepening to 9,900 at 130; and a vertical green line at 9,500 labeled Potential GDP. A callout with an arrow to where AD and AS cross reads price level = 90, real GDP = 8,800, and a brace under the axis from Yₑ at 8,800 to Yf at 9,500 is labeled Recessionary gap  
  file: `public/tools/figure-library/economics/ad-as/ad-as-numbered-graph-from-schedule-price-level-real-gdp.svg`  
  open: `/tools/figures/economics/ad-as?callout=1&guides=0&asLabel=AS&lrasLabel=Potential+GDP&eLabelMode=none&look=numeric`
- **AD–AS graph of a recessionary gap closed by expansionary fiscal policy (AD shifts right)** — AD–AS graph of price level against real GDP with no numbers on the axes: a vertical green LRAS line, an upward-sloping red SRAS line, and a blue AD₁ line crossing SRAS at a dot labeled E₁, to the left of LRAS; two arrows point right to AD₂, which crosses SRAS on LRAS at a dot labeled E₂. Dashed lines run from E₁ to both axes and from E₂ to the price level axis, marked PL₁ and PL₂ on the price level axis and Y₁ and Yf on the real GDP axis, and a brace under the axis from Y₁ to Yf is labeled Recessionary gap  
  file: `public/tools/figure-library/economics/ad-as/ad-as-recessionary-gap-expansionary-fiscal-policy.svg`  
  open: `/tools/figures/economics/ad-as?start=recession&adShift=full`

## economics / business-cycle

- **Business cycle graph: peak, trough, expansion and contraction** — Business cycle graph with Real GDP up the side, Time along the bottom and no numbers on the axes: a blue wave of real GDP rising from a dashed, upward-sloping long-run trend line to a high point labeled Peak, falling to a low point labeled Trough, then rising to a second, higher Peak and turning down, with an arrow to the fall after the first peak labeled Contraction and an arrow to the rise before the second peak labeled Expansion  
  file: `public/tools/figure-library/economics/business-cycle/business-cycle-graph-peak-trough-expansion-contraction.svg`  
  open: `/tools/figures/economics/business-cycle`
- **Phases of the business cycle: expansion, peak, contraction, recession, trough and recovery** — Business cycle graph with Real GDP up the side, Time along the bottom and no numbers on the axes: a blue wave of real GDP around a dashed, upward-sloping trend line, with two high points labeled Peak and a low point labeled Trough; on the fall after the first peak, an arrow from above labeled Contraction and an arrow from below labeled Recession; on the rise after the trough, arrows labeled Recovery near the trough and Expansion near the second peak; and an arrow up to the dashed line labeled Long-run trend  
  file: `public/tools/figure-library/economics/business-cycle/business-cycle-phases-graph-recession-recovery-long-run-trend.svg`  
  open: `/tools/figures/economics/business-cycle?recessionLabelMode=text&recoveryLabelMode=text&trendLabelMode=text`
- **Business cycle quiz: identify the phases at letters A to G** — Business cycle graph with Real GDP up the side, Time along the bottom and no numbers on the axes: a blue wave of real GDP around a dashed, upward-sloping trend line, with letters A to G from left to right, A an arrow to the first rise, B a dot at the first peak, C an arrow to the fall after it, D a dot at the trough, E an arrow to the next rise, F a dot at the second peak and G an arrow to the fall at the end  
  file: `public/tools/figure-library/economics/business-cycle/business-cycle-quiz-identify-the-phases-letters.svg`  
  open: `/tools/figures/economics/business-cycle?style=letters&every=1&dots=1`
- **Business cycle graph with recessions shaded and irregular cycles** — Business cycle graph with Real GDP up the side, Time along the bottom and no numbers on the axes: a blue wave of real GDP with three peaks and three troughs of different heights and spacing, each labeled Peak or Trough, each higher than the last as the dashed long-run trend rises, gray bands shading each fall from a peak to the next trough, an arrow to the first fall labeled Recession, an arrow to the rise before the second peak labeled Expansion, and an arrow down to the dashed line labeled Long-run trend  
  file: `public/tools/figure-library/economics/business-cycle/business-cycle-recessions-shaded-irregular-cycles.svg`  
  open: `/tools/figures/economics/business-cycle?cycles=3&irregularity=0.6&seed=8&shade=1&contractionLabelMode=none&recessionLabelMode=text&trendLabelMode=text`
- **Business cycle worksheet: label the peaks, trough, expansion and contraction** — Black and white business cycle graph with Real GDP up the side, Time along the bottom and no numbers on the axes: a wave of real GDP around a dashed, upward-sloping trend line, with a dot and a blank line above each of the two peaks, a dot and a blank line below the trough, and arrows with blank lines pointing to the fall after the first peak and to the rise before the second peak  
  file: `public/tools/figure-library/economics/business-cycle/business-cycle-worksheet-blank-labels-peak-trough.svg`  
  open: `/tools/figures/economics/business-cycle?dots=1&peakLabelMode=blank&troughLabelMode=blank&expansionLabelMode=blank&contractionLabelMode=blank&ink=bw`

## economics / cost-revenue-curves

- **Cost curves graph: MC, ATC, AVC and AFC** — Graph of Price and costs against Quantity with no numbers on the axes: a red MC curve that dips and then rises steeply, a U-shaped green ATC curve, a U-shaped purple AVC curve below it, and a dashed orange AFC curve falling all the way across. MC passes through the lowest points of AVC and ATC, each marked with a dot, and the gap between ATC and AVC narrows as quantity grows.  
  file: `public/tools/figure-library/economics/cost-revenue-curves/cost-curves-graph-mc-atc-avc-afc.svg`  
  open: `/tools/figures/economics/cost-revenue-curves?afc=1`
- **Monopolistic competition long-run equilibrium graph with excess capacity** — Graph of Price and costs against Quantity with no numbers on the axes: a downward-sloping demand curve D = AR just touching a U-shaped ATC curve at a dot, a dashed MR curve, and MC crossing MR directly below the dot. Dashed lines run from the dot to Pₑ on the price axis and qₑ on the quantity axis, and from a dot at the lowest point of ATC, where MC crosses it, down to q with the subscript min ATC. A brace under the quantity axis from qₑ to q min ATC is labeled Excess capacity.  
  file: `public/tools/figure-library/economics/cost-revenue-curves/monopolistic-competition-long-run-equilibrium-graph-excess-capacity.svg`  
  open: `/tools/figures/economics/cost-revenue-curves?graph=monopolistic&run=long`
- **Monopoly graph with profit, consumer surplus and deadweight loss** — Graph of Price and costs against Quantity with no numbers on the axes: a downward-sloping demand curve D = AR, a dashed marginal revenue curve MR twice as steep, and MC and ATC curves. A dot on demand above where MR meets MC, with dashed lines to PM on the price axis and QM on the quantity axis (the M a subscript). Shaded: a blue triangle labeled CS under demand above PM, a green rectangle labeled Profit between PM and a dashed line at ATC on the price axis, and an orange triangle labeled DWL between demand and MC from QM to where they cross.  
  file: `public/tools/figure-library/economics/cost-revenue-curves/monopoly-graph-profit-consumer-surplus-deadweight-loss.svg`  
  open: `/tools/figures/economics/cost-revenue-curves?graph=monopoly&cs=1&dwl=1`
- **Regulated natural monopoly graph: socially optimal (P = MC) and fair-return (P = ATC) prices** — Graph of Price and costs against Quantity with no numbers on the axes: demand D = AR, a dashed MR curve, and MC and ATC curves, ATC still falling where demand crosses MC. Three dots on demand, each with dashed lines to both axes: PM and QM above where MR meets MC; PFR and QFR where demand crosses ATC the second time; and PSO and QSO where demand crosses MC, the lowest price and the largest quantity (M, FR and SO subscripts).  
  file: `public/tools/figure-library/economics/cost-revenue-curves/natural-monopoly-regulation-graph-socially-optimal-fair-return-price.svg`  
  open: `/tools/figures/economics/cost-revenue-curves?graph=monopoly&atcQ=7.5&atcCost=3.25&mcSlope=0.7&fixed=0.9&demandTop=9.6&demandEnd=7.4&regulation=both&profit=0`
- **Perfect competition short-run loss graph with blank labels (worksheet)** — Graph of Price and costs against Quantity with no numbers on the axes and every label a blank line: red MC, green ATC and purple AVC curves, each with a blank at its end, and a blue horizontal price line with a blank, between the lowest points of AVC and ATC. MC meets the price line at a dot with a dashed line down to a blank on the quantity axis. A red rectangle with a blank inside lies between the price line and a dashed line at ATC, and the price and ATC each have a blank at the price axis. Arrows from two more blanks point to dots at the lowest points of AVC and ATC.  
  file: `public/tools/figure-library/economics/cost-revenue-curves/perfect-competition-short-run-loss-graph-blank-labels-worksheet.svg`  
  open: `/tools/figures/economics/cost-revenue-curves?graph=perfect&price=loss&mcLabelMode=blank&atcLabelMode=blank&avcLabelMode=blank&priceLineLabelMode=blank&pLabelMode=blank&qFirmLabelMode=blank&costLabelMode=blank&profitLabelMode=blank&lossLabelMode=blank&breakEvenLabelMode=blank&shutdownLabelMode=blank`
- **Perfect competition side-by-side graphs: market and firm making an economic profit** — Side-by-side graphs with no numbers on the axes. Left, labeled Market: supply S and demand D crossing at a dot, with dashed lines to Pₑ on the Price axis and Qₑ on the Quantity axis. The dashed line at Pₑ runs across to the right graph, labeled Firm, where it becomes the horizontal price line D = MR = AR = P. On the firm’s graph of Price and costs against Quantity, MC, ATC and AVC curves, MC meeting the price line at a dot above qₑ, a green rectangle labeled Profit between the price line and a dashed line at ATC on the price axis, and arrows to dots labeled Shutdown point, at the lowest AVC, and Break-even point, at the lowest ATC.  
  file: `public/tools/figure-library/economics/cost-revenue-curves/perfect-competition-side-by-side-graphs-market-and-firm-profit.svg`  
  open: `/tools/figures/economics/cost-revenue-curves?graph=perfect&market=1`

## economics / money-markets

- **Loanable funds graph: crowding out from government deficit spending** — Loanable funds market graph with no numbers on the axes, Real interest rate up the side and Quantity of loanable funds along the bottom: an upward-sloping supply curve labeled SLF (red), a downward-sloping demand curve DLF₁ (blue) and a second demand curve DLF₂ to its right, two arrows pointing right from DLF₁ to DLF₂, and dashed lines from both equilibria to r₁ and the higher r₂ on the vertical axis and to Q₁ and Q₂ on the horizontal axis  
  file: `public/tools/figure-library/economics/money-markets/loanable-funds-graph-crowding-out-deficit-spending.svg`  
  open: `/tools/figures/economics/money-markets?graph=funds&shift=demand`
- **Ample reserves graph: the Fed lowers its administered rates** — Market for reserves graph with no numbers on the axes, Policy rate up the side and Quantity of reserves along the bottom: a demand for reserves curve DR₁ (blue) flat at the top, sloping down, then flat along the bottom, a second curve DR₂ with both flat parts lower, its slope on the same line as DR₁’s, each curve named both at its flat top by the vertical axis and at the end of its flat bottom, two arrows pointing down from DR₁ to DR₂ on their flat parts, a vertical supply of reserves curve SR (red) crossing both flat bottoms, dashed lines across to PR₁ and the lower PR₂ on the vertical axis, and Q₁ under SR  
  file: `public/tools/figure-library/economics/money-markets/market-for-reserves-graph-ample-reserves-lower-administered-rates.svg`  
  open: `/tools/figures/economics/money-markets?graph=reserves&shift=demand&demandDir=decrease`
- **Limited reserves graph: an open-market purchase lowers the policy rate** — Market for reserves graph with no numbers on the axes, Policy rate up the side and Quantity of reserves along the bottom: a demand for reserves curve DR (blue) flat at the top, sloping down, then flat along the bottom, a vertical supply of reserves curve SR₁ (red) crossing its sloping part and a second vertical curve SR₂ to the right, also on the slope, two arrows pointing right from SR₁ to SR₂, dashed lines across to PR₁ and the lower PR₂ on the vertical axis, and Q₁ and Q₂ under the two supply curves  
  file: `public/tools/figure-library/economics/money-markets/market-for-reserves-graph-limited-reserves-open-market-purchase.svg`  
  open: `/tools/figures/economics/money-markets?graph=reserves&regime=limited&shift=supply`
- **Money market graph: an increase in the money supply (open-market purchase)** — Money market graph with no numbers on the axes, Nominal interest rate up the side and Quantity of money along the bottom: a downward-sloping money demand curve labeled MD (blue), a vertical money supply curve MS₁ (red) and a second vertical curve MS₂ to its right, with two arrows pointing right from MS₁ to MS₂, dashed lines across from where each crosses MD to i₁ and the lower i₂ on the vertical axis, and Q₁ and Q₂ under the two supply curves  
  file: `public/tools/figure-library/economics/money-markets/money-market-graph-increase-in-money-supply.svg`  
  open: `/tools/figures/economics/money-markets?shift=supply`
- **Money market graph worksheet: label an increase in money demand** — Black and white money market graph with no numbers on the axes, Nominal interest rate up the side and Quantity of money along the bottom: a vertical money supply curve, a downward-sloping money demand curve and a second demand curve to its right, two arrows pointing right between the demand curves, dashed lines across to two interest rates on the vertical axis, and blank lines for students to write the name of each curve, both interest rates and the quantity  
  file: `public/tools/figure-library/economics/money-markets/money-market-graph-worksheet-blank-labels-increase-in-money-demand.svg`  
  open: `/tools/figures/economics/money-markets?shift=demand&msLabelMode=blank&mdLabelMode=blank&iLabelMode=blank&qLabelMode=blank&ink=bw`

## economics / phillips-curve

- **Phillips curve: expansionary policy in the short run and the long run (A to B to C)** — Phillips curve graph with no numbers on the axes: point A where the blue curve SRPC₁ crosses the vertical red LRPC; a black arrow up along SRPC₁ to point B, at lower unemployment and higher inflation; a second blue curve SRPC₂ above and to the right of SRPC₁, with two blue arrows from SRPC₁ to it; and a black arrow across from B to point C, where SRPC₂ crosses the LRPC. Dashed lines run from the points to the axes, labeled π₁ and π₂ on the inflation axis and u₁ and uₙ on the unemployment axis  
  file: `public/tools/figure-library/economics/phillips-curve/phillips-curve-expansionary-policy-short-run-long-run-adjustment.svg`  
  open: `/tools/figures/economics/phillips-curve?movement=along&longRun=1`
- **Numbered Phillips curve: contractionary policy and disinflation (A to B to C)** — Phillips curve graph with numbered axes and gridlines, the unemployment rate numbered every 2% up to 14% and the inflation rate every 1% from −2% to 9%, the axes crossing at 0%: point A at 5% unemployment and 6% inflation, where the blue curve SRPC₁ crosses the vertical red LRPC at uₙ; a black arrow down along SRPC₁ to point B at 8% unemployment and 2% inflation; a lower blue curve SRPC₂ that falls below 0% inflation at higher unemployment, with a blue arrow down to it from SRPC₁; and a black arrow across from B to point C at 5% unemployment and 2% inflation. Dashed lines run to the axes, labeled π₁ at 6%, π₂ at 2%, uₙ at 5% and u₁ at 8%  
  file: `public/tools/figure-library/economics/phillips-curve/phillips-curve-numbered-contractionary-policy-disinflation.svg`  
  open: `/tools/figures/economics/phillips-curve?expected=6&u2=8&pi2=2&movement=along&longRun=1&look=numeric`
- **Short-run and long-run Phillips curve graph (SRPC and LRPC)** — Phillips curve graph with no numbers on the axes, Inflation rate up the side and Unemployment rate along the bottom: a blue curve labeled SRPC sloping down and bending, flatter toward the right, crossing a vertical red line labeled LRPC at point A, with a dashed line across from A to the inflation axis, labeled π, and the LRPC meeting the unemployment axis at uₙ  
  file: `public/tools/figure-library/economics/phillips-curve/phillips-curve-short-run-long-run-srpc-lrpc-natural-rate.svg`  
  open: `/tools/figures/economics/phillips-curve`
- **Phillips curve shift after a negative supply shock (stagflation)** — Phillips curve graph with no numbers on the axes: point A where the blue curve SRPC₁ crosses the vertical red LRPC; a second blue curve SRPC₂ above and to the right of SRPC₁, with two blue arrows from SRPC₁ to it; and a black arrow from A up and to the right to point B on SRPC₂, at higher unemployment and higher inflation. Dashed lines run from A and B to the axes, labeled π₁ and π₂ on the inflation axis and uₙ and u₁ on the unemployment axis  
  file: `public/tools/figure-library/economics/phillips-curve/phillips-curve-supply-shock-stagflation-srpc-shift.svg`  
  open: `/tools/figures/economics/phillips-curve?movement=srpc`
- **Phillips curve worksheet: label the short-run and long-run adjustment** — Black and white Phillips curve graph with no numbers, axes titled Inflation rate and Unemployment rate: two short-run Phillips curves sloping down and a vertical long-run Phillips curve; three points, one where the lower short-run curve crosses the vertical line, one up and to the left along that curve, and one where the upper curve crosses the vertical line; arrows from point to point and from the lower curve to the upper one; dashed lines to both axes; and a blank line for students to write each curve’s name, each point’s letter and the two inflation rates and two unemployment rates at the axes  
  file: `public/tools/figure-library/economics/phillips-curve/phillips-curve-worksheet-blank-labels-long-run-adjustment.svg`  
  open: `/tools/figures/economics/phillips-curve?movement=along&longRun=1&srpcLabelMode=blank&lrpcLabelMode=blank&nruLabelMode=blank&aLabelMode=blank&bLabelMode=blank&cLabelMode=blank&piLabelMode=blank&uLabelMode=blank&ink=bw`

## economics / production-possibilities

- **Comparative advantage: two countries’ production possibilities curves side by side** — Two production possibilities graphs side by side on the same scale, each with cloth on the y-axis and wheat on the x-axis: under the first, Country A, a straight blue line labeled PPC from 20 cloth to 40 wheat; under the second, Country B, a straight red line labeled PPC from 30 cloth to 30 wheat, each number written where its line meets the axis  
  file: `public/tools/figure-library/economics/production-possibilities/production-possibilities-curve-comparative-advantage-two-countries.svg`  
  open: `/tools/figures/economics/production-possibilities?countries=side&xTitle=Wheat&yTitle=Cloth`
- **PPC shifting outward: economic growth on a production possibilities curve** — Two bowed-out production possibilities curves with capital goods on the y-axis and consumer goods on the x-axis and no numbers: the inner curve labeled PPC₁ with point A on it, the outer curve labeled PPC₂ with point B on it, and two arrows from the inner curve out to the outer one  
  file: `public/tools/figure-library/economics/production-possibilities/production-possibilities-curve-economic-growth-outward-shift.svg`  
  open: `/tools/figures/economics/production-possibilities?points=A%2Con%2C0.55%3BB%2Con2%2C0.55&shift=both`
- **Production possibilities curve with efficient, inefficient and unattainable points** — Bowed-out production possibilities curve labeled PPC, with capital goods on the y-axis and consumer goods on the x-axis and no numbers: point A on the curve with an arrow from the caption Efficient, point B inside the curve with an arrow from the caption Inefficient, and point C outside the curve with an arrow from the caption Unattainable  
  file: `public/tools/figure-library/economics/production-possibilities/production-possibilities-curve-efficient-inefficient-unattainable-points.svg`  
  open: `/tools/figures/economics/production-possibilities?points=A%2Con%2C0.35%2C%2CEfficient%3BB%2Cinside%2C0.55%2C%2CInefficient%3BC%2Coutside%2C0.7%2C%2CUnattainable`
- **Increasing opportunity cost on a numbered production possibilities curve** — Production possibilities curve on numbered axes with gridlines, capital goods on the y-axis from 0 to 140 and consumer goods on the x-axis from 0 to 110: a bowed-out curve labeled PPC from 120 capital goods to 100 consumer goods, with points A to E on it at 0, 25, 50, 75 and 100 consumer goods and 120, 110, 90, 60 and 0 capital goods, joined by dashed steps labeled −10 and +25, −20 and +25, −30 and +25, and −60 and +25  
  file: `public/tools/figure-library/economics/production-possibilities/production-possibilities-curve-increasing-opportunity-cost-numbered.svg`  
  open: `/tools/figures/economics/production-possibilities?bow=1.5&yMax=120&points=A%2Con%2C0%3BB%2Con%2C0.25%3BC%2Con%2C0.5%3BD%2Con%2C0.75%3BE%2Con%2C1&steps=1&look=numeric`
- **Production possibilities curve worksheet: label the points (guns and butter)** — Black and white production possibilities curve with guns on the y-axis and butter on the x-axis and no numbers: a bowed-out curve with points A and B on it, point C inside it and point D outside it, each with an arrow from a blank line for students to label, and a blank line beside the curve for its name  
  file: `public/tools/figure-library/economics/production-possibilities/production-possibilities-curve-worksheet-blank-labels-guns-and-butter.svg`  
  open: `/tools/figures/economics/production-possibilities?points=A%2Con%2C0.25%2C%2CEfficient%3BB%2Con%2C0.75%2C%2CEfficient%3BC%2Cinside%2C0.35%2C%2CInefficient%3BD%2Coutside%2C0.55%2C%2CUnattainable&captionMode=blank&curveLabelMode=blank&ink=bw&xTitle=Butter&yTitle=Guns`

## economics / supply-demand

- **Supply and demand graph: an increase in demand** — Supply and demand graph with no numbers on the axes, Price up the side and Quantity along the bottom: a downward-sloping blue demand curve D₁ shifting right to D₂, with two arrows between them, and an upward-sloping red supply curve S. The equilibrium moves up along S from E₁ to E₂, each point with dashed lines to the axes labeled P₁ and P₂ on the price axis and Q₁ and Q₂ on the quantity axis  
  file: `public/tools/figure-library/economics/supply-demand/supply-and-demand-graph-increase-in-demand.svg`  
  open: `/tools/figures/economics/supply-demand?shift=demand`
- **Per-unit tax graph: tax incidence, tax revenue and deadweight loss** — Supply and demand graph with no numbers on the axes, Price up the side and Quantity along the bottom: demand D and supply S crossing at E, and a dashed curve S + tax above S. Dashed lines mark Pb and Ps on the price axis, above and below Pₑ, the height of E, which has only a short dash at the axis, and Qt left of Qₑ on the quantity axis. Shaded regions are labeled CS in blue above Pb, Tax revenue in green between Ps and Pb out to Qt, PS in red below Ps, and DWL in orange, written above and right of the small triangle between Qt and Qₑ with an arrow to it  
  file: `public/tools/figure-library/economics/supply-demand/supply-and-demand-per-unit-tax-incidence-deadweight-loss-tax-revenue.svg`  
  open: `/tools/figures/economics/supply-demand?tax=tax&cs=1&ps=1&dwl=1&revenue=1`
- **Price ceiling graph: shortage and deadweight loss** — Supply and demand graph with no numbers on the axes, Price up the side and Quantity along the bottom: demand D and supply S crossing at E, with dashed lines to Pₑ and Qₑ. A horizontal line labeled Price ceiling runs below Pₑ, with dots where it meets S and D and dashed lines down to Qs and Qd, a brace under it between them labeled Shortage, and a shaded triangle between the curves from Qs to Qₑ labeled DWL  
  file: `public/tools/figure-library/economics/supply-demand/supply-and-demand-price-ceiling-shortage-deadweight-loss.svg`  
  open: `/tools/figures/economics/supply-demand?control=ceiling&dwl=1`
- **Supply and demand schedule graph with a price floor and surplus (numbered)** — Numbered supply and demand graph titled Market for milk, Price ($/gallon) from 0 to 3.5 up the side and Gallons (thousands) from 0 to 900 along the bottom, with gridlines: demand D and supply S drawn through dots at each row of a schedule and crossing at E, with dashed lines to Pₑ at 2 and Qₑ at 600. A horizontal line labeled Price floor at 2.5 meets D at 500, marked Qd, and S at 700, marked Qs, with a brace above it between them labeled Surplus  
  file: `public/tools/figure-library/economics/supply-demand/supply-and-demand-schedule-graph-price-floor-surplus.svg`  
  open: `/tools/figures/economics/supply-demand?control=floor&controlPrice=2.5&look=numeric&title=Market+for+milk&titleMode=text&xTitle=Gallons+%28thousands%29&yTitle=Price+%28%24%2Fgallon%29`
- **Supply and demand worksheet: label a decrease in supply** — Black and white supply and demand graph with no numbers on the axes, Price up the side and Quantity along the bottom: a downward-sloping demand curve and an upward-sloping supply curve shifting left, with two arrows from the first supply curve to the second, and two equilibrium points with dashed lines to both axes. Every curve, point, price and quantity has a blank line for students to label  
  file: `public/tools/figure-library/economics/supply-demand/supply-and-demand-worksheet-decrease-in-supply-blank-labels.svg`  
  open: `/tools/figures/economics/supply-demand?shift=supply&supplyDir=decrease&dLabelMode=blank&sLabelMode=blank&eLabelMode=blank&pLabelMode=blank&qLabelMode=blank&ink=bw`

## math / bar-graph

- **Bar graph of favorite sports** — A bar graph titled Favorite sports with a blue column for each of five sports over an axis from 0 to 10 titled Number of students  
  file: `public/tools/figure-library/math/bar-graph/bar-graph-of-favorite-sports.svg`  
  open: `/tools/figures/math/bar-graph?to=10&title=Favorite+sports&titleMode=text&categoryTitle=Sport&categoryTitleMode=text&valueTitle=Number+of+students&valueTitleMode=text&cols=Students&row=Soccer%7C8&row=Basketball%7C6&row=Swimming%7C5&row=Tennis%7C3&row=Running%7C4`
- **Bar graph with a bar left for students to draw** — A bar graph of rainfall from Monday to Friday with Thursday’s bar missing, over bold gridlines with minor lines for drawing it  
  file: `public/tools/figure-library/math/bar-graph/bar-graph-with-a-bar-left-for-students-to-draw.svg`  
  open: `/tools/figures/math/bar-graph?gridlines=bold&minor=2&valueTitle=Rainfall+%28mm%29&valueTitleMode=text&row=Monday%7C4&row=Tuesday%7C7.5&row=Wednesday%7C2&row=Thursday%7C&row=Friday%7C1`
- **Bar graph with error bars: mean plant height** — A gray bar graph of mean plant height under three fertilizers, each bar with an error bar, and the note Error bars show ±1 SEM  
  file: `public/tools/figure-library/math/bar-graph/bar-graph-with-error-bars-mean-plant-height.svg`  
  open: `/tools/figures/math/bar-graph?look=bw&errorBars=1&errorNote=Error+bars+show+%C2%B11+SEM&categoryTitle=Treatment&categoryTitleMode=text&valueTitle=Mean+height+%28cm%29&valueTitleMode=text&row=None%7C12.4%C2%B11.1&row=Fertilizer+A%7C18.9%C2%B11.6&row=Fertilizer+B%7C15.2%C2%B12.3`
- **Double bar graph: favorite pets of boys and girls** — A double bar graph of favorite pets with a blue bar for boys and a red bar for girls beside each pet, and a key naming them  
  file: `public/tools/figure-library/math/bar-graph/double-bar-graph-boys-and-girls.svg`  
  open: `/tools/figures/math/bar-graph?title=Favorite+pets&titleMode=text&valueTitle=Number+of+students&valueTitleMode=text&cols=Boys%7CGirls&row=Dog%7C9%7C7&row=Cat%7C5%7C8&row=Fish%7C3%7C2&row=Rabbit%7C2%7C4`
- **Horizontal bar chart of books read, with values** — A horizontal bar chart of books read by five students, each bar with its number written at its end  
  file: `public/tools/figure-library/math/bar-graph/horizontal-bar-chart-books-read.svg`  
  open: `/tools/figures/math/bar-graph?direction=bars&values=end&title=Books+read+this+term&titleMode=text&valueTitle=Books&valueTitleMode=text&row=Amara%7C12&row=Ben%7C7&row=Chen%7C9&row=Dana%7C4&row=Eli%7C10`
- **Stacked (composite) bar chart: how students travel to school** — A stacked bar chart in black and white with a column for each of three year groups split into Walk, Bus and Car, and a key below  
  file: `public/tools/figure-library/math/bar-graph/stacked-composite-bar-chart-travel-to-school.svg`  
  open: `/tools/figures/math/bar-graph?stacking=stacked&barWidth=wide&values=inside&look=bw&keyAt=below&valueTitle=Number+of+students&valueTitleMode=text&cols=Walk%7CBus%7CCar&row=Year+7%7C12%7C10%7C8&row=Year+8%7C15%7C8%7C6&row=Year+9%7C9%7C14%7C5`

## math / box-plot

- **Box plot from a five-number summary, with Q1, the median and Q3 labeled** — A box plot over a number line from 10 to 40 with 18, 25 and 31 written above Q1, the median and Q3  
  file: `public/tools/figure-library/math/box-plot/box-plot-from-five-number-summary-quartiles-labeled.svg`  
  open: `/tools/figures/math/box-plot?q1Label=measure&medianLabel=measure&q3Label=measure&data=12%2C+18%2C+25%2C+31%2C+40`
- **Box plot of test scores** — A box plot of 15 test scores titled Test scores, over a number line from 60 to 100 labeled Score (points)  
  file: `public/tools/figure-library/math/box-plot/box-plot-of-test-scores.svg`  
  open: `/tools/figures/math/box-plot?title=Test+scores&titleMode=text&axisTitle=Score+%28points%29&axisTitleMode=text&data=62%2C+68%2C+71%2C+74%2C+75%2C+78%2C+80%2C+82%2C+84%2C+85%2C+88%2C+90%2C+91%2C+94%2C+98`
- **Box plot with outliers** — A box plot of minutes spent on homework, with a dot for an outlier at each end beyond the whiskers  
  file: `public/tools/figure-library/math/box-plot/box-plot-with-outliers.svg`  
  open: `/tools/figures/math/box-plot?outliers=1&title=Minutes+spent+on+homework&titleMode=text&axisTitle=Minutes&axisTitleMode=text&data=2%2C+20%2C+22%2C+25%2C+25%2C+28%2C+30%2C+30%2C+32%2C+35%2C+38%2C+40%2C+75`
- **Comparing two box plots: Class A and Class B** — Two box plots, Class A above Class B, over one number line from 50 to 100 labeled Score  
  file: `public/tools/figure-library/math/box-plot/comparing-two-box-plots-class-a-and-class-b.svg`  
  open: `/tools/figures/math/box-plot?from=50&to=100&step=5&every=2&axisTitle=Score&axisTitleMode=text&data=55%2C+60%2C+64%2C+70%2C+72%2C+75%2C+78%2C+81%2C+85%2C+90%7Cname%3DClass+A&data=68%2C+72%2C+75%2C+77%2C+80%2C+82%2C+84%2C+86%2C+88%2C+95%7Cname%3DClass+B`
- **Parts of a box plot: label the five-number summary** — A box plot with the letters A, B, C, D and E above its minimum, Q1, median, Q3 and maximum  
  file: `public/tools/figure-library/math/box-plot/parts-of-a-box-plot-labeled-a-to-e.svg`  
  open: `/tools/figures/math/box-plot?minLabel=text&minText=A&q1Label=text&q1Text=B&medianLabel=text&medianText=C&q3Label=text&q3Text=D&maxLabel=text&maxText=E&data=4%2C+15%2C+22%2C+36%2C+48`

## math / circle

- **Alternate segment theorem: tangent and chord** — A circle with a tangent at A and a triangle ABC inside it; the angle between the tangent and the chord AB is labeled 60° and the angle at C is labeled x  
  file: `public/tools/figure-library/math/circle/alternate-segment-theorem-tangent-and-chord.svg`  
  open: `/tools/figures/math/circle?centerName=&centerDot=0&pt=p1%7Cname%3DA%7Cdir%3D270&pt=p2%7Cname%3DB%7Cdir%3D30&pt=p3%7Cname%3DC%7Cdir%3D140&l=l1%7Ckind%3Dtangent%7Ca%3Dp1&l=l2%7Ca%3Dp1%7Cb%3Dp2&l=l3%7Ca%3Dp1%7Cb%3Dp3&l=l4%7Ca%3Dp2%7Cb%3Dp3&a=p1%40l1%2B%7El2%2B%7Clabel%3Dmeasure%7Cmark%3D1&a=p3%40l3-%7El4-%7Clabel%3Dtext%7Ctext%3Dx%7Cmark%3D1`
- **Angle in a semicircle: a triangle on a diameter** — A circle with diameter AB through its center O and a point C on the circle; triangle ABC has a right-angle square at C, the angle at B labeled 55° and the angle at A labeled x  
  file: `public/tools/figure-library/math/circle/angle-in-a-semicircle-triangle-on-a-diameter.svg`  
  open: `/tools/figures/math/circle?pt=p1%7Cname%3DA%7Cdir%3D180&pt=p2%7Cname%3DB%7Cdir%3D0&pt=p3%7Cname%3DC%7Cdir%3D70&l=l1%7Ca%3Dp1%7Cb%3Dp2&l=l2%7Ca%3Dp3%7Cb%3Dp1&l=l3%7Ca%3Dp3%7Cb%3Dp2&a=p1%40l1%2B%7El2-%7Clabel%3Dtext%7Ctext%3Dx%7Cmark%3D1&a=p2%40l3-%7El1-%7Clabel%3Dmeasure%7Cmark%3D1`
- **Angles in the same segment** — A circle with points A and B at the bottom and C and D at the top; chords from C and from D to A and B make two angles on the same arc, the one at D labeled 70° and the one at C labeled x  
  file: `public/tools/figure-library/math/circle/angles-in-the-same-segment-circle-theorem.svg`  
  open: `/tools/figures/math/circle?pt=p1%7Cname%3DA%7Cdir%3D200&pt=p2%7Cname%3DB%7Cdir%3D340&pt=p3%7Cname%3DC%7Cdir%3D60&pt=p4%7Cname%3DD%7Cdir%3D120&l=l1%7Ca%3Dp3%7Cb%3Dp1&l=l2%7Ca%3Dp3%7Cb%3Dp2&l=l3%7Ca%3Dp4%7Cb%3Dp1&l=l4%7Ca%3Dp4%7Cb%3Dp2&a=p3%40l1%2B%7El2%2B%7Clabel%3Dtext%7Ctext%3Dx%7Cmark%3D1&a=p4%40l3%2B%7El4%2B%7Clabel%3Dmeasure%7Cmark%3D1`
- **Central angle and inscribed angle on the same arc** — A circle with center O and points A, B and C on it; radii OA and OB make a central angle labeled 120°, and chords CA and CB make an inscribed angle at C labeled x  
  file: `public/tools/figure-library/math/circle/central-angle-and-inscribed-angle-on-the-same-arc.svg`  
  open: `/tools/figures/math/circle`
- **Cyclic quadrilateral: opposite angles** — A quadrilateral ABCD with all four corners on a circle; the angle at C is labeled 95° and the opposite angle at A is labeled x  
  file: `public/tools/figure-library/math/circle/cyclic-quadrilateral-opposite-angles.svg`  
  open: `/tools/figures/math/circle?centerName=&centerDot=0&pt=p1%7Cname%3DA%7Cdir%3D225&pt=p2%7Cname%3DB%7Cdir%3D320&pt=p3%7Cname%3DC%7Cdir%3D30&pt=p4%7Cname%3DD%7Cdir%3D130&l=l1%7Ca%3Dp1%7Cb%3Dp2&l=l2%7Ca%3Dp2%7Cb%3Dp3&l=l3%7Ca%3Dp3%7Cb%3Dp4&l=l4%7Ca%3Dp4%7Cb%3Dp1&a=p1%40l1%2B%7El4-%7Clabel%3Dtext%7Ctext%3Dx%7Cmark%3D1&a=p3%40l3%2B%7El2-%7Clabel%3Dmeasure%7Cmark%3D1`
- **Intersecting chords: the angle and its intercepted arcs** — A circle with chords AB and CD crossing at E; arc AC is labeled 90°, arc BD is labeled 110°, and the angle AEC between them is labeled x  
  file: `public/tools/figure-library/math/circle/intersecting-chords-angle-and-intercepted-arcs.svg`  
  open: `/tools/figures/math/circle?centerName=&centerDot=0&pt=p1%7Cname%3DA%7Cdir%3D150&pt=p2%7Cname%3DB%7Cdir%3D340&pt=p3%7Cname%3DC%7Cdir%3D60&pt=p4%7Cname%3DD%7Cdir%3D230&l=l1%7Ca%3Dp1%7Cb%3Dp2&l=l2%7Ca%3Dp3%7Cb%3Dp4&a=l1.l2%40l2-%7El1-%7Clabel%3Dtext%7Ctext%3Dx%7Cmark%3D1&arc=p3%7Ep1%7Clabel%3Ddegrees&arc=p4%7Ep2%7Clabel%3Ddegrees&m=l1.l2%7Cname%3DE`
- **Parts of a circle: radius, diameter, chord, tangent and secant** — A circle with center O, a diameter AB, a radius OC, a chord DE, a tangent touching the circle at F and a secant through G and H that runs on past both  
  file: `public/tools/figure-library/math/circle/parts-of-a-circle-radius-diameter-chord-tangent-secant.svg`  
  open: `/tools/figures/math/circle?pt=p1%7Cname%3DA%7Cdir%3D200&pt=p2%7Cname%3DB%7Cdir%3D20&pt=p3%7Cname%3DC%7Cdir%3D125&pt=p4%7Cname%3DD%7Cdir%3D240&pt=p5%7Cname%3DE%7Cdir%3D300&pt=p6%7Cname%3DF%7Cdir%3D155&pt=p7%7Cname%3DG%7Cdir%3D45&pt=p8%7Cname%3DH%7Cdir%3D75&l=l1%7Ca%3Dp1%7Cb%3Dp2&l=l2%7Ca%3Do%7Cb%3Dp3&l=l3%7Ca%3Dp4%7Cb%3Dp5&l=l4%7Ckind%3Dtangent%7Ca%3Dp6&l=l5%7Ca%3Dp7%7CrunA%3D1%7CrunB%3D1%7Cb%3Dp8&a=`
- **Regular hexagon inscribed in a circle** — A regular hexagon ABCDEF inscribed in a circle with center O; every side has a tick, the radius OA is labeled 6 cm and the side AB is labeled x  
  file: `public/tools/figure-library/math/circle/regular-hexagon-inscribed-in-a-circle.svg`  
  open: `/tools/figures/math/circle?pt=p1%7Cname%3DA%7Cdir%3D240&pt=p2%7Cname%3DB%7Cdir%3D300&pt=p3%7Cname%3DC%7Cdir%3D0&pt=p4%7Cname%3DD%7Cdir%3D60&pt=p5%7Cname%3DE%7Cdir%3D120&pt=p6%7Cname%3DF%7Cdir%3D180&l=l1%7Ca%3Dp1%7Clabel%3Dtext%7Ctext%3Dx%7Cticks%3D1%7Cb%3Dp2&l=l2%7Ca%3Dp2%7Cticks%3D1%7Cb%3Dp3&l=l3%7Ca%3Dp3%7Cticks%3D1%7Cb%3Dp4&l=l4%7Ca%3Dp4%7Cticks%3D1%7Cb%3Dp5&l=l5%7Ca%3Dp5%7Cticks%3D1%7Cb%3Dp6&l=l6%7Ca%3Dp6%7Cticks%3D1%7Cb%3Dp1&l=l7%7Ca%3Do%7Clabel%3Dmeasure%7Cb%3Dp1&a=`
- **Shaded sector with its radius, central angle and arc length** — A circle with center O and a shaded sector between radii OA and OB; OA is labeled 6 cm, the central angle 100° and the arc AB 10.5 cm  
  file: `public/tools/figure-library/math/circle/shaded-sector-with-radius-central-angle-and-arc-length.svg`  
  open: `/tools/figures/math/circle?pt=p1%7Cname%3DA%7Cdir%3D30&pt=p2%7Cname%3DB%7Cdir%3D130&l=l1%7Ca%3Do%7Clabel%3Dmeasure%7Cb%3Dp1&l=l2%7Ca%3Do%7Cb%3Dp2&a=o%40l1%2B%7El2%2B%7Clabel%3Dmeasure%7Cmark%3D1&arc=p1%7Ep2%7Clabel%3Dlength&f=l1%2Bl2%2Bp1%7Ep2%7Cfill%3D1`
- **Shaded segment of a circle cut off by a chord** — A circle with center O and a chord AB; the segment below the chord is shaded, dashed radii OA and OB meet at O at 140°, and OA is labeled 6 cm  
  file: `public/tools/figure-library/math/circle/shaded-segment-of-a-circle-cut-off-by-a-chord.svg`  
  open: `/tools/figures/math/circle?pt=p1%7Cname%3DA%7Cdir%3D200&pt=p2%7Cname%3DB%7Cdir%3D340&l=l1%7Ca%3Dp1%7Cb%3Dp2&l=l2%7Ca%3Do%7Cstyle%3Ddashed%7Clabel%3Dmeasure%7Cb%3Dp1&l=l3%7Ca%3Do%7Cstyle%3Ddashed%7Cb%3Dp2&a=o%40l2%2B%7El3%2B%7Clabel%3Dmeasure%7Cmark%3D1&f=l1%2Bp1%7Ep2%7Cfill%3D1`
- **Tangent and radius: find the angle** — A circle with center O, a radius OA labeled 6 cm and a tangent touching the circle at A; the angle between the radius and the tangent is labeled x  
  file: `public/tools/figure-library/math/circle/tangent-and-radius-angle-x.svg`  
  open: `/tools/figures/math/circle?pt=p1%7Cname%3DA%7Cdir%3D300&l=l1%7Ca%3Do%7Clabel%3Dmeasure%7Cb%3Dp1&l=l2%7Ckind%3Dtangent%7Ca%3Dp1&a=p1%40l2%2B%7El1-%7Clabel%3Dtext%7Ctext%3Dx`
- **Two secants from a point outside a circle** — A circle and a point P outside it; two secants from P cut the circle at A and B and at C and D, the near arc AC is labeled 60°, the far arc BD 180°, and the angle at P x  
  file: `public/tools/figure-library/math/circle/two-secants-from-an-external-point.svg`  
  open: `/tools/figures/math/circle?centerName=&centerDot=0&pt=p1%7Cname%3DP%7Cdir%3D180%7Cdist%3Dsqrt%283%29&pt=p2%7Cname%3DA%7Cdir%3D150&pt=p3%7Cname%3DC%7Cdir%3D210&l=l1%7Ca%3Dp1%7CrunB%3D1%7Cb%3Dp2&l=l2%7Ca%3Dp1%7CrunB%3D1%7Cb%3Dp3&a=p1%40l2%2B%7El1%2B%7Clabel%3Dtext%7Ctext%3Dx%7Cmark%3D1&arc=p2%7Ep3%7Clabel%3Ddegrees&arc=l2%3Ab1%7El1%3Ab1%7Clabel%3Ddegrees&m=l1%3Ab1%7Cname%3DB&m=l2%3Ab1%7Cname%3DD`
- **Two tangents from a point outside a circle** — A circle with center O and a point P outside it; tangents from P touch the circle at A and B, each marked with a tick, radii OA and OB meet them at right angles, angle AOB is labeled 120° and angle APB is labeled x  
  file: `public/tools/figure-library/math/circle/two-tangents-from-an-external-point.svg`  
  open: `/tools/figures/math/circle?pt=p1%7Cname%3DP%7Cdir%3D0%7Cdist%3D2&l=l1%7Ckind%3Dfrom%7Ca%3Dp1%7Cticks%3D1%7Cside%3Dleft&l=l2%7Ckind%3Dfrom%7Ca%3Dp1%7Cticks%3D1%7Cside%3Dright&l=l3%7Ca%3Do%7Cb%3Dl1%253At&l=l4%7Ca%3Do%7Cb%3Dl2%253At&a=p1%40l2%2B%7El1%2B%7Clabel%3Dtext%7Ctext%3Dx%7Cmark%3D1&a=o%40l3%2B%7El4%2B%7Clabel%3Dmeasure%7Cmark%3D1&m=l1%3At%7Cname%3DA&m=l2%3At%7Cname%3DB`

## math / cone

- **Cone with diameter 10 cm and slant height 13 cm** — A cone with a dashed diameter across its base labeled 10 cm and its slant height labeled 13 cm  
  file: `public/tools/figure-library/math/cone/cone-with-diameter-10-cm-and-slant-height-13-cm.svg`  
  open: `/tools/figures/math/cone?radius=10&height=&slant=13&diameter=1`
- **Cone with radius 4 cm and height 9 cm** — A cone with its dashed height labeled 9 cm and a dashed radius labeled 4 cm on its base  
  file: `public/tools/figure-library/math/cone/cone-with-radius-4-cm-and-height-9-cm.svg`  
  open: `/tools/figures/math/cone?radius=4&height=9`
- **Cone with radius r and height h** — A cone with its dashed height labeled h and its radius labeled r, with no numbers  
  file: `public/tools/figure-library/math/cone/cone-with-radius-r-and-height-h.svg`  
  open: `/tools/figures/math/cone?height=5&radiusLabel=text&radiusText=r&heightLabel=text&heightText=h&unit=`
- **Cone with the slant height labeled x** — A cone with its height labeled 8 cm, its radius 6 cm and its slant height x  
  file: `public/tools/figure-library/math/cone/cone-with-the-slant-height-labeled-x.svg`  
  open: `/tools/figures/math/cone?radius=6&height=8&slantLabel=text&slantText=x`

## math / coordinate-grid

- **Graphs of y = 2ˣ and y = log₂ x, reflected in y = x** — A coordinate grid from −6 to 6 with the exponential curve y = 2^x in blue, the logarithm curve y = log₂ x in red, and the dashed line y = x between them  
  file: `public/tools/figure-library/math/coordinate-grid/exponential-and-logarithm-graphs-y-2x-and-log2-x.svg`  
  open: `/tools/figures/math/coordinate-grid?xFrom=-6&xTo=6&yFrom=-6&yTo=6&eq=y%3D2%5Ex%7Ccolor%3Dblue&eq=y%3Dlog_2%28x%29%7Ccolor%3Dred&eq=y%3Dx%7Cline%3Ddashed`
- **First-quadrant graph with axis titles: distance over time** — A blank first-quadrant grid titled Distance over time, with Time (hours) along the x-axis from 0 to 10 and Distance (miles) up the y-axis from 0 to 100 by 10  
  file: `public/tools/figure-library/math/coordinate-grid/first-quadrant-graph-paper-with-axis-titles.svg`  
  open: `/tools/figures/math/coordinate-grid?xTo=10&yTo=100&yStep=10&title=Distance+over+time&titleMode=text&xTitle=Time+%28hours%29&xTitleMode=text&yTitle=Distance+%28miles%29&yTitleMode=text`
- **Graph of the parabola y = x² − 2x − 3** — A coordinate grid from −6 to 6 with the upward parabola y = x² − 2x − 3 drawn in blue  
  file: `public/tools/figure-library/math/coordinate-grid/graph-of-a-parabola-y-x2-minus-2x-minus-3.svg`  
  open: `/tools/figures/math/coordinate-grid?xFrom=-6&xTo=6&yFrom=-6&yTo=6&eq=y%3Dx%5E2-2x-3%7Ccolor%3Dblue`
- **Graph of y = 2x + 1 on a coordinate plane** — A four-quadrant coordinate grid from −10 to 10 on both axes with the straight line y = 2x + 1 drawn across it  
  file: `public/tools/figure-library/math/coordinate-grid/graph-of-y-2x-plus-1-coordinate-plane.svg`  
  open: `/tools/figures/math/coordinate-grid?xFrom=-10&xTo=10&yFrom=-10&yTo=10&eq=y%3D2x%2B1`
- **Piecewise function graph with open and closed circles** — A coordinate grid from −6 to 6 with a two-piece piecewise function: y = x + 2 for x < 1, ending in an open circle at (1, 3), and y = −2x + 4 for x ≥ 1, starting from a closed circle at (1, 2)  
  file: `public/tools/figure-library/math/coordinate-grid/piecewise-function-graph-with-open-and-closed-circles.svg`  
  open: `/tools/figures/math/coordinate-grid?xFrom=-6&xTo=6&yFrom=-6&yTo=6&eq=y%3Dx%2B2%2C+x%3C1&eq=y%3D-2x%2B4%2C+x%3E%3D1`
- **Plotting points in all four quadrants** — A coordinate grid from −6 to 6 with four labeled points, A(2, 4), B(−3, 1), C(−4, −2) and D(5, −3), one in each quadrant  
  file: `public/tools/figure-library/math/coordinate-grid/plotting-points-in-four-quadrants.svg`  
  open: `/tools/figures/math/coordinate-grid?xFrom=-6&xTo=6&yFrom=-6&yTo=6&eq=A%282%2C4%29%2CB%28-3%2C1%29%2CC%28-4%2C-2%29%2CD%285%2C-3%29`
- **Rational function with a hole and dotted asymptotes** — A coordinate grid from −6 to 6 with the rational function y = (2x² + 3x − 2)/(x² + x − 2) in green, an open circle for its hole at (−2, 5/3), and dotted asymptotes at x = 1 and y = 2  
  file: `public/tools/figure-library/math/coordinate-grid/rational-function-with-a-hole-and-asymptotes.svg`  
  open: `/tools/figures/math/coordinate-grid?xFrom=-6&xTo=6&yFrom=-6&yTo=6&eq=y%3D%282x%5E2%2B3x-2%29%2F%28x%5E2%2Bx-2%29%7Ccolor%3Dgreen%7Casym%3Dshown`
- **Graph of y = sin x from −2π to 2π** — The sine curve y = sin x on a grid whose x-axis runs from −2π to 2π, numbered −2π, −π, 0, π and 2π, and whose y-axis runs from −2 to 2  
  file: `public/tools/figure-library/math/coordinate-grid/sine-graph-from-minus-2pi-to-2pi.svg`  
  open: `/tools/figures/math/coordinate-grid?xFrom=-2pi&xTo=2pi&xStep=pi%2F2&yFrom=-2&yTo=2&xEvery=2&eq=y%3Dsin%28x%29`
- **System of linear inequalities: y > x − 2 and y ≤ −x + 3** — A coordinate grid from −6 to 6 with the region above the dashed line y = x − 2 shaded blue and the region below the solid line y = −x + 3 shaded red, overlapping on the left  
  file: `public/tools/figure-library/math/coordinate-grid/system-of-linear-inequalities-graph.svg`  
  open: `/tools/figures/math/coordinate-grid?xFrom=-6&xTo=6&yFrom=-6&yTo=6&eq=y%3Ex-2%7Ccolor%3Dblue&eq=y%3C%3D-x%2B3%7Ccolor%3Dred`
- **Graph of y = 3 sin 2x in degrees, from 0° to 360°** — The curve y = 3 sin 2x on a grid whose x-axis runs from 0° to 360°, with a gridline every 45° and numbers every 90°, and whose y-axis runs from −4 to 4  
  file: `public/tools/figure-library/math/coordinate-grid/trig-graph-y-3-sin-2x-in-degrees.svg`  
  open: `/tools/figures/math/coordinate-grid?xFrom=0%C2%B0&xTo=360%C2%B0&xStep=45%C2%B0&yFrom=-4&yTo=4&xEvery=2&angle=degrees&eq=y%3D3sin%282x%29%7Ccolor%3Dblue`

## math / cumulative-frequency

- **Blank cumulative frequency graph axes** — Blank cumulative frequency graph axes on graph paper, time from 0 to 60 minutes by 5 and cumulative frequency from 0 to 80 by 10  
  file: `public/tools/figure-library/math/cumulative-frequency/blank-cumulative-frequency-graph-axes.svg`  
  open: `/tools/figures/math/cumulative-frequency?xTo=60&xStep=5&yTo=80&yStep=10&gridlines=standard&minor=5&xTitle=Time+%28minutes%29&xTitleMode=text`
- **Cumulative frequency curve from a data set of test marks** — A cumulative frequency curve of 30 test marks with dashed red lines for the quartiles and median and three blank lines under the mark axis  
  file: `public/tools/figure-library/math/cumulative-frequency/cumulative-frequency-curve-from-a-data-set-of-test-marks.svg`  
  open: `/tools/figures/math/cumulative-frequency?mode=data&data=12%2C+18%2C+23%2C+25%2C+27%2C+31%2C+33%2C+34%2C+36%2C+38%2C+39%2C+41%2C+42%2C+44%2C+45%2C+45%2C+47%2C+48%2C+51%2C+53%2C+54%2C+56%2C+58%2C+61%2C+63%2C+66%2C+68%2C+72%2C+75%2C+83&binStart=10&binWidth=10&edges=right&median=blank&lower=blank&upper=blank&xTitle=Mark&xTitleMode=text`
- **Cumulative frequency curve with the median and quartiles** — A cumulative frequency curve titled Heights of 80 students, with dashed red lines reading off the median, 169, and the quartiles, 162 and 177, written under the height axis  
  file: `public/tools/figure-library/math/cumulative-frequency/cumulative-frequency-curve-median-and-quartiles.svg`  
  open: `/tools/figures/math/cumulative-frequency?lowest=140&median=value&lower=value&upper=value&title=Heights+of+80+students&titleMode=text&xTitle=Height+%28cm%29&xTitleMode=text&row=150%7C4&row=160%7C12&row=170%7C26&row=180%7C24&row=190%7C10&row=200%7C4`
- **Cumulative frequency graph: estimate how many from the curve** — A black-and-white cumulative frequency curve titled Weights of 120 parcels, with dashed lines for the median and up from 5 kg, and blank lines at the axes for the answers  
  file: `public/tools/figure-library/math/cumulative-frequency/cumulative-frequency-from-a-cumulative-table-estimate-how-many.svg`  
  open: `/tools/figures/math/cumulative-frequency?mode=cumulative&lowest=0&look=bw&median=blank&title=Weights+of+120+parcels&titleMode=text&xTitle=Weight+%28kg%29&xTitleMode=text&cum=2%7C8&cum=4%7C30&cum=6%7C64&cum=8%7C96&cum=10%7C112&cum=12%7C120&read=up%7C5%7Cblank`
- **Cumulative frequency points for students to draw the curve** — Crosses plotted for a cumulative frequency graph of time in minutes, from 0 to 60 on both axes, with no curve drawn through them  
  file: `public/tools/figure-library/math/cumulative-frequency/cumulative-frequency-points-for-students-to-draw-the-curve.svg`  
  open: `/tools/figures/math/cumulative-frequency?lowest=0&join=none&gridlines=standard&minor=2&xTitle=Time+%28minutes%29&xTitleMode=text&row=10%7C5&row=20%7C14&row=30%7C21&row=40%7C12&row=60%7C8`
- **Ogive of test scores with a cumulative percent axis** — An ogive of test scores with dots joined by straight blue lines, a cumulative percent axis from 0 to 100, and dashed red lines across from 60 and down  
  file: `public/tools/figure-library/math/cumulative-frequency/ogive-cumulative-percent-test-scores.svg`  
  open: `/tools/figures/math/cumulative-frequency?lowest=40&mark=dot&join=straight&scale=percent&title=Test+scores&titleMode=text&xTitle=Score&xTitleMode=text&yTitle=Cumulative+percent&row=50%7C2&row=60%7C5&row=70%7C9&row=80%7C12&row=90%7C8&row=100%7C4&read=percentile%7C60%7Clines`

## math / cylinder

- **Cylinder with diameter 12 inches and height 9 inches** — A cylinder with a diameter drawn across its top circle labeled 12 in, and its height labeled 9 in  
  file: `public/tools/figure-library/math/cylinder/cylinder-with-diameter-12-inches-and-height-9-inches.svg`  
  open: `/tools/figures/math/cylinder?radius=12&height=9&diameter=1&unit=in`
- **Cylinder with radius 4 cm and height 10 cm** — A cylinder with its radius drawn on the top circle and labeled 4 cm, and its height labeled 10 cm  
  file: `public/tools/figure-library/math/cylinder/cylinder-with-radius-4-cm-and-height-10-cm.svg`  
  open: `/tools/figures/math/cylinder?radius=4&height=10`
- **Cylinder with radius r and height h** — A cylinder with its radius labeled r and its height labeled h, with no numbers  
  file: `public/tools/figure-library/math/cylinder/cylinder-with-radius-r-and-height-h.svg`  
  open: `/tools/figures/math/cylinder?radius=5&height=6&radiusLabel=text&radiusText=r&heightLabel=text&heightText=h&unit=`
- **Oblique cylinder with its height and lean** — An oblique cylinder leaning to the right with its radius labeled 3 cm, its dashed height 8 cm and its lean 4 cm  
  file: `public/tools/figure-library/math/cylinder/oblique-cylinder-with-its-height-and-lean.svg`  
  open: `/tools/figures/math/cylinder?height=8&lean=4&oblique=1&moved=lean%3A-30%2C0`

## math / histogram

- **Frequency density histogram with unequal class widths** — A gray histogram on graph paper with five bars of different widths for times from 0 to 50 minutes, over a frequency density axis from 0 to 3  
  file: `public/tools/figure-library/math/histogram/frequency-density-histogram-with-unequal-class-widths.svg`  
  open: `/tools/figures/math/histogram?source=table&lowest=0&fill=gray&gridlines=standard&minor=5&xTitle=Time+%28t+minutes%29&xTitleMode=text&row=10%7C8&row=15%7C12&row=20%7C15&row=30%7C10&row=50%7C6`
- **Histogram from a data set of test scores** — A histogram of 30 test scores in bins of 10 from 40 to 100, with each bar’s frequency written above it  
  file: `public/tools/figure-library/math/histogram/histogram-from-a-data-set-of-test-scores.svg`  
  open: `/tools/figures/math/histogram?data=42%2C+48%2C+51%2C+55%2C+58%2C+59%2C+61%2C+63%2C+64%2C+66%2C+67%2C+68%2C+70%2C+71%2C+72%2C+73%2C+74%2C+75%2C+77%2C+78%2C+79%2C+81%2C+82%2C+84%2C+85%2C+87%2C+88%2C+91%2C+93%2C+96&binStart=40&binWidth=10&values=1&title=Test+scores&titleMode=text&xTitle=Score&xTitleMode=text&yTitle=Number+of+students`
- **Histogram of student heights** — A histogram titled Heights of students with six touching blue bars over bins from 150 to 180 cm, with a zig-zag break on the horizontal axis before 150  
  file: `public/tools/figure-library/math/histogram/histogram-of-student-heights.svg`  
  open: `/tools/figures/math/histogram?source=table&lowest=150&title=Heights+of+students&titleMode=text&xTitle=Height+%28cm%29&xTitleMode=text&row=155%7C2&row=160%7C5&row=165%7C9&row=170%7C11&row=175%7C7&row=180%7C4`
- **Histogram with a bar left for students to draw** — A histogram of distances from school with the bar for 10 to 15 km left off, on bold gridlines with minor lines  
  file: `public/tools/figure-library/math/histogram/histogram-with-a-bar-left-for-students-to-draw.svg`  
  open: `/tools/figures/math/histogram?source=table&lowest=0&yTo=12&gridlines=bold&minor=2&xTitle=Distance+from+school+%28km%29&xTitleMode=text&row=5%7C3&row=10%7C7&row=15%7C&row=20%7C6&row=25%7C2`
- **Histogram with a frequency polygon** — A histogram of the masses of apples with white bars from 100 to 200 g and a frequency polygon joining the middle of each bar’s top, closed down to the axis at each end  
  file: `public/tools/figure-library/math/histogram/histogram-with-a-frequency-polygon.svg`  
  open: `/tools/figures/math/histogram?source=table&lowest=100&fill=white&polygon=over&title=Masses+of+apples&titleMode=text&xTitle=Mass+%28g%29&xTitleMode=text&row=120%7C4&row=140%7C9&row=160%7C15&row=180%7C10&row=200%7C2`
- **Histogram with no numbers on the frequency density axis** — A histogram of masses from 20 to 70 kg with unequal bins and a frequency density axis with gridlines but no numbers  
  file: `public/tools/figure-library/math/histogram/histogram-with-no-numbers-on-the-frequency-density-axis.svg`  
  open: `/tools/figures/math/histogram?source=table&lowest=20&fill=white&every=0&gridlines=standard&minor=5&xTitle=Mass+%28m+kg%29&xTitleMode=text&row=30%7C15&row=35%7C20&row=40%7C30&row=50%7C25&row=70%7C10`

## math / kite

- **Kite: find the missing angle** — A kite with short sides 6 and long sides 10, angle B labeled 110 degrees, equal angles A and C marked with arcs and angle D labeled x  
  file: `public/tools/figure-library/math/kite/kite-find-the-missing-angle.svg`  
  open: `/tools/figures/math/kite?AB=6&DA=10&B=110&DLabel=text&DText=x&AArcs=1&CArcs=1`
- **Kite with diagonals 6 and 12 for area** — A kite ABCD standing upright, its diagonals drawn and labeled 6 and 12, crossing at a right angle, with its equal sides marked  
  file: `public/tools/figure-library/math/kite/kite-with-diagonals-6-and-12-for-area.svg`  
  open: `/tools/figures/math/kite?AB=3sqrt%282%29&DA=3sqrt%2810%29&B=90&BLabel=none&ABLabel=none&DALabel=none&dAC=1&dACLabel=measure&dBD=1&dBDLabel=measure&moved=dBD%3A110%2C0`
- **Kite with its line of symmetry** — A kite with sides 7 in and 12 in and angle B 80 degrees, with the diagonal BD drawn dashed as its line of symmetry  
  file: `public/tools/figure-library/math/kite/kite-with-its-line-of-symmetry.svg`  
  open: `/tools/figures/math/kite?AB=7&DA=12&B=80&dBD=1&dBDStyle=dashed&unit=in`

## math / length-reading

- **Measuring to the nearest centimeter** — A 15 cm ruler marked only every centimeter with a row of four marbles lying along it from 0 to 6 cm  
  file: `public/tools/figure-library/math/length-reading/centimeter-ruler-measuring-to-the-nearest-centimeter.svg`  
  open: `/tools/figures/math/length-reading?metricMarks=cm&read=mark&object=marbles&marbles=4&guides=1&length=6&view=whole`
- **Measuring to the nearest eighth inch** — A 6 inch ruler marked in eighths of an inch with a rock lying along it from 0 to 2 5/8 inches, with dashed lines down from its ends  
  file: `public/tools/figure-library/math/length-reading/inch-ruler-measuring-to-the-nearest-eighth-inch.svg`  
  open: `/tools/figures/math/length-reading?system=imperial&object=rock&guides=1&length=2.625`
- **Measuring to the nearest quarter inch** — A 6 inch ruler marked in quarter inches with a metal cylinder lying along it from 0 to 3 1/4 inches, with a magnified view of its right end  
  file: `public/tools/figure-library/math/length-reading/inch-ruler-measuring-to-the-nearest-quarter-inch.svg`  
  open: `/tools/figures/math/length-reading?system=imperial&imperialMarks=4&length=3.25`
- **Measuring in centimeters and millimeters: 8.4 cm** — A 15 cm ruler marked in millimeters with a metal cylinder lying along it from 0 to 8.4 cm, with a magnified view of its right end  
  file: `public/tools/figure-library/math/length-reading/millimeter-ruler-measuring-in-centimeters-and-millimeters.svg`  
  open: `/tools/figures/math/length-reading?read=mark&length=8.4`
- **Measuring with a ruler not starting at zero, in inches** — A 6 inch ruler marked in quarter inches with a metal cylinder lying along it from 1 inch to 3 1/2 inches, with magnified views of both ends  
  file: `public/tools/figure-library/math/length-reading/ruler-measuring-not-from-zero-inches.svg`  
  open: `/tools/figures/math/length-reading?system=imperial&imperialMarks=4&length=2.5&start=1`

## math / mapping-diagram

- **Mapping diagram without arrows, for students to draw** — A mapping diagram with inputs 1 to 5 titled x and outputs 2, 4, 6, 8 and 10 titled y, and no arrows  
  file: `public/tools/figure-library/math/mapping-diagram/blank-mapping-diagram-draw-the-arrows.svg`  
  open: `/tools/figures/math/mapping-diagram?inputs=1%2C+2%2C+3%2C+4%2C+5&outputs=2%2C+4%2C+6%2C+8%2C+10&inputTitle=x&outputTitle=y`
- **Mapping diagram of y = x², a function that isn’t one-to-one** — A mapping diagram titled y = x² with inputs −2, −1, 1 and 2 and outputs 1 and 4, two arrows ending at each output  
  file: `public/tools/figure-library/math/mapping-diagram/mapping-diagram-many-to-one-function-x-squared.svg`  
  open: `/tools/figures/math/mapping-diagram?inputs=%E2%88%922%2C+%E2%88%921%2C+1%2C+2&outputs=1%2C+4&inputTitle=x&outputTitle=y&title=y+%3D+x%C2%B2&titleMode=text&arrow=%E2%88%922%E2%86%924&arrow=%E2%88%921%E2%86%921&arrow=1%E2%86%921&arrow=2%E2%86%924`
- **Mapping diagram of a function** — A mapping diagram with inputs 1, 2, 3 and 4 in an oval on the left, outputs 3, 5, 7 and 9 on the right, and one arrow from each input  
  file: `public/tools/figure-library/math/mapping-diagram/mapping-diagram-of-a-function.svg`  
  open: `/tools/figures/math/mapping-diagram?inputs=1%2C+2%2C+3%2C+4&outputs=3%2C+5%2C+7%2C+9&arrow=1%E2%86%923&arrow=2%E2%86%925&arrow=3%E2%86%927&arrow=4%E2%86%929`
- **Mapping diagram of a relation that is not a function** — A mapping diagram from x to y with inputs −2, 0 and 3, where 0 has arrows to both 4 and 6  
  file: `public/tools/figure-library/math/mapping-diagram/mapping-diagram-relation-that-is-not-a-function.svg`  
  open: `/tools/figures/math/mapping-diagram?inputs=%E2%88%922%2C+0%2C+3&outputs=1%2C+4%2C+6%2C+8&inputTitle=x&outputTitle=y&arrow=%E2%88%922%E2%86%921&arrow=0%E2%86%924&arrow=0%E2%86%926&arrow=3%E2%86%928`
- **Mapping diagram with words: students and their sports** — A mapping diagram in boxes from four students, Ana, Ben, Cara and Dev, to three sports, with one arrow from each student  
  file: `public/tools/figure-library/math/mapping-diagram/mapping-diagram-with-words-students-and-sports.svg`  
  open: `/tools/figures/math/mapping-diagram?inputs=Ana%2C+Ben%2C+Cara%2C+Dev&outputs=Soccer%2C+Tennis%2C+Swimming&inputTitle=Student&outputTitle=Sport&shape=box&arrow=Ana%E2%86%92Soccer&arrow=Ben%E2%86%92Tennis&arrow=Cara%E2%86%92Soccer&arrow=Dev%E2%86%92Swimming`

## math / number-line

- **Compound inequality −3 < x ≤ 4 on a number line** — A number line from −6 to 6 with an open circle at −3, a closed circle at 4 and a thick line between them  
  file: `public/tools/figure-library/math/number-line/compound-inequality-minus-3-less-than-x-less-than-or-equal-to-4.svg`  
  open: `/tools/figures/math/number-line?from=-6&to=6&eq=-3%3Cx%3C%3D4`
- **Fraction number line from 0 to 2 with lettered points** — A number line from 0 to 2 with a tick every quarter, numbered only at 0, 1 and 2, with points P, Q and R drawn as dots  
  file: `public/tools/figure-library/math/number-line/fraction-number-line-0-to-2-with-lettered-points.svg`  
  open: `/tools/figures/math/number-line?from=0&to=2&step=1%2F4&every=4&eq=P%283%2F4%29%2CQ%283%2F2%29%2CR%287%2F4%29`
- **Graphing the inequality x ≥ −2 on a number line** — A number line from −5 to 5 with a closed circle at −2 and a thick line with an arrow running right from it  
  file: `public/tools/figure-library/math/number-line/graph-inequality-x-greater-than-or-equal-to-minus-2.svg`  
  open: `/tools/figures/math/number-line?from=-5&to=5&eq=x%3E%3D-2`
- **Graph of x < −1 or x ≥ 3 on a number line** — A number line from −5 to 5 with an open circle at −1 and a thick line running left, and a closed circle at 3 with a thick line running right  
  file: `public/tools/figure-library/math/number-line/or-inequality-x-less-than-minus-1-or-x-greater-than-or-equal-to-3.svg`  
  open: `/tools/figures/math/number-line?from=-5&to=5&eq=x%3C-1+or+x%3E%3D3`
- **The sequence aₙ = 1/n on a number line** — A number line from 0 to 1 by tenths with the first five terms of 1/n drawn as dots at 1, 1/2, 1/3, 1/4 and 1/5  
  file: `public/tools/figure-library/math/number-line/sequence-1-over-n-on-a-number-line.svg`  
  open: `/tools/figures/math/number-line?from=0&to=1&step=0.1&eq=a_n%3D1%2Fn`

## math / parallelogram

- **Parallelogram: find the missing angles** — A parallelogram with sides 9 and 5, angle A labeled 65 degrees and angles B, C and D labeled x, y and z  
  file: `public/tools/figure-library/math/parallelogram/parallelogram-find-the-missing-angles.svg`  
  open: `/tools/figures/math/parallelogram?AB=9&DA=5&A=65&BLabel=text&BText=x&CLabel=text&CText=y&DLabel=text&DText=z`
- **Parallelogram with base and height for area** — A parallelogram with base AB labeled 12 cm and a dashed height from D labeled 5 cm, with parallel arrows on opposite sides  
  file: `public/tools/figure-library/math/parallelogram/parallelogram-with-base-and-height-for-area.svg`  
  open: `/tools/figures/math/parallelogram?AB=12&DA=10&A=30&ALabel=none&DALabel=none&hD=1&hDLabel=measure&unit=cm`
- **Rhombus with its diagonals drawn** — A rhombus ABCD with side 6 and angle A 70 degrees, each side marked with one tick, its diagonals crossing at E with a right-angle square  
  file: `public/tools/figure-library/math/parallelogram/rhombus-with-diagonals-crossing-at-e.svg`  
  open: `/tools/figures/math/parallelogram?kind=rhombus&AB=6&A=70&ABTicks=1&BCTicks=1&CDTicks=1&DATicks=1&dAC=1&dBD=1&cross=E`

## math / pie-chart

- **Blank circle for drawing a pie chart** — A blank circle with its center marked and a radius drawn up to 12 o’clock, and a key of four pets with black-and-white fills  
  file: `public/tools/figure-library/math/pie-chart/blank-circle-for-drawing-a-pie-chart.svg`  
  open: `/tools/figures/math/pie-chart?look=bw&keyAt=right&titleMode=blank&row=Dog%7C&row=Cat%7C&row=Fish%7C&row=Rabbit%7C`
- **Circle graph of how students travel to school, with a key** — A circle graph of how students travel to school, each sector labeled with its percent, and a key on the right naming them  
  file: `public/tools/figure-library/math/pie-chart/circle-graph-of-how-students-travel-to-school-with-a-key.svg`  
  open: `/tools/figures/math/pie-chart?values=percent&labels=percent&keyAt=right&title=How+we+get+to+school&titleMode=text&row=Walk%7C35&row=Car%7C30&row=Bus%7C25&row=Bike%7C10`
- **Complete the pie chart: favorite sports** — A pie chart of the favorite sports of 60 students with only Soccer, 120°, and Basketball, 90°, drawn and the rest of the circle left empty  
  file: `public/tools/figure-library/math/pie-chart/complete-the-pie-chart-favorite-sports.svg`  
  open: `/tools/figures/math/pie-chart?total=60&labels=name-angle&title=Favorite+sports+of+60+students&titleMode=text&row=Soccer%7C20&row=Basketball%7C15&row=Tennis%7C&row=Swimming%7C`
- **Pie chart: find the missing angle x** — A black-and-white pie chart of Red, 110°, Blue, 80°, Green, 100°, and Yellow, x°  
  file: `public/tools/figure-library/math/pie-chart/pie-chart-find-the-missing-angle-x.svg`  
  open: `/tools/figures/math/pie-chart?values=degrees&labels=name-angle&look=bw&lab=%7C%7C%7Cletter&row=Red%7C110&row=Blue%7C80&row=Green%7C100&row=Yellow%7C70`
- **Pie chart of favorite fruit with percents** — A pie chart titled Favorite fruit with a colored sector for each of four fruits, each labeled with its name and percent  
  file: `public/tools/figure-library/math/pie-chart/pie-chart-of-favorite-fruit.svg`  
  open: `/tools/figures/math/pie-chart?labels=name-percent&title=Favorite+fruit&titleMode=text&row=Apples%7C12&row=Bananas%7C8&row=Cherries%7C6&row=Grapes%7C4`
- **Pie chart with fractions: how Sam spends a day** — A black-and-white pie chart of how Sam spends 24 hours, each sector labeled with its activity and its fraction of the day  
  file: `public/tools/figure-library/math/pie-chart/pie-chart-with-fractions-how-sam-spends-a-day.svg`  
  open: `/tools/figures/math/pie-chart?labels=name-fraction&look=bw&title=How+Sam+spends+a+day&titleMode=text&row=Sleep%7C9&row=School%7C6&row=Play%7C3&row=Homework%7C2&row=Meals%7C2&row=Other%7C2`

## math / prism

- **Cube with 6-inch edges** — A cube with one edge labeled 6 in and its hidden edges dashed  
  file: `public/tools/figure-library/math/prism/cube-with-6-inch-edges.svg`  
  open: `/tools/figures/math/prism?length=6&width=6&height=6&widthLabel=none&heightLabel=none&unit=in`
- **Hexagonal prism with its apothem** — A hexagonal prism with a side labeled 4 cm, its height 10 cm, and an apothem of 3.5 cm drawn on its top face  
  file: `public/tools/figure-library/math/prism/hexagonal-prism-with-its-apothem.svg`  
  open: `/tools/figures/math/prism?base=regular&height=10&apothemLabel=measure&moved=apothem%3A15%2C0`
- **Rectangular prism 8 cm by 3 cm by 5 cm** — A rectangular prism drawn to scale with its length labeled 8 cm, its width 3 cm and its height 5 cm, hidden edges dashed  
  file: `public/tools/figure-library/math/prism/rectangular-prism-8-cm-by-3-cm-by-5-cm.svg`  
  open: `/tools/figures/math/prism?length=8&height=5`
- **Rectangular prism with a missing height x** — A rectangular prism with its length labeled 12 ft, its width 4 ft and its height x  
  file: `public/tools/figure-library/math/prism/rectangular-prism-with-a-missing-height-x.svg`  
  open: `/tools/figures/math/prism?length=12&width=4&height=5&heightLabel=text&heightText=x&unit=ft`
- **Triangular prism with a right triangle base** — A triangular prism lying on its side, its right triangle end labeled 6 cm, 8 cm and 10 cm, and its length 12 cm  
  file: `public/tools/figure-library/math/prism/triangular-prism-with-a-right-triangle-base.svg`  
  open: `/tools/figures/math/prism?base=right&triHeight=8&height=12&hypLabel=measure`

## math / pyramid

- **Hexagonal pyramid with its apothem and height** — A hexagonal pyramid with a base side labeled 4 cm, its dashed height 9 cm and the base’s apothem 3.5 cm  
  file: `public/tools/figure-library/math/pyramid/hexagonal-pyramid-with-its-apothem-and-height.svg`  
  open: `/tools/figures/math/pyramid?base=regular&height=9&apothemLabel=measure&depth=left&hidden=0`
- **Rectangular pyramid 8 cm by 6 cm with height 9 cm** — A rectangular pyramid with base edges labeled 8 cm and 6 cm and its dashed height labeled 9 cm  
  file: `public/tools/figure-library/math/pyramid/rectangular-pyramid-8-cm-by-6-cm-height-9-cm.svg`  
  open: `/tools/figures/math/pyramid?length=8&height=9&depth=left`
- **Square pyramid with slant height 10 cm** — A square pyramid with base edges labeled 12 cm and a dashed slant height of 10 cm down the front face  
  file: `public/tools/figure-library/math/pyramid/square-pyramid-with-slant-height-10-cm.svg`  
  open: `/tools/figures/math/pyramid?length=12&width=12&height=&slant=10&showHeight=0`

## math / rectangle

- **Rectangle 12 cm by 5 cm for area and perimeter** — A rectangle ABCD drawn to scale, its bottom side labeled 12 cm and its right side 5 cm, with right-angle squares at the corners  
  file: `public/tools/figure-library/math/rectangle/rectangle-12-cm-by-5-cm-area-and-perimeter.svg`  
  open: `/tools/figures/math/rectangle?AB=12&BC=5&unit=cm`
- **Rectangle with a diagonal labeled x** — A rectangle 8 by 6 with diagonal AC drawn and labeled x  
  file: `public/tools/figure-library/math/rectangle/rectangle-diagonal-labeled-x-pythagorean-theorem.svg`  
  open: `/tools/figures/math/rectangle?AB=8&dAC=1&dACLabel=text&dACText=x`
- **Rectangle with sides labeled 2x + 3 and x** — A rectangle with its length labeled 2x + 3 and its width labeled x  
  file: `public/tools/figure-library/math/rectangle/rectangle-with-sides-as-algebraic-expressions.svg`  
  open: `/tools/figures/math/rectangle?AB=13&BC=5&ABLabel=text&ABText=2x%2B3&BCLabel=text&BCText=x`
- **Square with its diagonals drawn** — A square ABCD with every side marked with one tick, its diagonals AC and BD crossing at E with a right-angle square  
  file: `public/tools/figure-library/math/rectangle/square-with-diagonals-crossing-at-e.svg`  
  open: `/tools/figures/math/rectangle?kind=square&AB=7&ABTicks=1&BCTicks=1&CDTicks=1&DATicks=1&dAC=1&dBD=1&cross=E`

## math / regular-polygon

- **Regular decagon with congruence marks** — A regular decagon with one tick mark on every side and an arc in every corner, and no numbers  
  file: `public/tools/figure-library/math/regular-polygon/regular-decagon-with-congruence-marks.svg`  
  open: `/tools/figures/math/regular-polygon?n=10&sideLabel=none&sideTicks=1&angleArcs=1&dot=0&apothem=0`
- **Regular hexagon with its apothem, for area** — A regular hexagon with its bottom side labeled 10 cm and a dashed apothem from the center dot to that side labeled 8.7 cm  
  file: `public/tools/figure-library/math/regular-polygon/regular-hexagon-with-apothem-for-area.svg`  
  open: `/tools/figures/math/regular-polygon?size=10&apothemLabel=measure&unit=cm`
- **Regular octagon split into triangles by its radii** — A regular octagon with a dashed radius from its center dot to each of its eight corners, one of them labeled 5  
  file: `public/tools/figure-library/math/regular-polygon/regular-octagon-with-all-its-radii.svg`  
  open: `/tools/figures/math/regular-polygon?n=8&sizeBy=radius&size=5&sideLabel=none&apothem=0&radius=1&radiusLabel=measure&radii=1`
- **Regular pentagon: find the interior angle** — A regular pentagon with its bottom side labeled 6 and the angle in its bottom left corner marked with an arc and labeled x  
  file: `public/tools/figure-library/math/regular-polygon/regular-pentagon-find-the-interior-angle.svg`  
  open: `/tools/figures/math/regular-polygon?n=5&size=6&angleLabel=text&angleText=x&dot=0&apothem=0`

## math / sphere

- **Hemisphere bowl with radius 8 cm** — A hemisphere with its flat face up, like a bowl, and a radius across its top labeled 8 cm  
  file: `public/tools/figure-library/math/sphere/hemisphere-bowl-with-radius-8-cm.svg`  
  open: `/tools/figures/math/sphere?shape=hemisphere&radius=8&bowl=1`
- **Hemisphere with radius 5 m** — A hemisphere with its flat face down, like a dome, and a radius on its flat face labeled 5 m  
  file: `public/tools/figure-library/math/sphere/hemisphere-with-radius-5-m.svg`  
  open: `/tools/figures/math/sphere?shape=hemisphere&radius=5&unit=m`
- **Sphere with diameter 14 inches** — A sphere with a diameter drawn right across its middle and labeled 14 in  
  file: `public/tools/figure-library/math/sphere/sphere-with-diameter-14-inches.svg`  
  open: `/tools/figures/math/sphere?radius=14&diameter=1&unit=in`
- **Sphere with radius 6 cm** — A sphere with a radius drawn from its center to its edge and labeled 6 cm  
  file: `public/tools/figure-library/math/sphere/sphere-with-radius-6-cm.svg`  
  open: `/tools/figures/math/sphere?radius=6`

## math / stem-and-leaf

- **Back-to-back stem-and-leaf plot: Class A and Class B** — A back-to-back stem-and-leaf plot titled Push-ups in one minute, with Class A’s leaves running left and Class B’s running right from shared stems 2 to 5  
  file: `public/tools/figure-library/math/stem-and-leaf/back-to-back-stem-and-leaf-plot-class-a-and-class-b.svg`  
  open: `/tools/figures/math/stem-and-leaf?layout=back&data=24%2C+27%2C+29%2C+31%2C+33%2C+33%2C+36%2C+38%2C+40%2C+42%2C+45%2C+51&name=Class+A&data2=21%2C+23%2C+30%2C+34%2C+37%2C+41%2C+44%2C+46%2C+47%2C+49%2C+52%2C+55%2C+58&name2=Class+B&keyWords=means&title=Push-ups+in+one+minute&titleMode=text`
- **Blank stem-and-leaf diagram with boxes to fill in** — A blank stem-and-leaf diagram with the stems 1 to 5, a row of eight empty boxes for leaves beside each, and the key 2 | 3 means 23 minutes  
  file: `public/tools/figure-library/math/stem-and-leaf/blank-stem-and-leaf-diagram-with-boxes.svg`  
  open: `/tools/figures/math/stem-and-leaf?from=1&to=5&boxes=1&boxCount=8&keyWords=means&keyUnit=minutes&keyValue=23&title=Time+to+finish+a+puzzle&titleMode=text`
- **Stem-and-leaf plot of test scores** — A stem-and-leaf plot titled Test scores with stems 5 to 9, the leaves in order, and the key 5 | 8 = 58  
  file: `public/tools/figure-library/math/stem-and-leaf/stem-and-leaf-plot-of-test-scores.svg`  
  open: `/tools/figures/math/stem-and-leaf?data=58%2C+62%2C+65%2C+67%2C+71%2C+72%2C+74%2C+74%2C+78%2C+79%2C+81%2C+83%2C+85%2C+86%2C+88%2C+90%2C+92%2C+97&title=Test+scores&titleMode=text`
- **Stem-and-leaf plot with decimals: plant heights in cm** — A stem-and-leaf plot titled Plant heights with whole-number stems 1 to 4, tenths as leaves, and the key 1 | 4 means 1.4 cm  
  file: `public/tools/figure-library/math/stem-and-leaf/stem-and-leaf-plot-with-decimals.svg`  
  open: `/tools/figures/math/stem-and-leaf?data=1.4%2C+1.8%2C+2.1%2C+2.6%2C+2.6%2C+2.9%2C+3.0%2C+3.3%2C+3.5%2C+3.7%2C+4.2%2C+4.8&keyWords=means&keyUnit=cm&title=Plant+heights&titleMode=text`
- **Stem-and-leaf plot with negative stems: temperatures** — A stem-and-leaf plot titled Daily low temperatures with the stems −1, −0, 0 and 1, and the key −0 | 5 = −5 °C  
  file: `public/tools/figure-library/math/stem-and-leaf/stem-and-leaf-plot-with-negative-stems-temperatures.svg`  
  open: `/tools/figures/math/stem-and-leaf?data=-12%2C+-10%2C+-8%2C+-5%2C+-3%2C+-1%2C+0%2C+2%2C+2%2C+4%2C+7%2C+9%2C+11%2C+15&keyUnit=%C2%B0C&keyValue=-5&title=Daily+low+temperatures&titleMode=text`
- **Stem-and-leaf plot with split stems** — A stem-and-leaf plot titled Ages of club members with each of the stems 3, 4 and 5 on two rows, leaves 0 to 4 on the first and 5 to 9 on the second, and the key 3 | 1 = 31  
  file: `public/tools/figure-library/math/stem-and-leaf/stem-and-leaf-plot-with-split-stems.svg`  
  open: `/tools/figures/math/stem-and-leaf?data=31%2C+33%2C+36%2C+38%2C+39%2C+40%2C+41%2C+41%2C+42%2C+44%2C+45%2C+46%2C+47%2C+47%2C+49%2C+52%2C+53%2C+58&split=2&title=Ages+of+club+members&titleMode=text`

## math / trapezoid

- **Isosceles trapezoid with bases and height for area** — An isosceles trapezoid with bases 14 cm and 8 cm, a dashed height of 4 cm, parallel arrows on the bases and a tick on each leg  
  file: `public/tools/figure-library/math/trapezoid/isosceles-trapezoid-with-bases-and-height-for-area.svg`  
  open: `/tools/figures/math/trapezoid?kind=isosceles-trapezoid&AB=14&CD=8&h=4&ABArrows=1&BCTicks=1&CDArrows=1&DATicks=1&unit=cm`
- **Isosceles trapezoid with its diagonals drawn** — An isosceles trapezoid with bases 12 and 6, both diagonals drawn and crossing at E, with a tick on each leg  
  file: `public/tools/figure-library/math/trapezoid/isosceles-trapezoid-with-diagonals.svg`  
  open: `/tools/figures/math/trapezoid?kind=isosceles-trapezoid&ABArrows=1&BCTicks=1&CDArrows=1&DATicks=1&hD=0&dAC=1&dBD=1&cross=E`
- **Right trapezoid: find the slanted side** — A right trapezoid with bases 15 and 9, a vertical leg of 8 and the slanted leg labeled x  
  file: `public/tools/figure-library/math/trapezoid/right-trapezoid-find-the-slanted-side.svg`  
  open: `/tools/figures/math/trapezoid?AB=15&CD=9&DA=8`
- **Trapezoid with an angle and its height** — A trapezoid with bases 12 and 6, a dashed height of 5, angle A labeled 60 degrees and angle D labeled x  
  file: `public/tools/figure-library/math/trapezoid/trapezoid-with-angle-a-and-height.svg`  
  open: `/tools/figures/math/trapezoid?kind=trapezoid&CD=6&A=60&DLabel=text&DText=x&ABArrows=1&CDArrows=1`

## math / triangle

- **30-60-90 triangle with hypotenuse 10** — Right triangle ABC with a 30° angle at A, a right angle at B, the hypotenuse labeled 10 and the legs labeled x and y  
  file: `public/tools/figure-library/math/triangle/30-60-90-triangle-hypotenuse-10.svg`  
  open: `/tools/figures/math/triangle?A=30&AB=&CA=10&BLabel=none&ABLabel=text&ABText=y`
- **Isosceles triangle with its height drawn, for area** — Isosceles triangle ABC with base AB labeled 10, equal sides CA and BC labeled 13 with one tick mark each, and a dashed height from C labeled h  
  file: `public/tools/figure-library/math/triangle/isosceles-triangle-with-height-for-area.svg`  
  open: `/tools/figures/math/triangle?A=&B=&AB=10&BC=13&CA=13&BCLabel=auto&BCTicks=1&CATicks=1&hC=1&hCLabel=text&hCText=h`
- **Law of cosines: two sides and the angle between them** — Triangle ABC with AB labeled 8 m, CA labeled 11 m, the 40° angle between them at A, and the third side BC labeled x  
  file: `public/tools/figure-library/math/triangle/law-of-cosines-two-sides-and-included-angle.svg`  
  open: `/tools/figures/math/triangle?A=40&B=&AB=8&CA=11&unit=m`
- **Right triangle with legs 3 and 4: find the hypotenuse** — Right triangle ABC with the right angle at B, leg AB labeled 3, leg BC labeled 4 and the hypotenuse CA labeled x  
  file: `public/tools/figure-library/math/triangle/right-triangle-legs-3-and-4-hypotenuse-x.svg`  
  open: `/tools/figures/math/triangle?A=&AB=3&BC=4&BLabel=none&BCLabel=auto&CALabel=text&CAText=x`
- **SOHCAHTOA: find the side opposite a 35° angle** — Right triangle ABC with a 35° angle at A, a right angle at B, the hypotenuse labeled 12 cm and the side opposite A labeled x  
  file: `public/tools/figure-library/math/triangle/sohcahtoa-find-the-opposite-side.svg`  
  open: `/tools/figures/math/triangle?A=35&AB=&CA=12&BLabel=none&unit=cm`

## math / two-way-table

- **Blank two-way table to complete from a description** — A blank two-way table of adults and children choosing vanilla, chocolate or strawberry ice cream, with only the grand total of 60 given  
  file: `public/tools/figure-library/math/two-way-table/blank-two-way-table-to-complete-from-a-description.svg`  
  open: `/tools/figures/math/two-way-table?titleMode=blank&cols=Vanilla%7CChocolate%7CStrawberry&row=Adults%7C%7C%7C%7C&row=Children%7C%7C%7C%7C&tot=%7C%7C%7C60`
- **Conditional relative frequency table: favorite sport by grade, in row percents** — A relative frequency table of favorite sport in grades 6, 7 and 8 as percents of each row, with lines only under the headings and before the totals  
  file: `public/tools/figure-library/math/two-way-table/conditional-relative-frequency-table-row-percents-favorite-sport.svg`  
  open: `/tools/figures/math/two-way-table?show=relative&relativeTo=row&form=percent&places=0&headers=plain&rules=some&cols=Soccer%7CBasketball%7CSwimming&row=Grade+6%7C10%7C6%7C4%7C20&row=Grade+7%7C12%7C12%7C6%7C30&row=Grade+8%7C18%7C22%7C10%7C50&tot=40%7C40%7C20%7C100`
- **Joint relative frequency table: pets by grade** — A two-way relative frequency table of grade 7 and grade 8 students with and without a pet, each cell a decimal of the grand total  
  file: `public/tools/figure-library/math/two-way-table/joint-relative-frequency-table-pets-by-grade.svg`  
  open: `/tools/figures/math/two-way-table?show=relative&title=Joint+relative+frequencies&titleMode=text&cols=Pet%7CNo+pet&row=Grade+7%7C28%7C12%7C40&row=Grade+8%7C24%7C16%7C40&tot=52%7C28%7C80`
- **Relative frequency table as fractions: left- and right-handed students** — A two-way table of left- and right-handed boys and girls as fractions of each column, with the corner split by a diagonal into Hand and Student  
  file: `public/tools/figure-library/math/two-way-table/relative-frequency-table-as-fractions-left-and-right-handed.svg`  
  open: `/tools/figures/math/two-way-table?show=relative&relativeTo=column&form=fraction&columnTitle=Hand&rowTitle=Student&corner=diagonal&cols=Left-handed%7CRight-handed&row=Boys%7C4%7C26%7C30&row=Girls%7C3%7C27%7C30&tot=7%7C53%7C60`
- **Two-way table gap-fill: boys’ and girls’ language choices** — A two-way table of the language 100 boys and girls chose, French, German or Spanish, with five cells left blank, totals included  
  file: `public/tools/figure-library/math/two-way-table/two-way-table-gap-fill-language-choices.svg`  
  open: `/tools/figures/math/two-way-table?cols=French%7CGerman%7CSpanish&row=Boys%7C18%7C%7C15%7C&row=Girls%7C%7C17%7C%7C55&tot=40%7C29%7C%7C100`
- **Two-way table: how students travel to school, with gaps to fill** — A two-way table of how students in Years 7, 8 and 9 travel to school by walking, bus or car, with totals and three cells left blank  
  file: `public/tools/figure-library/math/two-way-table/two-way-table-how-students-travel-to-school.svg`  
  open: `/tools/figures/math/two-way-table?title=How+students+travel+to+school&titleMode=text&columnTitle=Transport&rowTitle=Year&cols=Walk%7CBus%7CCar&row=Year+7%7C12%7C%7C8%7C30&row=Year+8%7C15%7C8%7C%7C29&row=Year+9%7C%7C14%7C5%7C28&tot=36%7C32%7C19%7C87`
- **Two-way table with an unknown, x** — A two-way table of school lunches and packed lunches in Years 10 and 11, with one count written as x and the Year 11 total left blank  
  file: `public/tools/figure-library/math/two-way-table/two-way-table-with-an-unknown-x.svg`  
  open: `/tools/figures/math/two-way-table?cols=School+lunch%7CPacked+lunch&row=Year+10%7C46%7Cx%7C80&row=Year+11%7C38%7C41%7C&tot=84%7C75%7C159`

## math / venn-diagram

- **Prime factor Venn diagram for the HCF and LCM of 36 and 60** — A Venn diagram of the prime factors of 36 and 60, with 2, 2 and 3 in the overlap, 3 in the 36 circle only and 5 in the 60 circle only  
  file: `public/tools/figure-library/math/venn-diagram/prime-factor-venn-diagram-hcf-lcm-36-and-60.svg`  
  open: `/tools/figures/math/venn-diagram?mode=sets&nameA=36&nameB=60&universe=none&listA=2%2C+2%2C+3%2C+3&listB=2%2C+2%2C+3%2C+5`
- **Three-set Venn diagram with numbers: pets** — A three-set Venn diagram of Cat, Dog and Fish in a box marked U, with a number in each of its eight regions  
  file: `public/tools/figure-library/math/venn-diagram/three-set-venn-diagram-with-numbers.svg`  
  open: `/tools/figures/math/venn-diagram?sets=3&nameA=Cat&nameB=Dog&nameC=Fish&r_a=9&r_b=7&r_ab=4&r_c=3&r_ac=2&r_bc=1&r_abc=2&r_out=5`
- **Venn diagram with numbers: football and tennis** — A Venn diagram of two overlapping circles, Football and Tennis, in a box marked U, with 12 in Football only, 5 in both, 8 in Tennis only and 15 outside  
  file: `public/tools/figure-library/math/venn-diagram/venn-diagram-football-and-tennis.svg`  
  open: `/tools/figures/math/venn-diagram?nameA=Football&nameB=Tennis&r_a=12&r_b=8&r_ab=5&r_out=15`
- **Venn diagram of probabilities: find x** — A Venn diagram of probabilities with 0.3 in A only, x in the overlap of A and B, 0.25 in B only and 0.15 outside both circles  
  file: `public/tools/figure-library/math/venn-diagram/venn-diagram-probability-find-x.svg`  
  open: `/tools/figures/math/venn-diagram?r_a=0.3&r_b=0.25&r_ab=x&r_out=0.15`
- **Venn diagram with A ∩ B′ shaded** — A Venn diagram of two overlapping circles, A and B, in a box marked U, with the part of A outside B hatched and nothing written in the regions  
  file: `public/tools/figure-library/math/venn-diagram/venn-diagram-shade-a-intersect-b-complement.svg`  
  open: `/tools/figures/math/venn-diagram?shade=hatch&shaded=a`
- **Venn diagram sorting the numbers 1 to 20: even numbers and multiples of 3** — A Venn diagram sorting the numbers 1 to 20 into two overlapping circles, Even and Multiples of 3, with the numbers in neither outside the circles  
  file: `public/tools/figure-library/math/venn-diagram/venn-diagram-sorting-numbers-1-to-20.svg`  
  open: `/tools/figures/math/venn-diagram?mode=sets&nameA=Even&nameB=Multiples+of+3&universeList=1-20&listA=2%2C+4%2C+6%2C+8%2C+10%2C+12%2C+14%2C+16%2C+18%2C+20&listB=3%2C+6%2C+9%2C+12%2C+15%2C+18`

## physics / circuit-diagram

- **GCSE series circuit: a cell, a switch and two lamps** — A circuit diagram in IEC symbols: a cell, a closed switch and two lamps L_1 and L_2 in series, with a voltmeter across L_1  
  file: `public/tools/figure-library/physics/circuit-diagram/gcse-series-circuit-cell-switch-two-lamps-voltmeter.svg`  
  open: `/tools/figures/physics/circuit-diagram?loads=bulb%2C%7E_%2C%3Bbulb%2C%7E_%2C&source=cell&sourceValue=&switch=closed&voltmeter=1&symbols=iec`
- **Parallel circuit with three resistors: find the unknown resistance** — A circuit diagram of a 12 V battery with an ammeter reading 6 A, and three resistors in parallel: R_1 4 Ω, R_2 6 Ω and R_3 x  
  file: `public/tools/figure-library/physics/circuit-diagram/parallel-circuit-three-resistors-find-the-unknown-resistance.svg`  
  open: `/tools/figures/physics/circuit-diagram?arrangement=parallel&loads=resistor%3Bresistor%2C%7E_%2C6+Omega%3Bresistor%2C%7E_%2Cx&ammeter=1&ammeterLabel=6+A&polarity=1`
- **Parallel circuit with two resistors and a voltmeter** — A circuit diagram of a 6 V battery and an ammeter beside it, driving R_1 3 Ω and R_2 6 Ω in parallel, with a voltmeter across R_2 and its reading left blank  
  file: `public/tools/figure-library/physics/circuit-diagram/parallel-circuit-two-resistors-with-voltmeter.svg`  
  open: `/tools/figures/physics/circuit-diagram?arrangement=parallel&loads=resistor%2C%7E_%2C3+Omega%3Bresistor%2C%7E_%2C6+Omega&sourceValue=6+V&ammeter=1&voltmeter=2&voltmeterLabel=%7E`
- **Series circuit with two bulbs and an open switch** — A circuit diagram of a 3 V battery, an open switch and two bulbs in series  
  file: `public/tools/figure-library/physics/circuit-diagram/series-circuit-bulbs-open-switch.svg`  
  open: `/tools/figures/physics/circuit-diagram?loads=bulb%2C%7E_%2C%3Bbulb%2C%7E_%2C&sourceValue=3+V&switch=open`
- **Series circuit with three resistors and an ammeter** — A circuit diagram of a 12 V battery, an ammeter with a blank reading, and resistors R_1 2 Ω, R_2 4 Ω and R_3 6 Ω in series  
  file: `public/tools/figure-library/physics/circuit-diagram/series-circuit-three-resistors-ammeter-reading-blank.svg`  
  open: `/tools/figures/physics/circuit-diagram?ammeter=1&ammeterLabel=%7E`

## physics / free-body-diagram

- **Free body diagram of a block sliding down an incline with friction** — A free body diagram of a block with F_g straight down, F_N tilted 30° from the vertical and marked θ, and F_f pointing up the slope, with a dashed velocity arrow down the slope  
  file: `public/tools/figure-library/physics/free-body-diagram/free-body-diagram-block-sliding-down-incline-with-friction.svg`  
  open: `/tools/figures/physics/free-body-diagram?body=block&forces=270%2C1%2CF_g%3B120%2C0.85%2CF_N%2C1%2Cv%3B30%2C0.5%2CF_f&velocity=1&velocityAngle=210`
- **Free body diagram of a box pushed across a floor with friction** — A free body diagram of a block with four forces: F_g down, F_N up, F_A to the right and a shorter F_f to the left, with a dashed velocity arrow v to the right  
  file: `public/tools/figure-library/physics/free-body-diagram/free-body-diagram-box-pushed-across-floor-with-friction.svg`  
  open: `/tools/figures/physics/free-body-diagram?body=block&forces=270%2C1%2CF_g%3B90%2C1%2CF_N%3B0%2C1%2CF_A%3B180%2C0.6%2CF_f&velocity=1`
- **Free body diagram of a falling ball with air resistance** — A free body diagram of a ball with a long F_g arrow down and a shorter F_air arrow up, beside dashed v and a arrows pointing down  
  file: `public/tools/figure-library/physics/free-body-diagram/free-body-diagram-falling-ball-with-air-resistance.svg`  
  open: `/tools/figures/physics/free-body-diagram?body=ball&forces=270%2C1%2CF_g%3B90%2C0.5%2CF_%7Bair%7D&velocity=1&velocityAngle=270&acceleration=1&accelerationAngle=270`
- **Free body diagram with the normal force and tension both pointing up, in vector notation** — A free body diagram of a block with F_g straight down and two shorter arrows side by side pointing up, F_N and T, every label with an arrow over its letter  
  file: `public/tools/figure-library/physics/free-body-diagram/free-body-diagram-normal-force-and-tension-both-up-vector-notation.svg`  
  open: `/tools/figures/physics/free-body-diagram?body=block&forces=270%2C1%2CF_g%3B90%2C0.6%2CF_N%3B90%2C0.4%2CT&notation=arrow`
- **Free body diagram of a sign hanging from two cables** — A free body diagram of a dot with tensions T_1 and T_2 pulling up and out at θ above the horizontal on each side, and F_g straight down  
  file: `public/tools/figure-library/physics/free-body-diagram/free-body-diagram-sign-hanging-from-two-cables.svg`  
  open: `/tools/figures/physics/free-body-diagram?forces=150%2C1%2CT_1%2C1%3B30%2C1%2CT_2%2C1%3B270%2C1%2CF_g`
- **Free body diagram of a sled pulled at an angle** — A free body diagram of a block pulled by F_A at θ above the horizontal, with F_g down, a shorter F_N up and F_f to the left  
  file: `public/tools/figure-library/physics/free-body-diagram/free-body-diagram-sled-pulled-at-an-angle.svg`  
  open: `/tools/figures/physics/free-body-diagram?body=block&forces=270%2C1%2CF_g%3B90%2C0.6%2CF_N%3B180%2C0.5%2CF_f%3B35%2C1%2CF_A%2C1`

## physics / inclined-plane

- **Ball on a ramp with its length, height and angle labeled** — A ball labeled m on a ramp, with the slope’s length marked L, the ramp’s height marked h and its angle marked θ  
  file: `public/tools/figure-library/physics/inclined-plane/ball-on-ramp-length-height-angle-labeled.svg`  
  open: `/tools/figures/physics/inclined-plane?objects=m%2Cball&angle=25&lengthMark=1&heightMark=1`
- **Block on a rough inclined plane with gravity, normal force and friction** — A block labeled m on a hatched ramp at angle θ, with F_g straight down, F_N out of the slope and F_f up the slope  
  file: `public/tools/figure-library/physics/inclined-plane/block-on-rough-inclined-plane-gravity-normal-friction.svg`  
  open: `/tools/figures/physics/inclined-plane?surface=rough&gravity=1&normal=1&friction=up`
- **Block pushed up a rough incline with an applied force** — A block labeled m on a rough ramp at θ, with F_A up the slope, F_f down the slope, F_g down and F_N out of the slope, and a dashed velocity v up the slope  
  file: `public/tools/figure-library/physics/inclined-plane/block-pushed-up-a-rough-incline.svg`  
  open: `/tools/figures/physics/inclined-plane?surface=rough&gravity=1&normal=1&friction=down&applied=up&velocity=up`
- **Cart rolling down a 20° ramp** — A cart labeled m on a smooth ramp at 20°, with dashed velocity v and acceleration a arrows pointing down the slope  
  file: `public/tools/figure-library/physics/inclined-plane/cart-rolling-down-a-20-degree-ramp.svg`  
  open: `/tools/figures/physics/inclined-plane?objects=m%2Ccart&angle=20&angleLabel=20deg&velocity=down&acceleration=down`
- **Label the forces: 5 kg block on a 35° incline** — A block labeled 5 kg on a rough ramp at 35°, with three force arrows, down, out of the slope and up the slope, each with a blank line for its label  
  file: `public/tools/figure-library/physics/inclined-plane/label-the-forces-block-on-a-35-degree-incline.svg`  
  open: `/tools/figures/physics/inclined-plane?objects=5+kg&angle=35&angleLabel=35deg&surface=rough&gravity=1&gravityLabel=%7E&normal=1&normalLabel=%7E&friction=up&frictionLabel=%7E`
- **Two blocks tied by a string, pulled up an incline** — Blocks m_1 and m_2 on a ramp at θ, tied by a string, with F_A pulling m_2 up the slope, tension T at both ends of the string, F_g1 and F_g2 down and F_N1 and F_N2 out of the slope  
  file: `public/tools/figure-library/physics/inclined-plane/two-blocks-tied-by-a-string-pulled-up-an-incline.svg`  
  open: `/tools/figures/physics/inclined-plane?objects=m_1%3Bm_2&gravity=1&normal=1&applied=up&tension=1`

## physics / length-reading

- **0.02 mm caliper reading 41.38 mm** — A caliper with a 0.02 mm sliding scale holding a ball, reading 41.38 mm, with a close-up strip of its scales  
  file: `public/tools/figure-library/physics/length-reading/caliper-0-02-mm-reading-41-38-mm.svg`  
  open: `/tools/figures/physics/length-reading?instrument=caliper&leastCount=0.02&caliper=41.38&jaws=ball`
- **0.1 mm caliper reading 34.7 mm** — A caliper with a 0.1 mm sliding scale holding a cylinder, reading 34.7 mm, with a close-up strip of its scales  
  file: `public/tools/figure-library/physics/length-reading/caliper-0-1-mm-reading-34-7-mm.svg`  
  open: `/tools/figures/physics/length-reading?instrument=caliper&leastCount=0.1&caliper=34.7&jaws=cylinder`
- **Caliper reading 23.45 mm** — A caliper holding a block, reading 23.45 mm on its 0.05 mm sliding scale, with a close-up strip of its scales  
  file: `public/tools/figure-library/physics/length-reading/caliper-reading-23-45-mm.svg`  
  open: `/tools/figures/physics/length-reading?instrument=caliper`
- **Caliper scales close-up: 62.35 mm** — A close-up strip of a caliper’s main scale and 0.05 mm sliding scale reading 62.35 mm  
  file: `public/tools/figure-library/physics/length-reading/caliper-scales-close-up-62-35-mm.svg`  
  open: `/tools/figures/physics/length-reading?instrument=caliper&caliper=62.35&closeUp=magnifier`
- **Caliper with a zero error** — Two 0.1 mm calipers: above, with its jaws closed, reading 0.3 mm; below, holding block A, reading 27.6 mm, each with a close-up strip of its scales  
  file: `public/tools/figure-library/physics/length-reading/caliper-with-a-zero-error.svg`  
  open: `/tools/figures/physics/length-reading?instrument=caliper&leastCount=0.1&caliper=27.6&caliperZero=0.3&jawsLabel=A`
- **Metric ruler reading 7.45 cm** — A 15 cm ruler marked in millimeters with a metal cylinder lying along it from 0 to 7.45 cm, with a magnified view of its right end  
  file: `public/tools/figure-library/physics/length-reading/metric-ruler-reading-7-45-cm.svg`  
  open: `/tools/figures/physics/length-reading?length=7.45`
- **Micrometer reading 7.38 mm** — A micrometer holding a ball bearing, reading 7.38 mm, with a magnified view of its sleeve and thimble  
  file: `public/tools/figure-library/physics/length-reading/micrometer-reading-7-38-mm.svg`  
  open: `/tools/figures/physics/length-reading?instrument=micrometer&micrometerRead=mark&jaws=ball`
- **Micrometer reading estimated to 0.001 mm: 6.847 mm** — A micrometer holding a cylinder, reading 6.847 mm, with a magnified view showing the datum line between the thimble’s 34th and 35th marks  
  file: `public/tools/figure-library/physics/length-reading/micrometer-reading-estimated-to-0-001-mm.svg`  
  open: `/tools/figures/physics/length-reading?instrument=micrometer&micrometer=6.847&jaws=cylinder`
- **Micrometer reading just past half a millimeter: 5.51 mm** — A micrometer holding a wire, reading 5.51 mm, with a magnified view showing the 5.5 mm mark just uncovered on the sleeve  
  file: `public/tools/figure-library/physics/length-reading/micrometer-reading-just-past-half-a-millimeter.svg`  
  open: `/tools/figures/physics/length-reading?instrument=micrometer&micrometer=5.51&micrometerRead=mark&jaws=wire`
- **Micrometer with a negative zero error** — Two micrometers: above, closed, its thimble’s 0 three marks above the datum line, reading −0.03 mm; below, holding a wire, reading 3.27 mm, each with a magnified view  
  file: `public/tools/figure-library/physics/length-reading/micrometer-with-a-negative-zero-error.svg`  
  open: `/tools/figures/physics/length-reading?instrument=micrometer&micrometer=3.27&micrometerRead=mark&micrometerZero=-0.03&jaws=wire`

## physics / motion-graphs

- **Matching position–time, velocity–time and acceleration–time graphs** — Position–time, velocity–time and acceleration–time graphs stacked on one time axis for a cart that goes forward, stops, then goes back, each segment in its own line style, with the segment ends lettered A to F  
  file: `public/tools/figure-library/physics/motion-graphs/matching-position-velocity-acceleration-time-graphs-stacked.svg`  
  open: `/tools/figures/physics/motion-graphs?segments=faster%2C4%2C2%3Bforward%3Bslower%2C0%2C2%3Bfaster%2C4%2C2%2Cback%3Bslower%2C0%2C2&graphs=all&letters=1&styles=1`
- **Position–time graph shapes without numbers** — A position–time graph with no numbers or gridlines, lettered A to F: curving upward, straight, curving over, flat, then a straight line sloping down  
  file: `public/tools/figure-library/physics/motion-graphs/position-time-graph-shapes-without-numbers.svg`  
  open: `/tools/figures/physics/motion-graphs?segments=faster%3Bforward%2C4%2C2%3Bslower%2C0%3Brest%2C0%2C2%3Bback&numbers=0&gridlines=0&letters=1`
- **Position–time graph: speeding up, constant velocity, slowing down, lettered** — A position–time graph with its segment ends lettered A to E: curving upward from A to B, a straight line from B to C, curving over and leveling off from C to D, and flat from D to E  
  file: `public/tools/figure-library/physics/motion-graphs/position-time-graph-speeding-up-constant-velocity-slowing-down-lettered.svg`  
  open: `/tools/figures/physics/motion-graphs?letters=1`
- **Tangent to a position–time graph for instantaneous velocity** — A position–time graph curving upward for 6 s, with a dashed tangent line touching the curve at 4 s  
  file: `public/tools/figure-library/physics/motion-graphs/position-time-graph-tangent-instantaneous-velocity.svg`  
  open: `/tools/figures/physics/motion-graphs?segments=faster%2C6%2C6&tangent=1&tangentAt=4`
- **Velocity–time graph of a cart speeding up and slowing down** — A velocity–time graph of straight lines lettered A to F: flat at zero from A to B, rising gently from B to C, rising more steeply from C to D, level from D to E, and falling back to zero from E to F  
  file: `public/tools/figure-library/physics/motion-graphs/velocity-time-graph-speeding-up-and-slowing-down.svg`  
  open: `/tools/figures/physics/motion-graphs?segments=rest%2C0%2C2%3Bfaster%2C2%3Bfaster%2C6%3Bforward%2C6%3Bslower%2C0&graphs=vt&letters=1`

## physics / motion-map

- **Motion map of a cart that speeds up, moves at a constant velocity, slows down and stops** — A motion map with a dot every second from t = 0 s to 11 s along a number line from 0 to 35 m, the dots spreading out, then evenly spaced, then closing up, and one last dot labeled 12–15 s, each moving dot with a dashed velocity arrow  
  file: `public/tools/figure-library/physics/motion-map/motion-map-cart-speeding-up-constant-velocity-slowing-down-stopping.svg`  
  open: `/tools/figures/physics/motion-map?labels=times`
- **Motion map at a constant velocity** — A motion map of seven evenly spaced dots, 3 m apart from 0 to 18 m, labeled t = 0 s to 6 s, each with an equal dashed velocity arrow, and a = 0 written above them  
  file: `public/tools/figure-library/physics/motion-map/motion-map-constant-velocity.svg`  
  open: `/tools/figures/physics/motion-map?segments=forward%2C3%2C6&acceleration=1&labels=times`
- **Dots-only motion map: draw the velocity arrows** — A motion map with dots only, no arrows, lettered A to I along a number line from 0 to 22 m: evenly spaced at first, then spreading out, then closing up to a stop  
  file: `public/tools/figure-library/physics/motion-map/motion-map-dots-only-draw-the-velocity-arrows.svg`  
  open: `/tools/figures/physics/motion-map?segments=forward%2C2%3Bfaster%2C5%3Bslower%2C0%2C2&dotsOnly=1&labels=letters`
- **Motion map of an object slowing down to a stop** — A motion map of dots closing up from left to right, labeled t = 0 s to 4 s, then one dot labeled 5–7 s, with dashed velocity arrows getting shorter, and the total displacement Δx drawn under the number line  
  file: `public/tools/figure-library/physics/motion-map/motion-map-slowing-down-to-a-stop.svg`  
  open: `/tools/figures/physics/motion-map?segments=forward%2C6%2C1%3Bslower%2C0%2C4%3Brest%2C0%2C2&labels=times&displacement=1`
- **Motion map of an object speeding up from rest** — A motion map of seven dots lettered A to G, the gaps between them growing from left to right, with dashed velocity arrows getting longer and an acceleration arrow labeled a pointing right above them  
  file: `public/tools/figure-library/physics/motion-map/motion-map-speeding-up-from-rest.svg`  
  open: `/tools/figures/physics/motion-map?segments=faster%2C6%2C6&acceleration=1&labels=letters`
- **Motion map of a cart going out and back, lettered to match its motion graph** — A motion map of a cart drawn on two lines: on the lower one it speeds up, moves steadily and slows to a stop at D, lettered A to D at the segment ends; on the line above it speeds up back toward the start and slows to a stop at F, with acceleration arrows above each segment  
  file: `public/tools/figure-library/physics/motion-map/motion-map-there-and-back-lettered-to-match-motion-graph.svg`  
  open: `/tools/figures/physics/motion-map?segments=faster%2C4%2C2%3Bforward%3Bslower%2C0%2C2%3Bfaster%2C4%2C2%2Cback%3Bslower%2C0%2C2&acceleration=1&labels=ends&object=cart`

## physics / projectile-motion

- **Ball launched horizontally off a cliff** — A ball launched horizontally off the top of a cliff with velocity v_0, drawn again at four equal time steps along its dashed path, with g down and the cliff’s height h and range R marked  
  file: `public/tools/figure-library/physics/projectile-motion/ball-launched-horizontally-off-a-cliff.svg`  
  open: `/tools/figures/physics/projectile-motion?start=cliff&angle=0&positions=4&gravity=1&rangeMark=1&cliffMark=1`
- **Projectile launched at 30° with its velocity components** — A ball launched from level ground at 30°, with the launch velocity v_0, its components v_0x and v_0y, and the dashed parabolic path to where it lands  
  file: `public/tools/figure-library/physics/projectile-motion/projectile-launched-at-30-degrees-with-velocity-components.svg`  
  open: `/tools/figures/physics/projectile-motion?angle=30&angleLabel=30deg&components=1`
- **Projectile with its maximum height and range labeled** — A ball launched at 45° with velocity v_0, its dashed path, g pointing down, the maximum height marked H and the range marked R  
  file: `public/tools/figure-library/physics/projectile-motion/projectile-maximum-height-and-range-labeled.svg`  
  open: `/tools/figures/physics/projectile-motion?gravity=1&heightMark=1&rangeMark=1`
- **Projectile path with the ball at equal time steps, lettered** — A ball launched at 60° from level ground, shown at the launch and six equal time steps along its path, lettered A to G  
  file: `public/tools/figure-library/physics/projectile-motion/projectile-path-at-equal-time-steps-lettered.svg`  
  open: `/tools/figures/physics/projectile-motion?angle=60&positions=6&letters=1&velocity=0`
- **Sketch the path: ball launched upward off a cliff** — A ball on the top corner of a cliff with a launch velocity v_0 at θ above the horizontal and the cliff’s height marked h, with no path drawn  
  file: `public/tools/figure-library/physics/projectile-motion/sketch-the-path-ball-launched-upward-off-a-cliff.svg`  
  open: `/tools/figures/physics/projectile-motion?start=cliff&angle=30&path=0&cliffMark=1`

## physics / pulley

- **Atwood machine with tension, weight and acceleration** — An Atwood machine: masses m_1 and m_2 hanging over one fixed pulley, with tension T up each side of the string, weights m_1 g and m_2 g down, and dashed acceleration arrows a, up on the left and down on the right  
  file: `public/tools/figure-library/physics/pulley/atwood-machine-tension-weight-acceleration.svg`  
  open: `/tools/figures/physics/pulley?tension=1&gravity=1&acceleration=forward`
- **Atwood machine with three masses** — An Atwood machine with m_1 on the left, m_2 on the right and m_3 hanging below m_2 on a second string, with tensions T_1 and T_2, weights m_1 g, m_2 g and m_3 g, and dashed acceleration arrows a  
  file: `public/tools/figure-library/physics/pulley/atwood-machine-with-three-masses.svg`  
  open: `/tools/figures/physics/pulley?objects=m_1%2Cm_1+g%3Bm_2%2Cm_2+g%3Bm_3%2Cm_3+g&tension=1&gravity=1&acceleration=forward`
- **Block and tackle with 3 strands holding up the load** — A block and tackle: a load m hanging from a bar under a movable pulley, held up by three strands of rope, with tension T up each strand, T down at the free end, and the weight mg  
  file: `public/tools/figure-library/physics/pulley/block-and-tackle-3-strands-holding-the-load.svg`  
  open: `/tools/figures/physics/pulley?setup=tackle&strands=3&tension=1&gravity=1`
- **Block on an incline tied over a pulley to a hanging mass** — A block m_1 on a ramp at angle θ, tied by a string over a pulley at the top of the ramp to a hanging block m_2, with tension, weights and the normal force drawn  
  file: `public/tools/figure-library/physics/pulley/block-on-incline-tied-over-pulley-to-hanging-mass.svg`  
  open: `/tools/figures/physics/pulley?setup=ramp&angle=40&tension=1&gravity=1&normal=1`
- **Block on a table pulled by a hanging mass over a pulley** — A block m_1 on a rough table tied over a pulley at the table’s edge to a hanging block m_2, with tension, weight, normal force, friction and acceleration arrows  
  file: `public/tools/figure-library/physics/pulley/block-on-table-pulled-by-hanging-mass-over-pulley.svg`  
  open: `/tools/figures/physics/pulley?setup=table&surface=rough&tension=1&gravity=1&normal=1&friction=away&acceleration=forward`
- **Cart on a table and a hanging mass, masses left blank** — A cart on a smooth table tied over a pulley to a hanging block, with blank lines on the cart and the block for their masses  
  file: `public/tools/figure-library/physics/pulley/cart-on-table-and-hanging-mass-masses-left-blank.svg`  
  open: `/tools/figures/physics/pulley?setup=table&objects=%7E%2Cm_1+g%2Ccart%3B%7E%2Cm_2+g`

## physics / ray-diagram

- **Blank converging lens ray diagram worksheet** — A blank ray diagram of a converging lens with F, F′, 2F and 2F′ marked on the principal axis, an object between F and 2F, and a numbered cm scale underneath, with no rays drawn  
  file: `public/tools/figure-library/physics/ray-diagram/blank-converging-lens-ray-diagram-worksheet.svg`  
  open: `/tools/figures/physics/ray-diagram?distance=15&shown=setup&scale=1`
- **Concave mirror ray diagram: object between C and F** — A ray diagram of a concave mirror with F and C marked, an object between C and F, four principal rays, and a real, inverted, larger image beyond C  
  file: `public/tools/figure-library/physics/ray-diagram/concave-mirror-ray-diagram-object-between-c-and-f.svg`  
  open: `/tools/figures/physics/ray-diagram?element=concave&distance=15&height=3`
- **Converging lens with the object at 2F** — A ray diagram of a converging lens with the object at 2F and a real, inverted image of the same size at 2F′, with the object and image distances marked d_o and d_i  
  file: `public/tools/figure-library/physics/ray-diagram/converging-lens-object-at-2f.svg`  
  open: `/tools/figures/physics/ray-diagram?distance=20&doMark=1&diMark=1`
- **Converging lens ray diagram: object beyond 2F** — A ray diagram of a converging lens with F, F′, 2F and 2F′ marked, an object O beyond 2F, three principal rays, and a real, inverted, smaller image I between F′ and 2F′  
  file: `public/tools/figure-library/physics/ray-diagram/converging-lens-ray-diagram-object-beyond-2f.svg`  
  open: `/tools/figures/physics/ray-diagram`
- **Convex mirror ray diagram** — A ray diagram of a convex mirror with F and C behind it; the reflected rays spread out and their dashed extensions meet behind the mirror at a small, upright, virtual image  
  file: `public/tools/figure-library/physics/ray-diagram/convex-mirror-ray-diagram.svg`  
  open: `/tools/figures/physics/ray-diagram?element=convex&distance=20`
- **Diverging lens ray diagram** — A ray diagram of a diverging lens with an object beyond 2F; the rays spread out and their dashed extensions meet between the lens and F at a small, upright, virtual image  
  file: `public/tools/figure-library/physics/ray-diagram/diverging-lens-ray-diagram.svg`  
  open: `/tools/figures/physics/ray-diagram?element=diverging&distance=20`
- **Magnifying glass ray diagram: object inside F** — A ray diagram of a converging lens with the object inside F; the rays spread out after the lens and their dashed extensions meet behind the object at a dashed, upright, larger virtual image  
  file: `public/tools/figure-library/physics/ray-diagram/magnifying-glass-ray-diagram-object-inside-f.svg`  
  open: `/tools/figures/physics/ray-diagram?distance=5&height=3`
- **Plane mirror ray diagram** — A ray diagram of a plane mirror with an object 15 cm in front; two rays from its tip reflect at equal angles and their dashed extensions meet behind the mirror at an upright virtual image the same size, 15 cm behind  
  file: `public/tools/figure-library/physics/ray-diagram/plane-mirror-ray-diagram.svg`  
  open: `/tools/figures/physics/ray-diagram?element=plane&distance=15&doMark=1&diMark=1`

## physics / spring-scale

- **5 N spring scale with slotted masses** — A green 5 N spring scale holding a hanger with four slotted masses, the pointer at 2.45 N, with a magnified view  
  file: `public/tools/figure-library/physics/spring-scale/5-n-spring-scale-with-slotted-masses.svg`  
  open: `/tools/figures/physics/spring-scale?capacity=5&force=2.45&hanging=masses&masses=4`
- **50 N spring scale in newtons and grams** — A black and white 50 N spring scale printed in newtons on the left and grams on the right, with a block on its hook and the pointer at 27.50 N (2750 g)  
  file: `public/tools/figure-library/physics/spring-scale/50-n-spring-scale-in-newtons-and-grams.svg`  
  open: `/tools/figures/physics/spring-scale?capacity=50&units=both&force=27.5&color=0`
- **Spring scale reading 6.25 N** — A tan 10 N spring scale with a block on its hook, the pointer at 6.25 N, with a magnified view of the pointer  
  file: `public/tools/figure-library/physics/spring-scale/spring-scale-reading-6-25-n.svg`  
  open: `/tools/figures/physics/spring-scale?force=6.25`
- **Spring scale reading in grams** — A pink 1 N spring scale printed in grams, from 0 to 100 g, with a block on its hook and the pointer at 45.5 g  
  file: `public/tools/figure-library/physics/spring-scale/spring-scale-reading-in-grams.svg`  
  open: `/tools/figures/physics/spring-scale?capacity=1&units=grams&force=0.455`
- **Spring scale with a zero error** — Two 10 N spring scales: on the left, with nothing hanging, the pointer rests at 0.20 N; on the right, with a block, it reads 4.30 N  
  file: `public/tools/figure-library/physics/spring-scale/spring-scale-with-a-zero-error.svg`  
  open: `/tools/figures/physics/spring-scale?force=4.1&zero=0.2`

## physics / vector-diagram

- **Adding three vectors head to tail** — On a grid, vectors A, B and C drawn head to tail, A to the right, B up and to the right, C up and to the left, with the dashed resultant R from A’s tail to C’s tip  
  file: `public/tools/figure-library/physics/vector-diagram/adding-three-vectors-head-to-tail.svg`  
  open: `/tools/figures/physics/vector-diagram?vectors=5%3B4%2C60%2CB%3B3%2C150%2CC`
- **Adding two perpendicular vectors head to tail** — On a grid, vector A 6 squares to the right, then vector B 8 squares up from its tip, with the dashed resultant R from A’s tail to B’s tip and its angle marked θ  
  file: `public/tools/figure-library/physics/vector-diagram/adding-two-perpendicular-vectors-head-to-tail.svg`  
  open: `/tools/figures/physics/vector-diagram?vectors=6%3B8%2C90%2CB&resultantArc=1`
- **Resolving a vector into x and y components** — On a grid with x and y axes, vector A at θ above the x axis, with its dashed components A_x along the x axis and A_y up to A’s tip  
  file: `public/tools/figure-library/physics/vector-diagram/resolving-a-vector-into-x-and-y-components.svg`  
  open: `/tools/figures/physics/vector-diagram?vectors=5%2C37%2CA%2Csolid%2C1%2Ch%2Ctheta%2C1&resultant=none&axes=1`
- **Subtracting vectors: A − B as A + (−B)** — On a grid, vector A 5 squares to the right, then −B 3 squares straight down from its tip, with the dashed resultant A − B  
  file: `public/tools/figure-library/physics/vector-diagram/subtracting-vectors-a-minus-b.svg`  
  open: `/tools/figures/physics/vector-diagram?vectors=5%3B3%2C270%2C%E2%88%92B&resultantLabel=A+%E2%88%92+B`
- **Vector addition worksheet: draw the resultant** — On a grid, vector A 4 squares at 30° and vector B 5 squares at 120° drawn head to tail, with no resultant drawn  
  file: `public/tools/figure-library/physics/vector-diagram/vector-addition-worksheet-draw-the-resultant.svg`  
  open: `/tools/figures/physics/vector-diagram?vectors=4%2C30%3B5%2C120%2CB&resultant=none`

## physics / waves

- **Displacement–time graph of a wave: period and frequency** — A transverse wave on axes of displacement in cm against time in s, four cycles over 2 seconds, with tick marks instead of gridlines and its period T marked from crest to crest  
  file: `public/tools/figure-library/physics/waves/displacement-time-graph-of-a-wave-period-and-frequency.svg`  
  open: `/tools/figures/physics/waves?xAxis=time&amplitude=4&period=0.5&cycles=4&amplitudeMark=0&gridlines=0&xTitle=Time+%28s%29`
- **Label the compression and rarefaction of a longitudinal wave** — A longitudinal wave of vertical lines over a distance axis in m, with its wavelength λ marked from one compression to the next and blank lines under a compression and a rarefaction  
  file: `public/tools/figure-library/physics/waves/label-the-compression-and-rarefaction-of-a-longitudinal-wave.svg`  
  open: `/tools/figures/physics/waves?wave=longitudinal&compressionLabel=%7E&rarefactionLabel=%7E`
- **Label the parts of a wave worksheet** — A transverse wave about a dashed rest line, with no axes, with blank lines for its wavelength, amplitude, a crest and a trough  
  file: `public/tools/figure-library/physics/waves/label-the-parts-of-a-wave-worksheet.svg`  
  open: `/tools/figures/physics/waves?cycles=2.5&wavelengthLabel=%7E&amplitudeLabel=%7E&crestLabel=%7E&troughLabel=%7E&axes=0`
- **Longitudinal wave above its matching transverse wave** — A longitudinal wave drawn as vertical lines, bunched at a compression and spread at a rarefaction, above a transverse wave on a displacement–distance grid, the compressions directly over the crests  
  file: `public/tools/figure-library/physics/waves/longitudinal-wave-above-a-transverse-wave.svg`  
  open: `/tools/figures/physics/waves?wave=both&cycles=2.5&crestLabel=crest&troughLabel=trough&compressionLabel=compression&rarefactionLabel=rarefaction`
- **Measure the wavelength and amplitude of a wave** — A transverse wave three cycles long on a grid of displacement in cm against distance in m, numbered every meter and centimeter, with nothing marked  
  file: `public/tools/figure-library/physics/waves/measure-the-wavelength-and-amplitude-of-a-wave.svg`  
  open: `/tools/figures/physics/waves?amplitude=2&wavelength=6&cycles=3&wavelengthMark=0&amplitudeMark=0`
- **Transverse wave with its wavelength and amplitude labeled** — A transverse wave on a grid of displacement in cm against distance in m, two and a half cycles long, with its wavelength λ marked from crest to crest, its amplitude A from the rest line up to a crest, and a crest and a trough labeled  
  file: `public/tools/figure-library/physics/waves/transverse-wave-with-wavelength-and-amplitude-labeled.svg`  
  open: `/tools/figures/physics/waves?cycles=2.5&crestLabel=crest&troughLabel=trough`
