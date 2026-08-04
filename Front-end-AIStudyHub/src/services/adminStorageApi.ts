import { apiClient, unwrapApiData } from './apiClient'
import type {
  AdminPagination,
  AdminPaymentTransaction,
  AdminPaymentsOverview,
  AdminPaymentProvider,
  AdminPaymentPlatform,
  AdminPaymentStatus,
  AdminReconcileResult,
  AdminStorageOverview,
  AdminStoragePackage,
  AdminStorageUserDetail,
  AdminStorageUserRow,
  StorageAdminStatus,
} from '@/types/adminStorage'

type PageResult<T> = { items: T[]; pagination: AdminPagination }

export async function getAdminStorageOverview() {
  const response = await apiClient.get('/api/admin/storage/overview')
  return unwrapApiData<AdminStorageOverview>(response.data, 'Failed to load storage overview')
}

export async function listAdminStorageUsers(params: {
  page?: number
  limit?: number
  search?: string
  packageId?: string
  status?: StorageAdminStatus
}) {
  const response = await apiClient.get('/api/admin/storage/users', { params })
  return unwrapApiData<PageResult<AdminStorageUserRow>>(response.data, 'Failed to load storage users')
}

export async function getAdminStorageUser(userId: string) {
  const response = await apiClient.get(`/api/admin/storage/users/${userId}`)
  return unwrapApiData<AdminStorageUserDetail>(response.data, 'Failed to load storage user')
}

export async function assignAdminStoragePackage(userId: string, packageId: string, reason: string) {
  const response = await apiClient.patch(`/api/admin/storage/users/${userId}/package`, { packageId, reason })
  return unwrapApiData<AdminStorageUserDetail>(response.data, 'Failed to change storage package')
}

export async function reconcileAdminStorageUser(userId: string) {
  const response = await apiClient.post(`/api/admin/storage/users/${userId}/reconcile`)
  return unwrapApiData<AdminStorageUserDetail & { reconciliation: AdminReconcileResult }>(response.data, 'Failed to reconcile storage')
}

export async function reconcileAllAdminStorage() {
  const response = await apiClient.post('/api/admin/storage/reconcile')
  return unwrapApiData<AdminReconcileResult>(response.data, 'Failed to reconcile storage')
}

export async function listAdminStoragePackages() {
  const response = await apiClient.get('/api/admin/storage/packages')
  return unwrapApiData<AdminStoragePackage[]>(response.data, 'Failed to load storage packages')
}

export async function createAdminStoragePackage(payload: Omit<AdminStoragePackage, 'id'>) {
  const response = await apiClient.post('/api/admin/storage/packages', payload)
  return unwrapApiData<AdminStoragePackage>(response.data, 'Failed to create storage package')
}

export async function updateAdminStoragePackage(packageId: string, payload: Partial<Omit<AdminStoragePackage, 'id' | 'code'>>) {
  const response = await apiClient.patch(`/api/admin/storage/packages/${packageId}`, payload)
  return unwrapApiData<AdminStoragePackage>(response.data, 'Failed to update storage package')
}

export async function getAdminPaymentsOverview(params?: { dateFrom?: string; dateTo?: string }) {
  const response = await apiClient.get('/api/admin/payments/overview', { params })
  return unwrapApiData<AdminPaymentsOverview>(response.data, 'Failed to load payment overview')
}

export async function listAdminPayments(params: {
  page?: number
  limit?: number
  status?: AdminPaymentStatus
  provider?: AdminPaymentProvider
  platform?: AdminPaymentPlatform
  packageId?: string
  userId?: string
  orderRef?: string
  search?: string
  dateFrom?: string
  dateTo?: string
}) {
  const response = await apiClient.get('/api/admin/payments/transactions', { params })
  return unwrapApiData<PageResult<AdminPaymentTransaction>>(response.data, 'Failed to load payment transactions')
}

export async function getAdminPayment(orderRef: string) {
  const response = await apiClient.get(`/api/admin/payments/transactions/${encodeURIComponent(orderRef)}`)
  return unwrapApiData<AdminPaymentTransaction>(response.data, 'Failed to load payment detail')
}

export async function cancelAdminPayment(orderRef: string, reason: string) {
  const response = await apiClient.post(`/api/admin/payments/transactions/${encodeURIComponent(orderRef)}/cancel`, { reason })
  return unwrapApiData<AdminPaymentTransaction>(response.data, 'Failed to cancel payment')
}
