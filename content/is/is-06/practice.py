"""is-06 Logic 3: DPLL. Practice notebook source. Build with: python scripts/verify_notebooks.py --build is-06"""
from nbkit import Notebook

nb = Notebook(
    lesson="is-06",
    course="Intelligent Systems",
    week="Week 3",
    topic="Logic 3: DPLL",
    minutes="20 minutes for the six core exercises",
    extra_note="The extra practice after them is optional and takes about 10 minutes more.",
    paper=True,
    about="""
    This notebook covers DPLL by hand and the DPLL pseudocode. Almost everything is pen and paper, like the exam.
    A small DPLL tracer prints every step, so you can compare it with your own trace.

    The hand rules used in this notebook, always in this order:

    1. **Unit clause**: a clause with one literal forces that literal to be true.
    2. **Pure literal**: a variable that occurs with one sign only gets the value that makes it true.
    3. **Split**: otherwise take the first variable in the alphabet and assign **False before True**.

    If several unit clauses or several pure literals are possible, take the first variable in the alphabet.
    Keep the clauses in their original order and leave out clauses that are satisfied.
    """,
)

# ---------------------------------------------------------------- core
nb.section("Core exercises", "Six exercises. Write every clause set down in full: that is what the exam asks for.")

nb.paper(
    "1", "Remove and shorten",
    """
    Making a literal true does two things: it **removes** the clauses that contain the literal, and it
    **shortens** the clauses that contain the opposite literal.

    Start from this clause set each time:

    `{ P∨¬Q, ¬P∨R, Q∨R∨¬S, ¬R∨S }`

    Write down the clause set that results in each case.

    - (a) P = True
    - (b) R = False
    - (c) S = True
    """,
    """
    ```text
    (a) P = True     { R, Q∨R∨¬S, ¬R∨S }
    (b) R = False    { P∨¬Q, ¬P, Q∨¬S }
    (c) S = True     { P∨¬Q, ¬P∨R, Q∨R }
    ```

    - (a) The literal `P` is true. `P∨¬Q` contains it and is removed. `¬P∨R` contains the opposite literal and is shortened to `R`.
    - (b) R = False makes the literal `¬R` true. `¬R∨S` is removed. `¬P∨R` loses its R and becomes `¬P`. `Q∨R∨¬S` becomes `Q∨¬S`.
    - (c) The literal `S` is true. `¬R∨S` is removed. `Q∨R∨¬S` loses `¬S` and becomes `Q∨R`.

    The classic mistake is to swap the two: to shorten the satisfied clauses and remove the others.
    Ask yourself which literal is **true** now. Clauses with that literal are done and disappear.
    """,
    hints=[
        "First write down which literal becomes true. For R = False that is `¬R`.",
        "Clauses that contain the true literal go away completely. Clauses that contain the opposite literal lose only that one literal.",
    ],
)

nb.paper(
    "2", "Which rule comes first?",
    """
    The order is: unit clause, then pure literal, then split (first variable in the alphabet, False before True).
    Before any of these, check whether you can stop.

    Say for each clause set what DPLL does next, and give the new clause set if there is one.

    - (a) `{ P∨Q, ¬Q, ¬P∨Q }`
    - (b) `{ P∨Q, ¬P∨Q, ¬P∨¬R, Q∨R }`
    - (c) `{ P∨Q, ¬P∨¬Q, ¬P∨Q }`
    - (d) `{ }`
    - (e) `{ R, ¬R, P∨Q }`
    """,
    """
    | | What happens | Result |
    |---|---|---|
    | (a) | Unit clause `¬Q`: assign False to Q. | `{ P, ¬P }` |
    | (b) | No unit clause. `Q` occurs, `¬Q` does not: pure literal, assign True to Q. | `{ ¬P∨¬R }` |
    | (c) | No unit clause and no pure literal: split, assign False to P. | `{ Q }` |
    | (d) | No clauses left: stop, satisfiable. | |
    | (e) | `R` and `¬R` are both unit clauses: contradiction, this branch fails. | |

    - In (a), Q is not a free choice. A unit clause forces its literal to be true, and the literal here is `¬Q`.
    - In (b), P and R occur with both signs, so only Q is pure. All three clauses that contain `Q` are removed.
    - In (c), every variable occurs with both signs. Only now do you choose: P comes first, and False comes before True.
    - (d) and (e) are opposites. An empty **set** of clauses is success. Two opposite unit clauses lead to an empty **clause**, which is failure.
    """,
    hints=[
        "Look for a clause with exactly one literal first. Then look for a variable that has the same sign everywhere.",
        "In (e) there are two unit clauses. Can both be made true?",
    ],
)

