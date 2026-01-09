import accountService from "../services/accountService.js";

export async function signup(req, res) {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "Email and password are required" });

  const result = await accountService.createAccount({ email, password });
  if (!result.success)
    return res.status(409).json({ message: "Email already registered" });

  return res
    .status(201)
    .json({ message: "User signed up", account: result.account });
}

export async function signin(req, res) {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "Email and password are required" });

  const result = await accountService.authenticate({ email, password });
  if (!result.success) {
    const code = result.reason === "not_found" ? 401 : 401;
    return res.status(code).json({ message: result.reason });
  }

  return res.status(200).json({ message: "Signed in", ...result });
}

export async function signout(req, res) {
  try {
    await accountService.signout();
    return res.status(200).json({ message: "Signed out" });
  } catch (err) {
    return res.status(400).json({ message: err.message || "cannot_signout" });
  }
}
