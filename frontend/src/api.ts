import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Wrapper around fetch that automatically attaches the current access token
 * as a Bearer token in the Authorization header, if present.
 */
export default async function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await AsyncStorage.getItem("accessToken");

  const baseHeaders = (options && options.headers) || {};
  const headers: Record<string, string> = {
    ...(baseHeaders as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return fetch(url, { ...options, headers });
}
