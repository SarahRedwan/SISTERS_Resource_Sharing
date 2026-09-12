import { NextRequest, NextResponse } from 'next/server'
import { get } from '@vercel/blob'

export const dynamic = 'force-dynamic'

const blobAccess = process.env.BLOB_ACCESS === 'public' ? 'public' : 'private'

function safeFilename(name: string): string {
  const cleaned = name.replace(/["\\\r\n]/g, '_').trim()
  return cleaned || 'download'
}

export async function GET(request: NextRequest) {
  const blobUrl = request.nextUrl.searchParams.get('u')
  if (!blobUrl) {
    return new NextResponse('Missing blob url', { status: 400 })
  }

  const inline = request.nextUrl.searchParams.get('inline') === '1'
  const name = safeFilename(request.nextUrl.searchParams.get('name') || '')

  try {
    const result = await get(blobUrl, { access: blobAccess })
    if (!result || !result.stream) {
      return new NextResponse('File not found', { status: 404 })
    }

    const contentType = result.blob?.contentType || 'application/octet-stream'
    const contentDisposition = name
      ? `${inline ? 'inline' : 'attachment'}; filename="${name}"`
      : result.blob?.contentDisposition || 'attachment'

    return new NextResponse(result.stream as unknown as ReadableStream, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': contentDisposition,
        'Cache-Control': 'private, max-age=0, must-revalidate',
      },
    })
  } catch (err) {
    console.error('Download failed:', err)
    return new NextResponse('Download failed', { status: 500 })
  }
}