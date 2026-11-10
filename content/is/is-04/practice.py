"""is-04 Logic 1: meaning. Practice notebook source. Build with: python scripts/verify_notebooks.py --build is-04"""
from nbkit import Notebook

nb = Notebook(
    lesson="is-04",
    course="Intelligent Systems",
    week="Week 3",
    topic="Logic 1: meaning",
    minutes="20 minutes for the six core exercises",
    extra_note="The extra practice after them is optional and takes about 10 minutes more.",
    paper=True,
    about="""
    This notebook covers the three parts of a logic, truth tables, models, the words satisfiable, valid and
    unsatisfiable, and entailment. Almost everything is pen and paper, like the exam. A small truth-table
    printer lets you check your hand answers afterwards.

    Symbols: `¬` not, `∧` and, `∨` or, `→` implies, `↔` if and only if, `⊨` entails. Tables use capital `T` and `F`
    and start with the row in which every variable is true.
    """,
)

# ---------------------------------------------------------------- core
nb.section(
    "Core exercises",
    """
    Exercises 2 to 6 are about a small alarm panel. The letters keep the same meaning all the way through:

    - `P`: the door sensor fires
    - `Q`: the window sensor fires
    - `R`: the alarm rings
    """,
)

nb.paper(
    "1", "Syntax, semantics or calculus?",
    """
    A logic has three parts: **syntax**, **semantics** and **calculus**. Say for each statement which part it belongs to.

    1. The string `P ∧ → Q` is not a formula, because `∧` needs a formula on both sides.
    2. With P true and Q false, `P → Q` is false.
    3. Fill in the truth table column by column until the last column is complete.
    4. `¬¬P` is a formula, because a negation in front of a formula gives a formula again.
    5. An interpretation gives each variable a value, and that fixes the value of every formula.
    6. Run DPLL on the clauses and report whether a model was found.
    """,
    """
    | Statement | Part | Why |
    |---|---|---|
    | 1 | syntax | It is about the form of a string: legal or not. |
    | 2 | semantics | It gives a truth value under one interpretation. |
    | 3 | calculus | It describes a procedure to work the truth out. |
    | 4 | syntax | It is a building rule for formulas. Truth plays no part. |
    | 5 | semantics | It says where meaning comes from: interpretations. |
    | 6 | calculus | It is a procedure again, this time an algorithm. |

    Short version: syntax is **form**, semantics is **meaning**, calculus is **procedure**.
    """,
    hints=["Ask of each statement: is it about the form of a formula, about a truth value, or about a procedure to follow?"],
)

nb.paper(
    "2", "One interpretation, no table",
    """
    You do not always need a full table. Take the interpretation

    `v(P) = True, v(Q) = False, v(R) = False`

    (the door sensor fires, the window sensor does not, the alarm is silent). Work out the truth value of each
    sentence by replacing the letters with their values.

    - (a) `P ∧ ¬Q`
    - (b) `Q → R`
    - (c) `P → R`
    - (d) `(P ∨ Q) ↔ R`
    """,
    """
    ```text
    (a) P ∧ ¬Q         =  T ∧ ¬F       =  T ∧ T  =  T
    (b) Q → R          =  F → F                  =  T
    (c) P → R          =  T → F                  =  F
    (d) (P ∨ Q) ↔ R    =  (T ∨ F) ↔ F  =  T ↔ F  =  F
    ```

    - (b) is the trap. The left side is false, so the implication is **true**, even though the right side is false too.
    - (c) is the only case in which an implication is false: true left side, false right side. In words: the door
      sensor fires but the alarm stays silent, so "if the door sensor fires, the alarm rings" is false here.
    - (d) The two sides have different values, so the biconditional is false.
    """,
    hints=[
        "Replace every letter by T or F first. Then work from the inside of the brackets to the outside.",
        "For (b) and (c): an implication is false in only one case, a true left side with a false right side.",
    ],
)

