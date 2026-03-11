function sanitizeString(value) {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function sanitizeStringArray(values) {
  if (!Array.isArray(values)) return [];
  return values
    .map(sanitizeString)
    .filter((value) => value !== undefined);
}

function sanitizeBoolean(value, defaultValue = false) {
  return typeof value === 'boolean' ? value : defaultValue;
}

function getBodyData(req) {
  if (!req || typeof req !== 'object') return {};
  if (!req.body || typeof req.body !== 'object') return {};
  if (!req.body.data || typeof req.body.data !== 'object') return {};
  return req.body.data;
}

function buildSelector(data) {
  const selector = {};
  const id = sanitizeString(data?.id);
  const name = sanitizeString(data?.name);
  const email = sanitizeString(data?.email);

  if (id) selector.id = id;
  if (name) selector.name = name;
  if (email) selector.email = email;

  return selector;
}

function hasSelector(selector) {
  return !!selector && Object.keys(selector).length > 0;
}

function maskPasswordFields(users) {
  const list = Array.isArray(users) ? users : [users];
  return list.map((user) => {
    if (!user || typeof user !== 'object') return user;
    return { ...user, password: '****************' };
  });
}

module.exports = {
  sanitizeString,
  sanitizeStringArray,
  sanitizeBoolean,
  getBodyData,
  buildSelector,
  hasSelector,
  maskPasswordFields,
};
