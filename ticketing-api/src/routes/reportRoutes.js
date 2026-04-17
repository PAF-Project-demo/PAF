import { Router } from "express";
import { getReports } from "../controllers/reportController.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();

router.get("/", authenticate, authorize("ADMIN", "TECHNICIAN"), getReports);

export default router;
