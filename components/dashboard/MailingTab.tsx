'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Card, StatCard } from './ui'
import EmailCard from './EmailCard'

// Pestaña "Mailing" — sincronización de contactos a Brevo y envío de campañas.
//
// El envío está partido en dos pasos a propósito: "Crear campaña" deja un
// borrador en Brevo y enseña el resumen; "Enviar ahora" es un botón aparte,
// con doble confirmación, porque un envío no se puede deshacer y lo ven
// terceros.

type SourceStatus = {
  id: 'purchases' | 'testers'
  label: string
  available: boolean
  count: number
  message?: string
}

type BrevoList = { id: number; name: string; folderId: number; totalSubscribers: number; uniqueSubscribers: number }

type CountsResponse = {
  brevoConfigured: boolean
  brevoMessage?: string
  sources: SourceStatus[]
  truncated?: boolean
  lists: BrevoList[]
  listsError?: string | null
  plan?: { type: string; credits: number | null; creditsType: string | null } | null
  dailySendLimit: number
  creditsRemaining?: number | null
}

type Draft = {
  campaignId: number
  name: string
  subject: string
  listId: number
  recipientCount: number | null
  dailySendLimit: number
  creditsRemaining: number | null
  exceedsDailyLimit: boolean
}

const EMAIL_RE = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]{2,}$/

// Acepta un email por línea y también separados por coma o punto y coma,
// que es como suelen salir pegados de una hoja de cálculo.
function parseEmailList(raw: string): { valid: string[]; invalid: string[] } {
  const tokens = raw
    .split(/[\n,;]+/)
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)

  const seen = new Set<string>()
  const valid: string[] = []
  const invalid: string[] = []
  for (const t of tokens) {
    if (!EMAIL_RE.test(t)) {
      if (invalid.length < 10) invalid.push(t)
      continue
    }
    if (seen.has(t)) continue
    seen.add(t)
    valid.push(t)
  }
  return { valid, invalid }
}

const inputCls = 'bg-[#0D1117] border border-gray-700 text-white rounded px-3 py-2 text-xs w-full'
const primaryBtn =
  'bg-[#C9A84C] hover:bg-[#E0C97A] disabled:opacity-40 disabled:cursor-not-allowed text-[#050810] font-semibold rounded px-4 py-2 text-xs transition-all'
const ghostBtn =
  'border border-[#C9A84C]/40 text-[#C9A84C] hover:bg-[#C9A84C]/10 disabled:opacity-40 px-4 py-2 rounded text-xs transition-all'

function Notice({ kind, children }: { kind: 'error' | 'warn' | 'ok'; children: React.ReactNode }) {
  const styles = {
    error: 'border-red-800/50 bg-red-950/30 text-red-300',
    warn: 'border-amber-700/50 bg-amber-950/30 text-amber-300',
    ok: 'border-emerald-700/50 bg-emerald-950/30 text-emerald-300',
  }[kind]
  return <div className={`border rounded px-3 py-2 text-xs ${styles}`}>{children}</div>
}

