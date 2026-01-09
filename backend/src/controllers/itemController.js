import itemService from "../services/itemService.js";

export async function shop(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 100);
    const result = await itemService.listItems({ page, limit });
    return res.json(result);
  } catch (error) {
    return res
      .status(500)
      .json({ error: error.message || "cannot fetch shop items" });
  }
}

export async function buyItem(req, res) {
  try {
    const { accountId, accountDetailsId, mapId, x, y, itemId } = req.body;
    const result = await itemService.buyItemById(
      accountId,
      accountDetailsId,
      mapId,
      x,
      y,
      itemId
    );
    if (!result) return res.status(404).json({ error: "item_not_found" });
    return res.json(result);
  } catch (err) {
    // map known domain errors to 4xx
    const msg = err?.message || "cannot_buy_item";
    if (
      msg === "account_details_not_found" ||
      msg === "insufficient_chrons" ||
      msg === "out_of_bounds" ||
      msg === "occupied"
    ) {
      return res.status(400).json({ error: msg });
    }
    return res.status(500).json({ error: msg });
  }
}

export async function createItem(req, res) {
  try {
    const payload = { ...req.body };
    const item = await itemService.createItem(payload);
    return res.status(201).json(item);
  } catch (err) {
    return res.status(400).json({ error: err.message || "cannot_create_item" });
  }
}

export async function getItem(req, res) {
  try {
    const { id } = req.params;
    const item = await itemService.getItemById(id);
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
    const item = await itemService.updateItemById(id, updates);
    if (!item) return res.status(404).json({ error: "not_found" });
    return res.json(item);
  } catch (err) {
    return res.status(400).json({ error: err.message || "cannot_update_item" });
  }
}

export async function deleteItem(req, res) {
  try {
    const { id } = req.params;
    const item = await itemService.softDeleteItemById(id);
    if (!item) return res.status(404).json({ error: "not_found" });
    return res.json({ success: true, item });
  } catch (err) {
    return res.status(500).json({ error: err.message || "cannot_delete_item" });
  }
}
