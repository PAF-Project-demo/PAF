export function buildTicketId(sequenceNumber = 1) {
  const now = new Date();
  const datePart = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");

  return `TCK-${datePart}-${String(sequenceNumber).padStart(4, "0")}`;
}
