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
import { Integration } from "../services/api";

interface GraphViewProps {
  data?: Integration[];
}

const GraphView = ({ data = [] }: GraphViewProps) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const [selectedEdge, setSelectedEdge] = useState<any>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [depth, setDepth] = useState<number>(1);

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

      const getPos = (id: string) => {
        if (!nodePositions.current.has(id)) {
          nodePositions.current.set(id, {
            x: Math.random() * 800,
            y: Math.random() * 500,
          });
        }
        return nodePositions.current.get(id)!;
      };

      integrations.forEach((item) => {
        const sourceId = item.source.toLowerCase().replace(/\s+/g, "-");
        const targetId = item.target.toLowerCase().replace(/\s+/g, "-");
        const edgeKey = `${sourceId}_${targetId}`;

        // 1. Manage Nodes
        if (!nodesMap.has(sourceId)) {
          nodesMap.set(sourceId, {
            id: sourceId,
            data: { label: item.source },
            position: getPos(sourceId),
            style: {
              background: "#f97316",
              color: "#fff",
              borderRadius: "8px",
              border: "1px solid #92400e",
              fontWeight: "bold",
              fontSize: "12px",
              width: 150,
            },
          });
        }
        if (!nodesMap.has(targetId)) {
          nodesMap.set(targetId, {
            id: targetId,
            data: { label: item.target },
            position: getPos(targetId),
            style: {
              background: "#0c0a09",
              color: "#d97706",
              borderRadius: "8px",
              border: `2px solid #d97706`,
              fontWeight: "bold",
              fontSize: "12px",
              width: 150,
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

      let highlightedNodes = new Set<string>();
      if (selectedNode) {
        try {
          const response = await fetch(`/api/impact?node=${selectedNode}&depth=${depth}`);
          const result = await response.json();
          highlightedNodes = new Set([selectedNode, ...result.nodes]);
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
        flowEdges.map((edge) => ({
          ...edge,
          style: {
            ...edge.style,
            opacity: !selectedNode || (highlightedNodes.has(edge.source) && highlightedNodes.has(edge.target)) ? 1 : 0.1,
          },
        }))
      );
    },
    [setNodes, setEdges, selectedNode, depth]
  );

  useEffect(() => {
    updateGraph(data);
  }, [data, updateGraph]);

  return (
    <div style={{ height: "100%", minHeight: "400px", width: "100%" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={(event, node) => setSelectedNode(node.id)}
        onPaneClick={() => setSelectedNode(null)}
        onEdgeClick={(event, edge) => setSelectedEdge(edge)}
        fitView
        style={{ background: "#0c0a09" }}
      >
        <Background color="#292524" gap={20} />
        <Controls />

        {/* 🔥 Depth Control */}
        <Panel position="top-left">
          <div style={{
            background: "#1c1917",
            padding: "8px",
            borderRadius: "8px",
            border: "1px solid #444",
            color: "white"
          }}>
            <p style={{ fontSize: "12px", marginBottom: "4px" }}>
              Blast Radius Depth
            </p>

            {[1, 2, 3].map((d) => (
              <button
                key={d}
                onClick={() => setDepth(d)}
                style={{
                  marginRight: "5px",
                  padding: "4px 8px",
                  background: depth === d ? "#d97706" : "#333",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                {d}
              </button>
            ))}
          </div>
        </Panel>

        {/* 🔝 Count */}
        <Panel position="top-right">
          {nodes.length} SYSTEMS DETECTED
        </Panel>

        {/* 📊 Legend */}
        <Panel position="bottom-left" style={{
          fontSize: "11px",
          color: "#aaa",
          marginLeft: "40px",
          marginBottom: "10px",
          background: "rgba(28, 25, 23, 0.8)",
          padding: "8px",
          borderRadius: "6px",
          border: "1px solid #444"
        }}>
          <div>🟠 API</div>
          <div>🔵 Database</div>
          <div>🟣 File/Batch</div>
          <div>🟢 Pub/Sub</div>
        </Panel>

        {/* 🔍 Edge Details */}
        {selectedEdge && (
          <Panel position="bottom-right">
            <div style={{
              background: "#1c1917",
              padding: "16px",
              border: "1px solid #444",
              borderRadius: "8px",
              maxHeight: "300px",
              overflowY: "auto",
              width: "280px"
            }}>
              <p style={{ fontWeight: "bold", borderBottom: "1px solid #333", paddingBottom: "8px", marginBottom: "12px" }}>
                Integrations ({selectedEdge.data?.integrations?.length || 0})
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {selectedEdge.data?.integrations?.map((int: Integration, i: number) => (
                  <div key={i} style={{ fontSize: "12px", background: "#262626", padding: "8px", borderRadius: "4px" }}>
                    <p style={{ color: "#f97316", fontWeight: "bold" }}>{int.type}</p>
                    <p style={{ color: "#aaa", marginTop: "4px" }}>
                      <b>File:</b> {int.file?.split('/').pop()}
                    </p>
                    <p style={{ color: "#aaa" }}>
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
                  background: "#d97706",
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