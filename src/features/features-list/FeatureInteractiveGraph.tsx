import React, { useState, useEffect, useRef, useCallback } from "react";

export const parseMermaid = (mermaidText: string) => {
  const nodes: { id: string; label: string }[] = [];
  const edges: { source: string; target: string; label?: string }[] = [];
  const nodeSet = new Set<string>();

  if (!mermaidText) return { nodes, edges };

  const lines = mermaidText.split("\n");

  const nodeDefRegex =
    /([a-zA-Z0-9_\-]+)\s*(?:\["([^"]+)"\]|\[([^\]]+)\]|\("([^"]+)"\)|\(([^)]+)\)|\{"([^"]+)"\}|\{([^}]+)\})/g;

  const edgeRegex = /([a-zA-Z0-9_\-]+)\s*(?:-->|-\.->|==>)\s*([a-zA-Z0-9_\-]+)/;
  const edgeWithLabelRegex =
    /([a-zA-Z0-9_\-]+)\s*(?:--|-\.)\s*([^-\s>]+)\s*(?:-->|\.->)\s*([a-zA-Z0-9_\-]+)/;
  const edgePipeLabelRegex =
    /([a-zA-Z0-9_\-]+)\s*(?:-->|-\.->|==>)\|([^|]+)\|\s*([a-zA-Z0-9_\-]+)/;

  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith("graph ") || line.startsWith("flowchart "))
      continue;

    let match;
    nodeDefRegex.lastIndex = 0;
    while ((match = nodeDefRegex.exec(line)) !== null) {
      const id = match[1];
      const label =
        match[2] ||
        match[3] ||
        match[4] ||
        match[5] ||
        match[6] ||
        match[7] ||
        id;
      if (!nodeSet.has(id)) {
        nodeSet.add(id);
        nodes.push({ id, label });
      }
    }

    const pipeMatch = line.match(edgePipeLabelRegex);
    if (pipeMatch) {
      const [, source, label, target] = pipeMatch;
      edges.push({
        source: source.trim(),
        target: target.trim(),
        label: label.trim(),
      });
      if (!nodeSet.has(source.trim())) {
        nodeSet.add(source.trim());
        nodes.push({ id: source.trim(), label: source.trim() });
      }
      if (!nodeSet.has(target.trim())) {
        nodeSet.add(target.trim());
        nodes.push({ id: target.trim(), label: target.trim() });
      }
      continue;
    }

    const arrowLabelMatch = line.match(edgeWithLabelRegex);
    if (arrowLabelMatch) {
      const [, source, label, target] = arrowLabelMatch;
      edges.push({
        source: source.trim(),
        target: target.trim(),
        label: label.replace(/"/g, "").trim(),
      });
      if (!nodeSet.has(source.trim())) {
        nodeSet.add(source.trim());
        nodes.push({ id: source.trim(), label: source.trim() });
      }
      if (!nodeSet.has(target.trim())) {
        nodeSet.add(target.trim());
        nodes.push({ id: target.trim(), label: target.trim() });
      }
      continue;
    }

    const arrowMatch = line.match(edgeRegex);
    if (arrowMatch) {
      const [, source, target] = arrowMatch;
      edges.push({ source: source.trim(), target: target.trim() });
      if (!nodeSet.has(source.trim())) {
        nodeSet.add(source.trim());
        nodes.push({ id: source.trim(), label: source.trim() });
      }
      if (!nodeSet.has(target.trim())) {
        nodeSet.add(target.trim());
        nodes.push({ id: target.trim(), label: target.trim() });
      }
    }
  }

  return { nodes, edges };
};

const getEdgePoint = (
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  w: number,
  h: number,
) => {
  const dx = toX - fromX;
  const dy = toY - fromY;
  if (dx === 0 && dy === 0) return { x: toX, y: toY };

  const tX = (dx > 0 ? w / 2 : -w / 2) / dx;
  const tY = (dy > 0 ? h / 2 : -h / 2) / dy;

  const t = Math.min(Math.abs(tX), Math.abs(tY));
  return {
    x: toX - t * dx,
    y: toY - t * dy,
  };
};

