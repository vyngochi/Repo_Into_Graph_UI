import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import SigmaCanvas from "./SigmaCanvas";
import CodeViewer from "./CodeViewer";
import { useAppStore } from "../../store/useAppStore";

type ActiveTab = "graph" | "coreflow";
type ActiveView = "canvas" | "code";

const GraphScreen = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const urlFeatureId = searchParams.get("featureId");

  const [activeTab, setActiveTab] = useState<ActiveTab>(
    urlFeatureId ? "coreflow" : "graph",
  );

  useEffect(() => {
    if (urlFeatureId) {
      setActiveTab("coreflow");
    }
  }, [urlFeatureId]);

  const tabStyle = (tab: ActiveTab) => ({
    padding: "8px 16px",
    fontSize: 13,
    fontWeight: 600 as const,
    fontFamily: "var(--font-main)",
    background: activeTab === tab ? "var(--blue)" : "none",
    border: "none",
    color: activeTab === tab ? "#ffffff" : "var(--text-secondary)",
    borderRadius: "20px",
    cursor: "pointer" as const,
    transition: "all 0.2s ease",
  });

  return (
    <div
      id="page-graph"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        position: "relative",
      }}
    >
      {/* Floating Glassmorphism Tab bar */}
      <div
        style={{
          position: "absolute",
          top: "12px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 100,
          display: "flex",
          gap: "4px",
          background: "rgba(255, 255, 255, 0.75)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          padding: "4px",
          borderRadius: "24px",
          border: "1px solid rgba(255, 255, 255, 0.4)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08)",
        }}
      >
        <button style={tabStyle("graph")} onClick={() => setActiveTab("graph")}>
          Interactive Graph
        </button>
        <button
          style={tabStyle("coreflow")}
          onClick={() => setActiveTab("coreflow")}
        >
          Core Flow
        </button>
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          height: "100%",
        }}
      >
        {activeTab === "graph" && <SigmaCanvas />}
        {activeTab === "coreflow" && (
          <CoreFlowTab initialFeatureId={urlFeatureId || ""} />
        )}
      </div>
    </div>
  );
};

// ── Core Flow Tab ─────────────────────────────────────────────────────────────

