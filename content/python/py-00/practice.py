"""py-00 Functions: practice notebook source. Build with: python scripts/verify_notebooks.py --build py-00"""
from nbkit import Notebook

nb = Notebook(
    lesson="py-00",
    course="Introduction to Python Programming for AI",
    week="Week 3",
    topic="Functions",
    minutes="20 minutes for the six core exercises",
    extra_note="The extra practice after them is optional and takes about 40 minutes more.",
    about="""
    This notebook covers `def`, parameters versus arguments, `return` versus `print`, `None` and local scope.
    The six core exercises come first. After them there is extra practice on the same ideas, for when you want more.
    """,
)

# ---------------------------------------------------------------- core
nb.section("Core exercises", "Six exercises, one for each idea of the lesson.")

nb.predict(
    "1", "Predict the output: define versus call",
    """
    `def` only **defines** a function. Nothing inside it runs until you **call** it with brackets: `greet()`.

    What gets printed, and in what order? Look closely at the line that says `greet` without brackets.
    """,
    '''
    def greet() -> None:
        print("Hoi!")
        print("Klaar")

    print("Start")
    greet
    greet()
    print("Einde")
    ''',
    output="Start\nHoi!\nKlaar\nEinde\n",
    why="The bare `greet` names the function but does not call it, so that line does nothing. Only `greet()` runs the body.",
    hints=["Read the code from top to bottom. Which lines are inside the `def`, and when do those run?"],
)

nb.predict(
    "2", "Predict the output: print versus return",
    """
    - `print` **shows** a value on the screen. The function still gives back `None`.
    - `return` **hands the value back** to whoever called the function, so it can be stored and used.

    What exactly is printed? There are two lines.
    """,
    '''
    def add_print(a: int, b: int) -> None:
        print(a + b)

    def add_return(a: int, b: int) -> int:
        return a + b

    x = add_print(2, 3)
    y = add_return(2, 3)
    print(x, y)
    ''',
    output="5\nNone 5\n",
    why="The `5` on the first line is printed inside `add_print`. That function has no `return`, so `x` is `None`. `add_return` shows nothing by itself, but `y` holds `5`.",
    hints=["One of the two calls shows something on the screen straight away. Which one, and what does the other one do instead?"],
)

nb.fix(
    "3", "Fix the bug: it shows the right number",
    """
    This function looks as if it works, because the right number appears on the screen. But every test fails.
    Find out why and fix it.
    """,
    '''
    def average(numbers: list[float]) -> float:
        """Return the mean of the numbers."""
        total = 0
        for n in numbers:
            total += n
        print(total / len(numbers))
    ''',
    """
    check(average, [1, 2, 3], expected=2.0)
    check(average, [10], expected=10.0)
    check(average, [2.5, 3.5], expected=3.0)
    """,
    hints=[
        "Read a FAIL line. What did the test get from the function instead of the number?",
        "The function shows the answer but never hands it back. You only need to change one word.",
    ],
    solution='''
    def average(numbers: list[float]) -> float:
        """Return the mean of the numbers."""
        total = 0
        for n in numbers:
            total += n
        return total / len(numbers)
    ''',
)

nb.fix(
    "4", "Fix the bug: the None trap",
    """
    If a function reaches its end **without meeting a `return`**, Python returns `None` for you.

    Before you fix anything: what does `grade_label(4.0)` give with this code? Run the tests to check your guess,
    then fix the function so all three pass.
    """,
    '''
    def grade_label(score: float) -> str:
        """Return "pass" for a score of 5.5 or more, otherwise "fail"."""
        if score >= 5.5:
            return "pass"
        else:
            label = "fail"
    ''',
    """
    check(grade_label, 7.0, expected="pass")
    check(grade_label, 5.5, expected="pass")
    check(grade_label, 4.0, expected="fail")
    """,
    hints=[
        "Follow the code by hand for a score of 4.0. Which lines run, and what is the last one?",
        "The `else` branch makes a variable but never gives it back to the caller.",
    ],
    solution='''
    def grade_label(score: float) -> str:
        """Return "pass" for a score of 5.5 or more, otherwise "fail"."""
        if score >= 5.5:
            return "pass"
        else:
            return "fail"
    ''',
)

nb.predict(
    "5", "Predict the output: local scope",
    """
    Variables made **inside** a function exist only inside that function, and only while it runs.
    The outside world gets what you `return`, nothing else.

    What happens on the last line?
    """,
    '''
    def make_total(a: int, b: int) -> int:
        result = a + b
        return result

    make_total(4, 5)
    print(result)
    ''',
    error="NameError",
    why="`result` lives inside `make_total`. Once the call is over it is gone, so the last line asks for a name that does not exist. The value 9 was returned, but nobody stored it.",
    hints=["Where is `result` created? Does that place still exist when the last line runs?"],
)

