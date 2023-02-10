import fetch from "node-fetch";
import {
  AttendeeCreateInput,
  AuthData,
  Contact,
  CVentClientCredentials,
  ContactCreateInput,
  PaginatedApiResponse,
  ApiCreationResponse,
  ContactUpdateInput,
  Attendee,
  Event,
  Params,
  RegistrationType,
  AdmissionItem,
  Session,
} from "../types";
import { encodeToBase64, parseParams } from "../utils";

enum CVentRegionEndpoints {
  NA = "https://api-platform.cvent.com",
  EU = "https://api-platform-eur.cvent.com",
  SANDBOX = "https://api-platform-sandbox.cvent.com",
}

enum OAuthScopes {
  EVENT_ATTENDEES__WRITE = "event/attendees:write",
  EVENT_ATTENDEES__READ = "event/attendees:read",
  EVENT_CONTACTS__WRITE = "event/contacts:write",
  EVENT_CONTACTS__READ = "event/contacts:read",
  EVENT_SESSIONENROLLMENT__WRITE = "event/session-enrollment:write",
  EVENT_SESSIONENROLLMENT__READ = "event/session-enrollment:read",
  EVENT_SESSIONENROLLMENT__DELETE = "event/session-enrollment:delete",
  EVENT_SESSIONS__WRITE = "event/sessions:write",
  EVENT_SESSIONS__READ = "event/sessions:read",
  EVENT_SESSIONS__DELETE = "event/sessions:delete",
}

const TOKEN_EXPIRATION_PADDING = 60 * 10 * 1000; // 10 minutes

export default class CVentClient {
  private readonly clientCredentials: CVentClientCredentials;
  private readonly endpoint: CVentRegionEndpoints;
  private accessToken = "";
  private tokenExpirationTime = 0;

  constructor(
    clientCredentials: CVentClientCredentials,
    regionEndpoint: CVentRegionEndpoints = CVentRegionEndpoints.NA
  ) {
    this.clientCredentials = clientCredentials;
    this.endpoint = regionEndpoint;
  }

