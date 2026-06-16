import React, { useEffect, useState, useMemo } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";

interface SelectedNode {
  id: string;
  label: string;
  ext: string;
  imports: string[];
  importedBy: string[];
}

interface CodeViewerProps {
  selectedNode: SelectedNode;
  nodes: any[];
  edges: any[];
  scanPath: string;
  onBack: () => void;
  onSelectNode: (nodeId: string) => void;
}

const extColorMap: Record<string, string> = {
  ".ts": "#2563eb",
  ".tsx": "#0ea5e9",
  ".cs": "#1E90FF",
  ".js": "#d97706",
  ".jsx": "#0ea5e9",
  ".css": "#2563eb",
  ".json": "#b45309",
};

const langMap: Record<string, string> = {
  ".ts": "typescript",
  ".tsx": "tsx",
  ".cs": "csharp",
  ".js": "javascript",
  ".jsx": "jsx",
  ".css": "css",
  ".json": "json",
};

function FileIcon({ ext, size = 14 }: { ext: string; size?: number }) {
  const c = extColorMap[ext?.toLowerCase()] || "#6b7280";
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      fill="none"
      style={{ flexShrink: 0 }}
    >
      <path
        d="M2 2.5A2.5 2.5 0 014.5 0H10l4 4v9.5A2.5 2.5 0 0111.5 16h-7A2.5 2.5 0 012 13.5v-11z"
        fill={c}
        opacity="0.12"
      />
      <path
        d="M10 0v3.5A1.5 1.5 0 0011.5 5H14"
        stroke={c}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M4.5 0H10l4 4v9.5A2.5 2.5 0 0111.5 16h-7A2.5 2.5 0 012 13.5v-11A2.5 2.5 0 014.5 0z"
        stroke={c}
        strokeWidth="1"
        fill="none"
      />
    </svg>
  );
}

