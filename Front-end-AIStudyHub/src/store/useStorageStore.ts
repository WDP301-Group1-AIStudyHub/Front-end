import { create } from 'zustand'
import { fetchMyStorage, fetchStoragePackages } from '../services/storageApi'
import type { StoragePackage, UserStorage } from '../types/storage'

export interface CapacityCheck {
  ok: boolean
  /** Bytes the file needs. */
  needed: number
  /** Bytes currently free. */
  available: number
  /** False when quota is unknown, so callers can let the server decide. */
  known: boolean
}

interface StorageState {
  storage: UserStorage | null
  packages: StoragePackage[]
  currentPackageId: string | null
  loading: boolean
  error: string | null
  loadStorage: (options?: { force?: boolean }) => Promise<void>
  loadPackages: () => Promise<void>
  /** Optimistic local bump so the bar moves the moment an upload succeeds. */
  applyUploadedBytes: (bytes: number) => void
  setStorage: (storage: UserStorage) => void
  hasCapacityFor: (bytes: number) => CapacityCheck
}

/**
 * Single source of truth for every quota decision in the app: the dashboard bar,
 * the storage page and all five upload entry points read from here, so they can
 * never disagree with each other.
 */
export const useStorageStore = create<StorageState>((set, get) => ({
  storage: null,
  packages: [],
  currentPackageId: null,
  loading: false,
  error: null,

  loadStorage: async (options) => {
    if (get().loading && !options?.force) {
      return
    }

    set({ loading: true, error: null })

    try {
      const storage = await fetchMyStorage()
      set({ storage, loading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Could not load storage',
        loading: false,
      })
    }
  },

  loadPackages: async () => {
    try {
      const { packages, currentPackageId } = await fetchStoragePackages()
      set({ packages, currentPackageId })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Could not load plans',
      })
    }
  },

  applyUploadedBytes: (bytes) => {
    const { storage } = get()
    if (!storage || bytes <= 0) {
      return
    }

    const usedBytes = storage.usedBytes + bytes
    const usagePercent =
      storage.quotaBytes > 0
        ? Math.min(100, Math.round((usedBytes / storage.quotaBytes) * 1000) / 10)
        : 100

    set({
      storage: {
        ...storage,
        usedBytes,
        usagePercent,
        availableBytes: Math.max(0, storage.quotaBytes - usedBytes - storage.reservedBytes),
        status:
          usagePercent >= 100
            ? 'FULL'
            : usagePercent >= 95
              ? 'CRITICAL'
              : usagePercent >= 80
                ? 'WARNING'
                : 'OK',
      },
    })
  },

  setStorage: (storage) => set({ storage }),

  hasCapacityFor: (bytes) => {
    const { storage } = get()

    // Quota not loaded yet: report unknown rather than blocking. The server
    // enforces the real limit, so a permissive client is safe here.
    if (!storage) {
      return { ok: true, needed: bytes, available: 0, known: false }
    }

    return {
      ok: bytes <= storage.availableBytes,
      needed: bytes,
      available: storage.availableBytes,
      known: true,
    }
  },
}))
