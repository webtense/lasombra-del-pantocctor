# Decisión pendiente: nombre de la recepcionista — ¿Laia Vidal o Laia Puig?

**Estado: NO RESUELTO. No se ha modificado ningún fichero de código ni de contenido para esta decisión.**

## El conflicto

Existen dos nombres distintos para el mismo personaje (la recepcionista/directora
del hotel Els Ulls del Diable, interés romántico de Bruno Martí) en dos fuentes
que deberían ser coherentes entre sí:

| Fuente | Nombre usado | Ruta |
|---|---|---|
| Skill `a16-pantocrator` | **Laia Vidal** (única mención) | `~/.claude/skills/a16-pantocrator/SKILL.md:57` |
| Skill `lasombra` (el que la petición original llamaba "skill maestro") | **Laia Puig** (en todo el documento) | `~/.claude/skills/lasombra/SKILL.md` |
| Web (todas las páginas) | **Laia Puig** | `app/personajes/page.tsx`, `app/resumen/page.tsx`, `app/muestra/page.tsx` |

**Corrección respecto al encargo original:** el encargo decía que el "skill maestro"
(`~/.claude/skills/lasombra/SKILL.md`) tenía "Laia Vidal" como nombre canónico. Al
revisar el fichero completo, esto no es así — `lasombra/SKILL.md` usa "Laia Puig" en
todas sus referencias (identidad del personaje, arco Bruno↔Laia, etc.), igual que la
web. El nombre "Laia Vidal" aparece en un fichero distinto y más antiguo/específico
de dominio: `a16-pantocrator/SKILL.md`, línea 57, en una tabla resumen de
protagonistas, donde además la describe como "recepcionista hotel" (en vez de
"directora del hotel", que es como la describe `lasombra/SKILL.md` y la web).

## Dónde aparece "Laia Puig" en la web (7 ocurrencias)

- `app/personajes/page.tsx` — nombre del personaje, descripción, foto
  (`/personajes/Laia_Puig.jpg`), relación "Bruno ↔ Laia"
- `app/resumen/page.tsx` — sinopsis
- `app/muestra/page.tsx` — texto de muestra del capítulo 1 (narrativa, no solo metadata)

## Por qué no se ha tocado nada

1. El propio texto de la novela (muestra del capítulo 1 en `app/muestra/page.tsx`)
   ya usa "Laia Puig" en prosa — es más probable que "Laia Vidal" sea un resto de una
   versión de trabajo anterior de `a16-pantocrator/SKILL.md` que quedó desactualizada,
   pero esto es una suposición y no un hecho verificado contra el manuscrito fuente
   (`DEFINITIVO/EDICION_FINAL/la-sombra-del-pantocrator-edicion-final.md`).
2. Cambiar el nombre en la web sin confirmar tiene coste alto y difícil reversión:
   afecta a SEO/metadata ya indexado, a la imagen `personajes/Laia_Puig.jpg` (habría
   que renombrar el asset), y a cualquier material de publicación (KDP, Apple Books,
   Spotify) que ya use "Laia Puig".

## Decisión que necesita el usuario

¿Cuál es el nombre correcto del personaje?

- [ ] **Laia Puig** — mantener la web tal cual está; corregir `a16-pantocrator/SKILL.md`
      línea 57 para que diga "Laia Puig".
- [ ] **Laia Vidal** — cambiar las 3 páginas de la web (`personajes`, `resumen`, `muestra`)
      y el asset `public/personajes/Laia_Puig.jpg`; también habría que revisar el
      manuscrito fuente y todo el material de publicación (KDP, Apple Books, Spotify,
      dossier de publicación) por si ya usan "Laia Puig" en textos publicados/enviados.

Hasta que el usuario confirme, ningún fichero de código, contenido o skill ha sido
modificado como parte de esta decisión.
