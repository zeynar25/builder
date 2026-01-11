import jwt from "jsonwebtoken";

// Express middleware to enforce JWT authentication on protected routes.
// Expects an Authorization header in the form: "Bearer <accessToken>".
export function authenticateToken(req, res, next) {
  const authHeader =
    req.headers["authorization"] || req.headers["Authorization"];

  if (!authHeader || typeof authHeader !== "string") {
    return res.status(401).json({ error: "missing_token" });
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).json({ error: "invalid_authorization_header" });
  }

  const token = parts[1];

  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is not configured in the environment");
    return res.status(500).json({ error: "server_misconfigured" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err || !decoded || !decoded.id) {
      return res.status(401).json({ error: "invalid_or_expired_token" });
    }

    // Attach the authenticated account ID to the request for downstream handlers
    req.accountId = decoded.id;
    next();
  });
}

export default authenticateToken;
