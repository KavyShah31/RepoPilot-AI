
import { useState } from "react";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  FileCode,
  LoaderCircle,
  Search,
  ShieldCheck,
  Info,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from "lucide-react";

import { analyzeQuality } from "../services/api";
import "./QualityDashboard.css";

function QualityDashboard() {
  const [repoUrl, setRepoUrl] = useState("");
  const [maxFiles, setMaxFiles] = useState(15);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedFinding, setExpandedFinding] = useState(null);

  const handleAnalyze = async (event) => {
    event.preventDefault();

    if (!repoUrl.trim()) {
      setError("Please enter a GitHub repository URL.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setExpandedFinding(null);

    try {
      const data = await analyzeQuality(
        repoUrl.trim(),
        Number(maxFiles)
      );

      setResult(data);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        err.message ||
        "Unable to analyze repository quality."
      );
    } finally {
      setLoading(false);
    }
  };

  const getSeverityClass = (severity) => {
    const value = (severity || "low").toLowerCase();

    if (value === "critical") return "severity-critical";
    if (value === "high") return "severity-high";
    if (value === "medium") return "severity-medium";

    return "severity-low";
  };

  const getGradeClass = (grade) => {
    const value = String(grade || "").toLowerCase();

    if (value.includes("a")) return "grade-good";
    if (value.includes("b")) return "grade-average";

    return "grade-needs-work";
  };

  const getScoreClass = (score) => {
    if (score >= 80) return "score-good";
    if (score >= 60) return "score-average";

    return "score-poor";
  };

  const toggleFinding = (index) => {
    setExpandedFinding(
      expandedFinding === index ? null : index
    );
  };

  return (
    <div className="quality-page">

      <div className="quality-header">
        <div>
          <div className="quality-eyebrow">
            <Activity size={15} />
            CODE QUALITY INTELLIGENCE
          </div>

          <h1>Quality Analysis</h1>

          <p>
            Analyze repository quality, detect code issues,
            and discover improvement opportunities.
          </p>
        </div>

        <div className="quality-header-icon">
          <ShieldCheck size={34} />
        </div>
      </div>

      <form className="quality-search-form" onSubmit={handleAnalyze}>
        <div className="quality-input-wrapper">
          <Search size={19} />

          <input
            type="url"
            placeholder="https://github.com/username/repository"
            value={repoUrl}
            onChange={(event) => setRepoUrl(event.target.value)}
            required
          />
        </div>

        <select
          value={maxFiles}
          onChange={(event) => setMaxFiles(event.target.value)}
        >
          <option value="5">5 Files</option>
          <option value="10">10 Files</option>
          <option value="15">15 Files</option>
          <option value="20">20 Files</option>
          <option value="25">25 Files</option>
        </select>

        <button type="submit" disabled={loading}>
          {loading ? (
            <>
              <LoaderCircle className="quality-spinner" size={18} />
              Analyzing...
            </>
          ) : (
            <>
              <Activity size={18} />
              Analyze Quality
            </>
          )}
        </button>
      </form>

      {error && (
        <div className="quality-error">
          <AlertCircle size={19} />
          <span>{error}</span>
        </div>
      )}

      {loading && (
        <div className="quality-loading">
          <LoaderCircle className="quality-spinner" size={35} />
          <h3>Analyzing Repository Quality</h3>
          <p>
            Scanning files and identifying code quality issues.
            This may take a little time.
          </p>
        </div>
      )}

      {!result && !loading && !error && (
        <div className="quality-empty">
          <div className="quality-empty-icon">
            <ShieldCheck size={38} />
          </div>

          <h2>Ready to Analyze Code Quality?</h2>

          <p>
            Enter a public GitHub repository URL above to
            discover quality issues and improvement suggestions.
          </p>
        </div>
      )}

      {result && (
        <>
          <div className="quality-repository-heading">
            <div>
              <span>ANALYSIS RESULT</span>
              <h2>{result.repository}</h2>
              <p>Branch: {result.branch}</p>
            </div>

            <button
              className="quality-refresh-button"
              onClick={handleAnalyze}
              type="button"
              title="Run analysis again"
              disabled={loading}
            >
              <RefreshCw size={17} />
              Re-analyze
            </button>
          </div>

          <div className="quality-overview-grid">

            <div className="quality-score-card">
              <div className="quality-card-label">
                <ShieldCheck size={18} />
                Quality Score
              </div>

              <div
                className={`quality-score-number ${getScoreClass(result.quality_score)}`}
              >
                {result.quality_score}
                <span>/100</span>
              </div>

              <div className="quality-score-track">
                <div
                  className={`quality-score-fill ${getScoreClass(result.quality_score)}`}
                  style={{
                    width: `${Math.max(
                      0,
                      Math.min(100, result.quality_score)
                    )}%`,
                  }}
                />
              </div>

              <span className={`quality-grade ${getGradeClass(result.quality_grade)}`}>
                Grade: {result.quality_grade}
              </span>
            </div>

            <div className="quality-stat-card">
              <div className="quality-stat-icon">
                <FileCode size={21} />
              </div>
              <span>Discovered Files</span>
              <strong>{result.discovered_files}</strong>
            </div>

            <div className="quality-stat-card">
              <div className="quality-stat-icon">
                <CheckCircle2 size={21} />
              </div>
              <span>Analyzed Files</span>
              <strong>{result.analyzed_files}</strong>
            </div>

            <div className="quality-stat-card">
              <div className="quality-stat-icon">
                <AlertCircle size={21} />
              </div>
              <span>Total Findings</span>
              <strong>{result.total_findings}</strong>
            </div>

          </div>

          <div className="quality-section-heading">
            <div>
              <h2>Severity Overview</h2>
              <p>Distribution of detected quality issues</p>
            </div>
          </div>

          <div className="quality-severity-grid">

            <div className="quality-severity-card critical-card">
              <AlertCircle size={21} />
              <span>Critical</span>
              <strong>{result.critical_findings}</strong>
            </div>

            <div className="quality-severity-card high-card">
              <AlertTriangle size={21} />
              <span>High</span>
              <strong>{result.high_findings}</strong>
            </div>

            <div className="quality-severity-card medium-card">
              <Info size={21} />
              <span>Medium</span>
              <strong>{result.medium_findings}</strong>
            </div>

            <div className="quality-severity-card low-card">
              <CheckCircle2 size={21} />
              <span>Low</span>
              <strong>{result.low_findings}</strong>
            </div>

          </div>

          <div className="quality-section-heading">
            <div>
              <h2>Quality Findings</h2>
              <p>
                Detailed issues and recommendations from the analysis
              </p>
            </div>

            <span className="quality-findings-count">
              {result.total_findings} Findings
            </span>
          </div>

          <div className="quality-findings-list">

            {result.findings?.length > 0 ? (
              result.findings.map((finding, index) => (
                <div className="quality-finding" key={index}>

                  <div
                    className="quality-finding-header"
                    onClick={() => toggleFinding(index)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        toggleFinding(index);
                      }
                    }}
                  >
                    <div className="quality-finding-main">
                      <span
                        className={`quality-severity-badge ${getSeverityClass(finding.severity)}`}
                      >
                        {finding.severity}
                      </span>

                      <div>
                        <h3>{finding.issue_type}</h3>
                        <p>{finding.file}</p>
                      </div>
                    </div>

                    <div className="quality-finding-right">
                      <span>Line {finding.line}</span>

                      {expandedFinding === index ? (
                        <ChevronUp size={19} />
                      ) : (
                        <ChevronDown size={19} />
                      )}
                    </div>
                  </div>

                  {expandedFinding === index && (
                    <div className="quality-finding-details">

                      <div>
                        <strong>Issue Description</strong>
                        <p>{finding.message}</p>
                      </div>

                      <div className="quality-recommendation">
                        <strong>
                          <CheckCircle2 size={16} />
                          Recommended Solution
                        </strong>
                        <p>{finding.recommendation}</p>
                      </div>

                    </div>
                  )}

                </div>
              ))
            ) : (
              <div className="quality-no-findings">
                <CheckCircle2 size={30} />
                <h3>No Quality Findings</h3>
                <p>No issues were returned by the quality analyzer.</p>
              </div>
            )}

          </div>

          {result.warnings?.length > 0 && (
            <div className="quality-warnings">
              <h3>
                <AlertTriangle size={19} />
                Analysis Warnings
              </h3>

              {result.warnings.map((warning, index) => (
                <p key={index}>{warning}</p>
              ))}
            </div>
          )}

          <div className="quality-footer-stats">
            <span>
              <FileCode size={16} />
              {result.analyzed_files} analyzed
            </span>

            <span>
              <AlertCircle size={16} />
              {result.skipped_files} skipped
            </span>

            <span>
              <Activity size={16} />
              {result.discovered_files} discovered
            </span>
          </div>
        </>
      )}

    </div>
  );
}

export default QualityDashboard;