nb.md(
    """
    ### A truth-table printer

    The next cell gives you a small printer for truth tables. You do not have to understand every line.
    What you need to know to use it:

    - a formula is written as a Python `lambda` over the variables, with `not`, `and`, `or`
    - `implies(a, b)` stands for `a → b` and `iff(a, b)` stands for `a ↔ b`
    - the rows come in the course order: all true first, all false last

    Run the cell. It prints the two columns that cause most mistakes.
    """
)

nb.code(
    '''
    from itertools import product


    def implies(a: bool, b: bool) -> bool:
        """a → b: false only when a is True and b is False."""
        return (not a) or b


    def iff(a: bool, b: bool) -> bool:
        """a ↔ b: true when both sides have the same value."""
        return a == b


    def interpretations(names: list[str]) -> list[tuple]:
        """Return every row of values for the variables: all True first, all False last."""
        return list(product([True, False], repeat=len(names)))


    def truth_table(names: list[str], columns: dict) -> None:
        """Print a truth table. columns maps a column header to a function of the variables."""
        headers = names + list(columns)
        print(" | ".join(headers))
        for values in interpretations(names):
            results = list(values) + [formula(*values) for formula in columns.values()]
            cells = [("T" if r else "F").center(len(h)) for r, h in zip(results, headers)]
            print(" | ".join(cells).rstrip())


    truth_table(["P", "Q"], {
        "P → Q": lambda p, q: implies(p, q),
        "P ↔ Q": lambda p, q: iff(p, q),
    })
    '''
)

nb.predict(
    "3", "Predict the output: the last column",
    """
    Make the truth table of `¬P → (P → Q)` by hand. It has 2 variables, so 4 rows.

    Write down your last column from top to bottom. Is the formula valid, only satisfiable, or unsatisfiable?
    Then run the cell and compare.
    """,
    """
    truth_table(["P", "Q"], {
        "¬P": lambda p, q: not p,
        "P → Q": lambda p, q: implies(p, q),
        "¬P → (P → Q)": lambda p, q: implies(not p, implies(p, q)),
    })
    """,
    output=(
        "P | Q | ¬P | P → Q | ¬P → (P → Q)\n"
        "T | T | F  |   T   |      T\n"
        "T | F | F  |   F   |      T\n"
        "F | T | T  |   T   |      T\n"
        "F | F | T  |   T   |      T\n"
    ),
    why="""
    The last column is T in every row, so the formula is **valid** (a tautology).

    - Rows 1 and 2: `¬P` is F. A false left side makes the implication T, whatever the right side is.
    - Rows 3 and 4: P is F, so `P → Q` is T, and `T → T` is T.
    """,
    hints=[
        "Use helper columns: first `¬P`, then `P → Q`, and only then the whole formula.",
        "For the last column you only look at the two helper columns. In which rows is the left helper column F?",
    ],
)