nb.write(
    "6", "Write from scratch: from loop program to function",
    """
    The recipe for turning a loop program into a function:
    1. Put the loop inside `def name(...):`.
    2. The data it works on becomes a **parameter**.
    3. The final `print(...)` becomes `return ...`.
    4. Call it and **store** the result.

    Turn this loop program into `count_even(numbers)`:

    ```python
    numbers = [3, 8, 10, 7, 2]
    count = 0
    for n in numbers:
        if n % 2 == 0:
            count += 1
    print(count)
    ```
    """,
    '''
    def count_even(numbers: list[int]) -> int:
        """Return how many of the numbers are even."""
        pass
    ''',
    """
    check(count_even, [3, 8, 10, 7, 2], expected=3)
    check(count_even, [1, 3, 5], expected=0)
    check(count_even, [], expected=0)
    """,
    hints=[
        "The list is already the parameter, so the line `numbers = [...]` is not needed inside the function.",
        "Keep `count = 0` and the loop as they are, indented inside the function. Only the last line changes.",
    ],
    solution='''
    def count_even(numbers: list[int]) -> int:
        """Return how many of the numbers are even."""
        count = 0
        for n in numbers:
            if n % 2 == 0:
                count += 1
        return count
    ''',
)

# ---------------------------------------------------------------- extra
nb.section(
    "Extra practice (optional)",
    "More of the same ideas, plus a few loops from memory. Do these when you want extra practice. They are not needed to finish the lesson.",
)

nb.predict("X1", "Predict the output: a loop from memory", "What does this print?",
           """
           total = 0
           for i in range(2, 7, 2):
               total += i
           print(total)
           """,
           output="12\n", why="`range(2, 7, 2)` gives 2, 4 and 6. The 7 is not included.", core=False)

nb.predict("X2", "Predict the output: a while loop", "What does this print? It is two numbers.",
           """
           n = 1
           count = 0
           while n < 20:
               n = n * 2
               count += 1
           print(n, count)
           """,
           output="32 5\n", why="`n` goes 2, 4, 8, 16, 32, so the loop body runs 5 times.", core=False)

nb.predict("X3", "Predict the output: counting in a loop", "What does this print?",
           """
           words = ["kat", "fiets", "ai", "python"]
           long_words = 0
           for w in words:
               if len(w) > 3:
                   long_words += 1
           print(long_words)
           """,
           output="2\n", why='Only "fiets" and "python" are longer than 3 characters.', core=False)

nb.write("X4", "Write from scratch: square", "Write `square(x)` so that it **returns** `x` times `x`.",
         '''
         def square(x: int) -> int:
             """Return x times x."""
             pass
         ''',
         """
         check(square, 4, expected=16)
         check(square, 0, expected=0)
         check(square, -3, expected=9)
         """,
         hints=["The body is a single line.", "That line starts with `return`."],
         solution='''
         def square(x: int) -> int:
             """Return x times x."""
             return x * x
         ''', core=False)

nb.write("X5", "Write from scratch: two parameters",
         """
         - A **parameter** is a name in the `def` line: `def area_rectangle(width, height)`.
         - An **argument** is the value you pass in the call: `area_rectangle(3, 4)`.

         Arguments are matched to parameters **by position**: first to first, second to second.

         Write `area_rectangle(width, height)` so that it returns the area.
         """,
         '''
         def area_rectangle(width: float, height: float) -> float:
             """Return the area of a rectangle."""
             pass
         ''',
         """
         check(area_rectangle, 3, 4, expected=12)
         check(area_rectangle, 2.5, 2, expected=5.0)
         check(area_rectangle, 7, 0, expected=0)
         """,
         hints=["Area is width times height.", "One line: `return` followed by the product of the two parameters."],
         solution='''
         def area_rectangle(width: float, height: float) -> float:
             """Return the area of a rectangle."""
             return width * height
         ''', core=False)

nb.predict("X6", "Predict the output: arguments in the wrong order",
           "The first `print` works. What happens with the second one, and **why**?",
           '''
           def describe(name: str, age: int) -> str:
               return name + " is " + str(age)

           print(describe("Sam", 19))
           print(describe(19, "Sam"))
           ''',
           error="TypeError",
           why='First `Sam is 19` is printed. In the second call `name` gets 19, so `19 + " is "` tries to add an int and a str.',
           hints=["Arguments are matched by position. Which parameter receives `19` in the second call?"],
           core=False)

