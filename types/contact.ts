enum CVentAddressType {
  HOME = "Home",
  WORK = "Work",
}

export interface CVentAddress {
  address1: string;
  address2?: string;
  address3?: string;
  city: string;
  regionCode: string; // AKA "state"
  postalCode: string;
  countryCode: string;
}
export interface ContactCreateInput {
  parentId?: string;
  event?: {
    id: string;
  };
  nickname?: string;
  prefix?: string;
  optOut?: {
    optedOut: boolean;
  };
  pager?: string;
  _links?: {
    twitterUrl?: {
      href: string;
    };
    facebookUrl?: {
      href: string;
    };
    linkedInUrl?: {
      href: string;
    };
  };
  id?: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  email: string;
  ccEmail?: string;
  gender?: string;
  company?: string;
  designation?: string;
  title?: string;
  type?: {
    id: string;
  };
  primaryAddressType?: string;
  homeAddress?: CVentAddress;
  homePhone?: string;
  homeFax?: string;
  workAddress?: CVentAddress;
  workPhone?: string;
  workFax?: string;
  sourceId?: string;
  mobilePhone?: string;
}

export interface ContactCustomFieldPutInput {
  id: string;
  value: string[];
}

export interface ContactUpdateInput {
  id: string;
  nickname?: string;
  prefix?: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  email?: string;
  company?: string;
  title?: string;
  primaryAddressType?: CVentAddressType;
  homeAddress?: CVentAddress;
  workAddress?: CVentAddress;
  mobilePhone?: string;
  workPhone?: string;
  customFields?: ContactCustomFieldPutInput;
}
export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  middleName: string;
  nickname: string;
  email: string;
  deleted: boolean;
  created: string;
  lastModified: string;
  createdBy: string;
  lastModifiedBy: string;
  optOut: {
    optedOut: boolean;
    by: string;
  };
}
