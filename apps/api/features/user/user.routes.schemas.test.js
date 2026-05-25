import test from 'node:test';
import assert from 'node:assert';
import { createUserRouteSchema } from './user.routes.schemas.js';

test('createUserRouteSchema validation', async (t) => {
  await t.test('should validate valid user payload with rif (only digits)', () => {
    const payload = {
      nombre: 'John Doe',
      email: 'john@example.com',
      password: 'Password1',
      razon_social: 'Johns Tech LLC',
      rif: '123456789',
    };
    const result = createUserRouteSchema.body.safeParse(payload);
    assert.strictEqual(result.success, true);
  });

  await t.test('should fail when rif contains letters or characters', () => {
    const payload = {
      nombre: 'John Doe',
      email: 'john@example.com',
      password: 'Password1',
      razon_social: 'Johns Tech LLC',
      rif: 'J-12345678-9',
    };
    const result = createUserRouteSchema.body.safeParse(payload);
    assert.strictEqual(result.success, false);
    if (!result.success) {
      const rifError = result.error.errors.find(e => e.path.includes('rif'));
      assert.ok(rifError);
      assert.strictEqual(rifError.message, 'El RIF debe tener exactamente 9 números');
    }
  });

  await t.test('should fail when rif has less than 9 digits', () => {
    const payload = {
      nombre: 'John Doe',
      email: 'john@example.com',
      password: 'Password1',
      razon_social: 'Johns Tech LLC',
      rif: '12345',
    };
    const result = createUserRouteSchema.body.safeParse(payload);
    assert.strictEqual(result.success, false);
    if (!result.success) {
      const rifError = result.error.errors.find(e => e.path.includes('rif'));
      assert.ok(rifError);
      assert.strictEqual(rifError.message, 'El RIF debe tener exactamente 9 números');
    }
  });

  await t.test('should fail when rif has more than 9 digits', () => {
    const payload = {
      nombre: 'John Doe',
      email: 'john@example.com',
      password: 'Password1',
      razon_social: 'Johns Tech LLC',
      rif: '1234567890',
    };
    const result = createUserRouteSchema.body.safeParse(payload);
    assert.strictEqual(result.success, false);
    if (!result.success) {
      const rifError = result.error.errors.find(e => e.path.includes('rif'));
      assert.ok(rifError);
      assert.strictEqual(rifError.message, 'El RIF debe tener exactamente 9 números');
    }
  });

  await t.test('should validate valid user payload without rif (empty string)', () => {
    const payload = {
      nombre: 'John Doe',
      email: 'john@example.com',
      password: 'Password1',
      razon_social: 'Johns Tech LLC',
      rif: '',
    };
    const result = createUserRouteSchema.body.safeParse(payload);
    assert.strictEqual(result.success, true);
  });

  await t.test('should validate valid user payload without rif (undefined)', () => {
    const payload = {
      nombre: 'John Doe',
      email: 'john@example.com',
      password: 'Password1',
      razon_social: 'Johns Tech LLC',
    };
    const result = createUserRouteSchema.body.safeParse(payload);
    assert.strictEqual(result.success, true);
  });

  await t.test('should fail when email is invalid', () => {
    const payload = {
      nombre: 'John Doe',
      email: 'invalid-email',
      password: 'Password1',
      razon_social: 'Johns Tech LLC',
      rif: '',
    };
    const result = createUserRouteSchema.body.safeParse(payload);
    assert.strictEqual(result.success, false);
    if (!result.success) {
      const emailError = result.error.errors.find(e => e.path.includes('email'));
      assert.ok(emailError);
      assert.strictEqual(emailError.message, 'Tiene que ser un email válido');
    }
  });

  await t.test('should fail when password does not meet requirements (needs uppercase, lowercase, digit, min 8 chars)', () => {
    const payload = {
      nombre: 'John Doe',
      email: 'john@example.com',
      password: 'simple',
      razon_social: 'Johns Tech LLC',
      rif: '',
    };
    const result = createUserRouteSchema.body.safeParse(payload);
    assert.strictEqual(result.success, false);
    if (!result.success) {
      const pwdError = result.error.errors.find(e => e.path.includes('password'));
      assert.ok(pwdError);
      assert.strictEqual(pwdError.message, 'Recuerda cumplir los requerimientos de la contraseña');
    }
  });

  await t.test('should fail when nombre is too short', () => {
    const payload = {
      nombre: 'J',
      email: 'john@example.com',
      password: 'Password1',
      razon_social: 'Johns Tech LLC',
      rif: '',
    };
    const result = createUserRouteSchema.body.safeParse(payload);
    assert.strictEqual(result.success, false);
    if (!result.success) {
      const nameError = result.error.errors.find(e => e.path.includes('nombre'));
      assert.ok(nameError);
      assert.strictEqual(nameError.message, 'El nombre debe tener al menos 2 caracteres');
    }
  });

  await t.test('should fail when nombre contains invalid characters like numbers or symbols', () => {
    const payload = {
      nombre: 'John Doe 123',
      email: 'john@example.com',
      password: 'Password1',
      razon_social: 'Johns Tech LLC',
      rif: '',
    };
    const result = createUserRouteSchema.body.safeParse(payload);
    assert.strictEqual(result.success, false);
    if (!result.success) {
      const nameError = result.error.errors.find(e => e.path.includes('nombre'));
      assert.ok(nameError);
      assert.strictEqual(nameError.message, 'El nombre solo debe contener letras y espacios');
    }
  });
});
