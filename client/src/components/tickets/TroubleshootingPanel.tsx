import type { TroubleshootingTip } from "../../lib/ticketing/troubleshooting";

interface TroubleshootingPanelProps {
  tips: TroubleshootingTip[];
}

export default function TroubleshootingPanel({
  tips,
}: TroubleshootingPanelProps) {
  return (
    <div className="rounded-[28px] border border-amber-200 bg-[radial-gradient(circle_at_top_right,_rgba(251,191,36,0.20),_transparent_35%),linear-gradient(135deg,_#fff9eb,_#fffef8)] p-6 dark:border-amber-500/20 dark:bg-[radial-gradient(circle_at_top_right,_rgba(251,191,36,0.14),_transparent_30%),linear-gradient(135deg,_rgba(38,38,38,0.98),_rgba(24,24,27,0.95))]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-600 dark:text-amber-300">
            Quick Fixes
          </p>
          <h3 className="mt-2 text-xl font-semibold text-gray-900 dark:text-white">
            Maintenance Tips
          </h3>
          <p className="mt-2 max-w-2xl text-sm text-gray-600 dark:text-gray-300">
            Live suggestions based on the ticket title, category, and description.
            They are meant to help with simple checks before dispatch, not replace a
            formal ticket.
          </p>
        </div>
        <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-amber-700 shadow-sm ring-1 ring-amber-200 dark:bg-white/5 dark:text-amber-300 dark:ring-amber-500/20">
          Smart hints
        </span>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
        {tips.map((tip) => (
          <div
            key={tip.id}
            className="rounded-2xl border border-white/70 bg-white/75 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.03]"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-300">
                  {tip.matchLabel}
                </p>
                <h4 className="mt-2 text-base font-semibold text-gray-900 dark:text-white">
                  {tip.title}
                </h4>
              </div>
            </div>

            <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-300">
              {tip.summary}
            </p>

            <div className="mt-4 space-y-2">
              {tip.steps.map((step, index) => (
                <div key={`${tip.id}-${index}`} className="flex gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                    {index + 1}
                  </span>
                  <p className="text-sm text-gray-700 dark:text-gray-200">{step}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
              <span className="font-semibold">Escalate when:</span> {tip.whenToEscalate}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
