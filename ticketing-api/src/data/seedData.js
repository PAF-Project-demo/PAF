export const seedUsers = [
  {
    fullName: "Ava Morgan",
    email: "admin@paf.local",
    password: "Admin123!",
    role: "ADMIN",
    department: "Operations",
    skills: ["dispatching", "governance"],
  },
  {
    fullName: "Liam Chen",
    email: "tech@paf.local",
    password: "Tech123!",
    role: "TECHNICIAN",
    department: "Facilities",
    skills: ["electrical", "hvac"],
  },
  {
    fullName: "Mia Fernandez",
    email: "user@paf.local",
    password: "User123!",
    role: "USER",
    department: "Student Services",
    skills: [],
  },
];

export const seedTicketBlueprints = [
  {
    title: "Air conditioning failure in library reading room",
    description:
      "Cooling stopped at 10:15 AM and the temperature is rising quickly in the quiet study section.",
    type: "MAINTENANCE",
    priority: "HIGH",
    category: "Air Conditioning",
    status: "IN_PROGRESS",
    location: {
      building: "Learning Commons",
      floor: "2",
      room: "L-204",
      campus: "Main Campus",
      note: "Near the east window bank.",
    },
    slaHours: 8,
    comments: [
      {
        message: "Students have been redirected to adjacent desks for now.",
      },
    ],
  },
  {
    title: "Water leak from ceiling in chemistry lab",
    description:
      "Steady drip observed over bench C3 after rainfall. Equipment has been powered down.",
    type: "INCIDENT",
    priority: "CRITICAL",
    category: "Water / Plumbing",
    status: "OPEN",
    location: {
      building: "Science Block",
      floor: "1",
      room: "CHEM-107",
      campus: "Main Campus",
      note: "Ceiling panel above reagent storage.",
    },
    slaHours: 4,
    comments: [],
  },
  {
    title: "Projector lamp replacement for seminar hall",
    description:
      "Projector brightness is too low during presentations and likely needs a lamp replacement.",
    type: "MAINTENANCE",
    priority: "MEDIUM",
    category: "Classroom Equipment",
    status: "RESOLVED",
    location: {
      building: "Innovation Center",
      floor: "Ground",
      room: "Hall A",
      campus: "City Campus",
      note: "Front stage projector.",
    },
    slaHours: 24,
    comments: [
      {
        message: "Temporary spare projector already deployed for today's session.",
      },
    ],
  },
];
