
import { useMemo, useState } from "react";
import {
  Lightbulb,
  Search,
  LoaderCircle,
  ShieldCheck,
  Activity,
  AlertTriangle,
  CheckCircle2,
  FileCode,
  ChevronDown,
  ExternalLink,
  RefreshCw,
} from "lucide-react";

import api from "../services/api";
import "./Recommendations.css";

const PRIORITIES = ["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"];

function ScoreCard({ icon: Icon, label, value, subtitle, color }) {
  return (
    <div className="recommendation-score-card">
      <div className={`recommendation-score-icon ${color}`}>
        <Icon size={21} />
      </div>

      <div className="recommendation-score-info">
        <p>{label}</p>
        <h3>{value}</h3>
        {subtitle && <span>{subtitle}</span>}
      </div>
    </div>
  );
}

function PriorityCard({ label, count, color, active, onClick }) {
  return (
    <button
      type="button"
      className={`priority-card ${color} ${active ? "selected" : ""}`}
      onClick={onClick}
    >
      <span>{label}</span>
      <strong>{count}</strong>
    </button>
  );
}


function RecommendationItem({ item, index }) {
  const [expanded, setExpanded] = useState(false);

  const priority = String(item.priority || "LOW").toLowerCase();

  return (
    <article className="recommendation-item">
      <div className="recommendation-item-main">
        <div className={`recommendation-priority-icon ${priority}`}>
          {priority === "critical" || priority === "high" ? (
            <AlertTriangle size={19} />
          ) : (
            <Lightbulb size={19} />
          )}
        </div>

        <div className="recommendation-item-content">
          <div className="recommendation-item-heading">
            <h3>{item.title || "Code Improvement"}</h3>
            <span className={`priority-badge ${priority}`}>
              {priority}
            </span>
          </div>

          <p className="recommendation-description">
            {item.description || "No description available."}
          </p>

          <div className="recommendation-meta">
            <span>
              <FileCode size={14} />
              {item.file || "Unknown file"}
            </span>

            {item.line !== null && item.line !== undefined && (
              <span>Line {item.line}</span>
            )}

            <span>{item.category || "General"}</span>
          </div>
        </div>

        <button
          type="button"
          className="recommendation-expand-button"
          onClick={() => setExpanded((previous) => !previous)}
          aria-label={expanded ? "Hide guidance" : "Show guidance"}
        >
          <ChevronDown
            size={19}
            className={expanded ? "rotated" : ""}
          />
        </button>
      </div>

      {expanded && (
        <div className="recommendation-action">
          <div className="guidance-section">
            <h4>Why This Matters</h4>
            <p>{item.why_it_matters || item.description}</p>
          </div>

          <div className="guidance-section">
            <h4>How to Fix</h4>
            <ol>
              {(item.fix_steps || [item.suggested_action]).map(
                (step, stepIndex) => (
                  <li key={stepIndex}>{step}</li>
                )
              )}
            </ol>
          </div>

          <div className="guidance-section">
            <h4>How to Verify</h4>
            <ul>
              {(item.verification_steps || []).map(
                (step, stepIndex) => (
                  <li key={stepIndex}>{step}</li>
                )
              )}
            </ul>
          </div>

          <div className="recommendation-auto-fix">
            <AlertTriangle size={16} />
            Manual fix required — RepoPilot has not modified this code.
          </div>

          <div className="recommendation-action-footer">
            <span>
              Recommendation ID: {item.id || `REC-${index + 1}`}
            </span>
            <span>Source: {item.source || "analysis"}</span>
          </div>
        </div>
      )}
    </article>
  );
}

