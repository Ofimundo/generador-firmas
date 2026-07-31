import { readFile } from "node:fs/promises"
import path from "node:path"
import JSZip from "jszip"
import QRCode from "qrcode"
import sharp from "sharp"
import type { Employee } from "@/lib/signatures/data"

const escapeVCard = (value: string) => value.replace(/([,;\\])/g, "\\$1").replace(/\r?\n/g, "\\n")
const fileName = (value: string) => value.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase()
async function qrWithLogo(data: string, logo: string) {
  const qr = await QRCode.toBuffer(data, { errorCorrectionLevel: "H", margin: 2, width: 720 })
  const logoBuffer = await readFile(path.join(process.cwd(), "public/images", logo))
  const inset = await sharp(logoBuffer).resize(144, 144, { fit: "cover" }).png().toBuffer()
  return sharp(qr).composite([{ input: inset, gravity: "center" }]).png().toBuffer()
}

export async function POST(request: Request) {
  const { employee, types } = await request.json() as { employee: Employee; types: ("cell" | "linkedin")[] }
  const zip = new JSZip()
  if (types.includes("cell")) {
    if (!employee.name || !employee.phone || !employee.email) return Response.json({ error: "El QR celular requiere nombre, celular y correo." }, { status: 400 })
    const vcard = `BEGIN:VCARD\r\nVERSION:3.0\r\nFN:${escapeVCard(employee.name)}\r\nTEL;TYPE=CELL:+${employee.phone.replace(/\D/g, "")}\r\nEMAIL;TYPE=WORK:${escapeVCard(employee.email)}\r\nEND:VCARD\r\n`
    zip.file(`${fileName(employee.shortName || employee.name)}_social.png`, await qrWithLogo(vcard, "logo-cel.png"))
  }
  if (types.includes("linkedin")) {
    if (!employee.name || !employee.role || !employee.company || !employee.linkedin) return Response.json({ error: "El QR LinkedIn requiere nombre, puesto, empresa y enlace de LinkedIn." }, { status: 400 })
    const vcard = `BEGIN:VCARD\r\nVERSION:3.0\r\nFN:${escapeVCard(employee.name)}\r\nTITLE:${escapeVCard(employee.role)}\r\nORG:${escapeVCard(employee.company)}\r\nURL:${escapeVCard(employee.linkedin)}\r\nEND:VCARD\r\n`
    zip.file(`${fileName(employee.shortName || employee.name)}_linkedin.png`, await qrWithLogo(vcard, "logo-linkedin.jpeg"))
  }
  const content = await zip.generateAsync({ type: "uint8array", compression: "DEFLATE", compressionOptions: { level: 9 } })
  return new Response(content, { headers: { "Content-Type": "application/zip", "Content-Disposition": `attachment; filename=${fileName(employee.shortName || employee.name)}_qr.zip` } })
}