const CodeViewer = ({
  selectedNode,
  nodes,
  edges,
  scanPath,
  onBack,
  onSelectNode,
}: CodeViewerProps) => {
  const [code, setCode] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [lineCount, setLineCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!selectedNode || !scanPath) return;
    setIsLoading(true);
    setCode("");

    const absPath =
      scanPath.replace(/[\\/]$/, "") +
      "\\" +
      selectedNode.id.replace(/\//g, "\\");

    window.graphApi
      ?.readFile(absPath)
      .then((res) => {
        if (res?.success && res.content) {
          setCode(res.content);
          setLineCount(res.lines || 0);
        } else {
          setCode(`// Lỗi đọc file: ${res?.error || "Không xác định"}`);
        }
      })
      .catch((err) => {
        setCode(`// Lỗi: ${err}`);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [selectedNode, scanPath]);

  const filteredFileTree = useMemo(() => {
    const all = nodes.map((n) => n.id).sort();
    if (!searchQuery.trim()) return all;
    return all.filter((f) =>
      f.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [nodes, searchQuery]);

  const language = langMap[selectedNode.ext?.toLowerCase()] || "javascript";
  const extColor = extColorMap[selectedNode.ext?.toLowerCase()] || "#6b7280";

  return (
    <div
      style={{
        display: "flex",
        height: "100%",
        background: "#f8fafc",
        color: "#1e293b",
        fontFamily: "var(--font-main)",
        overflow: "hidden",
      }}
    >
      {/* ── Left Sidebar ── */}
      <div
        style={{
          width: 272,
          borderRight: "1px solid #e2e8f0",
          display: "flex",
          flexDirection: "column",
          background: "#ffffff",
          flexShrink: 0,
          boxShadow: "1px 0 0 0 #f1f5f9",
        }}
      >
        {/* Back button */}
        <div
          style={{
            padding: "12px 14px",
            borderBottom: "1px solid #f1f5f9",
            display: "flex",
            alignItems: "center",
          }}
        >
          <button
            onClick={onBack}
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              color: "#475569",
              display: "flex",
              alignItems: "center",
              gap: 6,
              cursor: "pointer",
              fontSize: 12,
              fontFamily: "var(--font-main)",
              padding: "5px 11px",
              fontWeight: 500,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#f1f5f9";
              e.currentTarget.style.color = "#1e293b";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#f8fafc";
              e.currentTarget.style.color = "#475569";
            }}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
            Quay lại Graph
          </button>
        </div>

        {/* File info card */}
        <div
          style={{
            margin: "12px",
            padding: "14px",
            borderRadius: 10,
            background: "linear-gradient(135deg, #f8fafc 0%, #f0f4ff 100%)",
            border: "1px solid #e2e8f0",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 12,
            }}
          >
            <FileIcon ext={selectedNode.ext} size={18} />
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#1e293b",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                flex: 1,
              }}
            >
              {selectedNode.label}
            </span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.5px",
                padding: "2px 7px",
                borderRadius: 4,
                background: `${extColor}15`,
                color: extColor,
                border: `1px solid ${extColor}30`,
                flexShrink: 0,
              }}
            >
              {selectedNode.ext?.toUpperCase().replace(".", "")}
            </span>
          </div>

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}
          >
            <div
              style={{
                background: "#eff6ff",
                border: "1px solid #dbeafe",
                borderRadius: 8,
                padding: "8px 10px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#2563eb",
                  lineHeight: 1,
                }}
              >
                {selectedNode.imports.length}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: "#64748b",
                  marginTop: 3,
                  fontWeight: 500,
                }}
              >
                Imports
              </div>
            </div>
            <div
              style={{
                background: "#eff6ff",
                border: "1px solid #dbeafe",
                borderRadius: 8,
                padding: "8px 10px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#1E90FF",
                  lineHeight: 1,
                }}
              >
                {selectedNode.importedBy.length}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: "#64748b",
                  marginTop: 3,
                  fontWeight: 500,
                }}
              >
                Importers
              </div>
            </div>
          </div>
        </div>

        {/* Explorer header */}
        <div style={{ padding: "0 14px 8px 14px" }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "#94a3b8",
              textTransform: "uppercase",
              letterSpacing: "0.8px",
              marginBottom: 8,
            }}
          >
            {nodes.length} files
          </div>
          <div style={{ position: "relative" }}>
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              width="12"
              height="12"
              style={{
                position: "absolute",
                left: 9,
                top: "50%",
                transform: "translateY(-50%)",
                color: "#94a3b8",
                pointerEvents: "none",
              }}
            >
              <path
                fillRule="evenodd"
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                clipRule="evenodd"
              />
            </svg>
            <input
              type="text"
              placeholder="Tìm file..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "6px 8px 6px 28px",
                fontSize: 12,
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 7,
                color: "#1e293b",
                fontFamily: "var(--font-main)",
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
              onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
            />
          </div>
        </div>

        {/* File tree */}
        <div style={{ flex: 1, overflowY: "auto", paddingBottom: 8 }}>
          {filteredFileTree.map((file) => {
            const isSelected = file === selectedNode.id;
            const name = file.split("/").pop() || file;
            const ext = "." + (name.split(".").pop() || "");
            return (
              <div
                key={file}
                onClick={() => onSelectNode(file)}
                style={{
                  padding: "5px 14px",
                  fontSize: 12.5,
                  cursor: "pointer",
                  background: isSelected ? "#eff6ff" : "transparent",
                  borderLeft: `2px solid ${isSelected ? "#1E90FF" : "transparent"}`,
                  color: isSelected ? "#1e40af" : "#475569",
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  fontFamily: "var(--font-mono)",
                  fontWeight: isSelected ? 600 : 400,
                  transition: "all 0.12s",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = "#f8fafc";
                }}
                onMouseLeave={(e) => {
                  if (!isSelected)
                    e.currentTarget.style.background = "transparent";
                }}
                title={file}
              >
                <FileIcon ext={ext} size={13} />
                <span
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {name}
                </span>
              </div>
            );
          })}
          {filteredFileTree.length === 0 && (
            <div
              style={{
                padding: "20px 16px",
                textAlign: "center",
                color: "#94a3b8",
                fontSize: 12,
              }}
            >
              Không tìm thấy file nào
            </div>
          )}
        </div>
      </div>

      {/* ── Main Editor ── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          background: "#f8fafc",
        }}
      >
        {/* Tab bar */}
        <div
          style={{
            display: "flex",
            alignItems: "stretch",
            background: "#ffffff",
            borderBottom: "1px solid #e2e8f0",
            minHeight: 38,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "0 18px",
              background: "#f8fafc",
              borderRight: "1px solid #e2e8f0",
              borderTop: `2px solid ${extColor}`,
              color: "#1e293b",
              fontSize: 13,
              fontWeight: 500,
              whiteSpace: "nowrap",
            }}
          >
            <FileIcon ext={selectedNode.ext} size={14} />
            <span style={{ fontFamily: "var(--font-mono)" }}>
              {selectedNode.label}
            </span>
          </div>
          <div style={{ flex: 1 }} />
          {/* Breadcrumb */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "0 16px",
              fontSize: 11,
              color: "#94a3b8",
              fontFamily: "var(--font-mono)",
              gap: 4,
            }}
          >
            {selectedNode.id
              .split("/")
              .slice(0, -1)
              .map((part, i, arr) => (
                <span key={i} style={{ color: "#cbd5e1" }}>
                  {part}
                  {i < arr.length - 1 ? " /" : " /"}
                </span>
              ))}
            <span style={{ color: "#64748b", fontWeight: 500 }}>
              {selectedNode.label}
            </span>
          </div>
        </div>

        {/* Code area */}
        <div
          style={{
            flex: 1,
            overflow: "hidden",
            position: "relative",
            background: "#ffffff",
          }}
        >
          {isLoading ? (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 14,
                color: "#94a3b8",
                background: "#ffffff",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  border: "3px solid #f1f5f9",
                  borderTopColor: extColor,
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              <span
                style={{
                  fontSize: 12,
                  fontFamily: "var(--font-mono)",
                  color: "#94a3b8",
                }}
              >
                Đang đọc file...
              </span>
            </div>
          ) : (
            <div style={{ height: "100%", overflow: "auto" }}>
              <SyntaxHighlighter
                language={language}
                style={oneLight}
                customStyle={{
                  margin: 0,
                  padding: "20px 24px",
                  fontSize: 13,
                  lineHeight: 1.75,
                  background: "#ffffff",
                  fontFamily: "var(--font-mono)",
                  minHeight: "100%",
                }}
                showLineNumbers={true}
                lineNumberStyle={{
                  color: "#cbd5e1",
                  minWidth: 48,
                  paddingRight: 20,
                  userSelect: "none",
                  fontSize: 11,
                }}
                wrapLines={true}
                wrapLongLines={false}
              >
                {code}
              </SyntaxHighlighter>
            </div>
          )}
        </div>

        {/* Status bar */}
        <div
          style={{
            background: "#1E90FF",
            color: "rgba(255,255,255,0.85)",
            fontSize: 11,
            fontFamily: "var(--font-mono)",
            padding: "4px 16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
            <span
              style={{
                background: "rgba(255,255,255,0.2)",
                color: "#fff",
                padding: "1px 8px",
                borderRadius: 4,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.5px",
              }}
            >
              {language.toUpperCase()}
            </span>
            <span style={{ opacity: 0.7 }}>{selectedNode.id}</span>
          </div>
          <div
            style={{
              display: "flex",
              gap: 20,
              alignItems: "center",
              opacity: 0.8,
            }}
          >
            <span>Ln {lineCount}</span>
            <span>UTF-8</span>
            <span>CRLF</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeViewer;
