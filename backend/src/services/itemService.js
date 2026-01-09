import mongoose from "mongoose";
import Item from "../models/Item.js";
import AccountDetail from "../models/AccountDetail.js";

import { placeSingleTile } from "./placementService.js";

export async function listItems({ page = 1, limit = 100 } = {}) {
  page = Math.max(1, page);
  limit = Math.max(1, limit);
  const items = await Item.find({ isActive: true })
    .populate("category", "name")
    .skip((page - 1) * limit)
    .limit(limit)
    .lean()
    .exec();

  return { page, limit, items };
}

export async function buyItemById(
  accountId,
  accountDetailsId,
  mapId,
  x,
  y,
  itemId
) {
  const item = await Item.findOne({ _id: itemId, isActive: true }).exec();
  if (!item) return null;

  // normalize price to a plain number (Decimal128 -> number)
  const priceNumber =
    item.price != null && typeof item.price !== "number"
      ? parseFloat(item.price.toString())
      : Number(item.price ?? 0);

  // load account details and validate funds
  const accountDetails = await AccountDetail.findById(accountDetailsId).exec();
  if (!accountDetails) throw new Error("account_details_not_found");

  // AccountDetail uses `chron` (singular) as the field name
  if ((accountDetails.chron ?? 0) < priceNumber) {
    throw new Error("insufficient_chrons");
  }

  // attempt placement (placement service expects an object)
  const placeRes = await placeSingleTile({
    map: mapId,
    x: Number(x),
    y: Number(y),
    item: item._id || itemId,
    placedBy: accountId,
  });

  if (placeRes.success === false) throw new Error(placeRes.reason);

  // deduct chrons and persist
  accountDetails.chron = (accountDetails.chron ?? 0) - priceNumber;
  await accountDetails.save();

  return { success: true, item, placement: placeRes.placement };
}

export async function createItem(payload) {
  const data = { ...payload };
  if (data.price != null)
    data.price = mongoose.Types.Decimal128.fromString(String(data.price));
  const item = await Item.create(data);
  return item;
}

export async function getItemById(id) {
  const item = await Item.findById(id)
    .populate("category", "name")
    .lean()
    .exec();
  return item;
}

export async function updateItemById(id, updates) {
  const data = { ...updates };
  if (data.price != null)
    data.price = mongoose.Types.Decimal128.fromString(String(data.price));
  const item = await Item.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  }).exec();
  return item;
}

export async function softDeleteItemById(id) {
  const item = await Item.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  ).exec();
  return item;
}

export default {
  listItems,
  buyItemById,
  createItem,
  getItemById,
  updateItemById,
  softDeleteItemById,
};
