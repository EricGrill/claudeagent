/**
 * Autodesk Platform Services OAuth2 Authentication
 * 
 * Handles both 2-legged (client credentials) and 3-legged (authorization code)
 * OAuth2 flows for Autodesk API authentication.
 */

import {
  AutodeskTokenResponse,
  AutodeskAuthConfig,
  AutodeskScope,
  AutodeskAuthState,
} from "./types";

const APS_AUTH_BASE_URL = "https://developer.api.autodesk.com/authentication/v2";

export interface AutodeskAuthManager {
  getAuthorizationUrl(state?: string): string;
  exchangeCodeForToken(code: string): Promise<AutodeskTokenResponse>;
  refreshAccessToken(refreshToken: string): Promise<AutodeskTokenResponse>;
  revokeToken(token: string): Promise<void>;
  getTwoLeggedToken(): Promise<AutodeskTokenResponse>;
}

export function createAutodeskAuthManager(config: AutodeskAuthConfig): AutodeskAuthManager {
  const { clientId, clientSecret, callbackUrl, scopes } = config;

  const getBasicAuth = () => {
    return Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  };

  return {
    getAuthorizationUrl(state?: string): string {
      const params = new URLSearchParams({
        client_id: clientId,
        response_type: "code",
        redirect_uri: callbackUrl,
        scope: scopes.join(" "),
      });

      if (state) {
        params.append("state", state);
      }

      return `${APS_AUTH_BASE_URL}/authorize?${params.toString()}`;
    },

    async exchangeCodeForToken(code: string): Promise<AutodeskTokenResponse> {
      const response = await fetch(`${APS_AUTH_BASE_URL}/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${getBasicAuth()}`,
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: callbackUrl,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new AutodeskAuthError(
          error.error_description || "Failed to exchange code for token",
          error.error
        );
      }

      return response.json();
    },

    async refreshAccessToken(refreshToken: string): Promise<AutodeskTokenResponse> {
      const response = await fetch(`${APS_AUTH_BASE_URL}/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${getBasicAuth()}`,
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: refreshToken,
          scope: scopes.join(" "),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new AutodeskAuthError(
          error.error_description || "Failed to refresh token",
          error.error
        );
      }

      return response.json();
    },

    async revokeToken(token: string): Promise<void> {
      const response = await fetch(`${APS_AUTH_BASE_URL}/revoke`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${getBasicAuth()}`,
        },
        body: new URLSearchParams({
          token,
          token_type_hint: "access_token",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new AutodeskAuthError(
          error.error_description || "Failed to revoke token",
          error.error
        );
      }
    },

    async getTwoLeggedToken(): Promise<AutodeskTokenResponse> {
      const response = await fetch(`${APS_AUTH_BASE_URL}/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${getBasicAuth()}`,
        },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          scope: scopes.join(" "),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new AutodeskAuthError(
          error.error_description || "Failed to get 2-legged token",
          error.error
        );
      }

      return response.json();
    },
  };
}

export class AutodeskAuthError extends Error {
  constructor(
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = "AutodeskAuthError";
  }
}

export function getDefaultScopes(): AutodeskScope[] {
  return [
    "data:read",
    "data:write",
    "account:read",
    "user-profile:read",
  ];
}

export function createAuthConfig(): AutodeskAuthConfig {
  const clientId = process.env.AUTODESK_CLIENT_ID;
  const clientSecret = process.env.AUTODESK_CLIENT_SECRET;
  const callbackUrl = process.env.AUTODESK_CALLBACK_URL || 
    `${process.env.NEXT_PUBLIC_APP_URL}/api/autodesk/auth/callback`;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing Autodesk credentials. Please set AUTODESK_CLIENT_ID and AUTODESK_CLIENT_SECRET environment variables."
    );
  }

  return {
    clientId,
    clientSecret,
    callbackUrl,
    scopes: getDefaultScopes(),
  };
}

export function isTokenExpired(expiresAt: number): boolean {
  const now = Date.now();
  const bufferMs = 5 * 60 * 1000; // 5 minutes buffer
  return now >= expiresAt - bufferMs;
}

export function calculateExpiresAt(expiresIn: number): number {
  return Date.now() + expiresIn * 1000;
}

export function createInitialAuthState(): AutodeskAuthState {
  return {
    isAuthenticated: false,
    accessToken: null,
    refreshToken: null,
    expiresAt: null,
    userId: null,
  };
}
