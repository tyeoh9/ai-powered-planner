'use server'

import { supabase } from '@/lib/supabase'
import { auth } from '@/lib/auth'

export interface Folder {
  id: string
  user_id: string
  parent_id: string | null
  name: string
  created_at: string
  updated_at: string
}

const MAX_DEPTH = 5

async function getUserId(): Promise<string> {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }
  return session.user.id
}

async function getFolderDepth(folderId: string | null, folders: Folder[]): Promise<number> {
  if (!folderId) return 0
  const folder = folders.find(f => f.id === folderId)
  if (!folder) return 0
  return 1 + await getFolderDepth(folder.parent_id, folders)
}

async function wouldCreateCircular(folderId: string, newParentId: string, folders: Folder[]): Promise<boolean> {
  let current: string | null = newParentId
  while (current) {
    if (current === folderId) return true
    const folder = folders.find(f => f.id === current)
    current = folder?.parent_id ?? null
  }
  return false
}

export async function checkFolderNameExists(
  name: string,
  parentId: string | null,
  excludeId?: string
): Promise<boolean> {
  const userId = await getUserId()
  const normalizedName = name.trim().toLowerCase()

  let query = supabase
    .from('folders')
    .select('id')
    .eq('user_id', userId)
    .ilike('name', normalizedName)

  if (parentId === null) {
    query = query.is('parent_id', null)
  } else {
    query = query.eq('parent_id', parentId)
  }

  if (excludeId) {
    query = query.neq('id', excludeId)
  }

  const { data } = await query.limit(1)
  return (data && data.length > 0) || false
}

export type CreateFolderResult = { success: true; folder: Folder } | { success: false; error: string }

export async function createFolder(name: string, parentId?: string | null): Promise<CreateFolderResult> {
  const userId = await getUserId()

  // Check for duplicate name
  const exists = await checkFolderNameExists(name, parentId || null)
  if (exists) {
    return { success: false, error: 'A folder with this name already exists' }
  }

  if (parentId) {
    const { data: folders } = await supabase
      .from('folders')
      .select('*')
      .eq('user_id', userId)

    const depth = await getFolderDepth(parentId, folders || [])
    if (depth >= MAX_DEPTH - 1) {
      return { success: false, error: `Maximum folder depth of ${MAX_DEPTH} reached` }
    }
  }

  const { data, error } = await supabase
    .from('folders')
    .insert({
      user_id: userId,
      parent_id: parentId || null,
      name: name.trim() || 'New Folder',
    })
    .select()
    .single()

  if (error) return { success: false, error: error.message }
  return { success: true, folder: data }
}

export async function getFolders(): Promise<Folder[]> {
  const userId = await getUserId()

  const { data, error } = await supabase
    .from('folders')
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true })

  if (error) throw new Error(error.message)
  return data || []
}

export async function getFolder(id: string): Promise<Folder | null> {
  const userId = await getUserId()

  const { data, error } = await supabase
    .from('folders')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(error.message)
  }
  return data
}

export type RenameFolderResult = { success: true } | { success: false; error: string }

export async function renameFolder(id: string, name: string): Promise<RenameFolderResult> {
  const userId = await getUserId()

  // Get current folder to find parent_id
  const { data: folder } = await supabase
    .from('folders')
    .select('parent_id')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (!folder) return { success: false, error: 'Folder not found' }

  // Check for duplicate name (excluding self)
  const exists = await checkFolderNameExists(name, folder.parent_id, id)
  if (exists) {
    return { success: false, error: 'A folder with this name already exists' }
  }

  const { error } = await supabase
    .from('folders')
    .update({
      name: name.trim() || 'Untitled Folder',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', userId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function deleteFolder(id: string): Promise<void> {
  const userId = await getUserId()

  // Check for child folders
  const { data: childFolders } = await supabase
    .from('folders')
    .select('id')
    .eq('parent_id', id)
    .eq('user_id', userId)
    .limit(1)

  if (childFolders && childFolders.length > 0) {
    throw new Error('Cannot delete folder: contains subfolders')
  }

  // Check for documents
  const { data: docs } = await supabase
    .from('documents')
    .select('id')
    .eq('folder_id', id)
    .eq('user_id', userId)
    .limit(1)

  if (docs && docs.length > 0) {
    throw new Error('Cannot delete folder: contains documents')
  }

  const { error } = await supabase
    .from('folders')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
}

export async function moveFolder(id: string, newParentId: string | null): Promise<void> {
  const userId = await getUserId()

  // Can't move to self
  if (id === newParentId) {
    throw new Error('Cannot move folder into itself')
  }

  const { data: folders } = await supabase
    .from('folders')
    .select('*')
    .eq('user_id', userId)

  if (!folders) throw new Error('Failed to fetch folders')

  // Check for circular reference
  if (newParentId && await wouldCreateCircular(id, newParentId, folders)) {
    throw new Error('Cannot move folder into its own subfolder')
  }

  // Check depth constraint
  if (newParentId) {
    const parentDepth = await getFolderDepth(newParentId, folders)
    const folder = folders.find(f => f.id === id)
    if (!folder) throw new Error('Folder not found')

    // Calculate max depth of subtree rooted at this folder
    const getSubtreeDepth = (folderId: string): number => {
      const children = folders.filter(f => f.parent_id === folderId)
      if (children.length === 0) return 0
      return 1 + Math.max(...children.map(c => getSubtreeDepth(c.id)))
    }

    const subtreeDepth = getSubtreeDepth(id)
    if (parentDepth + 1 + subtreeDepth >= MAX_DEPTH) {
      throw new Error(`Move would exceed maximum folder depth of ${MAX_DEPTH}`)
    }
  }

  const { error } = await supabase
    .from('folders')
    .update({
      parent_id: newParentId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
}

export async function getFolderPath(folderId: string | null): Promise<Folder[]> {
  if (!folderId) return []

  const userId = await getUserId()
  const { data: folders } = await supabase
    .from('folders')
    .select('*')
    .eq('user_id', userId)

  if (!folders) return []

  const path: Folder[] = []
  let current: string | null = folderId

  while (current) {
    const folder = folders.find(f => f.id === current)
    if (!folder) break
    path.unshift(folder)
    current = folder.parent_id
  }

  return path
}
