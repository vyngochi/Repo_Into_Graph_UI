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
  const { serverUrl, showToast, selectedRepoPath } = useAppStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [codeFlow, setCodeFlow] = useState<any>(null);

  const handleLoad = async () => {
    if (!selectedRepoPath?.trim()) {
      showToast("Không có thư mục được chọn trong Workspace.", "error");
      return;
    }
    setIsLoading(true);
    setCodeFlow(null);
    try {
      const result = await window.graphApi?.scanLocal(selectedRepoPath.trim());
      if (result?.success) {
        const nodes = result.nodes || [];
        const edges = result.edges || [];

        const mappedFiles = nodes.map((node: any) => {
          const path = node.id;
          const imports = edges.filter((e: any) => e.source === path).map((e: any) => e.target);
          const importedBy = edges.filter((e: any) => e.target === path).map((e: any) => e.source);
          return {
            path,
            imports,
            importedBy,
            sourceCode: node.attributes?.sourceCode || ""
          };
        });
        setCodeFlow({ files: mappedFiles, edgesCount: edges.length });
      } else {
        showToast(result?.error || "Không thể tải Core Flow.", "error");
      }
    } catch {
      showToast("Lỗi kết nối.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedRepoPath) {
      handleLoad();
    }
  }, [selectedRepoPath]);

  // Defensive extraction of files array
  const rawFiles = codeFlow?.files || codeFlow?.Files || codeFlow?.methods || codeFlow?.Methods || [];
  let files = Array.isArray(rawFiles) ? rawFiles : [];
  const totalEdges = codeFlow?.edgesCount || 0;

  if (searchQuery.trim()) {
    files = files.filter((f: any) => f.path?.toLowerCase().includes(searchQuery.toLowerCase()));
  }

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
            <div className="card-icon" style={{ background: "rgba(99, 102, 241, 0.1)", color: "var(--blue)", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "8px", fontWeight: 700, fontSize: "16px" }}>
              /
            </div>
            <div className="card-title">Core Flow</div>
          </div>
          <p className="card-desc">Xem danh sách các file dự án và sự phụ thuộc giữa các file.</p>
          <div className="form-group">
            <label className="form-label" style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: "8px", display: "block" }}>Tìm kiếm file</label>
            <input
              type="text"
              className="form-input"
              placeholder="Tìm theo tên file..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ marginTop: "16px" }}>
            <label className="form-label" style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: "8px", display: "block" }}>Định dạng file</label>
            <select className="form-input" style={{ width: "100%", appearance: "none", background: "var(--bg-elevated) url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23666%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E') no-repeat right 12px center", paddingRight: "32px" }}>
              <option>Tất cả định dạng</option>
            </select>
          </div>
          <div style={{ display: "flex", gap: "16px", margin: "24px 0" }}>
            <div style={{ flex: 1, background: "var(--bg-elevated)", borderRadius: "var(--radius)", padding: "16px", textAlign: "center", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--blue)" }}>{codeFlow ? codeFlow.files?.length : 0}</div>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", marginTop: "4px" }}>Tổng files</div>
            </div>
            <div style={{ flex: 1, background: "var(--bg-elevated)", borderRadius: "var(--radius)", padding: "16px", textAlign: "center", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--blue)" }}>{totalEdges}</div>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", marginTop: "4px" }}>Phụ thuộc</div>
            </div>
          </div>
          <button
            className="btn-primary btn-lg"
            onClick={() => handleLoad()}
            disabled={isLoading}
            style={{ width: "100%" }}
          >
            {isLoading ? <span className="btn-spinner" /> : null}
            {isLoading ? "Đang tải..." : "Quét lại thư mục"}
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
                <div className="empty-title">Mở một Workspace để bắt đầu</div>
                <div className="empty-desc">
                  Core Flow sẽ tự động phân tích và hiển thị cấu trúc các file dự án.
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
                <span>Đang tải Core Flow...</span>
              </div>
            </div>
          )}

          {codeFlow && files.length === 0 && (
            <div
              className="card"
              style={{
                background: "rgba(255, 255, 255, 0.65)",
                backdropFilter: "blur(16px)",
                border: "1px solid rgba(255, 255, 255, 0.4)",
              }}
            >
              <div className="empty-state">
                <div className="empty-title">Không tìm thấy thông tin cấu trúc file</div>
                <div className="empty-desc">
                  Thư mục này không chứa thông tin file và sự phụ thuộc hoặc chưa được phân
                  tích đúng.
                </div>
              </div>
            </div>
          )}

          {codeFlow && files.length > 0 && (
            <div
              style={{
                position: "relative",
                paddingLeft: "40px",
                borderLeft: "2px solid rgba(99, 102, 241, 0.25)",
                marginLeft: "20px",
                marginTop: "8px",
              }}
            >
              {files.map((file: any, i: number) => {
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

                    <FileDependencyCard file={file} selectedRepoPath={selectedRepoPath} />
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

const FileDependencyCard = ({
  file,
  selectedRepoPath
}: {
  file: any;
  selectedRepoPath: string | null;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [sourceCode, setSourceCode] = useState<string>("");
  const [isLoadingCode, setIsLoadingCode] = useState(false);

  // Extract data with fallbacks
  const filePath = file.path || file.Path || file.className || "Unknown/File.cs";
  const fileName = filePath.split("/").pop() || filePath;
  const dirPath = filePath.substring(0, filePath.lastIndexOf("/"));

  // Use explicit mock data if real data is missing, to match the UI image
  const imports = file.imports || file.Imports || [];
  const importedBy = file.importedBy || file.ImportedBy || [];

  useEffect(() => {
    if (isOpen && !sourceCode && !isLoadingCode && selectedRepoPath) {
      const absPath =
        selectedRepoPath.replace(/[\\/]$/, "") +
        "\\" +
        filePath.replace(/\//g, "\\");

      setIsLoadingCode(true);
      window.graphApi
        ?.readFile(absPath)
        .then((res) => {
          if (res?.success && res.content) {
            setSourceCode(res.content);
          } else {
            setSourceCode("// Lỗi đọc file: " + (res?.error || "Không có nội dung"));
          }
        })
        .catch((err) => {
          setSourceCode("// Lỗi: " + err);
        })
        .finally(() => {
          setIsLoadingCode(false);
        });
    }
  }, [isOpen, sourceCode, isLoadingCode, filePath, selectedRepoPath]);

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
          style={{ fontSize: "13px" }}
        >
          <span style={{ color: "var(--text-secondary)" }}>
            {dirPath ? dirPath + " / " : ""}
          </span>
          <span style={{ color: "var(--blue-light)", fontWeight: 600 }}>
            {fileName}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "var(--text-muted)" }}>
          <span>{imports.length} imports &middot; {importedBy.length} imported by</span>
          <svg
            className="method-card-chevron"
            viewBox="0 0 20 20"
            fill="currentColor"
            width="16"
            height="16"
            style={{
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s",
            }}
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>
      {isOpen && (
        <div
          className="method-card-body"
          style={{
            borderTop: "1px solid var(--border)",
            background: "rgba(255, 255, 255, 0.3)",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "20px"
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: "12px" }}>
                Tệp tin nhập vào ({imports.length} IMPORTS)
              </div>
              {imports.length > 0 ? (
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                  {imports.map((imp: any, idx: number) => (
                    <li key={idx} style={{ fontSize: "12px", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ color: "var(--warning)", fontSize: "14px" }}>📁</span> {imp}
                    </li>
                  ))}
                </ul>
              ) : (
                <div style={{ fontSize: "12px", color: "var(--text-muted)", fontStyle: "italic" }}>Chưa có file nào</div>
              )}
            </div>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: "12px" }}>
                Được nhập bởi ({importedBy.length} DEPENDENTS)
              </div>
              {importedBy.length > 0 ? (
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                  {importedBy.map((imp: any, idx: number) => (
                    <li key={idx} style={{ fontSize: "12px", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ color: "var(--warning)", fontSize: "14px" }}>📁</span> {imp}
                    </li>
                  ))}
                </ul>
              ) : (
                <div style={{ fontSize: "12px", color: "var(--text-muted)", fontStyle: "italic" }}>Chưa có file nào phụ thuộc</div>
              )}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: "12px" }}>
              Xem trước mã nguồn
            </div>
            <pre
              className="method-source"
              style={{
                padding: "16px",
                margin: 0,
                fontSize: "12px",
                fontFamily: "var(--font-mono)",
                maxHeight: "350px",
                overflow: "auto",
                color: "var(--text-primary)",
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
              }}
            >
              {isLoadingCode ? (
                <div style={{ color: "var(--text-muted)", fontStyle: "italic", padding: "12px" }}>Đang tải source code...</div>
              ) : sourceCode ? (
                <div style={{ display: "table", width: "100%" }}>
                  {sourceCode.split("\n").map((line: string, i: number) => {
                    // Simple syntax coloring for C#
                    let highlighted = line
                      .replace(/\b(using|namespace|public|class|private|readonly|return)\b/g, "<span style='color: #c678dd;'>$1</span>")
                      .replace(/\b(string|int|bool|var)\b/g, "<span style='color: #e5c07b;'>$1</span>")
                      .replace(/("[^"]*")/g, "<span style='color: #98c379;'>$1</span>");
                    return (
                      <div key={i} style={{ display: "table-row" }}>
                        <span style={{ display: "table-cell", textAlign: "right", paddingRight: "16px", color: "var(--text-muted)", userSelect: "none", width: "40px" }}>{i + 1}</span>
                        <span style={{ display: "table-cell", whiteSpace: "pre-wrap" }} dangerouslySetInnerHTML={{ __html: highlighted }} />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ color: "var(--text-muted)", fontStyle: "italic", padding: "12px" }}>// Không có source code</div>
              )}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default GraphScreen;
