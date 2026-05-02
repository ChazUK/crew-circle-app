"use node";

import type {
  CalendarConnectContext,
  CalendarConnectParams,
  CalendarConnectResult,
  CalendarProvider,
  CalendarProviderCapabilities,
  IncomingEvent,
  SubCalendar,
  SubCalendarBlueprint,
  SyncWindow,
  WriteError,
  WriteSuccess,
} from "@shared/calendars";

import { encryptJson } from "../domain/crypto";

export const microsoftCapabilities: CalendarProviderCapabilities = {
  serverSidePullable: true,
  writable: true,
  hasSubCalendars: true,
};

type MicrosoftTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
};

type MicrosoftUserInfo = {
  mail: string | null;
  userPrincipalName: string;
};

type MicrosoftCalendarItem = {
  id: string;
  name: string;
  isDefaultCalendar: boolean;
};

type MicrosoftCalendarListResponse = {
  value?: MicrosoftCalendarItem[];
  "@odata.nextLink"?: string;
};

function throwAuthError(message: string): never {
  throw Object.assign(new Error(message), { kind: "auth" as const });
}

export const MicrosoftCalendarProvider: CalendarProvider = {
  capabilities: microsoftCapabilities,

  async connect(
    _ctx: unknown,
    params: CalendarConnectParams,
    _context: CalendarConnectContext,
  ): Promise<CalendarConnectResult> {
    if (params.provider !== "microsoft") {
      throw new Error("MicrosoftCalendarProvider.connect called with non-Microsoft params");
    }

    const { authCode, codeVerifier, clientId, redirectUri } = params;

    // 1. Exchange auth code for tokens — public client, no client secret
    const tokenResponse = await fetch(
      "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code: authCode,
          code_verifier: codeVerifier,
          client_id: clientId,
          redirect_uri: redirectUri,
        }).toString(),
      },
    );

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text().catch(() => String(tokenResponse.status));
      throwAuthError(`Microsoft token exchange failed (${tokenResponse.status}): ${errorText}`);
    }

    const tokenData = (await tokenResponse.json()) as MicrosoftTokenResponse;
    const {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: expiresIn,
      scope,
      token_type: tokenType,
    } = tokenData;

    // 2. Fetch user identity from Microsoft Graph
    const meResponse = await fetch("https://graph.microsoft.com/v1.0/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!meResponse.ok) {
      throwAuthError(`Microsoft Graph /me fetch failed (${meResponse.status})`);
    }

    const meData = (await meResponse.json()) as MicrosoftUserInfo;
    const externalAccountId = meData.mail ?? meData.userPrincipalName;

    // 3. List calendars so the connection is immediately syncable — follow @odata.nextLink across pages
    const subCalendars: SubCalendarBlueprint[] = [];
    let nextUrl: string | undefined = "https://graph.microsoft.com/v1.0/me/calendars";
    while (nextUrl) {
      const calResponse: Response = await fetch(nextUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!calResponse.ok) break;
      const calData = (await calResponse.json()) as MicrosoftCalendarListResponse;
      for (const item of calData.value ?? []) {
        subCalendars.push({
          externalId: item.id,
          label: item.name,
          showAsBusy: true,
        });
      }
      nextUrl = calData["@odata.nextLink"];
    }

    // 4. Encrypt tokens — never leave the server unencrypted
    const encryptedTokens = await encryptJson({ accessToken, refreshToken, tokenType });

    return {
      connection: {
        externalAccountId,
        oauthClientId: clientId,
        encryptedTokens,
        tokenExpiresAt: Date.now() + expiresIn * 1000,
        scope,
      },
      subCalendars,
    };
  },

  async fetchEvents(
    _ctx: unknown,
    _connection: unknown,
    _window: SyncWindow,
  ): Promise<IncomingEvent[]> {
    throw new Error("Not implemented: Microsoft Calendar is not yet supported");
  },

  async writeEvent(
    _ctx: unknown,
    _connection: unknown,
    _event: IncomingEvent,
  ): Promise<WriteSuccess | WriteError> {
    throw new Error("Not implemented: Microsoft Calendar is not yet supported");
  },

  async listSubCalendars(_ctx: unknown, _connection: unknown): Promise<SubCalendar[]> {
    throw new Error("Not implemented: Microsoft Calendar is not yet supported");
  },
};
