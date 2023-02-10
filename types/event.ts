export interface Planner {
  firstName: string
  lastName: string
  email: string
}

export interface Category {
  name: string
}

export interface Links {
  invitation: LinkType
  agenda: LinkType
  summary: LinkType
  registration: LinkType
}

export interface LinkType {
  href: string
}

export interface RegistrationType {
  id: string
  name: string
  code: string
  description: string
  virtual: boolean
}

export interface Event {
  id: string
  title: string
  code: string
  description: string
  start: string
  end: string
  closeAfter: string
  archiveAfter: string
  launchAfter: string
  timezone: string
  defaultLocale: string
  currency: string
  registrationSecurityLevel: string
  status: string
  eventStatus: string
  testMode: boolean
  planners: Planner[]
  created: string
  lastModified: string
  category: Category
  _links: Links
  virtual: boolean
  format: string
  languages: string[]
  type: string
}