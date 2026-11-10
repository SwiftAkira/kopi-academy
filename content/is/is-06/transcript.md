**Introduction**

Eh, truth table with 3 letters, 8 rows, okay lah. But 20 letters? More than 1 MILLION rows. Who got time? DPLL is the smart way. It hunts for 1 model, and every step throws away a big chunk of the table. No need to fill in every row. Today, 4 things. The 1 move that DPLL makes. The 3 rules that pick the move. 1 full trace by hand, exam style. And the pseudocode, which the exam prints with gaps, so must know by heart hor.

**The move and the 3 rules**

DPLL eats clauses, so CNF first. The 1 move: make a literal TRUE. Then 2 things happen. Every clause that contains that literal is satisfied already: REMOVE it. Every clause that contains the opposite literal: that literal is dead, so SHORTEN the clause. Example: P false means not P is true. Clause not P or R: remove. Clause P or R: become just R. Which literal to pick? 3 rules, in order. Rule 1, UNIT clause: a clause with only 1 literal. No choice what, must make it true. Rule 2, PURE literal: a letter that always show the same sign. Just make it true lor. Rule 3, SPLIT: no unit, no pure, then you choose. By hand: first letter in the alphabet, FALSE first. And when to stop? No clauses left: satisfiable, shiok. See Q and also not Q as unit clauses: contradiction, this branch die already.

**A trace by hand**

Now we trace. 5 clauses: not Q or not R. Not P or Q. P or R. Q or not R. Q or R. Got unit clause? No. Pure literal? No, every letter got both signs. So split: P FALSE first. Not P or Q: remove. P or R: shorten to R. Now 4 clauses, and R stand alone: unit! So R true. What is left? Not Q, and Q. Alamak, contradiction. Both cannot be true what. So BACKTRACK: go back to the original 5 clauses, this time P true. P or R: remove. Not P or Q: shorten to Q. Unit Q, so Q true. Only not R is left, unit again, so R false. No clauses left! Satisfiable. Model: P true, Q true, R false. Notice ah, R true came from the dead branch, throw away. The model comes from the branch that SURVIVED. And if P true also die? Then nothing left to try: unsatisfiable.

**The pseudocode**

Last part, the pseudocode. Same story, just written down. DPLL of F and literal. Line 1: remove clauses containing literal. Line 2: shorten clauses containing not literal. Mirror image, dun swap ah. Then 3 ifs. F contains no clauses: return TRUE. F contains empty clause: return FALSE. F contains a unit or pure L: return DPLL of F and L. Then the split. Choose P in F. If DPLL of F and not P: return true. Else: return DPLL of F and P. Not P first, that is your false first. The trap: no clauses and empty clause sound the same, but they are OPPOSITE. Empty set, you win. Empty clause, you lose. So remember: remove, shorten, unit, pure, split, false first. The practice notebook got 3 full traces, the pseudocode with gaps, and a small tracer to check every step. Graded work must be your own hor, the course does not allow AI there. Jia you!
