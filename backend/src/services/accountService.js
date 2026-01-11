import Account from "../models/Account.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import AccountDetail from "../models/AccountDetail.js";
import MapModel from "../models/Map.js";

const HASH_ROUNDS = 10;

function generateTokens(id) {
  const access = jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1d" });
  const refresh = jwt.sign({ id }, process.env.REFRESH_SECRET, {
    expiresIn: "30d",
  });
  return { access, refresh };
}

export async function createAccount({ email, password }) {
  // basic email format check
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email || "")) {
    return { success: false, reason: "invalid_email" };
  }

  // password must be 8+ chars, include upper, lower, and digit
  const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  if (!passwordPattern.test(password || "")) {
    return { success: false, reason: "weak_password" };
  }

  const existing = await Account.findOne({ email });
  if (existing) return { success: false, reason: "email_taken" };

  const passwordHash = await bcrypt.hash(password, HASH_ROUNDS);

  // Pick a random default profile image 1–5
  const n = Math.floor(Math.random() * 5) + 1;

  const detail = await AccountDetail.create({
    imageUrl: `${n}.png`,
    chron: 500,
    exp: 0,
  });

  const account = await Account.create({
    email,
    passwordHash,
    accountDetail: detail.id,
  });

  // create a default map for the new account
  await MapModel.create({
    name: "Unknown",
    account: account.id,
    heightTiles: 5,
    widthTiles: 5,
  });
  return { success: true, account: { id: account.id, email: account.email } };
}

export async function authenticate({ email, password }) {
  const account = await Account.findOne({ email });
  if (!account) return { success: false, reason: "account not found" };

  const ok = await bcrypt.compare(password, account.passwordHash);
  if (!ok) return { success: false, reason: "incorrect password entered" };

  const tokens = generateTokens(account.id);
  return {
    success: true,
    account: {
      id: account.id,
      email: account.email,
      accountDetail: account.accountDetail,
    },
    tokens,
  };
}

export async function signout() {
  // No server-side token storage yet; placeholder for future revocation.
  return { success: true };
}

export default { createAccount, authenticate, generateTokens, signout };
