import { useEffect, useRef, useState } from "react";
import {
  apiFetch,
  authApiBaseUrl,
  parseResponsePayload,
  setPendingAuthPersistencePreference,
} from "../../lib/auth";
import SocialSignInButton from "./SocialSignInButton";
import { GitHubBrandIcon } from "./SocialBrandIcons";

type GitHubSignInButtonProps = {
  disabled?: boolean;
  keepUserSignedIn?: boolean;
  onError: (message: string) => void;
  source?: "signin" | "signup";
};

type AuthConfigResponse = {
  githubSignInEnabled?: boolean;
};

const loadingStatusMessage = "Checking GitHub sign-in configuration...";

export default function GitHubSignInButton({
  disabled = false,
  keepUserSignedIn = false,
  onError,
  source = "signin",
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
    authorizeUrl.searchParams.set("source", source);
    window.location.replace(authorizeUrl.toString());
  };

  const isLoadingStatus = statusMessage === loadingStatusMessage;

  return (
    <SocialSignInButton
      label={isRedirecting ? "Redirecting to GitHub..." : "Continue with GitHub"}
      icon={<GitHubBrandIcon className="h-5 w-5 text-gray-950 dark:text-white" />}
      onClick={handleGitHubSignIn}
      disabled={disabled || isRedirecting}
      isEnabled={isEnabled}
      statusMessage={statusMessage}
      isLoadingStatus={isLoadingStatus}
    />
  );
}