nb.paper(
    "4", "Complete the truth table (exam style)",
    """
    The sentence "if the alarm stays silent, then neither sensor fired" is `¬R → (¬P ∧ ¬Q)`.

    Fill in the six gaps (a) to (f). In the exam you type one capital letter per gap: `T` or `F`.

    ```text
    P Q R | ¬P | ¬Q | ¬R | ¬P ∧ ¬Q | ¬R → (¬P ∧ ¬Q)
    T T T | F  | F  | F  |    F    |      (a)
    T T F | F  | F  | T  |    F    |      (b)
    T F T | F  | T  | F  |   (c)   |       T
    T F F | F  | T  | T  |    F    |       F
    F T T | T  | F  | F  |    F    |      (d)
    F T F | T  | F  | T  |    F    |       F
    F F T | T  | T  | F  |   (e)   |       T
    F F F | T  | T  | T  |    T    |      (f)
    ```

    Then say how many models the formula has.
    """,
    """
    **(a) T, (b) F, (c) F, (d) T, (e) T, (f) T**

    ```text
    P Q R | ¬P | ¬Q | ¬R | ¬P ∧ ¬Q | ¬R → (¬P ∧ ¬Q)
    T T T | F  | F  | F  |    F    |       T
    T T F | F  | F  | T  |    F    |       F
    T F T | F  | T  | F  |    F    |       T
    T F F | F  | T  | T  |    F    |       F
    F T T | T  | F  | F  |    F    |       T
    F T F | T  | F  | T  |    F    |       F
    F F T | T  | T  | F  |    T    |       T
    F F F | T  | T  | T  |    T    |       T
    ```

    - (a) and (d): `¬R` is F. A false left side makes the implication T. This is the trap: both sides are F, and the answer is still T.
    - (b): `¬R` is T and `¬P ∧ ¬Q` is F. True left, false right: F.
    - (c): `¬P` is F, so the conjunction is F.
    - (e): `¬P` and `¬Q` are both T, so the conjunction is T.
    - (f): `T → T` is T.

    The last column has five T's, so the formula has **5 models**: rows 1, 3, 5, 7 and 8.
    It is false exactly when a sensor fires while the alarm is silent (rows 2, 4 and 6).

    Run the next cell to check the whole table with the printer.
    """,
    hints=[
        "Every negation has its own column. Use only the columns `¬R` and `¬P ∧ ¬Q` for the last column.",
        "In rows 1 and 5 the left side `¬R` is F. What is an implication with a false left side?",
    ],
)

nb.code(
    """
    # Check for exercise 4: the full table, in the same column order.
    truth_table(["P", "Q", "R"], {
        "¬P": lambda p, q, r: not p,
        "¬Q": lambda p, q, r: not q,
        "¬R": lambda p, q, r: not r,
        "¬P ∧ ¬Q": lambda p, q, r: (not p) and (not q),
        "¬R → (¬P ∧ ¬Q)": lambda p, q, r: implies(not r, (not p) and (not q)),
    })
    """
)

nb.paper(
    "5", "Model or not a model?",
    """
    The sentence "the alarm rings exactly when at least one sensor fires" is `(P ∨ Q) ↔ R`.

    1. Which of these four interpretations are models of the formula?
       - (a) `v(P) = True, v(Q) = False, v(R) = True`
       - (b) `v(P) = False, v(Q) = False, v(R) = False`
       - (c) `v(P) = False, v(Q) = True, v(R) = False`
       - (d) `v(P) = False, v(Q) = False, v(R) = True`
    2. Is the formula valid, only satisfiable, or unsatisfiable?
    """,
    """
    **1.** (a) and (b) are models. (c) and (d) are not.

    ```text
    (a) (T ∨ F) ↔ T  =  T ↔ T  =  T    model
    (b) (F ∨ F) ↔ F  =  F ↔ F  =  T    model
    (c) (F ∨ T) ↔ F  =  T ↔ F  =  F    not a model
    (d) (F ∨ F) ↔ T  =  F ↔ T  =  F    not a model
    ```

    (b) is the one people miss. Both sides are false, so they are equal, and a biconditional with equal sides is true.

    **2.** Only satisfiable. It has models, for example (a), so it is satisfiable. It is false under (c), so it is not valid.

    For reference, the full table. The formula has 4 models: rows 1, 3, 5 and 8.

    ```text
    P Q R | P ∨ Q | (P ∨ Q) ↔ R
    T T T |   T   |      T
    T T F |   T   |      F
    T F T |   T   |      T
    T F F |   T   |      F
    F T T |   T   |      T
    F T F |   T   |      F
    F F T |   F   |      F
    F F F |   F   |      T
    ```

    In the exam, read the question twice: it may ask which interpretation **is** a model, or which one is **not**.
    """,
    hints=[
        "An interpretation is a model when the formula comes out true under it. Substitute the values, as in exercise 2.",
        "A biconditional is true when both sides have the same value. That includes false and false.",
    ],
)

