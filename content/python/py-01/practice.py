"""py-01 Lists basics: practice notebook source. Build with: python scripts/verify_notebooks.py --build py-01"""
from nbkit import Notebook

nb = Notebook(
    lesson="py-01",
    course="Introduction to Python Programming for AI",
    week="Week 3",
    topic="Lists basics",
    minutes="15 to 20 minutes for the six exercises",
    about="""
    This notebook covers indexing, negative indexes, slicing, `len`, `in` and the list methods
    `append`, `insert`, `pop` and `remove`. Every exercise is about a bus route, stored as a list of stop names.
    """,
)

nb.section("Core exercises", "Two to predict, two to fix and two to write.")

nb.predict(
    "1", "Predict the output: indexes and slices",
    """
    Indexes start at 0. A negative index counts from the end. A slice `stops[i:j]` starts at index `i`
    and stops **before** index `j`.

    Write down the four lines that this code prints. Then run it.
    """,
    '''
    stops = ["Harbour", "Market", "Library", "Park", "Zoo"]

    print(stops[0], stops[-1])
    print(stops[1:3])
    print(stops[:2], stops[3:])
    print(len(stops), len(stops[1:4]))
    ''',
    output="Harbour Zoo\n['Market', 'Library']\n['Harbour', 'Market'] ['Park', 'Zoo']\n5 3\n",
    why="""
    `stops[1:3]` holds index 1 and index 2, not index 3. `stops[:2]` starts at the first item and `stops[3:]`
    runs to the end. A slice `stops[i:j]` has `j - i` items, so `stops[1:4]` has 3.
    """,
    hints=[
        "Write the index above each stop first: 0, 1, 2, 3, 4.",
        "For every slice, ask two questions. Where does it start? Which index is the first one that is **not** included?",
    ],
)

nb.predict(
    "2", "Predict the output: four methods",
    """
    `append`, `insert`, `pop` and `remove` all change the list itself. Follow the list line by line:
    write down what `line` looks like after each method call.

    What do the three `print` lines show?
    """,
    '''
    line = ["Tower", "Canal", "Stadium"]

    line.append("Airport")
    line.insert(1, "Museum")
    gone = line.pop(0)
    line.remove("Canal")

    print(line)
    print(gone)
    print("Canal" in line, len(line))
    ''',
    output="['Museum', 'Stadium', 'Airport']\nTower\nFalse 3\n",
    why="""
    After `append`: Tower, Canal, Stadium, Airport. After `insert(1, "Museum")`: Tower, Museum, Canal, Stadium, Airport.
    `pop(0)` takes out the item at index 0 and returns it, so `gone` is `"Tower"`. `remove("Canal")` looks for
    the value and takes it out. Three stops are left.
    """,
    hints=[
        "`pop` works with a position. `remove` works with a value.",
        "`insert(1, x)` puts `x` at index 1. The item that was at index 1, and everything after it, moves one place to the right.",
    ],
)

nb.fix(
    "3", "Fix the bug: the last stop",
    """
    This function should return the last stop of a route. Run the tests and read what they say.
    Then repair the function.
    """,
    '''
    def last_stop(stops: list[str]) -> str:
        """Return the last stop of a route that is not empty."""
        return stops[len(stops)]
    ''',
    """
    check(last_stop, ["Harbour", "Market", "Zoo"], expected="Zoo")
    check(last_stop, ["Depot"], expected="Depot")
    check(last_stop, ["Tower", "Museum", "Canal", "Airport"], expected="Airport")
    """,
    hints=[
        "The tests report an `IndexError`. A route with 3 stops has the indexes 0, 1 and 2. Which index does the function ask for?",
        "The last index is one less than the length. A negative index is even shorter to write.",
    ],
    solution='''
    def last_stop(stops: list[str]) -> str:
        """Return the last stop of a route that is not empty."""
        return stops[-1]
    ''',
)

