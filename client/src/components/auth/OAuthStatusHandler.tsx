import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { useAuthSession } from "../../context/AuthSessionContext";
import { useNotification } from "../common/NotificationProvider";

const handledOAuthFlashStorageKey = "paf.auth.oauth-flash";

const toProviderLabel = (provider: string) => {
  switch (provider.trim().toLowerCase()) {
    case "linkedin":
      return "LinkedIn";
    case "github":
      return "GitHub";
    case "google":
      return "Google";
    default:
      return "Social";
  }
};

const resolveSuccessTitle = (providerLabel: string, message: string) => {
  const normalizedMessage = message.trim().toLowerCase();

  if (
    normalizedMessage.includes("account connected") ||
    normalizedMessage.includes("account created") ||
    normalizedMessage.includes("sign-up")
  ) {
    return `${providerLabel} sign-up successful`;
  }

  return `${providerLabel} sign-in successful`;
};

export default function OAuthStatusHandler() {
  const location = useLocation();
  const navigate = useNavigate();
  const { authSession, isAuthReady } = useAuthSession();
  const { showNotification } = useNotification();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const authStatus = searchParams.get("authStatus")?.trim().toLowerCase() ?? "";

    if (!authStatus) {
      window.sessionStorage.removeItem(handledOAuthFlashStorageKey);
      return;
    }

    if (authStatus !== "success" || !isAuthReady || !authSession) {
      return;
    }

    const flashSignature = `${location.pathname}${location.search}`;
    if (
      window.sessionStorage.getItem(handledOAuthFlashStorageKey) ===
      flashSignature
    ) {
      return;
    }

    const providerLabel = toProviderLabel(
      searchParams.get("authProvider") ?? ""
    );
    const message =
      searchParams.get("authMessage")?.trim() ??
      "Social sign-in completed successfully.";

    window.sessionStorage.setItem(handledOAuthFlashStorageKey, flashSignature);
    showNotification({
      variant: "success",
      title: resolveSuccessTitle(providerLabel, message),
      message,
    });
    navigate(
      {
        pathname: location.pathname,
        search: "",
        hash: location.hash,
      },
      { replace: true }
    );
  }, [
    authSession,
    isAuthReady,
    location.hash,
    location.pathname,
    location.search,
    navigate,
    showNotification,
  ]);

  return null;
}
