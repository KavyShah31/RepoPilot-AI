
import "./RepositoryComparison.css";

import { useState } from "react";

import {
  GitCompareArrows,
  Star,
  GitFork,
  CircleAlert,
  Code2,
  Folder,
  LoaderCircle,
  ArrowRight,
  ShieldCheck,
  Activity,
} from "lucide-react";

import api from "../services/api";

// ==========================================
// REUSABLE METRIC COMPONENT
// ==========================================

function Metric({ icon: Icon, label, value1, value2 }) {
  return (
    <div className="comparison-metric">
      <div className="comparison-metric-title">
        <Icon size={18} />
        <span>{label}</span>
      </div>

      <div className="comparison-metric-values">
        <strong>
          {Number(value1 ?? 0).toLocaleString()}
        </strong>

        <ArrowRight size={16} />

        <strong>
          {Number(value2 ?? 0).toLocaleString()}
        </strong>
      </div>
    </div>
  );
}

// ==========================================
// REPOSITORY CARD COMPONENT
// ==========================================

function RepositoryCard({ title, repository }) {
  return (
    <div className="comparison-repo-card">
      <h3>{title}</h3>

      <h2>{repository.full_name}</h2>

      <p>
        {repository.description || "No description available."}
      </p>

      <a
        href={repository.html_url}
        target="_blank"
        rel="noreferrer"
      >
        View on GitHub <ArrowRight size={14} />
      </a>

      <div className="comparison-repo-details">
        <span>
          <Star size={15} />
          {Number(repository.stars ?? 0).toLocaleString()}
        </span>

        <span>
          <GitFork size={15} />
          {Number(repository.forks ?? 0).toLocaleString()}
        </span>

        <span>
          <CircleAlert size={15} />
          {Number(repository.open_issues ?? 0).toLocaleString()}
        </span>
      </div>

      <div className="comparison-repo-language">
        <Code2 size={15} />

        {repository.primary_language || "Not specified"}
      </div>
    </div>
  );
}

// ==========================================
// QUALITY AND SECURITY ANALYSIS COMPONENT
// ==========================================

