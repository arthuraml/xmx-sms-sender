import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Send } from "lucide-react"
import { toast } from "sonner"
import type { SmsProvider } from "@/types"

export default function SendSmsPage() {
  const [phone, setPhone] = useState("")
  const [message, setMessage] = useState("")
  const [provider, setProvider] = useState<SmsProvider>("onbuka")
  const [senderId, setSenderId] = useState("")
  const [loading, setLoading] = useState(false)

  const charCount = message.length
  const smsCount = charCount <= 160 ? 1 : Math.ceil(charCount / 153)

  const handleSend = async () => {
    if (!phone || !message) {
      toast.error("Preencha o telefone e a mensagem")
      return
    }

    setLoading(true)
    const { data, error } = await supabase.functions.invoke("send-sms", {
      body: {
        to: phone,
        message,
        provider,
        sender_id: senderId || undefined,
      },
    })
    setLoading(false)

    if (error) {
      toast.error("Erro ao enviar SMS", { description: error.message })
    } else if (data?.success) {
      toast.success("SMS enviado!", { description: `Message ID: ${data.message_ids?.[0] || "N/A"}` })
      setPhone("")
      setMessage("")
    } else {
      toast.error("Falha ao enviar", { description: data?.error || "Erro desconhecido" })
    }
  }

  return (
    <div>
      <Header title="Enviar SMS" />
      <div className="p-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Envio Individual</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone (com codigo do pais)</Label>
              <Input
                id="phone"
                placeholder="5511999999999"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sender">Sender ID (opcional)</Label>
              <Input
                id="sender"
                placeholder="Ex: XMX"
                value={senderId}
                onChange={(e) => setSenderId(e.target.value)}
                maxLength={11}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="provider">Provedor</Label>
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
              <Label htmlFor="message">Mensagem</Label>
              <Textarea
                id="message"
                placeholder="Digite sua mensagem..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{charCount} caracteres</span>
                <span>{smsCount} SMS</span>
              </div>
            </div>

            {message && (
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <p className="text-sm font-medium mb-1">Preview:</p>
                  <p className="text-sm">{message}</p>
                </CardContent>
              </Card>
            )}

            <Button onClick={handleSend} disabled={loading} className="w-full">
              <Send className="mr-2 h-4 w-4" />
              {loading ? "Enviando..." : "Enviar SMS"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