nb.md(
    """
    ### A DPLL tracer

    The next cell gives you a small DPLL tracer. It follows the hand rules of this notebook and prints every step.
    You do not have to understand every line. To use it, type a clause set as text, with `-` for ¬ and `v` for ∨:

    `solve("-Q v -R, -P v Q, P v R")`

    Steps inside a choice are indented. Run the cell: it prints the trace of the example in the lesson.
    """
)

nb.code(
    '''
    def parse(text: str) -> list[list[str]]:
        """Turn "P v Q, -P v R" into [["P", "Q"], ["¬P", "R"]]. Type - for ¬ and v for ∨."""
        clauses = []
        for part in text.split(","):
            literals = part.replace("∨", "v").split("v")
            clauses.append([lit.strip().replace("-", "¬") for lit in literals])
        return clauses


    def show(clauses: list[list[str]]) -> str:
        """Write a clause set the way the lesson does."""
        inside = ", ".join("∨".join(clause) for clause in clauses)
        return "{ " + inside + " }" if inside else "{ }"


    def opposite(literal: str) -> str:
        """P gives ¬P, and ¬P gives P."""
        return literal[1:] if literal.startswith("¬") else "¬" + literal


    def make_true(clauses: list[list[str]], literal: str) -> list[list[str]]:
        """Remove the clauses that contain the literal. Shorten the clauses that contain its opposite."""
        result = []
        for clause in clauses:
            if literal in clause:
                continue                                                        # satisfied: remove
            result.append([lit for lit in clause if lit != opposite(literal)])  # shorten
        return result


    def dpll(clauses: list[list[str]], model: dict[str, bool], depth: int = 0) -> dict[str, bool] | None:
        """Run DPLL with the hand rules and print every step. Return a model, or None."""
        pad = "    " * depth
        if not clauses:
            print(pad + "no clauses left: satisfiable")
            return model
        literals = sorted({lit for clause in clauses for lit in clause}, key=lambda lit: (lit.lstrip("¬"), lit))
        units = [lit for lit in literals if [lit] in clauses]
        pures = [lit for lit in literals if opposite(lit) not in literals]
        for lit in units:
            if opposite(lit) in units:
                print(pad + f"{lit} and {opposite(lit)} are both unit clauses: contradiction")
                return None

        if units or pures:                               # rule 1: unit clause, rule 2: pure literal
            lit = units[0] if units else pures[0]
            rule = "unit clause" if units else "pure literal"
            name, value = lit.lstrip("¬"), not lit.startswith("¬")
            new = make_true(clauses, lit)
            print(pad + f"{rule} {lit}: assign {value} to {name} -> {show(new)}")
            return dpll(new, {**model, name: value}, depth)

        name = literals[0].lstrip("¬")                   # rule 3: split on the first variable in the alphabet
        for value in (False, True):                      # False before True
            lit = name if value else "¬" + name
            step = "backtrack" if value else "choice"
            new = make_true(clauses, lit)
            print(pad + f"{step}: assign {value} to {name} -> {show(new)}")
            result = dpll(new, {**model, name: value}, depth + 1)
            if result is not None:
                return result
        return None


    def solve(text: str) -> None:
        """Print a full DPLL trace for a clause set typed as text."""
        clauses = parse(text)
        print("clause set: " + show(clauses))
        model = dpll(clauses, {})
        if model is None:
            print("verdict: unsatisfiable")
        else:
            print("verdict: satisfiable, model: " + ", ".join(f"{name}={model[name]}" for name in sorted(model)))


    solve("-Q v -R, -P v Q, P v R, Q v -R, Q v R")
    '''
)

