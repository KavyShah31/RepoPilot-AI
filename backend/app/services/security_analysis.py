
import re


SECURITY_RULES = [
    {
        "id": "hardcoded-secret",
        "pattern": re.compile(
            r"""(?i)\b(api[_-]?key|secret[_-]?key|access[_-]?token|password|passwd)\b\s*[:=]\s*["'][^"'\s]{6,}["']"""
        ),
        "severity": "critical",
        "issue_type": "Hardcoded Secret",
        "message": "A possible credential or secret is hardcoded in the source file.",
        "recommendation": "Remove the credential, rotate it if it was real, and load secrets from environment variables or a secret manager.",
    },
    {
        "id": "aws-access-key",
        "pattern": re.compile(r"\bAKIA[0-9A-Z]{16}\b"),
        "severity": "critical",
        "issue_type": "Possible AWS Access Key",
        "message": "A string matching the format of an AWS access key was found.",
        "recommendation": "Remove the exposed key and rotate it immediately. Store credentials securely outside source control.",
    },
    {
        "id": "private-key",
        "pattern": re.compile(r"-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----"),
        "severity": "critical",
        "issue_type": "Private Key Exposure",
        "message": "A private-key header was found in a committed file.",
        "recommendation": "Remove the private key from the repository and rotate or revoke the associated key.",
    },
    {
        "id": "python-eval",
        "pattern": re.compile(r"\beval\s*\("),
        "extensions": {".py"},
        "severity": "high",
        "issue_type": "Dynamic Code Execution",
        "message": "eval() can execute dynamically supplied Python expressions.",
        "recommendation": "Avoid eval() for untrusted input. Use explicit parsing or a safe mapping of permitted operations.",
    },
    {
        "id": "python-exec",
        "pattern": re.compile(r"\bexec\s*\("),
        "extensions": {".py"},
        "severity": "high",
        "issue_type": "Dynamic Code Execution",
        "message": "exec() can execute dynamically supplied Python code.",
        "recommendation": "Avoid exec() with external or user-controlled input. Replace it with explicit, validated logic.",
    },
    {
        "id": "shell-true",
        "pattern": re.compile(r"\bshell\s*=\s*True\b"),
        "extensions": {".py"},
        "severity": "high",
        "issue_type": "Shell Command Risk",
        "message": "A subprocess call appears to enable shell execution.",
        "recommendation": "Prefer subprocess calls with an argument list and shell=False. Validate all external input.",
    },
    {
        "id": "pickle-load",
        "pattern": re.compile(r"\bpickle\.(loads?|Unpickler)\s*\("),
        "extensions": {".py"},
        "severity": "high",
        "issue_type": "Unsafe Deserialization",
        "message": "Pickle deserialization can execute code when processing malicious data.",
        "recommendation": "Never load untrusted pickle data. Prefer JSON or another format that does not execute object constructors.",
    },
    {
        "id": "yaml-unsafe-load",
        "pattern": re.compile(r"\byaml\.load\s*\("),
        "extensions": {".py"},
        "severity": "high",
        "issue_type": "Unsafe YAML Loading",
        "message": "yaml.load() may construct unsafe Python objects depending on its loader.",
        "recommendation": "Use yaml.safe_load() for untrusted YAML input.",
    },
    {
        "id": "sql-format",
        "pattern": re.compile(
            r"""(?i)\b(?:execute|executemany)\s*\(\s*(?:f["']|["'][^"']*(?:%s|%\s*\(|\.format\s*\())"""
        ),
        "extensions": {".py"},
        "severity": "high",
        "issue_type": "Possible SQL Injection",
        "message": "A database execution call appears to build SQL using string formatting.",
        "recommendation": "Use parameterized SQL queries and pass values separately from the SQL statement.",
    },
    {
        "id": "javascript-eval",
        "pattern": re.compile(r"\beval\s*\("),
        "extensions": {".js", ".jsx", ".ts", ".tsx"},
        "severity": "high",
        "issue_type": "Dynamic Code Execution",
        "message": "eval() can execute dynamically supplied JavaScript.",
        "recommendation": "Avoid eval(). Use explicit functions and safe data parsing instead.",
    },
    {
        "id": "javascript-innerhtml",
        "pattern": re.compile(r"\.innerHTML\s*="),
        "extensions": {".js", ".jsx", ".ts", ".tsx"},
        "severity": "medium",
        "issue_type": "Unsafe HTML Injection Risk",
        "message": "Direct innerHTML assignment can introduce cross-site scripting if content is untrusted.",
        "recommendation": "Prefer textContent or safe framework rendering. Sanitize HTML when rendering trusted markup is necessary.",
    },
    {
        "id": "javascript-document-write",
        "pattern": re.compile(r"\bdocument\.write\s*\("),
        "extensions": {".js", ".jsx", ".ts", ".tsx"},
        "severity": "medium",
        "issue_type": "Unsafe DOM Operation",
        "message": "document.write() can create injection risks when used with untrusted content.",
        "recommendation": "Use safe DOM APIs and avoid writing untrusted data directly into the document.",
    },
    {
        "id": "disabled-tls",
        "pattern": re.compile(
            r"""(?i)(?:verify\s*=\s*False|rejectUnauthorized\s*:\s*false|CERT_NONE)"""
        ),
        "severity": "high",
        "issue_type": "TLS Verification Disabled",
        "message": "TLS certificate verification appears to be disabled.",
        "recommendation": "Enable certificate verification to protect connections against interception.",
    },
]


def scan_source_file(source: str, file_path: str) -> list[dict]:
    findings = []
    extension = "." + file_path.rsplit(".", 1)[-1].lower() if "." in file_path else ""

    for line_number, line in enumerate(source.splitlines(), start=1):
        stripped = line.strip()

        if not stripped or stripped.startswith(("#", "//", "*")):
            continue

        for rule in SECURITY_RULES:
            allowed_extensions = rule.get("extensions")

            if allowed_extensions and extension not in allowed_extensions:
                continue

            if rule["pattern"].search(line):
                findings.append({
                    "file": file_path,
                    "issue_type": rule["issue_type"],
                    "severity": rule["severity"],
                    "line": line_number,
                    "message": rule["message"],
                    "recommendation": rule["recommendation"],
                })

    return findings


def calculate_security_score(findings: list[dict]) -> int:
    penalties = {
        "critical": 25,
        "high": 15,
        "medium": 7,
        "low": 3,
    }

    total_penalty = sum(
        penalties.get(finding["severity"], 0)
        for finding in findings
    )

    return max(0, min(100, 100 - total_penalty))


def get_security_grade(score: int) -> str:
    if score >= 90:
        return "A"
    if score >= 80:
        return "B"
    if score >= 70:
        return "C"
    if score >= 60:
        return "D"
    return "F"
