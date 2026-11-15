
SEVERITY_ORDER = {
    "critical": 1,
    "high": 2,
    "medium": 3,
    "low": 4,
}

PRIORITY_SCORES = {
    "critical": 100,
    "high": 75,
    "medium": 50,
    "low": 25,
}

RISK_POINTS = {
    "critical": 25,
    "high": 15,
    "medium": 7,
    "low": 3,
}


def get_recommendation_category(issue_type, source):
    issue = str(issue_type).lower()

    if source == "security":
        return "Security"

    if "complexity" in issue:
        return "Code Complexity"

    if "long_function" in issue:
        return "Maintainability"

    if "docstring" in issue:
        return "Documentation"

    if "unused_import" in issue:
        return "Code Cleanup"

    if "todo" in issue or "fixme" in issue:
        return "Technical Debt"

    if "syntax" in issue:
        return "Syntax"

    return "Code Quality"


def get_fix_guidance(issue_type, source):
    """
    Generate rule-based guidance for a detected issue.
    This function does not modify repository files.
    """

    issue = str(issue_type).lower()

    # SECURITY GUIDANCE

    if source == "security":

        if "secret" in issue or "api_key" in issue or "credential" in issue:
            return {
                "why_it_matters": (
                    "Exposed credentials can allow unauthorized "
                    "access to accounts, services, or infrastructure."
                ),
                "fix_steps": [
                    "Remove the exposed credential from the source code.",
                    "Revoke or rotate the affected credential immediately.",
                    "Load credentials from environment variables or a secret manager.",
                    "Ensure secret files are excluded from Git commits.",
                ],
                "verification_steps": [
                    "Search the repository for the exposed credential.",
                    "Confirm the old credential no longer works.",
                    "Check that the new credential is not committed to Git.",
                ],
            }

        if "private_key" in issue or "private key" in issue:
            return {
                "why_it_matters": (
                    "An exposed private key may allow an attacker "
                    "to impersonate a trusted identity."
                ),
                "fix_steps": [
                    "Remove the private key from the repository.",
                    "Revoke or replace the exposed key.",
                    "Store replacement keys in a secure secret manager.",
                    "Restrict access to the replacement key.",
                ],
                "verification_steps": [
                    "Confirm the exposed key has been revoked.",
                    "Search the repository for private key material.",
                    "Verify that the application uses the replacement key securely.",
                ],
            }

        if "eval" in issue or "exec" in issue:
            return {
                "why_it_matters": (
                    "Executing dynamically supplied code can allow "
                    "untrusted input to perform unintended operations."
                ),
                "fix_steps": [
                    "Identify where the dynamic code input originates.",
                    "Avoid eval or exec when a normal function or parser can be used.",
                    "Use a restricted, explicit set of permitted operations.",
                    "Validate and constrain all untrusted input.",
                ],
                "verification_steps": [
                    "Test with normal input and unexpected input.",
                    "Confirm untrusted input cannot execute arbitrary code.",
                    "Review the replacement logic for unintended behavior.",
                ],
            }

        if "shell" in issue:
            return {
                "why_it_matters": (
                    "Unsafe shell command execution can expose the "
                    "application to command injection."
                ),
                "fix_steps": [
                    "Avoid passing untrusted input into shell commands.",
                    "Prefer subprocess argument lists instead of shell=True.",
                    "Validate arguments against an explicit allowlist.",
                    "Avoid constructing commands through string concatenation.",
                ],
                "verification_steps": [
                    "Test inputs containing shell metacharacters.",
                    "Confirm user input cannot change the executed command.",
                    "Review subprocess calls for unsafe shell usage.",
                ],
            }

        if "pickle" in issue:
            return {
                "why_it_matters": (
                    "Loading untrusted pickle data can execute "
                    "malicious code during deserialization."
                ),
                "fix_steps": [
                    "Do not load pickle files from untrusted sources.",
                    "Use safer formats such as JSON where appropriate.",
                    "Validate the structure of data before processing it.",
                    "Restrict access to trusted serialized files.",
                ],
                "verification_steps": [
                    "Check where serialized files originate.",
                    "Confirm untrusted files cannot reach pickle loading operations.",
                    "Test the replacement data-loading process.",
                ],
            }

        if "yaml" in issue:
            return {
                "why_it_matters": (
                    "Unsafe YAML deserialization can execute "
                    "unexpected constructors or code."
                ),
                "fix_steps": [
                    "Use yaml.safe_load() for untrusted YAML input.",
                    "Validate the resulting data structure.",
                    "Avoid custom unsafe YAML constructors.",
                ],
                "verification_steps": [
                    "Test with valid YAML input.",
                    "Test with unexpected YAML objects.",
                    "Confirm unsafe constructors are not executed.",
                ],
            }

        if "sql" in issue:
            return {
                "why_it_matters": (
                    "Building SQL queries through string formatting "
                    "can expose the application to SQL injection."
                ),
                "fix_steps": [
                    "Replace dynamically formatted SQL with parameterized queries.",
                    "Pass user input through database parameters.",
                    "Avoid concatenating untrusted values into SQL statements.",
                    "Review other database queries for the same pattern.",
                ],
                "verification_steps": [
                    "Test with normal database inputs.",
                    "Test with SQL injection-style input.",
                    "Confirm user input is treated as data rather than SQL code.",
                ],
            }

        if "innerhtml" in issue or "document.write" in issue:
            return {
                "why_it_matters": (
                    "Inserting untrusted content into HTML can create "
                    "cross-site scripting vulnerabilities."
                ),
                "fix_steps": [
                    "Identify whether the inserted content is user-controlled.",
                    "Prefer safe DOM APIs or framework-managed rendering.",
                    "Sanitize HTML if rendering HTML is genuinely required.",
                    "Validate and encode untrusted content appropriately.",
                ],
                "verification_steps": [
                    "Test with HTML and script-like input.",
                    "Confirm untrusted content is displayed safely.",
                    "Review other dynamic HTML insertion points.",
                ],
            }

        if "tls" in issue or "ssl" in issue or "verify" in issue:
            return {
                "why_it_matters": (
                    "Disabling TLS certificate verification can expose "
                    "network communication to interception."
                ),
                "fix_steps": [
                    "Enable TLS certificate verification.",
                    "Use a trusted certificate authority.",
                    "Fix certificate configuration problems rather than disabling verification.",
                    "Avoid disabling verification in production code.",
                ],
                "verification_steps": [
                    "Test communication with a valid certificate.",
                    "Confirm invalid certificates are rejected.",
                    "Review network requests for disabled verification.",
                ],
            }

        return {
            "why_it_matters": (
                "This security pattern may expose the application "
                "to an unintended security risk."
            ),
            "fix_steps": [
                "Review the flagged code and identify the security-sensitive operation.",
                "Check whether untrusted input or external data is involved.",
                "Apply the recommendation provided by the security analyzer.",
                "Use established secure coding practices for the affected operation.",
            ],
            "verification_steps": [
                "Test normal and unexpected inputs.",
                "Review the affected code for the reported security pattern.",
                "Confirm that the identified risk has been addressed.",
            ],
        }

    # CODE QUALITY GUIDANCE

    if "syntax" in issue:
        return {
            "why_it_matters": (
                "Syntax errors can prevent the application or module "
                "from executing correctly."
            ),
            "fix_steps": [
                "Open the affected file and locate the reported line.",
                "Inspect brackets, indentation, quotes, and punctuation.",
                "Correct the syntax without changing the intended behavior.",
                "Review nearby code for related syntax problems.",
            ],
            "verification_steps": [
                "Run a syntax check on the affected file.",
                "Confirm the module can be imported successfully.",
                "Run the relevant application or test workflow.",
            ],
        }

    if "complexity" in issue:
        return {
            "why_it_matters": (
                "Highly complex functions are harder to understand, "
                "test, debug, and maintain."
            ),
            "fix_steps": [
                "Identify deeply nested conditions and repeated logic.",
                "Extract independent operations into smaller functions.",
                "Simplify conditional expressions where possible.",
                "Use clear names for extracted functions and variables.",
            ],
            "verification_steps": [
                "Test all important branches and edge cases.",
                "Compare behavior before and after refactoring.",
                "Review whether the function is easier to understand.",
            ],
        }

    if "long_function" in issue:
        return {
            "why_it_matters": (
                "Long functions can combine too many responsibilities "
                "and make future changes difficult."
            ),
            "fix_steps": [
                "Identify logical sections inside the function.",
                "Extract independent sections into smaller helper functions.",
                "Keep each function focused on one responsibility.",
                "Use descriptive function and variable names.",
            ],
            "verification_steps": [
                "Test the original function's expected behavior.",
                "Check that extracted functions handle their inputs correctly.",
                "Confirm the refactoring has not introduced regressions.",
            ],
        }

    if "docstring" in issue:
        return {
            "why_it_matters": (
                "Missing documentation makes it harder for other "
                "developers to understand the purpose of code."
            ),
            "fix_steps": [
                "Add a docstring describing the function or class purpose.",
                "Document important parameters and return values.",
                "Mention relevant exceptions or side effects.",
                "Keep documentation consistent with actual behavior.",
            ],
            "verification_steps": [
                "Review the docstring for accuracy.",
                "Confirm documented parameters match the implementation.",
                "Check that documentation remains understandable.",
            ],
        }

    if "unused_import" in issue:
        return {
            "why_it_matters": (
                "Unused imports add unnecessary clutter and can "
                "make dependencies harder to understand."
            ),
            "fix_steps": [
                "Check whether the imported module is used anywhere in the file.",
                "Remove the import if it is genuinely unused.",
                "Preserve imports required for indirect or framework usage.",
                "Organize the remaining imports consistently.",
            ],
            "verification_steps": [
                "Run the affected module or its relevant tests.",
                "Confirm no required import was removed.",
                "Review the file for remaining unused imports.",
            ],
        }

    if "todo" in issue or "fixme" in issue:
        return {
            "why_it_matters": (
                "Unresolved TODO or FIXME comments may represent "
                "unfinished work or known technical debt."
            ),
            "fix_steps": [
                "Read the comment and understand the unfinished task.",
                "Determine whether the task is still relevant.",
                "Implement the required change or create a tracked issue.",
                "Remove or update the comment after resolving it.",
            ],
            "verification_steps": [
                "Confirm the underlying task is completed or tracked.",
                "Check that the comment accurately reflects the remaining work.",
                "Test any code changed while resolving the issue.",
            ],
        }

    return {
        "why_it_matters": (
            "This finding indicates an opportunity to improve "
            "code quality, readability, or maintainability."
        ),
        "fix_steps": [
            "Review the affected file and understand the reported issue.",
            "Follow the recommendation from the analyzer.",
            "Make a focused change without altering unrelated behavior.",
            "Review the updated code for readability and maintainability.",
        ],
        "verification_steps": [
            "Run the relevant tests or application workflow.",
            "Confirm the reported issue has been addressed.",
            "Check that the change has not introduced regressions.",
        ],
    }


