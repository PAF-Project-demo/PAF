import { useEffect, useRef, useState } from "react";
import {
  apiFetch,
  authApiBaseUrl,
  parseResponsePayload,
  setPendingAuthPersistencePreference,
} from "../../lib/auth";
import LoadingIndicator from "../common/LoadingIndicator";

type GitHubSignInButtonProps = {
  disabled?: boolean;
  keepUserSignedIn?: boolean;
  onError: (message: string) => void;
};

type AuthConfigResponse = {
  githubSignInEnabled?: boolean;
};

const loadingStatusMessage = "Checking GitHub sign-in configuration...";

export default function GitHubSignInButton({
  disabled = false,
  keepUserSignedIn = false,
  onError,
}: GitHubSignInButtonProps) {
  const onErrorRef = useRef(onError);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(loadingStatusMessage);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    let isCancelled = false;

    apiFetch("/api/auth/config")
      .then(async (response) => {
        const rawResponse = await response.text();
        const payload = parseResponsePayload<AuthConfigResponse>(rawResponse);

        if (!response.ok) {
          throw new Error("Unable to load auth configuration.");
        }

        if (isCancelled) {
          return;
        }

        if (payload?.githubSignInEnabled) {
          setIsEnabled(true);
          setStatusMessage("");
          return;
        }

        setIsEnabled(false);
        setStatusMessage("GitHub sign-in is unavailable.");
        onErrorRef.current(
          "GitHub sign-in is not configured. Add GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, and GITHUB_REDIRECT_URI to server/.env."
        );
      })
      .catch(() => {
        if (!isCancelled) {
          setIsEnabled(false);
          setStatusMessage("GitHub sign-in is unavailable.");
          onErrorRef.current(
            "Unable to load GitHub sign-in settings from the server."
          );
        }
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  const handleGitHubSignIn = () => {
    if (disabled || !isEnabled || isRedirecting) {
      return;
    }

    onErrorRef.current("");
    setIsRedirecting(true);
    setPendingAuthPersistencePreference(keepUserSignedIn);

    const authorizeUrl = new URL("/api/auth/github/authorize", authApiBaseUrl);
    window.location.replace(authorizeUrl.toString());
  };

  const isLoadingStatus = statusMessage === loadingStatusMessage;

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleGitHubSignIn}
        disabled={disabled || !isEnabled || isRedirecting}
        className={`flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-gray-900 bg-gray-900 px-4 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed dark:border-white/10 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 ${
          disabled || !isEnabled || isRedirecting ? "opacity-60" : ""
        }`}
      >
        <span className="flex size-6 items-center justify-center rounded bg-white/15 text-xs font-bold uppercase dark:bg-gray-900/10">
          GH
        </span>
        <span>
          {isRedirecting ? "Redirecting to GitHub..." : "Continue with GitHub"}
        </span>
      </button>
      {statusMessage ? (
        <div className="mt-3 flex min-h-10 items-center justify-center rounded-lg border border-gray-200 bg-gray-100 px-4 text-sm text-gray-500 dark:border-gray-800 dark:bg-white/5 dark:text-gray-400">
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
