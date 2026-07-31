"use client"

import { useMemo, useState } from "react"
import useSWR from "swr"
import { AlertCircle, ArrowLeft, ArrowRight, Building2, Check, Download, Loader2, QrCode, RefreshCw, Search, Sparkles, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import type { Employee } from "@/lib/signatures/data"

type Payload = { employees: Employee[]; source: "database" | "excel" }
type Design = "d1" | "d2"
const fetcher = (url: string) => fetch(url).then(async (response) => { if (!response.ok) throw new Error("No se pudo cargar la base de datos"); return response.json() })
const saveResponse = async (response: Response, fallback: string) => { if (!response.ok) throw new Error((await response.json()).error || "No se pudo generar el archivo"); const blob = await response.blob(); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = response.headers.get("content-disposition")?.match(/filename=([^;]+)/)?.[1] || fallback; anchor.click(); URL.revokeObjectURL(url) }

function missingFor(employee: Employee, booking: boolean) {
  const company = employee.company.toLowerCase()
  const fields: string[] = []
  if (!employee.name) fields.push("nombre")
  if (!employee.role) fields.push("puesto")
  if (!employee.phone) fields.push("celular")
  if (!employee.email) fields.push("correo")
  if (company.includes("global") && !employee.photo && !employee.photo2) fields.push("foto")
  if (company.includes("ofimundo")) { if (!employee.photo) fields.push("foto"); if (!employee.qrCell) fields.push("QR celular"); if (!employee.qrLinkedin) fields.push("QR LinkedIn"); if (booking && !employee.booking) fields.push("Booking") }
  if (company.includes("dream")) { if (!employee.qrWhatsapp) fields.push("QR WhatsApp"); if (!employee.qrLinkedin) fields.push("QR LinkedIn") }
  return fields
}

export function SignatureStudio() {
  const { data, error, isLoading, mutate } = useSWR<Payload>("/api/employees", fetcher)
  const [step, setStep] = useState(1)
  const [company, setCompany] = useState("")
  const [selected, setSelected] = useState<number[]>([])
  const [search, setSearch] = useState("")
  const [designs, setDesigns] = useState<Design[]>(["d1"])
  const [booking, setBooking] = useState(false)
  const [qrEmployee, setQrEmployee] = useState<Employee | null>(null)
  const [qrTypes, setQrTypes] = useState<("cell" | "linkedin")[]>(["cell", "linkedin"])
  const [working, setWorking] = useState(false)
  const [message, setMessage] = useState("")
  const companies = useMemo(() => Array.from(new Set(data?.employees.map((e) => e.company).filter(Boolean) || [])).sort(), [data])
  const rows = useMemo(() => (data?.employees || []).filter((e) => e.company === company && `${e.name} ${e.role} ${e.email}`.toLowerCase().includes(search.toLowerCase())), [data, company, search])
  const chosen = (data?.employees || []).filter((e) => selected.includes(e.id))
  const issues = chosen.map((employee) => ({ employee, fields: missingFor(employee, booking) })).filter((item) => item.fields.length)
  const canContinue = step === 1 ? Boolean(company) : step === 2 ? selected.length > 0 : step === 3 ? !company.toLowerCase().includes("global") || designs.length > 0 : false
  const toggleAll = () => setSelected(rows.length && rows.every((e) => selected.includes(e.id)) ? selected.filter((id) => !rows.some((e) => e.id === id)) : Array.from(new Set([...selected, ...rows.map((e) => e.id)])))
  const generateSignatures = async () => { setWorking(true); setMessage(""); try { await saveResponse(await fetch("/api/generate/signatures", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ employees: chosen, designs, booking }) }), "firmas.zip"); setMessage("ZIP de firmas generado correctamente.") } catch (e) { setMessage(e instanceof Error ? e.message : "Error al generar") } finally { setWorking(false) } }
  const generateQr = async () => { if (!qrEmployee || !qrTypes.length) return; setWorking(true); setMessage(""); try { await saveResponse(await fetch("/api/generate/qr", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ employee: qrEmployee, types: qrTypes }) }), "qr.zip"); setQrEmployee(null); setMessage("QR descargados. Súbelos a la base de datos y pulsa Actualizar datos antes de generar la firma.") } catch (e) { setMessage(e instanceof Error ? e.message : "Error al generar QR") } finally { setWorking(false) } }

  if (isLoading) return <main className="flex min-h-screen items-center justify-center bg-background"><Loader2 className="size-6 animate-spin text-primary" aria-label="Cargando empleados" /></main>
  if (error) return <main className="flex min-h-screen items-center justify-center bg-background p-4"><Card className="max-w-md"><CardHeader><CardTitle>No pudimos cargar los datos</CardTitle><CardDescription>Revisa la conexión SQL Server y vuelve a intentarlo.</CardDescription></CardHeader><CardFooter><Button onClick={() => mutate()}><RefreshCw data-icon="inline-start" />Reintentar</Button></CardFooter></Card></main>

  return <main className="min-h-screen bg-background">
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2 lg:px-6">
        <div className="flex items-center gap-3">
          <span className="flex size-25 items-center justify-center rounded-xl text-primary-foreground">
            <img 
              src="/images/logo.png" 
              alt="ofilab" 
              className="size-25 object-contain"
            />
          </span>
          <div>
            <h1 className="text-xl font-semibold">OFILAB - FIRMAS</h1>
            <p className="text-xm text-muted-foreground">Panel para Generar firmas</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={data?.source === "database" ? "secondary" : "outline"}>{data?.source === "database" ? "SQL Server" : "Respaldo Excel"}</Badge>
          <Button variant="ghost" size="icon" onClick={() => mutate()} aria-label="Actualizar datos">
            <RefreshCw />
          </Button>
        </div>
      </div>
    </header>
    <div className="mx-auto max-w-6xl px-4 py-6 lg:px-6">
      <nav className="mb-5 flex overflow-x-auto rounded-xl border bg-card p-3" aria-label="Pasos del asistente">{["Empresa", "Empleados", "Configuración", "Revisión"].map((label, index) => <button key={label} type="button" onClick={() => index + 1 < step && setStep(index + 1)} className={cn("flex min-w-32 flex-1 items-center gap-2 text-sm", step === index + 1 ? "font-semibold" : "text-muted-foreground")}><span className={cn("flex size-7 items-center justify-center rounded-full text-xs", step >= index + 1 ? "bg-primary text-primary-foreground" : "bg-muted")}>{step > index + 1 ? <Check className="size-4" /> : index + 1}</span>{label}</button>)}</nav>
      {message && <div role="status" className="mb-4 rounded-xl border bg-card p-3 text-sm">{message}</div>}
      <Card><CardHeader><Badge variant="outline" className="w-fit">Paso {step} de 4</Badge><CardTitle>{step === 1 ? "Selecciona una empresa" : step === 2 ? "Selecciona los trabajadores" : step === 3 ? "Configura las firmas" : "Revisa el lote"}</CardTitle><CardDescription>{step === 1 ? "La lista se obtiene dinámicamente desde el campo empresa." : step === 2 ? "Puedes buscar, seleccionar individualmente o incluir a todos." : step === 3 ? "Aplicaremos las reglas específicas de la empresa." : "Corrige las incidencias antes de descargar las firmas."}</CardDescription></CardHeader>
        <CardContent>
          {step === 1 && <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{companies.map((name) => { const count = data!.employees.filter((e) => e.company === name).length; return <button key={name} type="button" onClick={() => { setCompany(name); setSelected([]) }} className={cn("flex items-center gap-3 rounded-xl border p-4 text-left", company === name && "border-primary bg-primary/5")}><span className="flex size-10 items-center justify-center rounded-lg bg-muted"><Building2 className="size-5" /></span><span className="min-w-0 flex-1"><span className="block truncate font-medium">{name}</span><span className="text-xs text-muted-foreground">{count} trabajadores</span></span>{company === name && <Check className="size-4 text-primary" />}</button>})}</div>}
          {step === 2 && <div className="flex flex-col gap-3"><label className="flex items-center gap-2 rounded-lg border px-3 py-2"><Search className="size-4 text-muted-foreground" /><span className="sr-only">Buscar trabajadores</span><input className="min-w-0 flex-1 bg-transparent text-sm outline-none" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre, puesto o correo" /></label><div className="overflow-hidden rounded-xl border"><div className="flex items-center gap-3 border-b bg-muted/50 p-3"><Checkbox checked={rows.length > 0 && rows.every((e) => selected.includes(e.id))} onCheckedChange={toggleAll} /><strong className="flex-1 text-sm">Seleccionar todos</strong><Badge variant="secondary">{selected.length} elegidos</Badge></div><div className="max-h-80 overflow-auto">{rows.map((employee) => <label key={employee.id} className="flex cursor-pointer items-center gap-3 border-b p-3 last:border-0"><Checkbox checked={selected.includes(employee.id)} onCheckedChange={() => setSelected(selected.includes(employee.id) ? selected.filter((id) => id !== employee.id) : [...selected, employee.id])} /><span className="flex size-9 items-center justify-center rounded-full bg-muted text-xs font-semibold">{employee.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{employee.name}</span><span className="block truncate text-xs text-muted-foreground">{employee.role}</span></span></label>)}</div></div></div>}
          {step === 3 && <div className="grid gap-6 md:grid-cols-2"><section className="flex flex-col gap-3"><h3 className="font-semibold">Opciones de plantilla</h3>{company.toLowerCase().includes("global") ? ([['d1','Diseño 1','Usa la fotografía principal'],['d2','Diseño 2','Usa la fotografía alternativa']] as const).map(([id,title,description]) => <label key={id} className={cn("flex cursor-pointer gap-3 rounded-xl border p-4", designs.includes(id) && "border-primary bg-primary/5")}><Checkbox checked={designs.includes(id)} onCheckedChange={() => setDesigns(designs.includes(id) ? designs.filter((d) => d !== id) : [...designs,id])} /><span><span className="block text-sm font-medium">{title}</span><span className="text-xs text-muted-foreground">{description}</span></span></label>) : company.toLowerCase().includes("ofimundo") ? <label className={cn("flex cursor-pointer gap-3 rounded-xl border p-4", booking && "border-primary bg-primary/5")}><Checkbox checked={booking} onCheckedChange={(v) => setBooking(Boolean(v))} /><span><span className="block text-sm font-medium">Agregar Booking</span><span className="text-xs text-muted-foreground">Solo trabajadores con un enlace registrado.</span></span></label> : <div className="rounded-xl border bg-muted/40 p-4 text-sm">La plantilla estándar de {company} está lista.</div>}</section><section className="flex flex-col gap-3"><h3 className="font-semibold">Validación previa</h3>{issues.length ? issues.slice(0,5).map(({employee,fields}) => <div key={employee.id} className="rounded-xl border p-3"><div className="flex gap-3"><AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" /><div className="min-w-0 flex-1"><p className="text-sm font-medium">{employee.name}</p><p className="text-xs text-muted-foreground">Falta: {fields.join(", ")}</p>{fields.some((f) => f.startsWith("QR")) && <Button variant="link" size="sm" className="h-auto p-0" onClick={() => setQrEmployee(employee)}>Generar QR</Button>}</div></div></div>) : <div className="rounded-xl border bg-muted/40 p-4 text-sm">Todos los datos necesarios están completos.</div>}</section></div>}
          {step === 4 && <div className="grid gap-6 md:grid-cols-2"><section className="flex flex-col gap-3"><h3 className="font-semibold">Resumen</h3><div className="grid grid-cols-3 gap-2">{[[chosen.length,"Seleccionados"],[chosen.length-issues.length,"Listos"],[issues.length,"Bloqueados"]].map(([value,label]) => <div key={label} className="rounded-xl bg-muted p-3"><p className="text-2xl font-semibold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>)}</div><Progress value={chosen.length ? ((chosen.length-issues.length)/chosen.length)*100 : 0} /><p className="text-xs leading-relaxed text-muted-foreground">Los QR descargados deben subirse a la base de datos. Después, actualiza los datos para habilitar las firmas dependientes.</p></section><section className="flex flex-col gap-3"><h3 className="font-semibold">Descarga</h3>{issues.length > 0 ? <div className="rounded-xl border p-4 text-sm"><p className="font-medium">Hay {issues.length} firmas bloqueadas</p><p className="mt-1 text-muted-foreground">Regresa a Configuración para revisar los campos faltantes.</p></div> : <Button onClick={generateSignatures} disabled={working}>{working ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Download data-icon="inline-start" />}Generar y descargar ZIP</Button>}</section></div>}
        </CardContent><CardFooter className="justify-between"><Button variant="outline" disabled={step === 1} onClick={() => setStep(step - 1)}><ArrowLeft data-icon="inline-start" />Atrás</Button>{step < 4 && <Button disabled={!canContinue} onClick={() => setStep(step + 1)}>Continuar<ArrowRight data-icon="inline-end" /></Button>}</CardFooter></Card>
    </div>
    <Dialog open={Boolean(qrEmployee)} onOpenChange={(open) => !open && setQrEmployee(null)}><DialogContent><DialogHeader><DialogTitle>Generar códigos QR</DialogTitle><DialogDescription>Selecciona los códigos para {qrEmployee?.name}. Se descargarán como PNG dentro de un ZIP.</DialogDescription></DialogHeader><div className="flex flex-col gap-3"><label className="flex cursor-pointer gap-3 rounded-xl border p-4"><Checkbox checked={qrTypes.includes("cell")} onCheckedChange={() => setQrTypes(qrTypes.includes("cell") ? qrTypes.filter((t) => t !== "cell") : [...qrTypes,"cell"])} /><span><span className="block text-sm font-medium">QR celular</span><span className="text-xs text-muted-foreground">vCard con nombre, celular y correo.</span></span></label><label className="flex cursor-pointer gap-3 rounded-xl border p-4"><Checkbox checked={qrTypes.includes("linkedin")} onCheckedChange={() => setQrTypes(qrTypes.includes("linkedin") ? qrTypes.filter((t) => t !== "linkedin") : [...qrTypes,"linkedin"])} /><span><span className="block text-sm font-medium">QR LinkedIn</span><span className="text-xs text-muted-foreground">vCard con nombre, puesto, empresa y enlace de LinkedIn.</span></span></label>{qrEmployee && qrTypes.includes("linkedin") && (!qrEmployee.name || !qrEmployee.role || !qrEmployee.company || !qrEmployee.linkedin) && <p className="text-sm text-destructive">No se puede generar LinkedIn: faltan datos obligatorios.</p>}</div><DialogFooter><Button variant="outline" onClick={() => setQrEmployee(null)}>Cancelar</Button><Button onClick={generateQr} disabled={working || !qrTypes.length}><QrCode data-icon="inline-start" />Generar ZIP de QR</Button></DialogFooter></DialogContent></Dialog>
  </main>
}
