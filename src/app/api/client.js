function getApiBaseUrl() {
  return `http://${location.host}`;
}

async function parseResponse(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

async function requestApi(path, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const headers = { "content-type": "application/json", ...(options.headers || {}) };
  const fetchOptions = { method, headers };
  if (options.body !== undefined) {
    fetchOptions.body = JSON.stringify(options.body);
  }

  let response;
  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, fetchOptions);
  } catch (err) {
    return { error: `Failed to access ${path} on ${method}!`, status: 0, details: err };
  }

  const payload = await parseResponse(response);
  if (!response.ok) {
    return { error: payload.error || `Request failed with status ${response.status}`, status: response.status, data: payload };
  }

  return payload;
}

module.exports = { requestApi };
