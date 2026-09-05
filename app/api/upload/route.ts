import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

const uploadsDir = path.join(process.cwd(), 'public', 'uploads')

async function ensureUploads() {
  await fs.promises.mkdir(uploadsDir, { recursive: true })
}

export async function POST(request: NextRequest) {
  try {
    await ensureUploads()
    const form = await request.formData()
    const file = form.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

    const ext = (file.name && file.name.includes('.')) ? file.name.split('.').pop() : ''
    const filename = `${crypto.randomUUID()}${ext ? '.' + ext : ''}`
    const buffer = Buffer.from(await file.arrayBuffer())
    const filePath = path.join(uploadsDir, filename)
    await fs.promises.writeFile(filePath, buffer)

    return NextResponse.json({ fileName: filename, fileUrl: `/uploads/${filename}`, mimeType: file.type })
  } catch (err) {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
