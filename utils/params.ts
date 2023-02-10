import { Params } from "../types";

/**
 * Returns a string with a list of parsed query params
 * @param params Either a string or an object with the query params. 
 * @returns a parsed string with the query params
 */
export function parseParams(params: Params | string): string {
  if(!params || !Object.keys(params).length) {
    return '';
  }

  //If it's a string it means it's already a parsed query params string
  if(typeof params === 'string'){
    return `?${params.replace('?', '')}`;
  }

  const parsedQueryParams = Object.entries(params).map(([key, value]) => `${key}=${value}`).join('&');
  return `?${parsedQueryParams}`;
}