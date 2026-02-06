import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Send } from "lucide-react"
import { toast } from "sonner"
import type { ContactGroup, SmsProvider } from "@/types"

export default function BulkSmsPage() {
  const { user } = useAuth()
  const [numbers, setNumbers] = useState("")
  const [message, setMessage] = useState("")
  const [provider, setProvider] = useState<SmsProvider>("onbuka")
  const [senderId, setSenderId] = useState("")
  const [groups, setGroups] = useState<ContactGroup[]>([])
  const [selectedGroup, setSelectedGroup] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) return
    supabase
      .from("contact_groups")
      .select("*")
      .eq("user_id", user.id)
      .then(({ data }) => setGroups(data || []))
  }, [user])

  const loadGroupContacts = async (groupId: string) => {
    setSelectedGroup(groupId)
    if (!groupId) return

    const { data } = await supabase
      .from("contact_group_members")
      .select("contact_id, contacts(phone)")
      .eq("group_id", groupId)

    if (data) {
      const phones = data.map((d) => (d.contacts as { phone: string })?.phone).filter(Boolean)
      setNumbers(phones.join("\n"))
    }
  }

  const handleSend = async () => {
    const phoneList = numbers
      .split(/[\n,;]+/)
      .map((n) => n.trim())
      .filter(Boolean)

    if (phoneList.length === 0 || !message) {
      toast.error("Insira os numeros e a mensagem")
      return
    }

    setLoading(true)
    const { data, error } = await supabase.functions.invoke("send-sms", {
      body: {
        to: phoneList.join(","),
        message,
        provider,
        sender_id: senderId || undefined,
      },
    })
    setLoading(false)

    if (error) {
      toast.error("Erro no envio", { description: error.message })
    } else if (data?.success) {
      toast.success(`${data.sent_count} SMS enviados!`)
      setNumbers("")
      setMessage("")
    } else {
      toast.error("Falha no envio", { description: data?.error })
    }
  }

  const phoneCount = numbers
    .split(/[\n,;]+/)
    .map((n) => n.trim())
    .filter(Boolean).length

  return (
    <div>
      <Header title="SMS em Massa" />
      <div className="p-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Envio em Massa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Carregar de um Grupo</Label>
              <Select value={selectedGroup} onValueChange={loadGroupContacts}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um grupo (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Numeros (um por linha ou separados por virgula)</Label>
              <Textarea
                placeholder="5511999999999&#10;5521888888888&#10;5531777777777"
                value={numbers}
                onChange={(e) => setNumbers(e.target.value)}
                rows={6}
              />
              <p className="text-sm text-muted-foreground">{phoneCount} numeros</p>
            </div>

            <div className="space-y-2">
              <Label>Provedor</Label>
              <Select value={provider} onValueChange={(v) => setProvider(v as SmsProvider)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="onbuka">Onbuka</SelectItem>
                  <SelectItem value="eims_1">EIMS Conta 1</SelectItem>
                  <SelectItem value="eims_2">EIMS Conta 2</SelectItem>
                  <SelectItem value="eims_3">EIMS Conta 3</SelectItem>
                  <SelectItem value="smpp">SMPP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Mensagem</Label>
              <Textarea
                placeholder="Mensagem para todos os destinatarios..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{message.length} caracteres</span>
                <span>{message.length <= 160 ? 1 : Math.ceil(message.length / 153)} SMS x {phoneCount} = {(message.length <= 160 ? 1 : Math.ceil(message.length / 153)) * phoneCount} total</span>
              </div>
            </div>

            <Button onClick={handleSend} disabled={loading} className="w-full">
              <Send className="mr-2 h-4 w-4" />
              {loading ? "Enviando..." : `Enviar para ${phoneCount} numeros`}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
