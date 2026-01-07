import mongoose from "mongoose";
import { randomUUID } from "crypto";

const accountSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => randomUUID(),
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    passwordHash: {
      type: String,
      required: true,
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// expose `id` as a virtual that maps to `_id`
accountSchema.virtual("id").get(function () {
  return this._id;
});

const Account = mongoose.model("Account", accountSchema);

export default Account;
