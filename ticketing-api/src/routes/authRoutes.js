import { Router } from "express";
import {
  listTechnicians,
  login,
  me,
  register,
} from "../controllers/authController.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authenticate, me);
router.get("/technicians", authenticate, listTechnicians);

export default router;
