/**
 * api.ts — All backend API calls in one place.
 * Uses relative /api path — Vite dev proxy forwards to localhost:8081.
 * In production, set VITE_API_URL to the deployed backend URL.
 */

const BASE = import.meta.env.VITE_API_URL ?? '/api';

// ── Helpers ──────────────────────────────────────────────────────────────────

function adminHeaders(): HeadersInit {
  const token = sessionStorage.getItem('admin_jwt');
  return token
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    : { 'Content-Type': 'application/json' };
}

function userHeaders(): HeadersInit {
  const token = localStorage.getItem('user_jwt');
  return token
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    : { 'Content-Type': 'application/json' };
}

function userAuthHeader(): string | null {
  const token = localStorage.getItem('user_jwt');
  return token ? `Bearer ${token}` : null;
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

// ── User Auth ─────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  profilePhotoBase64: string;
  profileSetupComplete: boolean;
}

export async function apiUserSendOtp(email: string): Promise<{ status: string; message: string }> {
  const res = await fetch(`${BASE}/user/otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  return handle<{ status: string; message: string }>(res);
}

export async function apiUserLogin(email: string, otp: string): Promise<UserProfile & { token: string }> {
  const res = await fetch(`${BASE}/user/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp }),
  });
  return handle<UserProfile & { token: string }>(res);
}

export async function apiGetUserProfile(): Promise<UserProfile> {
  const res = await fetch(`${BASE}/user/profile`, { headers: userHeaders() });
  return handle<UserProfile>(res);
}

export async function apiUpdateUserProfile(displayName: string): Promise<UserProfile> {
  const res = await fetch(`${BASE}/user/profile`, {
    method: 'PUT',
    headers: userHeaders(),
    body: JSON.stringify({ displayName }),
  });
  return handle<UserProfile>(res);
}

export async function apiUpdateProfilePhoto(base64Photo: string): Promise<UserProfile> {
  const res = await fetch(`${BASE}/user/profile/photo`, {
    method: 'PUT',
    headers: userHeaders(),
    body: JSON.stringify({ base64Photo }),
  });
  return handle<UserProfile>(res);
}

export async function apiSkipProfileSetup(): Promise<UserProfile> {
  const res = await fetch(`${BASE}/user/profile/skip`, {
    method: 'POST',
    headers: userHeaders(),
  });
  return handle<UserProfile>(res);
}

// ── Blogs (public) ─────────────────────────────────────────────────────────────

export interface ApiBlog {
  id: string;
  title: string;
  content: string; // JSON string of ContentBlock[]
  createdAt: string;
  updatedAt: string;
  authorSubscriberId: string | null;
  viewCount: number;
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
    headers: adminHeaders(),
    body: JSON.stringify({ title, content, notifySubscribers: notify }),
  });
  return handle<ApiBlog>(res);
}

export async function apiUpdateBlog(id: string, title: string, content: string): Promise<ApiBlog> {
  const res = await fetch(`${BASE}/blogs/${id}`, {
    method: 'PUT',
    headers: adminHeaders(),
    body: JSON.stringify({ title, content }),
  });
  return handle<ApiBlog>(res);
}