// ─────────────────────────────────────────────
// Sincronizar contactos
// ─────────────────────────────────────────────
function SyncSection({
  counts,
  loading,
  onSynced,
}: {
  counts: CountsResponse | null
  loading: boolean
  onSynced: () => void
}) {
  const [usePurchases, setUsePurchases] = useState(false)
  const [useTesters, setUseTesters] = useState(false)
  const [useExternal, setUseExternal] = useState(false)
  const [externalRaw, setExternalRaw] = useState('')
  const [listName, setListName] = useState('La Sombra del Pantocrátor — Lectores')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const external = useMemo(() => parseEmailList(externalRaw), [externalRaw])

  const sourceOf = (id: SourceStatus['id']) => counts?.sources.find((s) => s.id === id)
  const purchases = sourceOf('purchases')
  const testers = sourceOf('testers')

  // Cota superior: las fuentes pueden solaparse (un tester que además compró),
  // así que el número real tras deduplicar puede ser menor. Se dice tal cual
  // en la UI en vez de prometer una cifra exacta que no se ha calculado.
  const estimated =
    (usePurchases ? purchases?.count ?? 0 : 0) +
    (useTesters ? testers?.count ?? 0 : 0) +
    (useExternal ? external.valid.length : 0)

  const sources = [
    ...(usePurchases ? ['purchases'] : []),
    ...(useTesters ? ['testers'] : []),
    ...(useExternal ? ['external'] : []),
  ]

  const readFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result || '')
      // CSV de una columna: se queda con el primer campo de cada línea.
      const emails = text
        .split(/\r?\n/)
        .map((line) => line.split(/[,;]/)[0].trim())
        .filter(Boolean)
        .join('\n')
      setExternalRaw((prev) => (prev.trim() ? `${prev.trim()}\n${emails}` : emails))
      setUseExternal(true)
    }
    reader.readAsText(file)
  }

  const submit = async () => {
    setError(null)
    setResult(null)
    if (sources.length === 0) {
      setError('Elige al menos una fuente de contactos.')
      return
    }
    if (useExternal && external.valid.length === 0) {
      setError('La lista externa no tiene ningún email válido.')
      return
    }
    if (!confirm(`Se van a sincronizar hasta ${estimated} emails a la lista "${listName}". ¿Continuar?`)) return

    setBusy(true)
    try {
      const res = await fetch('/api/admin/dashboard/mailing/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sources, externalEmails: useExternal ? external.valid : [], listName }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || `Error ${res.status}`)
        return
      }
      const r = json.result
      setResult(
        r.mode === 'import'
          ? `${json.total} emails enviados a Brevo como importación en bloque (proceso ${r.processId ?? '—'}). ` +
            `Brevo la procesa en segundo plano: el recuento de la lista tarda unos segundos en actualizarse.`
          : `${json.total} emails procesados en la lista "${json.list.name}" (id ${json.list.id}): ` +
            `${r.upserted + r.alreadyExisted} dados de alta o actualizados, ${r.failed} fallos. ` +
            `Brevo no distingue alta nueva de contacto ya existente, así que este número incluye ambos.`
      )
      onSynced()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de red')
    } finally {
      setBusy(false)
    }
  }

  const CheckRow = ({
    checked,
    onChange,
    label,
    status,
  }: {
    checked: boolean
    onChange: (v: boolean) => void
    label: string
    status?: SourceStatus
  }) => (
    <label className="flex items-start gap-3 bg-[#050810] border border-gray-800 rounded p-3 cursor-pointer hover:border-gray-700">
      <input
        type="checkbox"
        checked={checked}
        disabled={status ? !status.available : false}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 accent-[#C9A84C]"
      />
      <span className="flex-1">
        <span className="text-white text-xs font-medium">{label}</span>
        {status && (
          <span className="block text-[11px] mt-0.5">
            {status.available ? (
              <span className="text-[#C9A84C]">{status.count} emails</span>
            ) : (
              <span className="text-gray-600">No disponible</span>
            )}
            {status.message && <span className="block text-gray-600 mt-1">{status.message}</span>}
          </span>
        )}
      </span>
    </label>
  )

  return (
    <Card title="Sincronizar contactos con Brevo">
      {loading && <p className="text-gray-600 text-sm">Cargando fuentes…</p>}

      {!loading && counts && !counts.brevoConfigured && (
        <Notice kind="error">{counts.brevoMessage || 'Brevo no está configurado.'}</Notice>
      )}

      {!loading && counts && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <CheckRow checked={usePurchases} onChange={setUsePurchases} label="Compradores" status={purchases} />
            <CheckRow checked={useTesters} onChange={setUseTesters} label="Testers" status={testers} />
            <CheckRow
              checked={useExternal}
              onChange={setUseExternal}
              label="Lista externa (pegar o CSV)"
            />
          </div>

          {useExternal && (
            <div className="mb-4 space-y-2">
              <textarea
                rows={6}
                value={externalRaw}
                onChange={(e) => setExternalRaw(e.target.value)}
                placeholder={'un-email@por-linea.com\notro@ejemplo.com'}
                className={`${inputCls} font-mono`}
              />
              <div className="flex items-center gap-3 flex-wrap">
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,.txt"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) readFile(f)
                    e.target.value = ''
                  }}
                  className="hidden"
                />
                <button type="button" onClick={() => fileRef.current?.click()} className={ghostBtn}>
                  Subir CSV
                </button>
                <span className="text-xs text-gray-500">
                  {external.valid.length} válidos
                  {external.invalid.length > 0 && (
                    <span className="text-amber-400"> · {external.invalid.length} descartados</span>
                  )}
                </span>
              </div>
              {external.invalid.length > 0 && (
                <Notice kind="warn">
                  Se ignorarán estas entradas por no parecer emails: {external.invalid.join(', ')}
                  {external.invalid.length >= 10 && '…'}
                </Notice>
              )}
            </div>
          )}

          <div className="flex items-end gap-3 flex-wrap mb-4">
            <div className="flex-1 min-w-[260px]">
              <label className="block text-gray-600 text-[10px] uppercase tracking-wider mb-1">
                Lista de destino en Brevo (se crea si no existe)
              </label>
              <input value={listName} onChange={(e) => setListName(e.target.value)} className={inputCls} />
            </div>
            <button onClick={submit} disabled={busy || !counts.brevoConfigured || sources.length === 0} className={primaryBtn}>
              {busy ? 'Sincronizando…' : `Sincronizar ${estimated} emails`}
            </button>
          </div>

          {sources.length > 1 && (
            <p className="text-gray-600 text-[11px] mb-3">
              {estimated} es el máximo: las fuentes pueden solaparse y los duplicados se eliminan antes de subirlos.
            </p>
          )}
          {counts.truncated && (
            <Notice kind="warn">
              Hay más compradores de los que devuelve una sola lectura (tope de 500). Solo se sincronizarán los 500 más recientes.
            </Notice>
          )}

          {error && <div className="mt-3"><Notice kind="error">{error}</Notice></div>}
          {result && <div className="mt-3"><Notice kind="ok">{result}</Notice></div>}
        </>
      )}
    </Card>
  )
}

