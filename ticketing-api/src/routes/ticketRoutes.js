import { Router } from "express";
import {
  addComment,
  assignTechnician,
  createTicket,
  deleteTicket,
  getTicketById,
  getTicketMeta,
  listTickets,
  updateTicket,
  uploadAttachments,
} from "../controllers/ticketController.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = Router();

router.use(authenticate);
router.get("/meta", getTicketMeta);
router.get("/", listTickets);
router.post("/", createTicket);
router.get("/:id", getTicketById);
router.put("/:id", updateTicket);
router.delete("/:id", authorize("ADMIN"), deleteTicket);
router.patch("/:id/assign", authorize("ADMIN"), assignTechnician);
router.post("/:id/comments", addComment);
router.post("/:id/attachments", upload.array("attachments", 5), uploadAttachments);

export default router;
