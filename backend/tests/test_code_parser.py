
from backend.app.services.code_parser import (
    analyze_python_source
)


def test_extract_classes_functions_and_imports():

    source = """
import os
from pathlib import Path

class User:
    def login(self, email):
        return email

    async def load(self, user_id):
        return user_id


def build_user(name):
    return name
"""

    result = analyze_python_source(
        source,
        "models.py"
    )

    assert result["class_count"] == 1
    assert result["function_count"] == 3
    assert result["import_count"] == 2

    assert result["classes"][0]["name"] == "User"

    assert result["classes"][0]["methods"] == [
        "login",
        "load"
    ]


def test_extract_nested_functions():

    source = """
def outer():
    def inner(value):
        return value

    return inner
"""

    result = analyze_python_source(
        source,
        "nested.py"
    )

    assert result["function_count"] == 2

    names = [
        item["qualified_name"]
        for item in result["functions"]
    ]

    assert "outer" in names
    assert "outer.inner" in names


def test_detect_syntax_error():

    source = """
def broken_function(
    print("Hello")
"""

    result = analyze_python_source(
        source,
        "broken.py"
    )

    assert result["parse_error"] is not None
    assert result["function_count"] == 0


def test_function_line_numbers():

    source = """
import os

def hello(name):
    return name
"""

    result = analyze_python_source(
        source,
        "hello.py"
    )

    function = result["functions"][0]

    assert function["name"] == "hello"
    assert function["line"] == 4
    assert function["end_line"] == 5
