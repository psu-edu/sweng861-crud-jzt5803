'use client';

/**
 * Centralized API client for all frontend HTTP requests.
 * - Automatically attaches JWT Bearer token from localStorage
 * - Handles 401 Unauthorized (clears token, redirects to /login)
 * - Handles 403 Forbidden (throws typed error for components to display)
 */

class ForbiddenError extends Error {
  constructor(message = 'You do not have permission to access this resource.') {
    super(message);
    this.name = 'ForbiddenError';
    this.status = 403;
  }
}

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('jwt');
}

function clearTokenAndRedirect() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('jwt');
  window.location.href = '/login';
}

function getJwtUser() {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return { username: payload.username, role: payload.role };
  } catch {
    return null;
  }
}

async function request(url, options = {}) {
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, { ...options, headers });

  if (res.status === 401) {
    clearTokenAndRedirect();
    return null;
  }

  if (res.status === 403) {
    const data = await res.json().catch(() => ({}));
    throw new ForbiddenError(data.message || data.error || undefined);
  }

  return res;
}

async function apiGet(url) {
  return request(url, { method: 'GET' });
}

async function apiPost(url, body) {
  return request(url, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

async function apiPut(url, body) {
  return request(url, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

async function apiDelete(url) {
  return request(url, { method: 'DELETE' });
}

export {
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
  getToken,
  getJwtUser,
  ForbiddenError,
};
