"""is-05 Logic 2: CNF. Practice notebook source. Build with: python scripts/verify_notebooks.py --build is-05"""
from nbkit import Notebook

nb = Notebook(
    lesson="is-05",
    course="Intelligent Systems",
    week="Week 3",
    topic="Logic 2: CNF",
    minutes="20 minutes for the six core exercises",
    extra_note="The extra practice after them is optional and takes about 10 minutes more.",
    paper=True,
    about="""
    This notebook covers the conversion of a formula to CNF (clause normal form). Almost everything is pen and
    paper, like the exam. A small checker tells you whether your clauses have the same truth table as the
    original formula.

    The five steps, always in this order:

    1. Remove `↔`: `A ↔ B` becomes `(A → B) ∧ (B → A)`.
    2. Remove `→`: `A → B` becomes `¬A ∨ B`.
    3. Move `¬` inward: `¬(A ∧ B)` becomes `¬A ∨ ¬B`, `¬(A ∨ B)` becomes `¬A ∧ ¬B`, and `¬¬A` becomes `A`.
    4. Distribute `∨` over `∧`: `A ∨ (B ∧ C)` becomes `(A ∨ B) ∧ (A ∨ C)`.
    5. Read off the clauses. Drop repeated literals and repeated clauses.
    """,
)

# ---------------------------------------------------------------- core
nb.section("Core exercises", "Six exercises. Write every conversion out line by line, one rule per line.")

nb.paper(
    "1", "In CNF or not?",
    """
    A formula is in CNF when it is a conjunction of clauses, and a clause is a disjunction of literals.

    Say for each formula whether it is already in CNF. If yes, how many clauses does it have? If no, what is in the way?

    - (a) `P ∨ ¬Q`
    - (b) `P ∧ ¬Q`
    - (c) `(P ∧ Q) ∨ R`
    - (d) `¬(P ∨ Q)`
    - (e) `(P ∨ Q) ∧ (¬P ∨ R) ∧ S`
    - (f) `P → Q`
    - (g) `¬P`
    - (h) `(P ∨ ¬Q) ∧ ¬(R ∧ S)`
    """,
    """
    | | In CNF? | Why |
    |---|---|---|
    | (a) | yes, 1 clause | A disjunction of literals is one clause. |
    | (b) | yes, 2 clauses | Each literal is a clause by itself: the unit clauses `P` and `¬Q`. |
    | (c) | no | It is an OR of ANDs. After distribution: `(P ∨ R) ∧ (Q ∨ R)`. |
    | (d) | no | A negation stands in front of a bracket. After De Morgan: `¬P ∧ ¬Q`, two unit clauses. |
    | (e) | yes, 3 clauses | `P ∨ Q`, `¬P ∨ R` and the unit clause `S`. |
    | (f) | no | It contains an arrow. After step 2: `¬P ∨ Q`, one clause. |
    | (g) | yes, 1 clause | A single literal is a unit clause. |
    | (h) | no | The second part has a negation in front of a bracket. After De Morgan: `(P ∨ ¬Q) ∧ (¬R ∨ ¬S)`. |

    (a), (b), (e) and (g) need no work at all. In the exam, do not start rewriting a formula that is already in CNF.
    """,
    hints=[
        "Three things may not appear in CNF: an arrow, a negation in front of a bracket, and an ∧ inside an ∨.",
        "A conjunction of single literals is in CNF. Every literal counts as one clause.",
    ],
)

