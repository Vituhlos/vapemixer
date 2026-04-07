const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
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
  deleteHistory: (id) => request(`/history/${id}`, { method: 'DELETE' }),
};
