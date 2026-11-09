"""Builds practice notebooks to the Kopi Academy notebook spec (see CLAUDE.md).

A lesson describes its notebook in content/<track>/<id>/practice.py with the small API
below and this module writes practice.ipynb next to it. Building from one description
keeps the visible solution, the stub and the tests in step, so scripts/verify_notebooks.py
can check every notebook the same way.

    from nbkit import Notebook

    nb = Notebook(lesson="py-01", course="Introduction to Python Programming for AI",
                  week="Week 3", topic="Lists basics", minutes="15 to 20 minutes")
    nb.section("A. Indexing")
    nb.predict("1", "Predict the output", "What does this print?", code, output="7\n")
    nb.write("2", "Write from scratch", task_md, stub, tests, hints=[...], solution=code)
    nb.fix("3", "Fix the bug", task_md, buggy, tests, hints=[...], solution=code)
    nb.paper("4", "Trace by hand", task_md, answer_md, hints=[...])
    nb.save(__file__)

Rules the builder enforces: hints stay folded in <details> blocks, there is a blank line
after </summary> so code fences render, the first cell and the helper cell are standard,
and the last cell is the mistakes list.
"""
from __future__ import annotations

import json
import os
import textwrap

HELPER = '''# Run this cell first. It defines check(), the test helper used in every test cell.
def check(fn, *args, expected, label=None):
    """Call fn(*args), compare with expected and print PASS or FAIL. It never crashes."""
    if label is None:
        shown = ", ".join(repr(a) for a in args)
        label = f"{getattr(fn, '__name__', 'call')}({shown})"
    try:
        got = fn(*args)
    except Exception as error:
        print(f"FAIL  {label} crashed: {type(error).__name__}: {error}")
        return
    if isinstance(expected, float) and isinstance(got, (int, float)) and not isinstance(got, bool):
        ok = abs(got - expected) < 1e-9
    else:
        # True is not 1 here: a function that should return a bool has to return a bool
        ok = got == expected and isinstance(got, bool) == isinstance(expected, bool)
    if ok:
        print(f"PASS  {label} == {expected!r}")
    else:
        print(f"FAIL  {label} should be {expected!r}, but got {got!r}")

print("Helper loaded.")'''

HOW_TO = """**How to use this notebook**
- Run the cells from top to bottom, one at a time, with **Shift + Enter**. Start with the helper cell.
- **Predict** exercises: write your guess first, then run the code to see if you were right.
- **Write** and **fix** exercises: replace `pass` (or repair the code), then run the test cell under it. Every test prints `PASS` or `FAIL`.
- Stuck? Each exercise has hints that stay folded until you click them. Open them one at a time. The solution is the last one.
- Write every exercise you got wrong, or needed a hint for, in the **Mistakes list** at the end.

This is practice written for this site. It is not graded work. Do your graded work yourself."""

PAPER_HOW_TO = """**How to use this notebook**
- Most exercises are **pen and paper**: work the answer out by hand first, the way you will in the exam.
- Then open the folded answer under the exercise and compare, step by step.
- Some exercises have a small code cell that checks a hand answer. Run cells with **Shift + Enter**, the helper cell first.
- Stuck? Hints stay folded until you click them. Open them one at a time.
- Write every exercise you got wrong, or needed a hint for, in the **Mistakes list** at the end.

This is practice written for this site. It is not graded work. Do your graded work yourself."""


def _clean(text: str) -> str:
    return textwrap.dedent(text).strip("\n")


def details(summary: str, body: str) -> str:
    """A folded block. The blank line after </summary> is what lets code fences render."""
    return f"<details><summary>{summary}</summary>\n\n{_clean(body)}\n</details>"


def fence(code: str, lang: str = "python") -> str:
    return f"```{lang}\n{_clean(code)}\n```"


