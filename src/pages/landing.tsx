import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Zap, Send, Megaphone, BarChart3, Users, Shield, Globe } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">XMX SMS Sender</span>
          </div>
          <div className="flex gap-3">
            <Link to="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link to="/register">
              <Button>Criar Conta</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-6 py-24 text-center">
        <h1 className="text-5xl font-bold tracking-tight mb-6">
          Plataforma Inteligente de<br />
          <span className="text-primary">Marketing SMS</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Envie SMS em massa, gerencie campanhas, acompanhe entregas em tempo real
          e automatize seus fluxos de comunicacao com seus clientes.
        </p>
        <div className="flex gap-4 justify-center">
          <Link to="/register">
            <Button size="lg" className="text-lg px-8">
              Comecar Agora
            </Button>
          </Link>
          <Link to="/login">
            <Button size="lg" variant="outline" className="text-lg px-8">
              Fazer Login
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Recursos Poderosos</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: Send,
              title: "Envio de SMS",
              description: "Envie SMS individual ou em massa para milhares de numeros com suporte a multiplos provedores.",
            },
            {
              icon: Megaphone,
              title: "Campanhas",
              description: "Crie e gerencie campanhas de marketing com acompanhamento em tempo real de entregas.",
            },
            {
              icon: BarChart3,
              title: "Analytics",
              description: "Dashboard completo com graficos interativos, taxa de entrega, e metricas detalhadas.",
            },
            {
              icon: Users,
              title: "Gestao de Contatos",
              description: "Importe contatos via CSV, organize em grupos e gerencie sua base de clientes.",
            },
            {
              icon: Shield,
              title: "API Publica",
              description: "Integre o envio de SMS ao seu sistema com nossa API RESTful e chaves de acesso.",
            },
            {
              icon: Globe,
              title: "Multi-provedor",
              description: "Suporte a Onbuka, EIMS e SMPP. Alterne entre provedores sem alterar seu codigo.",
            },
          ].map((feature) => (
            <Card key={feature.title}>
              <CardHeader>
                <feature.icon className="h-8 w-8 text-primary mb-2" />
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-6 py-16 text-center">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="py-12">
            <h2 className="text-3xl font-bold mb-4">Pronto para comecar?</h2>
            <p className="text-muted-foreground mb-6">
              Crie sua conta gratuitamente e comece a enviar SMS agora mesmo.
            </p>
            <Link to="/register">
              <Button size="lg">Criar Conta Gratis</Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="container mx-auto px-6 py-8 text-center text-sm text-muted-foreground">
          <p>XMX SMS Sender - Plataforma de Marketing SMS</p>
        </div>
      </footer>
    </div>
  )
}
