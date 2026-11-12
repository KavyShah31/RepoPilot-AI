
from backend.app.services.quality_analyzer import (
    analyze_python_quality,
    calculate_quality_score,
    get_quality_grade,
    get_complexity,
)

import ast


def test_detects_missing_function_docstring():
    source = """
def hello():
    print("Hello")
"""

    result = analyze_python_quality(source, "sample.py")

    assert any(
        finding["issue_type"] == "missing_docstring"
        for finding in result["findings"]
    )


def test_detects_missing_class_docstring():
    source = """
class Student:
    pass
"""

    result = analyze_python_quality(source, "student.py")

    assert any(
        finding["issue_type"] == "missing_docstring"
        for finding in result["findings"]
    )


def test_detects_todo_comment():
    source = """
# TODO: complete this function
def calculate():
    \"\"\"Calculate a value.\"\"\"
    return 10
"""

    result = analyze_python_quality(source, "todo.py")

    assert any(
        finding["issue_type"] == "todo"
        for finding in result["findings"]
    )


def test_detects_fixme_comment():
    source = """
# FIXME: handle this error
value = 10
"""

    result = analyze_python_quality(source, "fixme.py")

    assert any(
        finding["issue_type"] == "fixme"
        for finding in result["findings"]
    )


def test_detects_unused_import():
    source = """
import os

def hello():
    \"\"\"Print hello.\"\"\"
    print("Hello")
"""

    result = analyze_python_quality(source, "imports.py")

    assert any(
        finding["issue_type"] == "unused_import"
        for finding in result["findings"]
    )


def test_detects_long_function():
    body = "\n".join(
        f"    value_{i} = {i}"
        for i in range(55)
    )

    source = (
        "def long_function():\n"
        '    """A deliberately long function."""\n'
        f"{body}\n"
    )

    result = analyze_python_quality(source, "long.py")

    assert any(
        finding["issue_type"] == "long_function"
        for finding in result["findings"]
    )


def test_detects_high_complexity():
    source = """
def complicated(a, b, c, d):
    if a:
        if b:
            if c:
                if d:
                    return 1
    return 0
"""

    result = analyze_python_quality(source, "complex.py")

    assert any(
        finding["issue_type"] == "high_complexity"
        for finding in result["findings"]
    )


def test_detects_syntax_error():
    source = """
def broken(
    print("Hello")
"""

    result = analyze_python_quality(source, "broken.py")

    assert result["parse_error"] is not None
    assert any(
        finding["issue_type"] == "syntax_error"
        for finding in result["findings"]
    )


def test_quality_score_never_goes_below_zero():
    findings = [
        {"severity": "critical"}
        for _ in range(10)
    ]

    assert calculate_quality_score(findings) == 0


def test_quality_score_for_clean_code():
    assert calculate_quality_score([]) == 100


def test_quality_grade():
    assert get_quality_grade(95) == "Excellent"
    assert get_quality_grade(80) == "Good"
    assert get_quality_grade(65) == "Needs Improvement"
    assert get_quality_grade(40) == "Poor"


def test_complexity_counts_decision_paths():
    source = """
def check(value):
    if value > 10:
        return True
    else:
        return False
"""

    tree = ast.parse(source)
    function = tree.body[0]

    assert get_complexity(function) == 2
