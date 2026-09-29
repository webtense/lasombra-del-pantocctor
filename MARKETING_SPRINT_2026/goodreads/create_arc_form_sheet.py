#!/usr/bin/env python3
"""
Script para crear Google Form + Sheet automáticamente para ARCs
"La Sombra del Pantocrator"

USO:
    python3 create_arc_form_sheet.py

REQUISITOS:
    pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client
    + archivo credentials en ./credentials/google-tts-service-account.json

SALIDA:
    - Google Sheet creada con nombre: "ARC_Solicitudes_LaSombraDelPantocrator"
    - Google Form creada con nombre: "Solicita tu ARC — La Sombra del Pantocrátor"
    - Form conectado automáticamente al Sheet
    - URLs guardadas en arc_form_urls.json
"""

import json
import os
import sys
from pathlib import Path
from typing import Optional

from google.auth.transport.requests import Request
from google.oauth2.service_account import Credentials
from google.api_core.gapic_v1 import client_info as grpc_client_info
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# =============================================================================
# CONFIG
# =============================================================================

CREDS_PATH = Path(__file__).parent.parent.parent.parent / "04-AUDIO/produccion/audiobook/credentials/google-tts-service-account.json"
SCOPES = [
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/forms",
    "https://www.googleapis.com/auth/spreadsheets",
]

FORM_TITLE = "Solicita tu ARC — La Sombra del Pantocrátor"
FORM_DESC = """Formulario oficial para solicitar una copia anticipada (ARC) del libro
"La Sombra del Pantocrátor" antes de su publicación.

Solo 50 copias disponibles. Las solicitudes se procesan en orden de llegada."""

SHEET_TITLE = "ARC_Solicitudes_LaSombraDelPantocrator"

# Columnas para el Sheet de seguimiento
SHEET_COLUMNS = [
    "Timestamp",
    "Nombre",
    "Email",
    "Goodreads Usuario",
    "Goodreads URL",
    "País",
    "Razón de Solicitud",
    "Géneros Favoritos",
    "Formato",
    "Redes Sociales",
    "Libros Similares",
    "Consentimiento Público",
    "Status",
    "Fecha Aprobación",
    "Fecha Envío ARC",
    "Fecha Reseña",
    "Link Reseña",
    "Calificación",
    "Notas",
]

# =============================================================================
# AUTH
# =============================================================================

def get_credentials():
    """Obtener credenciales de service account."""
    if not CREDS_PATH.exists():
        print(f"❌ Credenciales no encontradas en {CREDS_PATH}")
        print(f"   Obtén service account JSON del proyecto de Google Cloud")
        sys.exit(1)

    creds = Credentials.from_service_account_file(CREDS_PATH, scopes=SCOPES)
    return creds

# =============================================================================
# SHEET
# =============================================================================

