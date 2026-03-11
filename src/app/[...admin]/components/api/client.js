const MUTATING_METHODS = new Set(["POST", "PUT", "DELETE"]);

function getApiBaseUrl() {
  return `http://${location.host}`;
}

function safeParseJson(text) {
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

async function requestApi(path, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const headers = { "content-type": "application/json", ...(options.headers || {}) };
  const fetchOptions = { method, headers };

  if (options.body !== undefined) {
    fetchOptions.body = JSON.stringify(options.body);
  } else if (options.data !== undefined && MUTATING_METHODS.has(method)) {
    fetchOptions.body = JSON.stringify({ data: options.data });
  }

  let response;
  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, fetchOptions);
  } catch (err) {
    return { error: `Failed to access ${path} on ${method}!`, status: 0, details: err };
  }

  const rawText = await response.text();
  const parsed = safeParseJson(rawText);
  const payload = parsed !== undefined ? parsed : (rawText || {});

  if (!response.ok) {
    const message =
      (payload && typeof payload === "object" && payload.error) ?
        payload.error :
        `Request to ${path} failed with status ${response.status}`;
    return { error: message, status: response.status, data: payload };
  }

  return payload;
}

function isValidMutationVerb(verb) {
  return MUTATING_METHODS.has(String(verb || "").toUpperCase());
}

module.exports = { requestApi, isValidMutationVerb };
