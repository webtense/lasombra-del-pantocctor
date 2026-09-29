#!/usr/bin/env python3
"""
Redimensionar activos para redes sociales (Instagram + TikTok)
La Sombra del Pantocrator — Marketing Sprint 2026

Descarga/lee imágenes fuente y las redimensiona según especificaciones
de cada red social.

Ejecución: python3 redimensionar_activos.py
"""

import os
import sys
from pathlib import Path
from PIL import Image
import json
from datetime import datetime

# =========================================================
# CONFIGURACIÓN
# =========================================================

PROJECT_ROOT = Path(__file__).parent.parent.parent  # LaSombraDelPantocrator/
SOURCES = {
    "portada": PROJECT_ROOT / "05-PORTADAS/kdp/portada_definitiva_v2_kdp_1600x2560.jpg",
    "Bruno_Marti": PROJECT_ROOT / "02-WEB/public/personajes/Bruno_Marti.jpg",
    "Laia_Puig": PROJECT_ROOT / "02-WEB/public/personajes/Laia_Puig.jpg",
    "Agata_Soler": PROJECT_ROOT / "02-WEB/public/personajes/Agata_Soler.jpg",
    "Anna_Puig": PROJECT_ROOT / "02-WEB/public/personajes/Anna_Puig.jpg",
    "Ignaci_Castells": PROJECT_ROOT / "02-WEB/public/personajes/Ignaci_Castells.jpg",
}

OUTPUT_BASE = Path(__file__).parent / "activos_redimensionados"

# Especificaciones: (width, height, use_white_bg)
SPECS = {
    "instagram": {
        "post_cuadrado": (1080, 1080, True),
        "post_vertical": (1080, 1350, True),
        "reels": (1080, 1920, True),
        "story": (1080, 1920, True),
    },
    "tiktok": {
        "video": (1080, 1920, True),
    }
}

QUALITY = 95  # JPEG quality

# =========================================================
# FUNCIONES AUXILIARES
# =========================================================

def create_dirs():
    """Crear estructura de directorios."""
    for platform, formats in SPECS.items():
        for fmt in formats.keys():
            path = OUTPUT_BASE / platform / fmt
            path.mkdir(parents=True, exist_ok=True)
            print(f"✓ Directorio: {path}")

def resize_with_bg(source_path: Path, width: int, height: int, use_white_bg: bool = True) -> Image.Image:
    """
    Redimensionar imagen manteniendo aspect ratio y rellenando con fondo.

    Args:
        source_path: Ruta de imagen fuente
        width: Ancho deseado
        height: Alto deseado
        use_white_bg: Si True, usa fondo blanco; si False, transparente

    Returns:
        PIL Image redimensionada
    """
    # Abrir imagen
    img = Image.open(source_path).convert("RGB")

    # Calcular aspect ratios
    source_ratio = img.width / img.height
    target_ratio = width / height

    # Determinar dimensiones de resize
    if source_ratio > target_ratio:
        # Imagen más ancha: limitar por alto
        new_height = height
        new_width = int(height * source_ratio)
    else:
        # Imagen más alta: limitar por ancho
        new_width = width
        new_height = int(width / source_ratio)

    # Redimensionar
    img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)

    # Crear canvas con fondo
    bg_color = (255, 255, 255) if use_white_bg else (0, 0, 0)
    canvas = Image.new("RGB", (width, height), bg_color)

    # Centrar imagen en canvas
    offset_x = (width - new_width) // 2
    offset_y = (height - new_height) // 2
    canvas.paste(img, (offset_x, offset_y))

    return canvas

def process_assets():
    """Procesar todos los activos."""

    total_files = 0
    total_size = 0
    report = {
        "timestamp": datetime.now().isoformat(),
        "project": "La Sombra del Pantocrator",
        "sprint": "Marketing 2026",
        "assets": {}
    }

    for asset_name, source_path in SOURCES.items():
        if not source_path.exists():
            print(f"⚠ FALTA: {asset_name} → {source_path}")
            continue

        print(f"\n📦 Procesando: {asset_name}")
        report["assets"][asset_name] = {
            "source": str(source_path),
            "sizes": {}
        }

        # Procesar para cada plataforma/formato
        for platform, formats in SPECS.items():
            for fmt, (w, h, use_bg) in formats.items():
                try:
                    # Redimensionar
                    resized = resize_with_bg(source_path, w, h, use_bg)

                    # Guardar
                    output_dir = OUTPUT_BASE / platform / fmt
                    output_name = f"{asset_name}.jpg" if asset_name != "portada" else "portada_lsp.jpg"
                    output_path = output_dir / output_name

                    resized.save(output_path, "JPEG", quality=QUALITY, optimize=True)

                    file_size = output_path.stat().st_size
                    total_files += 1
                    total_size += file_size

                    print(f"  ✓ {platform}/{fmt}/{output_name} ({file_size/1024:.0f} KB)")

                    report["assets"][asset_name]["sizes"][f"{platform}/{fmt}"] = {
                        "width": w,
                        "height": h,
                        "size_bytes": file_size,
                        "size_kb": file_size / 1024
                    }

                except Exception as e:
                    print(f"  ✗ ERROR {platform}/{fmt}: {e}")

    # Resumen
    print("\n" + "="*60)
    print(f"✅ GENERACIÓN COMPLETADA")
    print("="*60)
    print(f"Total archivos: {total_files}")
    print(f"Tamaño total: {total_size / (1024*1024):.1f} MB")
    print(f"Directorio: {OUTPUT_BASE}")
    print(f"Calidad JPEG: {QUALITY}")

    # Guardar reporte
    report_path = Path(__file__).parent / "REPORTE_ACTIVOS.json"
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    print(f"\n📊 Reporte guardado: {report_path}")

    return report

def verify_assets():
    """Verificar que todos los activos existen y mostrar resumen."""
    print("\n" + "="*60)
    print("📋 VERIFICACIÓN DE ACTIVOS")
    print("="*60)

    for platform, formats in SPECS.items():
        for fmt in formats.keys():
            folder = OUTPUT_BASE / platform / fmt
            if folder.exists():
                files = list(folder.glob("*.jpg"))
                size = sum(f.stat().st_size for f in files)
                print(f"{platform:15} {fmt:20} {len(files):2} archivos  {size/1024:.0f} KB")
            else:
                print(f"{platform:15} {fmt:20} ⚠ NO EXISTE")

# =========================================================
# MAIN
# =========================================================

if __name__ == "__main__":
    print("🎬 La Sombra del Pantocrator — Redimensionador de Activos")
    print("="*60)

    # Verificar que existan fuentes
    print("\n📥 Verificando fuentes...")
    missing = []
    for name, path in SOURCES.items():
        if path.exists():
            size = path.stat().st_size / (1024*1024)
            print(f"  ✓ {name:20} {size:.1f} MB")
        else:
            print(f"  ✗ {name:20} FALTA")
            missing.append(name)

    if missing:
        print(f"\n⚠ ADVERTENCIA: Faltan {len(missing)} fuentes")
        for name in missing:
            print(f"   - {name}")

    # Crear directorios
    print("\n📂 Creando estructura de directorios...")
    create_dirs()

    # Procesar
    print("\n🔄 Redimensionando activos...")
    report = process_assets()

    # Verificar
    verify_assets()

    print("\n✨ ¡Completado!")
