import mapService from "../services/mapService.js";

export async function getMap(req, res) {
  try {
    const { id } = req.params;
    const result = await mapService.getMapWithTiles(id);
    if (!result) return res.status(404).json({ error: "map_not_found" });
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message || "cannot_get_map" });
  }
}

export async function getMapsByAccount(req, res) {
  try {
    const { accountId } = req.params;
    const maps = await mapService.getMapsByAccount(accountId);
    return res.json({ maps });
  } catch (err) {
    console.error("getMapsByAccount error:", err);
    return res
      .status(500)
      .json({ error: err?.message || "cannot_list_maps", stack: err?.stack });
  }
}

export async function updateMapName(req, res) {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "name_required" });

    const updated = await mapService.updateMapName(id, name);
    if (!updated) return res.status(404).json({ error: "map_not_found" });
    return res.json({ map: updated });
  } catch (err) {
    return res.status(400).json({ error: err.message || "cannot_update_map" });
  }
}

export async function expandMap(req, res) {
  try {
    const { id } = req.params;
    const { accountDetailsId } = req.body;

    if (!accountDetailsId) {
      return res.status(400).json({ error: "accountDetailsId_required" });
    }

    const result = await mapService.expandMap(id, accountDetailsId);
    if (!result) return res.status(404).json({ error: "map_not_found" });

    return res.json({ success: true, ...result });
  } catch (err) {
    const msg = err?.message || "cannot_expand_map";
    if (msg === "account_details_not_found" || msg === "insufficient_chrons") {
      return res.status(400).json({ error: msg });
    }
    return res.status(500).json({ error: msg });
  }
}

export default { getMap, getMapsByAccount, updateMapName, expandMap };