nb.fix(
    "4", "Fix the bug: a list that turns into None",
    """
    This function should build a list of stop names for a new route: `"Stop 1"`, `"Stop 2"` and so on.
    It follows the usual pattern: start with an empty list, `append` in a loop, return the list.

    Run the tests. The error message is one you will meet often, so read it closely. Then repair the function.
    The test with 0 stops passes from the start. Think about why.
    """,
    '''
    def numbered_stops(count: int) -> list[str]:
        """Return the stop names "Stop 1" up to "Stop count"."""
        names = []
        for number in range(1, count + 1):
            names = names.append(f"Stop {number}")
        return names
    ''',
    """
    check(numbered_stops, 3, expected=["Stop 1", "Stop 2", "Stop 3"])
    check(numbered_stops, 1, expected=["Stop 1"])
    check(numbered_stops, 0, expected=[])
    """,
    hints=[
        "The message says that a `NoneType` object has no `append`. So at some moment `names` is `None` and no longer a list. Which line gives `names` a new value?",
        "`append` changes the list and returns `None`. Do not store what it returns. With 0 stops the loop body never runs, so that test never meets the bug.",
    ],
    solution='''
    def numbered_stops(count: int) -> list[str]:
        """Return the stop names "Stop 1" up to "Stop count"."""
        names = []
        for number in range(1, count + 1):
            names.append(f"Stop {number}")
        return names
    ''',
)

nb.write(
    "5", "Write from scratch: your ride",
    """
    You get on the bus at the stop with index `board` and you get off at the stop with index `leave`.

    Write `ride(stops, board, leave)`. It returns a list with the stops of your ride: from the stop where you
    get on, up to **and including** the stop where you get off.

    For the route `["Harbour", "Market", "Library", "Park", "Zoo"]`, `ride(route, 1, 3)` gives
    `["Market", "Library", "Park"]`.
    """,
    '''
    def ride(stops: list[str], board: int, leave: int) -> list[str]:
        """Return the stops from index board up to and including index leave."""
        pass
    ''',
    """
    route = ["Harbour", "Market", "Library", "Park", "Zoo"]
    check(ride, route, 1, 3, expected=["Market", "Library", "Park"])
    check(ride, route, 0, 4, expected=["Harbour", "Market", "Library", "Park", "Zoo"])
    check(ride, route, 2, 2, expected=["Library"])
    """,
    hints=[
        "You need a part of the list as a new list. That is a slice.",
        "The stop value of a slice is not included. Which stop value do you need, so that index `leave` is still in the result?",
    ],
    solution='''
    def ride(stops: list[str], board: int, leave: int) -> list[str]:
        """Return the stops from index board up to and including index leave."""
        return stops[board:leave + 1]
    ''',
)

nb.write(
    "6", "Write from scratch: a closed stop",
    """
    Because of road works, a stop is closed.

    Write `close_stop(stops, name)`. It takes the stop called `name` out of the route.
    If that stop is not on the route, the route stays as it is and nothing crashes.

    This function **changes the list it receives**. It does not return anything, so its return hint is `-> None`.
    The tests call the function and then look at the list. Two tests pass from the start, because `pass` also
    gives back `None`. The tests that look at the route are the ones to watch.
    """,
    '''
    def close_stop(stops: list[str], name: str) -> None:
        """Take the stop called name out of the route, if it is there."""
        pass
    ''',
    """
    route = ["Harbour", "Market", "Zoo"]
    check(close_stop, route, "Market", expected=None)
    check(lambda: route, expected=["Harbour", "Zoo"], label="route after closing Market")
    check(close_stop, route, "Airport", expected=None)
    check(lambda: route, expected=["Harbour", "Zoo"], label="route after closing Airport, which is not a stop")
    """,
    hints=[
        "One list method takes an item out by its value.",
        "`remove` raises a `ValueError` when the value is not in the list. Test with `in` before you call it.",
    ],
    solution='''
    def close_stop(stops: list[str], name: str) -> None:
        """Take the stop called name out of the route, if it is there."""
        if name in stops:
            stops.remove(name)
    ''',
)

if __name__ == "__main__":
    print(nb.save(__file__))
