import { getServerSupabase } from '@/lib/supabase'
import TesterReviewForm from '@/components/TesterReviewForm'

export const dynamic = 'force-dynamic'

type ValidateResult = {
  ok: boolean
  tester_id: number | null
  tester_name: string | null
  tester_email: string | null
  expires_at: string | null
  reason: string | null
}

async function validateToken(token: string): Promise<ValidateResult> {
  const sb = getServerSupabase()
  if (!sb) {
    return { ok: false, tester_id: null, tester_name: null, tester_email: null, expires_at: null, reason: 'no_supabase' }
  }
  const { data, error } = await sb.rpc('validate_tester_token', { p_token: token })
  if (error) {
    console.error('[tester/page] validate_tester_token error', error)
    return { ok: false, tester_id: null, tester_name: null, tester_email: null, expires_at: null, reason: 'error' }
  }
  const row = Array.isArray(data) ? data[0] : data
  return row as ValidateResult
}

function reasonLabel(reason: string | null) {
  if (reason === 'expired') return 'Este enlace ha caducado.'
  if (reason === 'revoked') return 'Este enlace ha sido desactivado.'
  return 'Este enlace no es válido.'
}

export default async function TesterPage({ params }: { params: { token: string } }) {
  const result = await validateToken(params.token)

  if (!result.ok) {
    return (
      <div className="min-h-screen bg-[#050810] flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <h1 className="font-serif text-2xl text-white mb-3">{reasonLabel(result.reason)}</h1>
          <p className="text-gray-500 text-sm">
            Pide a Andrés que te genere un nuevo enlace de acceso.
          </p>
        </div>
      </div>
    )
  }

  const expiresLabel = result.expires_at
    ? new Date(result.expires_at).toLocaleString('es-ES', {
        day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit',
      })
    : ''

  return (
    <div className="min-h-screen bg-[#050810] pt-20 pb-20">
      <div className="max-w-2xl mx-auto px-6">

        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 border border-[#C9A84C]/30 rounded-full px-4 py-1.5 mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C]" />
            <span className="text-[#C9A84C] text-xs tracking-widest uppercase font-sans">Acceso de tester</span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl text-white mb-3">
            Lee o escucha La Sombra del Pantocrátor
          </h1>
          <p className="text-gray-400">
            {result.tester_name ? `Hola ${result.tester_name}, gracias` : 'Gracias'} por ayudarnos a probar el libro.
            Cuando termines, déjanos tu reseña más abajo.
          </p>
          {expiresLabel && (
            <p className="text-gray-600 text-xs mt-2">Este enlace caduca el {expiresLabel}</p>
          )}
        </div>

        {/* Descargas */}
        <div className="bg-[#0D1117] border border-[#C9A84C]/30 rounded-xl p-6 md:p-8 mb-8">
          <h2 className="font-serif text-xl text-white mb-5">Descargar</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <a
              href={`/api/tester/${params.token}/download?type=epub`}
              className="flex flex-col items-center gap-2 border border-[#C9A84C]/30 hover:border-[#C9A84C] rounded-lg py-5 px-3 text-center transition-colors"
            >
              <span className="text-2xl">📚</span>
              <span className="text-white text-sm font-medium">EPUB</span>
              <span className="text-gray-600 text-xs">Kindle, Kobo, Apple Books</span>
            </a>
            <a
              href={`/api/tester/${params.token}/download?type=pdf`}
              className="flex flex-col items-center gap-2 border border-[#C9A84C]/30 hover:border-[#C9A84C] rounded-lg py-5 px-3 text-center transition-colors"
            >
              <span className="text-2xl">📄</span>
              <span className="text-white text-sm font-medium">PDF</span>
              <span className="text-gray-600 text-xs">Lectura/impresión</span>
            </a>
            <a
              href={`/api/tester/${params.token}/download?type=audio`}
              className="flex flex-col items-center gap-2 border border-[#C9A84C]/30 hover:border-[#C9A84C] rounded-lg py-5 px-3 text-center transition-colors"
            >
              <span className="text-2xl">🎧</span>
              <span className="text-white text-sm font-medium">Audiolibro</span>
              <span className="text-gray-600 text-xs">MP3 completo</span>
            </a>
          </div>
        </div>

        {/* Reseña */}
        <TesterReviewForm token={params.token} defaultName={result.tester_name} defaultEmail={result.tester_email} />

      </div>
    </div>
  )
}
