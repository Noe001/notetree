import {
  sanitizeHtml,
  validators,
  validateURL,
  generateCSPHeader,
  filterXSS,
  checkPasswordStrength,
  sanitizeInput,
  detectXSS,
  detectSQLInjection,
  validateSessionToken,
  validatePasswordStrength,
  generateCSRFToken,
  validateCSRFToken,
  rateLimiter,
  generateSecureRandomString,
  validateFileUpload,
  getSecurityHeaders
} from '../security';

describe('security utilities', () => {
  test('sanitizeHtml removes unsafe tags', () => {
    const dirty = '<p>ok</p><script>alert(1)</script>';
    expect(sanitizeHtml(dirty)).toBe('<p>ok</p>');
  });

  test('validators.email', () => {
    expect(validators.email('test@example.com').valid).toBe(true);
    expect(validators.email('bad').valid).toBe(false);
    expect(validators.email('a'.repeat(255)+'@a.com').valid).toBe(false);
  });

  test('validators.textLength', () => {
    expect(validators.textLength('abc', 2, 4).valid).toBe(true);
    expect(validators.textLength('a', 2, 4).valid).toBe(false);
    expect(validators.textLength('aaaaa', 2, 4).valid).toBe(false);
  });

  test('validators.tag', () => {
    expect(validators.tag('tag').valid).toBe(true);
    expect(validators.tag('').valid).toBe(false);
    expect(validators.tag('x'.repeat(51)).valid).toBe(false);
    expect(validators.tag('<bad>').valid).toBe(false);
  });

  test('validators.noInjection', () => {
    expect(validators.noInjection('SELECT * FROM users').valid).toBe(false);
    expect(validators.noInjection('safe').valid).toBe(true);
  });

  test('validators.fileName', () => {
    expect(validators.fileName('file.txt').valid).toBe(true);
    expect(validators.fileName('').valid).toBe(false);
    expect(validators.fileName('bad?name').valid).toBe(false);
  });

  test('validators.password', () => {
    expect(validators.password('12345').valid).toBe(false);
    expect(validators.password('123456').valid).toBe(true);
    expect(validators.password('a'.repeat(129)).valid).toBe(false);
  });

  test('validators.username', () => {
    expect(validators.username('user_name').valid).toBe(true);
    expect(validators.username('').valid).toBe(false);
    expect(validators.username('a').valid).toBe(false);
    expect(validators.username('user!').valid).toBe(false);
    expect(validators.username('ab___c').valid).toBe(false);
  });

  test('validateURL enforces https and external', () => {
    expect(validateURL('https://example.com').valid).toBe(true);
    expect(validateURL('http://example.com').valid).toBe(false);
    expect(validateURL('https://localhost').valid).toBe(false);
    expect(validateURL('notaurl').valid).toBe(false);
  });

  test('generateCSPHeader returns policy string', () => {
    const header = generateCSPHeader();
    expect(header).toContain("default-src 'self'");
  });

  test('filterXSS strips dangerous content', () => {
    const result = filterXSS('<img src="javascript:alert(1)" onerror="do()">');
    expect(result).not.toMatch(/<|javascript:|onerror/);
  });

  test('checkPasswordStrength evaluates password', () => {
    const weak = checkPasswordStrength('abc');
    expect(weak.isValid).toBe(false);
    const strong = checkPasswordStrength('Aa1!aaaa');
    expect(strong.isValid).toBe(true);
  });

  test('sanitizeInput escapes HTML entities', () => {
    expect(sanitizeInput('<div>')).toBe('&lt;div&gt;');
    expect(sanitizeInput((null as unknown) as any)).toBe('');
  });

  test('detectXSS and detectSQLInjection', () => {
    expect(detectXSS('<script>alert(1)</script>')).toBe(true);
    expect(detectXSS('safe')).toBe(false);
    expect(detectSQLInjection('SELECT * FROM users')).toBe(true);
    expect(detectSQLInjection('hello')).toBe(false);
  });

  test('validateSessionToken and validatePasswordStrength', () => {
    const token = 'a.b.c';
    expect(validateSessionToken(token)).toBe(true);
    expect(validateSessionToken('bad token')).toBe(false);
    const strong = validatePasswordStrength('Aa1!aaaa');
    expect(strong.isValid).toBe(true);
    const weak = validatePasswordStrength('short');
    expect(weak.isValid).toBe(false);
  });

  test('generate and validate CSRF token', () => {
    const token = generateCSRFToken();
    expect(token).toHaveLength(64);
    expect(validateCSRFToken(token, token)).toBe(true);
    expect(validateCSRFToken(token, 'other')).toBe(false);
  });

  test('rate limiter and secure random string', () => {
    const limiter = new (rateLimiter.constructor as any)(2, 1000);
    expect(limiter.isAllowed('id')).toBe(true);
    expect(limiter.isAllowed('id')).toBe(true);
    expect(limiter.isAllowed('id')).toBe(false);
    const rand = generateSecureRandomString(10);
    expect(rand).toHaveLength(10);
  });

  test('validate file upload and headers', () => {
    const file = new File(['hi'], 'test.txt', { type: 'text/plain' });
    expect(validateFileUpload(file).isValid).toBe(true);
    const bigFile = new File([new Uint8Array(11 * 1024 * 1024)], 'big.png', { type: 'image/png' });
    expect(validateFileUpload(bigFile).isValid).toBe(false);
    const badType = new File(['hi'], 'bad.exe', { type: 'application/x-msdownload' });
    expect(validateFileUpload(badType).isValid).toBe(false);
    const headers = getSecurityHeaders();
    expect(headers['X-Frame-Options']).toBe('DENY');
  });
});
