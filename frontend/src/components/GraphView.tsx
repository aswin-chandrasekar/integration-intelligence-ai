import { useEffect, useState, useCallback, useRef } from "react";
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  Panel,
} from "reactflow";
import "reactflow/dist/style.css";
import { Integration, getRiskAnalysis } from "../services/api";
import { ChevronDown, ChevronUp } from "lucide-react";

interface GraphViewProps {
  data?: Integration[];
  onSelectedSystemChange?: (system: string | null) => void;
}

const getRiskColor = (risk: string) => {
  switch (risk) {
    case "CRITICAL":
      return "#ef4444";
    case "HIGH":
      return "#f97316";
    case "MEDIUM":
      return "#eab308";
    case "LOW":
      return "#22c55e";
    default:
      return "#a8a29e";
  }
};

const GraphView = ({ data = [], onSelectedSystemChange }: GraphViewProps) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const [selectedEdge, setSelectedEdge] = useState<any>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [depth, setDepth] = useState<number>(1);
  const [direction, setDirection] = useState<string>("both"); // "upstream", "downstream", "both"
  const [riskData, setRiskData] = useState<any[]>([]);
  const [riskPanelCollapsed, setRiskPanelCollapsed] = useState<boolean>(false);

  // Keep track of positions so nodes don't jump on every click
  const nodePositions = useRef<Map<string, { x: number; y: number }>>(new Map());

  const getEdgeColor = (type?: string) => {
    switch (type) {
      case "SYNC_API": return "#f97316";
      case "DB": return "#3b82f6";
      case "FILE":
      case "BATCH": return "#a855f7";
      case "PUB_SUB": return "#22c55e";
      default: return "#a8a29e";
    }
  };

  const getRiskLevel = (systemName: string) => {
    const match = riskData.find(
      (r) =>
        r.system.toLowerCase() ===
        systemName.toLowerCase()
    );
    return match?.riskLevel || "LOW";
  };

  const updateGraph = useCallback(
    async (integrations: Integration[]) => {
      if (!integrations || integrations.length === 0) {
        setNodes([]);
        setEdges([]);
        return;
      }

      const nodesMap = new Map<string, Node>();
      const groupedEdges = new Map<string, {
        source: string;
        target: string;
        sourceName: string;
        targetName: string;
        types: Set<string>;
        items: Integration[];
      }>();

      // Coordinates will be computed dynamically below via Layered BFS Layout

      integrations.forEach((item) => {
        const sourceId = item.source.toLowerCase().replace(/\s+/g, "-");
        const targetId = item.target.toLowerCase().replace(/\s+/g, "-");
        const edgeKey = `${sourceId}_${targetId}`;

        // 1. Manage Nodes
        if (!nodesMap.has(sourceId)) {
          const sourceRisk = getRiskLevel(item.source);
          nodesMap.set(sourceId, {
            id: sourceId,
            data: { label: item.source },
            position: { x: 0, y: 0 }, // Positioned by layout engine below
            style: {
              background:
                selectedNode === sourceId
                  ? "var(--app-brand)"
                  : getRiskColor(sourceRisk),
              color:
                selectedNode === sourceId
                  ? "#ffffff"
                  : sourceRisk === "MEDIUM"
                    ? "#000000"
                    : "#ffffff",
              border:
                selectedNode === sourceId
                  ? "3px solid var(--app-text)"
                  : `2px solid ${getRiskColor(sourceRisk)}`,
              borderRadius: "10px",
              padding: "10px",
              width: 170,
              fontWeight: "bold",
              fontSize: "12px",
              boxShadow:
                sourceRisk === "CRITICAL"
                  ? "0 0 25px rgba(239,68,68,0.7)"
                  : sourceRisk === "HIGH"
                    ? "0 0 20px rgba(249,115,22,0.5)"
                    : "none",
            },
          });
        }

        if (!nodesMap.has(targetId)) {
          const targetRisk = getRiskLevel(item.target);
          nodesMap.set(targetId, {
            id: targetId,
            data: { label: item.target },
            position: { x: 0, y: 0 }, // Positioned by layout engine below
            style: {
              background:
                selectedNode === targetId
                  ? "var(--app-brand)"
                  : getRiskColor(targetRisk),
              color:
                selectedNode === targetId
                  ? "#ffffff"
                  : targetRisk === "MEDIUM"
                    ? "#000000"
                    : "#ffffff",
              border:
                selectedNode === targetId
                  ? "3px solid var(--app-text)"
                  : `2px solid ${getRiskColor(targetRisk)}`,
              borderRadius: "10px",
              padding: "10px",
              width: 170,
              fontWeight: "bold",
              fontSize: "12px",
              boxShadow:
                targetRisk === "CRITICAL"
                  ? "0 0 25px rgba(239,68,68,0.7)"
                  : targetRisk === "HIGH"
                    ? "0 0 20px rgba(249,115,22,0.5)"
                    : "none",
            },
          });
        }

        // 2. Group Edges
        if (!groupedEdges.has(edgeKey)) {
          groupedEdges.set(edgeKey, {
            source: sourceId,
            target: targetId,
            sourceName: item.source,
            targetName: item.target,
            types: new Set(),
            items: []
          });
        }
        const group = groupedEdges.get(edgeKey)!;
        group.types.add(item.type || "UNKNOWN");
        group.items.push(item);
      });

      const flowEdges: Edge[] = Array.from(groupedEdges.values()).map((group, idx) => {
        const typeList = Array.from(group.types);
        const mainType = typeList[0];
        const color = getEdgeColor(mainType);
        const count = group.items.length;

        return {
          id: `e-${group.source}-${group.target}`,
          source: group.source,
          target: group.target,
          label: count > 1 ? `${mainType} (+${count - 1})` : mainType,
          animated: true,
          style: { stroke: color, strokeWidth: 2 + Math.min(count, 5) }, // Thicker for more integrations
          labelStyle: { fill: color, fontWeight: 700, fontSize: 10 },
          data: {
            type: typeList.join(", "),
            integrations: group.items
          },
        };
      });

      // ==========================================
      // 3. LAYERED LAYOUT ENGINE (BFS RANKING)
      // ==========================================
      const nodeIds = Array.from(nodesMap.keys());
      const inDegree = new Map<string, number>();
      const adjList = new Map<string, string[]>();

      nodeIds.forEach(id => {
        inDegree.set(id, 0);
        adjList.set(id, []);
      });

      groupedEdges.forEach(edge => {
        const src = edge.source;
        const tgt = edge.target;
        if (adjList.has(src)) adjList.get(src)!.push(tgt);
        if (inDegree.has(tgt)) inDegree.set(tgt, inDegree.get(tgt)! + 1);
      });

      const ranks = new Map<string, number>();
      let queue: string[] = [];

      // Start BFS with roots (0 in-degree nodes)
      nodeIds.forEach(id => {
        if (inDegree.get(id) === 0) {
          ranks.set(id, 0);
          queue.push(id);
        }
      });

      // Fallback for fully cyclical or zero-in-degree-less graphs
      if (queue.length === 0 && nodeIds.length > 0) {
        ranks.set(nodeIds[0], 0);
        queue.push(nodeIds[0]);
      }

      const visited = new Set<string>();
      while (queue.length > 0) {
        const current = queue.shift()!;
        if (visited.has(current)) continue;
        visited.add(current);

        const currentRank = ranks.get(current) || 0;
        const neighbors = adjList.get(current) || [];

        neighbors.forEach(neighbor => {
          const nextRank = Math.max(ranks.get(neighbor) || 0, currentRank + 1);
          ranks.set(neighbor, nextRank);
          if (!visited.has(neighbor)) {
            queue.push(neighbor);
          }
        });
      }

      // Ensure every node gets placed in a rank
      nodeIds.forEach(id => {
        if (!ranks.has(id)) ranks.set(id, 0);
      });

      // Group nodes by calculated ranks for precise Y coordinate distribution
      const nodesByRank = new Map<number, string[]>();
      ranks.forEach((rank, nodeId) => {
        if (!nodesByRank.has(rank)) nodesByRank.set(rank, []);
        nodesByRank.get(rank)!.push(nodeId);
      });

      // Compute clean, non-overlapping spacing
      const columnWidth = 260;
      const rowHeight = 130;

      nodesByRank.forEach((nodesInRank, rank) => {
        nodesInRank.forEach((nodeId, index) => {
          const node = nodesMap.get(nodeId);
          if (node) {
            node.position = {
              x: rank * columnWidth + 50,
              // Centered distribution vertically to look organized
              y: (index - (nodesInRank.length - 1) / 2) * rowHeight + 350,
            };
          }
        });
      });

      let highlightedNodes = new Set<string>();
      let highlightedEdgeKeys = new Set<string>();
      if (selectedNode) {
        try {
          const response = await fetch(`/api/impact?node=${selectedNode}&depth=${depth}&direction=${direction}`);
          const result = await response.json();
          highlightedNodes = new Set([selectedNode, ...(result.nodes || [])]);
          highlightedEdgeKeys = new Set(result.edge_keys || []);
        } catch (err) {
          console.error("Impact fetch failed:", err);
          highlightedNodes = new Set([selectedNode]);
        }
      }

      setNodes(
        Array.from(nodesMap.values()).map((node) => ({
          ...node,
          style: {
            ...node.style,
            opacity: !selectedNode || highlightedNodes.has(node.id) ? 1 : 0.2,
          },
        }))
      );

      setEdges(
        flowEdges.map((edge) => {
          let isHighlighted = !selectedNode || highlightedEdgeKeys.has(`${edge.source}_${edge.target}`);

          // Enforce direction locally to overcome any backend proxy defaults
          if (selectedNode && isHighlighted && direction !== "both") {
            if (direction === "downstream" && !highlightedNodes.has(edge.source)) isHighlighted = false;
            if (direction === "upstream" && !highlightedNodes.has(edge.target)) isHighlighted = false;
          }

          return {
            ...edge,
            animated: !!selectedNode ? isHighlighted : true,
            style: {
              ...edge.style,
              opacity: isHighlighted ? 1 : 0.05,
            },
          };
        })
      );
    },
    [setNodes, setEdges, selectedNode, depth, direction, riskData]
  );

  useEffect(() => {

    getRiskAnalysis()
      .then((data) => {
        console.log("Risk Analysis:", data);
        setRiskData(data);
      })
      .catch((err) => {
        console.error("Risk analysis failed:", err);
      });

  }, []);


  useEffect(() => {
    updateGraph(data);
  }, [data, updateGraph]);

  useEffect(() => {
    onSelectedSystemChange?.(selectedNode);
  }, [selectedNode, onSelectedSystemChange]);

  return (
    <div style={{ height: "100%", minHeight: "600px", width: "100%" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={(event, node) => setSelectedNode(node.id)}
        onPaneClick={() => setSelectedNode(null)}
        onEdgeClick={(event, edge) => setSelectedEdge(edge)}
        fitView
        style={{ background: "var(--app-bg)", transition: "background-color 0.2s ease" }}
      >
        <Background color="var(--app-border)" gap={20} />
        <Controls />

        {/* Blast Radius Controls + Legend */}
        <Panel position="top-left">
          <div style={{
            background: "var(--app-surface)",
            padding: "12px",
            borderRadius: "8px",
            border: "1px solid var(--app-border)",
            color: "var(--app-text)",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            width: "280px"
          }}>
            <div>
              <p style={{ fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", color: "var(--app-text)", marginBottom: "4px" }}>
                Direction
              </p>
              <div style={{ display: "flex", gap: "4px" }}>
                {[
                  { val: "upstream", lbl: "Up" },
                  { val: "downstream", lbl: "Down" },
                  { val: "both", lbl: "Both" }
                ].map((dir) => (
                  <button
                    key={dir.val}
                    onClick={() => setDirection(dir.val)}
                    style={{
                      padding: "3px 6px",
                      fontSize: "11px",
                      fontWeight: "bold",
                      background: direction === dir.val ? "var(--app-brand)" : "var(--app-bg)",
                      color: direction === dir.val ? "white" : "var(--app-text-muted)",
                      border: "1px solid var(--app-border)",
                      borderRadius: "4px",
                      cursor: "pointer"
                    }}
                  >
                    {dir.lbl}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p style={{ fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", color: "var(--app-text)", marginBottom: "4px" }}>
                Depth
              </p>
              <div style={{ display: "flex", gap: "4px" }}>
                {[1, 2, 3].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDepth(d)}
                    style={{
                      padding: "3px 8px",
                      fontSize: "11px",
                      fontWeight: "bold",
                      background: depth === d ? "var(--app-brand)" : "var(--app-bg)",
                      color: depth === d ? "white" : "var(--app-text-muted)",
                      border: "1px solid var(--app-border)",
                      borderRadius: "4px",
                      cursor: "pointer",
                      minWidth: "24px"
                    }}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div style={{ borderTop: "1px solid var(--app-border)", paddingTop: "8px" }}>
              <p style={{ fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", color: "var(--app-text)", marginBottom: "4px" }}>
                Risk Levels
              </p>
              <div style={{ display: "flex", gap: "8px", fontSize: "10px", marginBottom: "6px" }}>
                <div style={{ color: "#ef4444" }}>🔴 CRITICAL</div>
                <div style={{ color: "#f97316" }}>🟠 HIGH</div>
              </div>
              <div style={{ display: "flex", gap: "8px", fontSize: "10px" }}>
                <div style={{ color: "#eab308" }}>🟡 MEDIUM</div>
                <div style={{ color: "#22c55e" }}>🟢 LOW</div>
              </div>

              <p style={{ fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", color: "var(--app-text)", marginBottom: "4px" }}>
                Integration Types
              </p>
              <div style={{ display: "flex", gap: "8px", fontSize: "10px", marginBottom: "4px" }}>
                <div>🟠 API</div>
                <div>🔵 DB</div>
              </div>
              <div style={{ display: "flex", gap: "8px", fontSize: "10px" }}>
                <div>🟣 File</div>
                <div>🟢 Pub/Sub</div>
              </div>
            </div>
          </div>
        </Panel>

        {/* System Count & Architecture Risk Ranking */}
        <Panel position="top-left" style={{ marginTop: "290px" }}>
          <div
            style={{
              background: "var(--app-surface)",
              padding: "12px",
              borderRadius: "10px",
              border: "1px solid var(--app-border)",
              width: "280px",
              color: "var(--app-text)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
            }}
          >
            {/* System Count Header */}
            <div
              style={{
                fontSize: "12px",
                fontWeight: "bold",
                textTransform: "uppercase",
                color: "var(--app-text-muted)",
                marginBottom: "12px",
                paddingBottom: "8px",
                borderBottom: "1px solid var(--app-border)"
              }}
            >
              📊 {nodes.length} Systems Detected
            </div>

            {/* Risk Ranking Section */}
            <div>
              <button
                onClick={() => setRiskPanelCollapsed(!riskPanelCollapsed)}
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 0",
                  background: "none",
                  border: "none",
                  color: "var(--app-text)",
                  cursor: "pointer",
                  fontWeight: "bold",
                  fontSize: "12px",
                  textTransform: "uppercase",
                }}
              >
                🎯 Architecture Risk Ranking
                {riskPanelCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
              </button>

              {!riskPanelCollapsed && (
                <div
                  style={{
                    maxHeight: "190px",
                    overflowY: "auto",
                    marginTop: "8px",
                  }}
                >
                  {riskData.slice(0, 8).map((risk, idx) => (
                    <div
                      key={idx}
                      style={{
                        marginBottom: "10px",
                        padding: "8px",
                        borderRadius: "6px",
                        background: "var(--app-bg)",
                        border: "1px solid var(--app-border)",
                        borderLeft: `5px solid ${getRiskColor(
                          risk.riskLevel
                        )}`,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: "bold",
                            fontSize: "12px",
                          }}
                        >
                          {risk.system}
                        </span>

                        <span
                          style={{
                            color: getRiskColor(risk.riskLevel),
                            fontWeight: "bold",
                            fontSize: "11px",
                          }}
                        >
                          {risk.riskLevel}
                        </span>
                      </div>

                      <div
                        style={{
                          marginTop: "6px",
                          fontSize: "11px",
                          color: "var(--app-text-muted)",
                        }}
                      >
                        Risk Score: {risk.riskScore}
                      </div>

                      <div
                        style={{
                          fontSize: "11px",
                          color: "var(--app-text-muted)",
                          opacity: 0.7
                        }}
                      >
                        Fan-Out: {risk.fanOut} | Sync Depth: {risk.syncDepth}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Panel>

        {/* Edge Details */}
        {selectedEdge && (
          <Panel position="bottom-right">
            <div style={{
              background: "var(--app-surface)",
              padding: "16px",
              border: "1px solid var(--app-border)",
              borderRadius: "8px",
              maxHeight: "300px",
              overflowY: "auto",
              color: "var(--app-text)",
              width: "480px"
            }}>
              <p style={{ fontWeight: "bold", borderBottom: "1px solid var(--app-border)", paddingBottom: "8px", marginBottom: "12px" }}>
                Integrations ({selectedEdge.data?.integrations?.length || 0})
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {selectedEdge.data?.integrations?.map((int: Integration, i: number) => (
                  <div key={i} style={{ fontSize: "12px", background: "var(--app-bg)", border: "1px solid var(--app-border)", padding: "8px", borderRadius: "4px" }}>
                    <p style={{ color: "#f97316", fontWeight: "bold" }}>{int.type}</p>
                    <p style={{ color: "var(--app-text-muted)", marginTop: "4px", wordBreak: "break-all" }}>
                      <b>File:</b> {int.file}
                    </p>
                    <p style={{ color: "var(--app-text-muted)" }}>
                      <b>Line:</b> {int.line}
                    </p>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setSelectedEdge(null)}
                style={{
                  marginTop: "16px",
                  width: "100%",
                  padding: "6px",
                  background: "var(--app-brand)",
                  border: "none",
                  borderRadius: "4px",
                  color: "white",
                  cursor: "pointer",
                  fontWeight: "bold"
                }}
              >
                Close
              </button>
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
};

export default GraphView;