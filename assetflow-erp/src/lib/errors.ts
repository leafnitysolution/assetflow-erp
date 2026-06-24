import { AxiosError } from "axios"

type ErrorBody = {
  message?: string
}

export function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof AxiosError) {
    return (error.response?.data as ErrorBody | undefined)?.message || fallback
  }
  return fallback
}
