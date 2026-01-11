function isTokenValid(tok: string | null) {
  if (!tok) return false;
  try {
    const parts = tok.split(".");
    if (parts.length !== 3) return false;
    const payload = parts[1];
    // base64url -> base64
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    // atob should be available in Expo; wrap in try/catch
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );
    const obj = JSON.parse(json);
    if (!obj.exp) return false;
    // exp is seconds since epoch
    return obj.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export default isTokenValid;
