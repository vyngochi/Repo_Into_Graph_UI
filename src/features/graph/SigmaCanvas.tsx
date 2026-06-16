import React, { useEffect, useRef, useState, useCallback } from "react";
import { useAppStore } from "../../store/useAppStore";
import CodeViewer from "./CodeViewer";

interface GraphNode {
  id: string;
  attributes: {
    label: string;
    size: number;
    color: string;
    ext: string;
    x: number;
    y: number;
  };
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  attributes: { size: number; color: string };
}

interface SelectedNode {
  id: string;
  label: string;
  ext: string;
  imports: string[];
  importedBy: string[];
}

// Extension color palette
const EXT_COLORS: Record<string, string> = {
  ".ts": "#2563eb",
  ".tsx": "#0ea5e9",
  ".cs": "#7c3aed",
  ".js": "#d97706",
  ".jsx": "#06b6d4",
  ".css": "#2563eb",
  ".json": "#b45309",
};

const SigmaCanvas = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { selectedRepoPath, showToast } = useAppStore();
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [stats, setStats] = useState<{ files: number; edges: number } | null>(
    null,
  );
  const [selectedNode, setSelectedNode] = useState<SelectedNode | null>(null);
  const [graphData, setGraphData] = useState<{
    nodes: GraphNode[];
    edges: GraphEdge[];
  } | null>(null);
  const [hoveredExt, setHoveredExt] = useState<string | null>(null);

  const sigmaRef = useRef<unknown>(null);
  const highlightedNodes = new Set<string>();

  // Animated scan progress
  useEffect(() => {
    if (!isScanning) {
      setScanProgress(0);
      return;
    }
    setScanProgress(10);
    const t1 = setTimeout(() => setScanProgress(40), 400);
    const t2 = setTimeout(() => setScanProgress(70), 1200);
    const t3 = setTimeout(() => setScanProgress(90), 2400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isScanning]);

  const killSigma = useCallback(() => {
    if (
      sigmaRef.current &&
      typeof (sigmaRef.current as { kill: () => void }).kill === "function"
    ) {
      (sigmaRef.current as { kill: () => void }).kill();
      sigmaRef.current = null;
    }
  }, []);

  const handleScan = async () => {
    if (!selectedRepoPath?.trim()) {
      showToast("Không có thư mục được chọn trong Workspace.", "error");
      return;
    }
    setIsScanning(true);
    setSelectedNode(null);
    killSigma();

    try {
      const result = await window.graphApi?.scanLocal(selectedRepoPath.trim());
      if (!result?.success) {
        showToast(result?.error || "Quét thất bại.", "error");
        return;
      }
      setStats(result.stats || null);
      setGraphData({ nodes: result.nodes || [], edges: result.edges || [] });

      if ((result.nodes?.length ?? 0) === 0) {
        showToast("Không tìm thấy source files.", "info");
        return;
      }

      const [{ default: Graph }, { default: Sigma }, { default: forceAtlas2 }] =
        await Promise.all([
          import("graphology"),
          import("sigma"),
          import("graphology-layout-forceatlas2"),
        ]);

      const graph = new Graph({ multi: false, type: "directed" });

      for (const node of result.nodes || []) {
        graph.addNode(node.id, {
          ...node.attributes,
          // Slightly larger nodes, better colors
          size: Math.max(node.attributes.size, 1),
        });
      }
      for (const edge of result.edges || []) {
        if (graph.hasNode(edge.source) && graph.hasNode(edge.target)) {
          graph.addEdgeWithKey(
            edge.id,
            edge.source,
            edge.target,
            edge.attributes,
          );
        }
      }

      // ForceAtlas2 with more iterations for better layout
      forceAtlas2.assign(graph, {
        iterations: 300,
        settings: {
          gravity: 0.3,
          scalingRatio: 8,
          strongGravityMode: true,
          slowDown: 8,
        },
      });

      if (!containerRef.current) return;

      containerRef.current.innerHTML = "";

      const renderer = new Sigma(graph, containerRef.current, {
        renderEdgeLabels: false,
        defaultEdgeColor: "#34d399",
        defaultEdgeType: "arrow",
        labelFont: "Montserrat, sans-serif",
        labelSize: 11,
        labelWeight: "500",
        labelColor: { color: "#374151" },
        nodeReducer: (node, data) => {
          const isHighlighted = highlightedNodes.has(node);

          if (highlightedNodes.size === 0) {
            return {
              ...data,
            };
          }

          return {
            ...data,
            color: isHighlighted ? data.color : "#d1d5db",
            label:
              highlightedNodes.size === 0
                ? ""
                : isHighlighted
                  ? data.label
                  : "",
            borderColor: "#fff",
            borderSize: isHighlighted ? 2 : 1,
            zIndex: isHighlighted ? 1 : 0,
          };
        },
        edgeReducer: (edge, data) => {
          const source = graph.source(edge);
          const target = graph.target(edge);

          const visible =
            highlightedNodes.size === 0 ||
            (highlightedNodes.has(source) && highlightedNodes.has(target));

          return {
            ...data,
            color: visible ? "#0000FF" : "rgba(0,0,0,0.03)",
            hidden: !visible,
          };
        },
      });

      renderer.on("clickNode", ({ node }) => {
        const attrs = graph.getNodeAttributes(node);
        const imports = graph.outNeighbors(node);
        const importedBy = graph.inNeighbors(node);
        setSelectedNode({
          id: node,
          label: attrs.label,
          ext: attrs.ext,
          imports,
          importedBy,
        });
      });

      renderer.on("clickStage", () => setSelectedNode(null));

      renderer.on("enterNode", ({ node }) => {
        highlightedNodes.clear();

        highlightedNodes.add(node);

        graph.inNeighbors(node).forEach((n: string) => {
          highlightedNodes.add(n);
        });

        graph.outNeighbors(node).forEach((n: string) => {
          highlightedNodes.add(n);
        });

        renderer.refresh();
      });

      renderer.on("leaveNode", () => {
        highlightedNodes.clear();
        renderer.refresh();
      });

      sigmaRef.current = renderer;
      setScanProgress(100);
      showToast(
        `Đã tải ${result.stats?.files} files, ${result.stats?.edges} edges`,
        "success",
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Lỗi không xác định";
      showToast(`Lỗi: ${msg}`, "error");
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    return killSigma;
  }, [killSigma]);

  useEffect(() => {
    if (selectedRepoPath) handleScan();
  }, [selectedRepoPath]);

  const hasGraph = graphData && graphData.nodes.length > 0;

  const extLegend = [
    { ext: ".ts", color: EXT_COLORS[".ts"], label: "TypeScript" },
    { ext: ".tsx", color: EXT_COLORS[".tsx"], label: "React TSX" },
    { ext: ".cs", color: EXT_COLORS[".cs"], label: "C#" },
    { ext: ".js", color: EXT_COLORS[".js"], label: "JavaScript" },
    { ext: ".css", color: EXT_COLORS[".css"], label: "CSS" },
    { ext: ".json", color: EXT_COLORS[".json"], label: "JSON" },
  ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        position: "relative",
        background: "#f8fafc",
      }}
    >
      {/* ── Loading overlay ── */}
      {isScanning && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 200,
            background: "rgba(248, 250, 252, 0.95)",
            backdropFilter: "blur(8px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 20,
          }}
        >
          {/* Animated graph art */}
          <div style={{ position: "relative", width: 100, height: 100 }}>
            <svg viewBox="0 0 100 100" width={100} height={100} fill="none">
              <circle cx="20" cy="20" r="10" fill="#6366f1" opacity="0.7">
                <animate
                  attributeName="opacity"
                  values="0.7;1;0.7"
                  dur="1.4s"
                  repeatCount="indefinite"
                />
              </circle>
              <circle cx="80" cy="25" r="8" fill="#0ea5e9" opacity="0.6">
                <animate
                  attributeName="opacity"
                  values="0.6;1;0.6"
                  dur="1.8s"
                  repeatCount="indefinite"
                />
              </circle>
              <circle cx="50" cy="80" r="12" fill="#7c3aed" opacity="0.65">
                <animate
                  attributeName="opacity"
                  values="0.65;1;0.65"
                  dur="1.2s"
                  repeatCount="indefinite"
                />
              </circle>
              <line
                x1="20"
                y1="20"
                x2="80"
                y2="25"
                stroke="#6366f1"
                strokeWidth="1.5"
                opacity="0.25"
              />
              <line
                x1="20"
                y1="20"
                x2="50"
                y2="80"
                stroke="#7c3aed"
                strokeWidth="1.5"
                opacity="0.25"
              />
              <line
                x1="80"
                y1="25"
                x2="50"
                y2="80"
                stroke="#0ea5e9"
                strokeWidth="1.5"
                opacity="0.25"
              />
            </svg>
          </div>
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: "#1e293b",
                marginBottom: 4,
              }}
            >
              Đang xây dựng đồ thị...
            </div>
            <div style={{ fontSize: 12, color: "#64748b" }}>
              Phân tích dependency graph cho{" "}
              {selectedRepoPath?.split("\\").pop()}
            </div>
          </div>
          {/* Progress bar */}
          <div style={{ width: 240 }}>
            <div
              style={{
                background: "#e2e8f0",
                borderRadius: 999,
                height: 4,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${scanProgress}%`,
                  background: "linear-gradient(90deg, #6366f1, #0ea5e9)",
                  borderRadius: 999,
                  transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              />
            </div>
            <div
              style={{
                fontSize: 11,
                color: "#94a3b8",
                textAlign: "center",
                marginTop: 6,
              }}
            >
              {scanProgress < 40
                ? "Đọc file structure..."
                : scanProgress < 70
                  ? "Phân tích imports..."
                  : "Tính toán layout..."}
            </div>
          </div>
        </div>
      )}

      {/* ── Floating Stats + Legend (bottom-left) ── */}
      {stats && !isScanning && (
        <div
          style={{
            position: "absolute",
            bottom: 20,
            left: 20,
            zIndex: 80,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {/* Stats badge */}
          <div
            style={{
              background: "rgba(255,255,255,0.9)",
              backdropFilter: "blur(12px)",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              padding: "10px 14px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
              display: "flex",
              gap: 16,
              alignItems: "center",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#6366f1",
                  lineHeight: 1,
                }}
              >
                {stats.files}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: "#94a3b8",
                  marginTop: 2,
                  fontWeight: 500,
                }}
              >
                FILES
              </div>
            </div>
            <div style={{ width: 1, height: 28, background: "#e2e8f0" }} />
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#0ea5e9",
                  lineHeight: 1,
                }}
              >
                {stats.edges}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: "#94a3b8",
                  marginTop: 2,
                  fontWeight: 500,
                }}
              >
                EDGES
              </div>
            </div>
            {/* Rescan button */}
            <div style={{ width: 1, height: 28, background: "#e2e8f0" }} />
            <button
              onClick={handleScan}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#94a3b8",
                padding: "2px 4px",
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: 11,
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#6366f1")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
              title="Quét lại"
            >
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
              Rescan
            </button>
          </div>

          {/* Legend */}
          <div
            style={{
              background: "rgba(255,255,255,0.9)",
              backdropFilter: "blur(12px)",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              padding: "10px 14px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
              display: "flex",
              flexDirection: "column",
              gap: 5,
            }}
          >
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: "#94a3b8",
                letterSpacing: "0.8px",
                textTransform: "uppercase",
                marginBottom: 2,
              }}
            >
              LEGEND
            </div>
            {extLegend.map(({ ext, color, label }) => (
              <div
                key={ext}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  cursor: "default",
                  opacity: hoveredExt && hoveredExt !== ext ? 0.45 : 1,
                  transition: "opacity 0.15s",
                }}
                onMouseEnter={() => setHoveredExt(ext)}
                onMouseLeave={() => setHoveredExt(null)}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: color,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: 11,
                    color: "#475569",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {ext}
                </span>
                <span style={{ fontSize: 10, color: "#94a3b8" }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Hint tooltip (top-right) ── */}
      {hasGraph && !isScanning && (
        <div
          style={{
            position: "absolute",
            top: 20,
            right: 20,
            zIndex: 80,
            background: "rgba(255,255,255,0.85)",
            backdropFilter: "blur(12px)",
            border: "1px solid #e2e8f0",
            borderRadius: 10,
            padding: "8px 14px",
            fontSize: 11,
            color: "#64748b",
            boxShadow: "0 4px 16px rgba(0,0,0,0.05)",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            width="12"
            height="12"
            style={{ color: "#6366f1" }}
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          Click vào node để xem source code · Scroll để zoom · Kéo để di chuyển
        </div>
      )}

      {/* ── Main Canvas ── */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        <div ref={containerRef} style={{ width: "100%", height: "100%" }} />

        {/* Empty state */}
        {!hasGraph && !isScanning && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
              background: "#f8fafc",
            }}
          >
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%)",
                border: "2px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg viewBox="0 0 120 120" width="52" height="52" fill="none">
                <circle cx="20" cy="20" r="10" fill="#6366f1" opacity="0.4" />
                <circle cx="100" cy="30" r="10" fill="#8b5cf6" opacity="0.4" />
                <circle cx="60" cy="100" r="10" fill="#06b6d4" opacity="0.4" />
                <line
                  x1="20"
                  y1="20"
                  x2="100"
                  y2="30"
                  stroke="#6366f1"
                  strokeWidth="1.5"
                  opacity="0.25"
                />
                <line
                  x1="20"
                  y1="20"
                  x2="60"
                  y2="100"
                  stroke="#8b5cf6"
                  strokeWidth="1.5"
                  opacity="0.25"
                />
                <line
                  x1="100"
                  y1="30"
                  x2="60"
                  y2="100"
                  stroke="#06b6d4"
                  strokeWidth="1.5"
                  opacity="0.25"
                />
              </svg>
            </div>
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: "#1e293b",
                  marginBottom: 4,
                }}
              >
                Dependency Graph
              </div>
              <div style={{ fontSize: 13, color: "#64748b", maxWidth: 300 }}>
                Mở một Workspace để tự động hiển thị đồ thị phụ thuộc giữa các
                files.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── CodeViewer overlay ── */}
      {selectedNode && (
        <div style={{ position: "absolute", inset: 0, zIndex: 100 }}>
          <CodeViewer
            selectedNode={selectedNode}
            nodes={graphData?.nodes || []}
            edges={graphData?.edges || []}
            scanPath={selectedRepoPath || ""}
            onBack={() => setSelectedNode(null)}
            onSelectNode={(nodeId) => {
              const node = graphData?.nodes.find((n) => n.id === nodeId);
              if (node) {
                const imports =
                  graphData?.edges
                    .filter((e) => e.source === nodeId)
                    .map((e) => e.target) || [];
                const importedBy =
                  graphData?.edges
                    .filter((e) => e.target === nodeId)
                    .map((e) => e.source) || [];
                setSelectedNode({
                  id: nodeId,
                  label: node.attributes.label,
                  ext: node.attributes.ext,
                  imports,
                  importedBy,
                });
              }
            }}
          />
        </div>
      )}
    </div>
  );
};

export default SigmaCanvas;
