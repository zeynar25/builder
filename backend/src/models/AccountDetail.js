import mongoose from "mongoose";
import { randomUUID } from "crypto";

const accountDetailSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => randomUUID(),
    },

    firstName: {
      type: String,
      required: true,
    },

    lastName: {
      type: String,
      required: true,
    },

    birthday: {
      type: Date,
      required: true,
    },

    chron: {
      type: Number,
      required: true,
    },

    exp: {
      type: Number,
      required: true,
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
