import mongoose from "mongoose";
import ItemPlacement from "../models/ItemPlacement.js";
import MapModel from "../models/Map.js";

/**
 * Try to place a single tile. Race-safe by relying on unique index.
 * Returns { success: true, placement } or { success: false, reason: 'occupied' }
 */
export async function placeSingleTile({
  map,
  x,
  y,
  item,
  placedBy,
  checkBounds = true,
}) {
  if (checkBounds) {
    const mapDoc = await MapModel.findById(map).select(
      "widthTiles heightTiles"
    );
    if (!mapDoc) return { success: false, reason: "map_not_found" };
    if (x < 0 || y < 0 || x >= mapDoc.widthTiles || y >= mapDoc.heightTiles)
      return { success: false, reason: "out_of_bounds" };
  }

  try {
    const placement = await ItemPlacement.create({ map, x, y, item, placedBy });
    return { success: true, placement };
  } catch (err) {
    if (err && err.code === 11000)
      return { success: false, reason: "occupied" };
    throw err;
  }
}

/**
 * Place an item that occupies multiple tiles atomically using a transaction.
 * coords: array of { x, y }
 * Returns { success: true } or { success: false, reason }
 */
export async function placeMultiTile({ map, coords, item, placedBy }) {
  const session = await mongoose.startSession();
  try {
    const mapDoc = await MapModel.findById(map).select(
      "widthTiles heightTiles"
    );
    if (!mapDoc) return { success: false, reason: "map_not_found" };

    for (const c of coords) {
      if (
        c.x < 0 ||
        c.y < 0 ||
        c.x >= mapDoc.widthTiles ||
        c.y >= mapDoc.heightTiles
      )
        return { success: false, reason: "out_of_bounds" };
    }

    await session.withTransaction(async () => {
      const docs = coords.map((c) => ({ map, x: c.x, y: c.y, item, placedBy }));
      await ItemPlacement.insertMany(docs, { session });
    });

    session.endSession();
    return { success: true };
  } catch (err) {
    session.endSession();
    if (err && err.code === 11000)
      return { success: false, reason: "occupied" };
    throw err;
  }
}

export default { placeSingleTile, placeMultiTile };
