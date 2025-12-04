const BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

export async function parseText(text) {
  const res = await fetch(`${BASE_URL}/parse`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ text })
  });
  return res.json();
}

export async function recommendByText(text) {
  const res = await fetch(`${BASE_URL}/recommend`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ text })
  });
  return res.json();
}

export async function recommendStructured(userObj) {
  const res = await fetch(`${BASE_URL}/recommend`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(userObj)
  });
  return res.json();
}

export async function getScheme(slug) {
  const res = await fetch(`${BASE_URL}/scheme/${encodeURIComponent(slug)}`);
  return res.json();
}