def create_recommendation(finding, source, recommendation_number):
    issue_type = finding.get("issue_type", "Unknown Issue")

    severity = str(
        finding.get("severity", "low")
    ).lower()

    if severity not in SEVERITY_ORDER:
        severity = "low"

    guidance = get_fix_guidance(issue_type, source)

    return {
        "id": f"REC-{recommendation_number:04d}",
        "source": source,
        "category": get_recommendation_category(
            issue_type,
            source,
        ),
        "title": issue_type,
        "priority": severity.upper(),
        "priority_score": PRIORITY_SCORES[severity],
        "file": finding.get("file", "Unknown file"),
        "line": finding.get("line"),
        "description": finding.get(
            "message",
            "No additional description available.",
        ),
        "suggested_action": finding.get(
            "recommendation",
            "Review this issue and improve the affected code.",
        ),
        "why_it_matters": guidance["why_it_matters"],
        "fix_steps": guidance["fix_steps"],
        "verification_steps": guidance["verification_steps"],
        "auto_fix_available": False,
    }


def calculate_repository_risk(recommendations):
    risk_points = sum(
        RISK_POINTS.get(item["priority"].lower(), 0)
        for item in recommendations
    )

    risk_score = min(100, risk_points)

    if risk_score >= 75:
        risk_level = "Critical"
    elif risk_score >= 50:
        risk_level = "High"
    elif risk_score >= 25:
        risk_level = "Medium"
    elif risk_score > 0:
        risk_level = "Low"
    else:
        risk_level = "Healthy"

    return {
        "risk_score": risk_score,
        "risk_level": risk_level,
        "risk_points": risk_points,
    }


