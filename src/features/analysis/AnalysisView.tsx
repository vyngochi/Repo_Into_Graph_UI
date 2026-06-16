import React, { useState, useEffect } from "react";
import { useAppStore } from "../../store/useAppStore";

const AnalysisView = () => {
  const {
    serverUrl,
    selectedRepoPath,
    analysisResult,
    isAnalyzing,
    showToast,
    setAnalysisResult,
    setIsAnalyzing,
  } = useAppStore();
  const [outputDir, setOutputDir] = useState("");

  const handleAnalyze = async () => {
    if (!selectedRepoPath) {
      showToast("Chưa có repository được chọn.", "error");
      return;
    }
    setIsAnalyzing(true);
    setAnalysisResult(null);
    try {
      const res = await window.api?.analyze({
        baseUrl: serverUrl,
        repositoryPath: selectedRepoPath,
        outputDir: outputDir || null,
      });
      if (res?.success && res.data) {
        const data = res.data as Record<string, unknown>;
        setAnalysisResult({
          callEdges: data.callEdges as number,
          methods: data.methods as number,
          repositoryPath: selectedRepoPath,
          status: "Completed",
          message: data.message as string,
        });
        showToast("Phân tích hoàn tất!", "success");
      } else {
        showToast(res?.error || "Phân tích thất bại.", "error");
      }
    } catch {
      showToast("Lỗi kết nối đến server.", "error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSelectFolder = async () => {
    const folder = await window.dialog?.selectFolder();
    if (folder) setOutputDir(folder);
  };

  return (
    <div className="page active" style={{ padding: "24px 28px" }}>
      <div className="analyze-layout">
        {/* Left — Form */}
        <div className="card analyze-form-card">
          <div className="card-header">
            <div className="card-icon cyan">
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                width="16"
                height="16"
              >
                <path
                  fillRule="evenodd"
                  d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="card-title">Phân tích Repository</div>
          </div>
          <p className="card-desc">
            Phân tích cấu trúc code và tạo dependency graph từ repository.
          </p>

          <div className="form-group">
            <label className="form-label">Repository đang chọn</label>
            <input
              type="text"
              className="form-input mono"
              value={selectedRepoPath || ""}
              readOnly
              placeholder="Chưa chọn repository nào"
              style={{
                background: "var(--bg-base)",
                color: selectedRepoPath
                  ? "var(--text-primary)"
                  : "var(--text-muted)",
              }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Thư mục output <span className="optional">(tùy chọn)</span>
            </label>
            <div className="input-with-btn">
              <input
                type="text"
                className="form-input mono"
                value={outputDir}
                onChange={(e) => setOutputDir(e.target.value)}
                placeholder="Mặc định: thư mục gốc của backend"
              />
              <button
                className="btn-icon"
                onClick={handleSelectFolder}
                title="Chọn thư mục"
              >
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  width="16"
                  height="16"
                >
                  <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                </svg>
              </button>
            </div>
          </div>

          <button
            className="btn-primary btn-lg"
            onClick={handleAnalyze}
            disabled={isAnalyzing || !selectedRepoPath}
          >
            {isAnalyzing ? (
              <span className="btn-spinner" />
            ) : (
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                width="16"
                height="16"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            {isAnalyzing ? "Đang phân tích..." : "Chạy phân tích"}
          </button>
        </div>

        {/* Right — Results */}
        <div className="analyze-result-panel">
          {isAnalyzing && (
            <div className="card">
              <div className="loading-state">
                <div className="spinner-large" />
                <span>Đang phân tích codebase...</span>
              </div>
            </div>
          )}

          {!isAnalyzing && !analysisResult && (
            <div className="card">
              <div className="empty-state">
                <div className="empty-art">
                  <svg viewBox="0 0 80 80" width="64" height="64" fill="none">
                    <circle
                      cx="20"
                      cy="20"
                      r="8"
                      stroke="var(--blue)"
                      strokeWidth="2"
                      opacity="0.4"
                    />
                    <circle
                      cx="60"
                      cy="20"
                      r="8"
                      stroke="var(--cyan)"
                      strokeWidth="2"
                      opacity="0.4"
                    />
                    <circle
                      cx="40"
                      cy="60"
                      r="8"
                      stroke="var(--violet)"
                      strokeWidth="2"
                      opacity="0.4"
                    />
                    <line
                      x1="20"
                      y1="20"
                      x2="60"
                      y2="20"
                      stroke="var(--border-light)"
                      strokeWidth="1.5"
                    />
                    <line
                      x1="20"
                      y1="20"
                      x2="40"
                      y2="60"
                      stroke="var(--border-light)"
                      strokeWidth="1.5"
                    />
                    <line
                      x1="60"
                      y1="20"
                      x2="40"
                      y2="60"
                      stroke="var(--border-light)"
                      strokeWidth="1.5"
                    />
                  </svg>
                </div>
                <div className="empty-title">Chưa có kết quả phân tích</div>
                <div className="empty-desc">
                  Nhấn <strong>Chạy phân tích</strong> để bắt đầu quét
                  dependency graph của repository.
                </div>
              </div>
            </div>
          )}

          {analysisResult && (
            <>
              <div className="stats-row">
                <div className="card-flat stat-card">
                  <div className="stat-icon cyan">
                    <svg
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      width="20"
                      height="20"
                    >
                      <path d="M13 7H7v6h6V7z" />
                      <path
                        fillRule="evenodd"
                        d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="stat-value">
                      {analysisResult.callEdges ?? "—"}
                    </div>
                    <div className="stat-label">Call Edges</div>
                  </div>
                </div>
                <div className="card-flat stat-card">
                  <div className="stat-icon blue">
                    <svg
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      width="20"
                      height="20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="stat-value">
                      {analysisResult.methods ?? "—"}
                    </div>
                    <div className="stat-label">Methods</div>
                  </div>
                </div>
                <div className="card-flat stat-card">
                  <div className="stat-icon green">
                    <svg
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      width="20"
                      height="20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="stat-value" style={{ fontSize: 16 }}>
                      {analysisResult.status || "—"}
                    </div>
                    <div className="stat-label">Trạng thái</div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-title" style={{ marginBottom: 12 }}>
                  Chi tiết phân tích
                </div>
                <div className="result-body">
                  <div className="result-row">
                    <span className="result-row-label">Repository</span>
                    <span className="result-row-value">
                      {analysisResult.repositoryPath}
                    </span>
                  </div>
                  {analysisResult.message && (
                    <div className="result-row">
                      <span className="result-row-label">Thông báo</span>
                      <span className="result-row-value">
                        {analysisResult.message}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalysisView;
