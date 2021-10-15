/** Allowed methods for request */
export enum REQUEST_METHODS {
  "ALL" = "all",
  "GET" = "get",
  "PUT" = "put",
  "POST" = "post",
  "PATCH" = "patch",
  "DELETE" = "delete",
  "OPTIONS" = "options",
}
/** Initial request method */
export const INITIAL_METHOD = "ALL";
/** Initial fields in route, and then isn't allowd to change */
export const INITIAL_ROUTE_FIELDS = ["url", "method", "middlewares", "handler"];
