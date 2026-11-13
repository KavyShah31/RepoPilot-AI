
import { useCallback, useEffect, useState } from "react";

import {
  Clock3,
  ExternalLink,
  Trash2,
  Eye,
  RefreshCw,
  LoaderCircle,
  Database,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";

import {
  getAnalysisHistory,
  getAnalysisHistoryById,
  deleteAnalysisHistory,
} from "../services/api";

import "./RepositoryHistory.css";

function formatDate(value) {
  if (!value) return "Unknown date";

  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function RepositoryHistory() {
  const [history, setHistory] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getAnalysisHistory();
      setHistory(data.history || []);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Unable to load repository history."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleView = async (id) => {
    setActionLoading(true);
    setError("");

    try {
      const record = await getAnalysisHistoryById(id);
      setSelectedRecord(record);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Unable to open saved analysis."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this analysis?"
    );

    if (!confirmed) return;

    setActionLoading(true);
    setError("");

    try {
      await deleteAnalysisHistory(id);

      setHistory((previous) =>
        previous.filter((item) => item.id !== id)
      );

      if (selectedRecord?.id === id) {
        setSelectedRecord(null);
      }
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Unable to delete history record."
      );
    } finally {
      setActionLoading(false);
    }
  };

  if (selectedRecord) {
    return (
      <section className="history-page">
        <div className="history-header">
          <div>
            <p className="history-eyebrow">SAVED ANALYSIS</p>
            <h2>{selectedRecord.repository}</h2>
            <p>{selectedRecord.analysis_type}</p>
          </div>

          <button
            className="history-secondary-button"
            onClick={() => setSelectedRecord(null)}
          >
            <ArrowLeft size={17} />
            Back to History
          </button>
        </div>

        <div className="history-detail-card">
          <div className="history-detail-meta">
            <span>
              <Clock3 size={15} />
              {formatDate(selectedRecord.created_at)}
            </span>

            <a
              href={selectedRecord.repo_url}
              target="_blank"
              rel="noreferrer"
            >
              GitHub Repository
              <ExternalLink size={14} />
            </a>
          </div>

          <h3>Complete Analysis Result</h3>

          <pre className="history-json">
            {JSON.stringify(selectedRecord.result, null, 2)}
          </pre>
        </div>
      </section>
    );
  }

  return (
    <section className="history-page">
      <div className="history-header">
        <div>
          <p className="history-eyebrow">YOUR WORKSPACE</p>
          <h2>Repository History</h2>
          <p>
            Access and manage your previously saved repository analyses.
          </p>
        </div>

        <button
          className="history-secondary-button"
          onClick={loadHistory}
          disabled={loading}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="history-error">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {loading ? (
        <div className="history-empty">
          <LoaderCircle className="spin" size={32} />
          <p>Loading analysis history...</p>
        </div>
      ) : history.length === 0 ? (
        <div className="history-empty">
          <Database size={42} />
          <h3>No analysis history yet</h3>
          <p>
            Successfully completed repository scans will appear here.
          </p>
        </div>
      ) : (
        <>
          <div className="history-summary">
            <Database size={19} />
            <strong>{history.length}</strong>
            <span>Saved analyses</span>
          </div>

          <div className="history-list">
            {history.map((item) => (
              <article className="history-card" key={item.id}>
                <div className="history-card-main">
                  <div className="history-card-icon">
                    <Clock3 size={21} />
                  </div>

                  <div className="history-card-info">
                    <h3>{item.repository}</h3>

                    <p>{item.repo_url}</p>

                    <div className="history-card-meta">
                      <span className="history-type">
                        {item.analysis_type}
                      </span>

                      <span>
                        {formatDate(item.created_at)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="history-card-actions">
                  <button
                    onClick={() => handleView(item.id)}
                    disabled={actionLoading}
                    title="View saved analysis"
                  >
                    <Eye size={17} />
                    View
                  </button>

                  <button
                    className="history-delete-button"
                    onClick={() => handleDelete(item.id)}
                    disabled={actionLoading}
                    title="Delete history"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

export default RepositoryHistory;
