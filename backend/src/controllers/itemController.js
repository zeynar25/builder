import mongoose from "mongoose";
import Item from "../models/Item.js";

export async function shop(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 100);

    const items = await Item.find({ isActive: true })
      .populate("category", "name")
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()
      .exec();

    return res.json({ page, limit, items });
  } catch (error) {
    return res
      .status(500)
      .json({ error: error.message || "cannot fetch shop items" });
  }
}

export async function createItem(req, res) {
  try {
    const payload = { ...req.body };
    if (payload.price != null) {
      payload.price = mongoose.Types.Decimal128.fromString(
        String(payload.price)
      );
    }

    const item = await Item.create(payload);
    return res.status(201).json(item);
  } catch (err) {
    return res.status(400).json({ error: err.message || "cannot_create_item" });
  }
}

export async function getItem(req, res) {
  try {
    const { id } = req.params;
    const item = await Item.findById(id)
      .populate("category", "name")
      .lean()
      .exec();
    if (!item) return res.status(404).json({ error: "not_found" });
    return res.json(item);
  } catch (err) {
    return res.status(500).json({ error: err.message || "cannot_get_item" });
  }
}

export async function updateItem(req, res) {
  try {
    const { id } = req.params;
    const updates = { ...req.body };
    if (updates.price != null) {
      updates.price = mongoose.Types.Decimal128.fromString(
        String(updates.price)
      );
    }

    const item = await Item.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).exec();
    if (!item) return res.status(404).json({ error: "not_found" });
    return res.json(item);
  } catch (err) {
    return res.status(400).json({ error: err.message || "cannot_update_item" });
  }
}

export async function deleteItem(req, res) {
  try {
    const { id } = req.params;
    const item = await Item.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    ).exec();
    if (!item) return res.status(404).json({ error: "not_found" });
    return res.json({ success: true, item });
  } catch (err) {
    return res.status(500).json({ error: err.message || "cannot_delete_item" });
  }
}
