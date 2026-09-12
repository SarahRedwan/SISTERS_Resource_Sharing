import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { pipeline } from 'stream/promises'
import { Readable } from 'stream'

export const dynamic = 'force-dynamic'

const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
const MAX_FILE_SIZE = 50 * 1024 * 1024

async function ensureUploads() {
  await fs.promises.mkdir(uploadsDir, { recursive: true })
}

export async function POST(request: NextRequest) {
  try {
    await ensureUploads()
    const form = await request.formData()
    const file = form.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File is too large. Maximum size is 50 MB.' }, { status: 413 })
    }

    const ext = (file.name && file.name.includes('.')) ? file.name.split('.').pop() : ''
    const filename = `${crypto.randomUUID()}${ext ? '.' + ext : ''}`
    const filePath = path.join(uploadsDir, filename)
    await pipeline(Readable.fromWeb(file.stream() as never), fs.createWriteStream(filePath))

    return NextResponse.json({ fileName: filename, fileUrl: `/uploads/${filename}`, mimeType: file.type })
  } catch {
    return NextResponse.json({ error: 'Upload failed. Check the file size and try again.' }, { status: 500 })
  }
}
