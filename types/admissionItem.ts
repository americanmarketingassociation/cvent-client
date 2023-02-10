export interface AdmissionItem {
  id: string
  name: string
  lastModified: string
  created: string
  allowOptionalSessions: boolean
  limitedAvailableSessions: any[]
  event: {
    id: string
    languages: string[]
  }
  includedSessions: any[]
}