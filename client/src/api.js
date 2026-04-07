const BASE = '/api';

export class ApiError extends Error {
  constructor(message, { status, details } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    let payload = null;
    try {
      payload = await res.json();
    } catch {
      try {
        payload = { error: await res.text() };
      } catch {
        payload = null;
      }
    }

    const message =
      payload?.error ||
      (Array.isArray(payload?.errors) ? payload.errors.join(', ') : null) ||
      `API error ${res.status}`;

    throw new ApiError(message, { status: res.status, details: payload?.details || payload?.errors || null });
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  // Recipes
  getRecipes: () => request('/recipes'),
  createRecipe: (data) => request('/recipes', { method: 'POST', body: JSON.stringify(data) }),
  updateRecipe: (id, data) => request(`/recipes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRecipe: (id) => request(`/recipes/${id}`, { method: 'DELETE' }),

  // Stock
  getStock: () => request('/stock'),
  createStock: (data) => request('/stock', { method: 'POST', body: JSON.stringify(data) }),
  updateStock: (id, data) => request(`/stock/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteStock: (id) => request(`/stock/${id}`, { method: 'DELETE' }),

  // History
  getHistory: () => request('/history'),
  createHistory: (data) => request('/history', { method: 'POST', body: JSON.stringify(data) }),
  clearHistory: () => request('/history', { method: 'DELETE' }),
  deleteHistory: (id) => request(`/history/${id}`, { method: 'DELETE' }),

  // Mix
  createMix: (data) => request('/mix', { method: 'POST', body: JSON.stringify(data) }),
};
