import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppStore, FeatureItem } from "../../store/useAppStore";

const FeaturesView = () => {
  const { serverUrl, features, setFeatures, showToast } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const { repoId } = useParams();

  const loadFeatures = async () => {
    setIsLoading(true);
    try {
      const res = await window.api?.getFeatures({ baseUrl: serverUrl });
      if (res?.success && Array.isArray(res.data)) {
        setFeatures(res.data as FeatureItem[]);
      } else {
        showToast(res?.error || "Không thể tải danh sách features.", "error");
      }
    } catch {
      showToast("Lỗi kết nối đến server.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (features.length === 0) loadFeatures();
  }, []);

  const filtered = features.filter(
    (f) =>
      f.name?.toLowerCase().includes(search.toLowerCase()) ||
      f.id?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="page active" style={{ padding: "24px 28px" }}>
      <div className="features-layout">
        <div className="features-toolbar">
          <div className="search-box">
            <svg
              className="search-icon"
              viewBox="0 0 20 20"
              fill="currentColor"
              width="14"
              height="14"
            >
              <path
                fillRule="evenodd"
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                clipRule="evenodd"
              />
            </svg>
            <input
              type="text"
              className="search-input"
              placeholder="Tìm kiếm feature..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            className="btn-secondary"
            onClick={loadFeatures}
            disabled={isLoading}
          >
            {isLoading ? (
              <span
                className="btn-spinner"
                style={{
                  borderColor: "var(--border)",
                  borderTopColor: "var(--blue)",
                }}
              />
            ) : (
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                width="14"
                height="14"
              >
                <path
                  fillRule="evenodd"
                  d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            {isLoading ? "Đang tải..." : "Làm mới"}
          </button>
        </div>

        {isLoading && features.length === 0 ? (
          <div className="card">
            <div className="loading-state">
              <div className="spinner-large" />
              <span>Đang tải danh sách features...</span>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-art">
                <svg viewBox="0 0 64 64" width="48" height="48" fill="none">
                  <rect
                    x="8"
                    y="8"
                    width="48"
                    height="48"
                    rx="8"
                    stroke="var(--border-light)"
                    strokeWidth="2"
                  />
                  <path
                    d="M20 24h24M20 32h16M20 40h20"
                    stroke="var(--border-light)"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <div className="empty-title">
                {features.length === 0
                  ? "Chưa có feature nào"
                  : "Không tìm thấy kết quả"}
              </div>
              <div className="empty-desc">
                {features.length === 0
                  ? "Hãy phân tích repository trước để trích xuất features."
                  : `Không có feature nào khớp với "${search}"`}
              </div>
            </div>
          </div>
        ) : (
          <div className="features-grid">
            {filtered.map((feature) => (
              <div
                key={feature.id}
                className="feature-card"
                onClick={() =>
                  navigate(
                    `/workspace/${repoId}?tab=graph&featureId=${encodeURIComponent(feature.id)}`,
                  )
                }
                style={{ cursor: "pointer" }}
              >
                <div className="feature-card-name">{feature.name}</div>
                <div className="feature-id-text">{feature.id}</div>
                {feature.description && (
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--text-secondary)",
                      marginBottom: 10,
                      lineHeight: 1.5,
                    }}
                  >
                    {feature.description.slice(0, 120)}
                    {feature.description.length > 120 ? "..." : ""}
                  </div>
                )}
                <div className="feature-card-meta">
                  <span className="feature-card-date">
                    {feature.createdAt
                      ? new Date(feature.createdAt).toLocaleDateString("vi-VN")
                      : ""}
                  </span>
                  <div className="feature-card-actions">
                    <button
                      className="btn-chip"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(
                          `/workspace/${repoId}?tab=graph&featureId=${encodeURIComponent(feature.id)}`,
                        );
                      }}
                    >
                      Xem Graph
                    </button>
                    <button
                      className="btn-chip"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/workspace/${repoId}?tab=quizgen`);
                      }}
                    >
                      Tạo câu hỏi
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FeaturesView;
