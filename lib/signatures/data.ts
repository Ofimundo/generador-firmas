import sql from "mssql"
import { read, utils } from "xlsx"
import { readFile } from "node:fs/promises"
import path from "node:path"

export type Employee = {
  id: number
  company: string
  shortName: string
  name: string
  role: string
  email: string
  phone: string
  photo: string
  photo2: string
  qrCell: string
  qrLinkedin: string
  qrWhatsapp: string
  linkedin: string
  booking: string
}

const clean = (value: unknown) => {
  const text = String(value ?? "").trim()
  return !text || text.toLowerCase() === "null" || text.toLowerCase() === "nan" ? "" : text
}

export function normalize(row: Record<string, unknown>): Employee {
  return {
    id: Number(row.id), company: clean(row.empresa), shortName: clean(row.nombre_corto),
    name: clean(row.nombre_empleado), role: clean(row.cargo_empleado), email: clean(row.correo_empleado),
    phone: clean(row.celular_empleado), photo: clean(row.foto_empleado), photo2: clean(row.foto_empleado2),
    qrCell: clean(row.qr_social), qrLinkedin: clean(row.qr_linkedin), qrWhatsapp: clean(row.qr_wsp),
    linkedin: clean(row.linkedin ?? row.linkedin_empleado), booking: clean(row.booking_empleado),
  }
}

export async function getEmployees() {
  try {
    if (!["DB_SERVER", "DB_NAME", "DB_USER", "DB_PASSWORD"].every((key) => process.env[key])) throw new Error("missing-env")
    const pool = await sql.connect({
      server: process.env.DB_SERVER!,
      database: process.env.DB_NAME!,
      user: process.env.DB_USER!,
      password: process.env.DB_PASSWORD!,
      options: {
        encrypt: true,                           // o process.env.DB_ENCRYPT !== "false"
        trustServerCertificate: true,            // <-- acá
      },
      pool: { max: 5, min: 0, idleTimeoutMillis: 30000 },
    })
    const result = await pool.request().query("SELECT * FROM BOT.Empleados_Firma")
    return { employees: result.recordset.map(normalize), source: "database" as const }
  } catch (error) {
    // Log del fallback para saber desde dónde se obtuvo la info
    const reason = error instanceof Error ? error.message : String(error)
    console.error(`[getEmployees] No se pudo conectar a la base de datos. Motivo: ${reason}. Se usará el Excel de respaldo.`)
    const buffer = await readFile(path.join(process.cwd(), "data/base-de-datos-27bf17.xlsx"))
    const workbook = read(buffer)
    const rows = utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[workbook.SheetNames[0]], { defval: null })
    return { employees: rows.map(normalize), source: "excel" as const }
  }
}
