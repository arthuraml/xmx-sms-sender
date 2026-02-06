import { Link, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  LayoutDashboard,
  MessageSquare,
  Send,
  Users,
  Megaphone,
  FileText,
  GitBranch,
  Settings,
  LogOut,
  Moon,
  Sun,
  Zap,
} from "lucide-react"
import { useState, useEffect } from "react"

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Enviar SMS", icon: Send, href: "/sms/send" },
  { label: "SMS em Massa", icon: MessageSquare, href: "/sms/bulk" },
  { label: "Campanhas", icon: Megaphone, href: "/campaigns" },
  { label: "Contatos", icon: Users, href: "/contacts" },
  { label: "Logs", icon: FileText, href: "/logs" },
  { label: "Fluxos", icon: GitBranch, href: "/flows" },
  { label: "Configuracoes", icon: Settings, href: "/settings" },
]

export function Sidebar() {
  const location = useLocation()
  const { profile, signOut } = useAuth()
  const [dark, setDark] = useState(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark")
    }
    return false
  })

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark)
    localStorage.setItem("theme", dark ? "dark" : "light")
  }, [dark])

  useEffect(() => {
    const saved = localStorage.getItem("theme")
    if (saved === "dark") {
      setDark(true)
    }
  }, [])

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-card">
      <div className="flex items-center gap-2 px-6 py-5">
        <Zap className="h-6 w-6 text-primary" />
        <span className="text-lg font-bold">XMX SMS</span>
      </div>
      <Separator />
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href ||
              (item.href !== "/dashboard" && location.pathname.startsWith(item.href))
            return (
              <Link key={item.href} to={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn("w-full justify-start gap-3", isActive && "font-medium")}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            )
          })}
        </nav>
      </ScrollArea>
      <Separator />
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground truncate">
            {profile?.full_name || "Usuario"}
          </span>
          <Button variant="ghost" size="icon" onClick={() => setDark(!dark)}>
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
        <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground" onClick={signOut}>
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </div>
    </div>
  )
}