const parseNodeLabel = (label: string) => {
  const parts = label.split(".");
  if (parts.length >= 2) {
    const method = parts.pop()!;
    const className = parts.pop()!;
    return { className, method: method + "()" };
  }
  return { className: "", method: label };
};

const computeLayout = (
  nodes: { id: string; label: string }[],
  edges: { source: string; target: string }[],
  direction: "LR" | "TD",
) => {
  const nodePositions: Record<string, { x: number; y: number }> = {};
  if (nodes.length === 0) return nodePositions;

  const adj: Record<string, string[]> = {};
  const inDegree: Record<string, number> = {};
  const parents: Record<string, string[]> = {};

  nodes.forEach((n) => {
    adj[n.id] = [];
    inDegree[n.id] = 0;
    parents[n.id] = [];
  });

  edges.forEach((e) => {
    if (adj[e.source] && adj[e.target] !== undefined) {
      adj[e.source].push(e.target);
      parents[e.target].push(e.source);
      inDegree[e.target] = (inDegree[e.target] || 0) + 1;
    }
  });

  const level: Record<string, number> = {};
  const queue: string[] = [];

  nodes.forEach((n) => {
    if (inDegree[n.id] === 0) {
      level[n.id] = 0;
      queue.push(n.id);
    }
  });

  if (queue.length === 0 && nodes.length > 0) {
    const firstId = nodes[0].id;
    level[firstId] = 0;
    queue.push(firstId);
  }

  while (queue.length > 0) {
    const curr = queue.shift()!;
    const currLevel = level[curr] || 0;
    adj[curr].forEach((next) => {
      if (level[next] === undefined) {
        level[next] = currLevel + 1;
        queue.push(next);
      } else {
        level[next] = Math.max(level[next], currLevel + 1);
      }
    });
  }

  nodes.forEach((n) => {
    if (level[n.id] === undefined) {
      level[n.id] = 0;
    }
  });

  const levels: Record<number, string[]> = {};
  nodes.forEach((n) => {
    const lvl = level[n.id];
    if (!levels[lvl]) levels[lvl] = [];
    levels[lvl].push(n.id);
  });

  // Barycenter heuristic to reduce edge crossings
  const maxLvl = Math.max(...Object.keys(levels).map(Number));
  for (let i = 1; i <= maxLvl; i++) {
    const prevLevelNodes = levels[i - 1] || [];
    const currentLevelNodes = levels[i] || [];

    currentLevelNodes.sort((a, b) => {
      const getAvgParentPos = (nodeId: string) => {
        const p = parents[nodeId].filter((pId) => prevLevelNodes.includes(pId));
        if (p.length === 0) return 0;
        const sum = p.reduce(
          (acc, pId) => acc + prevLevelNodes.indexOf(pId),
          0,
        );
        return sum / p.length;
      };
      return getAvgParentPos(a) - getAvgParentPos(b);
    });
  }

  const stepX = 350;
  const stepY = 160;

  if (direction === "LR") {
    Object.keys(levels).forEach((lvlStr) => {
      const lvl = Number(lvlStr);
      const levelNodes = levels[lvl];
      const totalH = (levelNodes.length - 1) * stepY;
      levelNodes.forEach((nodeId, idx) => {
        nodePositions[nodeId] = {
          x: lvl * stepX + 50,
          y: idx * stepY - totalH / 2 + 150,
        };
      });
    });
  } else {
    Object.keys(levels).forEach((lvlStr) => {
      const lvl = Number(lvlStr);
      const levelNodes = levels[lvl];
      const totalW = (levelNodes.length - 1) * stepX;
      levelNodes.forEach((nodeId, idx) => {
        nodePositions[nodeId] = {
          x: idx * stepX - totalW / 2 + 250,
          y: lvl * stepY + 50,
        };
      });
    });
  }

  return nodePositions;
};

interface FeatureInteractiveGraphProps {
  onNodeClick?: (nodeId: string, label: string) => void;
  onToggleFullscreen?: (isFull: boolean) => void;
  parsedGraph: {
    nodes: { id: string; label: string }[];
    edges: { source: string; target: string; label?: string }[];
  };
  entryPoint: string;
}

