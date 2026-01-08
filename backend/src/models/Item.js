import mongoose from "mongoose";
import { randomUUID } from "crypto";

const itemSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => randomUUID(),
    },

    category: {
      type: String,
      ref: "ItemCategory",
      index: true,
      required: true,
    },

    name: {
      type: String,
      required: true,
    },

    description: {
      type: String,
    },

    price: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
      default: 0,
    },

    sizeX: {
      type: Number,
      default: 1,
    },

    sizeY: {
      type: Number,
      default: 1,
    },

    imageUrl: {
      type: String,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        if (ret.price != null) ret.price = parseFloat(ret.price.toString());
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

itemSchema.virtual("id").get(function () {
  return this._id;
});

const Item = mongoose.model("Item", itemSchema);

export default Item;
