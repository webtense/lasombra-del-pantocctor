# Sincronización de Contactos a Brevo

## Estado: ✅ OPERATIVO

Sistema completo de sincronización de contactos (compradores + testers + externos) a Brevo, listo para campañas de email marketing del libro "La Sombra del Pantocrátor".

---

## 📋 Uso Rápido

### Script CLI
```bash
cd /home/asanchez/Documentos/@PERSONAL/Proyectos/Personal/LaSombraDelPantocrator/02-WEB

# Sincronizar compradores + testers
npx tsx scripts/sync-brevo-contacts.ts

# Con lista externa (CSV)
npx tsx scripts/sync-brevo-contacts.ts --external /ruta/archivo.csv

# Verificar estado en Brevo
npx tsx scripts/verify-brevo.ts
```

---

## 📊 Estado Actual

**Lista "La Sombra del Pantocrátor — Lectores":**
- ID Brevo: 8
- Contactos únicos: 7
- Carpeta: "La Sombra del Pantocrátor" (ID: 5)
- Estado: ✅ Operativo

**Cuenta Brevo:**
- Plan: Free (300 envíos/día)
- Créditos: 300 disponibles
- Remitente verificado: webtense@gmail.com

---

## 🔧 Arquitectura

### Fuentes de Datos
1. **Compradores** → Supabase RPC `get_purchases_activity()`
2. **Testers** → Tabla `testers` de Supabase
3. **Externos** → Archivos CSV o entrada manual

### Flujo de Sincronización
```
Compradores + Testers + Externos
         ↓
   Deduplicación
   Validación (regex)
         ↓
   Crear/Buscar Lista en Brevo
         ↓
   Sincronizar a Brevo
   (individual <20, bulk ≥20)
         ↓
   Reporte de estadísticas
```

---

## 📁 Archivos

| Archivo | Propósito |
|---------|-----------|
| `scripts/sync-brevo-contacts.ts` | Script CLI de sincronización |
| `scripts/verify-brevo.ts` | Verificación de listas y estado |
| `SYNC_EXECUTION_14SEP2026.md` | Reporte detallado de última ejecución |
| `SYNC_BREVO_RESULT.md` | Documentación original (anterior) |

---

## 🚀 Próximos Pasos

### Automático
Cuando se agreguen **compradores reales** a Supabase, ejecutar:
```bash
npx tsx scripts/sync-brevo-contacts.ts
```

### Periódico
Configurar cron diario (08:00 CET):
```bash
0 8 * * * cd /path/02-WEB && npx tsx scripts/sync-brevo-contacts.ts >> /var/log/brevo-sync.log 2>&1
```

### Campañas
Usar el panel `/admin/dashboard` → "Mailing" para crear y enviar campañas a la lista sincronizada.

---

## ✅ Checklist de Validación

- [x] Variables de entorno configuradas
- [x] Script CLI completo y refactorizado
- [x] Supabase (compradores + testers) accesible
- [x] API Brevo operativa
- [x] Deduplicación funcionando
- [x] Sincronización individual (<20) funcionando
- [x] Sincronización en bloque (≥20) lista
- [x] Validación de emails
- [x] Manejo de errores robusto
- [x] CSV externo soportado
- [x] Reportaje de estadísticas claro

---

**Generado:** 2026-09-14  
**Por:** Claude (subagente)
