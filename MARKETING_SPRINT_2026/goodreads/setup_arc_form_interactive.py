#!/usr/bin/env python3
"""
Script INTERACTIVO para crear Google Form + Sheet con autenticación OAuth
"La Sombra del Pantocrator" — ARCs

USO:
    python3 setup_arc_form_interactive.py

REQUISITOS:
    pip install google-auth-oauthlib google-auth-httplib2 google-api-python-client

FLUJO:
    1. Abre navegador y autentica con tu cuenta de Google
    2. Script crea el Form
    3. Script crea el Sheet
    4. Script conecta ambos
    5. URLs guardadas en arc_form_urls.json

NOTA: Este script está optimizado para ejecutarse en un terminal interactivo
      (no funciona en sesiones no-interactivas como subagents)
"""

import json
import os
import sys
import webbrowser
from pathlib import Path
from typing import Optional

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google.auth.oauthlib.flow import InstalledAppFlow
from google.api_core.gapic_v1 import client_info as grpc_client_info
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# =============================================================================
# CONFIG
# =============================================================================

# Token cache
TOKEN_CACHE_FILE = Path(__file__).parent / "token_oauth.json"

# Credenciales de aplicación (reemplazar con tu OAuth 2.0 credentials)
# Descargar desde: https://console.cloud.google.com/apis/credentials
CLIENT_SECRETS_FILE = Path(__file__).parent / "oauth_credentials.json"

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

# Columnas para el Sheet
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
# AUTH - OAUTH
# =============================================================================

def get_credentials_oauth() -> Credentials:
    """Obtener credenciales via OAuth 2.0 (requiere navegador)."""

    if not CLIENT_SECRETS_FILE.exists():
        print("\n❌ CONFIGURACIÓN REQUERIDA")
        print("="*70)
        print(f"No se encontró {CLIENT_SECRETS_FILE}")
        print("\nPARA CONFIGURAR OAUTH:")
        print("1. Ve a: https://console.cloud.google.com/")
        print("2. Crea un nuevo proyecto o usa uno existente")
        print("3. Habilita estas APIs:")
        print("   - Google Sheets API")
        print("   - Google Forms API")
        print("   - Google Drive API")
        print("4. Ve a 'Credenciales' → 'Crear credenciales' → 'ID de cliente OAuth'")
        print("5. Tipo: 'Aplicación de escritorio'")
        print("6. Descarga el JSON")
        print(f"7. Guárdalo en: {CLIENT_SECRETS_FILE}")
        print("\nLuego ejecuta nuevamente este script.")
        print("="*70)
        sys.exit(1)

    # Intentar usar token cached
    creds = None
    if TOKEN_CACHE_FILE.exists():
        creds = Credentials.from_authorized_user_file(TOKEN_CACHE_FILE, SCOPES)

    # Si no hay token válido, hacer flujo OAuth
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                CLIENT_SECRETS_FILE, SCOPES
            )
            creds = flow.run_local_server(port=0)

        # Guardar token para próximas veces
        with open(TOKEN_CACHE_FILE, "w") as token:
            token.write(creds.to_json())

    return creds

# =============================================================================
# SHEET
# =============================================================================

def create_sheet(sheets_service, title: str) -> str:
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

        # Formatear encabezados
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

        return sheet_id

    except HttpError as error:
        print(f"❌ Error creando sheet: {error}")
        sys.exit(1)

# =============================================================================
# FORM
# =============================================================================

def create_form_structure() -> dict:
    """Construir estructura del formulario."""

    return {
        "title": FORM_TITLE,
        "description": FORM_DESC,
        "items": [
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

def create_form(forms_service) -> str:
    """Crear Google Form."""
    print(f"\n📋 Creando Google Form: '{FORM_TITLE}'...")

    form_body = create_form_structure()

    try:
        form = forms_service.forms().create(body=form_body).execute()
        form_id = form.get("formId")
        print(f"   ✓ Form creada: {form_id}")
        return form_id
    except HttpError as error:
        print(f"❌ Error creando form: {error}")
        sys.exit(1)

# =============================================================================
# CONECTAR
# =============================================================================

def link_form_to_sheet(forms_service, form_id: str, sheet_id: str) -> bool:
    """Intentar enlazar form a sheet via API."""
    print(f"\n🔗 Intentando conectar Form a Sheet...")

    try:
        # Google Forms no tiene API directa para conectar a sheets
        # Se debe hacer manualmente en la UI
        print(f"   ⚠️  La conexión se debe hacer manualmente (limitación de API)")
        print(f"\n   PASOS MANUALES:")
        print(f"   1. Abre el Form: https://docs.google.com/forms/d/{form_id}/edit")
        print(f"   2. Ve a pestaña 'Respuestas'")
        print(f"   3. Haz clic en icono Google Sheets (verde, arriba a derecha)")
        print(f"   4. Selecciona 'Seleccionar respuesta existente'")
        print(f"   5. Busca y selecciona: {SHEET_TITLE}")
        print(f"   6. Confirma")
        return False
    except Exception as e:
        print(f"   Error: {e}")
        return False

# =============================================================================
# UTILS
# =============================================================================

def save_urls(form_id: str, sheet_id: str):
    """Guardar URLs."""
    urls = {
        "form_id": form_id,
        "sheet_id": sheet_id,
        "form_edit_url": f"https://docs.google.com/forms/d/{form_id}/edit",
        "form_view_url": f"https://docs.google.com/forms/d/e/{form_id}/viewform",
        "sheet_url": f"https://docs.google.com/spreadsheets/d/{sheet_id}/edit",
    }

    output_path = Path(__file__).parent / "arc_form_urls.json"
    with open(output_path, "w") as f:
        json.dump(urls, f, indent=2)

    return urls, output_path

# =============================================================================
# MAIN
# =============================================================================

def main():
    """Ejecutar pipeline."""
    print("=" * 70)
    print("🚀 Creando Google Form + Sheet para ARCs (OAuth)")
    print("=" * 70)

    # Autenticación
    print("\n🔐 Autenticando con Google (requerirá navegador)...")
    creds = get_credentials_oauth()
    print(f"   ✓ Autenticado")

    # Servicios
    sheets_service = build("sheets", "v4", credentials=creds, cache_discovery=False)
    forms_service = build("forms", "v1", credentials=creds, cache_discovery=False)

    # Crear Sheet
    sheet_id = create_sheet(sheets_service, SHEET_TITLE)

    # Crear Form
    form_id = create_form(forms_service)

    # Intentar conectar
    link_form_to_sheet(forms_service, form_id, sheet_id)

    # Guardar URLs
    urls, output_file = save_urls(form_id, sheet_id)

    # Resultado
    print("\n" + "=" * 70)
    print("✅ ¡CREACIÓN COMPLETADA!")
    print("=" * 70)
    print(f"\n📋 FORMULARIO (Google Forms):")
    print(f"   Editar: {urls['form_edit_url']}")
    print(f"   Compartir: {urls['form_view_url']}")
    print(f"\n📊 HOJA DE CÁLCULO (Google Sheets):")
    print(f"   URL: {urls['sheet_url']}")
    print(f"\n💾 URLs guardadas en: {output_file}")
    print(f"\n" + "=" * 70)

if __name__ == "__main__":
    main()