class Notebook:
    def __init__(self, lesson: str, course: str, week: str, topic: str, minutes: str,
                 about: str = "", paper: bool = False, extra_note: str = ""):
        self.lesson = lesson
        self.cells: list[dict] = []
        self._ids: set[str] = set()
        first = [
            f"# {topic}",
            f"**{course} · {week}**",
            "",
            _clean(about) if about else "",
            "",
            f"**Time:** about {minutes}." + (f" {extra_note}" if extra_note else ""),
            "",
            PAPER_HOW_TO if paper else HOW_TO,
        ]
        self._md("\n".join(line for line in first if line is not None).replace("\n\n\n", "\n\n"), role="intro")
        self._code(HELPER, role="helper")

    # ---------- low level ----------
    def _cell(self, cell_type: str, source: str, /, **meta) -> dict:
        cell = {"cell_type": cell_type, "metadata": {"kopi": {k: v for k, v in meta.items() if v is not None}}, "source": source}
        if cell_type == "code":
            cell["execution_count"] = None
            cell["outputs"] = []
        self.cells.append(cell)
        return cell

    def _md(self, source: str, **meta) -> dict:
        return self._cell("markdown", _clean(source), **meta)

    def _code(self, source: str, **meta) -> dict:
        return self._cell("code", _clean(source), **meta)

    def _claim(self, ex: str) -> None:
        if ex in self._ids:
            raise ValueError(f"{self.lesson}: exercise id {ex!r} used twice")
        self._ids.add(ex)

    def _hints(self, ex: str, hints, last_summary: str, last_body: str) -> None:
        blocks = [details(f"Hint {i}", h) for i, h in enumerate(hints, start=1)]
        blocks.append(details(last_summary, last_body))
        self._md("\n\n".join(blocks), role="hints", exercise=ex)

    # ---------- public ----------
    def section(self, title: str, body: str = "") -> None:
        self._md(f"---\n## {title}" + (f"\n\n{_clean(body)}" if body else ""), role="section")

    def md(self, source: str) -> None:
        self._md(source, role="text")

    def code(self, source: str) -> None:
        """A plain code cell that must run without errors (a demo, or a checker for a hand answer)."""
        self._code(source, role="code")

    def predict(self, ex: str, title: str, task: str, code: str, *, output: str | None = None,
                error: str | None = None, why: str = "", hints=(), core: bool = True) -> None:
        """Predict what the code prints. Give `output` (exact stdout) or `error` (exception name)."""
        self._claim(ex)
        if (output is None) == (error is None):
            raise ValueError(f"{self.lesson} {ex}: give exactly one of output= or error=")
        crash = "\n\nThis cell **crashes on purpose**, so you can see the error." if error else ""
        self._md(f"### Exercise {ex} · {title}\n\n{_clean(task)}{crash}\n\n*My prediction:*",
                 role="task", exercise=ex, kind="predict", core=core)
        self._code(code, role="predict", exercise=ex, core=core,
                   expect_output=output, expect_error=error)
        shown = f"It stops with a **{error}**." if error else fence(output.rstrip("\n") or "(nothing is printed)", "text")
        self._hints(ex, hints, "Show answer", shown + (f"\n\n{_clean(why)}" if why else ""))

    def write(self, ex: str, title: str, task: str, stub: str, tests: str, *, hints, solution: str,
              core: bool = True, kind: str = "write") -> None:
        """Write from scratch: a stub with `pass`, a test cell, folded hints, the solution last."""
        self._claim(ex)
        self._md(f"### Exercise {ex} · {title}\n\n{_clean(task)}", role="task", exercise=ex, kind=kind, core=core)
        self._code(stub, role="stub", exercise=ex, core=core)
        self._code(tests, role="test", exercise=ex, core=core)
        self._hints(ex, hints, "Show solution", fence(solution))

    def fix(self, ex: str, title: str, task: str, buggy: str, tests: str, *, hints, solution: str,
            core: bool = True) -> None:
        """Fix the bug: the given code fails its tests until it is repaired."""
        self.write(ex, title, task, buggy, tests, hints=hints, solution=solution, core=core, kind="fix")

    def paper(self, ex: str, title: str, task: str, answer: str, *, hints=(), core: bool = True) -> None:
        """Pen-and-paper exercise with a folded answer (traces, truth tables, explanations)."""
        self._claim(ex)
        self._md(f"### Exercise {ex} · {title}\n\n{_clean(task)}", role="paper", exercise=ex, kind="paper", core=core)
        self._hints(ex, hints, "Show answer", answer)

    def save(self, source_file: str) -> str:
        self._md("---\n## Mistakes list\nEvery exercise you got wrong or needed a hint for. "
                 "Start your next practice session from this list.\n\n- ", role="mistakes")
        nb = {
            "cells": self.cells,
            "metadata": {
                "kernelspec": {"display_name": "Python 3", "language": "python", "name": "python3"},
                "language_info": {"name": "python"},
                "kopi": {"lesson": self.lesson, "spec": 1},
            },
            "nbformat": 4,
            "nbformat_minor": 5,
        }
        for i, cell in enumerate(nb["cells"]):
            cell["id"] = f"{self.lesson}-{i:03d}"
            cell["source"] = cell["source"].splitlines(keepends=True)
        out = os.path.join(os.path.dirname(os.path.abspath(source_file)), "practice.ipynb")
        with open(out, "w", encoding="utf-8") as f:
            json.dump(nb, f, indent=1, ensure_ascii=False)
            f.write("\n")
        return out
