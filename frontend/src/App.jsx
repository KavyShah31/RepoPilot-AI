
import { useMemo, useState } from "react";

import {
  GitBranch,
  Star,
  GitFork,
  CircleAlert,
  Code2,
  Folder,
  FileCode,
  ExternalLink,
  Search,
  RefreshCw,
  LoaderCircle,
  Activity,
  ChevronRight,
  File,
  BarChart3,
  ShieldCheck,
  Clock3,
} from "lucide-react";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";

import { analyzeRepository } from "./services/api";

import CodeIntelligence from "./components/CodeIntelligence";
import QualityDashboard from "./components/QualityDashboard";
import AIReview from "./components/AIReview";
import SecurityDashboard from "./components/SecurityDashboard";
import RepositoryHistory from "./components/RepositoryHistory";

import "./App.css";

const CHART_COLORS = [
  "#8b5cf6",
  "#06b6d4",
  "#22c55e",
  "#f59e0b",
  "#ec4899",
  "#3b82f6",
  "#f97316",
];

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-IN");
}

function getFileIcon(file) {
  if (file.type === "dir") return <Folder size={16} />;
  if (file.type === "file") return <FileCode size={16} />;

  return <File size={16} />;
}

function formatBytes(bytes) {
  const size = Number(bytes || 0);

  if (size === 0) return "—";
  if (size < 1024) return `${size} B`;

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${color}`}>
        {icon}
      </div>

      <div>
        <p>{label}</p>
        <h3>{value}</h3>
      </div>

      <ChevronRight className="stat-arrow" size={17} />
    </div>
  );
}

function App() {
  const [activePage, setActivePage] = useState("dashboard");

  const [repoUrl, setRepoUrl] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // REPOSITORY ANALYSIS
  const handleAnalyze = async (event) => {
    event.preventDefault();

    if (!repoUrl.trim()) {
      setError("Please enter a GitHub repository URL.");
      return;
    }

    if (
      !/^https:\/\/github\.com\/[^/]+\/[^/]+\/?$/.test(
        repoUrl.trim()
      )
    ) {
      setError("Enter a valid GitHub repository URL.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const data = await analyzeRepository(repoUrl.trim());
      setResult(data);
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        "Unable to analyze repository.";

      setError(
        typeof message === "string"
          ? message
          : JSON.stringify(message)
      );
    } finally {
      setLoading(false);
    }
  };

  // LANGUAGE DISTRIBUTION
  const languageData = useMemo(() => {
    if (!result?.languages) return [];

    const entries = Object.entries(result.languages)
      .filter(([, value]) => Number(value) > 0)
      .sort((a, b) => Number(b[1]) - Number(a[1]));

    return entries.map(([name, value], index) => ({
      name,
      value: Number(value),
      color: CHART_COLORS[index % CHART_COLORS.length],
    }));
  }, [result]);

  // FILE SEARCH
  const filteredFiles = useMemo(() => {
    const files = result?.files || [];
    const search = searchTerm.toLowerCase().trim();

    if (!search) return files;

    return files.filter((file) =>
      `${file.name} ${file.path} ${file.type}`
        .toLowerCase()
        .includes(search)
    );
  }, [result, searchTerm]);

  const totalLanguageBytes = languageData.reduce(
    (total, language) => total + language.value,
    0
  );

  // PAGE TITLES
  const pageTitles = {
    dashboard: "Repository Intelligence",
    repositories: "Repositories",
    code: "Code Intelligence",
    quality: "Code Quality",
    review: "AI Code Review",
    security: "Security Analysis",
    history: "Repository History",
  };

  const activeTitle =
    pageTitles[activePage] || "Repository Intelligence";

  return (
    <div className="app-layout">

      {/* SIDEBAR */}
      <aside className="sidebar">

        {/* BRAND */}
        <div className="brand">
          <div className="brand-icon">
            <GitBranch size={24} />
          </div>

          <div>
            <h2>RepoPilot</h2>
            <span>AI CODE INTELLIGENCE</span>
          </div>
        </div>

        {/* NAVIGATION */}
        <div className="sidebar-section">
          <p className="sidebar-label">WORKSPACE</p>

          <button
            className={`nav-item ${
              activePage === "dashboard" ? "active" : ""
            }`}
            onClick={() => setActivePage("dashboard")}
          >
            <BarChart3 size={18} />
            <span>Dashboard</span>
          </button>

          <button
            className={`nav-item ${
              activePage === "repositories" ? "active" : ""
            }`}
            onClick={() => setActivePage("repositories")}
          >
            <GitBranch size={18} />
            <span>Repositories</span>
          </button>

          <button
            className={`nav-item ${
              activePage === "code" ? "active" : ""
            }`}
            onClick={() => setActivePage("code")}
          >
            <Code2 size={18} />
            <span>Code Intelligence</span>
          </button>

          <button
            className={`nav-item ${
              activePage === "quality" ? "active" : ""
            }`}
            onClick={() => setActivePage("quality")}
          >
            <Activity size={18} />
            <span>Code Quality</span>
          </button>

          <button
            className={`nav-item ${
              activePage === "review" ? "active" : ""
            }`}
            onClick={() => setActivePage("review")}
          >
            <CircleAlert size={18} />
            <span>AI Code Review</span>
          </button>

          {/* NEW: SECURITY ANALYSIS */}
          <button
            className={`nav-item ${
              activePage === "security" ? "active" : ""
            }`}
            onClick={() => setActivePage("security")}
          >
            <ShieldCheck size={18} />
            <span>Security Analysis</span>
          </button>
          <button
            className={`nav-item ${
              activePage === "history" ? "active" : ""
            }`}
            onClick={() => setActivePage("history")}
          >
            <Clock3 size={18} />
            <span>Repository History</span>
          </button>

        </div>

        {/* SIDEBAR BOTTOM */}
        <div className="sidebar-bottom">
          <div className="sidebar-status">
            <span className="status-dot" />
            API Connected
          </div>

          <p>RepoPilot AI v1.0</p>
        </div>

      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">

        {/* TOPBAR */}
        <header className="topbar">
          <div>
            <p className="breadcrumb">
              Workspace / {activeTitle}
            </p>

            <h1>{activeTitle}</h1>
          </div>

          <div className="topbar-right">
            <span className="connection-label">
              <span className="status-dot" />
              System Online
            </span>

            <div className="profile-avatar">
              RP
            </div>
          </div>
        </header>

        {activePage === "code" ? (
          <CodeIntelligence />
        ) : activePage === "quality" ? (
          <QualityDashboard />
        ) : activePage === "review" ? (
          <AIReview />
        ) : activePage === "security" ? (
          <SecurityDashboard />
        ) : activePage === "history" ? (
          <RepositoryHistory />
        ) : (
          <>
            {/* WELCOME SECTION */}
            <section className="welcome-section">
              <div>
                <h2>Analyze your GitHub repository</h2>

                <p>
                  Get instant insights into repository structure,
                  programming languages and project statistics.
                </p>
              </div>
            </section>

            {/* REPOSITORY INPUT */}
            <form
              className="analyze-form"
              onSubmit={handleAnalyze}
            >
              <div className="repo-input-wrapper">
                <GitBranch size={21} />

                <input
                  type="url"
                  value={repoUrl}
                  onChange={(event) =>
                    setRepoUrl(event.target.value)
                  }
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
                    <Search size={18} />
                    Analyze Repository
                  </>
                )}
              </button>
            </form>

            {/* ERROR MESSAGE */}
            {error && (
              <div className="error-message">
                <CircleAlert size={19} />
                <span>{error}</span>
              </div>
            )}

            {/* LOADING */}
            {loading && (
              <div className="loading-panel">
                <LoaderCircle
                  className="spin loading-icon"
                  size={35}
                />

                <h3>Analyzing repository...</h3>

                <p>
                  Fetching repository information and file structure.
                </p>
              </div>
            )}

            {/* EMPTY STATE */}
            {!result && !loading && (
              <div className="empty-state">
                <div className="empty-icon">
                  <GitBranch size={42} />
                </div>

                <h3>
                  Your repository insights will appear here
                </h3>

                <p>
                  Enter a public GitHub repository URL above to get started.
                </p>
              </div>
            )}

            {/* REPOSITORY RESULTS */}
            {result && (
              <>
                {/* REPOSITORY HEADING */}
                <section className="repository-heading">
                  <div className="repository-title">
                    <div className="repository-icon">
                      <GitBranch size={25} />
                    </div>

                    <div>
                      <p className="eyebrow">
                        ANALYZED REPOSITORY
                      </p>

                      <h2>
                        {result.full_name || "GitHub Repository"}
                      </h2>

                      <p className="repository-description">
                        {result.description ||
                          "No description available."}
                      </p>
                    </div>
                  </div>

                  {result.html_url && (
                    <a
                      href={result.html_url}
                      target="_blank"
                      rel="noreferrer"
                      className="github-link"
                    >
                      View on GitHub
                      <ExternalLink size={16} />
                    </a>
                  )}
                </section>

                {/* STATISTICS */}
                <section className="stats-grid">
                  <StatCard
                    icon={<Star size={21} />}
                    label="Stars"
                    value={formatNumber(result.stars)}
                    color="purple"
                  />

                  <StatCard
                    icon={<GitFork size={21} />}
                    label="Forks"
                    value={formatNumber(result.forks)}
                    color="blue"
                  />

                  <StatCard
                    icon={<CircleAlert size={21} />}
                    label="Open Issues"
                    value={formatNumber(result.open_issues)}
                    color="orange"
                  />

                  <StatCard
                    icon={<Folder size={21} />}
                    label="Root Items"
                    value={formatNumber(result.total_root_items)}
                    color="green"
                  />
                </section>

                {/* DASHBOARD GRID */}
                <section className="dashboard-grid">
                  {/* LANGUAGE DISTRIBUTION */}
                  <div className="dashboard-card language-card">
                    <div className="card-heading">
                      <div>
                        <h3>Language Distribution</h3>
                        <p>Programming languages detected</p>
                      </div>

                      <Code2 size={20} />
                    </div>

                    {languageData.length > 0 ? (
                      <div className="language-content">
                        <div className="chart-container">
                          <ResponsiveContainer
                            width="100%"
                            height={220}
                          >
                            <PieChart>
                              <Pie
                                data={languageData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                innerRadius={62}
                                outerRadius={88}
                                paddingAngle={3}
                              >
                                {languageData.map((item) => (
                                  <Cell
                                    key={item.name}
                                    fill={item.color}
                                  />
                                ))}
                              </Pie>

                              <Tooltip
                                formatter={(value) => [
                                  totalLanguageBytes
                                    ? `${(
                                        (value / totalLanguageBytes) *
                                        100
                                      ).toFixed(1)}%`
                                    : "0%",
                                  "Share",
                                ]}
                                contentStyle={{
                                  background: "#171b2b",
                                  border: "1px solid #343b52",
                                  borderRadius: "10px",
                                  color: "#fff",
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>

                          <div className="chart-center">
                            <strong>{languageData.length}</strong>
                            <span>Languages</span>
                          </div>
                        </div>

                        <div className="language-legend">
                          {languageData.map((language) => (
                            <div
                              className="legend-row"
                              key={language.name}
                            >
                              <div className="legend-name">
                                <span
                                  className="legend-dot"
                                  style={{
                                    background: language.color,
                                  }}
                                />
                                {language.name}
                              </div>

                              <strong>
                                {totalLanguageBytes
                                  ? (
                                      (language.value /
                                        totalLanguageBytes) *
                                      100
                                    ).toFixed(1)
                                  : "0.0"}
                                %
                              </strong>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="no-data">
                        No language statistics available.
                      </div>
                    )}
                  </div>

                  {/* REPOSITORY DETAILS */}
                  <div className="dashboard-card details-card">
                    <div className="card-heading">
                      <div>
                        <h3>Repository Details</h3>
                        <p>Repository information</p>
                      </div>

                      <Activity size={20} />
                    </div>

                    <div className="detail-row">
                      <span>Full Name</span>
                      <strong>{result.full_name || "N/A"}</strong>
                    </div>

                    <div className="detail-row">
                      <span>Primary Language</span>
                      <strong>
                        {result.primary_language || "N/A"}
                      </strong>
                    </div>

                    <div className="detail-row">
                      <span>Default Branch</span>
                      <strong>{result.default_branch || "N/A"}</strong>
                    </div>

                    <div className="detail-row">
                      <span>Total Root Items</span>
                      <strong>
                        {formatNumber(result.total_root_items)}
                      </strong>
                    </div>

                    <div className="detail-row">
                      <span>Repository URL</span>

                      {result.html_url ? (
                        <a
                          href={result.html_url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open <ExternalLink size={13} />
                        </a>
                      ) : (
                        <strong>N/A</strong>
                      )}
                    </div>
                  </div>
                </section>

                {/* FILE EXPLORER */}
                <section className="dashboard-card files-card">
                  <div className="files-header">
                    <div className="card-heading">
                      <div>
                        <h3>Repository Explorer</h3>

                        <p>
                          {filteredFiles.length} of{" "}
                          {(result.files || []).length} items displayed
                        </p>
                      </div>

                      <Folder size={20} />
                    </div>

                    <div className="file-search">
                      <Search size={16} />

                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(event) =>
                          setSearchTerm(event.target.value)
                        }
                        placeholder="Search files..."
                      />
                    </div>
                  </div>

                  <div className="file-table-wrapper">
                    <table className="file-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Path</th>
                          <th>Type</th>
                          <th>Size</th>
                          <th>GitHub</th>
                        </tr>
                      </thead>

                      <tbody>
                        {filteredFiles.map((file, index) => (
                          <tr key={`${file.path}-${index}`}>
                            <td>
                              <div className="file-name">
                                {getFileIcon(file)}
                                {file.name}
                              </div>
                            </td>

                            <td className="file-path">
                              {file.path}
                            </td>

                            <td>
                              <span className="file-type">
                                {file.type || "Unknown"}
                              </span>
                            </td>

                            <td>{formatBytes(file.size)}</td>

                            <td>
                              {file.html_url ? (
                                <a
                                  href={file.html_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="file-link"
                                  aria-label={`Open ${file.name} on GitHub`}
                                >
                                  <ExternalLink size={15} />
                                </a>
                              ) : (
                                "—"
                              )}
                            </td>
                          </tr>
                        ))}

                        {filteredFiles.length === 0 && (
                          <tr>
                            <td colSpan="5" className="empty-table">
                              No matching files found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* RESULT FOOTER */}
                <div className="result-footer">
                  <span>
                    <span className="status-dot" />
                    Analysis response received successfully
                  </span>

                  <button
                    className="refresh-button"
                    onClick={() => {
                      setResult(null);
                      setSearchTerm("");
                      setError("");
                    }}
                  >
                    <RefreshCw size={15} />
                    New Analysis
                  </button>
                </div>
              </>
            )}
          </>
        )}

      </main>
    </div>
  );
}

export default App;
