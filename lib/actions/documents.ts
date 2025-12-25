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

export async function updateDocument(
  id: string,
  updates: { title?: string; content?: JSONContent }
): Promise<void> {
  const userId = await getUserId()

  const { error } = await supabase
    .from('documents')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
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

export async function moveDocument(id: string, folderId: string | null): Promise<void> {
  const userId = await getUserId()

  const { error } = await supabase
    .from('documents')
    .update({
      folder_id: folderId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
}