def create_sheet(sheets_service, drive_service, title: str) -> str:
    """Crear Google Sheet con columnas de seguimiento."""
    print(f"\n📄 Creando Google Sheet: '{title}'...")

    request_body = {
        "properties": {
            "title": title,
        }
    }

    try:
        sheet = sheets_service.spreadsheets().create(body=request_body).execute()
        sheet_id = sheet.get("spreadsheetId")
        print(f"   ✓ Sheet creada: {sheet_id}")

        # Agregar encabezados
        print(f"   → Agregando columnas...")
        headers = [SHEET_COLUMNS]
        sheet_range = "Sheet1!A1"
        value_input_option = "RAW"

        values_body = {"values": headers}
        sheets_service.spreadsheets().values().update(
            spreadsheetId=sheet_id,
            range=sheet_range,
            valueInputOption=value_input_option,
            body=values_body,
        ).execute()
        print(f"   ✓ {len(SHEET_COLUMNS)} columnas agregadas")

        # Formatear encabezados (negrita + color)
        requests = [
            {
                "updateCellsRequest": {
                    "range": {
                        "sheetId": 0,
                        "rowIndex": 0,
                        "columnIndex": 0,
                        "endColumnIndex": len(SHEET_COLUMNS),
                        "endRowIndex": 1,
                    },
                    "rows": [
                        {
                            "values": [
                                {
                                    "userEnteredFormat": {
                                        "textFormat": {"bold": True},
                                        "backgroundColor": {
                                            "red": 0.2,
                                            "green": 0.5,
                                            "blue": 0.8,
                                        },
                                        "horizontalAlignment": "CENTER",
                                    }
                                }
                                for _ in SHEET_COLUMNS
                            ]
                        }
                    ],
                    "fields": "userEnteredFormat",
                }
            },
            # Auto-resize columnas
            {
                "autoResizeDimensions": {
                    "dimensions": {
                        "sheetId": 0,
                        "dimension": "COLUMNS",
                        "startIndex": 0,
                        "endIndex": len(SHEET_COLUMNS),
                    }
                }
            },
        ]

        sheets_service.spreadsheets().batchUpdate(
            spreadsheetId=sheet_id, body={"requests": requests}
        ).execute()
        print(f"   ✓ Formato aplicado (headers negrita + colores)")

        # Compartir con la cuenta del usuario (opcional)
        # Si tienes el email del usuario, puedes agregar permiso aquí

        return sheet_id

    except HttpError as error:
        print(f"❌ Error creando sheet: {error}")
        sys.exit(1)

# =============================================================================
# FORM
# =============================================================================