function AnalysisResult({ title, data }) {
  if (!data) {
    return (
      <div className="comparison-analysis-card">
        <h3>{title}</h3>
        <p>No analysis data available.</p>
      </div>
    );
  }

  return (
    <div className="comparison-analysis-card">
      <h3>{title}</h3>

      {[
        ["Repository 1", data.repository_1],
        ["Repository 2", data.repository_2],
      ].map(([name, analysis]) => (
        <div
          className="comparison-analysis-item"
          key={name}
        >
          <h4>{name}</h4>

          {!analysis ? (
            <p>No analysis data available.</p>
          ) : analysis.status === "failed" ? (
            <p className="comparison-analysis-error">
              Analysis failed: {analysis.error}
            </p>
          ) : (
            <>
              <span className="comparison-analysis-status">
                Analysis successful
              </span>

              <pre>
                {JSON.stringify(
                  analysis.result,
                  null,
                  2
                )}
              </pre>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

// ==========================================
// MAIN REPOSITORY COMPARISON COMPONENT
// ==========================================

export default function RepositoryComparison() {
  const [repoUrl1, setRepoUrl1] = useState(  );

  const [repoUrl2, setRepoUrl2] = useState();

  const [result, setResult] = useState(null);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  // ========================================
  // COMPARE REPOSITORIES
  // ========================================

  const handleCompare = async (event) => {
    event.preventDefault();

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await api.post(
        "/api/v1/repositories/compare",
        {
          repo_url_1: repoUrl1.trim(),
          repo_url_2: repoUrl2.trim(),
        }
      );

      setResult(response.data);

    } catch (err) {
      const detail = err.response?.data?.detail;

      setError(
        typeof detail === "string"
          ? detail
          : detail
            ? JSON.stringify(detail)
            : "Repository comparison failed. Please check the URLs and try again."
      );

    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // EXTRACT RESPONSE DATA
  // ========================================

  const repo1 = result?.repository_1;

  const repo2 = result?.repository_2;

  const comparison = result?.comparison;

  // ========================================
  // DASHBOARD UI
  // ========================================

  return (
    <div className="repository-comparison">

      {/* PAGE HEADER */}

      <div className="comparison-heading">
        <div>
          <h1>Repository Comparison</h1>

          <p>
            Compare two GitHub repositories side by side.
          </p>
        </div>

        <GitCompareArrows size={32} />
      </div>

      {/* INPUT FORM */}

      <form
        className="comparison-form"
        onSubmit={handleCompare}
      >
        <div className="comparison-input-grid">

          <div>
            <label>Repository 1</label>

            <input
              type="url"
              value={repoUrl1}
              onChange={(event) =>
                setRepoUrl1(event.target.value)
              }
              placeholder="https://github.com/owner/repository"
              required
            />
          </div>

          <div>
            <label>Repository 2</label>

            <input
              type="url"
              value={repoUrl2}
              onChange={(event) =>
                setRepoUrl2(event.target.value)
              }
              placeholder="https://github.com/owner/repository"
              required
            />
          </div>

        </div>

        <button
          type="submit"
          disabled={loading}
        >
          {loading ? (
            <>
              <LoaderCircle
                className="comparison-spinner"
                size={18}
              />

              Comparing...
            </>
          ) : (
            <>
              <GitCompareArrows size={18} />

              Compare Repositories
            </>
          )}
        </button>
      </form>

      {/* ERROR MESSAGE */}

      {error && (
        <div className="comparison-error">
          <CircleAlert size={18} />

          {error}
        </div>
      )}

      {/* COMPARISON RESULTS */}

      {repo1 && repo2 && comparison && (
        <div className="comparison-results">

          {/* REPOSITORY CARDS */}

          <div className="comparison-repo-grid">

            <RepositoryCard
              title="Repository 1"
              repository={repo1}
            />

            <RepositoryCard
              title="Repository 2"
              repository={repo2}
            />

          </div>

          {/* REPOSITORY METRICS */}

          <section className="comparison-section">

            <h2>Repository Metrics</h2>

            <div className="comparison-metrics-grid">

              <Metric
                icon={Star}
                label="Stars"
                value1={repo1.stars}
                value2={repo2.stars}
              />

              <Metric
                icon={GitFork}
                label="Forks"
                value1={repo1.forks}
                value2={repo2.forks}
              />

              <Metric
                icon={CircleAlert}
                label="Open Issues"
                value1={repo1.open_issues}
                value2={repo2.open_issues}
              />

              <Metric
                icon={Folder}
                label="Root Items"
                value1={repo1.total_root_items}
                value2={repo2.total_root_items}
              />

            </div>
          </section>

          {/* COMPARISON SUMMARY */}

          <section className="comparison-section">

            <h2>Comparison Summary</h2>

            <div className="comparison-summary">

              <p>
                <strong>More stars:</strong>{" "}
                {comparison.more_stars}
              </p>

              <p>
                <strong>More forks:</strong>{" "}
                {comparison.more_forks}
              </p>

              <p>
                <strong>Stars difference:</strong>{" "}
                {comparison.stars_difference}
              </p>

              <p>
                <strong>Forks difference:</strong>{" "}
                {comparison.forks_difference}
              </p>

              <p>
                <strong>Open issues difference:</strong>{" "}
                {comparison.open_issues_difference}
              </p>

            </div>
          </section>

          {/* QUALITY AND SECURITY ANALYSIS */}

          <section className="comparison-section">

            <h2>Advanced Analysis Comparison</h2>

            <div className="comparison-analysis-grid">

              <AnalysisResult
                title="Code Quality Analysis"
                data={comparison.quality_analysis}
              />

              <AnalysisResult
                title="Security Analysis"
                data={comparison.security_analysis}
              />

            </div>
          </section>

          {/* PROGRAMMING LANGUAGE COMPARISON */}

          <section className="comparison-section">

            <h2>Programming Language Comparison</h2>

            <div className="comparison-language-table">

              <div className="comparison-language-row comparison-language-header">

                <span>Language</span>

                <span>Repository 1</span>

                <span>Repository 2</span>

              </div>

              {Object.entries(
                comparison.language_comparison || {}
              ).map(([language, values]) => (

                <div
                  className="comparison-language-row"
                  key={language}
                >

                  <span>{language}</span>

                  <span>
                    {Number(
                      values.repository_1
                    ).toLocaleString()}
                  </span>

                  <span>
                    {Number(
                      values.repository_2
                    ).toLocaleString()}
                  </span>

                </div>

              ))}

              {Object.keys(
                comparison.language_comparison || {}
              ).length === 0 && (
                <p>
                  No language comparison data available.
                </p>
              )}

            </div>
          </section>

        </div>
      )}

    </div>
  );
}
