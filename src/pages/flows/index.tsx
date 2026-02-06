import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, GitBranch, Trash2 } from "lucide-react"
import { toast } from "sonner"
import type { FlowTemplate } from "@/types"

export default function FlowsPage() {
  const { user } = useAuth()
  const [flows, setFlows] = useState<FlowTemplate[]>([])
  const [loading, setLoading] = useState(true)

  const fetchFlows = async () => {
    if (!user) return
    const { data } = await supabase
      .from("flow_templates")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
    setFlows(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchFlows()
  }, [user])

  const createFlow = async () => {
    const { data, error } = await supabase
      .from("flow_templates")
      .insert({
        user_id: user!.id,
        name: "Novo Fluxo",
        description: "",
        flow_data: { nodes: [], edges: [] },
      })
      .select()
      .single()

    if (error) {
      toast.error("Erro ao criar fluxo")
    } else if (data) {
      toast.success("Fluxo criado!")
      fetchFlows()
    }
  }

  const deleteFlow = async (id: string) => {
    await supabase.from("flow_templates").delete().eq("id", id)
    setFlows(flows.filter((f) => f.id !== id))
    toast.success("Fluxo excluido")
  }

  return (
    <div>
      <Header title="Fluxos" />
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <p className="text-muted-foreground">Crie fluxos visuais de automacao de SMS</p>
          <Button onClick={createFlow}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Fluxo
          </Button>
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground py-12">Carregando...</p>
        ) : flows.length === 0 ? (
          <Card className="py-12">
            <CardContent className="text-center">
              <GitBranch className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum fluxo criado</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {flows.map((f) => (
              <Card key={f.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base">{f.name}</CardTitle>
                      <CardDescription>{f.description || "Sem descricao"}</CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => deleteFlow(f.id)}>
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">
                      Atualizado: {new Date(f.updated_at).toLocaleDateString("pt-BR")}
                    </span>
                    <Link to={`/flows/editor?id=${f.id}`}>
                      <Button size="sm" variant="outline">Editar</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
