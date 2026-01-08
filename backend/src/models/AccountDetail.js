import mongoose from "mongoose";
import { randomUUID } from "crypto";

const accountDetailSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => randomUUID(),
    },

    gameName: {
      type: String,
      required: true,
      default: "Unknown",
    },

    chron: {
      type: Number,
      required: false,
      default: 0,
    },

    exp: {
      type: Number,
      required: false,
      default: 0,
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// expose `id` as a virtual that maps to `_id`
accountDetailSchema.virtual("id").get(function () {
  return this._id;
});

const AccountDetail = mongoose.model("AccountDetail", accountDetailSchema);

export default AccountDetail;
