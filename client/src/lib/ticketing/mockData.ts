import type {
  TicketActivityItem,
  TicketAttachment,
  TicketComment,
  TicketRecord,
  TicketUser,
} from "./types";

export interface TicketingMockDatabase {
  users: TicketUser[];
  tickets: TicketRecord[];
}

const now = Date.now();

const users: TicketUser[] = [
  {
    id: "user-admin",
    fullName: "Ava Morgan",
    email: "admin@paf.local",
    role: "ADMIN",
    department: "Operations",
    skills: ["dispatching", "governance"],
  },
  {
    id: "user-tech",
    fullName: "Liam Chen",
    email: "tech@paf.local",
    role: "TECHNICIAN",
    department: "Facilities",
    skills: ["electrical", "hvac"],
  },
  {
    id: "user-tech-2",
    fullName: "Priya Nadesan",
    email: "priya@paf.local",
    role: "TECHNICIAN",
    department: "Facilities",
    skills: ["networking", "security"],
  },
  {
    id: "user-requester",
    fullName: "Mia Fernandez",
    email: "user@paf.local",
    role: "USER",
    department: "Student Services",
  },
];

function comment(
  id: string,
  author: TicketUser,
  message: string,
  offsetHours: number
): TicketComment {
  return {
    id,
    author: {
      id: author.id,
      fullName: author.fullName,
      role: author.role,
    },
    message,
    createdAt: new Date(now - offsetHours * 60 * 60 * 1000).toISOString(),
  };
}

function activity(
  id: string,
  actor: TicketUser,
  message: string,
  action: string,
  offsetHours: number
): TicketActivityItem {
  return {
    id,
    actor: {
      id: actor.id,
      fullName: actor.fullName,
      role: actor.role,
    },
    action,
    message,
    createdAt: new Date(now - offsetHours * 60 * 60 * 1000).toISOString(),
  };
}

function attachment(id: string, uploader: TicketUser, name: string): TicketAttachment {
  return {
    id,
    fileName: name.toLowerCase().replace(/\s+/g, "-"),
    originalName: name,
    mimeType: "application/pdf",
    size: 245760,
    url: "#",
    uploadedAt: new Date(now - 4 * 60 * 60 * 1000).toISOString(),
    uploadedBy: {
      id: uploader.id,
      fullName: uploader.fullName,
      role: uploader.role,
    },
  };
}

