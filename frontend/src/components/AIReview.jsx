
import { useState } from "react";
import {
  BrainCircuit,
  Search,
  LoaderCircle,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileCode,
  Code2,
  Lightbulb,
  RefreshCw,
  GitBranch,
  Info,
} from "lucide-react";

import { analyzeAIReview } from "../services/api";
import "./AIReview.css";

function AIReview() {
  const [repoUrl, setRepoUrl] = useState("");
  const [maxFiles, setMaxFiles] = useState(3);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedFiles, setExpandedFiles] = useState({});
  const [expandedFindings, setExpandedFindings] = useState({});

  const handleAnalyze = async (event) => {
    event.preventDefault();

    if (!repoUrl.trim()) {
      setError("Please enter a GitHub repository URL.");
      return;
    }

    if (!/^https:\/\/github\.com\/[^/]+\/[^/]+\/?$/.test(repoUrl.trim())) {
      setError("Enter a valid public GitHub repository URL.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setExpandedFiles({});
    setExpandedFindings({});

    try {
      const data = await analyzeAIReview(
        repoUrl.trim(),
        Number(maxFiles)
      );

      setResult(data);
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        "Unable to complete AI code review.";

      setError(
        typeof message === "string"
          ? message
          : JSON.stringify(message)
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleFile = (index) => {
    setExpandedFiles((previous) => ({
      ...previous,
      [index]: !previous[index],
    }));
  };

  const toggleFinding = (fileIndex, findingIndex) => {
    const key = `${fileIndex}-${findingIndex}`;

    setExpandedFindings((previous) => ({
      ...previous,
      [key]: !previous[key],
    }));
  };

  const getSeverityClass = (severity) => {
    switch ((severity || "").toLowerCase()) {
      case "critical":
        return "ai-severity-critical";
      case "high":
        return "ai-severity-high";
      case "medium":
        return "ai-severity-medium";
      default:
        return "ai-severity-low";
    }
  };

  const getSeverityIcon = (severity) => {
    switch ((severity || "").toLowerCase()) {
      case "critical":
        return <AlertCircle size={17} />;
      case "high":
        return <AlertTriangle size={17} />;
      case "medium":
        return <Info size={17} />;
      default:
        return <CheckCircle2 size={17} />;
    }
  };

  return (
    <div className="ai-review-page">

      {/* HEADER */}

      <section className="ai-review-header">
        <div>
          <div className="ai-review-eyebrow">
            <BrainCircuit size={16} />
            AI-POWERED CODE INTELLIGENCE
          </div>

          <h2>AI Code Review</h2>

          <p>
            Review your repository with AI. Identify potential issues,
            understand code problems, and get actionable suggestions.
          </p>
        </div>

        <div className="ai-review-header-icon">
          <BrainCircuit size={35} />
        </div>
      </section>

      {/* REPOSITORY INPUT */}

      <form className="ai-review-form" onSubmit={handleAnalyze}>
        <div className="ai-review-input">
          <GitBranch size={19} />

          <input
            type="url"
            value={repoUrl}
            onChange={(event) => setRepoUrl(event.target.value)}
            placeholder="https://github.com/username/repository"
            aria-label="GitHub repository URL"
            required
          />
        </div>

        <select
          value={maxFiles}
          onChange={(event) => setMaxFiles(Number(event.target.value))}
          aria-label="Maximum files to review"
        >
          <option value={1}>1 File</option>
          <option value={2}>2 Files</option>
          <option value={3}>3 Files</option>
          <option value={5}>5 Files</option>
          <option value={10}>10 Files</option>
        </select>

        <button type="submit" disabled={loading}>
          {loading ? (
            <>
              <LoaderCircle className="ai-review-spin" size={18} />
              Reviewing...
            </>
          ) : (
            <>
              <BrainCircuit size={18} />
              Start AI Review
            </>
          )}
        </button>
      </form>

      {/* ERROR */}

      {error && (
        <div className="ai-review-error">
          <AlertCircle size={19} />
          <span>{error}</span>
        </div>
      )}

      {/* LOADING */}

      {loading && (
        <div className="ai-review-loading">
          <LoaderCircle className="ai-review-spin" size={38} />

          <h3>AI is reviewing your code...</h3>

          <p>
            Reading repository files and preparing code review findings.
            This may take a little time.
          </p>
        </div>
      )}

      {/* EMPTY STATE */}

      {!result && !loading && !error && (
        <div className="ai-review-empty">
          <div className="ai-review-empty-icon">
            <BrainCircuit size={42} />
          </div>

          <h3>Ready for an AI Code Review?</h3>

          <p>
            Enter a public GitHub repository URL to receive file-wise
            review summaries, issue explanations, and suggested fixes.
          </p>
        </div>
      )}

      {/* RESULTS */}

      {result && (
        <>
          {/* REPOSITORY INFORMATION */}

          <section className="ai-review-repository">
            <div>
              <span className="ai-review-label">REVIEWED REPOSITORY</span>

              <h3>{result.repository}</h3>

              <p>
                <GitBranch size={14} />
                Branch: {result.branch}
              </p>
            </div>

            <button
              type="button"
              className="ai-review-again"
              onClick={handleAnalyze}
              disabled={loading}
            >
              <RefreshCw size={16} />
              Review Again
            </button>
          </section>

          {/* SUMMARY */}

          <section className="ai-review-summary">
            <div className="ai-review-section-title">
              <BrainCircuit size={19} />
              <h3>AI Review Summary</h3>
            </div>

            <p>{result.summary || "No summary was returned."}</p>
          </section>

          {/* STATISTICS */}

          <section className="ai-review-stats">
            <div className="ai-review-stat-card">
              <FileCode size={20} />
              <span>Discovered Files</span>
              <strong>{result.discovered_files}</strong>
            </div>

            <div className="ai-review-stat-card">
              <CheckCircle2 size={20} />
              <span>Reviewed Files</span>
              <strong>{result.reviewed_files}</strong>
            </div>

            <div className="ai-review-stat-card">
              <AlertCircle size={20} />
              <span>Total Issues</span>
              <strong>{result.total_issues}</strong>
            </div>

            <div className="ai-review-stat-card">
              <FileCode size={20} />
              <span>Skipped Files</span>
              <strong>{result.skipped_files}</strong>
            </div>
          </section>

          {/* SEVERITY */}

          <section className="ai-review-severity-section">
            <div className="ai-review-section-heading">
              <div>
                <h3>Issue Severity</h3>
                <p>Severity distribution from AI review findings</p>
              </div>
            </div>

            <div className="ai-review-severity-grid">
              <div className="ai-review-severity-card critical">
                <AlertCircle size={21} />
                <span>Critical</span>
                <strong>{result.critical_issues}</strong>
              </div>

              <div className="ai-review-severity-card high">
                <AlertTriangle size={21} />
                <span>High</span>
                <strong>{result.high_issues}</strong>
              </div>

              <div className="ai-review-severity-card medium">
                <Info size={21} />
                <span>Medium</span>
                <strong>{result.medium_issues}</strong>
              </div>

              <div className="ai-review-severity-card low">
                <CheckCircle2 size={21} />
                <span>Low</span>
                <strong>{result.low_issues}</strong>
              </div>
            </div>
          </section>

          {/* FILE REVIEWS */}

          <section className="ai-review-files-section">
            <div className="ai-review-section-heading">
              <div>
                <h3>File-wise Code Review</h3>
                <p>Expand a file to inspect its AI findings.</p>
              </div>

              <span className="ai-review-count">
                {result.reviews?.length || 0} Files
              </span>
            </div>

            {result.reviews?.length > 0 ? (
              <div className="ai-review-files-list">
                {result.reviews.map((fileReview, fileIndex) => (
                  <article className="ai-review-file-card" key={`${fileReview.file_path}-${fileIndex}`}>

                    <button
                      type="button"
                      className="ai-review-file-header"
                      onClick={() => toggleFile(fileIndex)}
                      aria-expanded={Boolean(expandedFiles[fileIndex])}
                    >
                      <div className="ai-review-file-title">
                        <div className="ai-review-file-icon">
                          <FileCode size={20} />
                        </div>

                        <div>
                          <h4>{fileReview.file_path}</h4>
                          <span>
                            {fileReview.findings?.length || 0} findings
                          </span>
                        </div>
                      </div>

                      {expandedFiles[fileIndex] ? (
                        <ChevronUp size={20} />
                      ) : (
                        <ChevronDown size={20} />
                      )}
                    </button>

                    <div className="ai-review-file-summary">
                      <strong>File Summary</strong>
                      <p>{fileReview.summary}</p>
                    </div>

                    {expandedFiles[fileIndex] && (
                      <div className="ai-review-findings">

                        {fileReview.findings?.length > 0 ? (
                          fileReview.findings.map((finding, findingIndex) => {
                            const findingKey = `${fileIndex}-${findingIndex}`;
                            const isExpanded = Boolean(
                              expandedFindings[findingKey]
                            );

                            return (
                              <div
                                className="ai-review-finding"
                                key={findingKey}
                              >
                                <button
                                  type="button"
                                  className="ai-review-finding-header"
                                  onClick={() =>
                                    toggleFinding(fileIndex, findingIndex)
                                  }
                                  aria-expanded={isExpanded}
                                >
                                  <div className="ai-review-finding-title">
                                    <span
                                      className={`ai-review-severity-badge ${getSeverityClass(finding.severity)}`}
                                    >
                                      {getSeverityIcon(finding.severity)}
                                      {finding.severity}
                                    </span>

                                    <div>
                                      <h5>{finding.title}</h5>
                                      <span>
                                        {finding.issue_type} · Line {finding.line}
                                      </span>
                                    </div>
                                  </div>

                                  {isExpanded ? (
                                    <ChevronUp size={18} />
                                  ) : (
                                    <ChevronDown size={18} />
                                  )}
                                </button>

                                {isExpanded && (
                                  <div className="ai-review-finding-details">

                                    <div>
                                      <strong>Issue Description</strong>
                                      <p>{finding.description}</p>
                                    </div>

                                    <div className="ai-review-recommendation">
                                      <strong>
                                        <Lightbulb size={16} />
                                        Recommendation
                                      </strong>
                                      <p>{finding.recommendation}</p>
                                    </div>

                                    {finding.suggested_fix && (
                                      <div className="ai-review-suggested-fix">
                                        <strong>
                                          <Code2 size={16} />
                                          Suggested Fix
                                        </strong>

                                        <pre>
                                          <code>{finding.suggested_fix}</code>
                                        </pre>
                                      </div>
                                    )}

                                  </div>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <div className="ai-review-no-findings">
                            <CheckCircle2 size={20} />
                            No findings were returned for this file.
                          </div>
                        )}

                      </div>
                    )}

                  </article>
                ))}
              </div>
            ) : (
              <div className="ai-review-no-findings">
                <CheckCircle2 size={22} />
                No file reviews were returned.
              </div>
            )}
          </section>

          {/* WARNINGS */}

          {result.warnings?.length > 0 && (
            <section className="ai-review-warnings">
              <h3>
                <AlertTriangle size={19} />
                Review Warnings
              </h3>

              {result.warnings.map((warning, index) => (
                <p key={index}>{warning}</p>
              ))}
            </section>
          )}

          {/* FOOTER */}

          <div className="ai-review-footer">
            <span>
              <CheckCircle2 size={16} />
              AI review response received
            </span>

            <span>
              {result.reviewed_files} reviewed · {result.skipped_files} skipped
            </span>
          </div>
        </>
      )}
    </div>
  );
}

export default AIReview;