nb.write("X7", "Fix the call: keyword arguments",
         """
         Repair the broken call from the last exercise **without changing the order** of the two values.
         Use named (keyword) arguments, in the form `describe(age=..., name=...)`, and store the result in `fixed`.
         """,
         """
         # Put the repaired call on the next line, so that fixed holds its result:
         fixed = None
         """,
         """
         check(lambda: fixed, expected="Sam is 19", label="fixed")
         """,
         hints=["With keyword arguments the order no longer matters, because every value says which parameter it is for.",
                "Keep 19 first and \"Sam\" second, and put the parameter name and `=` in front of each."],
         solution="""
         fixed = describe(age=19, name="Sam")
         """, core=False)

nb.write("X8", "Write from scratch: a discount",
         """
         Write `price_with_discount(price, percent)`. It returns the price after the discount.
         For example, `price_with_discount(100, 25)` gives `75.0`.
         """,
         '''
         def price_with_discount(price: float, percent: float) -> float:
             """Return the price after taking percent off."""
             pass
         ''',
         """
         check(price_with_discount, 100, 25, expected=75.0)
         check(price_with_discount, 80, 10, expected=72.0)
         check(price_with_discount, 19.99, 0, expected=19.99)
         """,
         hints=["25 percent off means you pay 75 percent of the price.",
                "As a formula: the price times `1 - percent / 100`."],
         solution='''
         def price_with_discount(price: float, percent: float) -> float:
             """Return the price after taking percent off."""
             return price * (1 - percent / 100)
         ''', core=False)

nb.fix("X9", "Fix the bug: return in the wrong place",
       """
       `return` **stops the function straight away**. Nothing after it runs, and that includes the rest of a loop.

       What does `sum_list([1, 2, 3])` give with this code, and why? Then fix it.
       """,
       '''
       def sum_list(numbers: list[int]) -> int:
           """Return the sum of the numbers."""
           total = 0
           for n in numbers:
               total += n
               return total
       ''',
       """
       check(sum_list, [1, 2, 3], expected=6)
       check(sum_list, [5], expected=5)
       check(sum_list, [], expected=0)
       """,
       hints=["How many times does the loop body run before the function stops?",
              "Look at the indentation of `return`. It should run once, after the loop is finished."],
       solution='''
       def sum_list(numbers: list[int]) -> int:
           """Return the sum of the numbers."""
           total = 0
           for n in numbers:
               total += n
           return total
       ''', core=False)

nb.write("X10", "Fix the code: keep what the function returns",
         """
         In core exercise 5 the value 9 was returned and then lost. Repair the last line here so that `total`
         holds the value that `make_total(4, 5)` gives back. Leave the function as it is.
         """,
         '''
         def make_total(a: int, b: int) -> int:
             result = a + b
             return result

         # Repair the next line:
         total = None
         ''',
         """
         check(lambda: total, expected=9, label="total")
         """,
         hints=["A call is a value. You can put it on the right-hand side of `=`.",
                "Assign the call itself to `total`."],
         solution='''
         def make_total(a: int, b: int) -> int:
             result = a + b
             return result

         total = make_total(4, 5)
         ''', core=False)

nb.predict("X11", "Predict the output: the same name inside and outside",
           "The name `x` is used inside and outside the function. Which two values are printed?",
           """
           x = 10

           def change_x() -> int:
               x = 99
               return x

           print(change_x())
           print(x)
           """,
           output="99\n10\n",
           why="The `x` inside the function is a separate, local variable. The outer `x` is never touched.",
           core=False)

nb.write("X12", "Write from scratch: the largest number",
         "Write `largest(numbers)` so that it returns the biggest number in the list. Use a loop, **not** `max()`.",
         '''
         def largest(numbers: list[int]) -> int:
             """Return the biggest number in a list that is not empty."""
             pass
         ''',
         """
         check(largest, [4, 9, 2], expected=9)
         check(largest, [7], expected=7)
         check(largest, [-5, -2, -9], expected=-2)
         """,
         hints=["Keep the biggest number seen so far in a variable and update it inside the loop.",
                "Look at the last test. What goes wrong if you start with `biggest = 0`? Start with `numbers[0]` instead."],
         solution='''
         def largest(numbers: list[int]) -> int:
             """Return the biggest number in a list that is not empty."""
             biggest = numbers[0]
             for n in numbers:
                 if n > biggest:
                     biggest = n
             return biggest
         ''', core=False)

