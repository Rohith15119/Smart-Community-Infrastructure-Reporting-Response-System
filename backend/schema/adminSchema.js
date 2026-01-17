import { Schema, model } from "mongoose";

const AdminSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
    },
  },
  {
    strict: true,
    versionKey: false,
    timestamps: true,
  }
);

export const AdminModel = model("admin", AdminSchema);
