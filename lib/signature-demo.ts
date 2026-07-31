export type CompanyId = "global" | "ofimundo" | "dreamtec" | "nueva"

export type Employee = {
  id: number
  name: string
  role: string
  email: string
  company: CompanyId
  phone?: string
  booking?: string
  linkedin?: string
  qrCell: boolean
  qrLinkedin: boolean
}

export const companies = [
  { id: "global" as const, name: "Global Horizon Latam", short: "GH", count: 12 },
  { id: "ofimundo" as const, name: "Ofimundo", short: "OF", count: 8 },
  { id: "dreamtec" as const, name: "Dreamtec", short: "DT", count: 6 },
  { id: "nueva" as const, name: "Nueva empresa", short: "NE", count: 0 },
]

export const employees: Employee[] = [
  { id: 1, name: "María González", role: "Directora comercial", email: "maria.gonzalez@globalhorizonlatam.com", company: "global", phone: "+52 55 1234 8890", linkedin: "linkedin.com/in/mariagonzalez", qrCell: true, qrLinkedin: true },
  { id: 2, name: "Carlos Ramírez", role: "Gerente de operaciones", email: "carlos.ramirez@globalhorizonlatam.com", company: "global", phone: "+52 55 9088 1022", linkedin: "linkedin.com/in/carlosramirez", qrCell: false, qrLinkedin: true },
  { id: 3, name: "Ana Torres", role: "Consultora senior", email: "ana.torres@globalhorizonlatam.com", company: "global", linkedin: "linkedin.com/in/anatorres", qrCell: false, qrLinkedin: false },
  { id: 4, name: "Jorge Medina", role: "Ejecutivo de cuenta", email: "jorge.medina@globalhorizonlatam.com", company: "global", phone: "+52 55 4421 6800", qrCell: true, qrLinkedin: false },
  { id: 5, name: "Fernanda Silva", role: "Account manager", email: "fernanda.silva@ofimundo.com", company: "ofimundo", phone: "+52 55 0021 4432", booking: "booking.ofimundo.com/fernanda", linkedin: "linkedin.com/in/fernandasilva", qrCell: true, qrLinkedin: true },
  { id: 6, name: "Roberto Castillo", role: "Especialista de producto", email: "roberto.castillo@ofimundo.com", company: "ofimundo", phone: "+52 55 5520 1120", linkedin: "linkedin.com/in/robertocastillo", qrCell: true, qrLinkedin: true },
  { id: 7, name: "Lucía Herrera", role: "Diseñadora", email: "lucia.herrera@ofimundo.com", company: "ofimundo", phone: "+52 55 1122 8871", booking: "booking.ofimundo.com/lucia", qrCell: true, qrLinkedin: false },
  { id: 8, name: "Diego Lozano", role: "Director creativo", email: "diego.lozano@dreamtec.com", company: "dreamtec", phone: "+52 55 9811 4520", linkedin: "linkedin.com/in/diegolozano", qrCell: true, qrLinkedin: true },
  { id: 9, name: "Sofía Vega", role: "Product manager", email: "sofia.vega@dreamtec.com", company: "dreamtec", phone: "+52 55 3201 0900", linkedin: "linkedin.com/in/sofiavega", qrCell: false, qrLinkedin: true },
]

export const proposalMeta = [
  { id: "guided", label: "01 · Asistente", description: "Paso a paso, ideal para evitar errores." },
  { id: "operations", label: "02 · Operativo", description: "Todo a la vista para trabajo recurrente." },
  { id: "compact", label: "03 · Compacto", description: "Alta densidad para decidir con rapidez." },
] as const

export type Proposal = (typeof proposalMeta)[number]["id"]
