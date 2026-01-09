import MapModel from "../models/Map.js";
import ItemPlacement from "../models/ItemPlacement.js";

/**
 * Return map metadata and a 2D grid (rows = heightTiles, cols = widthTiles).
 * Each cell is null or an object { x, y, item, placedBy, placedAt } where item is populated (id, name, imageUrl, sizeX, sizeY).
 */
export async function getMapWithTiles(mapId) {
  const map = await MapModel.findById(mapId).lean().exec();
  if (!map) return null;

  const height = map.heightTiles;
  const width = map.widthTiles;

  // initialize grid with nulls
  const grid = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => null)
  );

  const placements = await ItemPlacement.find({ map: mapId })
    .populate("item", "_id name imageUrl sizeX sizeY")
    .lean()
    .exec();

  for (const p of placements) {
    const x = Number(p.x);
    const y = Number(p.y);
    if (x >= 0 && y >= 0 && y < grid.length && x < grid[0].length) {
      grid[y][x] = {
        x,
        y,
        item: p.item || null,
        placedBy: p.placedBy,
        placedAt: p.placedAt,
      };
    }
  }

  return { map, grid, placements };
}

export async function getMapsByAccount(accountId) {
  return MapModel.find({ account: accountId }).lean().exec();
}

export async function updateMapName(mapId, name) {
  const updated = await MapModel.findByIdAndUpdate(
    mapId,
    { name },
    { new: true, runValidators: true }
  )
    .lean()
    .exec();
  return updated;
}

export default { getMapWithTiles, getMapsByAccount, updateMapName };
