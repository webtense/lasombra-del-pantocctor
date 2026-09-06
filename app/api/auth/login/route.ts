import { NextRequest, NextResponse } from 'next/server'
import { scryptSync, timingSafeEqual } from 'crypto'
import { getServerSupabase } from '@/lib/supabase'
import { createAuthToken, AUTH_SESSION_COOKIE } from '@/lib/auth-session'
import { SCRYPT_MAXMEM } from '@/lib/auth-password-helper'

export const dynamic = 'force-dynamic'
// scrypt no existe en el Edge runtime.
export const runtime = 'nodejs'

// Verifica una contraseña contra su hash scrypt.
// El hash tiene formato: "scrypt$N$r$p$salt$hash" (ver auth-password-helper.ts)
async function verifyPassword(plaintext: string, hash: string): Promise<boolean> {
  try {
    const parts = hash.split('$')
    if (parts[0] !== 'scrypt' || parts.length !== 6) return false

    const [, nStr, rStr, pStr, salt, expectedHash] = parts
    const N = parseInt(nStr, 10)
    const r = parseInt(rStr, 10)
    const p = parseInt(pStr, 10)

    // Validar parámetros scrypt (rango razonable)
    if (!Number.isFinite(N) || !Number.isFinite(r) || !Number.isFinite(p)) return false
    if (N < 2 || N > 2147483647 || r < 1 || r > 1024 || p < 1 || p > 1024) return false

    const expected = Buffer.from(expectedHash, 'base64')

    // scrypt necesita 128*N*r*p bytes; con N=32768,r=8 son exactamente los
    // 32 MiB de maxmem por defecto de Node, así que lo elevamos. Sin esto
    // scryptSync puede lanzar y el login fallaría siempre.
    const computed = scryptSync(plaintext, Buffer.from(salt, 'base64'), expected.length, {
      N,
      r,
      p,
      maxmem: SCRYPT_MAXMEM,
    })

    // timingSafeEqual lanza si las longitudes difieren: comprobar antes.
    if (computed.length !== expected.length) return false

    // Comparación segura contra timing attacks
    return timingSafeEqual(computed, expected)
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
      return NextResponse.json({ ok: false, error: 'Email y password requeridos' }, { status: 400 })
    }

    const sb = getServerSupabase()
    if (!sb) {
      return NextResponse.json({ ok: false, error: 'Supabase no configurado' }, { status: 503 })
    }

    // 1. Buscar usuario. Vía RPC SECURITY DEFINER, no con un SELECT directo:
    //    user_logins tiene RLS activo y cero policies (el hash no debe poder
    //    listarse con la anon key pública). get_user_login ya valida además
    //    que la compra asociada no esté revocada ni caducada.
    const { data: rows, error: queryError } = await sb.rpc('get_user_login', {
      p_email: email,
    })

    if (queryError) {
      console.error('[auth/login] get_user_login error:', queryError)
      return NextResponse.json({ ok: false, error: 'Error interno' }, { status: 500 })
    }

    const userLogin = Array.isArray(rows) ? rows[0] : rows

    if (!userLogin) {
      // No revelar si el email existe o no (prevenir enumeration)
      return NextResponse.json(
        { ok: false, error: 'Email o contraseña incorrectos' },
        { status: 401 }
      )
    }

    // 2. Verificar contraseña
    const passwordMatch = await verifyPassword(password, userLogin.password_hash)
    if (!passwordMatch) {
      return NextResponse.json(
        { ok: false, error: 'Email o contraseña incorrectos' },
        { status: 401 }
      )
    }

    // 3. Crear JWT
    const { token, maxAgeSeconds } = await createAuthToken(email, userLogin.purchase_id)

    // 5. Responder con cookie httpOnly
    const response = NextResponse.json({ ok: true })
    response.cookies.set(AUTH_SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: maxAgeSeconds,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('[auth/login] Error:', error)
    return NextResponse.json({ ok: false, error: 'Error interno' }, { status: 500 })
  }
}
