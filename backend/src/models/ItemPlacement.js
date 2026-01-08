import mongoose from "mongoose";
import { randomUUID } from "crypto";

const itemPlacementSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => randomUUID(),
    },

    x: {
      type: Number,
      required: true,
    },

    y: {
      type: Number,
      required: true,
    },

    placedBy: {
      type: String,
      ref: "Account",
      required: true,
      index: true,
    },

    placedAt: {
      type: Date,
      default: () => new Date(),
    },

    item: {
      type: String,
      ref: "Item",
      required: true,
      index: true,
    },

    map: {
      type: String,
      ref: "Map",
      required: true,
      index: true,
    },
  },
  {
    timestamps: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

itemPlacementSchema.virtual("id").get(function () {
  return this._id;
});

// Prevent placing multiple items into the exact same tile on the same map
itemPlacementSchema.index({ map: 1, x: 1, y: 1 }, { unique: false });

const ItemPlacement = mongoose.model("ItemPlacement", itemPlacementSchema);

export default ItemPlacement;