nb.paper(
    "2", "Name the rule",
    """
    This conversion is correct. Name the rule that was used to get each line. Then write down the clause set.

    ```text
    start    ¬(P → (Q ∧ R))
    line 1   ¬(¬P ∨ (Q ∧ R))
    line 2   ¬¬P ∧ ¬(Q ∧ R)
    line 3   P ∧ ¬(Q ∧ R)
    line 4   P ∧ (¬Q ∨ ¬R)
    ```
    """,
    """
    | Line | Rule |
    |---|---|
    | 1 | Remove → (step 2): `P → X` becomes `¬P ∨ X`. The outer negation stays where it is. |
    | 2 | De Morgan (step 3) on the outer negation: `¬(A ∨ B)` becomes `¬A ∧ ¬B`, with `¬P` as A and `Q ∧ R` as B. |
    | 3 | Double negation (step 3): `¬¬P` becomes `P`. |
    | 4 | De Morgan (step 3) again: `¬(Q ∧ R)` becomes `¬Q ∨ ¬R`. |

    Clause set: `{ P, ¬Q ∨ ¬R }`. Two clauses: the unit clause `P`, and `¬Q ∨ ¬R`.

    Step 4, distribution, is not needed here, because no ∧ is left inside an ∨.

    This is the shape you get when you **negate a query** of the form `P → ...` before running DPLL:
    the left side becomes a unit clause and the right side is negated.
    """,
    hints=[
        "The arrow goes first, even though it is inside a negation. Which rule removes an arrow?",
        "Lines 2 and 4 use the same law, once on an ∨ and once on an ∧.",
    ],
)

nb.paper(
    "3", "Three quick conversions",
    """
    Convert each formula to CNF and write down the clause set. Show your lines.

    - (a) `P → (Q → R)`
    - (b) `¬(P ∨ ¬Q)`
    - (c) `(P ∧ Q) ∨ (R ∧ S)`
    """,
    """
    **(a)** One clause.

    ```text
    start       P → (Q → R)
    remove →    ¬P ∨ (¬Q ∨ R)
    clauses     { ¬P ∨ ¬Q ∨ R }
    ```

    **(b)** Two unit clauses.

    ```text
    start       ¬(P ∨ ¬Q)
    De Morgan   ¬P ∧ ¬¬Q
    double ¬    ¬P ∧ Q
    clauses     { ¬P, Q }
    ```

    **(c)** Four clauses. You distribute twice.

    ```text
    start        (P ∧ Q) ∨ (R ∧ S)
    distribute   ((P ∧ Q) ∨ R) ∧ ((P ∧ Q) ∨ S)
    distribute   (P ∨ R) ∧ (Q ∨ R) ∧ (P ∨ S) ∧ (Q ∨ S)
    clauses      { P ∨ R, Q ∨ R, P ∨ S, Q ∨ S }
    ```

    In (c), every clause takes one literal from the left bracket and one from the right bracket. Two times two gives four clauses.
    """,
    hints=[
        "(a) has two arrows. Remove both with step 2. No other step is needed.",
        "(b): De Morgan flips ∨ to ∧ and negates both parts. One of the parts is already negated.",
        "(c): treat `(P ∧ Q)` as one block A first: `A ∨ (R ∧ S)` becomes `(A ∨ R) ∧ (A ∨ S)`. Then distribute again inside each part.",
    ],
)

