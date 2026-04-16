import { Ticket } from "../models/Ticket.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getReports = asyncHandler(async (_req, res) => {
  const [categoryBreakdown, technicianWorkload, slaCompliance, typeBreakdown] =
    await Promise.all([
      Ticket.aggregate([
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Ticket.aggregate([
        {
          $group: {
            _id: "$assignedTechnician.fullName",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),
      Ticket.aggregate([
        {
          $group: {
            _id: "$overdue",
            count: { $sum: 1 },
          },
        },
      ]),
      Ticket.aggregate([
        { $group: { _id: "$type", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

  const closedTickets = await Ticket.find({
    status: { $in: ["RESOLVED", "CLOSED"] },
    resolvedAt: { $ne: null },
  }).lean();

  const averageResolutionHours =
    closedTickets.length === 0
      ? 0
      : Math.round(
          closedTickets.reduce((sum, ticket) => {
            const started = new Date(ticket.createdAt).getTime();
            const finished = new Date(ticket.resolvedAt ?? ticket.closedAt).getTime();
            return sum + (finished - started) / (1000 * 60 * 60);
          }, 0) / closedTickets.length
        );

  res.json({
    summary: {
      averageResolutionHours,
      slaBreachedTickets: slaCompliance.find((item) => item._id === true)?.count ?? 0,
      slaMetTickets: slaCompliance.find((item) => item._id === false)?.count ?? 0,
    },
    categoryBreakdown,
    technicianWorkload: technicianWorkload.filter((item) => item._id),
    typeBreakdown,
  });
});