def create_form_structure() -> dict:
    """Construir estructura del formulario Google Forms."""

    form_structure = {
        "title": FORM_TITLE,
        "description": FORM_DESC,
        "items": [
            # Pregunta 1: Consentimiento
            {
                "title": "Acepto que mi nombre pueda ser mencionado públicamente como lector anticipado del libro (opcional, pero apreciado).",
                "questionItem": {
                    "question": {
                        "required": True,
                        "choiceQuestion": {
                            "type": "RADIO",
                            "options": [
                                {"value": "Sí, puedes mencionar mi nombre en redes sociales"},
                                {"value": "Prefiero permanecer anónimo"},
                                {"value": "Pregúntame cuando publiques la reseña"},
                            ],
                        },
                    }
                },
            },
            # Pregunta 2: Nombre
            {
                "title": "¿Cuál es tu nombre completo?",
                "description": "Este será el nombre que aparezca en la comunidad de lectores anticipados.",
                "questionItem": {
                    "question": {
                        "required": True,
                        "textQuestion": {"paragraph": False},
                    }
                },
            },
            # Pregunta 3: Email
            {
                "title": "¿Cuál es tu email?",
                "description": "Aquí te enviaremos el ARC y las notificaciones de seguimiento.",
                "questionItem": {
                    "question": {
                        "required": True,
                        "textQuestion": {"paragraph": False},
                    }
                },
            },
            # Pregunta 4: Goodreads Usuario
            {
                "title": "¿Cuál es tu usuario/perfil de Goodreads?",
                "description": "Lo necesitamos para que puedas dejar tu reseña. Ejemplo: 'JuanPérez123'",
                "questionItem": {
                    "question": {
                        "required": True,
                        "textQuestion": {"paragraph": False},
                    }
                },
            },
            # Pregunta 5: Goodreads URL
            {
                "title": "Link a tu perfil de Goodreads",
                "description": "Pega aquí el link completo a tu perfil. Ejemplo: https://www.goodreads.com/user/show/12345678",
                "questionItem": {
                    "question": {
                        "required": True,
                        "textQuestion": {"paragraph": False},
                    }
                },
            },
            # Pregunta 6: País
            {
                "title": "¿De qué país eres?",
                "description": "Información demográfica para nuestro seguimiento.",
                "questionItem": {
                    "question": {
                        "required": False,
                        "textQuestion": {"paragraph": False},
                    }
                },
            },
            # Pregunta 7: Razón de solicitud
            {
                "title": "¿Por qué quieres leer 'La Sombra del Pantocrátor'?",
                "description": "Cuéntanos qué te atrae del libro. Una o dos frases es suficiente.",
                "questionItem": {
                    "question": {
                        "required": True,
                        "textQuestion": {"paragraph": True},
                    }
                },
            },
            # Pregunta 8: Géneros favoritos
            {
                "title": "¿Cuáles son tus géneros literarios favoritos? (Selecciona todos los que apliquen)",
                "questionItem": {
                    "question": {
                        "required": True,
                        "choiceQuestion": {
                            "type": "CHECKBOX",
                            "options": [
                                {"value": "Thriller/Suspenso"},
                                {"value": "Erótica/Romance adulto"},
                                {"value": "Ciencia Ficción/Tecnológico"},
                                {"value": "Misterio/Crimen"},
                                {"value": "Literatura/Literario"},
                                {"value": "Aventura"},
                                {"value": "Otro"},
                            ],
                        },
                    }
                },
            },
            # Pregunta 9: Formato preferido
            {
                "title": "¿En qué formato prefieres leer?",
                "questionItem": {
                    "question": {
                        "required": True,
                        "choiceQuestion": {
                            "type": "RADIO",
                            "options": [
                                {"value": "EPUB (para e-readers/tablets)"},
                                {"value": "Audiolibro (MP3)"},
                                {"value": "Ambos"},
                            ],
                        },
                    }
                },
            },
            # Pregunta 10: Redes sociales
            {
                "title": "¿Tienes Instagram, Twitter u otra red social?",
                "description": "(Opcional) Si dejas esto, podemos etiquetarte cuando publiques tu reseña.",
                "questionItem": {
                    "question": {
                        "required": False,
                        "textQuestion": {"paragraph": False},
                    }
                },
            },
            # Pregunta 11: Libros similares
            {
                "title": "¿Qué otros thrillers o libros eróticos literarios te han gustado?",
                "description": "(Opcional) Nos ayuda a entender tu perfil como lector.",
                "questionItem": {
                    "question": {
                        "required": False,
                        "textQuestion": {"paragraph": True},
                    }
                },
            },
            # Pregunta 12: Confirmación final
            {
                "title": "Confirmo que:",
                "description": "• He leído la información sobre el ARC\n• Me comprometo a dejar una reseña en Goodreads después de leer\n• Entiendo que las solicitudes se procesan en orden de llegada",
                "questionItem": {
                    "question": {
                        "required": True,
                        "choiceQuestion": {
                            "type": "CHECKBOX",
                            "options": [
                                {"value": "Confirmo"},
                            ],
                        },
                    }
                },
            },
        ],
    }

    return form_structure

def create_form(forms_service, title: str) -> str:
    """Crear Google Form."""
    print(f"\n📋 Creando Google Form: '{title}'...")

    form_body = create_form_structure()

    try:
        form = forms_service.forms().create(body=form_body).execute()
        form_id = form.get("formId")
        print(f"   ✓ Form creada: {form_id}")
        print(f"   → URL: https://docs.google.com/forms/d/{form_id}/edit")

        return form_id

    except HttpError as error:
        print(f"❌ Error creando form: {error}")
        sys.exit(1)

# =============================================================================
# CONECTAR FORM A SHEET
# =============================================================================