nb.paper(
    "6", "Entailment by table",
    """
    A knowledge base with two sentences:

    `KB = { R → (P ∨ Q), ¬P }`

    In words: the alarm rings only if a sensor fires, and the door sensor does not fire.

    1. Make the 8-row table and mark the rows in which **both** sentences are true. Those rows are the models of KB.
    2. Decide for each sentence whether KB entails it. If the answer is no, give a counter-row.
       - (a) `R → Q`
       - (b) `Q`
       - (c) `¬R`
       - (d) `Q → R`
    """,
    """
    **1.** KB has three models: rows 5, 6 and 8.

    ```text
    P Q R | P ∨ Q | R → (P ∨ Q) | ¬P | model of KB?
    T T T |   T   |      T      | F  |
    T T F |   T   |      T      | F  |
    T F T |   T   |      T      | F  |
    T F F |   T   |      T      | F  |
    F T T |   T   |      T      | T  | yes
    F T F |   T   |      T      | T  | yes
    F F T |   F   |      F      | T  |
    F F F |   F   |      T      | T  | yes
    ```

    **2.** Look only at the three models.

    ```text
    model  | (a) R → Q | (b) Q | (c) ¬R | (d) Q → R
    F T T  |     T     |   T   |   F    |     T
    F T F  |     T     |   T   |   T    |     F
    F F F  |     T     |   F   |   T    |     T
    ```

    - (a) `KB ⊨ R → Q`: **yes**. It is true in all three models. In words: if the alarm rings, it must be the window sensor.
    - (b) `Q`: **no**. Counter-row F F F: a model of KB in which Q is false.
    - (c) `¬R`: **no**. Counter-row F T T.
    - (d) `Q → R`: **no**. Counter-row F T F. This is (a) turned around, and turning an implication around changes its meaning.

    Rows 1 to 4 and row 7 play no part. They are not models of KB, so what a sentence does there does not matter.

    Run the next cell to check the four answers.
    """,
    hints=[
        "A row is a model of KB only when `R → (P ∨ Q)` and `¬P` are both T in that row.",
        "You should find three models. A sentence is entailed when it is T in all three. One F is enough to say no.",
    ],
)

nb.code(
    '''
    def entails(names: list[str], kb: list, alpha) -> bool:
        """Return True when alpha is true in every model of the knowledge base."""
        for values in interpretations(names):
            is_model = all(sentence(*values) for sentence in kb)
            if is_model and not alpha(*values):
                return False
        return True


    # Check for exercise 6.
    kb = [
        lambda p, q, r: implies(r, p or q),
        lambda p, q, r: not p,
    ]
    letters = ["P", "Q", "R"]
    print("(a) KB entails R → Q:", entails(letters, kb, lambda p, q, r: implies(r, q)))
    print("(b) KB entails Q:    ", entails(letters, kb, lambda p, q, r: q))
    print("(c) KB entails ¬R:   ", entails(letters, kb, lambda p, q, r: not r))
    print("(d) KB entails Q → R:", entails(letters, kb, lambda p, q, r: implies(q, r)))
    '''
)

# ---------------------------------------------------------------- extra
nb.section(
    "Extra practice (optional)",
    "More of the same ideas. Do these when you want extra practice. They are not needed to finish the lesson.",
)

