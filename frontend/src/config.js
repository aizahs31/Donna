// Backend base URL. Override with VITE_API_URL (e.g. http://localhost:3000 for local dev).
export const API_URL = (import.meta.env.VITE_API_URL || 'https://donna-1677.onrender.com').replace(/\/$/, '');

// Browser's IANA timezone, sent to the backend so events land at the right local time.
export const USER_TIME_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
