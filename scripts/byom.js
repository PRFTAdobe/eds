/**
 * Fetches BYOM JSON.
 * Automatically caches and returns parsed JSON.
 */
const cache = new Map();


export async function fetchData(path) {
  if (!path.startsWith('/')) {
    throw new Error(`BYOM path must start with '/': ${path}`);
  }

  if (cache.has(path)) {
    return cache.get(path);
  }

  const url = window.location.origin + path;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`BYOM fetch failed (${response.status}) for ${path}`);
    }

    const data = await response.json();
    cache.set(path, data);
    return data;

  } catch (err) {
    console.error('BYOM fetch error:', err);
    return { data: [], error: err.message };
  }
}