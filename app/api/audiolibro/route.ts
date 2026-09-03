import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('file') || 'audiolibro_limpio.m4b';

  const allowedFiles = ['audiolibro_premium.m4b', 'audiolibro_limpio.m4b'];
  if (!allowedFiles.includes(filename)) {
    return NextResponse.json({ error: 'File not allowed' }, { status: 403 });
  }

  try {
    const publicPath = path.join(process.cwd(), 'public', filename);

    if (!existsSync(publicPath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const fileBuffer = await readFile(publicPath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mp4',
        'Content-Length': fileBuffer.length.toString(),
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'public, max-age=31536000',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
