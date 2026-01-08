import mongoose from "mongoose";
import { randomUUID } from "crypto";

const mapSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => randomUUID(),
    },

    name: {
      type: String,
      required: true,
    },

    account: {
      type: String,
      ref: "Account",
      index: true,
      required: true,
    },

    heightTiles: {
      type: Number,
      required: true,
    },

    widthTiles: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

mapSchema.virtual("id").get(function () {
  return this._id;
});

const MapModel = mongoose.model("Map", mapSchema);

export default MapModel;