// ─────────────────────────────────────────────
// Crear y enviar campaña
// ─────────────────────────────────────────────
function CampaignSection({
  counts,
  onSent,
}: {
  counts: CountsResponse | null
  onSent: () => void
}) {
  const [subject, setSubject] = useState('')
  const [bodyText, setBodyText] = useState('')
  const [listId, setListId] = useState<number | ''>('')
  const [draft, setDraft] = useState<Draft | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sentInfo, setSentInfo] = useState<string | null>(null)

  const lists = counts?.lists || []
  const limit = counts?.dailySendLimit ?? 300

  // Preselecciona la lista con más contactos: en la práctica es siempre la
  // que se acaba de sincronizar.
  useEffect(() => {
    if (listId === '' && lists.length > 0) {
      const best = [...lists].sort((a, b) => b.uniqueSubscribers - a.uniqueSubscribers)[0]
      setListId(best.id)
    }
  }, [lists, listId])

  const create = async () => {
    setError(null)
    setSentInfo(null)
    if (!subject.trim() || !bodyText.trim() || listId === '') {
      setError('Rellena asunto, cuerpo y lista de destinatarios.')
      return
    }
    setBusy(true)
    try {
      const res = await fetch('/api/admin/dashboard/mailing/campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, bodyText, listId }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || `Error ${res.status}`)
        return
      }
      setDraft(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de red')
    } finally {
      setBusy(false)
    }
  }

  const send = async () => {
    if (!draft) return
    setError(null)

    const n = draft.recipientCount ?? 0
    if (!confirm(`Vas a ENVIAR "${draft.subject}" a ${n} destinatarios. Esto no se puede deshacer. ¿Seguir?`)) return
    if (!confirm('Segunda confirmación: los correos saldrán inmediatamente. ¿Enviar ahora?')) return

    setBusy(true)
    try {
      const res = await fetch('/api/admin/dashboard/mailing/campaign/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId: draft.campaignId, recipientCount: draft.recipientCount }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || `Error ${res.status}`)
        return
      }
      setSentInfo(`Campaña ${draft.campaignId} enviada a ${n} destinatarios.`)
      setDraft(null)
      setSubject('')
      setBodyText('')
      onSent()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de red')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card title="Crear y enviar campaña">
      <div className="space-y-3">
        <div>
          <label className="block text-gray-600 text-[10px] uppercase tracking-wider mb-1">Asunto</label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Ya está disponible el audiolibro"
            className={inputCls}
          />
        </div>

        <div>
          <label className="block text-gray-600 text-[10px] uppercase tracking-wider mb-1">
            Cuerpo (texto plano — cada párrafo en blanco se convierte en un &lt;p&gt;)
          </label>
          <textarea
            rows={10}
            value={bodyText}
            onChange={(e) => setBodyText(e.target.value)}
            className={inputCls}
          />
        </div>

        <div className="flex items-end gap-3 flex-wrap">
          <div className="flex-1 min-w-[260px]">
            <label className="block text-gray-600 text-[10px] uppercase tracking-wider mb-1">Lista de destinatarios</label>
            <select
              value={listId}
              onChange={(e) => setListId(e.target.value === '' ? '' : Number(e.target.value))}
              className={inputCls}
            >
              <option value="">— Elige una lista —</option>
              {lists.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} ({l.uniqueSubscribers} contactos)
                </option>
              ))}
            </select>
          </div>
          <button onClick={create} disabled={busy || !counts?.brevoConfigured} className={primaryBtn}>
            {busy && !draft ? 'Creando…' : 'Crear campaña'}
          </button>
        </div>

        <p className="text-gray-600 text-[11px]">
          Remitente: <span className="text-gray-400">La Sombra del Pantocrátor &lt;webtense@gmail.com&gt;</span> —
          es el único verificado en Brevo para campañas.
        </p>

        {error && <Notice kind="error">{error}</Notice>}
        {sentInfo && <Notice kind="ok">{sentInfo}</Notice>}

        {draft && (
          <div className="border border-[#C9A84C]/40 rounded-lg p-4 bg-[#050810] space-y-3">
            <p className="text-white text-sm font-medium">Borrador creado — todavía NO se ha enviado nada</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <p className="text-gray-600 uppercase tracking-wider text-[10px]">Campaña</p>
                <p className="text-gray-300 font-mono">#{draft.campaignId}</p>
              </div>
              <div>
                <p className="text-gray-600 uppercase tracking-wider text-[10px]">Asunto</p>
                <p className="text-gray-300 truncate">{draft.subject}</p>
              </div>
              <div>
                <p className="text-gray-600 uppercase tracking-wider text-[10px]">Destinatarios</p>
                <p className="text-[#C9A84C] font-semibold">{draft.recipientCount ?? '—'}</p>
              </div>
              <div>
                <p className="text-gray-600 uppercase tracking-wider text-[10px]">Envíos hoy</p>
                <p className="text-gray-300">
                  {draft.creditsRemaining ?? '—'} <span className="text-gray-600">/ {draft.dailySendLimit}</span>
                </p>
              </div>
            </div>

            {draft.exceedsDailyLimit ? (
              <Notice kind="warn">
                La lista tiene {draft.recipientCount} destinatarios y hoy solo quedan{' '}
                {draft.creditsRemaining ?? draft.dailySendLimit} envíos disponibles (plan Free de Brevo:{' '}
                {draft.dailySendLimit} al día, y el contador ya baja con lo enviado hoy). Brevo cortará el envío al
                llegar al tope: reparte la lista en varios días o sube de plan antes de enviar.
              </Notice>
            ) : (
              <p className="text-gray-600 text-[11px]">
                Cabe en los {draft.creditsRemaining ?? draft.dailySendLimit} envíos que quedan hoy
                (plan Free: {draft.dailySendLimit}/día).
              </p>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={send}
                disabled={busy}
                className="bg-red-900/60 hover:bg-red-800 border border-red-700 disabled:opacity-40 text-white font-semibold rounded px-4 py-2 text-xs transition-all"
              >
                {busy ? 'Enviando…' : 'Enviar ahora (irreversible)'}
              </button>
              <button onClick={() => setDraft(null)} disabled={busy} className={ghostBtn}>
                Descartar borrador
              </button>
            </div>
            <p className="text-gray-600 text-[11px]">
              &quot;Descartar borrador&quot; solo lo quita de esta pantalla; la campaña sigue como borrador en Brevo.
            </p>
          </div>
        )}
      </div>
    </Card>
  )
}

