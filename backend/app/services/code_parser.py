import ast

def get_parameters(node):
    """Extract Function parameters naes."""

    arguments = node.args

    parameters = [
        arg.arg
        for arg in arguments.posonlyargs + arguments.args
    ]

    if arguments.vararg:
        parameters.append("*" + arguments.vararg.arg)

    parameters.extend(
        arg.arg for arg in arguments.kwonlyargs
    )

    if arguments.kwarg:
        parameters.append("**" + arguments.kwarg.arg)

    return parameters

def safe_unparse(node):
    """Convert an AST expression into readable Python code."""

    try:
        return ast.unparse(node)
    except (ValueError, TypeError):
        return "unknown"


class CodeStructureVisitor(ast.NodeVisitor):

    def __init__(self):
        self.classes = []
        self.functions = []
        self.scope = []

    def visit_ClassDef(self, node):

        methods = [
            child.name
            for child in node.body
            if isinstance(
                child,
                (ast.FunctionDef, ast.AsyncFunctionDef)
            )
        ]

        self.classes.append({
            "name": node.name,
            "qualified_name": ".".join(
                self.scope + [node.name]
            ),
            "line": node.lineno,
            "end_line": node.end_lineno or node.lineno,
            "bases": [
                safe_unparse(base)
                for base in node.bases
            ],
            "methods": methods
        })

        self.scope.append(node.name)

        for child in node.body:
            self.visit(child)

        self.scope.pop()

    def visit_FunctionDef(self, node):
        self._visit_function(node, is_async=False)

    def visit_AsyncFunctionDef(self, node):
        self._visit_function(node, is_async=True)

    def _visit_function(self, node, is_async):

        qualified_name = ".".join(
            self.scope + [node.name]
        )

        self.functions.append({
            "name": node.name,
            "qualified_name": qualified_name,
            "line": node.lineno,
            "end_line": node.end_lineno or node.lineno,
            "is_async": is_async,
            "parameters": get_parameters(node)
        })

        self.scope.append(node.name)

        for child in node.body:
            self.visit(child)

        self.scope.pop()


def extract_imports(tree):

    imports = []

    for node in ast.walk(tree):

        if isinstance(node, ast.Import):

            imports.append({
                "module": None,
                "names": [
                    {
                        "name": alias.name,
                        "alias": alias.asname
                    }
                    for alias in node.names
                ],
                "line": node.lineno,
                "level": 0
            })

        elif isinstance(node, ast.ImportFrom):

            imports.append({
                "module": node.module or "",
                "names": [
                    {
                        "name": alias.name,
                        "alias": alias.asname
                    }
                    for alias in node.names
                ],
                "line": node.lineno,
                "level": node.level
            })

    return sorted(imports, key=lambda item: item["line"])


def analyze_python_source(source_code: str, file_path: str) -> dict:
    """Parse Python source code without executing it."""

    result = {
        "path": file_path,
        "line_count": len(source_code.splitlines()),
        "function_count": 0,
        "class_count": 0,
        "import_count": 0,
        "functions": [],
        "classes": [],
        "imports": [],
        "parse_error": None
    }

    try:
        tree = ast.parse(source_code, filename=file_path)

    except SyntaxError as error:

        result["parse_error"] = (
            f"Line {error.lineno}: {error.msg}"
        )

        return result

    visitor = CodeStructureVisitor()
    visitor.visit(tree)

    imports = extract_imports(tree)

    result.update({
        "function_count": len(visitor.functions),
        "class_count": len(visitor.classes),
        "import_count": len(imports),
        "functions": visitor.functions,
        "classes": visitor.classes,
        "imports": imports
    })

    return result