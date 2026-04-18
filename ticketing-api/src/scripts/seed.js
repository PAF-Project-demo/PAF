import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDatabase } from "../config/database.js";
import { Ticket } from "../models/Ticket.js";
import { User } from "../models/User.js";
import { seedTicketBlueprints, seedUsers } from "../data/seedData.js";
import { buildTicketId } from "../utils/generateTicketId.js";

async function seed() {
  await connectDatabase();

  await Promise.all([User.deleteMany({}), Ticket.deleteMany({})]);

  const createdUsers = [];
  for (const user of seedUsers) {
    const passwordHash = await bcrypt.hash(user.password, 10);
    createdUsers.push(
      await User.create({
        fullName: user.fullName,
        email: user.email,
        passwordHash,
        role: user.role,
        department: user.department,
        skills: user.skills,
      })
    );
  }

  const admin = createdUsers.find((user) => user.role === "ADMIN");
  const technician = createdUsers.find((user) => user.role === "TECHNICIAN");
  const reporter = createdUsers.find((user) => user.role === "USER");

  let sequence = 1;
  for (const blueprint of seedTicketBlueprints) {
    const createdAt = new Date(Date.now() - sequence * 24 * 60 * 60 * 1000);
    const dueAt = new Date(createdAt.getTime() + blueprint.slaHours * 60 * 60 * 1000);

    await Ticket.create({
      ticketId: buildTicketId(sequence),
      title: blueprint.title,
      description: blueprint.description,
      type: blueprint.type,
      priority: blueprint.priority,
      category: blueprint.category,
      status: blueprint.status,
      location: blueprint.location,
      reporter: {
        userId: reporter._id,
        fullName: reporter.fullName,
        email: reporter.email,
        role: reporter.role,
      },
      assignedTechnician:
        blueprint.status === "OPEN"
          ? {}
          : {
              userId: technician._id,
              fullName: technician.fullName,
              email: technician.email,
              role: technician.role,
            },
      slaHours: blueprint.slaHours,
      dueAt,
      overdue: blueprint.status === "OPEN" && dueAt < new Date(),
      resolvedAt:
        blueprint.status === "RESOLVED"
          ? new Date(createdAt.getTime() + 4 * 60 * 60 * 1000)
          : null,
      comments: blueprint.comments.map((comment) => ({
        message: comment.message,
        author: {
          userId: reporter._id,
          fullName: reporter.fullName,
          role: reporter.role,
        },
        createdAt: new Date(createdAt.getTime() + 60 * 60 * 1000),
      })),
      activity: [
        {
          action: "TICKET_CREATED",
          message: "Seeded ticket created.",
          actor: {
            userId: admin._id,
            fullName: admin.fullName,
            role: admin.role,
          },
          meta: {},
          createdAt,
        },
      ],
      createdAt,
      updatedAt: new Date(),
    });

    sequence += 1;
  }

  console.log("Seed complete.");
  console.table(
    createdUsers.map((user) => ({
      email: user.email,
      role: user.role,
    }))
  );
}

seed()
  .catch((error) => {
    console.error("Seed failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
