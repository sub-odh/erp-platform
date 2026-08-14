import { UnauthorizedException } from '@nestjs/common';
import type { CookieOptions, Request, Response } from 'express';

import { env } from '@erp/config';

export const REFRESH_TOKEN_COOKIE_NAME = 'erp_refresh_token';

function getRefreshCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/v1/auth',
  };
}

export function setRefreshTokenCookie(
  response: Response,
  refreshToken: string,
): void {
  response.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
    ...getRefreshCookieOptions(),
    maxAge: env.JWT_REFRESH_TTL_SECONDS * 1000,
  });
}

export function clearRefreshTokenCookie(response: Response): void {
  response.clearCookie(REFRESH_TOKEN_COOKIE_NAME, getRefreshCookieOptions());
}

export function readRefreshTokenCookie(request: Request): string {
  const cookieHeader = request.headers.cookie;

  if (!cookieHeader) {
    throw new UnauthorizedException('Refresh cookie is missing');
  }

  for (const part of cookieHeader.split(';')) {
    const separatorIndex = part.indexOf('=');

    if (separatorIndex < 0) {
      continue;
    }

    const name = part.slice(0, separatorIndex).trim();

    if (name !== REFRESH_TOKEN_COOKIE_NAME) {
      continue;
    }

    const rawValue = part.slice(separatorIndex + 1).trim();

    try {
      const value = decodeURIComponent(rawValue);

      if (value.length > 0 && value.length <= 4096) {
        return value;
      }
    } catch {
      break;
    }
  }

  throw new UnauthorizedException('Refresh cookie is invalid');
}
