
from pydantic import BaseModel, Field


class CodeAnalysisRequest(BaseModel):
    repo_url: str = Field(
        min_length=10,
        max_length=500
    )

    max_files: int = Field(
        default=15,
        ge=1,
        le=25
    )


class FunctionInfo(BaseModel):
    name: str
    qualified_name: str
    line: int
    end_line: int
    is_async: bool
    parameters: list[str]


class ClassInfo(BaseModel):
    name: str
    qualified_name: str
    line: int
    end_line: int
    bases: list[str]
    methods: list[str]


class ImportInfo(BaseModel):
    module: str | None = None
    names: list[dict]
    line: int
    level: int


class PythonFileAnalysis(BaseModel):
    path: str
    line_count: int
    function_count: int
    class_count: int
    import_count: int
    functions: list[FunctionInfo]
    classes: list[ClassInfo]
    imports: list[ImportInfo]
    parse_error: str | None = None


class CodeAnalysisResponse(BaseModel):
    repository: str
    default_branch: str
    discovered_python_files: int
    analyzed_files: int
    skipped_files: int
    total_functions: int
    total_classes: int
    total_imports: int
    files: list[PythonFileAnalysis]
    warning: str | None = None
