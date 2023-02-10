import { Contact } from "./contact";
export interface RegistrationPath {
  id: string;
  code: string;
  name: string;
}
export interface AttendeeRegistrationType {
  id: string;
  code: string;
  name: string;
}
export interface AttendeeInvitationList {
  id: string;
  name: string;
}
export interface AttendeeAdmissionItem {
  id: string;
  name: string;
}
export interface AttendeeGroup {
  leader: boolean;
  member: boolean;
}

export interface CompetitionAttendee {
  email: string;
  eventID: string;
  sessionID: string;
}
export interface AttendeeCreateInput {
  event: { id: string };
  contact: { id: string };
  admissionItem: { id: string };
  registrationType: { id: string };
  sendEmail?: boolean;
  status: string;
}

export interface Attendee {
  id: string;
  event: {
    id: string;
  };
  confirmationNumber: string;
  contact: Contact;
  checkedIn: boolean;
  registrationPath: RegistrationPath;
  registrationType: AttendeeRegistrationType;
  invitationList: AttendeeInvitationList;
  admissionItem: AttendeeAdmissionItem;
  guest: boolean;
  group: AttendeeGroup;
  unsubscribed: boolean;
  status: string;
  registeredAt: string;
  registrationLastModified: string;
  invitedBy: string;
  responseMethod: string;
  created: string;
  createdBy: string;
  lastModified: string;
  lastModifiedBy: string;
  allowAppointmentPushNotifications: boolean;
  testRecord: boolean;
  attendeeLastModified: string;
}
