export interface Subject {
  _id: string
  name: string
  description?: string
  color?: string
  code?: string
  semester?: string
  createdAt?: string
}

export interface SubjectPayload {
  name: string
  code?: string
  description?: string
  color?: string
  semester?: string
}
