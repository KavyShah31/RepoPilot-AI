
import { useState } from "react";

import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  HeartPulse,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

import api from "../services/api";
import "./RepositoryHealth.css";


function ScoreCard({ title, score, icon: Icon, description }) {
  const validScore = score !== null && score !== undefined;

  return (
    <div className="health-score-card">
      <div className="health-card-top">
        <div className="health-card-icon">
          <Icon size={19} />
        </div>
        <span>{title}</span>
      </div>

      <div className="health-card-score">
        {validScore ? `${score}/100` : "N/A"}
      </div>

      <p>{description}</p>
    </div>
  );
}


function TrendValue({ label, value }) {
  if (value === null || value === undefined) {
    return (
      <div className="health-trend-value">
        <span>{label}</span>
        <strong>Not enough data</strong>
      </div>
    );
  }

  const positive = value > 0;
  const neutral = value === 0;

  const Icon = neutral
    ? Activity
    : positive
      ? TrendingUp
      : TrendingDown;

  return (
    <div className="health-trend-value">
      <span>{label}</span>

      <strong
        className={
          neutral
            ? "stable"
            : positive
              ? "improving"
              : "declining"
        }
      >
        <Icon size={16} />

        {value > 0 ? "+" : ""}
        {value} points
      </strong>
    </div>
  );
}


