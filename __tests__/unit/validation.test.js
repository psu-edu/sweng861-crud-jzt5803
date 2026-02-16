const {
  validateMetricCreate,
  validateMetricUpdate,
  isValidUUID,
  validateWeatherCoords,
  validatePagination,
  VALID_CATEGORIES,
} = require('@/lib/validation');

// ============================================
// isValidUUID
// ============================================
describe('isValidUUID', () => {
  it('accepts a valid v4 UUID', () => {
    expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
  });

  it('accepts uppercase UUIDs', () => {
    expect(isValidUUID('550E8400-E29B-41D4-A716-446655440000')).toBe(true);
  });

  it('rejects an empty string', () => {
    expect(isValidUUID('')).toBe(false);
  });

  it('rejects a non-string value', () => {
    expect(isValidUUID(123)).toBe(false);
    expect(isValidUUID(null)).toBe(false);
    expect(isValidUUID(undefined)).toBe(false);
  });

  it('rejects a malformed UUID (wrong length)', () => {
    expect(isValidUUID('550e8400-e29b-41d4-a716')).toBe(false);
  });

  it('rejects a UUID with invalid characters', () => {
    expect(isValidUUID('550e8400-e29b-41d4-a716-44665544000g')).toBe(false);
  });

  it('rejects a plain string', () => {
    expect(isValidUUID('not-a-uuid')).toBe(false);
  });
});

// ============================================
// VALID_CATEGORIES
// ============================================
describe('VALID_CATEGORIES', () => {
  it('contains exactly 5 categories', () => {
    expect(VALID_CATEGORIES).toHaveLength(5);
  });

  it('includes all expected categories', () => {
    expect(VALID_CATEGORIES).toEqual(
      expect.arrayContaining([
        'enrollment',
        'facilities',
        'academic',
        'financial',
        'other',
      ])
    );
  });
});

// ============================================
// validateMetricCreate
// ============================================
describe('validateMetricCreate', () => {
  const validMetric = {
    name: 'Test Metric',
    category: 'enrollment',
    value: 100,
  };

  it('accepts a valid metric with required fields only', () => {
    const result = validateMetricCreate(validMetric);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('accepts a valid metric with all optional fields', () => {
    const result = validateMetricCreate({
      ...validMetric,
      unit: 'students',
      description: 'A test description',
      metadata: { campus: 'Main' },
      recordedAt: '2025-01-01T00:00:00Z',
    });
    expect(result.isValid).toBe(true);
  });

  // Name validation
  it('rejects when name is missing', () => {
    const result = validateMetricCreate({ category: 'enrollment', value: 100 });
    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: 'name' })])
    );
  });

  it('rejects when name is an empty string', () => {
    const result = validateMetricCreate({ ...validMetric, name: '' });
    expect(result.isValid).toBe(false);
  });

  it('rejects when name is whitespace only', () => {
    const result = validateMetricCreate({ ...validMetric, name: '   ' });
    expect(result.isValid).toBe(false);
  });

  it('rejects when name exceeds 255 characters', () => {
    const result = validateMetricCreate({
      ...validMetric,
      name: 'a'.repeat(256),
    });
    expect(result.isValid).toBe(false);
    expect(result.errors[0].msg).toMatch(/255/);
  });

  it('accepts name at exactly 255 characters', () => {
    const result = validateMetricCreate({
      ...validMetric,
      name: 'a'.repeat(255),
    });
    expect(result.isValid).toBe(true);
  });

  // Category validation
  it('rejects invalid category', () => {
    const result = validateMetricCreate({
      ...validMetric,
      category: 'invalid',
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: 'category' })])
    );
  });

  it('rejects when category is missing', () => {
    const result = validateMetricCreate({ name: 'Test', value: 100 });
    expect(result.isValid).toBe(false);
  });

  it('accepts each valid category', () => {
    VALID_CATEGORIES.forEach((cat) => {
      const result = validateMetricCreate({ ...validMetric, category: cat });
      expect(result.isValid).toBe(true);
    });
  });

  // Value validation
  it('rejects when value is missing', () => {
    const result = validateMetricCreate({
      name: 'Test',
      category: 'enrollment',
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: 'value' })])
    );
  });

  it('rejects when value is NaN string', () => {
    const result = validateMetricCreate({ ...validMetric, value: 'abc' });
    expect(result.isValid).toBe(false);
  });

  it('accepts zero as a valid value', () => {
    const result = validateMetricCreate({ ...validMetric, value: 0 });
    expect(result.isValid).toBe(true);
  });

  it('accepts negative values', () => {
    const result = validateMetricCreate({ ...validMetric, value: -42 });
    expect(result.isValid).toBe(true);
  });

  it('accepts string numbers (coerced)', () => {
    const result = validateMetricCreate({ ...validMetric, value: '99.5' });
    expect(result.isValid).toBe(true);
  });

  // Unit validation
  it('rejects unit exceeding 50 characters', () => {
    const result = validateMetricCreate({
      ...validMetric,
      unit: 'a'.repeat(51),
    });
    expect(result.isValid).toBe(false);
    expect(result.errors[0].msg).toMatch(/50/);
  });

  it('accepts unit at exactly 50 characters', () => {
    const result = validateMetricCreate({
      ...validMetric,
      unit: 'a'.repeat(50),
    });
    expect(result.isValid).toBe(true);
  });

  // Description validation
  it('rejects description exceeding 1000 characters', () => {
    const result = validateMetricCreate({
      ...validMetric,
      description: 'a'.repeat(1001),
    });
    expect(result.isValid).toBe(false);
    expect(result.errors[0].msg).toMatch(/1000/);
  });

  // Metadata validation
  it('rejects metadata that is not an object', () => {
    const result = validateMetricCreate({ ...validMetric, metadata: 'string' });
    expect(result.isValid).toBe(false);
  });

  it('rejects metadata that is an array', () => {
    const result = validateMetricCreate({ ...validMetric, metadata: [1, 2] });
    expect(result.isValid).toBe(false);
  });

  it('rejects metadata that is null', () => {
    const result = validateMetricCreate({ ...validMetric, metadata: null });
    expect(result.isValid).toBe(false);
  });

  it('accepts metadata as a valid object', () => {
    const result = validateMetricCreate({
      ...validMetric,
      metadata: { key: 'value' },
    });
    expect(result.isValid).toBe(true);
  });

  // recordedAt validation
  it('rejects invalid date string for recordedAt', () => {
    const result = validateMetricCreate({
      ...validMetric,
      recordedAt: 'not-a-date',
    });
    expect(result.isValid).toBe(false);
    expect(result.errors[0].msg).toMatch(/ISO 8601/);
  });

  it('accepts a valid ISO date for recordedAt', () => {
    const result = validateMetricCreate({
      ...validMetric,
      recordedAt: '2025-06-15T12:00:00Z',
    });
    expect(result.isValid).toBe(true);
  });

  // Multiple errors
  it('returns multiple errors when several fields are invalid', () => {
    const result = validateMetricCreate({});
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
  });
});

