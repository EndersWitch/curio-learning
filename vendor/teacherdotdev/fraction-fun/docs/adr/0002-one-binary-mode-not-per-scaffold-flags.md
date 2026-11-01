# One binary mode (Interactive or Watch), not per-scaffold switches, for now

ADR 0001 keeps each scaffold a separate piece that a URL flag could switch off later. The first change asked for wasn't one scaffold, though: it was the whole activity to play itself, step by step, for modelling to a class. So a link has exactly one **Mode**, `mode=watch` or the interactive default, and there are no per-scaffold flags yet.

Watch mode drives the same actions a student's taps would (the same −/+ ticks, throws, counts, picks and confirms), so it can't drift from the interactive flow and never reaches a hint.

Trade-off: teachers can't yet mix, say, auto-dealing with hand counting. If per-scaffold switches arrive later, they sit inside Interactive mode; `mode=watch` stays as it is, because links carrying it get pasted into Google Classroom and must keep working.
