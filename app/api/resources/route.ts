import { NextRequest, NextResponse } from 'next/server'
import { addResource, readResources, removeResource } from '@/lib/resource-store'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const q = params.get('q')?.trim() || ''
  const college = params.get('college')?.trim() || ''
  const department = params.get('department')?.trim() || ''
  const year = params.get('year')?.trim() || ''
  const semester = params.get('semester')?.trim() || ''
  const type = params.get('type')?.trim() || ''

  const resources = await readResources()

  const filtered = resources.filter((resource) => {
    if (
      q &&
      [resource.course, resource.department, resource.description || '']
        .join(' ')
        .toLowerCase()
        .includes(q.toLowerCase()) === false
    ) {
      return false
    }
    if (college && resource.college !== college) return false
    if (department && resource.department !== department) return false
    if (year && resource.year !== year) return false
    if (semester && resource.semester !== semester) return false
    if (type && type !== 'All types' && resource.type !== type) return false
    return true
  })

  return NextResponse.json(filtered.slice(0, 100))
}

const REQUIRED_FIELDS = ['college', 'department', 'year', 'semester', 'course', 'type'] as const

function requiresInstructor(type: string) {
  return ['ppt', 'ppts', 'quiz'].includes(type.trim().toLowerCase())
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (typeof body !== 'object' || body === null) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const missing: string[] = REQUIRED_FIELDS.filter((key) => {
      const value = body[key]
      return value === undefined || value === null || String(value).trim() === ''
    })
        
      // require uploaded file url
      if (!body.fileUrl) {
        missing.push('file')
      }

    if (missing.length > 0) {
      return NextResponse.json({ error: `Missing required fields: ${missing.join(', ')}` }, { status: 400 })
    }

    if (requiresInstructor(String(body.type)) && (!body.instructor || String(body.instructor).trim() === '')) {
      return NextResponse.json({ error: 'Instructor name is required for PPT and Quiz resources' }, { status: 400 })
    }

    const resource = {
      id: String(body.id || crypto.randomUUID()),
      college: String(body.college).trim(),
      department: String(body.department).trim(),
      year: String(body.year).trim(),
      semester: String(body.semester).trim(),
      course: String(body.course).trim(),
      type: String(body.type).trim(),
      instructor: body.instructor ? String(body.instructor).trim() : undefined,
      description: String(body.description || '').trim(),
      fileName: body.fileName ? String(body.fileName).trim() : undefined,
      fileUrl: body.fileUrl ? String(body.fileUrl).trim() : undefined,
      mimeType: body.mimeType ? String(body.mimeType).trim() : undefined,
      createdAt: new Date().toISOString(),
    }

    const saved = await addResource(resource)
    return NextResponse.json(saved, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Could not save resource' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'Resource id is required' }, { status: 400 })
  }

  const removed = await removeResource(id)
  if (!removed) {
    return NextResponse.json({ error: 'Resource not found' }, { status: 404 })
  }

  return new NextResponse(null, { status: 204 })
}