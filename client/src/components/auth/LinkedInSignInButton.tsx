import { useEffect, useRef, useState } from "react";
import {
  apiFetch,
  authApiBaseUrl,
  parseResponsePayload,
  setPendingAuthPersistencePreference,
} from "../../lib/auth";
import LoadingIndicator from "../common/LoadingIndicator";

type LinkedInSignInButtonProps = {
  disabled?: boolean;
  keepUserSignedIn?: boolean;
  onError: (message: string) => void;
};

type AuthConfigResponse = {
  linkedinSignInEnabled?: boolean;
};

const loadingStatusMessage = "Checking LinkedIn sign-in configuration...";

export default function LinkedInSignInButton({
  disabled = false,
  keepUserSignedIn = false,
  onError,
}: LinkedInSignInButtonProps) {
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

        if (payload?.linkedinSignInEnabled) {
          setIsEnabled(true);
          setStatusMessage("");
          return;
        }

        setIsEnabled(false);
        setStatusMessage("LinkedIn sign-in is unavailable.");
        onErrorRef.current(
          "LinkedIn sign-in is not configured. Add LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET, and LINKEDIN_REDIRECT_URI to server/.env."
        );
      })
      .catch(() => {
        if (!isCancelled) {
          setIsEnabled(false);
          setStatusMessage("LinkedIn sign-in is unavailable.");
          onErrorRef.current(
            "Unable to load LinkedIn sign-in settings from the server."
          );
        }
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  const handleLinkedInSignIn = () => {
    if (disabled || !isEnabled || isRedirecting) {
      return;
    }

    onErrorRef.current("");
    setIsRedirecting(true);
    setPendingAuthPersistencePreference(keepUserSignedIn);

    const authorizeUrl = new URL("/api/auth/linkedin/authorize", authApiBaseUrl);
    authorizeUrl.searchParams.set("remember", String(keepUserSignedIn));
    window.location.replace(authorizeUrl.toString());
  };

  const isLoadingStatus = statusMessage === loadingStatusMessage;

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleLinkedInSignIn}
        disabled={disabled || !isEnabled || isRedirecting}
        className={`flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-[#0A66C2] bg-white px-4 text-sm font-medium text-[#0A66C2] transition hover:bg-[#F3F8FE] disabled:cursor-not-allowed dark:bg-transparent ${
          disabled || !isEnabled || isRedirecting ? "opacity-60" : ""
        }`}
      >
        <span className="flex size-6 items-center justify-center rounded bg-[#0A66C2] text-xs font-bold uppercase text-white">
          in
        </span>
        <span>
          {isRedirecting ? "Redirecting to LinkedIn..." : "Continue with LinkedIn"}
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
