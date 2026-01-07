import Account from "../models/Account.js";
import bcrypt from "bcryptjs";

export const accountController = (req, res) => {
  res.status(200).send("Welcome to the account controller!");
};

export async function signup(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const existing = await Account.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const account = new Account({ email, passwordHash });
    await account.save();

    return res.status(201).json({
      message: "User signed up successfully",
      account: { id: account.id, email: account.email },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function signin(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const account = await Account.findOne({ email });
    if (!account) {
      return res
        .status(401)
        .json({ message: `Account with email "${email}" not found` });
    }

    const match = await bcrypt.compare(password, account.passwordHash);
    if (!match) {
      return res.status(401).json({ message: "Incorrect password!" });
    }

    return res.status(200).json({
      message: "User signed in successfully",
      account: { id: account.id, email: account.email },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
}
