export interface Controller<T = unknown> {
  handle: (request: T) => Promise<HttpResponse>
}

export type HttpResponse = {
  statusCode: number
  body: unknown
}
