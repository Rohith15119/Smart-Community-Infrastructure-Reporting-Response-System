import { Schema, model } from "mongoose";

const citizenSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
    },

    password: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
    },

    phoneNumber: {
      type: Number,
      required: true,
    },

    images: [
      {
        url: {
          type: String,
          required: false,
        },
      },
    ],

    complaints: [
      {
        location: {
          type: String,
          required: true,
        },

        category: {
          type: String,
          required: true,
        },

        description: {
          type: String,
          required: true,
        },

        status: {
          type: String,
          default: "pending",
        },
      },
    ],
  },
  {
    strict: true,
    versionKey: false,
    timestamps: true,
  }
);

export const citizenModel = model("citizen", citizenSchema);
