import { MagnifyingGlass, Database } from "@phosphor-icons/react";
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppStore, BusinessFlow } from "../../store/useAppStore";

const BusinessFlowView = () => {
  const { serverUrl, businessFlows, setBusinessFlows, showToast } =
    useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [analysisRuns, setAnalysisRuns] = useState<any[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string>("");
  const navigate = useNavigate();
  const { repoId } = useParams();

  const fetchAnalysisRuns = async () => {
    try {
      const res = await window.api?.getAnalysisRuns({ baseUrl: serverUrl });
      if (res?.success && res.data) {
        const data = res.data;
        let items: any[] = [];
        if (Array.isArray(data)) items = data;
        else if (data && Array.isArray((data as any).items))
          items = (data as any).items;

        setAnalysisRuns(items);
        if (items.length > 0) {
          setSelectedRunId(items[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAnalysisRuns();
  }, [serverUrl]);

  const loadFlows = async () => {
    if (!selectedRunId) return;
    setIsLoading(true);
    try {
      const res = await window.api?.getBusinessFlows({
        baseUrl: serverUrl,
        analysisRunId: selectedRunId,
      });
      if (res?.success && Array.isArray(res.data)) {
        setBusinessFlows(res.data as BusinessFlow[]);
      } else {
        showToast(
          res?.error || "Không thể tải danh sách business flows.",
          "error",
        );
      }
    } catch {
      showToast("Lỗi kết nối đến server.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFlows();
  }, [serverUrl, selectedRunId]);

  const filtered = businessFlows.filter(
    (f) =>
      f.businessName?.toLowerCase().includes(search.toLowerCase()) ||
      f.id?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="page active" style={{ padding: "24px 28px" }}>
      <div className="features-layout">
        <div className="features-toolbar">
          <div className="search-box">
            <MagnifyingGlass className="search-icon" size={16} weight="bold" />
            <input
              type="text"
              className="search-input"
              placeholder="Tìm kiếm business flow..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span
              style={{
                fontSize: "14px",
                fontWeight: 500,
                color: "var(--text-secondary)",
              }}
            >
              Analysis Run:
            </span>
            <select
              className="form-select"
              value={selectedRunId}
              onChange={(e) => setSelectedRunId(e.target.value)}
              style={{
                width: "240px",
                padding: "6px 12px",
                borderRadius: "6px",
                border: "1px solid var(--border)",
                background: "var(--bg-elevated)",
                color: "var(--text-primary)",
              }}
            >
              {analysisRuns.map((r: any) => (
                <option key={r.id} value={r.id}>
                  {new Date(r.createdAt).toLocaleString()} - {r.repoName}
                </option>
              ))}
            </select>
          </div>
          <button
            className="btn-secondary"
            onClick={loadFlows}
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

        {isLoading && businessFlows.length === 0 ? (
          <div className="card">
            <div className="loading-state">
              <div className="spinner-large" />
              <span>Đang tải danh sách business flows...</span>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-art">
                <Database size={48} weight="duotone" color="var(--border-light)" />
              </div>
              <div className="empty-title">
                {businessFlows.length === 0
                  ? "Chưa có business flow nào"
                  : "Không tìm thấy kết quả"}
              </div>
              <div className="empty-desc">
                {businessFlows.length === 0
                  ? "Hãy phân tích repository trước để trích xuất business flows."
                  : `Không có business flow nào khớp với "${search}"`}
              </div>
            </div>
          </div>
        ) : (
          <div className="features-grid">
            {filtered.map((feature) => (
              <div
                key={feature.id}
                className="feature-card"
                style={{ cursor: "pointer" }}
              >
                <div className="feature-card-name">{feature.businessName}</div>
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

export default BusinessFlowView;
