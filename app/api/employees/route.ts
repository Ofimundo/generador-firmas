import { NextResponse } from "next/server"
import { getEmployees } from "@/lib/signatures/data"

export async function GET() {
  try {
    return NextResponse.json(await getEmployees())
  } catch {
    return NextResponse.json({ error: "No fue posible consultar los empleados." }, { status: 500 })
  }
}