function Recommendations() {
  const [repoUrl, setRepoUrl] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activePriority, setActivePriority] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const handleAnalyze = async (event) => {
    event.preventDefault();

    const trimmedUrl = repoUrl.trim();

    if (
      !/^https:\/\/github\.com\/[^/]+\/[^/]+\/?$/.test(trimmedUrl)
    ) {
      setError("Please enter a valid public GitHub repository URL.");
      return;
    }

    setLoading(true);
    setError("");
    setAnalysis(null);
    setActivePriority("ALL");

    try {
      const response = await api.post(
        "/api/v1/repositories/recommendations",
        {
          repo_url: trimmedUrl,
        }
      );

      setAnalysis(response.data);
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        "Unable to generate recommendations.";

      setError(
        typeof message === "string"
          ? message
          : JSON.stringify(message)
      );
    } finally {
      setLoading(false);
    }
  };

  const recommendationData = analysis?.recommendation_analysis;
  const recommendations = recommendationData?.recommendations || [];
  const priorityCounts = recommendationData?.priority_counts || {};
  const risk = recommendationData?.risk || {};

  const filteredRecommendations = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();

    return recommendations.filter((item) => {
      const matchesPriority =
        activePriority === "ALL" ||
        String(item.priority).toUpperCase() === activePriority;

      const searchableText = [
        item.title,
        item.description,
        item.file,
        item.category,
        item.suggested_action,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesPriority && searchableText.includes(search);
    });
  }, [recommendations, activePriority, searchTerm]);

  const quality = analysis?.quality_analysis || {};
  const security = analysis?.security_analysis || {};

  const handleReset = () => {
    setAnalysis(null);
    setRepoUrl("");
    setError("");
    setSearchTerm("");
    setActivePriority("ALL");
  };

  return (
    <div className="recommendations-page">
      <section className="recommendations-welcome">
        <div className="recommendations-welcome-icon">
          <Lightbulb size={27} />
        </div>

        <div>
          <h2>AI-Powered Recommendations</h2>
          <p>
            Discover code quality problems, security risks and
            actionable improvements in your GitHub repository.
          </p>
        </div>
      </section>

      <form
        className="recommendations-search-form"
        onSubmit={handleAnalyze}
      >
        <div className="recommendations-input-wrapper">
          <Search size={19} />
          <input
            type="url"
            value={repoUrl}
            onChange={(event) => setRepoUrl(event.target.value)}
            placeholder="https://github.com/username/repository"
            aria-label="GitHub repository URL"
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? (
            <>
              <LoaderCircle className="spin" size={18} />
              Analyzing...
            </>
          ) : (
            <>
              <Lightbulb size={18} />
              Generate Recommendations
            </>
          )}
        </button>
      </form>

      {error && (
        <div className="recommendations-error">
          <AlertTriangle size={19} />
          {error}
        </div>
      )}

      {loading && (
        <div className="recommendations-loading">
          <LoaderCircle className="spin" size={34} />
          <h3>Analyzing repository...</h3>
          <p>
            Running quality and security checks and preparing
            recommendations.
          </p>
        </div>
      )}

      {!analysis && !loading && (
        <div className="recommendations-empty">
          <div className="recommendations-empty-icon">
            <Lightbulb size={42} />
          </div>
          <h3>Your recommendations will appear here</h3>
          <p>
            Enter a public GitHub repository URL to discover
            improvements and potential risks.
          </p>
        </div>
      )}

      {analysis && (
        <>
          <div className="recommendations-result-header">
            <div>
              <span className="recommendations-eyebrow">
                ANALYSIS COMPLETED
              </span>
              <h2>Repository Recommendations</h2>
              <p>{analysis.repository_url}</p>
            </div>

            <button
              type="button"
              className="recommendations-reset-button"
              onClick={handleReset}
            >
              <RefreshCw size={16} />
              New Analysis
            </button>
          </div>

          <section className="recommendations-score-grid">
            <ScoreCard
              icon={Activity}
              label="Repository Risk"
              value={`${risk.risk_score ?? 0}/100`}
              subtitle={risk.risk_level || "Not available"}
              color="purple"
            />

            <ScoreCard
              icon={ShieldCheck}
              label="Security Score"
              value={
                security.security_score !== undefined
                  ? `${security.security_score}/100`
                  : "N/A"
              }
              subtitle={security.security_grade || "Security analysis"}
              color="green"
            />

            <ScoreCard
              icon={CheckCircle2}
              label="Quality Score"
              value={
                quality.quality_score !== undefined
                  ? `${quality.quality_score}/100`
                  : "N/A"
              }
              subtitle={quality.quality_grade || "Quality analysis"}
              color="blue"
            />

            <ScoreCard
              icon={Lightbulb}
              label="Total Recommendations"
              value={recommendationData?.total_recommendations ?? 0}
              subtitle={recommendationData?.overall_status || "Analysis"}
              color="orange"
            />
          </section>

          <section className="recommendations-priority-section">
            <div className="recommendations-section-heading">
              <div>
                <h2>Priority Overview</h2>
                <p>Issues grouped by severity</p>
              </div>
            </div>

            <div className="priority-grid">
              <PriorityCard
                label="Critical"
                count={priorityCounts.critical || 0}
                color="critical"
                active={activePriority === "CRITICAL"}
                onClick={() => setActivePriority(
                  activePriority === "CRITICAL" ? "ALL" : "CRITICAL"
                )}
              />

              <PriorityCard
                label="High"
                count={priorityCounts.high || 0}
                color="high"
                active={activePriority === "HIGH"}
                onClick={() => setActivePriority(
                  activePriority === "HIGH" ? "ALL" : "HIGH"
                )}
              />

              <PriorityCard
                label="Medium"
                count={priorityCounts.medium || 0}
                color="medium"
                active={activePriority === "MEDIUM"}
                onClick={() => setActivePriority(
                  activePriority === "MEDIUM" ? "ALL" : "MEDIUM"
                )}
              />

              <PriorityCard
                label="Low"
                count={priorityCounts.low || 0}
                color="low"
                active={activePriority === "LOW"}
                onClick={() => setActivePriority(
                  activePriority === "LOW" ? "ALL" : "LOW"
                )}
              />
            </div>
          </section>

          <section className="recommendations-list-section">
            <div className="recommendations-list-heading">
              <div>
                <h2>Recommended Improvements</h2>
                <p>
                  {filteredRecommendations.length} of{" "}
                  {recommendations.length} recommendations
                </p>
              </div>

              <button
                type="button"
                className={`recommendations-filter-button ${
                  activePriority !== "ALL" ? "filter-active" : ""
                }`}
                onClick={() => setActivePriority("ALL")}
              >
                {activePriority === "ALL" ? "All priorities" : `Clear ${activePriority} filter`}
                <ChevronDown size={16} />
              </button>
            </div>

            <div className="recommendations-search-filter">
              <Search size={17} />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search recommendations..."
              />
            </div>

            <div className="recommendations-list">
              {filteredRecommendations.length > 0 ? (
                filteredRecommendations.map((item, index) => (
                  <RecommendationItem
                    key={item.id || `${item.file}-${item.line}-${index}`}
                    item={item}
                    index={index}
                  />
                ))
              ) : (
                <div className="recommendations-no-results">
                  <CheckCircle2 size={25} />
                  <h3>No recommendations found</h3>
                  <p>
                    Try another priority filter or search term.
                  </p>
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default Recommendations;
