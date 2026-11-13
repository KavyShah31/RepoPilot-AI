
import { useState } from "react";

import {
  ShieldCheck,
  ShieldAlert,
  Shield,
  Search,
  LoaderCircle,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  FileCode,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ExternalLink,
  LockKeyhole,
} from "lucide-react";

import { analyzeSecurity } from "../services/api";
import "./SecurityDashboard.css";


function SecurityStat({ icon, label, value, severity }) {
  return (
    <div className={`security-stat ${severity || ""}`}>
      <div className="security-stat-icon">
        {icon}
      </div>

      <div>
        <p>{label}</p>
        <h3>{value ?? 0}</h3>
      </div>
    </div>
  );
}


function SeverityBadge({ severity }) {
  return (
    <span className={`severity-badge ${severity}`}>
      {severity}
    </span>
  );
}


function SecurityDashboard() {
  const [repoUrl, setRepoUrl] = useState("");
  const [maxFiles, setMaxFiles] = useState(30);

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedFinding, setExpandedFinding] = useState(null);
  const [severityFilter, setSeverityFilter] = useState("all");

  const handleScan = async (event) => {
    event.preventDefault();

    const cleanUrl = repoUrl.trim();

    if (!/^https:\/\/github\.com\/[^/]+\/[^/]+(?:\.git)?\/?$/.test(cleanUrl)) {
      setError("Enter a valid public GitHub repository URL.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setExpandedFinding(null);

    try {
      const data = await analyzeSecurity(cleanUrl, Number(maxFiles));
      setResult(data);
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        "Security scan failed.";

      setError(
        typeof message === "string"
          ? message
          : JSON.stringify(message)
      );
    } finally {
      setLoading(false);
    }
  };

  const findings = result?.findings || [];

  const filteredFindings =
    severityFilter === "all"
      ? findings
      : findings.filter(
          (finding) => finding.severity === severityFilter
        );

  const getScoreClass = (score) => {
    if (score >= 80) return "good";
    if (score >= 60) return "warning";
    return "danger";
  };

  const getSeverityIcon = (severity) => {
    if (severity === "critical") {
      return <AlertTriangle size={19} />;
    }

    if (severity === "high") {
      return <ShieldAlert size={19} />;
    }

    if (severity === "medium") {
      return <AlertCircle size={19} />;
    }

    return <Shield size={19} />;
  };

  return (
    <div className="security-page">

      {/* HEADER */}

      <section className="security-welcome">
        <div className="security-welcome-icon">
          <ShieldCheck size={30} />
        </div>

        <div>
          <h2>Repository Security Analysis</h2>
          <p>
            Scan source code for potentially unsafe patterns,
            exposed credentials, and common security risks.
          </p>
        </div>
      </section>

      {/* REPOSITORY INPUT */}

      <form className="security-scan-form" onSubmit={handleScan}>
        <div className="security-input-group">
          <GitHubIcon />

          <input
            type="url"
            value={repoUrl}
            onChange={(event) => setRepoUrl(event.target.value)}
            placeholder="https://github.com/username/repository"
            aria-label="GitHub repository URL"
          />
        </div>

        <select
          value={maxFiles}
          onChange={(event) => setMaxFiles(event.target.value)}
          aria-label="Maximum files to scan"
        >
          <option value={10}>10 files</option>
          <option value={20}>20 files</option>
          <option value={30}>30 files</option>
          <option value={40}>40 files</option>
          <option value={50}>50 files</option>
        </select>

        <button type="submit" disabled={loading}>
          {loading ? (
            <>
              <LoaderCircle className="security-spin" size={18} />
              Scanning...
            </>
          ) : (
            <>
              <Search size={18} />
              Scan Repository
            </>
          )}
        </button>
      </form>

      {/* ERROR */}

      {error && (
        <div className="security-error">
          <AlertCircle size={19} />
          <span>{error}</span>
        </div>
      )}

      {/* LOADING */}

      {loading && (
        <div className="security-loading">
          <LoaderCircle className="security-spin" size={38} />
          <h3>Scanning repository security...</h3>
          <p>
            Checking supported source files for potentially unsafe patterns.
          </p>
        </div>
      )}

      {/* EMPTY STATE */}

      {!result && !loading && (
        <div className="security-empty">
          <div className="security-empty-icon">
            <LockKeyhole size={38} />
          </div>

          <h3>Ready to inspect your repository</h3>

          <p>
            Enter a public GitHub repository URL to start a security scan.
          </p>
        </div>
      )}

      {/* RESULTS */}

      {result && (
        <>
          {/* REPOSITORY INFORMATION */}

          <section className="security-repository">
            <div>
              <span className="security-eyebrow">
                SECURITY SCAN RESULTS
              </span>

              <h2>{result.repository}</h2>

              <p>
                Branch: <strong>{result.branch}</strong>
              </p>
            </div>

            <div className="security-repo-icon">
              <ShieldCheck size={26} />
            </div>
          </section>

          {/* SCORE AND FILE COUNTS */}

          <section className="security-overview-grid">

            <div className={`security-score-card ${getScoreClass(result.security_score)}`}>
              <div className="security-score-heading">
                <ShieldCheck size={21} />
                <span>Security Score</span>
              </div>

              <div className="security-score-value">
                {result.security_score}
                <span>/100</span>
              </div>

              <div className="security-score-track">
                <div
                  className="security-score-progress"
                  style={{
                    width: `${Math.max(0, Math.min(100, result.security_score))}%`,
                  }}
                />
              </div>

              <p>
                Security Grade: <strong>{result.security_grade}</strong>
              </p>
            </div>

            <div className="security-file-stats">
              <div>
                <span>Discovered Files</span>
                <strong>{result.discovered_files}</strong>
              </div>

              <div>
                <span>Scanned Files</span>
                <strong>{result.scanned_files}</strong>
              </div>

              <div>
                <span>Skipped Files</span>
                <strong>{result.skipped_files}</strong>
              </div>

              <div>
                <span>Total Findings</span>
                <strong>{result.total_findings}</strong>
              </div>
            </div>
          </section>

          {/* SEVERITY CARDS */}

          <section className="security-severity-grid">
            <SecurityStat
              icon={<AlertTriangle size={21} />}
              label="Critical"
              value={result.critical_findings}
              severity="critical"
            />

            <SecurityStat
              icon={<ShieldAlert size={21} />}
              label="High"
              value={result.high_findings}
              severity="high"
            />

            <SecurityStat
              icon={<AlertCircle size={21} />}
              label="Medium"
              value={result.medium_findings}
              severity="medium"
            />

            <SecurityStat
              icon={<CheckCircle2 size={21} />}
              label="Low"
              value={result.low_findings}
              severity="low"
            />
          </section>

          {/* FINDINGS */}

          <section className="security-findings-card">
            <div className="security-findings-header">
              <div>
                <h3>Security Findings</h3>
                <p>
                  {filteredFindings.length} findings displayed
                </p>
              </div>

              <select
                value={severityFilter}
                onChange={(event) => setSeverityFilter(event.target.value)}
                aria-label="Filter findings by severity"
              >
                <option value="all">All severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            {filteredFindings.length > 0 ? (
              <div className="security-findings-list">
                {filteredFindings.map((finding, index) => {
                  const findingId = `${finding.file}-${finding.line}-${index}`;
                  const isExpanded = expandedFinding === findingId;

                  return (
                    <div
                      className={`security-finding ${finding.severity}`}
                      key={findingId}
                    >
                      <button
                        type="button"
                        className="security-finding-toggle"
                        onClick={() =>
                          setExpandedFinding(
                            isExpanded ? null : findingId
                          )
                        }
                      >
                        <div className="security-finding-main">
                          <div className={`finding-icon ${finding.severity}`}>
                            {getSeverityIcon(finding.severity)}
                          </div>

                          <div className="security-finding-title">
                            <h4>{finding.issue_type}</h4>

                            <p>
                              <FileCode size={14} />
                              {finding.file}
                              <span>Line {finding.line}</span>
                            </p>
                          </div>
                        </div>

                        <div className="security-finding-actions">
                          <SeverityBadge severity={finding.severity} />

                          {isExpanded ? (
                            <ChevronUp size={19} />
                          ) : (
                            <ChevronDown size={19} />
                          )}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="security-finding-details">
                          <div>
                            <h5>Issue Description</h5>
                            <p>{finding.message}</p>
                          </div>

                          <div className="security-recommendation">
                            <h5>Recommended Fix</h5>
                            <p>{finding.recommendation}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="security-no-findings">
                <CheckCircle2 size={30} />
                <h4>No findings in this filter</h4>
                <p>
                  {findings.length === 0
                    ? "No suspicious patterns were detected in the scanned files."
                    : "Try selecting another severity filter."}
                </p>
              </div>
            )}
          </section>

          {/* WARNINGS */}

          {result.warnings?.length > 0 && (
            <section className="security-warnings">
              <h3>
                <AlertTriangle size={18} />
                Scan Warnings
              </h3>

              {result.warnings.map((warning, index) => (
                <p key={index}>{warning}</p>
              ))}
            </section>
          )}

          {/* DISCLAIMER */}

          <div className="security-disclaimer">
            <Shield size={18} />
            <p>
              This is a static pattern-based scan. Findings are potential
              risks and require manual verification. A clean scan does not
              guarantee that a repository is secure.
            </p>
          </div>

          {/* FOOTER */}

          <div className="security-footer">
            <span>
              <CheckCircle2 size={16} />
              Scan response received
            </span>

            {result.repository && (
              <a
                href={`https://github.com/${result.repository}`}
                target="_blank"
                rel="noreferrer"
              >
                Open Repository
                <ExternalLink size={14} />
              </a>
            )}

            <button
              type="button"
              onClick={() => {
                setResult(null);
                setError("");
                setSeverityFilter("all");
                setExpandedFinding(null);
              }}
            >
              <RefreshCw size={15} />
              New Scan
            </button>
          </div>
        </>
      )}
    </div>
  );
}


function GitHubIcon() {
  return <ShieldCheck size={20} />;
}


export default SecurityDashboard;
