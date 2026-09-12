import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import fs from 'fs'
import path from 'path'
import { pipeline } from 'stream/promises'
import { Readable } from 'stream'

export const dynamic = 'force-dynamic'

const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
const MAX_FILE_SIZE = 50 * 1024 * 1024
const blobEnabled = Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID)

async function saveLocally(file: File, filename: string): Promise<string> {
  await fs.promises.mkdir(uploadsDir, { recursive: true })
  const filePath = path.join(uploadsDir, filename)
  const writeStream = fs.createWriteStream(filePath)
  try {
    await pipeline(Readable.fromWeb(file.stream() as never), writeStream)
  } catch (err) {
    await fs.promises.rm(filePath, { force: true }).catch(() => {})
    throw err
  }
  return `/uploads/${filename}`
}

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData()
    const file = form.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'No file selected.' }, { status: 400 })
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File is too large. Maximum size is 50 MB.' }, { status: 413 })
    }
    if (file.size === 0) {
      return NextResponse.json({ error: 'The selected file is empty.' }, { status: 400 })
    }

    const ext = file.name && file.name.includes('.') ? file.name.split('.').pop() : ''
    const filename = `${crypto.randomUUID()}${ext ? '.' + ext : ''}`

    let fileUrl: string
    if (blobEnabled) {
      const blob = await put(filename, file, { access: 'public', addRandomSuffix: true })
      fileUrl = blob.url
    } else {
      fileUrl = await saveLocally(file, filename)
    }

    return NextResponse.json({ fileName: filename, fileUrl, mimeType: file.type })
  } catch (err) {
    console.error('Upload failed:', err)
    const message = err instanceof Error ? err.message : 'Unexpected error during upload.'
    return NextResponse.json({ error: `Upload failed. ${message}` }, { status: 500 })
  }
}
