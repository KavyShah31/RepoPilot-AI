
import ast
import re
from typing import Any


LONG_FUNCTION_LINES = 50
HIGH_COMPLEXITY = 10


class ComplexityVisitor(ast.NodeVisitor):
    """Calculate cyclomatic complexity for one function."""

    def __init__(self):
        self.complexity = 1

    def visit_If(self, node):
        self.complexity += 1
        self.generic_visit(node)

    def visit_For(self, node):
        self.complexity += 1
        self.generic_visit(node)

    def visit_AsyncFor(self, node):
        self.complexity += 1
        self.generic_visit(node)

    def visit_While(self, node):
        self.complexity += 1
        self.generic_visit(node)

    def visit_IfExp(self, node):
        self.complexity += 1
        self.generic_visit(node)

    def visit_ExceptHandler(self, node):
        self.complexity += 1
        self.generic_visit(node)

    def visit_With(self, node):
        self.complexity += 1
        self.generic_visit(node)

    def visit_AsyncWith(self, node):
        self.complexity += 1
        self.generic_visit(node)

    def visit_BoolOp(self, node):
        # Each additional boolean condition adds a decision path.
        self.complexity += max(0, len(node.values) - 1)
        self.generic_visit(node)

    def visit_comprehension(self, node):
        self.complexity += 1
        self.generic_visit(node)

    def visit_FunctionDef(self, node):
        # Do not count nested functions as part of the parent.
        return

    def visit_AsyncFunctionDef(self, node):
        return

    def visit_ClassDef(self, node):
        return


def get_complexity(function_node: ast.AST) -> int:
    visitor = ComplexityVisitor()

    for statement in function_node.body:
        visitor.visit(statement)

    return visitor.complexity


def get_function_nodes(tree: ast.AST) -> list[ast.AST]:
    functions = []

    class FunctionCollector(ast.NodeVisitor):
        def visit_FunctionDef(self, node):
            functions.append(node)
            self.generic_visit(node)

        def visit_AsyncFunctionDef(self, node):
            functions.append(node)
            self.generic_visit(node)

    FunctionCollector().visit(tree)
    return functions


def get_class_nodes(tree: ast.AST) -> list[ast.ClassDef]:
    classes = []

    class ClassCollector(ast.NodeVisitor):
        def visit_ClassDef(self, node):
            classes.append(node)
            self.generic_visit(node)

    ClassCollector().visit(tree)
    return classes


def find_unused_imports(tree: ast.AST) -> list[dict[str, Any]]:
    imported_names = []

    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                name = alias.asname or alias.name.split(".")[0]

                imported_names.append({
                    "name": name,
                    "line": node.lineno,
                })

        elif isinstance(node, ast.ImportFrom):
            for alias in node.names:
                if alias.name == "*":
                    continue

                name = alias.asname or alias.name

                imported_names.append({
                    "name": name,
                    "line": node.lineno,
                })

    used_names = {
        node.id
        for node in ast.walk(tree)
        if isinstance(node, ast.Name)
        and isinstance(node.ctx, ast.Load)
    }

    return [
        item
        for item in imported_names
        if item["name"] not in used_names
    ]


def create_finding(
    file_path: str,
    issue_type: str,
    severity: str,
    line: int,
    message: str,
    recommendation: str,
) -> dict[str, Any]:
    return {
        "file": file_path,
        "issue_type": issue_type,
        "severity": severity,
        "line": line,
        "message": message,
        "recommendation": recommendation,
    }


def analyze_python_quality(
    source_code: str,
    file_path: str,
) -> dict[str, Any]:
    findings = []
    lines = source_code.splitlines()

    result = {
        "file": file_path,
        "line_count": len(lines),
        "function_count": 0,
        "class_count": 0,
        "complexity_total": 0,
        "average_complexity": 0.0,
        "findings": findings,
        "parse_error": None,
    }

    try:
        tree = ast.parse(source_code, filename=file_path)
    except SyntaxError as error:
        result["parse_error"] = (
            f"Line {error.lineno}: {error.msg}"
        )

        findings.append(
            create_finding(
                file_path,
                "syntax_error",
                "critical",
                error.lineno or 1,
                error.msg,
                "Fix the syntax error before further code analysis.",
            )
        )
        return result

    functions = get_function_nodes(tree)
    classes = get_class_nodes(tree)

    result["function_count"] = len(functions)
    result["class_count"] = len(classes)

    complexity_values = []

    for function in functions:
        start = function.lineno
        end = function.end_lineno or start
        function_length = end - start + 1
        complexity = get_complexity(function)

        complexity_values.append(complexity)

        if function_length > LONG_FUNCTION_LINES:
            findings.append(
                create_finding(
                    file_path,
                    "long_function",
                    "medium",
                    start,
                    (
                        f"Function '{function.name}' has "
                        f"{function_length} lines."
                    ),
                    "Split the function into smaller, focused functions.",
                )
            )

        if complexity >= HIGH_COMPLEXITY:
            findings.append(
                create_finding(
                    file_path,
                    "high_complexity",
                    "high",
                    start,
                    (
                        f"Function '{function.name}' has "
                        f"cyclomatic complexity {complexity}."
                    ),
                    "Simplify conditional logic and extract helper functions.",
                )
            )

        if ast.get_docstring(function) is None:
            findings.append(
                create_finding(
                    file_path,
                    "missing_docstring",
                    "low",
                    start,
                    f"Function '{function.name}' has no docstring.",
                    "Add a short docstring explaining the function's purpose.",
                )
            )

    for class_node in classes:
        if ast.get_docstring(class_node) is None:
            findings.append(
                create_finding(
                    file_path,
                    "missing_docstring",
                    "low",
                    class_node.lineno,
                    f"Class '{class_node.name}' has no docstring.",
                    "Add a docstring describing the class responsibility.",
                )
            )

    # Find TODO and FIXME comments.
    for line_number, line in enumerate(lines, start=1):
        match = re.search(r"#.*\b(TODO|FIXME)\b", line, re.IGNORECASE)

        if match:
            marker = match.group(1).upper()

            findings.append(
                create_finding(
                    file_path,
                    marker.lower(),
                    "medium" if marker == "FIXME" else "low",
                    line_number,
                    f"{marker} comment found: {line.strip()}",
                    "Review this comment and complete or document the remaining work.",
                )
            )

    # Find potentially unused imports.
    for unused in find_unused_imports(tree):
        findings.append(
            create_finding(
                file_path,
                "unused_import",
                "low",
                unused["line"],
                f"Import '{unused['name']}' may be unused.",
                "Verify whether this import is needed and remove it if unnecessary.",
            )
        )

    total_complexity = sum(complexity_values)

    result["complexity_total"] = total_complexity
    result["average_complexity"] = (
        round(total_complexity / len(complexity_values), 2)
        if complexity_values
        else 0.0
    )

    return result


def calculate_quality_score(findings: list[dict]) -> int:
    """Return a simple rule-based score between 0 and 100."""

    deductions = {
        "critical": 20,
        "high": 10,
        "medium": 5,
        "low": 2,
    }

    score = 100

    for finding in findings:
        score -= deductions.get(finding["severity"], 0)

    return max(0, min(100, score))


def get_quality_grade(score: int) -> str:
    if score >= 90:
        return "Excellent"
    if score >= 75:
        return "Good"
    if score >= 60:
        return "Needs Improvement"
    return "Poor"
