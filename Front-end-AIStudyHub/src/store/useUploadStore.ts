import { create } from 'zustand'
import axios from 'axios'
import { getStoredToken } from '../services/authStorage'
import { findOrCreateSubjectByName } from '../services/subjectApi'
import type { DocumentItem } from '../types/document'

const API_ORIGIN =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '') ??
  ''
const API_BASE_URL = API_ORIGIN.replace(/\/api$/, '')

export interface UploadItem {
  id: string
  fileName: string
  progress: number
  status: 'pending' | 'uploading' | 'processing' | 'success' | 'failed'
  error?: string
  abortController?: AbortController
}

interface UploadDocumentPayload {
  file: File
  title: string
  description?: string
  subject?: string
}

export interface ConflictItem {
  id: string
  payload: UploadDocumentPayload
  existingDocumentMeta: DocumentItem
  onSuccess?: () => void
}

interface UploadState {
  uploads: UploadItem[]
  stagedConflicts: Record<string, ConflictItem>
  uploadFile: (payload: UploadDocumentPayload, onSuccess?: () => void, overwriteId?: string) => Promise<void>
  processIncomingUpload: (payload: UploadDocumentPayload, existingDocuments: DocumentItem[], onSuccess?: () => void) => void
  resolveConflict: (conflictId: string, action: 'REPLACE' | 'KEEP_BOTH' | 'CANCEL') => void
  cancelUpload: (id: string) => void
  cancelAll: () => void
  removeUpload: (id: string) => void
  clearFinished: () => void
}

export const useUploadStore = create<UploadState>((set, get) => ({
  uploads: [],
  stagedConflicts: {},

  processIncomingUpload: (payload, existingDocuments, onSuccess) => {
    const duplicate = existingDocuments.find(
      (doc) => doc.fileName.trim().toLowerCase() === payload.file.name.trim().toLowerCase()
    )

    if (duplicate) {
      const conflictId = crypto.randomUUID()
      set((state) => ({
        stagedConflicts: {
          ...state.stagedConflicts,
          [conflictId]: {
            id: conflictId,
            payload,
            existingDocumentMeta: duplicate,
            onSuccess,
          },
        },
      }))
      return
    }

    get().uploadFile(payload, onSuccess)
  },

  resolveConflict: (conflictId, action) => {
    const conflict = get().stagedConflicts[conflictId]
    if (!conflict) return

    const { payload, existingDocumentMeta, onSuccess } = conflict

    set((state) => {
      const updated = { ...state.stagedConflicts }
      delete updated[conflictId]
      return { stagedConflicts: updated }
    })

    if (action === 'REPLACE') {
      const docId = existingDocumentMeta.id || (existingDocumentMeta as any)._id
      get().uploadFile(payload, onSuccess, docId)
    } else if (action === 'KEEP_BOTH') {
      const file = payload.file
      const dotIndex = file.name.lastIndexOf(".")
      const name = dotIndex !== -1 ? file.name.substring(0, dotIndex) : file.name
      const ext = dotIndex !== -1 ? file.name.substring(dotIndex) : ""
      const uniqueName = `${name} (1)${ext}`

      const renamedFile = new File([file], uniqueName, { type: file.type })
      const renamedPayload = { ...payload, file: renamedFile }
      get().uploadFile(renamedPayload, onSuccess)
    }
  },

  uploadFile: async (payload, onSuccess, overwriteId) => {
    const id = crypto.randomUUID()
    const abortController = new AbortController()

    const newItem: UploadItem = {
      id,
      fileName: payload.file.name,
      progress: 0,
      status: 'pending',
      abortController,
    }

    set((state) => ({ uploads: [newItem, ...state.uploads] }))

    try {
      // Step 1: Resolve subject name to subjectId
      set((state) => ({
        uploads: state.uploads.map((item) =>
          item.id === id ? { ...item, status: 'processing', progress: 5 } : item
        ),
      }))

      let subjectId = ''
      if (payload.subject?.trim()) {
        subjectId = await findOrCreateSubjectByName(payload.subject.trim())
      } else {
        throw new Error('Subject is required')
      }

      // Step 2: Upload binary using Axios
      set((state) => ({
        uploads: state.uploads.map((item) =>
          item.id === id ? { ...item, status: 'uploading', progress: 10 } : item
        ),
      }))

      const formData = new FormData()
      formData.set('file', payload.file)
      formData.set('title', payload.title.trim())
      formData.set('subjectId', subjectId)
      if (payload.description?.trim()) {
        formData.set('description', payload.description.trim())
      }
      if (payload.subject?.trim()) {
        formData.set('subject', payload.subject.trim())
      }
      if (overwriteId) {
        formData.set('overwriteId', overwriteId)
      }

      const token = getStoredToken()
      const headers: Record<string, string> = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await axios.post(`${API_BASE_URL}/api/documents/upload`, formData, {
        headers,
        signal: abortController.signal,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            set((state) => ({
              uploads: state.uploads.map((item) => {
                if (item.id === id) {
                  const status = percentage >= 100 ? 'processing' : 'uploading'
                  return {
                    ...item,
                    progress: Math.min(percentage, 99),
                    status,
                  }
                }
                return item
              }),
            }))
          }
        },
      })

      if (response.data?.success) {
        set((state) => ({
          uploads: state.uploads.map((item) =>
            item.id === id ? { ...item, status: 'success', progress: 100 } : item
          ),
        }))
        if (onSuccess) {
          onSuccess()
        }
      } else {
        throw new Error(response.data?.message || 'Server upload failed')
      }
    } catch (err: any) {
      if (axios.isCancel(err) || err?.name === 'CanceledError') {
        return
      }
      const errorMessage = err.response?.data?.message || err.message || 'Upload failed'
      set((state) => ({
        uploads: state.uploads.map((item) =>
          item.id === id ? { ...item, status: 'failed', error: errorMessage } : item
        ),
      }))
    }
  },

  cancelUpload: (id) => {
    set((state) => {
      const item = state.uploads.find((u) => u.id === id)
      if (
        item &&
        (item.status === 'uploading' ||
          item.status === 'processing' ||
          item.status === 'pending')
      ) {
        item.abortController?.abort()
        return {
          uploads: state.uploads.map((u) =>
            u.id === id
              ? { ...u, status: 'failed', error: 'Cancelled by user' }
              : u
          ),
        }
      }
      return state
    })
  },

  cancelAll: () => {
    const { uploads, cancelUpload } = get()
    uploads.forEach((item) => {
      if (
        item.status === 'uploading' ||
        item.status === 'processing' ||
        item.status === 'pending'
      ) {
        cancelUpload(item.id)
      }
    })
  },

  removeUpload: (id) => {
    set((state) => ({
      uploads: state.uploads.filter((u) => u.id !== id),
    }))
  },

  clearFinished: () => {
    set((state) => ({
      uploads: state.uploads.filter(
        (u) =>
          u.status === 'uploading' ||
          u.status === 'processing' ||
          u.status === 'pending'
      ),
    }))
  },
}))
