import { Ticket } from "../models/Ticket.js";
import { asyncHandler } from "../utils/asyncHandler.js";

function getAccessMatch(user) {
  if (user.role === "USER") {
    return { "reporter.userId": user._id };
  }

  return {};
}

export const getDashboardSummary = asyncHandler(async (req, res) => {
  const accessMatch = getAccessMatch(req.user);

  const [statusBreakdown, priorityBreakdown, overdueCount, totalTickets, recentTickets] =
    await Promise.all([
      Ticket.aggregate([
        { $match: accessMatch },
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Ticket.aggregate([
        { $match: accessMatch },
        { $group: { _id: "$priority", count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Ticket.countDocuments({ ...accessMatch, overdue: true }),
      Ticket.countDocuments(accessMatch),
      Ticket.find(accessMatch).sort({ createdAt: -1 }).limit(5).lean(),
    ]);

  const monthlyTrend = await Ticket.aggregate([
    { $match: accessMatch },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        created: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  const openCount = statusBreakdown
    .filter((item) => ["OPEN", "IN_PROGRESS", "ON_HOLD"].includes(item._id))
    .reduce((sum, item) => sum + item.count, 0);

  res.json({
    cards: {
      totalTickets,
      openTickets: openCount,
      overdueTickets: overdueCount,
      resolvedRate:
        totalTickets === 0
          ? 0
          : Math.round(
              ((statusBreakdown.find((item) => item._id === "RESOLVED")?.count ?? 0) /
                totalTickets) *
                100
            ),
    },
    charts: {
      statusBreakdown,
      priorityBreakdown,
      monthlyTrend: monthlyTrend.map((item) => ({
        label: `${item._id.year}-${String(item._id.month).padStart(2, "0")}`,
        created: item.created,
      })),
    },
    recentTickets,
  });
});