export async function apiDeleteBlog(id: string): Promise<void> {
  const res = await fetch(`${BASE}/blogs/${id}`, {
    method: 'DELETE',
    headers: adminHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete blog');
}

// ── Blog Interactions ─────────────────────────────────────────────────────────

export async function apiToggleLike(blogId: string): Promise<{ liked: boolean; likeCount: number }> {
  const res = await fetch(`${BASE}/blogs/${blogId}/like`, {
    method: 'POST',
    headers: userHeaders(),
  });
  return handle<{ liked: boolean; likeCount: number }>(res);
}

export async function apiIncrementView(blogId: string): Promise<{ viewCount: number }> {
  const res = await fetch(`${BASE}/blogs/${blogId}/view`, { method: 'POST' });
  return handle<{ viewCount: number }>(res);
}

export async function apiGetBlogStats(blogId: string): Promise<{ likeCount: number; viewCount: number; likedByMe: boolean }> {
  const authHeader = userAuthHeader();
  const headers: HeadersInit = authHeader
    ? { Authorization: authHeader }
    : {};
  const res = await fetch(`${BASE}/blogs/${blogId}/stats`, { headers });
  return handle<{ likeCount: number; viewCount: number; likedByMe: boolean }>(res);
}

// ── Comments ──────────────────────────────────────────────────────────────────

export interface ApiComment {
  id: string;
  blogId: string;
  subscriberId: string;
  authorName: string;
  authorPhoto: string;
  content: string;
  likeCount: number;
  likedByMe: boolean;
  createdAt: string;
  parentCommentId: string | null;
  replies: ApiComment[];
}

export async function apiGetComments(blogId: string): Promise<ApiComment[]> {
  const authHeader = userAuthHeader();
  const headers: HeadersInit = authHeader ? { Authorization: authHeader } : {};
  const res = await fetch(`${BASE}/blogs/${blogId}/comments`, { headers });
  return handle<ApiComment[]>(res);
}

export async function apiAddComment(blogId: string, content: string): Promise<ApiComment> {
  const res = await fetch(`${BASE}/blogs/${blogId}/comments`, {
    method: 'POST',
    headers: userHeaders(),
    body: JSON.stringify({ content }),
  });
  return handle<ApiComment>(res);
}

export async function apiAddReply(blogId: string, commentId: string, content: string): Promise<ApiComment> {
  const res = await fetch(`${BASE}/blogs/${blogId}/comments/${commentId}/reply`, {
    method: 'POST',
    headers: userHeaders(),
    body: JSON.stringify({ content }),
  });
  return handle<ApiComment>(res);
}

export async function apiDeleteComment(blogId: string, commentId: string): Promise<void> {
  const res = await fetch(`${BASE}/blogs/${blogId}/comments/${commentId}`, {
    method: 'DELETE',
    headers: userHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete comment');
}

export async function apiToggleCommentLike(blogId: string, commentId: string): Promise<{ liked: boolean; likeCount: number }> {
  const res = await fetch(`${BASE}/blogs/${blogId}/comments/${commentId}/like`, {
    method: 'POST',
    headers: userHeaders(),
  });
  return handle<{ liked: boolean; likeCount: number }>(res);
}

// ── User Blog Requests ────────────────────────────────────────────────────────

export interface ApiUserBlogRequest {
  id: string;
  title: string;
  content: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedAt: string;
  reviewedAt: string | null;
  publishedBlogId: string | null;
  commentCount: number;
  authorName?: string;
  authorEmail?: string;
  authorPhoto?: string;
}

export async function apiSubmitBlog(title: string, content: string): Promise<ApiUserBlogRequest> {
  const res = await fetch(`${BASE}/user/blogs`, {
    method: 'POST',
    headers: userHeaders(),
    body: JSON.stringify({ title, content }),
  });
  return handle<ApiUserBlogRequest>(res);
}

export async function apiGetMyBlogs(): Promise<ApiUserBlogRequest[]> {
  const res = await fetch(`${BASE}/user/blogs`, { headers: userHeaders() });
  return handle<ApiUserBlogRequest[]>(res);
}

export async function apiUpdateMyBlog(id: string, title: string, content: string): Promise<ApiUserBlogRequest> {
  const res = await fetch(`${BASE}/user/blogs/${id}`, {
    method: 'PUT',
    headers: userHeaders(),
    body: JSON.stringify({ title, content }),
  });
  return handle<ApiUserBlogRequest>(res);
}

export async function apiDeleteMyBlog(id: string): Promise<void> {
  const res = await fetch(`${BASE}/user/blogs/${id}`, {
    method: 'DELETE',
    headers: userHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete submission');
}

// ── Admin Blog Requests ───────────────────────────────────────────────────────

export async function apiAdminGetRequests(): Promise<ApiUserBlogRequest[]> {
  const res = await fetch(`${BASE}/admin/requests`, { headers: adminHeaders() });
  return handle<ApiUserBlogRequest[]>(res);
}

export async function apiAdminApproveBlog(id: string, notifyAll: boolean): Promise<{ blogId: string }> {
  const res = await fetch(`${BASE}/admin/requests/${id}/approve`, {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify({ notifyAll }),
  });
  return handle<{ blogId: string }>(res);
}

export async function apiAdminRejectBlog(id: string): Promise<void> {
  const res = await fetch(`${BASE}/admin/requests/${id}/reject`, {
    method: 'POST',
    headers: adminHeaders(),
  });
  if (!res.ok) throw new Error('Failed to reject');
}

// ── Notifications ─────────────────────────────────────────────────────────────

export interface ApiNotification {
  id: string;
  type: string;
  message: string;
  relatedBlogId: string | null;
  relatedCommentId: string | null;
  read: boolean;
  createdAt: string;
}

export async function apiGetNotifications(): Promise<{ notifications: ApiNotification[]; unreadCount: number }> {
  const res = await fetch(`${BASE}/user/notifications`, { headers: userHeaders() });
  return handle<{ notifications: ApiNotification[]; unreadCount: number }>(res);
}

export async function apiGetUnreadCount(): Promise<number> {
  const res = await fetch(`${BASE}/user/notifications/count`, { headers: userHeaders() });
  const data = await handle<{ unreadCount: number }>(res);
  return data.unreadCount;
}

export async function apiMarkNotificationRead(id: string): Promise<void> {
  const res = await fetch(`${BASE}/user/notifications/${id}/read`, {
    method: 'PATCH',
    headers: userHeaders(),
  });
  if (!res.ok) throw new Error('Failed to mark as read');
}

export async function apiMarkAllNotificationsRead(): Promise<void> {
  const res = await fetch(`${BASE}/user/notifications/read-all`, {
    method: 'PATCH',
    headers: userHeaders(),
  });
  if (!res.ok) throw new Error('Failed to mark all as read');
}

export async function apiDeleteNotification(id: string): Promise<void> {
  const res = await fetch(`${BASE}/user/notifications/${id}`, {
    method: 'DELETE',
    headers: userHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete notification');
}

export async function apiDeleteAllNotifications(): Promise<void> {
  const res = await fetch(`${BASE}/user/notifications`, {
    method: 'DELETE',
    headers: userHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete all notifications');
}

// ── Help & Feedback ───────────────────────────────────────────────────────────

export async function apiSendHelp(message: string): Promise<void> {
  const res = await fetch(`${BASE}/user/help`, {
    method: 'POST',
    headers: userHeaders(),
    body: JSON.stringify({ message }),
  });
  if (!res.ok) throw new Error('Failed to send help message');
}

// ── Subscribers (admin) ───────────────────────────────────────────────────────

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
  const res = await fetch(`${BASE}/subscribers`, { headers: adminHeaders() });
  return handle<ApiSubscriber[]>(res);
}

export async function apiDeleteSubscriber(id: string): Promise<void> {
  const res = await fetch(`${BASE}/subscribers/${id}`, {
    method: 'DELETE',
    headers: adminHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete subscriber');
}

export async function apiDeleteSubscribersBulk(ids: string[]): Promise<void> {
  const res = await fetch(`${BASE}/subscribers/bulk`, {
    method: 'DELETE',
    headers: adminHeaders(),
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
    headers: adminHeaders(),
    body: JSON.stringify({ subject, body, recipients: recipients ?? [] }),
  });
  if (!res.ok) throw new Error('Failed to send newsletter');
}

export async function apiGetMessageLogs(): Promise<ApiMessageLog[]> {
  const res = await fetch(`${BASE}/subscribers/messages`, { headers: adminHeaders() });
  return handle<ApiMessageLog[]>(res);
}
