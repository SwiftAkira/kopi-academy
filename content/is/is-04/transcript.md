**Introduction**

Eh, quick one. It rains, and you carry umbrella. You get WET or not? Logic cannot answer by feeling one. It needs a formula, and it needs to know which letters are true. So today, 4 things lah. First, the 3 parts of a logic: syntax, semantics, calculus. Second, how to build a truth table without kena the famous arrow trap. Third, what is a MODEL, and the words satisfiable, valid, unsatisfiable. Last one, entailment: when does a knowledge base force a sentence to be true? All pen and paper, same like the exam.

**Parts and connectives**

The 3 parts ah. SYNTAX is spelling: this string, legal formula or not? P arrow not Q, legal. P arrow and Q, rubbish. SEMANTICS is meaning: give every letter true or false, then the formula also become true or false. CALCULUS is the procedure to work it out, like a truth table. Now the 5 connectives. Not, and, or: easy lah. But the arrow, if P then Q, this one tricky. It is false in only 1 row: P true, Q false. A promise, broken. When P is false, where got promise to break? So the arrow is TRUE. False arrow true: true. False arrow false: also true! Alamak, most wrong cells come from here. And the double arrow, P if and only if Q: true when both sides SAME. Both false also count hor.

**Build the truth table**

Okay, build one table. P: it rains. Q: you carry umbrella. R: you get wet. The sentence: rain makes you wet, AND umbrella keeps you dry. In symbols: if P then R, and, if Q then not R. Step 1: 3 letters, so 2 times 2 times 2, 8 rows. Start with T T T, end with F F F, the right letter flip fastest. Step 2: helper columns. Not R. Then if P then R. Then if Q then not R. Step 3: the whole formula LAST, just and the 2 helper columns together. Look at row 3: T, F, T. Rain, no umbrella, wet. Both rules happy, so T. Now count the T in the last column: rows 3, 6, 7 and 8. A MODEL is just a row that makes the formula true, so 4 models. Got at least 1 model? Satisfiable. All 8 rows T? Valid. Zero? Unsatisfiable. Ours: satisfiable, but not valid lor.

**Entailment**

Last idea, entailment. Put the 2 rules in a knowledge base, KB. Its models are the same 4 rows. KB entails alpha means: alpha is true in EVERY model of KB. So cover the other rows, look at those 4 only. Try this one: not, P and Q. In rows 3, 6, 7 and 8, P and Q never both true. So yes, entailed! The 2 rules secretly say rain and umbrella never come together. Wah, logic very strict sia. Now try R. Row 6 is a model, but R is false there. 1 counter-row is enough: NOT entailed. So remember: the arrow is false only for true then false, and entailed means true in ALL the models. The practice notebook got 6 exercises: truth tables with gaps, model or not, entailment by table, plus a small table printer to check your hand work. Graded work must be your own hor, the course does not allow AI there. Jia you!
