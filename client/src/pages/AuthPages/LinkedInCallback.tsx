import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import LoadingIndicator from "../../components/common/LoadingIndicator";
import { useNotification } from "../../components/common/NotificationProvider";
import AuthLayout from "./AuthPageLayout";
import {
  getStoredAuthSession,
  persistAuthSession,
  restoreAuthSessionFromServer,
} from "../../lib/auth";

let hasStartedLinkedInCallbackFlow = false;

export default function LinkedInCallback() {
  const [searchParams] = useSearchParams();
  const { showNotification } = useNotification();
  const [isProcessing, setIsProcessing] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const hasHandledCallback = useRef(false);

  useEffect(() => {
    if (hasHandledCallback.current || hasStartedLinkedInCallbackFlow) {
      return;
    }

    hasHandledCallback.current = true;
    hasStartedLinkedInCallbackFlow = true;

    const status = searchParams.get("status")?.trim().toLowerCase() ?? "";
    const message = searchParams.get("message")?.trim() ?? "";
    const rememberUser = searchParams.get("remember") === "true";
    const existingSession = getStoredAuthSession();

    if (status === "success" && existingSession) {
      window.location.replace("/");
      return;
    }

    if (status !== "success") {
      const nextErrorMessage = message || "LinkedIn sign-in was not completed.";
      setErrorMessage(nextErrorMessage);
      setIsProcessing(false);
      hasStartedLinkedInCallbackFlow = false;
      showNotification({
        variant: "error",
        title: "LinkedIn sign-in failed",
        message: nextErrorMessage,
      });
      return;
    }

    let isCancelled = false;

    const completeLinkedInSignIn = async () => {
      try {
        const authSession = await restoreAuthSessionFromServer();

        if (!authSession) {
          throw new Error(
            "LinkedIn sign-in completed, but the session could not be restored."
          );
        }

        if (isCancelled) {
          return;
        }

        persistAuthSession(authSession, rememberUser);
        showNotification({
          variant: "success",
          title: "LinkedIn sign-in successful",
          message: message || "Signed in with LinkedIn successfully.",
        });
        window.location.replace("/");
      } catch (error) {
        if (isCancelled) {
          return;
        }

        hasStartedLinkedInCallbackFlow = false;
        const nextErrorMessage =
          error instanceof Error && error.message
            ? error.message
            : "Unable to complete LinkedIn sign-in.";
        setErrorMessage(nextErrorMessage);
        showNotification({
          variant: "error",
          title: "LinkedIn sign-in failed",
          message: nextErrorMessage,
        });
      } finally {
        if (!isCancelled) {
          setIsProcessing(false);
        }
      }
    };

    void completeLinkedInSignIn();

    return () => {
      isCancelled = true;
    };
  }, [searchParams, showNotification]);

  return (
    <>
      <PageMeta
        title="EduNexus"
        description="EduNexus - Student Management System"
      />
      <AuthLayout>
        <div className="flex min-h-full flex-1 items-center justify-center">
          <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-8 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03]">
            {isProcessing ? (
              <LoadingIndicator
                layout="stacked"
                size="lg"
                label="Completing LinkedIn sign-in"
                description="Please wait while we restore your secure session."
              />
            ) : (
              <div className="space-y-4 text-center">
                <div>
                  <h1 className="text-xl font-semibold text-gray-800 dark:text-white/90">
                    LinkedIn sign-in could not be completed
                  </h1>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    {errorMessage || "Please try again from the sign-in page."}
                  </p>
                </div>
                <Link
                  to="/signin"
                  className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600"
                >
                  Back to sign in
                </Link>
              </div>
            )}
          </div>
        </div>
      </AuthLayout>
    </>
  );
}
