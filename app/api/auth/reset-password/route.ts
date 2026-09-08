import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase'
import { generatePassword, hashPassword } from '@/lib/auth-password-helper'
import { sendPasswordResetEmail } from '@/lib/brevo'
import { rateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'
// scrypt (hashPassword) requiere Node runtime, no Edge.
export const runtime = 'nodejs'

// Respuesta única para TODOS los casos de éxito lógico (exista o no el email,
// se haya enviado o no el correo). No revelar si un email está registrado es
// lo que impide usar este endpoint para enumerar compradores.
const GENERIC_OK = {
  ok: true,
  message: 'Si ese email tiene una compra registrada, recibirás una contraseña nueva en unos minutos.',
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function clientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '0.0.0.0'
  )
}

/**
 * POST /api/auth/reset-password  { email }
 *
 * Vía de recuperación para el comprador que se quedó sin contraseña (por
 * ejemplo porque Brevo falló al entregar el email de compra: el webhook creaba
 * el login pero la contraseña solo existía en aquel email que nunca salió).
 *
 * Genera una contraseña nueva, sobrescribe el hash vía reset_user_password()
 * —la RPC del webhook hace ON CONFLICT DO NOTHING y no serviría— y la reenvía.
 * Si el envío falla, restaura el hash anterior para no dejar al usuario peor
 * de lo que estaba.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const rawEmail = typeof body?.email === 'string' ? body.email : ''
    const email = rawEmail.trim().toLowerCase()

    if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
      return NextResponse.json({ ok: false, error: 'Email no válido' }, { status: 400 })
    }

    // Rate limit doble: por IP (contra el escaneo masivo) y por email (contra
    // el bombardeo a un comprador concreto desde varias IPs). Se comprueba
    // ANTES de tocar la base de datos y da la misma respuesta exista o no el
    // email, así que no filtra nada.
    const ipOk = rateLimit(`reset:ip:${clientIp(req)}`, 5, 15 * 60 * 1000)
    const emailOk = rateLimit(`reset:email:${email}`, 3, 60 * 60 * 1000)
    if (!ipOk || !emailOk) {
      return NextResponse.json(
        { ok: false, error: 'Demasiadas peticiones. Inténtalo de nuevo más tarde.' },
        { status: 429 }
      )
    }

    const sb = getServerSupabase()
    if (!sb) {
      console.error('[auth/reset-password] Supabase no configurado')
      return NextResponse.json({ ok: false, error: 'Servicio no disponible' }, { status: 503 })
    }

    // 1. ¿Existe el login y sigue viva la compra? get_user_login ya valida
    //    revoked/expires_at. Guardamos el hash actual para poder restaurarlo
    //    si el envío falla.
    const { data: rows, error: lookupError } = await sb.rpc('get_user_login', { p_email: email })
    if (lookupError) {
      console.error('[auth/reset-password] get_user_login error', lookupError)
      return NextResponse.json({ ok: false, error: 'Error interno' }, { status: 500 })
    }

    const existing = Array.isArray(rows) ? rows[0] : rows
    if (!existing) {
      // Email desconocido: misma respuesta, mismo código, sin enviar nada.
      return NextResponse.json(GENERIC_OK)
    }
    const previousHash: string | null = existing.password_hash ?? null

    // 2. Generar y guardar la contraseña nueva.
    const newPassword = generatePassword()
    const { data: updated, error: resetError } = await sb.rpc('reset_user_password', {
      p_email: email,
      p_password_hash: hashPassword(newPassword),
    })

    if (resetError) {
      if ((resetError as { code?: string }).code === 'PGRST202') {
        console.error(
          '[auth/reset-password] la función reset_user_password no existe todavía —',
          'ejecutar SQL_FIXES_PENDIENTE_EJECUTAR.sql en Supabase'
        )
      } else {
        console.error('[auth/reset-password] reset_user_password error', resetError)
      }
      // Respuesta genérica también aquí: un 500 solo para los emails que
      // existen convertiría este endpoint en un oráculo de enumeración. El
      // fallo queda en el log del servidor, que es donde debe verse.
      return NextResponse.json(GENERIC_OK)
    }

    if (!updated) {
      // La compra pudo revocarse/caducar entre la consulta y el update.
      return NextResponse.json(GENERIC_OK)
    }

    // 3. Enviar. Si falla, restaurar el hash anterior: dejar al usuario con una
    //    contraseña que nadie le ha comunicado sería exactamente el bug que
    //    este endpoint viene a arreglar.
    const base = process.env.NEXT_PUBLIC_URL || 'https://la-sombra-del-pantocrator.vercel.app'
    const sendResult = await sendPasswordResetEmail({
      toEmail: email,
      newPassword,
      panelUrl: `${base}/login`,
    })

    if (!sendResult.sent) {
      console.error('[auth/reset-password] envío fallido', email, sendResult.error)
      if (previousHash) {
        const { error: restoreError } = await sb.rpc('reset_user_password', {
          p_email: email,
          p_password_hash: previousHash,
        })
        if (restoreError) {
          console.error(
            '[auth/reset-password] 🔴 no se pudo restaurar el hash anterior —',
            'el usuario queda con una contraseña que no conoce', email, restoreError
          )
        }
      }
      // Misma respuesta genérica: no se le cuenta al atacante qué ha pasado.
      return NextResponse.json(GENERIC_OK)
    }

    console.log('[auth/reset-password] contraseña nueva enviada a', email)
    return NextResponse.json(GENERIC_OK)
  } catch (err) {
    console.error('[auth/reset-password] error inesperado', err)
    return NextResponse.json({ ok: false, error: 'Error interno' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