def build_recommendations(quality_result, security_result):
    recommendations = []

    quality_findings = quality_result.get("findings", [])
    security_findings = security_result.get("findings", [])

    recommendation_number = 1

    for finding in quality_findings:
        recommendations.append(
            create_recommendation(
                finding,
                "quality",
                recommendation_number,
            )
        )
        recommendation_number += 1

    for finding in security_findings:
        recommendations.append(
            create_recommendation(
                finding,
                "security",
                recommendation_number,
            )
        )
        recommendation_number += 1

    recommendations.sort(
        key=lambda item: (
            SEVERITY_ORDER.get(item["priority"].lower(), 5),
            -item["priority_score"],
        )
    )

    priority_counts = {
        "critical": 0,
        "high": 0,
        "medium": 0,
        "low": 0,
    }

    category_counts = {}

    for item in recommendations:
        priority = item["priority"].lower()
        category = item["category"]

        priority_counts[priority] += 1

        category_counts[category] = (
            category_counts.get(category, 0) + 1
        )

    total_recommendations = len(recommendations)

    if priority_counts["critical"] > 0:
        overall_status = "Critical Issues Found"
    elif priority_counts["high"] > 0:
        overall_status = "High Priority Improvements Needed"
    elif total_recommendations > 0:
        overall_status = "Improvements Recommended"
    else:
        overall_status = "No Findings Detected"

    risk = calculate_repository_risk(recommendations)

    return {
        "overall_status": overall_status,
        "total_recommendations": total_recommendations,
        "priority_counts": priority_counts,
        "category_counts": category_counts,
        "quality_score": quality_result.get("quality_score"),
        "quality_grade": quality_result.get("quality_grade"),
        "security_score": security_result.get("security_score"),
        "security_grade": security_result.get("security_grade"),
        "risk": risk,
        "recommendations": recommendations,
    }