nb.predict(
    "3", "Trace by hand, then predict the tracer",
    """
    Run DPLL by hand on this clause set:

    `{ ¬Q∨¬S, P∨S, ¬P∨¬R, P∨¬Q∨R, Q∨¬R }`

    Write down every step: which rule, which value for which variable, and the clause set that results.
    End with the verdict and, if there is one, the model. Then run the cell. The tracer should print the same steps.
    """,
    """
    solve("-Q v -S, P v S, -P v -R, P v -Q v R, Q v -R")
    """,
    output=(
        "clause set: { ¬Q∨¬S, P∨S, ¬P∨¬R, P∨¬Q∨R, Q∨¬R }\n"
        "choice: assign False to P -> { ¬Q∨¬S, S, ¬Q∨R, Q∨¬R }\n"
        "    unit clause S: assign True to S -> { ¬Q, ¬Q∨R, Q∨¬R }\n"
        "    unit clause ¬Q: assign False to Q -> { ¬R }\n"
        "    unit clause ¬R: assign False to R -> { }\n"
        "    no clauses left: satisfiable\n"
        "verdict: satisfiable, model: P=False, Q=False, R=False, S=True\n"
    ),
    why="""
    - At the start there is no unit clause and no pure literal, because every variable occurs with both signs. So you choose: P first, False first.
    - P = False removes `¬P∨¬R` and shortens `P∨S` to `S` and `P∨¬Q∨R` to `¬Q∨R`.
    - After that every step is forced by a unit clause: `S`, then `¬Q`, then `¬R`.
    - No clauses are left and no contradiction came up, so there is nothing to backtrack: the first choice worked.
    - The model gives a value to all four variables: P = False, Q = False, R = False, S = True.
    """,
    hints=[
        "First step: is there a unit clause or a pure literal? If not, assign False to the first variable in the alphabet.",
        "After P = False you should have four clauses, and one of them is a unit clause.",
        "A unit clause with a negation, such as `¬Q`, forces the value False.",
    ],
)

nb.paper(
    "4", "Trace with a backtrack and a pure literal",
    """
    Run DPLL by hand on this clause set:

    `{ ¬P∨¬Q∨S, Q∨¬R, P∨¬Q, P∨Q∨R, ¬P∨Q∨¬S }`

    Write down every step and every clause set. Give the verdict and the model.
    Remember the order: unit clause, then pure literal, then split.
    """,
    """
    ```text
    clause set               { ¬P∨¬Q∨S, Q∨¬R, P∨¬Q, P∨Q∨R, ¬P∨Q∨¬S }
    choice: P = False        { Q∨¬R, ¬Q, Q∨R }
    unit ¬Q: Q = False       { ¬R, R }                 contradiction
    backtrack: P = True      { ¬Q∨S, Q∨¬R, Q∨¬S }
    pure ¬R: R = False       { ¬Q∨S, Q∨¬S }
    choice: Q = False        { ¬S }
    unit ¬S: S = False       { }                       no clauses left
    ```

    **Satisfiable.** Model: P = True, Q = False, R = False, S = False.

    - P = False removes the two clauses with `¬P` and shortens `P∨¬Q` to `¬Q` and `P∨Q∨R` to `Q∨R`.
    - The unit clause `¬Q` then leaves `¬R` and `R`: a contradiction.
    - Backtrack: go back to the **original** five clauses and assign P = True. The clauses `P∨¬Q` and `P∨Q∨R` are removed, and the two clauses with `¬P` are shortened.
    - Now there is no unit clause. But R occurs only as `¬R`, so `¬R` is a pure literal: R = False removes `Q∨¬R`.
    - Q and S both occur with both signs, so the next step is a real choice: Q = False. That leaves the unit clause `¬S`.
    - The model comes from the successful branch only. Q = False from the first branch is thrown away with that branch, and it is chosen again later by the split.

    Run the next cell to compare with the tracer.
    """,
    hints=[
        "The first choice, P = False, leads to a contradiction after one unit clause.",
        "After the backtrack you have three clauses and none of them is a unit clause. Check every variable: does one of them occur with one sign only?",
        "After the pure literal two clauses are left. Every variable in them has both signs, so you split again.",
    ],
)

