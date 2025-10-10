import express from "express";
const router = express.Router();

import { loginUser, signupUser } from "../controllers/userController.js";
import { authenticate } from "../middlewares/auth.js";

router.post("/login", loginUser);
router.post("/signup", signupUser);

export default router;
