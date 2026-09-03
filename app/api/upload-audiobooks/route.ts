import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

export const maxDuration = 300; // 5 minutos

export async function POST() {
  try {
    const audiobooks = [
      { filename: 'audiolibro_premium.m4b', name: 'premium' },
      { filename: 'audiolibro_limpio.m4b', name: 'limpio' },
    ];

    const results = [];

    for (const book of audiobooks) {
      const filepath = path.join(process.cwd(), 'public', book.filename);
      const fileBuffer = await readFile(filepath);

      const blob = await put(book.filename, fileBuffer, {
        access: 'public',
        contentType: 'audio/mp4',
      });

      results.push({
        name: book.name,
        filename: book.filename,
        url: blob.url,
        size: fileBuffer.length,
      });

      console.log(`✅ ${book.filename} subido a Blob Storage: ${blob.url}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Audiolibros subidos a Blob Storage',
      files: results,
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: `Error al subir archivos: ${error}` },
      { status: 500 }
    );
  }
}
