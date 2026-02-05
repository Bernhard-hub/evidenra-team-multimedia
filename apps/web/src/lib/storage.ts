/**
 * EVIDENRA Storage Service
 * Handles file uploads to Supabase Storage for large documents
 */

import { supabase } from './supabase'

const DOCUMENTS_BUCKET = 'documents'
const MAX_INLINE_SIZE = 100 * 1024 // 100KB - larger files go to storage

export interface UploadResult {
  success: boolean
  filePath?: string
  publicUrl?: string
  error?: string
}

export interface StorageFile {
  name: string
  size: number
  type: string
  lastModified: number
}

export const storageService = {
  /**
   * Check if a file should be stored in Supabase Storage (vs inline in DB)
   */
  shouldUseStorage(fileSize: number): boolean {
    return fileSize > MAX_INLINE_SIZE
  },

  /**
   * Upload a document to Supabase Storage
   */
  async uploadDocument(
    file: File,
    projectId: string,
    userId: string
  ): Promise<UploadResult> {
    try {
      // Generate unique file path
      const timestamp = Date.now()
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const filePath = `${projectId}/${userId}/${timestamp}_${sanitizedName}`

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(DOCUMENTS_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (error) {
        console.error('Storage upload error:', error)
        return { success: false, error: error.message }
      }

      // Get public URL (for signed access)
      const { data: urlData } = await supabase.storage
        .from(DOCUMENTS_BUCKET)
        .createSignedUrl(filePath, 60 * 60 * 24) // 24h signed URL

      return {
        success: true,
        filePath: data.path,
        publicUrl: urlData?.signedUrl,
      }
    } catch (err) {
      console.error('Upload error:', err)
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Upload failed',
      }
    }
  },

  /**
   * Download document content from Storage
   */
  async downloadDocument(filePath: string): Promise<string | null> {
    try {
      const { data, error } = await supabase.storage
        .from(DOCUMENTS_BUCKET)
        .download(filePath)

      if (error) {
        console.error('Download error:', error)
        return null
      }

      // Convert blob to text
      return await data.text()
    } catch (err) {
      console.error('Download error:', err)
      return null
    }
  },

  /**
   * Get a signed URL for document access
   */
  async getSignedUrl(filePath: string, expiresIn = 3600): Promise<string | null> {
    try {
      const { data, error } = await supabase.storage
        .from(DOCUMENTS_BUCKET)
        .createSignedUrl(filePath, expiresIn)

      if (error) {
        console.error('Signed URL error:', error)
        return null
      }

      return data.signedUrl
    } catch (err) {
      console.error('Signed URL error:', err)
      return null
    }
  },

  /**
   * Delete a document from Storage
   */
  async deleteDocument(filePath: string): Promise<boolean> {
    try {
      const { error } = await supabase.storage
        .from(DOCUMENTS_BUCKET)
        .remove([filePath])

      if (error) {
        console.error('Delete error:', error)
        return false
      }

      return true
    } catch (err) {
      console.error('Delete error:', err)
      return false
    }
  },

  /**
   * List all documents in a project folder
   */
  async listProjectDocuments(projectId: string): Promise<StorageFile[]> {
    try {
      const { data, error } = await supabase.storage
        .from(DOCUMENTS_BUCKET)
        .list(projectId, {
          limit: 1000,
          sortBy: { column: 'created_at', order: 'desc' },
        })

      if (error) {
        console.error('List error:', error)
        return []
      }

      return (data || []).map((file) => ({
        name: file.name,
        size: file.metadata?.size || 0,
        type: file.metadata?.mimetype || 'application/octet-stream',
        lastModified: new Date(file.created_at).getTime(),
      }))
    } catch (err) {
      console.error('List error:', err)
      return []
    }
  },

  /**
   * Get storage usage for a project
   */
  async getProjectStorageUsage(projectId: string): Promise<number> {
    const files = await this.listProjectDocuments(projectId)
    return files.reduce((total, file) => total + file.size, 0)
  },
}

export default storageService