export const initialMockTicketingData: TicketingMockDatabase = {
  users,
  tickets: [
    {
      id: "ticket-1",
      ticketId: "TCK-20260416-0001",
      title: "Air conditioning failure in library reading room",
      description:
        "Cooling stopped in the afternoon and students are reporting discomfort in the quiet study zone.",
      type: "MAINTENANCE",
      priority: "HIGH",
      category: "HVAC",
      status: "IN_PROGRESS",
      location: {
        building: "Learning Commons",
        floor: "2",
        room: "L-204",
        campus: "Main Campus",
        note: "Near the east windows",
      },
      reporter: users[3],
      assignedTechnician: users[1],
      slaHours: 8,
      dueAt: new Date(now + 2 * 60 * 60 * 1000).toISOString(),
      overdue: false,
      attachments: [attachment("att-1", users[3], "thermostat-photo.pdf")],
      comments: [
        comment("com-1", users[3], "Students are being moved to adjacent desks.", 6),
      ],
      activity: [
        activity("act-1", users[3], "Ticket created.", "TICKET_CREATED", 8),
        activity("act-2", users[0], "Liam Chen was assigned.", "TECHNICIAN_ASSIGNED", 7),
      ],
      createdAt: new Date(now - 8 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "ticket-2",
      ticketId: "TCK-20260416-0002",
      title: "Water leak from ceiling in chemistry lab",
      description: "Leak continues after rain and equipment has been powered down.",
      type: "INCIDENT",
      priority: "CRITICAL",
      category: "Plumbing",
      status: "OPEN",
      location: {
        building: "Science Block",
        floor: "1",
        room: "CHEM-107",
        campus: "Main Campus",
      },
      reporter: users[3],
      assignedTechnician: null,
      slaHours: 4,
      dueAt: new Date(now - 90 * 60 * 1000).toISOString(),
      overdue: true,
      attachments: [],
      comments: [],
      activity: [activity("act-3", users[3], "Ticket created.", "TICKET_CREATED", 5)],
      createdAt: new Date(now - 5 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now - 5 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "ticket-3",
      ticketId: "TCK-20260415-0003",
      title: "Projector lamp replacement for seminar hall",
      description: "Projector brightness is too low during lectures.",
      type: "MAINTENANCE",
      priority: "MEDIUM",
      category: "AV Equipment",
      status: "RESOLVED",
      location: {
        building: "Innovation Center",
        floor: "Ground",
        room: "Hall A",
        campus: "City Campus",
      },
      reporter: users[3],
      assignedTechnician: users[1],
      slaHours: 24,
      dueAt: new Date(now - 12 * 60 * 60 * 1000).toISOString(),
      overdue: false,
      resolvedAt: new Date(now - 10 * 60 * 60 * 1000).toISOString(),
      attachments: [],
      comments: [
        comment("com-2", users[1], "Lamp replaced and calibration completed.", 11),
      ],
      activity: [
        activity("act-4", users[3], "Ticket created.", "TICKET_CREATED", 26),
        activity("act-5", users[1], "Ticket resolved.", "STATUS_CHANGED", 10),
      ],
      createdAt: new Date(now - 26 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now - 10 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "ticket-4",
      ticketId: "TCK-20260414-0004",
      title: "Network outage in admissions office",
      description: "Staff cannot access shared drives or the admissions CRM.",
      type: "INCIDENT",
      priority: "HIGH",
      category: "Networking",
      status: "ON_HOLD",
      location: {
        building: "Admin Block",
        floor: "3",
        room: "A-312",
        campus: "Main Campus",
      },
      reporter: users[3],
      assignedTechnician: users[2],
      slaHours: 8,
      dueAt: new Date(now + 6 * 60 * 60 * 1000).toISOString(),
      overdue: false,
      attachments: [],
      comments: [
        comment("com-3", users[2], "Waiting on ISP confirmation for upstream issue.", 15),
      ],
      activity: [
        activity("act-6", users[3], "Ticket created.", "TICKET_CREATED", 18),
        activity("act-7", users[2], "Ticket put on hold.", "STATUS_CHANGED", 15),
      ],
      createdAt: new Date(now - 18 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now - 15 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "ticket-5",
      ticketId: "TCK-20260412-0005",
      title: "Broken card reader at west gate",
      description: "Staff access is delayed because the card reader is not responding.",
      type: "INCIDENT",
      priority: "MEDIUM",
      category: "Access Control",
      status: "CLOSED",
      location: {
        building: "West Gate",
        room: "Entry Point 2",
        campus: "Main Campus",
      },
      reporter: users[3],
      assignedTechnician: users[2],
      slaHours: 24,
      dueAt: new Date(now - 70 * 60 * 60 * 1000).toISOString(),
      overdue: false,
      resolvedAt: new Date(now - 60 * 60 * 60 * 1000).toISOString(),
      closedAt: new Date(now - 58 * 60 * 60 * 1000).toISOString(),
      attachments: [],
      comments: [],
      activity: [activity("act-8", users[2], "Reader firmware updated.", "STATUS_CHANGED", 58)],
      createdAt: new Date(now - 80 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now - 58 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "ticket-6",
      ticketId: "TCK-20260410-0006",
      title: "Cleaning request after maintenance work in lecture hall",
      description: "Dust and debris remain after cable trunking replacement.",
      type: "MAINTENANCE",
      priority: "LOW",
      category: "Cleaning",
      status: "OPEN",
      location: {
        building: "Lecture Hall Complex",
        floor: "1",
        room: "LH-102",
        campus: "City Campus",
      },
      reporter: users[3],
      assignedTechnician: null,
      slaHours: 72,
      dueAt: new Date(now + 40 * 60 * 60 * 1000).toISOString(),
      overdue: false,
      attachments: [],
      comments: [],
      activity: [activity("act-9", users[3], "Ticket created.", "TICKET_CREATED", 90)],
      createdAt: new Date(now - 90 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now - 90 * 60 * 60 * 1000).toISOString(),
    },
  ],
};