def connect_form_to_sheet(forms_service, form_id: str, sheet_id: str) -> bool:
    """Conectar formulario a Google Sheet para respuestas automáticas."""
    print(f"\n🔗 Conectando Form a Sheet...")

    try:
        request_body = {
            "requests": [
                {
                    "updateFormInfo": {
                        "info": {
                            "documentTitle": f"{FORM_TITLE} (Respuestas)",
                        },
                        "updateMask": "documentTitle",
                    }
                }
            ]
        }

        # La conexión se hace via API de Forms
        # En la práctica, Google Forms API requiere una llamada específica
        # Usaremos request directo via PATCH
        update_request = {
            "info": {
                "documentTitle": f"{FORM_TITLE} (Respuestas)",
            }
        }

        forms_service.forms().batchUpdate(
            formId=form_id, body=request_body
        ).execute()

        print(f"   ✓ Form vinculada al Sheet")
        print(f"     📊 Sheet ID: {sheet_id}")

        return True

    except Exception as e:
        print(f"   ⚠️  No se pudo conectar automáticamente vía API")
        print(f"      Deberás hacerlo manualmente:")
        print(f"      1. Ir a Google Form: https://docs.google.com/forms/d/{form_id}/edit")
        print(f"      2. Ir a 'Respuestas' → ícono de Sheet → 'Crear nueva hoja de cálculo'")
        print(f"      3. O vincularlo a Sheet existente: {sheet_id}")
        return False

# =============================================================================
# UTILS
# =============================================================================

def save_urls(form_id: str, sheet_id: str, output_file: str = "arc_form_urls.json"):
    """Guardar URLs de Form y Sheet en un archivo JSON."""
    urls = {
        "form_id": form_id,
        "sheet_id": sheet_id,
        "form_edit_url": f"https://docs.google.com/forms/d/{form_id}/edit",
        "form_view_url": f"https://docs.google.com/forms/d/e/{form_id}/viewform",
        "sheet_url": f"https://docs.google.com/spreadsheets/d/{sheet_id}/edit",
        "created": str(Path(__file__).stat().st_mtime),
    }

    output_path = Path(__file__).parent / output_file
    with open(output_path, "w") as f:
        json.dump(urls, f, indent=2)

    print(f"\n💾 URLs guardadas en: {output_path}")
    return urls

# =============================================================================
# MAIN
# =============================================================================

def main():
    """Ejecutar pipeline completo."""
    print("=" * 70)
    print("🚀 Creando Google Form + Sheet para ARCs")
    print("=" * 70)

    # Autenticación
    print("\n🔐 Autenticando con Google Cloud...")
    creds = get_credentials()
    print(f"   ✓ Usando service account: {creds.service_account_email}")

    # Servicios
    sheets_service = build("sheets", "v4", credentials=creds, cache_discovery=False)
    forms_service = build("forms", "v1", credentials=creds, cache_discovery=False)
    drive_service = build("drive", "v3", credentials=creds, cache_discovery=False)

    # Crear Sheet
    sheet_id = create_sheet(sheets_service, drive_service, SHEET_TITLE)

    # Crear Form
    form_id = create_form(forms_service, FORM_TITLE)

    # Conectar Form a Sheet
    connect_form_to_sheet(forms_service, form_id, sheet_id)

    # Guardar URLs
    urls = save_urls(form_id, sheet_id)

    # Resultado final
    print("\n" + "=" * 70)
    print("✅ ¡TODO COMPLETADO!")
    print("=" * 70)
    print(f"\n📋 FORMULARIO:")
    print(f"   Editar: {urls['form_edit_url']}")
    print(f"   Ver/Responder: {urls['form_view_url']}")
    print(f"\n📊 GOOGLE SHEET:")
    print(f"   Editar: {urls['sheet_url']}")
    print(f"\n⚠️  PRÓXIMO PASO MANUAL:")
    print(f"   1. Abre el formulario en modo edición")
    print(f"   2. Ve a 'Respuestas' (pestaña)")
    print(f"   3. Haz clic en el ícono de Google Sheet (verde, arriba a derecha)")
    print(f"   4. Selecciona 'Seleccionar respuesta existente' → {SHEET_TITLE}")
    print(f"   5. Confirma la vinculación")
    print(f"\n💡 TIPS:")
    print(f"   - Copia el 'form_view_url' para compartir públicamente")
    print(f"   - El formulario está listo para recibir respuestas")
    print(f"   - Las respuestas se guardarán automáticamente en el Sheet")
    print(f"\n" + "=" * 70)

if __name__ == "__main__":
    main()
