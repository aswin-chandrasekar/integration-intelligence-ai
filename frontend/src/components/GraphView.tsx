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

  const getNodesByDepth = (start: string, depth: number, adjacency: Map<string, Set<string>>) => {
    const visited = new Set<string>([start]);
    let currentLevel = new Set<string>([start]);

    for (let d = 0; d < depth; d++) {
      const nextLevel = new Set<string>();
      currentLevel.forEach((node) => {
        const neighbors = adjacency.get(node);
        if (neighbors) {
          neighbors.forEach((n) => {
            if (!visited.has(n)) {
              nextLevel.add(n);
              visited.add(n);
            }
          });
        }
      });
      currentLevel = nextLevel;
    }
    return visited;
  };

  const updateGraph = useCallback(
    (integrations: Integration[]) => {
      if (!integrations || integrations.length === 0) {
        setNodes([]);
        setEdges([]);
        return;
      }

      const nodesMap = new Map<string, Node>();
      const flowEdges: Edge[] = [];
      const adjacency = new Map<string, Set<string>>();

      integrations.forEach((item, index) => {
        const sourceId = item.source.toLowerCase().replace(/\s+/g, "-");
        const targetId = item.target.toLowerCase().replace(/\s+/g, "-");

        // Helper to get or create stable position
        const getPos = (id: string) => {
          if (!nodePositions.current.has(id)) {
            nodePositions.current.set(id, {
              x: Math.random() * 800,
              y: Math.random() * 500,
            });
          }
          return nodePositions.current.get(id)!;
        };

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
              border: `2px solid ${getEdgeColor(item.type)}`,
              fontWeight: "bold",
              fontSize: "12px",
              width: 150,
            },
          });
        }

        const color = getEdgeColor(item.type);
        flowEdges.push({
          id: `e-${sourceId}-${targetId}-${index}`,
          source: sourceId,
          target: targetId,
          label: item.type,
          animated: true,
          style: { stroke: color, strokeWidth: 2 },
          labelStyle: { fill: color, fontWeight: 700, fontSize: 10 },
          data: { type: item.type, file: item.file, line: item.line },
        });

        // Build Adjacency
        if (!adjacency.has(sourceId)) adjacency.set(sourceId, new Set());
        adjacency.get(sourceId)!.add(targetId);
        if (!adjacency.has(targetId)) adjacency.set(targetId, new Set());
        adjacency.get(targetId)!.add(sourceId);
      });

      let highlightedNodes = new Set<string>();
      if (selectedNode) {
        highlightedNodes = getNodesByDepth(selectedNode, depth, adjacency);
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
            <div style={{ background: "#1c1917", padding: "10px" }}>
              <p><b>Type:</b> {selectedEdge.data?.type}</p>
              <p><b>File:</b> {selectedEdge.data?.file}</p>
              <p><b>Line:</b> {selectedEdge.data?.line}</p>
              <button onClick={() => setSelectedEdge(null)}>Close</button>
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
};

export default GraphView;