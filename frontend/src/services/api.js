
import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
  timeout: 120000,
  headers: {
    "Content-Type": "application/json",
  },
});

export const analyzeRepository = async (repoUrl) => {
  const response = await api.post(
    "/api/v1/repositories/analyze",
    { repo_url: repoUrl }
  );

  return response.data;
};

export const analyzeCode = async (repoUrl, maxFiles = 20) => {
  const response = await api.post(
    "/api/v1/repositories/code-analysis",
    {
      repo_url: repoUrl,
      max_files: maxFiles,
    }
  );

  return response.data;
};

export const analyzeQuality = async (repoUrl, maxFiles = 15) => {
  const response = await api.post(
    "/api/v1/repositories/quality-analysis",
    {
      repo_url: repoUrl,
      max_files: maxFiles,
    }
  );

  return response.data;
};

export const analyzeAIReview = async (repoUrl, maxFiles = 3) => {
  const response = await api.post(
    "/api/v1/repositories/ai-review",
    {
      repo_url: repoUrl,
      max_files: maxFiles,
    }
  );

  return response.data;
};

export const analyzeSecurity = async (repoUrl, maxFiles = 30) => {
  const response = await api.post(
    "/api/v1/repositories/security-analysis",
    {
      repo_url: repoUrl,
      max_files: maxFiles,
    }
  );

  return response.data;
};


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
