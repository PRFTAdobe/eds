export async function fetchAPI(
  url,
  { page, pageSize, params = {} } = {}
) {
  const query = new URLSearchParams();

  if (page !== undefined) query.set('page', page);
  if (pageSize !== undefined) query.set('pageSize', pageSize);

  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) {
      query.set(k, v);
    }
  }

  const fullUrl = query.toString()
    ? `${url}?${query.toString()}`
    : url;

  const res = await fetch(fullUrl, {
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`fetchAPI failed: ${res.status} ${res.statusText}`);
  }

  return await res.json();
}
