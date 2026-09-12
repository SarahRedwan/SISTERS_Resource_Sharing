import { prisma } from '@/lib/prisma'

export type StoredResource = {
  id: string
  college: string
  department: string
  year: string
  semester: string
  course: string
  type: string
  instructor?: string
  description?: string
  fileName?: string
  fileUrl?: string
  mimeType?: string
  createdAt: string
}

type ResourceRow = {
  id: string
  college: string
  department: string
  year: string
  semester: string
  course: string
  type: string
  instructor: string | null
  description: string | null
  fileName: string | null
  fileUrl: string | null
  mimeType: string | null
  createdAt: Date
}

function serialize(row: ResourceRow): StoredResource {
  return {
    id: row.id,
    college: row.college,
    department: row.department,
    year: row.year,
    semester: row.semester,
    course: row.course,
    type: row.type,
    instructor: row.instructor ?? undefined,
    description: row.description ?? undefined,
    fileName: row.fileName ?? undefined,
    fileUrl: row.fileUrl ?? undefined,
    mimeType: row.mimeType ?? undefined,
    createdAt: row.createdAt.toISOString(),
  }
}

export async function readResources(): Promise<StoredResource[]> {
  const rows = await prisma.resource.findMany({ orderBy: { createdAt: 'desc' } })
  return rows.map(serialize)
}

export async function writeResources(_resources: StoredResource[]): Promise<void> {
  return
}

export async function addResource(resource: StoredResource): Promise<StoredResource> {
  const row = await prisma.resource.upsert({
    where: { id: resource.id },
    create: {
      id: resource.id,
      college: resource.college,
      department: resource.department,
      year: resource.year,
      semester: resource.semester,
      course: resource.course,
      type: resource.type,
      instructor: resource.instructor || null,
      description: resource.description || null,
      fileName: resource.fileName || null,
      fileUrl: resource.fileUrl || null,
      mimeType: resource.mimeType || null,
      createdAt: resource.createdAt ? new Date(resource.createdAt) : undefined,
    },
    update: {},
  })
  return serialize(row)
}

export async function removeResource(id: string): Promise<StoredResource | null> {
  try {
    const row = await prisma.resource.delete({ where: { id } })
    return serialize(row)
  } catch {
    return null
  }
}

export async function deleteResource(id: string): Promise<StoredResource | null> {
  return removeResource(id)
}