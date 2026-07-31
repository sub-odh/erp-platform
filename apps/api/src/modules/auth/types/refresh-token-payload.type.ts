export interface RefreshTokenPayload {
  sub: string;
  organizationId: string;
  sessionId: string;
  tokenType: 'refresh';
  jti: string;
}
