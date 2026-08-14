import { UnauthorizedException } from '@nestjs/common';
import type { Request, Response } from 'express';

import {
  clearRefreshTokenCookie,
  readRefreshTokenCookie,
  REFRESH_TOKEN_COOKIE_NAME,
  setRefreshTokenCookie,
} from './refresh-token-cookie';

describe('refresh token cookie', () => {
  it('sets an HttpOnly SameSite cookie scoped to authentication routes', () => {
    const response = {
      cookie: jest.fn(),
    } as unknown as Response;

    setRefreshTokenCookie(response, 'signed.refresh.token');

    expect(response.cookie).toHaveBeenCalledWith(
      REFRESH_TOKEN_COOKIE_NAME,
      'signed.refresh.token',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        path: '/api/v1/auth',
        maxAge: expect.any(Number),
      }),
    );
  });

  it('reads and decodes the refresh cookie without requiring cookie middleware', () => {
    const request = {
      headers: {
        cookie: `theme=light; ${REFRESH_TOKEN_COOKIE_NAME}=signed.refresh%2Etoken`,
      },
    } as Request;

    expect(readRefreshTokenCookie(request)).toBe('signed.refresh.token');
  });

  it('rejects requests without a refresh cookie', () => {
    const request = { headers: {} } as Request;

    expect(() => readRefreshTokenCookie(request)).toThrow(
      UnauthorizedException,
    );
  });

  it('clears the cookie with the same security scope', () => {
    const response = {
      clearCookie: jest.fn(),
    } as unknown as Response;

    clearRefreshTokenCookie(response);

    expect(response.clearCookie).toHaveBeenCalledWith(
      REFRESH_TOKEN_COOKIE_NAME,
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        path: '/api/v1/auth',
      }),
    );
  });
});
