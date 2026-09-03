import { NextRequest, NextResponse } from 'next/server';
import { list } from '@vercel/blob';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('file') || 'audiolibro_limpio.m4b';

  const allowedFiles = ['audiolibro_premium.m4b', 'audiolibro_limpio.m4b'];
  if (!allowedFiles.includes(filename)) {
    return NextResponse.json({ error: 'Archivo no permitido' }, { status: 403 });
  }

  try {
    // Buscar el archivo en Blob Storage
    const blobs = await list({ prefix: filename });

    if (!blobs.blobs || blobs.blobs.length === 0) {
      return NextResponse.json(
        { error: 'Archivo no encontrado en Blob Storage. Usa /api/upload-audiobooks para subirlos.' },
        { status: 404 }
      );
    }

    const blob = blobs.blobs[0];

    // Redirigir al URL del blob
    return NextResponse.redirect(blob.url, { status: 302 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error al servir el archivo' },
      { status: 500 }
    );
  }
}
