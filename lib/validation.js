const VALID_CATEGORIES = [
  'enrollment',
  'facilities',
  'academic',
  'financial',
  'other',
];

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validateMetricCreate(body) {
  const errors = [];

  if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
    errors.push({ path: 'name', msg: 'Name is required' });
  } else if (body.name.trim().length > 255) {
    errors.push({ path: 'name', msg: 'Name must be at most 255 characters' });
  }

  if (!body.category || !VALID_CATEGORIES.includes(body.category)) {
    errors.push({ path: 'category', msg: 'Invalid category' });
  }

  if (
    body.value === undefined ||
    body.value === null ||
    isNaN(Number(body.value))
  ) {
    errors.push({ path: 'value', msg: 'Value must be a number' });
  }

  if (
    body.unit !== undefined &&
    typeof body.unit === 'string' &&
    body.unit.trim().length > 50
  ) {
    errors.push({ path: 'unit', msg: 'Unit must be at most 50 characters' });
  }

  if (
    body.description !== undefined &&
    typeof body.description === 'string' &&
    body.description.trim().length > 1000
  ) {
    errors.push({
      path: 'description',
      msg: 'Description must be at most 1000 characters',
    });
  }

  if (
    body.metadata !== undefined &&
    (typeof body.metadata !== 'object' ||
      Array.isArray(body.metadata) ||
      body.metadata === null)
  ) {
    errors.push({ path: 'metadata', msg: 'Metadata must be an object' });
  }

  if (body.recordedAt !== undefined) {
    const date = new Date(body.recordedAt);
    if (isNaN(date.getTime())) {
      errors.push({
        path: 'recordedAt',
        msg: 'recordedAt must be a valid ISO 8601 date',
      });
    }
  }

  return { isValid: errors.length === 0, errors };
}

function validateMetricUpdate(body, id) {
  const errors = [];

  if (!isValidUUID(id)) {
    errors.push({ path: 'id', msg: 'Invalid metric ID' });
  }

  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || body.name.trim() === '') {
      errors.push({ path: 'name', msg: 'Name cannot be empty' });
    } else if (body.name.trim().length > 255) {
      errors.push({ path: 'name', msg: 'Name must be at most 255 characters' });
    }
  }

  if (
    body.category !== undefined &&
    !VALID_CATEGORIES.includes(body.category)
  ) {
    errors.push({ path: 'category', msg: 'Invalid category' });
  }

  if (body.value !== undefined && isNaN(Number(body.value))) {
    errors.push({ path: 'value', msg: 'Value must be a number' });
  }

  if (
    body.unit !== undefined &&
    typeof body.unit === 'string' &&
    body.unit.trim().length > 50
  ) {
    errors.push({ path: 'unit', msg: 'Unit must be at most 50 characters' });
  }

  if (
    body.description !== undefined &&
    typeof body.description === 'string' &&
    body.description.trim().length > 1000
  ) {
    errors.push({
      path: 'description',
      msg: 'Description must be at most 1000 characters',
    });
  }

  if (
    body.metadata !== undefined &&
    (typeof body.metadata !== 'object' ||
      Array.isArray(body.metadata) ||
      body.metadata === null)
  ) {
    errors.push({ path: 'metadata', msg: 'Metadata must be an object' });
  }

  return { isValid: errors.length === 0, errors };
}

function isValidUUID(id) {
  return typeof id === 'string' && UUID_REGEX.test(id);
}

function validateWeatherCoords(searchParams) {
  const errors = [];
  const lat = searchParams.get('latitude');
  const lon = searchParams.get('longitude');

  if (lat === null || lat === '' || isNaN(Number(lat))) {
    errors.push({ path: 'latitude', msg: 'Latitude must be a valid number' });
  } else {
    const latNum = Number(lat);
    if (latNum < -90 || latNum > 90) {
      errors.push({
        path: 'latitude',
        msg: 'Latitude must be between -90 and 90',
      });
    }
  }

  if (lon === null || lon === '' || isNaN(Number(lon))) {
    errors.push({ path: 'longitude', msg: 'Longitude must be a valid number' });
  } else {
    const lonNum = Number(lon);
    if (lonNum < -180 || lonNum > 180) {
      errors.push({
        path: 'longitude',
        msg: 'Longitude must be between -180 and 180',
      });
    }
  }

  return { isValid: errors.length === 0, errors };
}

function validatePagination(searchParams) {
  const errors = [];
  const limit = searchParams.get('limit');
  const offset = searchParams.get('offset');

  if (limit !== null && limit !== '') {
    const limitNum = parseInt(limit, 10);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      errors.push({ path: 'limit', msg: 'Limit must be between 1 and 100' });
    }
  }

  if (offset !== null && offset !== '') {
    const offsetNum = parseInt(offset, 10);
    if (isNaN(offsetNum) || offsetNum < 0) {
      errors.push({ path: 'offset', msg: 'Offset must be non-negative' });
    }
  }

  return { isValid: errors.length === 0, errors };
}

module.exports = {
  validateMetricCreate,
  validateMetricUpdate,
  isValidUUID,
  validateWeatherCoords,
  validatePagination,
  VALID_CATEGORIES,
};
