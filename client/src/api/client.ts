import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

/** Pull a human-readable message out of an axios/API error. */
export function apiErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: string } | undefined;
    if (data?.error) return data.error;
  }
  return 'Something went wrong. Please try again.';
}
