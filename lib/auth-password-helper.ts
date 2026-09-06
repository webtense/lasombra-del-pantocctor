// Generación y hash de contraseñas para el acceso post-pago (/panel).
//
// Formato del hash almacenado en user_logins.password_hash:
//     scrypt$N$r$p$salt_b64$hash_b64
// La verificación vive en app/api/auth/login/route.ts (necesita ser Node
// runtime porque scrypt no existe en el Edge runtime).

import { randomBytes, scryptSync } from 'crypto'

// Parámetros scrypt (documentados en BLOQUE_D_AUTHENTICATION_POST_PAGO.md).
export const SCRYPT_N = 32768 // 2^15
export const SCRYPT_R = 8
export const SCRYPT_P = 1
export const SCRYPT_KEYLEN = 32

// scrypt necesita 128 * N * r * p bytes = 32 MiB con estos parámetros, que es
// exactamente el maxmem por defecto de Node. Lo subimos a 64 MiB para no
// quedarnos en el límite: sin esto scryptSync lanza "Invalid scrypt params"
// en algunos runtimes y el login fallaría siempre.
export const SCRYPT_MAXMEM = 64 * 1024 * 1024

// Alfabeto sin caracteres ambiguos (0/O, 1/l/I) — la contraseña se envía por
// email y el comprador la teclea a mano.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'

/**
 * Genera una contraseña aleatoria criptográficamente segura.
 * Usa rejection sampling para no sesgar la distribución (un `% ALPHABET.length`
 * directo favorecería los primeros caracteres del alfabeto).
 */
export function generatePassword(length = 14): string {
  const max = 256 - (256 % ALPHABET.length)
  let out = ''
  while (out.length < length) {
    const buf = randomBytes(length * 2)
    for (let i = 0; i < buf.length && out.length < length; i++) {
      if (buf[i] < max) out += ALPHABET[buf[i] % ALPHABET.length]
    }
  }
  return out
}

/**
 * Hashea una contraseña con scrypt y devuelve el string en formato
 * `scrypt$N$r$p$salt$hash` listo para guardar en Supabase.
 */
export function hashPassword(password: string): string {
  const saltBytes = randomBytes(16)
  const hash = scryptSync(password, saltBytes, SCRYPT_KEYLEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
    maxmem: SCRYPT_MAXMEM,
  })
  return [
    'scrypt',
    SCRYPT_N,
    SCRYPT_R,
    SCRYPT_P,
    saltBytes.toString('base64'),
    hash.toString('base64'),
  ].join('$')
}
