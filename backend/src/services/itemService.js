import mongoose from "mongoose";
import Item from "../models/Item.js";
import AccountDetail from "../models/AccountDetail.js";
import ItemPlacement from "../models/ItemPlacement.js";

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

export async function sellPlacementByCoords(
  accountId,
  accountDetailsId,
  mapId,
  x,
  y
) {
  const placement = await ItemPlacement.findOne({
    map: mapId,
    x: Number(x),
    y: Number(y),
  })
    .populate("item", "_id price")
    .exec();

  if (!placement) {
    return null; // placement_not_found
  }

  // Optional ownership check: only allow the original placer to sell
  if (placement.placedBy && accountId && placement.placedBy !== accountId) {
    const err = new Error("not_owner");
    throw err;
  }

  const item = placement.item;
  if (!item) {
    // no associated item, just delete silently
    await ItemPlacement.deleteOne({ _id: placement._id });
    return { success: true, refund: 0 };
  }

  const priceNumber =
    item.price != null && typeof item.price !== "number"
      ? parseFloat(item.price.toString())
      : Number(item.price ?? 0);

  // 50% refund, rounded down to nearest whole chron
  const refund = Math.max(0, Math.floor(priceNumber * 0.5));

  const accountDetails = await AccountDetail.findById(accountDetailsId).exec();
  if (!accountDetails) throw new Error("account_details_not_found");

  accountDetails.chron = (accountDetails.chron ?? 0) + refund;
  await accountDetails.save();

  await ItemPlacement.deleteOne({ _id: placement._id });

  return {
    success: true,
    refund,
    placementId: placement._id,
    itemId: item._id,
  };
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
  sellPlacementByCoords,
  createItem,
  getItemById,
  updateItemById,
  softDeleteItemById,
};
