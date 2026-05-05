import { useEffect, useState, useCallback } from "react";
import ReactFlow, { 
  Node, 
  Edge, 
  Background, 
  Controls, 
  useNodesState,
  useEdgesState,
  Panel
} from "reactflow";
import "reactflow/dist/style.css";
import { Integration } from "../services/api";

interface GraphViewProps {
  data?: Integration[];
}

const GraphView = ({ data }: GraphViewProps) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const updateGraph = useCallback((integrations: Integration[]) => {
    if (!integrations || integrations.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const nodesMap = new Map<string, Node>();
    const flowEdges: Edge[] = [];

    integrations.forEach((item, index) => {
      const sourceId = item.source.toLowerCase().replace(/\s+/g, "-");
      const targetId = item.target.toLowerCase().replace(/\s+/g, "-");

      if (!nodesMap.has(sourceId)) {
        nodesMap.set(sourceId, {
          id: sourceId,
          data: { label: item.source },
          position: { x: Math.random() * 500, y: Math.random() * 300 },
          style: { 
            background: '#d97706', 
            color: '#fff', 
            borderRadius: '8px',
            border: '1px solid #92400e',
            fontWeight: 'bold',
            fontSize: '12px',
            width: 150
          },
        });
      }

      if (!nodesMap.has(targetId)) {
        nodesMap.set(targetId, {
          id: targetId,
          data: { label: item.target },
          position: { x: Math.random() * 500, y: Math.random() * 300 },
          style: { 
            background: '#1c1917', 
            color: '#d97706', 
            borderRadius: '8px',
            border: '2px solid #d97706',
            fontWeight: 'bold',
            fontSize: '12px',
            width: 150
          },
        });
      }

      flowEdges.push({
        id: `e-${sourceId}-${targetId}-${index}`,
        source: sourceId,
        target: targetId,
        label: item.type,
        animated: true,
        style: { stroke: '#d97706', strokeWidth: 2 },
        labelStyle: { fill: '#a8a29e', fontWeight: 700, fontSize: 10 },
      });
    });

    setNodes(Array.from(nodesMap.values()));
    setEdges(flowEdges);
  }, [setNodes, setEdges]);

  useEffect(() => {
    updateGraph(data || []);
  }, [data, updateGraph]);

  return (
    <div style={{ height: "100%", minHeight: "400px", width: "100%" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        style={{ background: '#0c0a09' }}
      >
        <Background color="#292524" gap={20} />
        <Controls />
        <Panel position="top-right" style={{ color: '#stone-500', fontSize: '10px', fontWeight: 'bold' }}>
          {nodes.length} SYSTEMS DETECTED
        </Panel>
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-stone-600 font-bold uppercase tracking-widest text-xs">
              No integration data available. Run a scan to visualize.
            </p>
          </div>
        )}
      </ReactFlow>
    </div>
  );
};

export default GraphView;