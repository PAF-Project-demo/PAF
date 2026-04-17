import mongoose from "mongoose";

const attachmentSchema = new mongoose.Schema(
  {
    fileName: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    url: { type: String, required: true },
    uploadedBy: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      fullName: { type: String, required: true },
      role: { type: String, required: true },
    },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const commentSchema = new mongoose.Schema(
  {
    message: { type: String, required: true, trim: true },
    author: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      fullName: { type: String, required: true },
      role: { type: String, required: true },
    },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const activitySchema = new mongoose.Schema(
  {
    action: { type: String, required: true },
    message: { type: String, required: true },
    actor: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      fullName: { type: String, required: true },
      role: { type: String, required: true },
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const ticketSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["MAINTENANCE", "INCIDENT"],
      required: true,
    },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      default: "MEDIUM",
      index: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    status: {
      type: String,
      enum: [
        "OPEN",
        "IN_PROGRESS",
        "ON_HOLD",
        "RESOLVED",
        "CLOSED",
        "CANCELLED",
      ],
      default: "OPEN",
      index: true,
    },
    location: {
      building: { type: String, required: true, trim: true },
      floor: { type: String, trim: true },
      room: { type: String, trim: true },
      campus: { type: String, trim: true },
      note: { type: String, trim: true },
    },
    reporter: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },
      fullName: { type: String, required: true },
      email: { type: String, required: true },
      role: { type: String, required: true },
    },
    assignedTechnician: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      fullName: { type: String, default: null },
      email: { type: String, default: null },
      role: { type: String, default: null },
    },
    slaHours: {
      type: Number,
      default: 24,
    },
    dueAt: {
      type: Date,
      required: true,
      index: true,
    },
    overdue: {
      type: Boolean,
      default: false,
      index: true,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    closedAt: {
      type: Date,
      default: null,
    },
    attachments: {
      type: [attachmentSchema],
      default: [],
    },
    comments: {
      type: [commentSchema],
      default: [],
    },
    activity: {
      type: [activitySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

ticketSchema.index({
  title: "text",
  description: "text",
  category: "text",
  "location.building": "text",
  "location.room": "text",
  ticketId: "text",
});

ticketSchema.pre("save", function updateDerivedFields(next) {
  const isClosedState = ["RESOLVED", "CLOSED", "CANCELLED"].includes(this.status);
  this.overdue = !isClosedState && this.dueAt < new Date();

  if (this.status === "RESOLVED" && !this.resolvedAt) {
    this.resolvedAt = new Date();
  }

  if (this.status === "CLOSED" && !this.closedAt) {
    this.closedAt = new Date();
  }

  next();
});

export const Ticket = mongoose.model("Ticket", ticketSchema);