function RepositoryHealth() {
  const [repoUrl, setRepoUrl] = useState("");
  const [health, setHealth] = useState(null);
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Prepare historical chart data
  const chartData = (trends?.timeline || []).map((scan, index) => ({
    scan: `Scan ${index + 1}`,
    date: scan.created_at
      ? new Date(scan.created_at).toLocaleDateString()
      : `Scan ${index + 1}`,
    health: scan.health_score,
    quality: scan.quality_score,
    security: scan.security_score,
  }));


  // Analyze repository
  const analyzeRepository = async (event) => {
    event.preventDefault();

    const trimmedUrl = repoUrl.trim();

    if (
      !/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/.test(trimmedUrl)
    ) {
      setError("Enter a valid public GitHub repository URL.");
      return;
    }

    setLoading(true);
    setError("");
    setHealth(null);
    setTrends(null);

    try {
      const healthResponse = await api.post(
        "/api/v1/repositories/health",
        {
          repo_url: trimmedUrl,
        }
      );

      setHealth(healthResponse.data.health_analysis);

      try {
        const trendResponse = await api.post(
          "/api/v1/repositories/health/trends",
          {
            repo_url: trimmedUrl,
          }
        );

        setTrends(trendResponse.data.trend_analysis);
      } catch (trendError) {
        console.error("Trend request failed:", trendError);
        setTrends(null);
      }

    } catch (requestError) {
      console.error("Repository health request failed:", requestError);

      setError(
        requestError.response?.data?.detail ||
        "Unable to analyze this repository. Please try again."
      );

    } finally {
      setLoading(false);
    }
  };


  // Risk information
  const risk = health?.risk || {};
  const issueSummary = health?.issue_summary || {};

  const riskClass = String(risk.risk_level || "unknown")
    .toLowerCase()
    .replace(/\s+/g, "-");

  const healthClass = String(health?.health_status || "unknown")
    .toLowerCase()
    .replace(/\s+/g, "-");


  return (
    <section className="repository-health-page">

      {/* Repository Search */}
      <form
        className="health-search-form"
        onSubmit={analyzeRepository}
      >
        <div className="health-input-wrapper">
          <Activity size={19} />

          <input
            type="url"
            value={repoUrl}
            onChange={(event) => setRepoUrl(event.target.value)}
            placeholder="https://github.com/username/repository"
            aria-label="GitHub repository URL"
            required
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? (
            <>
              <LoaderCircle
                className="health-spinner"
                size={17}
              />
              Analyzing...
            </>
          ) : (
            <>
              <RefreshCw size={17} />
              Analyze Health
            </>
          )}
        </button>
      </form>


      {/* Error */}
      {error && (
        <div className="health-error">
          <AlertTriangle size={18} />
          {error}
        </div>
      )}


      {/* Loading */}
      {loading && (
        <div className="health-loading">
          <LoaderCircle
            className="health-spinner"
            size={28}
          />

          <p>
            Analyzing repository health and security...
          </p>
        </div>
      )}


      {/* Results */}
      {health && !loading && (
        <>

          {/* Repository Information */}
          <div className="health-result-heading">
            <div>
              <h2>
                {health.repository || "Repository Analysis"}
              </h2>

              <p>
                Repository health analysis completed.
              </p>
            </div>

            <span className={`health-status-badge ${healthClass}`}>
              {health.health_status || "Analysis complete"}
            </span>
          </div>


          {/* Main Scores */}
          <div className="health-overview-grid">

            <div className="health-main-score-card">
              <div className="health-main-score-icon">
                <HeartPulse size={22} />
              </div>

              <span>Overall Health Score</span>

              <div className="health-main-score">
                {health.health_score ?? "N/A"}

                {health.health_score !== null &&
                  health.health_score !== undefined && (
                    <small>/100</small>
                  )}
              </div>

              <div className="health-grade">
                Grade: {health.health_grade || "N/A"}
              </div>
            </div>


            <ScoreCard
              title="Code Quality"
              score={health.quality_score}
              icon={Activity}
              description="Code structure and maintainability"
            />

            <ScoreCard
              title="Security"
              score={health.security_score}
              icon={ShieldCheck}
              description="Security findings and vulnerabilities"
            />

          </div>


          {/* Risk Overview */}
          <div className="health-section-heading">
            <h2>Risk Overview</h2>
          </div>

          <div className="health-risk-grid">

            <div className={`health-risk-card ${riskClass}`}>
              <div className="health-risk-icon">
                <AlertTriangle size={21} />
              </div>

              <div>
                <span>Risk Level</span>
                <strong>{risk.risk_level || "Unknown"}</strong>
              </div>
            </div>


            <div className="health-risk-card">
              <div className="health-risk-icon">
                <Activity size={21} />
              </div>

              <div>
                <span>Risk Score</span>
                <strong>{risk.risk_score ?? "N/A"}/100</strong>
              </div>
            </div>


            <div className="health-risk-card">
              <div className="health-risk-icon">
                <AlertTriangle size={21} />
              </div>

              <div>
                <span>Total Findings</span>
                <strong>{health.total_findings ?? 0}</strong>
              </div>
            </div>

          </div>


          {/* Issue Distribution */}
          <div className="health-section-heading">
            <h2>Issue Distribution</h2>
            <span>{issueSummary.total ?? 0} total issues</span>
          </div>

          <div className="health-issues-grid">

            {["critical", "high", "medium", "low"].map(
              (severity) => (
                <div
                  key={severity}
                  className={`health-issue-card ${severity}`}
                >
                  <span>{severity}</span>

                  <strong>
                    {issueSummary[severity] ?? 0}
                  </strong>
                </div>
              )
            )}

          </div>


          {/* Historical Trends */}
          <div className="health-section-heading">
            <h2>Historical Trends</h2>

            <span>
              {trends?.total_scans ?? 0} saved scans
            </span>
          </div>


          {trends?.latest ? (
            <div className="health-trends-panel">

              <div className="health-trend-status">
                <div>
                  <Clock size={18} />
                  <span>Health trend</span>
                </div>

                <strong>
                  {trends.trend_status}
                </strong>
              </div>


              <div className="health-trend-grid">

                <TrendValue
                  label="Health Change"
                  value={trends.changes?.health_change}
                />

                <TrendValue
                  label="Quality Change"
                  value={trends.changes?.quality_change}
                />

                <TrendValue
                  label="Security Change"
                  value={trends.changes?.security_change}
                />

              </div>


              <div className="health-latest-scan">
                <CheckCircle2 size={17} />

                Latest saved scan: {trends.latest.created_at}
              </div>

            </div>
          ) : (
            <div className="health-no-trends">
              <Clock size={20} />

              <div>
                <strong>
                  No historical trend available
                </strong>

                <p>
                  Run more scans to build a meaningful
                  repository health history.
                </p>
              </div>
            </div>
          )}


          {/* Repository Performance Chart */}
          <div className="health-chart-card">

            <div className="health-section-heading">
              <h3>Repository Performance Trends</h3>

              <p>
                Track health, quality and security
                across previous scans.
              </p>
            </div>


            {chartData.length > 0 ? (
              <ResponsiveContainer
                width="100%"
                height={320}
              >
                <LineChart data={chartData}>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#334155"
                  />

                  <XAxis
                    dataKey="scan"
                    stroke="#94a3b8"
                  />

                  <YAxis
                    domain={[0, 100]}
                    stroke="#94a3b8"
                  />

                  <Tooltip
                    labelFormatter={(label, payload) =>
                      payload?.[0]?.payload?.date || label
                    }
                  />

                  <Legend />

                  <Line
                    type="monotone"
                    dataKey="health"
                    name="Health"
                    stroke="#22c55e"
                    strokeWidth={3}
                    connectNulls
                  />

                  <Line
                    type="monotone"
                    dataKey="quality"
                    name="Quality"
                    stroke="#38bdf8"
                    strokeWidth={2}
                    connectNulls
                  />

                  <Line
                    type="monotone"
                    dataKey="security"
                    name="Security"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    connectNulls
                  />

                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="health-empty">
                Run more repository scans to generate trend charts.
              </p>
            )}

          </div>


          {/* Warnings */}
          {health.warnings?.length > 0 && (
            <div className="health-warnings">

              <h3>
                <AlertTriangle size={18} />
                Analysis Warnings
              </h3>

              <ul>
                {health.warnings.map((warning, index) => (
                  <li key={index}>
                    {typeof warning === "string"
                      ? warning
                      : JSON.stringify(warning)}
                  </li>
                ))}
              </ul>

            </div>
          )}

        </>
      )}

    </section>
  );
}

export default RepositoryHealth;
