import express from "express";
import jwt from "jsonwebtoken";
const { sign } = jwt;
import { citizenModel } from "../schema/citizenSchema.js";
import { AdminModel } from "../schema/adminSchema.js";
import { hash, compare } from "bcryptjs";
export const cityRoute = express.Router();

cityRoute.use(express.json());
//citizen login
cityRoute.post("/login", async (req, res) => {
  try {
    const user = req.body;

    if (!user.username || !user.password || !user)
      return res.status(400).json({ message: "Invalid Login Details! " });

    const exist = await citizenModel.findOne({ username: req.body.username });

    if (!exist) return res.status(400).json({ message: " User Not exists !" });

    const validPass = await compare(user.password, exist.password);

    if (!validPass)
      return res.status(400).json({ message: "Incorrect Password" });

    const Encrypted_token = sign({ username: user.username }, "abcdef", {
      expiresIn: "1d",
    });

    res.cookie("token", Encrypted_token, {
      secure: true,
      sameSite: "none",
    });

    res.status(200).json({
      message: "Login Success ✅",
      token: Encrypted_token,
      UserData: exist,
    });
  } catch (err) {
    res.status(404).json({ message: "User Login Failed !" });
  }
});

//login admin account
cityRoute.post("/admin", async (req, res) => {
  let { username, password } = req.body;

  const valid = await AdminModel.findOne({ username: username });

  if (!valid)
    return res.status(400).json({ message: "Invalid Admin Account Details " });

  const Encrypted_token = sign({ username: username }, "abcdef", {
    expiresIn: "1d",
  });

  res.cookie("token", Encrypted_token, {
    secure: true,
    sameSite: "none",
  });

  res.status(200).json({
    message: "Login Success ✅",
    token: Encrypted_token,
    UserData: valid,
  });
});

//register account
cityRoute.post("/register", async (req, res) => {
  try {
    const user = req.body;

    // console.log(user);

    if (!user.username || !user.password)
      return res.status(400).json({ message: "Invalid Username or Password" });

    const exists = await citizenModel.findOne({ username: user.username });

    if (exists === null || exists === undefined) {
      const Hashpassword = await hash(user.password, 10);

      const schema = new citizenModel({
        username: user.username,
        password: Hashpassword,
        email: user.email,
        phoneNumber: user.phoneNumber,
        images: [],
        complaints: [],
      });

      await schema.save();
      res.status(200).json({ message: "User Created Success ✅" });
    } else {
      return res.status(409).json({ message: "User Already exists! " });
    }
  } catch (err) {
    res
      .status(404)
      .json({ message: "Error Occured During Registration ❌ ", err });
  }
});

cityRoute.post("/:id/complaints", async (req, res) => {
  try {
    const { location, category, description } = req.body;

    const updated = await citizenModel.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          complaints: { location, category, description },
        },
      },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Citizen not found" });

    res.json({ message: "Complaint added", citizen: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

cityRoute.get("/track", async (req, res) => {
  try {
    const list = await citizenModel.find();
    if (!list || list.length === 0) {
      return res.status(202).json({ message: "Empty List !" });
    }

    res.status(200).json({ message: "The Todo List are:", items: list });
  } catch (err) {
    res.status(400).json({ message: "Todo List Retrieval Failed" });
  }
});

cityRoute.get("/track/:username", async (req, res) => {
  try {
    let user = req.params.username;
    const list = await citizenModel.find({ username: user });

    if (!list || list.length === 0) {
      return res.status(202).json({ message: "Empty List !" });
    }

    res.status(200).json({ message: "The Todo List are:", items: list });
  } catch (err) {
    res.status(400).json({ message: "Todo List Retrieval Failed" });
  }
});

cityRoute.delete("/complaint/:pid/:id", async (req, res) => {
  try {
    let { pid, id } = req.params;

    console.log(pid, id);

    const parent = await citizenModel.findById({ _id: pid });

    if (!parent) {
      return res.status(404).json({ message: "Parent not found" });
    }

    // Remove complaint item from parent's complaint list
    parent.complaints = parent.complaints.filter(
      (c) => c._id.toString() !== id
    );

    await parent.save();

    return res
      .status(200)
      .json({ message: "Complaint deleted successfully ✅✅" });
  } catch (err) {
    res.status(404).json({ message: "Invalid Request ❌❌" });
  }
});
