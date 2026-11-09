"""py-02 Looping over lists: practice notebook source. Build with: python scripts/verify_notebooks.py --build py-02"""
from nbkit import Notebook

nb = Notebook(
    lesson="py-02",
    course="Introduction to Python Programming for AI",
    week="Week 3",
    topic="Looping over lists",
    minutes="15 to 20 minutes for the six exercises",
    about="""
    This notebook covers the three ways to loop over a list (`for x in lst`, `range(len(lst))` and `enumerate`)
    and the accumulator patterns: sum, count, largest so far and filter into a new list.

    Every exercise uses the same story. A river sensor stores one water level per hour, in cm above (positive)
    or below (negative) the normal line. The first level belongs to hour 0.
    """,
)

nb.section("Core exercises", "Two to predict, two to fix and two to write.")

nb.predict(
    "1", "Predict the output: a sum and a count",
    """
    An accumulator has three steps: a start value **before** the loop, an update **inside** the loop,
    and the result **after** the loop.

    Follow `total` and `count` round by round. What do the two `print` lines show?
    """,
    '''
    levels = [8, -3, 14, 6, -5]

    total = 0
    count = 0
    for level in levels:
        total += level
        if level > 5:
            count += 1

    print(total, count)
    print(total / len(levels))
    ''',
    output="20 3\n4.0\n",
    why="""
    `total` goes 8, 5, 19, 25, 20. `count` goes up for 8, 14 and 6. The average is 20 divided by 5.
    A division with `/` always gives a float, so Python prints `4.0`.
    """,
    hints=[
        "Make a small table with a row for every round and the columns `level`, `total` and `count`.",
        "Adding a negative level makes `total` smaller. `count` only changes when the level is above 5.",
    ],
)

nb.predict(
    "2", "Predict the output: positions",
    """
    `for i in range(len(levels))` gives you the positions 0, 1, 2 and so on. The item is then `levels[i]`.
    `enumerate(levels)` gives you the position and the item together.

    Which three lines does this code print?
    """,
    '''
    levels = [8, -3, 14, 6, -5]

    for i in range(len(levels)):
        if levels[i] < 0:
            print("below at hour", i)

    for hour, level in enumerate(levels):
        if level > 10:
            print(hour, level)
    ''',
    output="below at hour 1\nbelow at hour 4\n2 14\n",
    why="""
    The first loop prints the **positions** of the negative levels: 1 and 4. The second loop prints position and
    item for the only level above 10. Positions start at 0, so 14 is at hour 2.
    """,
    hints=[
        "Write the positions above the levels first: 0, 1, 2, 3, 4.",
        "In the second loop, `enumerate` gives the position first and the item second.",
    ],
)

nb.fix(
    "3", "Fix the bug: the highest level",
    """
    This function should return the highest level, **without** `max()`. The first test passes from the start.
    That is what makes this bug hard to see. Find it and fix it.
    """,
    '''
    def highest_level(levels: list[int]) -> int:
        """Return the highest level in a list that is not empty."""
        highest = 0
        for level in levels:
            if level > highest:
                highest = level
        return highest
    ''',
    """
    check(highest_level, [8, -3, 14], expected=14)
    check(highest_level, [-4, -9, -2], expected=-2)
    check(highest_level, [-7], expected=-7)
    """,
    hints=[
        "Follow the code by hand for `[-4, -9, -2]`. Is the test `level > highest` ever true?",
        "The start value 0 is a level that may not be in the list at all. Start with a value that is certainly in the list.",
    ],
    solution='''
    def highest_level(levels: list[int]) -> int:
        """Return the highest level in a list that is not empty."""
        highest = levels[0]
        for level in levels:
            if level > highest:
                highest = level
        return highest
    ''',
)

nb.fix(
    "4", "Fix the bug: the count that forgets",
    """
    This function should count how many levels are above `limit`. It gives answers that are too low,
    and with an empty list it even crashes. Both problems have the same cause. Find it and fix it.
    """,
    '''
    def count_high(levels: list[int], limit: int) -> int:
        """Return how many levels are above limit."""
        for level in levels:
            count = 0
            if level > limit:
                count += 1
        return count
    ''',
    """
    check(count_high, [8, -3, 14, 6], 5, expected=3)
    check(count_high, [12, 20], 10, expected=2)
    check(count_high, [], 10, expected=0)
    """,
    hints=[
        "Follow `count` round by round for `[12, 20]` with limit 10. What is its value at the start of the second round?",
        "The start value is set again in every round. And when the list is empty, the loop body never runs, so `count` is never made. Where does a start value belong?",
    ],
    solution='''
    def count_high(levels: list[int], limit: int) -> int:
        """Return how many levels are above limit."""
        count = 0
        for level in levels:
            if level > limit:
                count += 1
        return count
    ''',
)

nb.write(
    "5", "Write from scratch: the calm levels",
    """
    A level is **calm** when it is at most `limit` cm away from the normal line, above or below.
    With a limit of 6, the levels 6, 0 and -5 are calm. The levels 8 and -7 are not.

    Write `calm_levels(levels, limit)`. It returns a **new list** with only the calm levels, in the same order.
    The list `levels` itself stays as it is.
    """,
    '''
    def calm_levels(levels: list[int], limit: int) -> list[int]:
        """Return a new list with the levels from -limit up to and including limit."""
        pass
    ''',
    """
    check(calm_levels, [8, -3, 14, 6, -5], 6, expected=[-3, 6, -5])
    check(calm_levels, [20, -20], 10, expected=[])
    check(calm_levels, [0, -7, 7], 7, expected=[0, -7, 7])
    check(calm_levels, [], 5, expected=[])
    """,
    hints=[
        "This is the filter pattern: an empty list before the loop, `append` inside an `if`, `return` after the loop.",
        "A level is calm when `-limit <= level <= limit`. You can also write that with `and`: `level >= -limit and level <= limit`.",
    ],
    solution='''
    def calm_levels(levels: list[int], limit: int) -> list[int]:
        """Return a new list with the levels from -limit up to and including limit."""
        result = []
        for level in levels:
            if -limit <= level <= limit:
                result.append(level)
        return result
    ''',
)

nb.write(
    "6", "Write from scratch: the first flood hour",
    """
    The town wants to know **when** the water first went above the flood limit.

    Write `first_flood_hour(levels, limit)`. It returns the first hour (the position in the list) with a level
    above `limit`. If no level is above the limit, it returns `-1`. The course uses `-1` in this way as an error code.

    Do not use the list method `index`. Write the loop yourself.
    """,
    '''
    def first_flood_hour(levels: list[int], limit: int) -> int:
        """Return the first hour with a level above limit, or -1 if there is none."""
        pass
    ''',
    """
    check(first_flood_hour, [8, -3, 14, 6, 16], 10, expected=2)
    check(first_flood_hour, [12, 3], 10, expected=0)
    check(first_flood_hour, [8, -3], 10, expected=-1)
    check(first_flood_hour, [], 10, expected=-1)
    """,
    hints=[
        "The answer is a position, so pick a loop that gives you the position: `range(len(levels))` or `enumerate`.",
        "Return the hour as soon as you find a level above the limit. Put `return -1` **after** the loop, not in an `else` inside it. Only after the last item do you know that there is no such hour.",
    ],
    solution='''
    def first_flood_hour(levels: list[int], limit: int) -> int:
        """Return the first hour with a level above limit, or -1 if there is none."""
        for hour in range(len(levels)):
            if levels[hour] > limit:
                return hour
        return -1
    ''',
)

if __name__ == "__main__":
    print(nb.save(__file__))
