import type { StorageQuotaDetails } from '../types/storage'

const UNITS = ['B', 'KB', 'MB', 'GB', 'TB'] as const

/**
 * Keeps one decimal from KB upward. The older formatFileSize in ./formatters
 * rounds anything >= 10 to a whole number, which loses meaningful precision on
 * a 100 MB quota bar — but three pages depend on that rounding, so it stays.
 */
export function formatStorageBytes(bytes: number | undefined | null): string {
  if (!bytes || !Number.isFinite(bytes) || bytes <= 0) {
    return '0 B'
  }

  let value = bytes
  let index = 0

  while (value >= 1024 && index < UNITS.length - 1) {
    value /= 1024
    index += 1
  }

  // One decimal, but never a bare trailing zero: "100 MB", not "100.0 MB".
  const rounded = index === 0 ? Math.round(value) : Number(value.toFixed(1))

  return `${rounded} ${UNITS[index]}`
}

export function formatVnd(amount: number): string {
  if (!amount) {
    return 'Free'
  }

  return `${new Intl.NumberFormat('vi-VN').format(amount)} ₫`
}

/** Turns the server's structured quota payload into a sentence users can act on. */
export function buildQuotaErrorMessage(details?: StorageQuotaDetails | null): string {
  if (!details) {
    return 'Storage is full. Delete some documents or upgrade your plan.'
  }

  const packageLabel = details.packageName ? ` on the ${details.packageName} plan` : ''

  return `Not enough storage. This file needs ${formatStorageBytes(details.requiredBytes)} but only ${formatStorageBytes(details.availableBytes)} is free${packageLabel}.`
}
