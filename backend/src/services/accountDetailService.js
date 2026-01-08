import Account from "../models/Account.js";
import AccountDetail from "../models/AccountDetail.js";

/**
 * Update gameName for an account's AccountDetail by account id.
 * Returns the updated AccountDetail or null if not found.
 */
export async function updateGameNameByAccount(accountId, gameName) {
  if (!gameName) throw new Error("gameName_required");

  const account = await Account.findById(accountId)
    .select("accountDetail")
    .exec();
  if (!account || !account.accountDetail) return null;

  const updated = await AccountDetail.findByIdAndUpdate(
    account.accountDetail,
    { gameName },
    { new: true, runValidators: true }
  ).exec();

  return updated;
}

/**
 * Update gameName directly by AccountDetail id.
 * Returns the updated AccountDetail or null if not found.
 */
export async function updateGameNameById(detailId, gameName) {
  if (!gameName) throw new Error("gameName_required");

  const updated = await AccountDetail.findByIdAndUpdate(
    detailId,
    { gameName },
    { new: true, runValidators: true }
  ).exec();

  return updated;
}

export default { updateGameNameByAccount, updateGameNameById };
