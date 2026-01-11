import MapModel from "../models/Map.js";
import ItemPlacement from "../models/ItemPlacement.js";
import AccountDetail from "../models/AccountDetail.js";

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

export async function expandMap(mapId, accountDetailsId, cost = 300) {
  const [mapDoc, accountDetails] = await Promise.all([
    MapModel.findById(mapId).exec(),
    AccountDetail.findById(accountDetailsId).exec(),
  ]);

  if (!mapDoc) return null;
  if (!accountDetails) throw new Error("account_details_not_found");

  const currentChron = accountDetails.chron ?? 0;
  if (currentChron < cost) {
    throw new Error("insufficient_chrons");
  }

  mapDoc.heightTiles = (mapDoc.heightTiles || 0) + 1;
  mapDoc.widthTiles = (mapDoc.widthTiles || 0) + 1;
  await mapDoc.save();

  accountDetails.chron = currentChron - cost;
  accountDetails.exp = (accountDetails.exp ?? 0) + cost;
  await accountDetails.save();

  const map = mapDoc.toObject();
  const updatedAccountDetail = accountDetails.toObject();

  return { map, accountDetail: updatedAccountDetail };
}

export default { getMapWithTiles, getMapsByAccount, updateMapName, expandMap };