nb.md(
    """
    ### A checker for your conversions

    A correct conversion never changes the truth table. The next cell gives you two tools that use this:

    - `agree(names, f, g)` is `True` when the formulas `f` and `g` have the same value under every interpretation.
      A formula is written as a Python `lambda` with `not`, `and`, `or`, `implies(a, b)` and `iff(a, b)`.
    - `from_clauses(names, clauses)` turns a clause set that you type as text into such a formula.
      Type `-` for ¬ and `v` for ∨, for example `["-P v Q", "R"]`.

    Run the cell. The four lines it prints are explained in the comments.
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


    def difference(names: list[str], f, g) -> dict | None:
        """Return the first interpretation on which f and g differ, or None when there is none."""
        for values in product([True, False], repeat=len(names)):
            if bool(f(*values)) != bool(g(*values)):
                return dict(zip(names, values))
        return None


    def agree(names: list[str], f, g) -> bool:
        """Return True when f and g have the same value under every interpretation."""
        return difference(names, f, g) is None


    def from_clauses(names: list[str], clauses: list[str]):
        """Turn clauses typed as text, such as "-P v Q", into a formula for agree()."""
        def formula(*values: bool) -> bool:
            row = dict(zip(names, values))
            for clause in clauses:
                literals = [part.strip() for part in clause.replace("∨", "v").split("v")]
                values_of_literals = [
                    not row[lit[1:].strip()] if lit[0] in "-¬~" else row[lit]
                    for lit in literals
                ]
                if not any(values_of_literals):
                    return False        # one false clause makes the whole set false
            return True
        return formula


    letters = ["P", "Q"]
    print(agree(letters, lambda p, q: implies(p, q), lambda p, q: (not p) or q))          # P → Q against ¬P ∨ Q
    print(agree(letters, lambda p, q: implies(p, q), from_clauses(letters, ["-P v Q"])))  # the same, typed as a clause
    print(agree(letters, lambda p, q: not (p or q), from_clauses(letters, ["-P v -Q"])))  # ¬(P ∨ Q) is NOT one clause
    print(agree(letters, lambda p, q: not (p or q), from_clauses(letters, ["-P", "-Q"]))) # it is two unit clauses
    '''
)

nb.write(
    "4", "Convert, then check with code",
    """
    A gate rule: the gate opens exactly when this holds: if it is after closing time, you hold a staff pass.
    With `P` "the gate opens", `Q` "it is after closing time" and `R` "you hold a staff pass", the rule is

    `P ↔ (Q → R)`

    1. Convert the formula to CNF on paper. You need all five steps.
    2. Type your clauses into `my_clauses` in the cell below, as text with `-` for ¬ and `v` for ∨.
    3. Run the test cell. It compares the truth table of your clauses with the truth table of the formula.
    """,
    '''
    original = lambda p, q, r: iff(p, implies(q, r))      # P ↔ (Q → R)

    # Type your clauses here, for example ["-P v Q", "R"].
    my_clauses = []
    ''',
    """
    check(lambda: len(my_clauses), expected=3, label="number of clauses")
    check(agree, ["P", "Q", "R"], original, from_clauses(["P", "Q", "R"], my_clauses), expected=True,
          label="your clauses have the same truth table as P ↔ (Q → R)")
    """,
    hints=[
        "Step 1 gives two implications joined by ∧: `(P → (Q → R)) ∧ ((Q → R) → P)`. Convert the two halves one after the other.",
        "The left half becomes one clause with three literals. The right half becomes `¬(¬Q ∨ R) ∨ P` after step 2.",
        "De Morgan and double negation turn `¬(¬Q ∨ R)` into `Q ∧ ¬R`. Then distribute: `(Q ∧ ¬R) ∨ P` becomes `(Q ∨ P) ∧ (¬R ∨ P)`.",
    ],
    solution='''
    original = lambda p, q, r: iff(p, implies(q, r))      # P ↔ (Q → R)

    # start    P ↔ (Q → R)
    # step 1   (P → (Q → R)) ∧ ((Q → R) → P)
    # step 2   (¬P ∨ ¬Q ∨ R) ∧ (¬(¬Q ∨ R) ∨ P)
    # step 3   (¬P ∨ ¬Q ∨ R) ∧ ((Q ∧ ¬R) ∨ P)
    # step 4   (¬P ∨ ¬Q ∨ R) ∧ (Q ∨ P) ∧ (¬R ∨ P)
    # step 5   { ¬P ∨ ¬Q ∨ R,  P ∨ Q,  P ∨ ¬R }
    my_clauses = ["-P v -Q v R", "P v Q", "P v -R"]
    ''',
)

nb.paper(
    "5", "Find the wrong step",
    """
    A classmate converts `P → ¬(Q → R)` and ends with one clause. One line is not allowed.

    ```text
    start    P → ¬(Q → R)
    line 1   ¬P ∨ ¬(Q → R)
    line 2   ¬P ∨ (¬Q → ¬R)
    line 3   ¬P ∨ (¬¬Q ∨ ¬R)
    line 4   ¬P ∨ Q ∨ ¬R
    ```

    1. Which line is wrong, and why?
    2. Give the correct conversion and the correct clause set.
    3. Find one interpretation on which `¬P ∨ Q ∨ ¬R` and the original formula differ.
    """,
    """
    **1.** Line 2 is wrong. A negation was pushed through an arrow: `¬(Q → R)` was turned into `¬Q → ¬R`.
    No rule allows that. The arrows must be gone (step 2) before negations move inward (step 3).
    Lines 3 and 4 follow the rules, but they build on a wrong line.

    **2.** The correct conversion:

    ```text
    start        P → ¬(Q → R)
    remove →     ¬P ∨ ¬(¬Q ∨ R)
    De Morgan    ¬P ∨ (¬¬Q ∧ ¬R)
    double ¬     ¬P ∨ (Q ∧ ¬R)
    distribute   (¬P ∨ Q) ∧ (¬P ∨ ¬R)
    clauses      { ¬P ∨ Q, ¬P ∨ ¬R }
    ```

    Two clauses with two literals each, not one clause with three.

    **3.** Take P, Q and R all true. The original is false: `Q → R` is T, so `¬(Q → R)` is F, and `T → F` is F.
    The classmate's clause `¬P ∨ Q ∨ ¬R` is true, because Q is true. The row P true, Q false, R false works as well.

    Run the next cell to see the checker find the difference.
    """,
    hints=[
        "Check each line against the five steps. Is there a rule that moves a negation through an arrow?",
        "Remove both arrows first. `¬(Q → R)` becomes `¬(¬Q ∨ R)`, and only then De Morgan applies.",
    ],
)

nb.code(
    """
    # Check for exercise 5: the wrong result against the right one.
    letters = ["P", "Q", "R"]
    formula = lambda p, q, r: implies(p, not implies(q, r))      # P → ¬(Q → R)

    print("wrong result agrees:", agree(letters, formula, from_clauses(letters, ["-P v Q v -R"])))
    print("first difference:   ", difference(letters, formula, from_clauses(letters, ["-P v Q v -R"])))
    print("right result agrees:", agree(letters, formula, from_clauses(letters, ["-P v Q", "-P v -R"])))
    """
)

nb.paper(
    "6", "A knowledge base in clause form",
    """
    Three library rules, with `P` "you are a library member", `Q` "you have an unpaid fine",
    `R` "you may borrow" and `S` "you are a staff member":

    ```text
    (Q ∨ ¬P) → ¬R      with an unpaid fine, or when you are not a member, you may not borrow
    S → (P ∧ R)        a staff member is a library member and may borrow
    ¬(S ∧ Q)           nobody is a staff member with an unpaid fine
    ```

    1. Convert each sentence to CNF and collect all clauses in one clause set.
    2. Write the same clause set as a set of sets, with a dash for negation, such as `{{A,-B},{C}}`.
    3. Which of these clauses are part of the clause set?
       (i) `¬R ∨ ¬Q`  (ii) `¬S ∨ P ∨ R`  (iii) `Q ∨ ¬R`  (iv) `P ∨ ¬S`
    """,
    """
    **1.** Convert sentence by sentence.

    ```text
    (Q ∨ ¬P) → ¬R
      remove →      ¬(Q ∨ ¬P) ∨ ¬R
      De Morgan     (¬Q ∧ ¬¬P) ∨ ¬R
      double ¬      (¬Q ∧ P) ∨ ¬R
      distribute    (¬Q ∨ ¬R) ∧ (P ∨ ¬R)

    S → (P ∧ R)
      remove →      ¬S ∨ (P ∧ R)
      distribute    (¬S ∨ P) ∧ (¬S ∨ R)

    ¬(S ∧ Q)
      De Morgan     ¬S ∨ ¬Q
    ```

    Clause set: `{ ¬Q ∨ ¬R, P ∨ ¬R, ¬S ∨ P, ¬S ∨ R, ¬S ∨ ¬Q }`. Five clauses.

    **2.** `{{-Q,-R},{P,-R},{-S,P},{-S,R},{-S,-Q}}`

    **3.** (i) and (iv) are part of it.

    - (i) `¬R ∨ ¬Q` is the clause `¬Q ∨ ¬R`. The order of the literals does not matter.
    - (ii) `¬S ∨ P ∨ R` is not. It is what you get when you forget to distribute `¬S` over `P ∧ R`.
    - (iii) `Q ∨ ¬R` is not. The sign of Q is wrong: De Morgan negates both parts.
    - (iv) `P ∨ ¬S` is the clause `¬S ∨ P`.
    """,
    hints=[
        "Never mix the sentences. Each sentence gives its own clauses, and the clause set is all of them together.",
        "The first sentence gives two clauses, the second gives two, the third gives one.",
    ],
)

# ---------------------------------------------------------------- extra
nb.section(
    "Extra practice (optional)",
    "More of the same ideas. Do these when you want extra practice. They are not needed to finish the lesson.",
)

nb.paper(
    "X1", "Negate first, then convert",
    """
    To test with DPLL whether a knowledge base entails a sentence, you add the clauses of the **negated** sentence.
    Negate each sentence below, convert the negation to CNF and write down the clauses.

    - (a) `R → P`
    - (b) `P ∧ Q`
    - (c) `P ∨ Q`
    - (d) `S → (P ∧ R)`
    """,
    """
    ```text
    (a) ¬(R → P)          =  ¬(¬R ∨ P)          =  R ∧ ¬P             clauses { R, ¬P }
    (b) ¬(P ∧ Q)          =  ¬P ∨ ¬Q                                  clauses { ¬P ∨ ¬Q }
    (c) ¬(P ∨ Q)          =  ¬P ∧ ¬Q                                  clauses { ¬P, ¬Q }
    (d) ¬(S → (P ∧ R))    =  ¬(¬S ∨ (P ∧ R))    =  S ∧ (¬P ∨ ¬R)      clauses { S, ¬P ∨ ¬R }
    ```

    - A negated implication always gives the left side as it is, together with the negated right side: (a) and (d).
    - A negated "and" is one clause. A negated "or" is two unit clauses. Mixing up (b) and (c) is the classic mistake.
    """,
    hints=[
        "Write the negation sign in front of the whole sentence, in brackets. Then start with step 2 if there is an arrow.",
    ],
    core=False,
)

nb.paper(
    "X2", "Repeated literals and repeated clauses",
    """
    Step 5 says: drop repeated literals and repeated clauses. Convert these two formulas and tidy up the result.

    - (a) `(P → Q) ∨ (R → Q)`
    - (b) `(P → R) ∧ (¬R → ¬P)`
    """,
    """
    **(a)** One clause with three literals.

    ```text
    start       (P → Q) ∨ (R → Q)
    remove →    ¬P ∨ Q ∨ ¬R ∨ Q
    tidy up     ¬P ∨ Q ∨ ¬R          Q is written once
    ```

    **(b)** One clause.

    ```text
    start       (P → R) ∧ (¬R → ¬P)
    remove →    (¬P ∨ R) ∧ (¬¬R ∨ ¬P)
    double ¬    (¬P ∨ R) ∧ (R ∨ ¬P)
    tidy up     { ¬P ∨ R }           the two clauses are the same set of literals
    ```

    In (b) both parts say the same thing: `¬R → ¬P` is `P → R` turned around with both sides negated.
    A clause set is a set, so the clause is listed once.
    """,
    hints=[
        "A clause is a set of literals, and a clause set is a set of clauses. A set never holds the same thing twice.",
    ],
    core=False,
)

if __name__ == "__main__":
    print(nb.save(__file__))
