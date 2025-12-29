'use server'

import { supabase } from '@/lib/supabase'
import { auth } from '@/lib/auth'
import { JSONContent } from '@tiptap/react'

export interface Document {
  id: string
  user_id: string
  title: string
  content: JSONContent
  folder_id: string | null
  created_at: string
  updated_at: string
}

async function getUserId(): Promise<string> {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }
  return session.user.id
}

export async function checkDocumentNameExists(
  title: string,
  folderId: string | null,
  excludeId?: string
): Promise<boolean> {
  const userId = await getUserId()
  const normalizedTitle = title.trim().toLowerCase()

  let query = supabase
    .from('documents')
    .select('id')
    .eq('user_id', userId)
    .ilike('title', normalizedTitle)

  if (folderId === null) {
    query = query.is('folder_id', null)
  } else {
    query = query.eq('folder_id', folderId)
  }

  if (excludeId) {
    query = query.neq('id', excludeId)
  }

  const { data } = await query.limit(1)
  return (data && data.length > 0) || false
}

export async function createDocument(folderId?: string | null): Promise<{ id: string }> {
  const userId = await getUserId()

  const { data, error } = await supabase
    .from('documents')
    .insert({
      user_id: userId,
      title: 'Untitled',
      content: { type: 'doc', content: [] },
      folder_id: folderId || null,
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)
  return { id: data.id }
}

export async function getDocuments(): Promise<Document[]> {
  const userId = await getUserId()

  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}

export async function getDocument(id: string): Promise<Document | null> {
  const userId = await getUserId()

  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // not found
    throw new Error(error.message)
  }
  return data
}

export type UpdateDocumentResult = { success: true } | { success: false; error: string }

export async function updateDocument(
  id: string,
  updates: { title?: string; content?: JSONContent }
): Promise<UpdateDocumentResult> {
  const userId = await getUserId()

  // If title is being updated, check for duplicates
  if (updates.title) {
    // Get current document to find folder_id
    const { data: doc } = await supabase
      .from('documents')
      .select('folder_id')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (!doc) return { success: false, error: 'Document not found' }

    const exists = await checkDocumentNameExists(updates.title, doc.folder_id, id)
    if (exists) {
      return { success: false, error: 'A document with this name already exists' }
    }
  }

  const { error } = await supabase
    .from('documents')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', userId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function deleteDocument(id: string): Promise<void> {
  const userId = await getUserId()

  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
}

export type MoveDocumentResult = { success: true } | { success: false; error: string }

export async function moveDocument(id: string, folderId: string | null): Promise<MoveDocumentResult> {
  const userId = await getUserId()

  // Get current document title
  const { data: doc } = await supabase
    .from('documents')
    .select('title')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (!doc) return { success: false, error: 'Document not found' }

  // Check for duplicate name in target folder
  const exists = await checkDocumentNameExists(doc.title, folderId, id)
  if (exists) {
    return { success: false, error: 'A document with this name already exists in the target folder' }
  }

  const { error } = await supabase
    .from('documents')
    .update({
      folder_id: folderId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', userId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}
