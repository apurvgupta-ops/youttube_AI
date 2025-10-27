import express from "express";
const router = express.Router();

import {
  loginUser,
  signupUser,
  convertYoutubeUrlToCourse,
} from "../controllers/userController.js";

router.post("/login", loginUser);
router.post("/signup", signupUser);
router.post("/convert", convertYoutubeUrlToCourse);

// router.use(authenticate);

export default router;
