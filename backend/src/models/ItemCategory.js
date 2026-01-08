import mongoose from "mongoose";
import { randomUUID } from "crypto";

const itemCategorySchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => randomUUID(),
    },

    name: {
      type: String,
      required: true,
    },

    description: {
      type: String,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

itemCategorySchema.virtual("id").get(function () {
  return this._id;
});

const ItemCategory = mongoose.model("ItemCategory", itemCategorySchema);

export default ItemCategory;
