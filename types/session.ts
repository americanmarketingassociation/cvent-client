export interface Session {
  includedSession: boolean
  created: string
  lastModified: string
  id: string
  virtual: boolean
  event: {
    id: string
  }
  title: string
  type: {
    id: string
    name: string
  }
  start: string
  end: string
  status: string
  enableWaitlist: boolean
  waitlistCapacity: number
  capacityUnlimited: boolean
  virtualCapacityUnlimited: boolean
  timezone: string
  displayOnAgenda: boolean
  featured: boolean
  openForRegistration: boolean
  openForAttendeeHub: boolean
  registrationTypes: any[]
  presentationType: string
  dataTagCode: string
  customFields: Record<string, string>[]
}