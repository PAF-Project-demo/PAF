interface TicketSummaryCardProps {
  label: string;
  value: string | number;
  description: string;
}

export default function TicketSummaryCard({
  label,
  value,
  description,
}: TicketSummaryCardProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-gray-900 dark:text-white">{value}</p>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{description}</p>
    </div>
  );
}
