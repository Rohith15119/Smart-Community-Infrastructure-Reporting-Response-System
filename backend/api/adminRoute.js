import express from "express";
import jwt from "jsonwebtoken";
const { sign } = jwt;
import { AdminModel } from "../schema/adminSchema.js";
import { hash, compare } from "bcryptjs";
import { verifyToken } from "../middleware/verifyToken.js";
import { citizenModel } from "../schema/citizenSchema.js";

export const adminRoute = express.Router();

//admin related queries

adminRoute.patch(
  "/complaint/:parentId/:complaintId/status",
  // verifyToken,
  async (req, res) => {
    try {
      const { parentId, complaintId } = req.params;
      const message = req.body;

      const status = await citizenModel.findOne({ _id: parentId });

      if (!status) return res.status(400).json({ message: "Status required" });

      const citizen = await citizenModel.findById(parentId);
      if (!citizen)
        return res.status(404).json({ message: "Parent not found" });

      const complaint = citizen.complaints.id(complaintId);
      if (!complaint)
        return res.status(404).json({ message: "Complaint not found" });

      complaint.status = message.status;
      await citizen.save();

      return res.status(200).json({ message: "Status updated", complaint });
    } catch (err) {
      console.error("Status patch error:", err);
      return res.status(500).json({ message: "Failed to update status" });
    }
  }
);
