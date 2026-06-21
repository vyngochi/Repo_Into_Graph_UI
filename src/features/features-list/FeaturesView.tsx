import React, { useState, useEffect, useMemo, useRef } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useAppStore, FeatureItem } from "../../store/useAppStore";
import {
  parseMermaid,
  FeatureInteractiveGraph,
} from "./FeatureInteractiveGraph";

const FeaturesView = () => {
  const { serverUrl, features, setFeatures, showToast, selectedRepoPath } =
    useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<FeatureItem | null>(null);
  const [featureDetail, setFeatureDetail] = useState<unknown>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [activeViewTab, setActiveViewTab] = useState<
    "graph" | "visual" | "mermaid"
  >("graph");

  const [selectedNodeCode, setSelectedNodeCode] = useState<{
    code: string;
    highlightLine: number;
    className: string;
    method: string;
    filePath: string;
  } | null>(null);
  const [isCodeLoading, setIsCodeLoading] = useState(false);
  const [isGraphFullscreen, setIsGraphFullscreen] = useState(false);
  const [codePanelWidth, setCodePanelWidth] = useState(600);
  const [isResizingPanel, setIsResizingPanel] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingPanel) return;

      let panelLeft = 0;
      if (panelRef.current) {
        panelLeft = panelRef.current.getBoundingClientRect().left;
      }

      let newWidth = e.clientX - panelLeft;
      if (newWidth < 300) newWidth = 300;
      if (newWidth > 1200) newWidth = 1200;
      if (panelRef.current) {
        panelRef.current.style.width = `${newWidth}px`;
      }
    };
    const handleMouseUp = (e: MouseEvent) => {
      if (isResizingPanel) {
        setIsResizingPanel(false);

        let panelLeft = 0;
        if (panelRef.current) {
          panelLeft = panelRef.current.getBoundingClientRect().left;
        }

        let newWidth = e.clientX - panelLeft;
        if (newWidth < 300) newWidth = 300;
        if (newWidth > 1200) newWidth = 1200;
        setCodePanelWidth(newWidth);
      }
    };

    if (isResizingPanel) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizingPanel]);

  const handleNodeClick = async (nodeId: string, label: string) => {
    if (!selectedRepoPath) {
      showToast("Không có thư mục được chọn trong Workspace.", "error");
      return;
    }

    const parts = label.split(".");
    if (parts.length < 2) return;
    const method = parts.pop()!;
    const className = parts.pop()!;

    setIsCodeLoading(true);
    try {
      const scanRes = await window.graphApi?.scanLocal(selectedRepoPath.trim());
      if (scanRes?.success && scanRes.nodes) {
        const fileNode = scanRes.nodes.find(
          (n: any) =>
            n.id.endsWith(`/${className}.cs`) ||
            n.id.endsWith(`\\${className}.cs`) ||
            n.id === `${className}.cs`,
        );
        if (fileNode) {
          const absPath =
            selectedRepoPath.replace(/[\\/]$/, "") +
            "\\" +
            fileNode.id.replace(/\//g, "\\");
          const fileRes = await window.graphApi?.readFile(absPath);
          if (fileRes?.success && fileRes.content) {
            const lines = fileRes.content.split("\n");
            let highlightLine = -1;

            const methodRegex = new RegExp(
              `\\b${method.replace(/\(\)/g, "")}\\b\\s*\\(`,
            );
            for (let i = 0; i < lines.length; i++) {
              if (methodRegex.test(lines[i])) {
                highlightLine = i + 1;
                break;
              }
            }

            setSelectedNodeCode({
              code: fileRes.content,
              highlightLine,
              className,
              method,
              filePath: fileNode.id,
            });
          } else {
            showToast("Không thể đọc nội dung file.", "error");
          }
        } else {
          showToast(
            `Không tìm thấy file cho lớp ${className}.cs trong Workspace.`,
            "error",
          );
        }
      }
    } catch (err) {
      showToast("Lỗi khi tìm code.", "error");
    } finally {
      setIsCodeLoading(false);
    }
  };

  const loadFeatures = async () => {
    setIsLoading(true);
    try {
      const res = await window.api?.getFeatures({ baseUrl: serverUrl });
      if (res?.success && res.status === 200) {
        const data = res.data;
        if (Array.isArray(data)) setFeatures(data as FeatureItem[]);
        else if (data && Array.isArray((data as any).items))
          setFeatures((data as any).items as FeatureItem[]);
        else if (data && Array.isArray((data as any).Items))
          setFeatures((data as any).Items as FeatureItem[]);
        else setFeatures([]);
      } else {
        showToast(
          res?.error ||
            `Lỗi từ Backend (${res?.status}): ${JSON.stringify(res?.data)}`,
          "error",
        );
      }
    } catch {
      showToast("Lỗi kết nối đến server.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const loadFeatureDetail = async (flow: FeatureItem) => {
    setSelected(flow);
    setIsLoadingDetail(true);
    setFeatureDetail(null);
    try {
      const res = await window.api?.getFeatureById({
        baseUrl: serverUrl,
        id: flow.id,
      });
      if (res?.success) {
        setFeatureDetail(res.data);
      }
    } catch {
      showToast("Không thể tải chi tiết flow.", "error");
    } finally {
      setIsLoadingDetail(false);
    }
  };

  useEffect(() => {
    if (features.length === 0) loadFeatures();
  }, []);

  const mermaidGraph =
    (featureDetail as any)?.dataFlowMermaidGraph ||
    (featureDetail as any)?.DataFlowMermaidGraph ||
    "";
  const entryPoint =
    (featureDetail as any)?.entryPoint ||
    (featureDetail as any)?.EntryPoint ||
    "";
  const rawSteps =
    (featureDetail as any)?.steps || (featureDetail as any)?.Steps || [];
  const steps = Array.isArray(rawSteps) ? rawSteps : [];

  const parsedGraph = useMemo(() => {
    let result = parseMermaid(mermaidGraph);

    if (result.nodes.length === 0 && steps.length > 0) {
      const nodeMap = new Map<string, string>();
      const edgesList: { source: string; target: string; label?: string }[] =
        [];

      steps.forEach((step: any, idx: number) => {
        const caller = `${step.callerClass || step.CallerClass || "Unknown"}.${step.callerMethod || step.CallerMethod || "Unknown"}`;
        const callee = `${step.calleeClass || step.CalleeClass || "Unknown"}.${step.calleeMethod || step.CalleeMethod || "Unknown"}`;
        const order =
          step.stepOrder !== undefined
            ? step.stepOrder
            : step.StepOrder !== undefined
              ? step.StepOrder
              : idx + 1;

        const getOrAddNode = (name: string) => {
          let id = Array.from(nodeMap.entries()).find(
            ([_, v]) => v === name,
          )?.[0];
          if (!id) {
            id = `n_${nodeMap.size}`;
            nodeMap.set(id, name);
          }
          return id;
        };

        const sId = getOrAddNode(caller);
        const tId = getOrAddNode(callee);

        edgesList.push({
          source: sId,
          target: tId,
          label: `${order}`,
        });
      });

      const nodesList = Array.from(nodeMap.entries()).map(([id, label]) => ({
        id,
        label,
      }));

      result = { nodes: nodesList, edges: edgesList };
    }

    return result;
  }, [mermaidGraph, steps]);

  const handleCopyMermaid = () => {
    if (mermaidGraph) {
      navigator.clipboard.writeText(mermaidGraph);
      showToast("Đã sao chép mã Mermaid!", "success");
    }
  };

  return (
    <div className="page active" style={{ padding: "24px 28px" }}>
      {/* Code Drawer Overlay */}
      {selectedNodeCode && (
        <div
          ref={panelRef}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            bottom: 0,
            width: `${codePanelWidth}px`,
            minWidth: "600px",
            background: "#ffffff",
            boxShadow: "4px 0 24px rgba(0,0,0,0.1)",
            zIndex: 10000,
            display: "flex",
            flexDirection: "column",
            animation: "slideInLeft 0.2s ease-out",
          }}
        >
          {/* Resizer Handle */}
          <div
            onMouseDown={() => setIsResizingPanel(true)}
            style={{
              position: "absolute",
              top: 0,
              right: -4,
              bottom: 0,
              width: 8,
              cursor: "col-resize",
              zIndex: 10001,
              background: isResizingPanel ? "var(--blue)" : "transparent",
              transition: "background 0.2s",
            }}
          />
          <div
            style={{
              padding: "16px 24px",
              borderBottom: "1px solid #e2e8f0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "#f8fafc",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: "#1e293b",
                  marginBottom: 4,
                }}
              >
                {selectedNodeCode.className}.
                <span style={{ color: "#3b82f6" }}>
                  {selectedNodeCode.method}
                </span>
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "#64748b",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {selectedNodeCode.filePath}
              </div>
            </div>
            <button
              onClick={() => setSelectedNodeCode(null)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 8,
                borderRadius: "50%",
                color: "#64748b",
              }}
            >
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                width="20"
                height="20"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
          <div style={{ flex: 1, overflow: "auto", position: "relative" }}>
            <SyntaxHighlighter
              language="csharp"
              style={oneLight}
              customStyle={{
                margin: 0,
                padding: "20px",
                fontSize: "13px",
                minHeight: "100%",
              }}
              showLineNumbers={true}
              wrapLines={true}
              lineProps={(lineNumber) => {
                const isHighlight =
                  lineNumber === selectedNodeCode.highlightLine;
                return {
                  style: {
                    display: "block",
                    backgroundColor: isHighlight ? "#fffbeb" : "transparent",
                    borderLeft: isHighlight
                      ? "3px solid #f59e0b"
                      : "3px solid transparent",
                    paddingLeft: "8px",
                  },
                  id: isHighlight ? "highlighted-line" : undefined,
                };
              }}
            >
              {selectedNodeCode.code}
            </SyntaxHighlighter>
          </div>
        </div>
      )}
      <style>{`
        @keyframes slideInLeft {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
      `}</style>
      <div className="codeflow-layout">
        {/* Left panel */}
        {!isGraphFullscreen && (
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
                  <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                  <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
                </svg>
              </div>
              <div className="card-title">Features</div>
            </div>
            <p className="card-desc">Chọn một feature để xem chi tiết.</p>

            <div className="search-box" style={{ marginBottom: 12 }}>
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
              style={{
                width: "100%",
                justifyContent: "center",
                marginBottom: 12,
              }}
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
              Làm mới
            </button>

            {isLoading ? (
              <div className="loading-state" style={{ padding: "24px" }}>
                <div className="spinner-large" />
              </div>
            ) : features.length === 0 ? (
              <div className="empty-state" style={{ padding: "24px" }}>
                <div className="empty-title">Chưa có flow nào</div>
                <div className="empty-desc">
                  Hãy phân tích repository trước.
                </div>
              </div>
            ) : (
              <div className="recent-list">
                {features
                  .filter(
                    (f) =>
                      !search ||
                      (f.name &&
                        f.name.toLowerCase().includes(search.toLowerCase())),
                  )
                  .map((flow) => (
                    <div
                      key={flow.id}
                      className="recent-item"
                      style={
                        selected?.id === flow.id
                          ? {
                              borderColor: "var(--blue)",
                              background: "var(--blue-dim)",
                            }
                          : {}
                      }
                      onClick={() => loadFeatureDetail(flow)}
                    >
                      <div className="recent-dot" />
                      <div className="recent-item-name">{flow.name}</div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Right panel */}
        <div
          className="codeflow-result"
          style={isGraphFullscreen ? { gridColumn: "1 / -1" } : {}}
        >
          {!selected && (
            <div
              className="card"
              style={{
                background: "rgba(255, 255, 255, 0.65)",
                backdropFilter: "blur(16px)",
                border: "1px solid rgba(255, 255, 255, 0.4)",
              }}
            >
              <div className="empty-state">
                <div className="empty-art">
                  <svg viewBox="0 0 64 64" width="48" height="48" fill="none">
                    <circle
                      cx="32"
                      cy="32"
                      r="20"
                      stroke="var(--border-light)"
                      strokeWidth="2"
                    />
                    <path
                      d="M20 32h24M32 20v24"
                      stroke="var(--border-light)"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <div className="empty-title">Chưa chọn Feature</div>
                <div className="empty-desc">
                  Chọn một flow từ danh sách bên trái để xem chi tiết.
                </div>
              </div>
            </div>
          )}

          {selected && (
            <div
              className="card"
              style={{
                background: "rgba(255, 255, 255, 0.65)",
                backdropFilter: isGraphFullscreen ? "none" : "blur(16px)",
                border: "1px solid rgba(255, 255, 255, 0.4)",
              }}
            >
              <div
                className="codeflow-header"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                  gap: "16px",
                }}
              >
                <div>
                  <div
                    className="feature-badge-row"
                    style={{ marginBottom: "8px" }}
                  >
                    <span className="badge badge-blue">Feature</span>
                    <span className="cf-feature-id">{selected.id}</span>
                  </div>
                  <div className="card-title" style={{ marginBottom: 8 }}>
                    {selected.name}
                  </div>
                  {selected.description && (
                    <p
                      style={{
                        fontSize: 13,
                        color: "var(--text-secondary)",
                        lineHeight: 1.6,
                      }}
                    >
                      {selected.description}
                    </p>
                  )}
                </div>

                {/* Tab switcher inside detail card header */}
                <div
                  style={{
                    display: "flex",
                    gap: "4px",
                    background: "rgba(0,0,0,0.05)",
                    padding: "2px",
                    borderRadius: "8px",
                  }}
                >
                  <button
                    onClick={() => setActiveViewTab("graph")}
                    style={{
                      padding: "6px 12px",
                      fontSize: "12px",
                      fontWeight: 600,
                      border: "none",
                      borderRadius: "6px",
                      background:
                        activeViewTab === "graph" ? "#ffffff" : "none",
                      color:
                        activeViewTab === "graph"
                          ? "var(--blue)"
                          : "var(--text-secondary)",
                      cursor: "pointer",
                      boxShadow:
                        activeViewTab === "graph"
                          ? "0 2px 4px rgba(0,0,0,0.05)"
                          : "none",
                      transition: "all 0.2s",
                    }}
                  >
                    Đồ thị
                  </button>
                  <button
                    onClick={() => setActiveViewTab("visual")}
                    style={{
                      padding: "6px 12px",
                      fontSize: "12px",
                      fontWeight: 600,
                      border: "none",
                      borderRadius: "6px",
                      background:
                        activeViewTab === "visual" ? "#ffffff" : "none",
                      color:
                        activeViewTab === "visual"
                          ? "var(--blue)"
                          : "var(--text-secondary)",
                      cursor: "pointer",
                      boxShadow:
                        activeViewTab === "visual"
                          ? "0 2px 4px rgba(0,0,0,0.05)"
                          : "none",
                      transition: "all 0.2s",
                    }}
                  >
                    Sơ đồ
                  </button>
                  <button
                    onClick={() => setActiveViewTab("mermaid")}
                    style={{
                      padding: "6px 12px",
                      fontSize: "12px",
                      fontWeight: 600,
                      border: "none",
                      borderRadius: "6px",
                      background:
                        activeViewTab === "mermaid" ? "#ffffff" : "none",
                      color:
                        activeViewTab === "mermaid"
                          ? "var(--blue)"
                          : "var(--text-secondary)",
                      cursor: "pointer",
                      boxShadow:
                        activeViewTab === "mermaid"
                          ? "0 2px 4px rgba(0,0,0,0.05)"
                          : "none",
                      transition: "all 0.2s",
                    }}
                  >
                    Mermaid
                  </button>
                </div>
              </div>

              <hr className="divider" />

              {isLoadingDetail ? (
                <div className="loading-state">
                  <div className="spinner-large" />
                  <span>Đang tải chi tiết...</span>
                </div>
              ) : featureDetail ? (
                <div>
                  {activeViewTab === "graph" ? (
                    <div style={{ marginBottom: "20px" }}>
                      <div
                        style={{
                          background: "rgba(99, 102, 241, 0.06)",
                          border: "1px solid rgba(99, 102, 241, 0.15)",
                          borderRadius: "8px",
                          padding: "10px 14px",
                          marginBottom: "20px",
                          fontSize: "13px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <div>
                          <span
                            className="font-main"
                            style={{
                              fontWeight: 600,
                              color: "var(--blue-light)",
                            }}
                          >
                            Entry Point:{" "}
                          </span>
                          <span
                            className="mono"
                            style={{
                              color: "var(--text-primary)",
                              fontWeight: 600,
                            }}
                          >
                            {entryPoint || "Chưa định nghĩa"}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: "11px",
                            color: "var(--text-muted)",
                          }}
                        >
                          Tổng số: {parsedGraph.nodes.length} nút,{" "}
                          {parsedGraph.edges.length} liên kết
                        </span>
                      </div>

                      {parsedGraph.nodes.length === 0 ? (
                        <div
                          className="empty-state"
                          style={{ padding: "24px" }}
                        >
                          <div className="empty-title">
                            Không có dữ liệu đồ thị
                          </div>
                          <div className="empty-desc">
                            Mã Mermaid trống hoặc không thể phân tích các bước
                            trong flow này.
                          </div>
                        </div>
                      ) : (
                        <FeatureInteractiveGraph
                          parsedGraph={parsedGraph}
                          entryPoint={entryPoint}
                          onNodeClick={handleNodeClick}
                          onToggleFullscreen={(isFull) =>
                            setIsGraphFullscreen(isFull)
                          }
                        />
                      )}
                    </div>
                  ) : activeViewTab === "visual" ? (
                    <div>
                      {/* Entry Point */}
                      <div
                        style={{
                          background: "rgba(99, 102, 241, 0.06)",
                          border: "1px solid rgba(99, 102, 241, 0.15)",
                          borderRadius: "8px",
                          padding: "10px 14px",
                          marginBottom: "20px",
                          fontSize: "13px",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 600,
                            color: "var(--blue-light)",
                          }}
                        >
                          Entry Point:{" "}
                        </span>
                        <span
                          className="mono"
                          style={{
                            color: "var(--text-primary)",
                            fontWeight: 600,
                          }}
                        >
                          {entryPoint || "Chưa định nghĩa"}
                        </span>
                      </div>

                      {steps.length === 0 ? (
                        <div
                          className="empty-state"
                          style={{ padding: "24px" }}
                        >
                          <div className="empty-title">
                            Không tìm thấy bước gọi hàm nào
                          </div>
                          <div className="empty-desc">
                            Feature này có thể rỗng hoặc chưa được phân tích
                            đúng.
                          </div>
                        </div>
                      ) : (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                          }}
                        >
                          {steps.map((step: any, idx: number) => {
                            const callerClass =
                              step.callerClass || step.CallerClass || "Unknown";
                            const callerMethod =
                              step.callerMethod ||
                              step.CallerMethod ||
                              "Unknown";
                            const calleeClass =
                              step.calleeClass || step.CalleeClass || "Unknown";
                            const calleeMethod =
                              step.calleeMethod ||
                              step.CalleeMethod ||
                              "Unknown";
                            const order =
                              step.stepOrder !== undefined
                                ? step.stepOrder
                                : step.StepOrder !== undefined
                                  ? step.StepOrder
                                  : idx + 1;

                            return (
                              <React.Fragment key={step.id || idx}>
                                {idx > 0 && (
                                  <div
                                    style={{
                                      display: "flex",
                                      justifyContent: "center",
                                      margin: "2px 0",
                                      color: "var(--blue-light)",
                                      opacity: 0.7,
                                    }}
                                  >
                                    <svg
                                      viewBox="0 0 20 20"
                                      fill="currentColor"
                                      width="16"
                                      height="16"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l3.707-3.707a1 1 0 011.414 0z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  </div>
                                )}
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    background: "rgba(255, 255, 255, 0.7)",
                                    border:
                                      "1px solid rgba(255, 255, 255, 0.4)",
                                    borderRadius: "var(--radius)",
                                    padding: "14px 18px",
                                    gap: "12px",
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.01)",
                                  }}
                                >
                                  {/* Step Index Circle */}
                                  <div
                                    style={{
                                      width: "28px",
                                      height: "28px",
                                      borderRadius: "50%",
                                      background: "var(--blue-dim)",
                                      color: "var(--blue-light)",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      fontSize: "12px",
                                      fontWeight: 700,
                                      flexShrink: 0,
                                    }}
                                  >
                                    {order}
                                  </div>

                                  {/* Visual call link */}
                                  <div
                                    style={{
                                      flex: 1,
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "space-between",
                                      gap: "8px",
                                      flexWrap: "wrap",
                                    }}
                                  >
                                    <div
                                      style={{
                                        flex: "1 1 180px",
                                        background: "rgba(0,0,0,0.02)",
                                        padding: "8px 12px",
                                        borderRadius: "6px",
                                        border: "1px solid var(--border)",
                                      }}
                                    >
                                      <div
                                        style={{
                                          fontSize: "9px",
                                          color: "var(--text-muted)",
                                          textTransform: "uppercase",
                                          marginBottom: "1px",
                                        }}
                                      >
                                        Caller
                                      </div>
                                      <div
                                        className="mono"
                                        style={{
                                          fontSize: "12px",
                                          color: "var(--text-primary)",
                                          fontWeight: 600,
                                        }}
                                      >
                                        {callerClass}.
                                        <span
                                          style={{ color: "var(--blue-light)" }}
                                        >
                                          {callerMethod}()
                                        </span>
                                      </div>
                                    </div>

                                    <div
                                      style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        flexShrink: 0,
                                        color: "var(--blue-light)",
                                      }}
                                    >
                                      <span
                                        style={{
                                          fontSize: "9px",
                                          fontWeight: 600,
                                          opacity: 0.6,
                                          letterSpacing: "0.5px",
                                        }}
                                      >
                                        CALL
                                      </span>
                                      <svg
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                        width="16"
                                        height="16"
                                        style={{ transform: "rotate(-90deg)" }}
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l3.707-3.707a1 1 0 011.414 0z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                    </div>

                                    <div
                                      style={{
                                        flex: "1 1 180px",
                                        background: "rgba(0,0,0,0.02)",
                                        padding: "8px 12px",
                                        borderRadius: "6px",
                                        border: "1px solid var(--border)",
                                      }}
                                    >
                                      <div
                                        style={{
                                          fontSize: "9px",
                                          color: "var(--text-muted)",
                                          textTransform: "uppercase",
                                          marginBottom: "1px",
                                        }}
                                      >
                                        Callee
                                      </div>
                                      <div
                                        className="mono"
                                        style={{
                                          fontSize: "12px",
                                          color: "var(--text-primary)",
                                          fontWeight: 600,
                                        }}
                                      >
                                        {calleeClass}.
                                        <span
                                          style={{ color: "var(--blue-light)" }}
                                        >
                                          {calleeMethod}()
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </React.Fragment>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "flex-end",
                          marginBottom: "8px",
                        }}
                      >
                        <button
                          className="border btn-secondary"
                          style={{ padding: "6px 12px", fontSize: "11px" }}
                          onClick={handleCopyMermaid}
                          disabled={!mermaidGraph}
                        >
                          Sao chép mã Mermaid
                        </button>
                      </div>
                      <pre
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 12,
                          color: "var(--text-primary)",
                          background: "rgba(0,0,0,0.02)",
                          border: "1px solid var(--border)",
                          borderRadius: "var(--radius-sm)",
                          padding: "16px",
                          whiteSpace: "pre-wrap",
                          lineHeight: 1.6,
                        }}
                      >
                        {mermaidGraph || "// Không có mã Mermaid cho flow này."}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-title">Không có dữ liệu chi tiết</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeaturesView;