// ============================================
// validateMetricUpdate
// ============================================
describe('validateMetricUpdate', () => {
  const validId = '550e8400-e29b-41d4-a716-446655440000';

  it('accepts an empty body with valid ID (all fields optional)', () => {
    const result = validateMetricUpdate({}, validId);
    expect(result.isValid).toBe(true);
  });

  it('rejects an invalid UUID for id', () => {
    const result = validateMetricUpdate({}, 'bad-id');
    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: 'id' })])
    );
  });

  it('rejects empty string name', () => {
    const result = validateMetricUpdate({ name: '' }, validId);
    expect(result.isValid).toBe(false);
  });

  it('rejects name exceeding 255 characters', () => {
    const result = validateMetricUpdate({ name: 'a'.repeat(256) }, validId);
    expect(result.isValid).toBe(false);
  });

  it('accepts a valid partial update', () => {
    const result = validateMetricUpdate({ value: 200 }, validId);
    expect(result.isValid).toBe(true);
  });

  it('rejects invalid category on update', () => {
    const result = validateMetricUpdate({ category: 'bogus' }, validId);
    expect(result.isValid).toBe(false);
  });

  it('rejects non-numeric value on update', () => {
    const result = validateMetricUpdate({ value: 'abc' }, validId);
    expect(result.isValid).toBe(false);
  });

  it('rejects unit exceeding 50 characters on update', () => {
    const result = validateMetricUpdate({ unit: 'x'.repeat(51) }, validId);
    expect(result.isValid).toBe(false);
  });

  it('rejects description exceeding 1000 characters on update', () => {
    const result = validateMetricUpdate(
      { description: 'x'.repeat(1001) },
      validId
    );
    expect(result.isValid).toBe(false);
  });

  it('rejects non-object metadata on update', () => {
    const result = validateMetricUpdate({ metadata: 'string' }, validId);
    expect(result.isValid).toBe(false);
  });
});

