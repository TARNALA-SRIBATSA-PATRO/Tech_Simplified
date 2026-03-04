/**
 * api.ts — All backend API calls in one place.
 * Uses relative /api path — Vite dev proxy forwards to localhost:8081.
 * In production, set VITE_API_URL to the deployed backend URL.
 */

const BASE = import.meta.env.VITE_API_URL ?? '/api';


// ── Helpers ──────────────────────────────────────────────────────────────────

function authHeaders(): HeadersInit {
  const token = sessionStorage.getItem('admin_jwt');
  return token
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    : { 'Content-Type': 'application/json' };
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ── Admin Auth ────────────────────────────────────────────────────────────────

export async function apiRequestAdminOtp(): Promise<void> {
  const res = await fetch(`${BASE}/admin/otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to send OTP');
}

export async function apiVerifyAdminOtp(otp: string): Promise<string> {
  const res = await fetch(`${BASE}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ otp }),
  });
  const data = await handle<{ token: string; message: string }>(res);
  return data.token;
}

// ── Blogs ─────────────────────────────────────────────────────────────────────

export interface ApiBlog {
  id: string;
  title: string;
  content: string; // JSON string of ContentBlock[]
  createdAt: string;
  updatedAt: string;
}

export async function apiGetBlogs(): Promise<ApiBlog[]> {
  const res = await fetch(`${BASE}/blogs`);
  return handle<ApiBlog[]>(res);
}

export async function apiGetBlog(id: string): Promise<ApiBlog> {
  const res = await fetch(`${BASE}/blogs/${id}`);
  return handle<ApiBlog>(res);
}

export async function apiCreateBlog(title: string, content: string, notify = true): Promise<ApiBlog> {
  const res = await fetch(`${BASE}/blogs`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ title, content, notifySubscribers: notify }),
  });
  return handle<ApiBlog>(res);
}

export async function apiUpdateBlog(id: string, title: string, content: string): Promise<ApiBlog> {
  const res = await fetch(`${BASE}/blogs/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ title, content }),
  });
  return handle<ApiBlog>(res);
}

export async function apiDeleteBlog(id: string): Promise<void> {
  const res = await fetch(`${BASE}/blogs/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete blog');
}

// ── Subscribers ───────────────────────────────────────────────────────────────

export interface ApiSubscriber {
  id: string;
  email: string;
  verified: boolean;
  subscribedAt: string;
}

export interface ApiMessageLog {
  id: string;
  subject: string;
  bodyBlocks: string;
  sentAt: string;
  recipientCount: number;
  recipients: string; // comma-separated emails
}

export async function apiSubscribe(email: string): Promise<{ status: string }> {
  const res = await fetch(`${BASE}/subscribers/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  return handle<{ status: string }>(res);
}

export async function apiVerifySubscriberOtp(email: string, otp: string): Promise<{ verified: boolean }> {
  const res = await fetch(`${BASE}/subscribers/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp }),
  });
  return handle<{ verified: boolean }>(res);
}

export async function apiGetSubscribers(): Promise<ApiSubscriber[]> {
  const res = await fetch(`${BASE}/subscribers`, { headers: authHeaders() });
  return handle<ApiSubscriber[]>(res);
}

export async function apiDeleteSubscriber(id: string): Promise<void> {
  const res = await fetch(`${BASE}/subscribers/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete subscriber');
}

export async function apiDeleteSubscribersBulk(ids: string[]): Promise<void> {
  const res = await fetch(`${BASE}/subscribers/bulk`, {
    method: 'DELETE',
    headers: authHeaders(),
    body: JSON.stringify({ ids }),
  });
  if (!res.ok) throw new Error('Failed to delete subscribers');
}

export async function apiSendNewsletter(
  subject: string,
  body: string,
  recipients?: string[]
): Promise<void> {
  const res = await fetch(`${BASE}/subscribers/newsletter`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ subject, body, recipients: recipients ?? [] }),
  });
  if (!res.ok) throw new Error('Failed to send newsletter');
}

export async function apiGetMessageLogs(): Promise<ApiMessageLog[]> {
  const res = await fetch(`${BASE}/subscribers/messages`, { headers: authHeaders() });
  return handle<ApiMessageLog[]>(res);
}
