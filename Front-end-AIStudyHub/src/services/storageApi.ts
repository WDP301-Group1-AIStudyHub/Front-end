import { apiClient, unwrapApiData } from './apiClient'
import type {
  PurchaseOrder,
  StoragePackageList,
  StorageTransaction,
  StorageTransactionSnapshot,
  UserStorage,
} from '../types/storage'

export const fetchMyStorage = async (): Promise<UserStorage> => {
  const response = await apiClient.get('/api/storage/me')
  return unwrapApiData(response.data, 'Could not load storage usage')
}

export const fetchStoragePackages = async (): Promise<StoragePackageList> => {
  const response = await apiClient.get('/api/storage/packages')
  return unwrapApiData(response.data, 'Could not load storage plans')
}

export const reconcileStorage = async (): Promise<UserStorage & { drift: number }> => {
  const response = await apiClient.post('/api/storage/reconcile')
  return unwrapApiData(response.data, 'Could not recalculate usage')
}

export const createPurchase = async (
  packageId: string,
): Promise<PurchaseOrder> => {
  const response = await apiClient.post('/api/storage/purchases', {
    packageId,
    platform: 'WEB',
  })
  return unwrapApiData(response.data, 'Could not create the order')
}

export const fetchTransaction = async (
  orderRef: string,
): Promise<StorageTransactionSnapshot> => {
  const response = await apiClient.get(`/api/storage/transactions/${orderRef}`)
  return unwrapApiData(response.data, 'Could not load the transaction')
}

export const fetchTransactions = async (): Promise<StorageTransaction[]> => {
  const response = await apiClient.get('/api/storage/transactions', {
    params: { limit: 20 },
  })
  return (response.data?.items ?? []) as StorageTransaction[]
}
