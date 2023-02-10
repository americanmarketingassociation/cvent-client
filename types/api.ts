export interface Paging {
  _links: {
    next?: {
      href: string;
    };
    self: {
      href: string;
    };
  };
  limit: number;
  totalCount: number;
  nextToken?: string;
  currentToken: string;
}

export interface PaginatedApiResponse<Data> {
  paging: Paging;
  data: Data;
}

export type ApiCreationResponse<Data> = Array<{
  status: number;
  message: string;
  data: Data;
}>;

interface ErrorDetails {
  code: string;
  message: string;
  target: string;
}

export interface ErrorResponse {
  code: string;
  message: string;
  details?: ErrorDetails[];
}

export enum SortTypes {
  ASC = "start:ASC",
  DESC = "start:DESC",
}

export type Params = {
  after?: string;
  before?: number;
  filter?: string;
  locale?: string;
  limit?: number;
  sort?: SortTypes;
  token?: string;
};