nb.paper(
    "X1", "Valid, only satisfiable or unsatisfiable?",
    """
    Make a 4-row table for each formula and classify it. Name the row or rows that decide your answer.

    - (a) `(P ∧ Q) → P`
    - (b) `(P → Q) ∧ (P ∧ ¬Q)`
    - (c) `(P ∨ Q) → P`
    """,
    """
    **(a) valid.** The implication could only be false when `P ∧ Q` is T and P is F. That never happens.

    ```text
    P Q | P ∧ Q | (P ∧ Q) → P
    T T |   T   |      T
    T F |   F   |      T
    F T |   F   |      T
    F F |   F   |      T
    ```

    **(b) unsatisfiable.** `P ∧ ¬Q` is true only in row 2, and that is exactly the row in which `P → Q` is false.

    ```text
    P Q | P → Q | ¬Q | P ∧ ¬Q | (P → Q) ∧ (P ∧ ¬Q)
    T T |   T   | F  |   F    |         F
    T F |   F   | T  |   T    |         F
    F T |   T   | F  |   F    |         F
    F F |   T   | T  |   F    |         F
    ```

    **(c) only satisfiable.** Row 3 makes it false (`T → F`), the other rows make it true.

    ```text
    P Q | P ∨ Q | (P ∨ Q) → P
    T T |   T   |      T
    T F |   T   |      T
    F T |   T   |      F
    F F |   F   |      T
    ```
    """,
    hints=[
        "Valid: only T in the last column. Unsatisfiable: only F. Only satisfiable: both occur.",
        "For (b), `¬Q` needs its own column, and so does `P ∧ ¬Q`.",
    ],
    core=False,
)

nb.write(
    "X2", "Write from scratch: is_valid",
    """
    Write `is_valid(names, formula)`. It returns `True` when the formula is true under **every** interpretation,
    and `False` otherwise. Use `interpretations(names)` from the printer cell: it gives you all rows of values.

    With this function you can check your answers to exercise X1.
    """,
    '''
    def is_valid(names: list[str], formula) -> bool:
        """Return True when the formula is true under every interpretation."""
        pass
    ''',
    """
    check(is_valid, ["P", "Q"], lambda p, q: implies(p and q, p), expected=True, label="(P ∧ Q) → P is valid")
    check(is_valid, ["P", "Q"], lambda p, q: implies(p or q, p), expected=False, label="(P ∨ Q) → P is valid")
    check(is_valid, ["P", "Q"], lambda p, q: implies(p, q) and (p and not q), expected=False, label="(P → Q) ∧ (P ∧ ¬Q) is valid")
    check(is_valid, ["P"], lambda p: p or not p, expected=True, label="P ∨ ¬P is valid")
    """,
    hints=[
        "Loop over `interpretations(names)`. Each item is one row of values, and `formula(*values)` gives the truth value in that row.",
        "As soon as one row gives False, the formula is not valid: return False. Return True only after the loop.",
    ],
    solution='''
    def is_valid(names: list[str], formula) -> bool:
        """Return True when the formula is true under every interpretation."""
        for values in interpretations(names):
            if not formula(*values):
                return False
        return True
    ''',
    core=False,
)

nb.paper(
    "X3", "Entailment as unsatisfiability",
    """
    The lesson gave this link: `KB ⊨ α` holds exactly when KB together with `¬α` is unsatisfiable.

    Use the knowledge base of exercise 6, `KB = { R → (P ∨ Q), ¬P }`, and its three models.

    1. `KB ⊨ R → Q` holds. Which set of sentences must then be unsatisfiable? Check it with the models.
    2. `KB ⊨ Q` does not hold. Which set must then be satisfiable? Give a model of that set.
    """,
    """
    **1.** The set `{ R → (P ∨ Q), ¬P, ¬(R → Q) }` must be unsatisfiable.

    `¬(R → Q)` is true only when R is T and Q is F. The models of KB are F T T, F T F and F F F.
    None of them has R true together with Q false. So no row makes all three sentences true: the set is unsatisfiable.

    **2.** The set `{ R → (P ∨ Q), ¬P, ¬Q }` must be satisfiable. The row F F F is a model of it.
    That row is the counter-row from exercise 6 (b): a model of KB in which Q is false.

    Notice that the sentence is **negated** before it is added. This is how DPLL is used to test entailment.
    """,
    hints=[
        "Add the negation of the sentence to KB. Then ask: is there still a row that makes everything true?",
    ],
    core=False,
)

if __name__ == "__main__":
    print(nb.save(__file__))
