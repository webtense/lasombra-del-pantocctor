import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Ruta de login LEGACY: solo devuelve { ok: true }, no planta ninguna cookie,
// así que por sí sola no autentica nada en el servidor. Se mantiene por
// compatibilidad, pero sin credenciales por defecto: sin ADMIN_USERNAME y
// ADMIN_PASSWORD en el entorno, rechaza cualquier intento.
export async function POST(req: NextRequest) {
  try {
    const correctUser = process.env.ADMIN_USERNAME
    const correctPass = process.env.ADMIN_PASSWORD

    if (!correctUser || !correctPass) {
      console.error('[api/admin/auth] faltan ADMIN_USERNAME / ADMIN_PASSWORD')
      return NextResponse.json(
        { ok: false, error: 'Autenticación de admin no configurada en el servidor' },
        { status: 500 }
      )
    }

    const { username, password } = await req.json()

    if (username === correctUser && password === correctPass) {
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ ok: false, error: 'Credenciales incorrectas' }, { status: 401 })
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
}