nb.write("X13", "Write from scratch: factorial",
         """
         Write `factorial(n)` with a loop. `factorial(5)` is 5 × 4 × 3 × 2 × 1 = 120, and `factorial(0)` is defined as 1.
         """,
         '''
         def factorial(n: int) -> int:
             """Return n factorial for n of 0 or more."""
             pass
         ''',
         """
         check(factorial, 5, expected=120)
         check(factorial, 1, expected=1)
         check(factorial, 0, expected=1)
         """,
         hints=["This is an accumulator, but with multiplying instead of adding. What should it start at?",
                "Start with `result = 1` and loop over `range(1, n + 1)`."],
         solution='''
         def factorial(n: int) -> int:
             """Return n factorial for n of 0 or more."""
             result = 1
             for i in range(1, n + 1):
                 result = result * i
             return result
         ''', core=False)

nb.write("X14", "Write from scratch: return a new list",
         """
         Write `to_fahrenheit(temps)`. It takes a list of temperatures in degrees Celsius and **returns a new list**
         in degrees Fahrenheit. The formula is `f = c * 9 / 5 + 32`.
         """,
         '''
         def to_fahrenheit(temps: list[float]) -> list[float]:
             """Return the temperatures converted from Celsius to Fahrenheit."""
             pass
         ''',
         """
         check(to_fahrenheit, [0, 100], expected=[32.0, 212.0])
         check(to_fahrenheit, [-40], expected=[-40.0])
         check(to_fahrenheit, [], expected=[])
         """,
         hints=["Start with an empty list and add one converted value per loop step.",
                "`result = []` before the loop, `result.append(...)` inside it, `return result` after it."],
         solution='''
         def to_fahrenheit(temps: list[float]) -> list[float]:
             """Return the temperatures converted from Celsius to Fahrenheit."""
             result = []
             for c in temps:
                 result.append(c * 9 / 5 + 32)
             return result
         ''', core=False)

nb.write("X15", "Write from scratch: a function that calls a function",
         """
         Because your functions **return** values, you can use them inside other functions.

         Write `count_passed(scores)`. It returns how many scores are a pass. **Use your `grade_label` from core
         exercise 4**. Do not repeat the `>= 5.5` check.
         """,
         '''
         def count_passed(scores: list[float]) -> int:
             """Return how many scores get the label "pass"."""
             pass
         ''',
         """
         check(count_passed, [7.0, 4.0, 5.5, 3.2], expected=2)
         check(count_passed, [8.0, 9.5], expected=2)
         check(count_passed, [], expected=0)
         """,
         hints=["It is the counting pattern from core exercise 6, with a different test inside the loop.",
                'The test is `grade_label(s) == "pass"`.'],
         solution='''
         def count_passed(scores: list[float]) -> int:
             """Return how many scores get the label "pass"."""
             count = 0
             for s in scores:
                 if grade_label(s) == "pass":
                     count += 1
             return count
         ''', core=False)

nb.write("X16", "Write from scratch: combine two functions",
         """
         Write `shopping_total(prices, percent)`. It applies the discount to every price **with your
         `price_with_discount` from X8**, adds the results up and returns the total rounded to 2 decimals.
         """,
         '''
         def shopping_total(prices: list[float], percent: float) -> float:
             """Return the total of the discounted prices, rounded to 2 decimals."""
             pass
         ''',
         """
         check(shopping_total, [10, 20], 50, expected=15.0)
         check(shopping_total, [19.99, 5.01], 0, expected=25.0)
         check(shopping_total, [], 10, expected=0)
         """,
         hints=["An accumulator again: start at 0 and add one discounted price per loop step.",
                "Round once, at the very end: `return round(total, 2)`."],
         solution='''
         def shopping_total(prices: list[float], percent: float) -> float:
             """Return the total of the discounted prices, rounded to 2 decimals."""
             total = 0
             for p in prices:
                 total += price_with_discount(p, percent)
             return round(total, 2)
         ''', core=False)

nb.paper("X17", "Explain it in your own words",
         """
         No code. Write one or two sentences for each, then compare.
         1. What is the difference between `return` and `print`?
         2. When does a function give back `None`?
         3. Why can you not use a variable from inside a function after the call is over?
         """,
         """
         1. `print` shows a value on the screen and gives nothing back. `return` hands the value to the caller, who can store it or calculate with it, and it ends the function.
         2. When the function reaches its end without meeting a `return`, or meets a bare `return`.
         3. The variable is local. It is created when the function runs and is gone when the call ends. Only the returned value leaves the function.
         """, core=False)

if __name__ == "__main__":
    print(nb.save(__file__))
