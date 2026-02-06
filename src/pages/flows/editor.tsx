import { useCallback, useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  type Connection,
  type Node,
  type Edge,
  Handle,
  Position,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { Save, MessageSquare, Clock, GitBranch, Play } from "lucide-react"
import { toast } from "sonner"

function StartNode({ data }: { data: { label: string } }) {
  return (
    <div className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-md min-w-[120px]">
      <div className="flex items-center gap-2">
        <Play className="h-4 w-4" />
        <span className="font-medium text-sm">{data.label}</span>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}

function SmsNode({ data }: { data: { label: string; message?: string } }) {
  return (
    <div className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-md min-w-[150px]">
      <Handle type="target" position={Position.Top} />
      <div className="flex items-center gap-2 mb-1">
        <MessageSquare className="h-4 w-4" />
        <span className="font-medium text-sm">{data.label}</span>
      </div>
      {data.message && <p className="text-xs opacity-80 truncate">{data.message}</p>}
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}

function DelayNode({ data }: { data: { label: string; delay?: string } }) {
  return (
    <div className="bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-md min-w-[120px]">
      <Handle type="target" position={Position.Top} />
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4" />
        <span className="font-medium text-sm">{data.label}</span>
      </div>
      {data.delay && <p className="text-xs opacity-80">{data.delay}</p>}
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}

function ConditionNode({ data }: { data: { label: string; condition?: string } }) {
  return (
    <div className="bg-purple-500 text-white px-4 py-2 rounded-lg shadow-md min-w-[150px]">
      <Handle type="target" position={Position.Top} />
      <div className="flex items-center gap-2 mb-1">
        <GitBranch className="h-4 w-4" />
        <span className="font-medium text-sm">{data.label}</span>
      </div>
      {data.condition && <p className="text-xs opacity-80">{data.condition}</p>}
      <Handle type="source" position={Position.Bottom} id="yes" />
      <Handle type="source" position={Position.Right} id="no" />
    </div>
  )
}

const nodeTypes = {
  start: StartNode,
  sms: SmsNode,
  delay: DelayNode,
  condition: ConditionNode,
}

const defaultNodes: Node[] = [
  { id: "start", type: "start", position: { x: 250, y: 50 }, data: { label: "Inicio" } },
]

export default function FlowEditorPage() {
  const [searchParams] = useSearchParams()
  const flowId = searchParams.get("id")
  const [flowName, setFlowName] = useState("Novo Fluxo")
  const [nodes, setNodes, onNodesChange] = useNodesState(defaultNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

  useEffect(() => {
    if (!flowId) return
    supabase
      .from("flow_templates")
      .select("*")
      .eq("id", flowId)
      .single()
      .then(({ data }) => {
        if (data) {
          setFlowName(data.name)
          const fd = data.flow_data as { nodes?: Node[]; edges?: Edge[] }
          if (fd.nodes?.length) setNodes(fd.nodes)
          if (fd.edges?.length) setEdges(fd.edges)
        }
      })
  }, [flowId])

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  const addNode = (type: string) => {
    const id = `${type}-${Date.now()}`
    const labels: Record<string, string> = {
      sms: "Enviar SMS",
      delay: "Aguardar",
      condition: "Condicao",
    }
    const newNode: Node = {
      id,
      type,
      position: { x: 250, y: (nodes.length + 1) * 120 },
      data: { label: labels[type] || type },
    }
    setNodes((nds) => [...nds, newNode])
  }

  const handleSave = async () => {
    if (!flowId) {
      toast.error("ID do fluxo nao encontrado")
      return
    }
    const { error } = await supabase
      .from("flow_templates")
      .update({
        name: flowName,
        flow_data: { nodes, edges },
        updated_at: new Date().toISOString(),
      })
      .eq("id", flowId)

    if (error) {
      toast.error("Erro ao salvar")
    } else {
      toast.success("Fluxo salvo!")
    }
  }

  return (
    <div className="flex flex-col h-screen">
      <Header title="Editor de Fluxo" />
      <div className="flex items-center gap-3 px-4 py-2 border-b bg-card">
        <Input
          value={flowName}
          onChange={(e) => setFlowName(e.target.value)}
          className="max-w-xs"
        />
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => addNode("sms")}>
            <MessageSquare className="mr-1 h-3 w-3" /> SMS
          </Button>
          <Button size="sm" variant="outline" onClick={() => addNode("delay")}>
            <Clock className="mr-1 h-3 w-3" /> Delay
          </Button>
          <Button size="sm" variant="outline" onClick={() => addNode("condition")}>
            <GitBranch className="mr-1 h-3 w-3" /> Condicao
          </Button>
        </div>
        <div className="flex-1" />
        <Button size="sm" onClick={handleSave}>
          <Save className="mr-1 h-3 w-3" /> Salvar
        </Button>
      </div>
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
        >
          <Controls />
          <Background />
        </ReactFlow>
      </div>
    </div>
  )
}
