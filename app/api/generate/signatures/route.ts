import { readFile } from "node:fs/promises"
import path from "node:path"
import JSZip from "jszip"
import type { Employee } from "@/lib/signatures/data"

const safe = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase()
const render = (template: string, employee: Employee, booking: boolean) => {
  const fields: Record<string, string> = { empresa: employee.company, nombre_corto: employee.shortName, nombre_empleado: employee.name, cargo_empleado: employee.role, correo_empleado: employee.email, celular_empleado: employee.phone, foto_empleado: employee.photo, foto_empleado1: employee.photo, foto_empleado2: employee.photo2, qr_social: employee.qrCell, qr_linkedin: employee.qrLinkedin, qr_wsp: employee.qrWhatsapp, linkedin: employee.linkedin, booking_empleado: employee.booking }
  let html = template
  if (booking && employee.booking && employee.company.toLowerCase().includes("ofimundo")) {
    html = html.replace("<!-- <a href=\"{{booking_empleado}}\"", "<a href=\"{{booking_empleado}}\"").replace("target=\"_blank\">Agenda una reunión</a> -->", "target=\"_blank\">Agenda una reunión</a>")
  }
  return html.replace(/\{\{([^}]+)\}\}/g, (_, key: string) => fields[key.trim()] ?? "")
}

export async function POST(request: Request) {
  const { employees, designs = ["d1"], booking = false } = await request.json() as { employees: Employee[]; designs: string[]; booking: boolean }
  const zip = new JSZip()
  for (const employee of employees) {
    const company = employee.company.toLowerCase()
    const files = company.includes("global") ? designs.map((d) => [`global-${d === "d2" ? "2" : "1"}.html`, d]) : [[company.includes("ofimundo") ? "ofimundo.html" : "dreamtec.html", "estandar"]]
    for (const [file, label] of files) {
      const template = await readFile(path.join(process.cwd(), "templates", file), "utf8")
      zip.file(`${safe(employee.company)}/${safe(employee.shortName || employee.name)}_${label}.html`, render(template, employee, booking))
    }
  }
  const content = await zip.generateAsync({ type: "uint8array", compression: "DEFLATE", compressionOptions: { level: 9 } })
  return new Response(content, { headers: { "Content-Type": "application/zip", "Content-Disposition": "attachment; filename=firmas.zip" } })
}