export const FeatureInteractiveGraph = ({
  parsedGraph,
  entryPoint,
  onNodeClick,
  onToggleFullscreen,
}: FeatureInteractiveGraphProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDraggingNode, setIsDraggingNode] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [nodePositions, setNodePositions] = useState<
    Record<string, { x: number; y: number }>
  >({});
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [layoutDir, setLayoutDir] = useState<"LR" | "TD">("LR");
  const hasAutoFitted = useRef(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (parsedGraph.nodes.length > 0) {
      const positions = computeLayout(
        parsedGraph.nodes,
        parsedGraph.edges,
        layoutDir,
      );
      setNodePositions(positions);
      hasAutoFitted.current = false;
    }
  }, [parsedGraph, layoutDir]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
        onToggleFullscreen?.(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen, onToggleFullscreen]);

  const autoFit = useCallback(
    (positions: Record<string, { x: number; y: number }>) => {
      const coords = Object.values(positions);
      if (coords.length === 0 || dimensions.width === 0) return;

      let minX = Infinity,
        maxX = -Infinity;
      let minY = Infinity,
        maxY = -Infinity;

      coords.forEach((pos) => {
        if (pos.x < minX) minX = pos.x;
        if (pos.x > maxX) maxX = pos.x;
        if (pos.y < minY) minY = pos.y;
        if (pos.y > maxY) maxY = pos.y;
      });

      const NODE_WIDTH = 170;
      const NODE_HEIGHT = 48;

      maxX += NODE_WIDTH;
      maxY += NODE_HEIGHT;

      const graphW = maxX - minX;
      const graphH = maxY - minY;

      const scaleX = (dimensions.width - 60) / graphW;
      const scaleY = (dimensions.height - 60) / graphH;
      const nextScale = Math.min(Math.max(Math.min(scaleX, scaleY), 0.25), 1.5);

      const centerX = minX + graphW / 2;
      const centerY = minY + graphH / 2;

      setTransform({
        x: dimensions.width / 2 - centerX * nextScale,
        y: dimensions.height / 2 - centerY * nextScale,
        scale: nextScale,
      });
    },
    [dimensions],
  );

  useEffect(() => {
    if (
      Object.keys(nodePositions).length > 0 &&
      dimensions.width > 0 &&
      !hasAutoFitted.current
    ) {
      autoFit(nodePositions);
      hasAutoFitted.current = true;
    }
  }, [nodePositions, dimensions, autoFit]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dimensions.width === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    canvas.style.width = `${dimensions.width}px`;
    canvas.style.height = `${dimensions.height}px`;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    ctx.save();
    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.scale, transform.scale);

    const NODE_WIDTH = 170;
    const NODE_HEIGHT = 48;

    const drawRoundedRect = (
      c: CanvasRenderingContext2D,
      x: number,
      y: number,
      w: number,
      h: number,
      r: number,
    ) => {
      c.beginPath();
      c.moveTo(x + r, y);
      c.lineTo(x + w - r, y);
      c.quadraticCurveTo(x + w, y, x + w, y + r);
      c.lineTo(x + w, y + h - r);
      c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      c.lineTo(x + r, y + h);
      c.quadraticCurveTo(x, y + h, x, y + h - r);
      c.lineTo(x, y + r);
      c.quadraticCurveTo(x, y, x + r, y);
      c.closePath();
    };

    // Edges
    parsedGraph.edges.forEach((edge) => {
      const sourcePos = nodePositions[edge.source];
      const targetPos = nodePositions[edge.target];
      if (!sourcePos || !targetPos) return;

      const scx = sourcePos.x + NODE_WIDTH / 2;
      const scy = sourcePos.y + NODE_HEIGHT / 2;
      const tcx = targetPos.x + NODE_WIDTH / 2;
      const tcy = targetPos.y + NODE_HEIGHT / 2;

      const start = getEdgePoint(tcx, tcy, scx, scy, NODE_WIDTH, NODE_HEIGHT);
      const end = getEdgePoint(scx, scy, tcx, tcy, NODE_WIDTH, NODE_HEIGHT);

      const isHoveredEdge =
        hoveredNodeId === edge.source || hoveredNodeId === edge.target;

      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.strokeStyle = isHoveredEdge ? "#3b82f6" : "#cbd5e1";
      ctx.lineWidth = isHoveredEdge ? 2.5 : 1.5;
      ctx.stroke();

      const dx = tcx - scx;
      const dy = tcy - scy;
      const angle = Math.atan2(dy, dx);

      ctx.save();
      ctx.translate(end.x, end.y);
      ctx.rotate(angle);
      ctx.fillStyle = isHoveredEdge ? "#3b82f6" : "#94a3b8";
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-8, -4);
      ctx.lineTo(-8, 4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      if (edge.label) {
        const mx = (start.x + end.x) / 2;
        const my = (start.y + end.y) / 2;

        ctx.save();
        ctx.font = "bold 9px var(--font-mono)";
        const textWidth = ctx.measureText(edge.label).width;
        const paddingW = 8;
        const boxW = textWidth + paddingW * 2;
        const boxH = 14;

        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = isHoveredEdge ? "#3b82f6" : "#cbd5e1";
        ctx.lineWidth = 1;
        drawRoundedRect(ctx, mx - boxW / 2, my - boxH / 2, boxW, boxH, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isHoveredEdge ? "#1d4ed8" : "#475569";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(edge.label, mx, my);
        ctx.restore();
      }
    });

    // Nodes
    parsedGraph.nodes.forEach((node) => {
      const pos = nodePositions[node.id];
      if (!pos) return;

      const isHovered = hoveredNodeId === node.id;
      const isEntry =
        entryPoint &&
        node.label.toLowerCase().includes(entryPoint.toLowerCase());

      let bgGradient = ctx.createLinearGradient(
        pos.x,
        pos.y,
        pos.x,
        pos.y + NODE_HEIGHT,
      );
      let borderColor = "#cbd5e1";
      let borderWidth = 1.5;
      let titleColor = "#64748b";
      let methodColor = "#1e293b";

      if (isHovered) {
        bgGradient.addColorStop(0, "#eff6ff");
        bgGradient.addColorStop(1, "#dbeafe");
        borderColor = "#3b82f6";
        borderWidth = 2.5;
        titleColor = "#2563eb";
        methodColor = "#1e40af";
      } else if (isEntry) {
        bgGradient.addColorStop(0, "#ecfdf5");
        bgGradient.addColorStop(1, "#d1fae5");
        borderColor = "#10b981";
        borderWidth = 2;
        titleColor = "#059669";
        methodColor = "#065f46";
      } else {
        bgGradient.addColorStop(0, "#ffffff");
        bgGradient.addColorStop(1, "#f8fafc");
        borderColor = "#e2e8f0";
        borderWidth = 1.5;
        titleColor = "#64748b";
        methodColor = "#1e293b";
      }

      if (isHovered) {
        ctx.shadowColor = "rgba(59, 130, 246, 0.2)";
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 4;
      }

      ctx.fillStyle = bgGradient;
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = borderWidth;
      drawRoundedRect(ctx, pos.x, pos.y, NODE_WIDTH, NODE_HEIGHT, 8);
      ctx.fill();
      ctx.stroke();

      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;

      const { className, method } = parseNodeLabel(node.label);

      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";

      if (className) {
        ctx.font = "9px var(--font-main)";
        ctx.fillStyle = titleColor;
        ctx.fillText(className, pos.x + NODE_WIDTH / 2, pos.y + 18);

        ctx.font = "bold 11px var(--font-mono)";
        ctx.fillStyle = methodColor;
        ctx.fillText(method, pos.x + NODE_WIDTH / 2, pos.y + 34);
      } else {
        ctx.font = "bold 11px var(--font-mono)";
        ctx.fillStyle = methodColor;
        ctx.textBaseline = "middle";
        ctx.fillText(method, pos.x + NODE_WIDTH / 2, pos.y + NODE_HEIGHT / 2);
      }

      if (isEntry) {
        ctx.save();
        ctx.font = "bold 7px var(--font-main)";
        ctx.fillStyle = "#059669";
        const tagW = ctx.measureText("ENTRY").width + 6;
        ctx.fillStyle = "#ecfdf5";
        ctx.strokeStyle = "#10b981";
        ctx.lineWidth = 0.5;
        drawRoundedRect(ctx, pos.x + 8, pos.y - 6, tagW, 10, 3);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#047857";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText("ENTRY", pos.x + 11, pos.y - 1);
        ctx.restore();
      }
    });

    ctx.restore();
  }, [
    dimensions,
    nodePositions,
    transform,
    draggedNodeId,
    hoveredNodeId,
    parsedGraph,
    entryPoint,
  ]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const gx = (mx - transform.x) / transform.scale;
    const gy = (my - transform.y) / transform.scale;

    const NODE_WIDTH = 170;
    const NODE_HEIGHT = 48;
    const clickedNode = Object.entries(nodePositions).find(([_, pos]) => {
      return (
        gx >= pos.x &&
        gx <= pos.x + NODE_WIDTH &&
        gy >= pos.y &&
        gy <= pos.y + NODE_HEIGHT
      );
    });

    if (clickedNode) {
      setDraggedNodeId(clickedNode[0]);
      setIsDraggingNode(false);
      setDragOffset({
        x: gx - clickedNode[1].x,
        y: gy - clickedNode[1].y,
      });
    } else {
      setIsPanning(true);
      setPanStart({
        x: e.clientX - transform.x,
        y: e.clientY - transform.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const gx = (mx - transform.x) / transform.scale;
    const gy = (my - transform.y) / transform.scale;

    const NODE_WIDTH = 170;
    const NODE_HEIGHT = 48;

    if (draggedNodeId) {
      setIsDraggingNode(true);
      setNodePositions((prev) => ({
        ...prev,
        [draggedNodeId]: {
          x: gx - dragOffset.x,
          y: gy - dragOffset.y,
        },
      }));
    } else if (isPanning) {
      setTransform((prev) => ({
        ...prev,
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      }));
    } else {
      const hovered = Object.entries(nodePositions).find(([_, pos]) => {
        return (
          gx >= pos.x &&
          gx <= pos.x + NODE_WIDTH &&
          gy >= pos.y &&
          gy <= pos.y + NODE_HEIGHT
        );
      });
      setHoveredNodeId(hovered ? hovered[0] : null);
    }
  };

  const handleMouseUp = (
    e: React.MouseEvent<HTMLCanvasElement> | React.MouseEvent,
  ) => {
    if (draggedNodeId && !isDraggingNode && onNodeClick) {
      const node = parsedGraph.nodes.find((n) => n.id === draggedNodeId);
      if (node) onNodeClick(node.id, node.label);
    }

    setDraggedNodeId(null);
    setIsPanning(false);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const zoomIntensity = 0.1;
    const scroll = e.deltaY < 0 ? 1 : -1;
    const zoomFactor = Math.exp(scroll * zoomIntensity);

    const nextScale = Math.min(Math.max(transform.scale * zoomFactor, 0.15), 3);

    setTransform((prev) => ({
      x: mx - (mx - prev.x) * (nextScale / prev.scale),
      y: my - (my - prev.y) * (nextScale / prev.scale),
      scale: nextScale,
    }));
  };

  const toolbarBtnStyle: React.CSSProperties = {
    border: "none",
    background: "transparent",
    padding: "6px",
    borderRadius: "6px",
    cursor: "pointer",
    color: "#475569",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.15s",
  };

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: isFullscreen ? "100%" : "500px",
        position: isFullscreen ? "fixed" : "relative",
        top: isFullscreen ? 0 : "auto",
        left: isFullscreen ? 0 : "auto",
        right: isFullscreen ? 0 : "auto",
        bottom: isFullscreen ? 0 : "auto",
        zIndex: isFullscreen ? 9999 : 1,
        border: isFullscreen ? "none" : "1px solid rgba(226, 232, 240, 0.8)",
        borderRadius: isFullscreen ? 0 : "12px",
        background: "radial-gradient(#e2e8f0 1.2px, #f8fafc 1.2px)",
        backgroundSize: "20px 20px",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onDoubleClick={() => autoFit(nodePositions)}
        style={{
          display: "block",
          cursor: isPanning ? "grabbing" : "default",
          width: "100%",
          height: "100%",
        }}
      />

      {/* Floating Toolbar */}
      <div
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          zIndex: 10,
          display: "flex",
          gap: "6px",
          background: "rgba(255, 255, 255, 0.85)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(0,0,0,0.06)",
          padding: "4px",
          borderRadius: "8px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
        }}
      >
        <button
          onClick={() => autoFit(nodePositions)}
          title="Căn giữa đồ thị"
          style={toolbarBtnStyle}
        >
          <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>

        <div
          style={{
            width: 1,
            background: "rgba(0,0,0,0.08)",
            margin: "4px 2px",
          }}
        />

        <button
          onClick={() => setLayoutDir("LR")}
          title="Sắp xếp Ngang (Left-to-Right)"
          style={{
            ...toolbarBtnStyle,
            background:
              layoutDir === "LR" ? "rgba(37, 99, 235, 0.1)" : "transparent",
            color: layoutDir === "LR" ? "#2563eb" : "#475569",
          }}
        >
          <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>

        <button
          onClick={() => setLayoutDir("TD")}
          title="Sắp xếp Dọc (Top-to-Down)"
          style={{
            ...toolbarBtnStyle,
            background:
              layoutDir === "TD" ? "rgba(37, 99, 235, 0.1)" : "transparent",
            color: layoutDir === "TD" ? "#2563eb" : "#475569",
          }}
        >
          <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{ transform: "rotate(90deg)" }}
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>

        <div
          style={{
            width: 1,
            background: "rgba(0,0,0,0.08)",
            margin: "4px 2px",
          }}
        />

        <button
          onClick={() => {
            setTransform((prev) => ({
              ...prev,
              scale: Math.min(prev.scale * 1.2, 3),
            }));
          }}
          title="Phóng to"
          style={toolbarBtnStyle}
        >
          <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>

        <button
          onClick={() => {
            setTransform((prev) => ({
              ...prev,
              scale: Math.max(prev.scale / 1.2, 0.15),
            }));
          }}
          title="Thu nhỏ"
          style={toolbarBtnStyle}
        >
          <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M5 12h14" />
          </svg>
        </button>

        <div
          style={{
            width: 1,
            background: "rgba(0,0,0,0.08)",
            margin: "4px 2px",
          }}
        />

        <button
          onClick={() => {
            const newVal = !isFullscreen;
            setIsFullscreen(newVal);
            onToggleFullscreen?.(newVal);
          }}
          style={{
            border: "none",
            background: "transparent",
            padding: "6px",
            borderRadius: "6px",
            cursor: "pointer",
            color: "#475569",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.15s",
          }}
          title={isFullscreen ? "Thu nhỏ (Esc)" : "Phóng to toàn màn hình"}
        >
          {isFullscreen ? (
            <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
              <path
                fillRule="evenodd"
                d="M5 8a1 1 0 011-1h3V4a1 1 0 112 0v3h3a1 1 0 110 2H6a1 1 0 01-1-1zm0 4a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
              <path
                fillRule="evenodd"
                d="M3 4a1 1 0 011-1h4a1 1 0 110 2H5v3a1 1 0 11-2 0V4zm14 0a1 1 0 00-1-1h-4a1 1 0 100 2h3v3a1 1 0 102 0V4zM4 16a1 1 0 001 1h4a1 1 0 100-2H5v-3a1 1 0 10-2 0v4zm12 1a1 1 0 001-1v-4a1 1 0 10-2 0v3h-3a1 1 0 100 2h4z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Floating Instructions Legend (bottom-right) */}
      <div
        style={{
          position: "absolute",
          bottom: 12,
          right: 12,
          background: "rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(4px)",
          border: "1px solid rgba(0,0,0,0.05)",
          borderRadius: "6px",
          padding: "6px 10px",
          fontSize: "10px",
          color: "#64748b",
          boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          width="11"
          height="11"
          style={{ color: "#3b82f6" }}
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
        Kéo để di chuyển · Cuộn để zoom · Kéo thả nút để sắp xếp
      </div>
    </div>
  );
};
