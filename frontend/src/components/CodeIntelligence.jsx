
import { useState } from "react";
import {
  Code2,
  FileCode,
  Layers,
  Package,
  Search,
  LoaderCircle,
  AlertCircle,
  ChevronDown,
  Braces,
  GitBranch,
} from "lucide-react";

import { analyzeCode } from "../services/api";
import "./CodeIntelligence.css";

function SummaryCard({ icon: Icon, label, value }) {
  return (
    <div className="ci-summary-card">
      <div className="ci-summary-icon">
        <Icon size={21} />
      </div>
      <div>
        <p>{label}</p>
        <h2>{value ?? 0}</h2>
      </div>
    </div>
  );
}

function FileAnalysis({ file }) {
  return (
    <details className="ci-file-card">
      <summary className="ci-file-header">
        <div className="ci-file-name">
          <FileCode size={19} />
          <div>
            <strong>{file.path}</strong>
            <span>
              {file.line_count} lines · {file.function_count} functions ·{" "}
              {file.class_count} classes
            </span>
          </div>
        </div>
        <ChevronDown size={19} />
      </summary>

      <div className="ci-file-content">
        {file.parse_error && (
          <div className="ci-warning">
            <AlertCircle size={17} />
            <span>Parsing error: {file.parse_error}</span>
          </div>
        )}

        <section className="ci-detail-section">
          <h4><Braces size={17} /> Functions</h4>

          {file.functions?.length ? (
            file.functions.map((fn, index) => (
              <div className="ci-detail-item" key={`${fn.qualified_name}-${index}`}>
                <strong>{fn.qualified_name}</strong>
                <span>
                  Lines {fn.line}–{fn.end_line}
                  {fn.is_async ? " · Async" : ""}
                </span>
                <p>
                  Parameters: {fn.parameters?.join(", ") || "None"}
                </p>
              </div>
            ))
          ) : (
            <p className="ci-empty-text">No functions found.</p>
          )}
        </section>

        <section className="ci-detail-section">
          <h4><Layers size={17} /> Classes</h4>

          {file.classes?.length ? (
            file.classes.map((cls, index) => (
              <div className="ci-detail-item" key={`${cls.qualified_name}-${index}`}>
                <strong>{cls.qualified_name}</strong>
                <span>Lines {cls.line}–{cls.end_line}</span>
                <p>Bases: {cls.bases?.join(", ") || "None"}</p>
                <p>Methods: {cls.methods?.join(", ") || "None"}</p>
              </div>
            ))
          ) : (
            <p className="ci-empty-text">No classes found.</p>
          )}
        </section>

        <section className="ci-detail-section">
          <h4><Package size={17} /> Imports</h4>

          {file.imports?.length ? (
            file.imports.map((item, index) => (
              <div className="ci-detail-item" key={`${item.line}-${index}`}>
                <strong>{item.module || "Relative import"}</strong>
                <span>Line {item.line} · Level {item.level}</span>
                <p>
                  Names:{" "}
                  {item.names?.map((name) =>
                    typeof name === "string" ? name : name.name || JSON.stringify(name)
                  ).join(", ") || "None"}
                </p>
              </div>
            ))
          ) : (
            <p className="ci-empty-text">No imports found.</p>
          )}
        </section>
      </div>
    </details>
  );
}

export default function CodeIntelligence() {
  const [repoUrl, setRepoUrl] = useState("");
  const [maxFiles, setMaxFiles] = useState(15);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAnalyze = async (event) => {
    event.preventDefault();

    if (!repoUrl.trim()) {
      setError("Please enter a GitHub repository URL.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const data = await analyzeCode(repoUrl.trim(), Number(maxFiles));
      setResult(data);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        err.message ||
        "Code analysis failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ci-container">
      <div className="ci-heading">
        <div>
          <span className="ci-eyebrow">REPOSITORY INTELLIGENCE</span>
          <h1>Code Intelligence</h1>
          <p>Explore the internal structure of a GitHub Python codebase.</p>
        </div>
        <div className="ci-heading-icon">
          <Code2 size={27} />
        </div>
      </div>

      <form className="ci-search-panel" onSubmit={handleAnalyze}>
        <label htmlFor="ci-repo-url">GitHub Repository URL</label>

        <div className="ci-search-row">
          <div className="ci-input-wrapper">
            <GitBranch size={19} />
            <input
              id="ci-repo-url"
              type="url"
              placeholder="https://github.com/username/repository"
              value={repoUrl}
              onChange={(event) => setRepoUrl(event.target.value)}
            />
          </div>

          <select
            value={maxFiles}
            onChange={(event) => setMaxFiles(event.target.value)}
            aria-label="Maximum files to analyze"
          >
            <option value={5}>5 files</option>
            <option value={10}>10 files</option>
            <option value={15}>15 files</option>
            <option value={20}>20 files</option>
            <option value={25}>25 files</option>
          </select>

          <button type="submit" disabled={loading}>
            {loading ? (
              <>
                <LoaderCircle className="ci-spinner" size={18} />
                Analyzing...
              </>
            ) : (
              <>
                <Search size={18} />
                Analyze Code
              </>
            )}
          </button>
        </div>

        <p className="ci-hint">
          Analyze up to 25 Python files from a public GitHub repository.
        </p>
      </form>

      {error && (
        <div className="ci-error">
          <AlertCircle size={19} />
          <span>{typeof error === "string" ? error : JSON.stringify(error)}</span>
        </div>
      )}

      {loading && (
        <div className="ci-loading">
          <LoaderCircle className="ci-spinner" size={30} />
          <h3>Analyzing repository code...</h3>
          <p>Discovering Python files and extracting code structure.</p>
        </div>
      )}

      {!result && !loading && !error && (
        <div className="ci-empty-state">
          <Code2 size={42} />
          <h3>Ready to explore your codebase?</h3>
          <p>Enter a public GitHub repository URL above to begin.</p>
        </div>
      )}

      {result && (
        <div className="ci-results">
          <div className="ci-repository-info">
            <div>
              <span>ANALYZED REPOSITORY</span>
              <h2>{result.repository}</h2>
              <p>Default branch: {result.default_branch}</p>
            </div>
            <span className="ci-status">Analysis complete</span>
          </div>

          {result.warning && (
            <div className="ci-warning">
              <AlertCircle size={18} />
              {result.warning}
            </div>
          )}

          <div className="ci-summary-grid">
            <SummaryCard
              icon={FileCode}
              label="Discovered Python Files"
              value={result.discovered_python_files}
            />
            <SummaryCard
              icon={Code2}
              label="Analyzed Files"
              value={result.analyzed_files}
            />
            <SummaryCard
              icon={Braces}
              label="Total Functions"
              value={result.total_functions}
            />
            <SummaryCard
              icon={Layers}
              label="Total Classes"
              value={result.total_classes}
            />
            <SummaryCard
              icon={Package}
              label="Total Imports"
              value={result.total_imports}
            />
            <SummaryCard
              icon={AlertCircle}
              label="Skipped Files"
              value={result.skipped_files}
            />
          </div>

          <div className="ci-files-heading">
            <div>
              <h2>Python File Explorer</h2>
              <p>Expand a file to inspect its functions, classes and imports.</p>
            </div>
            <span>{result.files?.length || 0} files</span>
          </div>

          <div className="ci-files-list">
            {result.files?.length ? (
              result.files.map((file, index) => (
                <FileAnalysis key={`${file.path}-${index}`} file={file} />
              ))
            ) : (
              <div className="ci-no-files">
                No Python file analysis data was returned.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