const CoreFlowTab = ({
  initialFeatureId = "",
}: {
  initialFeatureId?: string;
}) => {
  const { serverUrl, showToast } = useAppStore();
  const [featureId, setFeatureId] = useState(initialFeatureId);
  const [isLoading, setIsLoading] = useState(false);
  const [codeFlow, setCodeFlow] = useState<any>(null);

  const handleLoad = async (fid = featureId) => {
    if (!fid.trim()) {
      showToast("Vui lòng nhập Feature ID.", "error");
      return;
    }
    setIsLoading(true);
    setCodeFlow(null);
    try {
      const res = await window.api?.getCodeFlow({
        baseUrl: serverUrl,
        id: fid.trim(),
      });
      if (res?.success) {
        setCodeFlow(res.data);
      } else {
        showToast(res?.error || "Không thể tải Code Flow.", "error");
      }
    } catch {
      showToast("Lỗi kết nối.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialFeatureId) {
      setFeatureId(initialFeatureId);
      handleLoad(initialFeatureId);
    }
  }, [initialFeatureId]);

  // Defensive extraction of methods array
  const rawMethods = codeFlow?.methods || codeFlow?.Methods || [];
  const methods = Array.isArray(rawMethods) ? rawMethods : [];

  return (
    <div
      className="page active"
      style={{ padding: "72px 28px 24px 28px", overflowY: "auto" }}
    >
      <div
        className="codeflow-layout"
        style={{
          display: "grid",
          gridTemplateColumns: "320px 1fr",
          gap: "24px",
          alignItems: "start",
        }}
      >
        {/* Left Search panel */}
        <div
          className="card codeflow-search-panel"
          style={{
            background: "rgba(255, 255, 255, 0.65)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(255, 255, 255, 0.4)",
          }}
        >
          <div className="card-header">
            <div className="card-icon blue">
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                width="16"
                height="16"
              >
                <path
                  fillRule="evenodd"
                  d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="card-title">Core Flow</div>
          </div>
          <p className="card-desc">Nhập Feature ID để xem luồng gọi hàm.</p>
          <div className="form-group">
            <label className="form-label">Feature ID</label>
            <input
              type="text"
              className="form-input mono"
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              value={featureId}
              onChange={(e) => setFeatureId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLoad()}
            />
          </div>
          <button
            className="btn-primary btn-lg"
            onClick={() => handleLoad()}
            disabled={isLoading}
            style={{ width: "100%" }}
          >
            {isLoading ? <span className="btn-spinner" /> : null}
            {isLoading ? "Đang tải..." : "Xem Code Flow"}
          </button>
        </div>

        {/* Right timeline result */}
        <div
          className="codeflow-result"
          style={{ display: "flex", flexDirection: "column" }}
        >
          {!codeFlow && !isLoading && (
            <div
              className="card"
              style={{
                background: "rgba(255, 255, 255, 0.65)",
                backdropFilter: "blur(16px)",
                border: "1px solid rgba(255, 255, 255, 0.4)",
              }}
            >
              <div className="empty-state">
                <div className="empty-title">Nhập Feature ID để bắt đầu</div>
                <div className="empty-desc">
                  Code Flow sẽ hiển thị thứ tự gọi hàm trong feature được chọn.
                </div>
              </div>
            </div>
          )}
          {isLoading && (
            <div
              className="card"
              style={{
                background: "rgba(255, 255, 255, 0.65)",
                backdropFilter: "blur(16px)",
                border: "1px solid rgba(255, 255, 255, 0.4)",
              }}
            >
              <div className="loading-state">
                <div className="spinner-large" />
                <span>Đang tải Code Flow...</span>
              </div>
            </div>
          )}

          {codeFlow && methods.length === 0 && (
            <div
              className="card"
              style={{
                background: "rgba(255, 255, 255, 0.65)",
                backdropFilter: "blur(16px)",
                border: "1px solid rgba(255, 255, 255, 0.4)",
              }}
            >
              <div className="empty-state">
                <div className="empty-title">Không tìm thấy method calls</div>
                <div className="empty-desc">
                  Feature này không chứa thông tin code flow hoặc chưa được phân
                  tích đúng.
                </div>
              </div>
            </div>
          )}

          {codeFlow && methods.length > 0 && (
            <div
              style={{
                position: "relative",
                paddingLeft: "40px",
                borderLeft: "2px solid rgba(99, 102, 241, 0.25)",
                marginLeft: "20px",
                marginTop: "8px",
              }}
            >
              {methods.map((method: any, i: number) => {
                const className =
                  method.className || method.ClassName || "UnknownClass";
                const methodName =
                  method.methodName || method.MethodName || "UnknownMethod";
                const sourceCode = method.sourceCode || method.SourceCode || "";
                return (
                  <div
                    key={i}
                    style={{ position: "relative", marginBottom: "24px" }}
                  >
                    {/* Circle Node */}
                    <div
                      style={{
                        position: "absolute",
                        left: "-47px",
                        top: "20px",
                        width: "12px",
                        height: "12px",
                        borderRadius: "50%",
                        background: "var(--blue)",
                        border: "2px solid #ffffff",
                        boxShadow: "0 0 0 4px rgba(99, 102, 241, 0.15)",
                        zIndex: 2,
                      }}
                    />
                    {/* Number Badge */}
                    <div
                      style={{
                        position: "absolute",
                        left: "-84px",
                        top: "14px",
                        width: "24px",
                        height: "24px",
                        borderRadius: "50%",
                        background: "var(--bg-elevated)",
                        border: "1px solid var(--border)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "11px",
                        fontWeight: "700",
                        color: "var(--blue)",
                        zIndex: 2,
                      }}
                    >
                      {i + 1}
                    </div>

                    <MethodCard
                      className={className}
                      methodName={methodName}
                      sourceCode={sourceCode}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const MethodCard = ({
  className,
  methodName,
  sourceCode,
}: {
  className: string;
  methodName: string;
  sourceCode: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div
      className={`method-card${isOpen ? " open" : ""}`}
      style={{
        background: "rgba(255, 255, 255, 0.7)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255, 255, 255, 0.4)",
        borderRadius: "var(--radius)",
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.02)",
        overflow: "hidden",
        transition: "all 0.2s ease",
      }}
    >
      <div
        className="method-card-header"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: "14px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
          background: isOpen ? "rgba(99, 102, 241, 0.05)" : "none",
          transition: "background 0.2s",
        }}
      >
        <div
          className="method-card-title"
          style={{ fontFamily: "var(--font-mono)", fontSize: "13px" }}
        >
          <span
            className="method-class"
            style={{ color: "var(--text-secondary)" }}
          >
            {className}
          </span>
          <span style={{ color: "var(--text-muted)", margin: "0 2px" }}>.</span>
          <span
            className="method-name"
            style={{ color: "var(--blue-light)", fontWeight: 600 }}
          >
            {methodName}
          </span>
        </div>
        <svg
          className="method-card-chevron"
          viewBox="0 0 20 20"
          fill="currentColor"
          width="16"
          height="16"
          style={{
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
            color: "var(--text-muted)",
          }}
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      {isOpen && (
        <div
          className="method-card-body"
          style={{
            borderTop: "1px solid var(--border)",
            background: "rgba(255, 255, 255, 0.3)",
          }}
        >
          <pre
            className="method-source"
            style={{
              padding: "16px 20px",
              margin: 0,
              fontSize: "12px",
              fontFamily: "var(--font-mono)",
              overflowX: "auto",
              color: "var(--text-primary)",
              whiteSpace: "pre-wrap",
            }}
          >
            {sourceCode || "// Không có source code"}
          </pre>
        </div>
      )}
    </div>
  );
};

export default GraphScreen;
