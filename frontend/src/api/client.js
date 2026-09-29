const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const getToken = () => localStorage.getItem('token');
export const setToken = (token) => localStorage.setItem('token', token);
export const removeToken = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    ...(options.headers || {})
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // If not FormData, set Content-Type to JSON
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const url = `${BASE_URL}${endpoint}`;
  try {
    const response = await fetch(url, { ...options, headers });
    const contentType = response.headers.get('content-type');
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      let errorMsg = 'An error occurred';
      if (typeof data?.detail === 'string') {
        errorMsg = data.detail;
      } else if (Array.isArray(data?.detail)) {
        errorMsg = data.detail.map(d => d.msg || d.message || JSON.stringify(d)).join(', ');
      } else if (data?.message) {
        errorMsg = data.message;
      } else if (typeof data === 'string' && data.trim().length > 0) {
        try {
          const parsed = JSON.parse(data);
          if (typeof parsed?.detail === 'string') errorMsg = parsed.detail;
          else if (Array.isArray(parsed?.detail)) errorMsg = parsed.detail.map(d => d.msg || d.message).join(', ');
          else if (parsed?.message) errorMsg = parsed.message;
          else errorMsg = data;
        } catch {
          errorMsg = data;
        }
      } else if (response.statusText) {
        errorMsg = response.statusText;
      }
      throw new Error(errorMsg);
    }

    return data;
  } catch (err) {
    console.error(`API Error on ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  get: (endpoint) => request(endpoint, { method: 'GET' }),
  post: (endpoint, body) => request(endpoint, {
    method: 'POST',
    body: body instanceof FormData ? body : JSON.stringify(body)
  }),
  put: (endpoint, body) => request(endpoint, {
    method: 'PUT',
    body: body instanceof FormData ? body : JSON.stringify(body)
  }),
  delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
  upload: (endpoint, formData) => request(endpoint, {
    method: 'POST',
    body: formData
  })
};
