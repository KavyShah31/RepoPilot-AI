
import axios from "axios";

// ==========================================
// 1. AXIOS CONFIGURATION
// ==========================================

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000,
  headers: {
    "Content-Type": "application/json",
  },
});
// ==========================================
// 2. CENTRALIZED ERROR HANDLING
// ==========================================

api.interceptors.response.use(
  (response) => response,

  (error) => {
    let message = "Something went wrong. Please try again.";

    if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
      message = "Request timed out. The analysis is taking too long.";
    } else if (!error.response) {
      message =
        "Cannot connect to RepoPilot backend. Please check whether the backend server is running.";
    } else {
      const status = error.response.status;
      const data = error.response.data;

      if (typeof data?.detail === "string") {
        message = data.detail;
      } else if (Array.isArray(data?.detail)) {
        message = data.detail
          .map((item) => item.msg || "Invalid input")
          .join(", ");
      } else if (typeof data?.message === "string") {
        message = data.message;
      } else if (status === 400) {
        message = "Invalid request. Please check your input.";
      } else if (status === 401 || status === 403) {
        message = "You are not authorized to perform this action.";
      } else if (status === 404) {
        message = "Requested resource or repository was not found.";
      } else if (status >= 500) {
        message = "Backend server error. Please try again later.";
      }
    }

    const formattedError = new Error(message);
    formattedError.status = error.response?.status || null;
    formattedError.data = error.response?.data || null;

    return Promise.reject(formattedError);
  }
);

// ==========================================
// 3. GITHUB REPOSITORY URL VALIDATION
// ==========================================

export const validateRepoUrl = (repoUrl) => {
  if (!repoUrl || typeof repoUrl !== "string") {
    throw new Error("Please enter a GitHub repository URL.");
  }

  const cleanedUrl = repoUrl.trim();

  let parsedUrl;

  try {
    parsedUrl = new URL(cleanedUrl);
  } catch {
    throw new Error("Please enter a valid GitHub repository URL.");
  }

  if (
    parsedUrl.protocol !== "https:" ||
    !["github.com", "www.github.com"].includes(parsedUrl.hostname)
  ) {
    throw new Error("Only HTTPS GitHub repository URLs are supported.");
  }

  const pathParts = parsedUrl.pathname
    .split("/")
    .filter(Boolean);

  if (pathParts.length !== 2) {
    throw new Error(
      "Invalid repository URL. Expected: https://github.com/owner/repository"
    );
  }

  const [owner, repository] = pathParts;
  const cleanRepository = repository.replace(/\.git$/i, "");

  if (
    !/^[a-zA-Z0-9-]+$/.test(owner) ||
    !/^[a-zA-Z0-9._-]+$/.test(cleanRepository) ||
    cleanRepository === "." ||
    cleanRepository === ".."
  ) {
    throw new Error("Invalid GitHub owner or repository name.");
  }

  return `https://github.com/${owner}/${cleanRepository}`;
};

// ==========================================
// 4. REPOSITORY ANALYSIS
// ==========================================

export const analyzeRepository = async (repoUrl) => {
  const response = await api.post(
    "/api/v1/repositories/analyze",
    { repo_url: validateRepoUrl(repoUrl) }
  );

  return response.data;
};

// ==========================================
// 5. CODE INTELLIGENCE
// ==========================================

export const analyzeCode = async (repoUrl, maxFiles = 20) => {
  const response = await api.post(
    "/api/v1/repositories/code-analysis",
    {
      repo_url: validateRepoUrl(repoUrl),
      max_files: maxFiles,
    }
  );

  return response.data;
};

// ==========================================
// 6. CODE QUALITY ANALYSIS
// ==========================================

export const analyzeQuality = async (repoUrl, maxFiles = 15) => {
  const response = await api.post(
    "/api/v1/repositories/quality-analysis",
    {
      repo_url: validateRepoUrl(repoUrl),
      max_files: maxFiles,
    }
  );

  return response.data;
};

// ==========================================
// 7. AI CODE REVIEW
// ==========================================

export const analyzeAIReview = async (repoUrl, maxFiles = 3) => {
  const response = await api.post(
    "/api/v1/repositories/ai-review",
    {
      repo_url: validateRepoUrl(repoUrl),
      max_files: maxFiles,
    }
  );

  return response.data;
};

// ==========================================
// 8. SECURITY ANALYSIS
// ==========================================

export const analyzeSecurity = async (repoUrl, maxFiles = 30) => {
  const response = await api.post(
    "/api/v1/repositories/security-analysis",
    {
      repo_url: validateRepoUrl(repoUrl),
      max_files: maxFiles,
    }
  );

  return response.data;
};

// ==========================================
// 9. ANALYSIS HISTORY
// ==========================================

export const getAnalysisHistory = async () => {
  const response = await api.get("/api/v1/history/");
  return response.data;
};

export const getAnalysisHistoryById = async (id) => {
  const response = await api.get(`/api/v1/history/${id}`);
  return response.data;
};

export const deleteAnalysisHistory = async (id) => {
  const response = await api.delete(`/api/v1/history/${id}`);
  return response.data;
};

export default api;
