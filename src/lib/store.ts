import { Blog, Subscriber } from './types';

const BLOGS_KEY = 'blog_app_blogs';
const SUBSCRIBERS_KEY = 'blog_app_subscribers';
const ADMIN_KEY = 'blog_app_admin';

// Demo admin password (in production, use proper auth via Cloud)
const ADMIN_PASSWORD = 'admin123';

export function getBlogs(): Blog[] {
  const data = localStorage.getItem(BLOGS_KEY);
  return data ? JSON.parse(data) : [];
}

export function getBlog(id: string): Blog | undefined {
  return getBlogs().find(b => b.id === id);
}

export function saveBlog(blog: Blog): void {
  const blogs = getBlogs();
  const idx = blogs.findIndex(b => b.id === blog.id);
  if (idx >= 0) {
    blogs[idx] = { ...blog, updated_at: new Date().toISOString() };
  } else {
    blogs.push(blog);
  }
  localStorage.setItem(BLOGS_KEY, JSON.stringify(blogs));
}

export function deleteBlog(id: string): void {
  const blogs = getBlogs().filter(b => b.id !== id);
  localStorage.setItem(BLOGS_KEY, JSON.stringify(blogs));
}

export function getSubscribers(): Subscriber[] {
  const data = localStorage.getItem(SUBSCRIBERS_KEY);
  return data ? JSON.parse(data) : [];
}

export function addSubscriber(sub: Subscriber): void {
  const subs = getSubscribers();
  subs.push(sub);
  localStorage.setItem(SUBSCRIBERS_KEY, JSON.stringify(subs));
}

export function verifySubscriber(email: string): void {
  const subs = getSubscribers().map(s =>
    s.email === email ? { ...s, is_verified: true } : s
  );
  localStorage.setItem(SUBSCRIBERS_KEY, JSON.stringify(subs));
}

export function deleteSubscriber(id: string): void {
  const subs = getSubscribers().filter(s => s.id !== id);
  localStorage.setItem(SUBSCRIBERS_KEY, JSON.stringify(subs));
}

export function isAdminLoggedIn(): boolean {
  return sessionStorage.getItem(ADMIN_KEY) === 'true';
}

export function adminLogin(password: string): boolean {
  if (password === ADMIN_PASSWORD) {
    sessionStorage.setItem(ADMIN_KEY, 'true');
    return true;
  }
  return false;
}

export function adminLogout(): void {
  sessionStorage.removeItem(ADMIN_KEY);
}
