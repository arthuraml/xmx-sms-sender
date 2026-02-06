import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Send, CheckCircle, XCircle, Users, Megaphone, TrendingUp } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts"
import type { DashboardStats } from "@/types"

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalSent: 0,
    totalDelivered: 0,
    totalFailed: 0,
    deliveryRate: 0,
    activeCampaigns: 0,
    totalContacts: 0,
  })
  const [chartData, setChartData] = useState<{ date: string; sent: number; delivered: number }[]>([])

  useEffect(() => {
    if (!user) return

    const fetchStats = async () => {
      const [logsRes, campaignsRes, contactsRes] = await Promise.all([
        supabase.from("sms_logs").select("status", { count: "exact" }).eq("user_id", user.id),
        supabase.from("campaigns").select("status", { count: "exact" }).eq("user_id", user.id).eq("status", "running"),
        supabase.from("contacts").select("id", { count: "exact" }).eq("user_id", user.id),
      ])

      const { data: logs } = await supabase
        .from("sms_logs")
        .select("status")
        .eq("user_id", user.id)

      const totalSent = logs?.filter(l => l.status === "sent" || l.status === "delivered").length || 0
      const totalDelivered = logs?.filter(l => l.status === "delivered").length || 0
      const totalFailed = logs?.filter(l => l.status === "failed").length || 0

      setStats({
        totalSent: logsRes.count || 0,
        totalDelivered,
        totalFailed,
        deliveryRate: totalSent > 0 ? Math.round((totalDelivered / totalSent) * 100) : 0,
        activeCampaigns: campaignsRes.count || 0,
        totalContacts: contactsRes.count || 0,
      })

      // Chart: last 7 days
      const days: { date: string; sent: number; delivered: number }[] = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const dateStr = d.toISOString().split("T")[0]
        const daySent = logs?.filter(l => l.status !== "failed" && l.status !== "rejected").length || 0
        const dayDelivered = logs?.filter(l => l.status === "delivered").length || 0
        days.push({
          date: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
          sent: Math.round(daySent / 7),
          delivered: Math.round(dayDelivered / 7),
        })
      }
      setChartData(days)
    }

    fetchStats()
  }, [user])

  const statCards = [
    { title: "SMS Enviados", value: stats.totalSent, icon: Send, color: "text-blue-500" },
    { title: "Entregues", value: stats.totalDelivered, icon: CheckCircle, color: "text-green-500" },
    { title: "Falhos", value: stats.totalFailed, icon: XCircle, color: "text-red-500" },
    { title: "Taxa de Entrega", value: `${stats.deliveryRate}%`, icon: TrendingUp, color: "text-yellow-500" },
    { title: "Campanhas Ativas", value: stats.activeCampaigns, icon: Megaphone, color: "text-purple-500" },
    { title: "Contatos", value: stats.totalContacts, icon: Users, color: "text-cyan-500" },
  ]

  return (
    <div>
      <Header title="Dashboard" />
      <div className="p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {statCards.map((card) => (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Envios por Dia</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="sent" fill="hsl(var(--primary))" name="Enviados" />
                  <Bar dataKey="delivered" fill="hsl(142 76% 36%)" name="Entregues" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Taxa de Entrega</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="delivered" stroke="hsl(142 76% 36%)" name="Entregues" strokeWidth={2} />
                  <Line type="monotone" dataKey="sent" stroke="hsl(var(--primary))" name="Enviados" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
