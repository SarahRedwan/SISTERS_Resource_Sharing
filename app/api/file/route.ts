import { NextRequest, NextResponse } from 'next/server'
import { get } from '@vercel/blob'

export const dynamic = 'force-dynamic'

const blobAccess = process.env.BLOB_ACCESS === 'public' ? 'public' : 'private'

export async function GET(request: NextRequest) {
  const blobUrl = request.nextUrl.searchParams.get('u')
  if (!blobUrl) {
    return new NextResponse('Missing blob url', { status: 400 })
  }

  try {
    const result = await get(blobUrl, { access: blobAccess })
    if (!result || !result.stream) {
      return new NextResponse('File not found', { status: 404 })
    }

    const contentType = result.blob?.contentType || 'application/octet-stream'
    const contentDisposition = result.blob?.contentDisposition || `attachment; filename="${new URL(blobUrl).pathname.split('/').pop()}"`

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