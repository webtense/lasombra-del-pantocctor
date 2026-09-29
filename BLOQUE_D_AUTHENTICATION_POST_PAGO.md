# Bloque D: Autenticación Post-Pago

## Estado actual
- ✅ `/lib/auth-session.ts` - Helper JWT con `createAuthToken()` y `verifyAuthToken()`
- ✅ `/app/api/auth/login/route.ts` - POST endpoint con validación email+password
- ✅ `/app/api/auth/logout/route.ts` - POST endpoint para logout (limpiar cookie)

## Faltantes para completar

### 1. Tabla Supabase `user_logins`

Crear en Supabase SQL Editor (o migración):

```sql
CREATE TABLE user_logins (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  purchase_id BIGINT NOT NULL REFERENCES purchases(id),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_logins_email ON user_logins(email);
```

**Campos:**
- `email`: Email único del usuario (login)
- `password_hash`: Hash scrypt con formato `scrypt$N$r$p$salt$hash`
- `purchase_id`: FK a tabla `purchases` (audit trail)
- `created_at`, `updated_at`: Timestamps

### 2. Tabla Supabase `purchases` (asumida existente)

El endpoint `/api/auth/login` asume que existe tabla `purchases` con al menos:
```sql
CREATE TABLE purchases (
  id BIGSERIAL PRIMARY KEY,
  -- otros campos...
);
```

Si no existe, crear o verificar en Supabase dashboard.

### 3. Helper para hash de password (lado cliente/servidor)

Crear archivo `/lib/auth-password-helper.ts`:

```typescript
import { scryptSync, randomBytes } from 'crypto'

// Hash scrypt con parámetros seguros (N=32768, r=8, p=1)
export function hashPassword(password: string): string {
  const N = 32768  // 2^15
  const r = 8
  const p = 1
  const saltBytes = randomBytes(16)
  const salt = saltBytes.toString('base64')
  
  const hash = scryptSync(password, saltBytes, 32, { N, r, p })
  const hashStr = hash.toString('base64')
  
  return `scrypt$${N}$${r}$${p}$${salt}$${hashStr}`
}

// Verify (usado en /api/auth/login — YA IMPLEMENTADO)
export async function verifyPassword(
  plaintext: string,
  hash: string
): Promise<boolean> {
  // Ver app/api/auth/login/route.ts — la lógica está ahí
  return true // TODO: mover a este archivo si es necesario
}
```

**Uso:**
```typescript
const passwordHash = hashPassword('miContraseña')
// Guardar passwordHash en Supabase user_logins.password_hash
```

### 4. Crear usuario post-pago (endpoint adicional)

Crear `/app/api/auth/register/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase'
import { hashPassword } from '@/lib/auth-password-helper'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { email, password, purchaseId } = await req.json()

    const sb = getServerSupabase()
    if (!sb) {
      return NextResponse.json({ ok: false, error: 'Supabase no configurado' }, { status: 503 })
    }

    // Verificar que purchase existe
    const { data: purchase, error: pError } = await sb
      .from('purchases')
      .select('id')
      .eq('id', purchaseId)
      .single()

    if (pError || !purchase) {
      return NextResponse.json({ ok: false, error: 'Compra no válida' }, { status: 400 })
    }

    // Hash de password
    const passwordHash = hashPassword(password)

    // Crear usuario
    const { error: insertError } = await sb
      .from('user_logins')
      .insert([{ email, password_hash: passwordHash, purchase_id: purchaseId }])

    if (insertError) {
      // Si error de UNIQUE constraint, usuario ya existe
      if (insertError.code === '23505') {
        return NextResponse.json({ ok: false, error: 'Email ya registrado' }, { status: 409 })
      }
      console.error('[auth/register] Insert error:', insertError)
      return NextResponse.json({ ok: false, error: 'Error al registrar' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[auth/register] Error:', error)
    return NextResponse.json({ ok: false, error: 'Error interno' }, { status: 500 })
  }
}
```

### 5. Integrar verificación en middleware.ts

Actualizar `middleware.ts` para proteger rutas post-pago (ej: `/escuchar`, `/descargar`):

```typescript
import { verifyAuthToken, AUTH_SESSION_COOKIE } from '@/lib/auth-session'

export async function middleware(req: NextRequest) {
  // ... código admin existente ...

  // Proteger rutas post-pago
  if (req.nextUrl.pathname.startsWith('/escuchar') ||
      req.nextUrl.pathname.startsWith('/api/download/')) {
    const token = req.cookies.get(AUTH_SESSION_COOKIE)?.value
    const { valid } = await verifyAuthToken(token)
    
    if (!valid) {
      if (req.nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
      }
      // Para páginas, redirigir a login
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/dashboard/:path*',
    '/api/admin/dashboard/:path*',
    '/escuchar/:path*',           // NUEVO
    '/api/download/:path*',        // NUEVO
  ],
}
```

### 6. Variables de entorno

Añadir a `.env.local`:

```bash
# Autenticación post-pago
AUTH_SESSION_SECRET=tu-secreto-largo-aqui-minimo-32-caracteres
```

Si no se configura, usa derivado de `ADMIN_PASSWORD`.

### 7. Página de login

Crear página `/app/login/page.tsx` (frontend):

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()
      if (!data.ok) {
        setError(data.error || 'Error al iniciar sesión')
        return
      }

      router.push('/escuchar')
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleLogin} className="w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold">Acceso a tu audiolibro</h1>
        {error && <p className="text-red-600">{error}</p>}
        
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full border px-4 py-2 rounded"
        />
        
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full border px-4 py-2 rounded"
        />
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Iniciando...' : 'Iniciar sesión'}
        </button>
      </form>
    </div>
  )
}
```

## Flow completo

1. **Compra:** Usuario completa checkout Stripe → webhook crea entry en tabla `purchases`
2. **Email post-compra:** Enviar email con link a `/register?purchase_id=123`
3. **Registro:** Usuario va a `/register`, ingresa email+password
4. **Crear usuario:** POST `/api/auth/register` crea entry en `user_logins` con password hash
5. **Login:** Usuario va a `/login`, POST `/api/auth/login` valida credentials
6. **Cookie:** Si válido, GET responsea con cookie httpOnly `lsp_auth_token`
7. **Acceso:** Middleware verifica token en requests a `/escuchar`, `/api/download`, etc.
8. **Logout:** POST `/api/auth/logout` limpias la cookie

## Seguridad

- ✅ Password hash: scrypt (N=32768, r=8, p=1)
- ✅ Comparación: `timingSafeEqual()` (prevenir timing attacks)
- ✅ Cookie: httpOnly, secure (prod), sameSite=strict
- ✅ JWT: HS256, expira en 72 horas
- ✅ Middleware: verifica token ANTES de servir recursos (Edge runtime)

## Testing

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","purchaseId":1}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  -v  # Ver cookies

# Logout
curl -X POST http://localhost:3000/api/auth/logout \
  -b "lsp_auth_token=..." \
  -v
```

## Referencias

- `lib/admin-session.ts` - Patrón base (HMAC en lugar de JWT)
- `app/api/auth/login/route.ts` - Implementación login
- `app/api/auth/logout/route.ts` - Implementación logout