  public async authenticate() {
    // Return the auth token if it exists and it's valid
    if (this.isValidConnection()) {
      return this.accessToken;
    }

    try {
      const { CVENT_CLIENT_ID, CVENT_CLIENT_SECRET } = this.clientCredentials;

      const credentials = encodeToBase64(
        `${CVENT_CLIENT_ID}:${CVENT_CLIENT_SECRET}`
      );
      const scopes = this.parseScopes([
        OAuthScopes.EVENT_ATTENDEES__WRITE,
        OAuthScopes.EVENT_ATTENDEES__READ,
        OAuthScopes.EVENT_CONTACTS__WRITE,
        OAuthScopes.EVENT_CONTACTS__READ,
        OAuthScopes.EVENT_SESSIONENROLLMENT__WRITE,
        OAuthScopes.EVENT_SESSIONENROLLMENT__READ,
        OAuthScopes.EVENT_SESSIONENROLLMENT__DELETE,
        OAuthScopes.EVENT_SESSIONS__WRITE,
        OAuthScopes.EVENT_SESSIONS__READ,
        OAuthScopes.EVENT_SESSIONS__DELETE,
      ]);

      const authResponse = await fetch(
        `${this.endpoint}/ea/oauth2/token?grant_type=client_credentials&client_id=${CVENT_CLIENT_ID}`,
        // `${this.endpoint}/ea/oauth2/token?grant_type=client_credentials&client_id=${CVENT_CLIENT_ID}&scope=${scopes}`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${credentials}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );
      const data = (await authResponse.json()) as AuthData;
      this.accessToken = data.access_token;

      const expirationDate = new Date();
      expirationDate.setSeconds(expirationDate.getSeconds() + data.expires_in);
      this.tokenExpirationTime = expirationDate.getTime();

      return this.accessToken;
    } catch (e) {
      throw new Error("CVent Authentication Failed");
    }
  }

  public async findAttendeeId(
    emailAddress: string,
    eventId: string
  ): Promise<string> {
    await this.authenticate();

    const response = await fetch(`${this.endpoint}/ea/attendees/filter`, {
      method: "POST",
      headers: {
        "Content-type": "application/json",
        Authorization: `Bearer ${this.accessToken}`,
      },
      body: JSON.stringify({
        filter: `contact.email eq "${emailAddress}" AND event.id eq "${eventId}"`,
      }),
    });

    const attendees = (await response.json()) as PaginatedApiResponse<
      Attendee[]
    >;

    if (attendees.data.length === 0 || !attendees.data[0].id) {
      return "";
    }

    return attendees.data[0].id;
  }

  public async findContactId(emailAddress: string): Promise<string> {
    await this.authenticate();

    const response = await fetch(`${this.endpoint}/ea/contacts/filter`, {
      method: "POST",
      headers: {
        "Content-type": "application/json",
        Authorization: `Bearer ${this.accessToken}`,
      },
      body: JSON.stringify({
        filter: `email eq "${emailAddress}"`,
      }),
    });

    const contacts = (await response.json()) as PaginatedApiResponse<Contact[]>;

    if (contacts.data.length === 0 || !contacts.data[0].id) {
      return "";
    }

    return contacts.data[0].id;
  }

  public async createAttendee(attendee: AttendeeCreateInput): Promise<string> {
    await this.authenticate();

    const attendeeResponse = await fetch(`${this.endpoint}/ea/attendees`, {
      method: "POST",
      headers: {
        "Content-type": "application/json",
        Authorization: `Bearer ${this.accessToken}`,
      },
      redirect: "follow",
      body: JSON.stringify([attendee]),
    });

    const attendeeResponseData =
      (await attendeeResponse.json()) as ApiCreationResponse<{ id: string }>;

    if (attendeeResponseData.length === 0 || !attendeeResponseData[0].data.id) {
      return "";
    }

    return attendeeResponseData[0].data.id;
  }

  public async createContact(contact: ContactCreateInput): Promise<string> {
    await this.authenticate();

    const response = await fetch(`${this.endpoint}/ea/contacts`, {
      method: "POST",
      headers: {
        "Content-type": "application/json",
        Authorization: `Bearer ${this.accessToken}`,
      },
      body: JSON.stringify([contact]),
    });

    const contacts = (await response.json()) as ApiCreationResponse<Contact>;
    if (contacts.length === 0 || !contacts[0].data.id) {
      return "";
    }

    return contacts[0].data.id;
  }

  public async updateContact(contact: Partial<Contact>): Promise<Contact> {
    await this.authenticate();

    const response = await fetch(`${this.endpoint}/ea/contacts/${contact.id}`, {
      method: "PATCH",
      headers: {
        "Content-type": "application/json",
        Authorization: `Bearer ${this.accessToken}`,
      },
      body: JSON.stringify(contact),
    });

    const updatedContact = (await response.json()) as Contact;
    return updatedContact;
  }

  public async updateFullContact(contact: ContactUpdateInput) {
    await this.authenticate();

    const { customFields, ...defaultFields } = contact;

    try {
      // Update the default fields
      await fetch(`${this.endpoint}/ea/contacts/${defaultFields.id}`, {
        method: "PATCH",
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify(defaultFields),
      });

      // Update the custom fields
      if (customFields) {
        const customFieldUpdates = Object.entries(customFields).map(
          ([key, value], i) => {
            return {
              id: key,
              value,
            };
          }
        );

        await Promise.all(
          customFieldUpdates.map(async ({ id, value }) => {
            console.log(`Updating custom contact field: ${id}: ${value}`);
            const customFieldUpdateResponse = await fetch(
              `${this.endpoint}/ea/contacts/${contact.id}/custom-fields/${id}/answers`,
              {
                method: "PUT",
                headers: {
                  "Content-type": "application/json",
                  Authorization: `Bearer ${this.accessToken}`,
                },
                body: JSON.stringify({ id, value: [value] }),
              }
            );
          })
        );
      }
    } catch (e) {
      console.log(e);
      return null;
    }

    return contact.id;
  }

  /**
   * Returns a paginated list of events that match the params.
   * @see {@link https://developer-portal.cvent.com/documentation#tag/Events/operation/getEvents List Events doc}
   * for more information on the filter and params available values
   * @param params Either a {@link Params} object or a string
   * @returns a list of {@link Event Events}
   */
  public async getEvents(
    params?: Params | string
  ): Promise<PaginatedApiResponse<Event[]>> {
    await this.authenticate();

    const { parsedFilter, parsedParams } = this.parseParamsAndFilter(
      params || {}
    );

    const response = await fetch(
      `${this.endpoint}/ea/events/filter/${parsedParams}`,
      {
        method: "POST",
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify(parsedFilter),
      }
    );

    const events = (await response.json()) as PaginatedApiResponse<Event[]>;
    return events;
  }

  /**
   * Returns a paginated list of events that match the params.
   * @see {@link https://developer-portal.cvent.com/documentation#tag/Events/operation/getEvents List Events doc}
   * for more information on the filter and params available values
   * @param eventId The id of the target event
   * @returns a list of {@link Event Events}
   */
  public async getEventById(
    eventId: string
  ): Promise<PaginatedApiResponse<Event[]>> {
    const filterQuery = `id eq "${eventId}"`;

    const events = await this.getEvents({ filter: filterQuery });

    return events;
  }

  /**
   * Returns a paginated list of Registration Types that match the params.
   * @see {@link https://developer-portal.cvent.com/documentation#tag/Events/operation/listRegistrationTypes List Registration Types doc} for more information on the params available values
   * @param eventId The id of the target event
   * @param params Either a {@link Params} object or a string
   */
  public async getRegistrationTypesByEventId(
    eventId: string,
    params?: Pick<Params, "limit" | "token">
  ): Promise<PaginatedApiResponse<RegistrationType[]>> {
    await this.authenticate();

    const { parsedParams } = this.parseParamsAndFilter(params || {});

    const response = await fetch(
      `${this.endpoint}/ea/events/${eventId}/registration-types/${parsedParams}`,
      {
        method: "GET",
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${this.accessToken}`,
        },
      }
    );

    const registrationTypes = (await response.json()) as PaginatedApiResponse<
      RegistrationType[]
    >;
    return registrationTypes;
  }

  /**
   * Returns a paginated list of Admission Items that match the params.
   * @see {@link https://developer-portal.cvent.com/documentation#tag/Events/operation/listAdmissionItemsPostFilters List Admission Items doc} for more information on the filter and params available values.
   * @param params Either a {@link Params} object or a string
   */
  public async getAdmissionItems(
    params?: Omit<Params, "locale" | "sort"> | string
  ): Promise<PaginatedApiResponse<AdmissionItem[]>> {
    await this.authenticate();

    const { parsedFilter, parsedParams } = this.parseParamsAndFilter(
      params || {}
    );

    const response = await fetch(
      `${this.endpoint}/ea/admission-items/filter/${parsedParams}`,
      {
        method: "POST",
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify(parsedFilter),
      }
    );

    const admissionItems = (await response.json()) as PaginatedApiResponse<
      AdmissionItem[]
    >;
    return admissionItems;
  }

  /**
   * Returns a paginated list of Admission Items that match the eventID and the params
   * @see {@link https://developer-portal.cvent.com/documentation#tag/Events/operation/listAdmissionItemsPostFilters List Admission Items doc} for more information on the filter and params available values.
   * @param eventId The id of the target event
   * @param params Either a {@link Params} object or a string
   */
  public async getAdmissionItemsByEventId(
    eventId: string,
    params?: Omit<Params, "locale" | "sort" | "filter">
  ): Promise<PaginatedApiResponse<AdmissionItem[]>> {
    const admissionItems = await this.getAdmissionItems({
      ...params,
      filter: `event.id eq "${eventId}"`,
    });
    return admissionItems;
  }

  /**
   * Returns a paginated list of Sessions that match the params.
   * @see {@link https://developer-portal.cvent.com/documentation#tag/Sessions/operation/listSessionsPostFilters List Sessions doc} for more information on the filter and params available values.
   * @param params Either a {@link Params} object or a string
   */
  public async getSessions(
    params?: Omit<Params, "sort"> | string
  ): Promise<PaginatedApiResponse<Session[]>> {
    await this.authenticate();

    const { parsedFilter, parsedParams } = this.parseParamsAndFilter(
      params || {}
    );

    const response = await fetch(
      `${this.endpoint}/ea/sessions/filter/${parsedParams}`,
      {
        method: "POST",
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify(parsedFilter),
      }
    );

    const sessions = (await response.json()) as PaginatedApiResponse<Session[]>;
    return sessions;
  }

  /**
   * Returns a paginated list of Sessions that match the eventId and the params.
   * @see {@link https://developer-portal.cvent.com/documentation#tag/Sessions/operation/listSessionsPostFilters List Sessions doc} for more information on the filter and params available values.
   * @param eventId The id of the target event
   * @param params Either a {@link Params} object or a string
   */
  public async getSessionsByEventId(
    eventId: string,
    params?: Omit<Params, "filter" | "sort">
  ): Promise<PaginatedApiResponse<Session[]>> {
    const sessions = this.getSessions({
      ...params,
      filter: `event.id eq "${eventId}"`,
    });
    return sessions;
  }

  /**
   * Returns a paginated list of Contacts.
   * @see {@link https://developer-portal.cvent.com/documentation#tag/Sessions/operation/listSessionsPostFilters List Sessions doc} for more information on the filter and params available values.
   * @param limit Count of contacts to show
   */
  public async getAllContacts(
    limit: number
  ): Promise<PaginatedApiResponse<Contact[]>> {
    const contacts = await this.getContacts({ limit });

    if (contacts.data.length === 0 || !contacts.data[0].id) {
      throw new Error(`contacts not found`);
    }

    return contacts;
  }

  /**
   * Returns a paginated list of Contacts.
   * @see {@link https://developer-portal.cvent.com/documentation#tag/Sessions/operation/listSessionsPostFilters List Sessions doc} for more information on the filter and params available values.
   * @param emailAddress Count of contacts to show
   */
  public async getContactsByEmail(
    emailAddress: string
  ): Promise<PaginatedApiResponse<Contact[]>> {
    const filterQuery = `email eq "${emailAddress}"`;

    const contacts = await this.getContacts({ filter: filterQuery });

    if (contacts.data.length === 0 || !contacts.data[0].id) {
      throw new Error(`contact not found`);
    }

    return contacts;
  }

  /**
   * Returns a paginated list of Contacts.
   * @see {@link https://developer-portal.cvent.com/documentation#tag/Sessions/operation/listSessionsPostFilters List Sessions doc} for more information on the filter and params available values.
   * @param id An ID of contact
   */
  public async getContactsByID(
    id: string
  ): Promise<PaginatedApiResponse<Contact[]>> {
    const filterQuery = `id eq "${id}"`;

    const contacts = await this.getContacts({ filter: filterQuery });

    console.log(contacts.data);

    if (contacts.data.length === 0 || !contacts.data[0].id) {
      throw new Error(`contact not found`);
    }

    return contacts;
  }

  /**
   * Returns a paginated list of Sessions that match the eventId and the params.
   * @see {@link https://developer-portal.cvent.com/documentation#tag/Sessions/operation/listSessionsPostFilters List Sessions doc} for more information on the filter and params available values.
   * @param eventId The id of the target event
   * @param emailAddress The email of contact
   */
  public async getAttendeesByEmailAndEventId(
    emailAddress: string,
    eventId: string
  ): Promise<PaginatedApiResponse<Attendee[]>> {
    const filterQuery = `contact.email eq "${emailAddress}" AND event.id eq "${eventId}"`;

    const attendees = await this.getAttendees({ filter: filterQuery });

    if (attendees.data.length === 0 || !attendees.data[0].id) {
      throw new Error(`Attendee not found: ${emailAddress}`);
    }

    return attendees;
  }

  /**
   * Returns a paginated list of Sessions that match the eventId and the params.
   * @see {@link https://developer-portal.cvent.com/documentation#tag/Sessions/operation/listSessionsPostFilters List Sessions doc} for more information on the filter and params available values.
   * @param eventId The id of the target event
   * @param contactId The id of contact
   */
  public async getAttendeesByEventIdAndContactId(
    eventId: string,
    contactId: string
  ): Promise<PaginatedApiResponse<Attendee[]>> {
    const filterQuery = `event.id eq "${eventId}" AND contact.id eq "${contactId}"`;

    const attendees = await this.getAttendees({ filter: filterQuery });

    if (attendees.data.length === 0 || !attendees.data[0].id) {
      throw new Error(`Attendee not found: ${contactId}`);
    }

    return attendees;
  }

  private async getAttendees(
    params?: Params | string
  ): Promise<PaginatedApiResponse<Attendee[]>> {
    await this.authenticate();

    const { parsedFilter, parsedParams } = this.parseParamsAndFilter(
      params || {}
    );

    const response = await fetch(
      `${this.endpoint}/ea/attendees/filter/${parsedParams}`,
      {
        method: "POST",
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify(parsedFilter),
      }
    );

    return (await response.json()) as PaginatedApiResponse<Attendee[]>;
  }

  private async getContacts(
    params?: Params | string
  ): Promise<PaginatedApiResponse<Contact[]>> {
    await this.authenticate();

    const { parsedFilter, parsedParams } = this.parseParamsAndFilter(
      params || {}
    );

    const response = await fetch(
      `${this.endpoint}/ea/contacts/filter/${parsedParams}`,
      {
        method: "POST",
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify(parsedFilter),
      }
    );

    return (await response.json()) as PaginatedApiResponse<Contact[]>;
  }

  private parseParamsAndFilter(params: Params | string) {
    if (typeof params === "string") {
      const urlSearchParams = new URLSearchParams(params);
      const filter = urlSearchParams.get("filter");
      urlSearchParams.delete("filter");

      return {
        parsedFilter: filter ? { filter: filter } : {},
        parsedParams: parseParams(urlSearchParams.toString()),
      };
    }

    const { filter, ...rest } = params;

    return {
      parsedFilter: filter ? { filter } : {},
      parsedParams: parseParams(rest),
    };
  }

  private isValidConnection(): boolean {
    if (!this.accessToken || this.tokenExpirationTime === 0) {
      return false;
    }

    const currentTime = new Date().getTime();
    return currentTime < this.tokenExpirationTime - TOKEN_EXPIRATION_PADDING;
  }

  private parseScopes(scopes: OAuthScopes[]) {
    return scopes.join(" ");
  }
}
