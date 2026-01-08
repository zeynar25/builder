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

export default { getMap };