// ============================================
// validateWeatherCoords
// ============================================
describe('validateWeatherCoords', () => {
  function makeParams(lat, lon) {
    const params = new URLSearchParams();
    if (lat !== undefined) params.set('latitude', lat);
    if (lon !== undefined) params.set('longitude', lon);
    return params;
  }

  it('accepts valid coordinates', () => {
    const result = validateWeatherCoords(makeParams('40.7983', '-77.8599'));
    expect(result.isValid).toBe(true);
  });

  it('accepts boundary values (90, 180)', () => {
    const result = validateWeatherCoords(makeParams('90', '180'));
    expect(result.isValid).toBe(true);
  });

  it('accepts boundary values (-90, -180)', () => {
    const result = validateWeatherCoords(makeParams('-90', '-180'));
    expect(result.isValid).toBe(true);
  });

  it('rejects latitude > 90', () => {
    const result = validateWeatherCoords(makeParams('91', '0'));
    expect(result.isValid).toBe(false);
    expect(result.errors[0].path).toBe('latitude');
  });

  it('rejects latitude < -90', () => {
    const result = validateWeatherCoords(makeParams('-91', '0'));
    expect(result.isValid).toBe(false);
  });

  it('rejects longitude > 180', () => {
    const result = validateWeatherCoords(makeParams('0', '181'));
    expect(result.isValid).toBe(false);
    expect(result.errors[0].path).toBe('longitude');
  });

  it('rejects longitude < -180', () => {
    const result = validateWeatherCoords(makeParams('0', '-181'));
    expect(result.isValid).toBe(false);
  });

  it('rejects missing latitude', () => {
    const params = new URLSearchParams();
    params.set('longitude', '0');
    const result = validateWeatherCoords(params);
    expect(result.isValid).toBe(false);
  });

  it('rejects missing longitude', () => {
    const params = new URLSearchParams();
    params.set('latitude', '0');
    const result = validateWeatherCoords(params);
    expect(result.isValid).toBe(false);
  });

  it('rejects non-numeric latitude', () => {
    const result = validateWeatherCoords(makeParams('abc', '0'));
    expect(result.isValid).toBe(false);
  });

  it('rejects non-numeric longitude', () => {
    const result = validateWeatherCoords(makeParams('0', 'xyz'));
    expect(result.isValid).toBe(false);
  });

  it('rejects empty string latitude', () => {
    const result = validateWeatherCoords(makeParams('', '0'));
    expect(result.isValid).toBe(false);
  });

  it('returns multiple errors when both are invalid', () => {
    const result = validateWeatherCoords(makeParams('999', '999'));
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBe(2);
  });
});

// ============================================
// validatePagination
// ============================================
describe('validatePagination', () => {
  function makeParams(limit, offset) {
    const params = new URLSearchParams();
    if (limit !== undefined) params.set('limit', limit);
    if (offset !== undefined) params.set('offset', offset);
    return params;
  }

  it('accepts valid limit and offset', () => {
    const result = validatePagination(makeParams('20', '0'));
    expect(result.isValid).toBe(true);
  });

  it('accepts when neither limit nor offset are provided', () => {
    const result = validatePagination(new URLSearchParams());
    expect(result.isValid).toBe(true);
  });

  it('rejects limit less than 1', () => {
    const result = validatePagination(makeParams('0', '0'));
    expect(result.isValid).toBe(false);
    expect(result.errors[0].path).toBe('limit');
  });

  it('rejects limit greater than 100', () => {
    const result = validatePagination(makeParams('101', '0'));
    expect(result.isValid).toBe(false);
  });

  it('rejects non-numeric limit', () => {
    const result = validatePagination(makeParams('abc', '0'));
    expect(result.isValid).toBe(false);
  });

  it('rejects negative offset', () => {
    const result = validatePagination(makeParams('10', '-1'));
    expect(result.isValid).toBe(false);
    expect(result.errors[0].path).toBe('offset');
  });

  it('rejects non-numeric offset', () => {
    const result = validatePagination(makeParams('10', 'abc'));
    expect(result.isValid).toBe(false);
  });

  it('accepts boundary: limit=1', () => {
    const result = validatePagination(makeParams('1', '0'));
    expect(result.isValid).toBe(true);
  });

  it('accepts boundary: limit=100', () => {
    const result = validatePagination(makeParams('100', '0'));
    expect(result.isValid).toBe(true);
  });

  it('accepts offset=0', () => {
    const result = validatePagination(makeParams('10', '0'));
    expect(result.isValid).toBe(true);
  });
});
