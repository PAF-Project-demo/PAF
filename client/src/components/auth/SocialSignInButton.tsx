import type { ReactNode } from "react";
import LoadingIndicator from "../common/LoadingIndicator";

type SocialSignInButtonProps = {
  label: string;
  icon: ReactNode;
  disabled?: boolean;
  isEnabled?: boolean;
  onClick?: () => void;
  overlay?: ReactNode;
  statusMessage?: string;
  isLoadingStatus?: boolean;
};

const buttonShellClasses =
  "flex h-10 w-full items-center rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-gray-800 shadow-sm transition dark:border-gray-800 dark:bg-white/[0.03] dark:text-white/90";

const interactiveButtonClasses =
  "hover:border-gray-300 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30 dark:hover:border-gray-700 dark:hover:bg-white/[0.06]";

const disabledButtonClasses = "cursor-not-allowed opacity-60";

const renderButtonContent = (label: string, icon: ReactNode) => (
  <div className="grid w-full grid-cols-[2rem_minmax(0,1fr)_2rem] items-center gap-3">
    <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white">
      {icon}
    </span>
    <span className="truncate text-center">{label}</span>
    <span aria-hidden="true" className="h-8 w-8" />
  </div>
);

export default function SocialSignInButton({
  label,
  icon,
  disabled = false,
  isEnabled = true,
  onClick,
  overlay,
  statusMessage = "",
  isLoadingStatus = false,
}: SocialSignInButtonProps) {
  const isDisabled = disabled || !isEnabled;
  const buttonContent = renderButtonContent(label, icon);
  const resolvedShellClassName = `${buttonShellClasses} ${
    isDisabled ? disabledButtonClasses : interactiveButtonClasses
  }`;

  return (
    <div className="w-full">
      {overlay ? (
        <div
          className={`relative ${isDisabled ? "pointer-events-none" : ""} ${
            isDisabled ? "" : "cursor-pointer"
          }`}
        >
          <div aria-hidden="true" className={resolvedShellClassName}>
            {buttonContent}
          </div>
          <div className="absolute inset-0 z-10 overflow-hidden rounded-xl opacity-0">
            {overlay}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={onClick}
          disabled={isDisabled}
          className={resolvedShellClassName}
        >
          {buttonContent}
        </button>
      )}

      {statusMessage ? (
        <div className="mt-2 flex min-h-10 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-500 dark:border-gray-800 dark:bg-white/5 dark:text-gray-400">
          {isLoadingStatus ? (
            <LoadingIndicator label={statusMessage} size="sm" />
          ) : (
            statusMessage
          )}
        </div>
      ) : null}
    </div>
  );
}