nb.code(
    """
    # Check for exercise 4.
    solve("-P v -Q v S, Q v -R, P v -Q, P v Q v R, -P v Q v -S")
    """
)

nb.paper(
    "5", "Trace to the end: satisfiable or not?",
    """
    Run DPLL by hand on this clause set:

    `{ ¬R∨S, ¬P∨R, P∨Q∨R, P∨¬Q, ¬R∨¬S }`

    Write down every step and every clause set. Give the verdict.
    In the exam you would also fill in a model line `P= , Q= , R= , S= `. What do you type there?
    """,
    """
    ```text
    clause set               { ¬R∨S, ¬P∨R, P∨Q∨R, P∨¬Q, ¬R∨¬S }
    choice: P = False        { ¬R∨S, Q∨R, ¬Q, ¬R∨¬S }
    unit ¬Q: Q = False       { ¬R∨S, R, ¬R∨¬S }
    unit R: R = True         { S, ¬S }                 contradiction
    backtrack: P = True      { ¬R∨S, R, ¬R∨¬S }
    unit R: R = True         { S, ¬S }                 contradiction
    ```

    **Unsatisfiable.** P was the only choice, and both of its values end in a contradiction. No branch is left to try.

    In the model line you type the placeholder `XXX` in every gap, because there is no model.

    - One successful branch is enough for "satisfiable". For "unsatisfiable", **every** branch must fail.
    - After the backtrack the unit clause `R` appears at once: `¬P∨R` is shortened to `R`.
    - Q never gets a value in the second branch. That does not matter, because the branch fails anyway.

    Run the next cell to compare with the tracer.
    """,
    hints=[
        "The first branch needs two unit clauses before the contradiction shows.",
        "After the backtrack, do not stop at the first contradiction of the first branch. The second branch has to be traced as well.",
    ],
)

nb.code(
    """
    # Check for exercise 5.
    solve("-R v S, -P v R, P v Q v R, P v -Q, -R v -S")
    """
)

nb.paper(
    "6", "The pseudocode from memory",
    """
    The exam prints the DPLL pseudocode with gaps and a list of phrases. There are more phrases than gaps.

    Fill in the gaps (a) to (e) with phrases from this list:

    `no clauses` · `empty clause` · `any clause` · `True` · `False` · `literal` · `¬literal` ·
    `a unit or pure L` · `dpll(F, P)` · `dpll(F, ¬P)` · `dpll(¬F, P)`

    ```text
    dpll(F, literal){
       remove clauses containing literal
       shorten clauses containing ¬literal

       if (F contains ___(a)___)
           return True
       if (F contains ___(b)___)
           return False
       if (F contains ___(c)___)
           return dpll(F, L)

       choose P in F;
          if (___(d)___)
              return True;
          else
              return ___(e)___; }
    ```

    When you are done, cover the screen and write the whole procedure on paper from memory.
    """,
    """
    **(a)** `no clauses`  **(b)** `empty clause`  **(c)** `a unit or pure L`  **(d)** `dpll(F, ¬P)`  **(e)** `dpll(F, P)`

    ```text
    dpll(F, literal){
       remove clauses containing literal
       shorten clauses containing ¬literal

       if (F contains no clauses)
           return True
       if (F contains empty clause)
           return False
       if (F contains a unit or pure L)
           return dpll(F, L)

       choose P in F;
          if (dpll(F, ¬P))
              return True;
          else
              return dpll(F, P); }
    ```

    How to check yourself:

    - (a) and (b): no clauses means every clause was satisfied, so True. An empty clause is a clause that cannot be made true any more, so False.
    - (c): a forced step comes before any choice. It covers both the unit clause and the pure literal.
    - (d) and (e): the negative literal is tried first, `dpll(F, ¬P)`. That is "False before True" in a hand trace. Only when that fails comes `dpll(F, P)`.
    - The phrases `any clause` and `dpll(¬F, P)` are never used. Nothing in DPLL negates the whole formula F.
    - In the first two lines, **remove** goes with `literal` and **shorten** goes with `¬literal`.
    """,
    hints=[
        "(a) and (b) are the two ways to stop. Which one is success?",
        "(d) is the first value that is tried in a split. By hand that value is False. Which literal is true when P is False?",
    ],
)

