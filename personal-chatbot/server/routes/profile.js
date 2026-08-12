import { Router } from "express";
import { getPublicProfile } from "../lib/profile.js";

const router = Router();

router.get("/", (_req, res) => {
  res.json(getPublicProfile());
});

export default router;
