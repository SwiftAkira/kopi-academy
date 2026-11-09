"""py-03 Mutability: practice notebook source. Build with: python scripts/verify_notebooks.py --build py-03"""
from nbkit import Notebook

nb = Notebook(
    lesson="py-03",
    course="Introduction to Python Programming for AI",
    week="Week 3",
    topic="Mutability",
    minutes="15 to 20 minutes for the six exercises",
    about="""
    This notebook covers aliasing versus copying, functions that change a list versus functions that return
    a new list, and nested lists. Every exercise is about the stock of a small shop.
    """,
)

nb.section("Core exercises", "Three to predict, one to fix and two to write.")

nb.predict(
    "1", "Predict the output: a second name or a copy",
    """
    An assignment such as `same = stock` never copies a list. It gives the list a second name.
    A full slice `stock[:]` builds a new list.

    How many lists are there in this code? Write down the four lines it prints.
    """,
    '''
    stock = ["tea", "rice"]
    same = stock
    spare = stock[:]

    same.append("oats")
    spare.append("salt")

    print(stock)
    print(same)
    print(spare)
    print(stock == same, stock == spare)
    ''',
    output="['tea', 'rice', 'oats']\n['tea', 'rice', 'oats']\n['tea', 'rice', 'salt']\nTrue False\n",
    why="""
    There are two lists. `stock` and `same` are two names for the first one, so the `"oats"` shows through both.
    `spare` is a separate copy: it got the `"salt"`, and it never saw the `"oats"`.
    """,
    hints=[
        "Draw one box for every list and write the names next to the box they belong to. How many boxes do you need?",
        "`same.append(...)` changes the list that `stock` also names. `spare.append(...)` changes the other list.",
    ],
)

nb.predict(
    "2", "Predict the output: change the list or return a new one",
    """
    A list that you pass to a function is the caller's list, not a copy.

    Read the two functions. One changes the list it receives. The other builds a new list and returns it.
    What do the two `print` lines show?
    """,
    '''
    def restock(counts: list[int], amount: int) -> None:
        """Add amount to every count in the list."""
        for i in range(len(counts)):
            counts[i] += amount

    def restocked(counts: list[int], amount: int) -> list[int]:
        """Return a new list with amount added to every count."""
        result = []
        for count in counts:
            result.append(count + amount)
        return result

    counts = [3, 0, 7]

    bigger = restocked(counts, 10)
    print(counts, bigger)

    nothing = restock(counts, 1)
    print(counts, nothing)
    ''',
    output="[3, 0, 7] [13, 10, 17]\n[4, 1, 8] None\n",
    why="""
    `restocked` leaves `counts` alone and hands back a new list. `restock` assigns to `counts[i]`, so the caller's
    list changes. It has no `return`, so `nothing` is `None`.
    """,
    hints=[
        "Look at the return hints: `-> None` and `-> list[int]`. What does each one tell you?",
        "Assigning to `counts[i]` changes the list itself. `result = []` starts a new list.",
    ],
)

nb.fix(
    "3", "Fix the bug: a promise that is broken",
    """
    Read the docstring. The function promises a **new list** and promises to leave the list it receives alone.
    The first test passes from the start, because the returned values are right. The second test shows the problem.

    Repair the function so that it keeps its promise.
    """,
    '''
    def after_sale(counts: list[int]) -> list[int]:
        """Return a new list with every count lowered by 1. The list it receives stays as it is."""
        for i in range(len(counts)):
            counts[i] = counts[i] - 1
        return counts
    ''',
    """
    shelf = [3, 1, 4]
    check(after_sale, shelf, expected=[2, 0, 3])
    check(lambda: shelf, expected=[3, 1, 4], label="shelf after the call")
    check(after_sale, [], expected=[])
    """,
    hints=[
        "Inside the function, `counts` is a second name for the caller's `shelf`. Which line changes that list?",
        "Build the answer in a new list: start with `result = []`, `append` the lowered counts, return `result`. A copy at the top, `counts = counts[:]`, also works.",
    ],
    solution='''
    def after_sale(counts: list[int]) -> list[int]:
        """Return a new list with every count lowered by 1. The list it receives stays as it is."""
        result = []
        for count in counts:
            result.append(count - 1)
        return result
    ''',
)