// ─────────────────────────────────────────────
export default function MailingTab() {
  const [counts, setCounts] = useState<CountsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [emailRefresh, setEmailRefresh] = useState(0)

  const load = useCallback(() => {
    setLoading(true)
    fetch('/api/admin/dashboard/mailing/contacts-count')
      .then((r) => r.json())
      .then(setCounts)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const totalContacts = (counts?.lists || []).reduce((a, l) => a + l.uniqueSubscribers, 0)

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Contactos en Brevo"
          value={totalContacts}
          sub={`${counts?.lists.length ?? 0} listas`}
          loading={loading}
        />
        <StatCard
          label="Envíos disponibles hoy"
          value={counts?.creditsRemaining ?? '—'}
          sub={`de ${counts?.dailySendLimit ?? 300}/día · plan ${counts?.plan?.type ?? 'free'} de Brevo`}
          loading={loading}
        />
        <StatCard
          label="Emails en fuentes propias"
          value={(counts?.sources || []).reduce((a, s) => a + s.count, 0)}
          sub="Compradores + testers (antes de deduplicar)"
          loading={loading}
        />
      </div>

      <SyncSection counts={counts} loading={loading} onSynced={load} />
      <CampaignSection
        counts={counts}
        onSent={() => {
          load()
          setEmailRefresh((v) => v + 1)
        }}
      />
      <EmailCard refreshKey={emailRefresh} />
    </div>
  )
}
