import { useMemo } from "react";
import {
  Background,
  Controls,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
} from "@xyflow/react";
import type { Edge, Node, NodeProps } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { Service, Tenant } from "@/api/client";
import { countEndpoints, hostOf, maskToken } from "@/lib/spec";

type TenantNode = Node<{ label: string; serviceCount: number }, "tenant">;

type ServiceNode = Node<
  {
    label: string;
    host: string;
    endpoints: number;
    hasAuth: boolean;
    botName: string;
  },
  "service"
>;

type AppNode = TenantNode | ServiceNode;

function TenantNodeView({ data }: NodeProps<TenantNode>) {
  return (
    <div className="rounded-3xl min-w-[200px] border border-ink-deep bg-ink-deep px-5 py-4 text-cream-solid shadow-[0_18px_45px_-22px_rgba(22,24,29,0.55)]">
      <p className="font-mono text-[10px] tracking-[0.2em] text-mint uppercase">
        tenant
      </p>
      <p className="mt-1 max-w-[220px] truncate font-display text-lg font-medium leading-tight">
        {data.label}
      </p>
      <div className="border-t border-line" />
      <p className="mt-1.5 font-mono text-[10px] text-cream-solid/60">
        {data.serviceCount} service{data.serviceCount === 1 ? "" : "s"}
      </p>
      <Handle
        type="source"
        position={Position.Right}
        style={{
          width: 10,
          height: 10,
          background: "#ff4d2e",
          border: "2px solid #faf7f0",
        }}
      />
    </div>
  );
}

function ServiceNodeView({ data }: NodeProps<ServiceNode>) {
  return (
    <div className="w-56 rounded-3xl border border-line bg-cream px-5 py-4 shadow-[0_18px_45px_-22px_rgba(22,24,29,0.35)]">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] tracking-[0.2em] text-ink-soft uppercase">
          service
        </p>
        <span className="flex items-center gap-1.5">
          <span
            className={`h-1.5 w-1.5 rounded-full ${data.hasAuth ? "bg-leaf" : "bg-coral"}`}
          />
          <span className="font-mono text-[9px] text-ink-soft">
            {data.hasAuth ? "authed" : "no auth"}
          </span>
        </span>
      </div>
      <p className="mt-1 truncate font-display text-base font-medium leading-tight">
        {data.label}
      </p>
      <p className="mt-0.5 truncate font-mono text-[10px] text-ink-soft">
        {data.host}
      </p>
      <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
        <span className="font-mono text-[10px] text-ink-soft">
          {data.botName}
        </span>
        <span className="rounded-full bg-paper-2 px-2 py-0.5 font-mono text-[10px] text-ink">
          {data.endpoints} endpoints
        </span>
      </div>
      <Handle
        type="target"
        position={Position.Left}
        style={{
          width: 10,
          height: 10,
          background: "#faf7f0",
          border: "2px solid #c9c2ae",
        }}
      />
    </div>
  );
}

type SystemMapProps = {
  tenant: Tenant;
  services: Service[];
};

export function SystemMap({ tenant, services }: SystemMapProps) {
  const nodeTypes = useMemo(
    () => ({ tenant: TenantNodeView, service: ServiceNodeView }),
    [],
  );

  const { nodes, edges } = useMemo(() => {
    const nodes: AppNode[] = [
      {
        id: "tenant",
        type: "tenant",
        position: { x: 0, y: 0 },
        data: { label: tenant.name, serviceCount: services.length },
        draggable: false,
      },
    ];
    const edges: Edge[] = [];
    services.forEach((service, i) => {
      const x = (i - (services.length - 1) / 2) * 300;
      nodes.push({
        id: `service-${service.id}`,
        type: "service",
        position: { x, y: 200 },
        data: {
          label: service.name,
          host: hostOf(service.baseUrl),
          endpoints: countEndpoints(service.openapiSpec),
          hasAuth: Boolean(service.authHeaderName),
          botName: maskToken(service.botToken),
        },
        draggable: false,
      });
      edges.push({
        id: `edge-${service.id}`,
        source: "tenant",
        target: `service-${service.id}`,
        type: "smoothstep",
        markerEnd: { type: MarkerType.ArrowClosed, color: "#6b6556" },
        style: { stroke: "#c9c2ae", strokeWidth: 1.5 },
      });
    });
    return { nodes, edges };
  }, [tenant, services]);

  return (
    <div className="h-[420px] w-full overflow-hidden rounded-3xl border border-line bg-paper-2">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.35 }}
        nodesConnectable={false}
        nodesDraggable={false}
        zoomOnScroll={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#d8d0bb" gap={24} size={1.5} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
