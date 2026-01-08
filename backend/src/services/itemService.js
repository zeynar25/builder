import mongoose from "mongoose";
import Item from "../models/Item.js";

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
  createItem,
  getItemById,
  updateItemById,
  softDeleteItemById,
};
