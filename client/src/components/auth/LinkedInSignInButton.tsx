import { useEffect, useRef, useState } from "react";
import {
  apiFetch,
  authApiBaseUrl,
  parseResponsePayload,
  setPendingAuthPersistencePreference,
} from "../../lib/auth";
import SocialSignInButton from "./SocialSignInButton";
import { LinkedInBrandIcon } from "./SocialBrandIcons";

type LinkedInSignInButtonProps = {
  disabled?: boolean;
  keepUserSignedIn?: boolean;
  onError: (message: string) => void;
  source?: "signin" | "signup";
};

type AuthConfigResponse = {
  linkedinSignInEnabled?: boolean;
};

const loadingStatusMessage = "Checking LinkedIn sign-in configuration...";

export default function LinkedInSignInButton({
  disabled = false,
  keepUserSignedIn = false,
  onError,
  source = "signin",
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
    authorizeUrl.searchParams.set("source", source);
    window.location.replace(authorizeUrl.toString());
  };

  const isLoadingStatus = statusMessage === loadingStatusMessage;

  return (
    <SocialSignInButton
      label={
        isRedirecting ? "Redirecting to LinkedIn..." : "Continue with LinkedIn"
      }
      icon={<LinkedInBrandIcon className="h-5 w-5" />}
      onClick={handleLinkedInSignIn}
      disabled={disabled || isRedirecting}
      isEnabled={isEnabled}
      statusMessage={statusMessage}
      isLoadingStatus={isLoadingStatus}
    />
  );
}
