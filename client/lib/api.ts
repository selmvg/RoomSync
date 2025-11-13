const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function apiRequest(
  endpoint: string,
  options: RequestInit = {},
  token?: string | null
): Promise<Response> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response;
}