# ---------------------------------------------------------------- extra
nb.section(
    "Extra practice (optional)",
    "Two more uses of DPLL that the exam asks about. Do these when you want extra practice. They are not needed to finish the lesson.",
)

nb.paper(
    "X1", "Entailment with DPLL",
    """
    To test whether a knowledge base entails a sentence: add the clauses of the **negated** sentence to the
    clauses of the knowledge base and run DPLL. If no model is found, the sentence is entailed.
    If a model is found, it is not.

    Let `P` be "it rains", `Q` "you carry an umbrella" and `R` "you get wet". The knowledge base is

    `KB = { P → R, Q → ¬R }`

    Its clauses are `¬P∨R` and `¬Q∨¬R`.

    1. Show with DPLL that KB entails `¬(P ∧ Q)`.
    2. Show with DPLL that KB does **not** entail `¬Q`.
    """,
    """
    **1.** Negate the sentence: `¬¬(P ∧ Q)` is `P ∧ Q`. In clause form that is the two unit clauses `P` and `Q`.

    ```text
    clause set               { ¬P∨R, ¬Q∨¬R, P, Q }
    unit P: P = True         { R, ¬Q∨¬R, Q }
    unit Q: Q = True         { R, ¬R }                 contradiction
    ```

    No choice was made, so there is nothing to backtrack to. The set is unsatisfiable, and so KB entails `¬(P ∧ Q)`.
    In words: with these two rules, rain and an umbrella cannot go together.

    **2.** Negate the sentence: `¬¬Q` is `Q`. Add the unit clause `Q`.

    ```text
    clause set               { ¬P∨R, ¬Q∨¬R, Q }
    unit Q: Q = True         { ¬P∨R, ¬R }
    unit ¬R: R = False       { ¬P }
    unit ¬P: P = False       { }                       no clauses left
    ```

    Satisfiable, with the model P = False, Q = True, R = False. That model makes KB true and `¬Q` false,
    so KB does not entail `¬Q`.

    The mistake to avoid: adding the sentence itself, without the negation. That proves nothing about entailment.

    Run the next cell to compare with the tracer.
    """,
    hints=[
        "Negate first, then convert to clauses. `¬¬(P ∧ Q)` is `P ∧ Q`, and a conjunction of literals gives unit clauses.",
        "With two unit clauses at the same time, take the first variable in the alphabet.",
    ],
    core=False,
)

nb.code(
    """
    # Check for exercise X1: part 1, then part 2.
    solve("-P v R, -Q v -R, P, Q")
    solve("-P v R, -Q v -R, Q")
    """
)

nb.paper(
    "X2", "The MOMs heuristic",
    """
    MOMs is a heuristic for the split step. The name stands for **m**aximum **o**ccurrences in clauses of
    **m**inimum **s**ize: look only at the shortest clauses, and choose the variable that occurs most often in them.
    A variable counts with either sign.

    `{ P∨R∨S, ¬P∨Q, ¬R∨S∨T, Q∨¬S, P∨¬S∨T, ¬Q∨R }`

    1. Which variable gets a value first with MOMs?
    2. Which variable occurs most often in the whole clause set? Why is that not the answer?
    """,
    """
    **1.** The shortest clauses have two literals: `¬P∨Q`, `Q∨¬S` and `¬Q∨R`.

    ```text
    variable   occurrences in the shortest clauses
    P          1
    Q          3
    R          1
    S          1
    T          0
    ```

    Q occurs most often, so MOMs chooses **Q**.

    **2.** In the whole set S occurs four times, and P, Q and R three times each. But MOMs does not count
    the clauses with three literals. Counting over all clauses is the usual mistake, and here it gives the wrong variable, S.

    In a hand trace you use MOMs only when the question says so. The standard rule is: alphabetical order, no heuristics.
    """,
    hints=[
        "First find the length of the shortest clause. Then ignore every clause that is longer.",
    ],
    core=False,
)

if __name__ == "__main__":
    print(nb.save(__file__))