nb.write(
    "4", "Write from scratch: fill up the shelf",
    """
    Every product should have at least `minimum` boxes on the shelf.

    Write `fill_up(counts, minimum)`. It **changes the list it receives**: every count below `minimum`
    becomes `minimum`. Counts that are high enough stay as they are. The function returns nothing.

    For `shelf = [2, 9, 0]`, the call `fill_up(shelf, 5)` turns `shelf` into `[5, 9, 5]`.

    Some tests pass from the start, because `pass` also gives back `None`. The tests that look at the shelf
    are the ones to watch.
    """,
    '''
    def fill_up(counts: list[int], minimum: int) -> None:
        """Raise every count below minimum to minimum, in the list itself."""
        pass
    ''',
    """
    shelf = [2, 9, 0]
    check(fill_up, shelf, 5, expected=None)
    check(lambda: shelf, expected=[5, 9, 5], label="shelf after fill_up(shelf, 5)")
    full = [6, 7]
    check(fill_up, full, 5, expected=None)
    check(lambda: full, expected=[6, 7], label="a full shelf stays the same")
    """,
    hints=[
        "To change an item in the list you need its position. Which kind of loop gives you the position?",
        "Assigning to the loop variable in `for count in counts:` does not change the list. Use `for i in range(len(counts)):` and assign to `counts[i]`.",
    ],
    solution='''
    def fill_up(counts: list[int], minimum: int) -> None:
        """Raise every count below minimum to minimum, in the list itself."""
        for i in range(len(counts)):
            if counts[i] < minimum:
                counts[i] = minimum
    ''',
)

nb.predict(
    "5", "Predict the output: a list of lists",
    """
    The shop has two shelves. Every inner list is one shelf, with the number of boxes per product.
    In `shelves[r][c]` the first index picks the shelf and the second index picks the item on it.

    Write down the four lines that this code prints. Take your time for the last two.
    """,
    '''
    shelves = [[4, 0, 6], [2, 5, 1]]

    print(shelves[1][0], shelves[0][2])
    print(len(shelves), len(shelves[0]))

    top = shelves[0]
    top[1] = 8
    print(shelves)

    table = [[0] * 3] * 2
    table[0][0] = 7
    print(table)
    ''',
    output="2 6\n2 3\n[[4, 8, 6], [2, 5, 1]]\n[[7, 0, 0], [7, 0, 0]]\n",
    why="""
    `top = shelves[0]` is a second name for the first inner list, so `top[1] = 8` shows up inside `shelves`.
    `[[0] * 3] * 2` does not build two rows. It puts the **same** row in the outer list twice, so one assignment
    changes what you see in both rows.
    """,
    hints=[
        "`len(shelves)` counts the inner lists. `len(shelves[0])` counts the items in the first inner list.",
        "For the last two prints, ask the question of exercise 1 again: how many lists are there, and which names or places point at each one?",
    ],
)

nb.write(
    "6", "Write from scratch: totals per shelf",
    """
    Write `shelf_totals(shelves)`. It gets a list of shelves, where every shelf is a list of counts.
    It returns a **new list** with the total number of boxes on each shelf.

    For `[[4, 0, 6], [2, 5, 1]]` the result is `[10, 8]`.

    Write it with two loops, one inside the other, and without `sum()`. Shelves can have different lengths,
    and a shelf can be empty.
    """,
    '''
    def shelf_totals(shelves: list[list[int]]) -> list[int]:
        """Return a new list with the total of each shelf."""
        pass
    ''',
    """
    check(shelf_totals, [[4, 0, 6], [2, 5, 1]], expected=[10, 8])
    check(shelf_totals, [[3], [], [1, 1]], expected=[3, 0, 2])
    check(shelf_totals, [], expected=[])
    """,
    hints=[
        "The outer loop takes one shelf at a time. The inner loop adds up the counts of that shelf. After the inner loop, `append` that total to the result list.",
        "There are two start values. The result list starts **before** the outer loop. The total must start at 0 again for every shelf, so it belongs **inside** the outer loop and before the inner loop.",
    ],
    solution='''
    def shelf_totals(shelves: list[list[int]]) -> list[int]:
        """Return a new list with the total of each shelf."""
        totals = []
        for shelf in shelves:
            total = 0
            for count in shelf:
                total += count
            totals.append(total)
        return totals
    ''',
)

if __name__ == "__main__":
    print(nb.save(__file__))
