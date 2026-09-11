import { promises as fs } from 'fs'
import path from 'path'

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
const seedResources: StoredResource[] = []

const resourceFilePath = path.join(process.cwd(), 'data', 'resources.json')

async function ensureStore() {
  await fs.mkdir(path.dirname(resourceFilePath), { recursive: true })

  try {
    await fs.access(resourceFilePath)
  } catch {
    await fs.writeFile(resourceFilePath, JSON.stringify(seedResources, null, 2), 'utf-8')
  }
}

export async function readResources(): Promise<StoredResource[]> {
  await ensureStore()

  const raw = await fs.readFile(resourceFilePath, 'utf-8')
  const parsed = JSON.parse(raw) as StoredResource[]

  if (!Array.isArray(parsed) || parsed.length === 0) {
    await fs.writeFile(resourceFilePath, JSON.stringify(seedResources, null, 2), 'utf-8')
    return seedResources
  }

  return parsed
}

export async function writeResources(resources: StoredResource[]) {
  await ensureStore()
  await fs.writeFile(resourceFilePath, JSON.stringify(resources, null, 2), 'utf-8')
}

export async function addResource(resource: StoredResource): Promise<StoredResource> {
  const all = await readResources()
  const next = [resource, ...all.filter((item) => item.id !== resource.id)]
  await writeResources(next)
  return resource
}

export async function removeResource(id: string): Promise<boolean> {
  const all = await readResources()
  const next = all.filter((item) => item.id !== id)
  if (next.length === all.length) return false
  await writeResources(next)
  return true
}

export async function deleteResource(id: string): Promise<boolean> {
  const all = await readResources()
  const exists = all.some((r) => r.id === id)
  if (!exists) return false
  const next = all.filter((r) => r.id !== id)
  await writeResources(next)
  return true
}
