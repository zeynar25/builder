import Account from "../models/Account.js";
import AccountDetail from "../models/AccountDetail.js";

export async function getAccountDetailById(detailId) {
  if (!detailId) throw new Error("detailId_required");

  const accountDetail = await AccountDetail.findById(detailId).exec();
  return accountDetail;
}

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

/**
 * Increment `chron` on an AccountDetail by a number of minutes.
 * `minutes` should be a non-negative integer (floored by caller).
 * Returns the updated AccountDetail or null if not found.
 */
export async function addChronById(detailId, minutes) {
  const mins = Math.floor(Number(minutes) || 0);
  if (mins <= 0) throw new Error("minutes_must_be_positive");

  const updated = await AccountDetail.findByIdAndUpdate(
    detailId,
    { $inc: { chron: mins } },
    { new: true, runValidators: true }
  ).exec();

  return updated;
}

/**
 * Update profile image URL directly by AccountDetail id.
 * Returns the updated AccountDetail or null if not found.
 */
export async function updateImageById(detailId, imageUrl) {
  const updated = await AccountDetail.findByIdAndUpdate(
    detailId,
    { imageUrl },
    { new: true, runValidators: true }
  ).exec();

  return updated;
}

/**
 * Update profile avatar (bundled filename like "1.png") by AccountDetail id.
 * This is a semantic alias of updateImageById to keep intent clear.
 */
export async function updateProfileAvatarById(detailId, imageUrl) {
  const updated = await AccountDetail.findByIdAndUpdate(
    detailId,
    { imageUrl },
    { new: true, runValidators: true }
  ).exec();

  return updated;
}

export default {
  getAccountDetailById,
  updateGameNameByAccount,
  updateGameNameById,
  addChronById,
  updateImageById,
  updateProfileAvatarById,
};
