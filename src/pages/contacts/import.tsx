import { useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import { Upload, FileText } from "lucide-react"
import { toast } from "sonner"
import Papa from "papaparse"

export default function ImportContactsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [csvData, setCsvData] = useState<string[][]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [nameCol, setNameCol] = useState("")
  const [phoneCol, setPhoneCol] = useState("")
  const [emailCol, setEmailCol] = useState("")
  const [loading, setLoading] = useState(false)
  const [fileName, setFileName] = useState("")

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)

    Papa.parse(file, {
      complete: (results) => {
        const data = results.data as string[][]
        if (data.length > 0) {
          setHeaders(data[0])
          setCsvData(data.slice(1).filter((row) => row.some((cell) => cell?.trim())))
        }
      },
      encoding: "UTF-8",
    })
  }, [])

  const handleImport = async () => {
    if (!nameCol || !phoneCol) {
      toast.error("Selecione pelo menos as colunas Nome e Telefone")
      return
    }

    const nameIdx = headers.indexOf(nameCol)
    const phoneIdx = headers.indexOf(phoneCol)
    const emailIdx = emailCol ? headers.indexOf(emailCol) : -1

    const contacts = csvData
      .filter((row) => row[nameIdx]?.trim() && row[phoneIdx]?.trim())
      .map((row) => ({
        user_id: user!.id,
        name: row[nameIdx].trim(),
        phone: row[phoneIdx].trim(),
        email: emailIdx >= 0 ? row[emailIdx]?.trim() || null : null,
      }))

    if (contacts.length === 0) {
      toast.error("Nenhum contato valido encontrado")
      return
    }

    setLoading(true)

    // Insert in batches of 500
    let imported = 0
    for (let i = 0; i < contacts.length; i += 500) {
      const batch = contacts.slice(i, i + 500)
      const { error } = await supabase.from("contacts").insert(batch)
      if (error) {
        toast.error(`Erro no lote ${i / 500 + 1}`, { description: error.message })
        setLoading(false)
        return
      }
      imported += batch.length
    }

    setLoading(false)
    toast.success(`${imported} contatos importados!`)
    navigate("/contacts")
  }

  return (
    <div>
      <Header title="Importar Contatos" />
      <div className="p-6 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Upload CSV</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <input
                type="file"
                accept=".csv,.txt"
                onChange={handleFile}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload" className="cursor-pointer">
                {fileName ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="h-6 w-6 text-primary" />
                    <span className="font-medium">{fileName}</span>
                    <span className="text-muted-foreground">({csvData.length} linhas)</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
                    <p className="text-muted-foreground">Clique para selecionar um arquivo CSV</p>
                  </div>
                )}
              </label>
            </div>

            {headers.length > 0 && (
              <>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Coluna Nome *</Label>
                    <Select value={nameCol} onValueChange={setNameCol}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {headers.map((h) => (
                          <SelectItem key={h} value={h}>{h}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Coluna Telefone *</Label>
                    <Select value={phoneCol} onValueChange={setPhoneCol}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {headers.map((h) => (
                          <SelectItem key={h} value={h}>{h}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Coluna Email (opcional)</Label>
                    <Select value={emailCol} onValueChange={setEmailCol}>
                      <SelectTrigger>
                        <SelectValue placeholder="Nenhuma" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Nenhuma</SelectItem>
                        {headers.map((h) => (
                          <SelectItem key={h} value={h}>{h}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Preview (primeiras 5 linhas)</p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {headers.map((h) => (
                          <TableHead key={h}>{h}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {csvData.slice(0, 5).map((row, i) => (
                        <TableRow key={i}>
                          {row.map((cell, j) => (
                            <TableCell key={j}>{cell}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <Button onClick={handleImport} disabled={loading} className="w-full">
                  {loading ? "Importando..." : `Importar ${csvData.length} contatos`}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
