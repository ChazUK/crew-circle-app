import { AuthRequest, ResponseType } from "expo-auth-session";
import type { DiscoveryDocument } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

export type PKCEConnectParams = {
  authEndpoint: string;
  tokenEndpoint: string;
  clientId: string;
  scopes: string[];
  redirectUri: string;
};

export type PKCEConnectResult =
  | { success: true; authCode: string; codeVerifier: string }
  | { success: false; error: string };

export async function pkceConnect(params: PKCEConnectParams): Promise<PKCEConnectResult> {
  const request = new AuthRequest({
    clientId: params.clientId,
    redirectUri: params.redirectUri,
    scopes: params.scopes,
    usePKCE: true,
    responseType: ResponseType.Code,
  });

  const discovery: DiscoveryDocument = {
    authorizationEndpoint: params.authEndpoint,
    tokenEndpoint: params.tokenEndpoint,
  };

  let result: Awaited<ReturnType<typeof request.promptAsync>>;
  try {
    result = await request.promptAsync(discovery);
  } catch {
    return { success: false, error: "OAuth flow failed" };
  }

  if (result.type === "success") {
    const authCode = result.params.code;
    const codeVerifier = request.codeVerifier;

    if (!authCode || !codeVerifier) {
      return { success: false, error: "OAuth flow failed" };
    }

    return { success: true, authCode, codeVerifier };
  }

  if (result.type === "cancel") {
    return { success: false, error: "User cancelled" };
  }

  return { success: false, error: "OAuth flow failed" };
}
