# Lewis structures start correct and are changed from settings

A Lewis structure isn't worked out from any formula the teacher types. The generator builds it only when the formula has one central atom (CH₄, H₂O, SF₆, SO₄²⁻), and takes the skeletons of molecules with more than one central atom (ethanol, HNO₃, N₂H₄) from a list stored by hand, placing their electrons the same way. Teachers can then change it to make a wrong structure for a "find the mistake" question: a bond's order, an atom's lone electrons or formal charge, the brackets and charge, or the central atom. The settings store the starting structure (a formula or listed structure) plus the list of changes, not the whole structure, so the address stays short (ADR 0001) and resetting to the correct structure just clears the changes.

Drawing and checking are kept apart. The drawing draws any structure, even an impossible one (five bonds on C, ten electrons on O, a lone electron), and never assumes it follows the rules. A separate check compares the structure to the rules (octets under the teacher's structure rule, duets for H, the total valence electrons) and to the correct structure's central atom, and writes each mistake as a sentence. The answer key of a changed structure lists those mistakes.

## Considered Options

- **Work out the structure from any formula**: what teachers first imagine, but a formula doesn't say which atoms bond to which (C₂H₆O is ethanol or dimethyl ether; in HNO₃ the H bonds to O), and octet exceptions and formal charge choices make a general answer unreliable. A wrong "correct" structure costs more trust than a missing molecule.
- **A chemistry library such as RDKit.js**: solves 2D layout, but it is large WebAssembly that complicates rendering on the server, and it draws skeletal formulas, not dots.
- **Store the whole structure in the address**: allows any change, including moving bonds, but makes long addresses, and loses "reset to correct" and knowing which settings the teacher changed.
- **Drag atoms and bonds by hand**: a small drawing app, rejected for the same reasons as dragging particles (ADR 0002).

## Consequences

Changing which atoms bond to which is possible only through the central atom of a built structure; listed structures keep their skeleton. A molecule not in the list is a generator request. Each listed structure needs hand-checked 2D positions and test cases, and the check must be tested against every built and listed structure (a correct structure has no mistakes).
