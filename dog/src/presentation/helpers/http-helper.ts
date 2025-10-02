import { type HttpResponse } from '@/presentation/protocols'

export const ok = (data: unknown): HttpResponse => ({
  statusCode: 200,
  body: data
})

export const serverError = (error: Error): HttpResponse => ({
  statusCode: 500,
  body: { error: 'Internal Server Error', message: error.message, stack: error.stack }
})

export const badRequest = (error: Error): HttpResponse => ({
  statusCode: 400,
  body: { error: error.name, message: error.message }
})
