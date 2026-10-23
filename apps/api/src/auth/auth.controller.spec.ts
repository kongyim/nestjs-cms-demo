import type { Request, Response } from 'express';
import { AuthController } from './auth.controller';
import { AuthService, cookieName } from './auth.service';

describe('admin session cookie prefix', () => {
  const original = process.env.ADMIN_BASE_PATH;
  afterEach(() => {
    if (original === undefined) delete process.env.ADMIN_BASE_PATH;
    else process.env.ADMIN_BASE_PATH = original;
  });

  it.each([
    [undefined, '/admin/api'],
    ['/cms/', '/cms/api'],
    ['/tools/cms', '/tools/cms/api'],
    ['', '/api'],
  ])('uses %s consistently for login and logout', async (prefix, path) => {
    if (prefix === undefined) delete process.env.ADMIN_BASE_PATH;
    else process.env.ADMIN_BASE_PATH = prefix;
    const auth = {
      login: jest.fn().mockResolvedValue('token'),
      logout: jest.fn().mockResolvedValue(undefined),
      authenticate: jest.fn().mockResolvedValue({ id: 'user' }),
    };
    const response = { cookie: jest.fn(), clearCookie: jest.fn() };
    const controller = new AuthController(auth as unknown as AuthService);
    const request = { headers: {} } as Request;
    await controller.login({}, request, response as unknown as Response);
    await controller.logout(request, response as unknown as Response);
    expect(response.cookie).toHaveBeenCalledWith(
      cookieName,
      'token',
      expect.objectContaining({ path, httpOnly: true }),
    );
    expect(response.clearCookie).toHaveBeenCalledWith(
      cookieName,
      expect.objectContaining({ path, httpOnly: true }),
    );
  });
});
