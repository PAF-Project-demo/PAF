import { FormEvent, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import GoogleSignInButton from "./GoogleSignInButton";
import GitHubSignInButton from "./GitHubSignInButton";
import LinkedInSignInButton from "./LinkedInSignInButton";
import LoadingIndicator from "../common/LoadingIndicator";
import { useNotification } from "../common/NotificationProvider";
import {
  apiFetch,
  buildAuthSession,
  formatRoleLabel,
  getApiMessage,
  parseResponsePayload,
  persistAuthSession,
  type AuthApiResponse,
} from "../../lib/auth";

type FormData = {
  email: string;
  password: string;
};

type FormErrors = {
  email?: string;
  password?: string;
};

const initialFormData: FormData = {
  email: "",
  password: "",
};

const resolveSocialSuccessTitle = (providerLabel: string, message: string) => {
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

export default function SignUpForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showNotification } = useNotification();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [linkedinError, setLinkedinError] = useState("");
  const [githubError, setGithubError] = useState("");
  const [googleError, setGoogleError] = useState("");
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const isAuthenticating = isSubmitting || isGoogleSubmitting;
  const loadingLabel = isGoogleSubmitting
    ? "Continuing with Google"
    : "Creating your account";
  const loadingDescription = isGoogleSubmitting
    ? "Please wait while we verify your Google account."
    : "Please wait while we create your account.";

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const linkedInErrorMessage = searchParams.get("linkedinError");
    const gitHubErrorMessage = searchParams.get("githubError");

    const socialError =
      typeof linkedInErrorMessage === "string" && linkedInErrorMessage.trim()
        ? {
            message: linkedInErrorMessage.trim(),
            title: "LinkedIn sign-up failed",
            clearSocialError: () => setLinkedinError(""),
          }
        : typeof gitHubErrorMessage === "string" && gitHubErrorMessage.trim()
        ? {
            message: gitHubErrorMessage.trim(),
            title: "GitHub sign-up failed",
            clearSocialError: () => setGithubError(""),
          }
        : null;

    if (!socialError) {
      return;
    }

    setServerError(socialError.message);
    setLinkedinError("");
    setGithubError("");
    setGoogleError("");
    socialError.clearSocialError();
    showNotification({
      variant: "error",
      title: socialError.title,
      message: socialError.message,
    });
    navigate("/signup", {
      replace: true,
    });
  }, [location.search, navigate, showNotification]);

  const validateForm = () => {
    const nextErrors: FormErrors = {};

    if (!formData.email.trim()) {
      nextErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      nextErrors.email = "Enter a valid email address";
    }

    if (!formData.password) {
      nextErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      nextErrors.password = "Password must be at least 6 characters";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => ({
      ...current,
      [field]: undefined,
    }));
    setLinkedinError("");
    setGithubError("");
    setGoogleError("");
    setServerError("");
  };

  const completeSocialAuthentication = (
    payload: Partial<AuthApiResponse> & { message?: string },
    providerLabel: string
  ) => {
    const authSession = buildAuthSession(payload);

    if (!authSession) {
      const message = "The server response was missing account details.";
      setServerError(message);
      showNotification({
        variant: "error",
        title: `${providerLabel} authentication failed`,
        message,
      });
      return false;
    }

    persistAuthSession(authSession, false);
    setFormData(initialFormData);
    setErrors({});
    setShowPassword(false);
    setServerError("");
    setLinkedinError("");
    setGithubError("");
    setGoogleError("");

    const responseMessage = getApiMessage(
      payload,
      `Signed in with ${providerLabel} successfully.`
    );
    const notificationMessage =
      typeof payload.role === "string" && payload.role.trim()
        ? `${responseMessage} Access level: ${formatRoleLabel(payload.role)}.`
        : responseMessage;

    showNotification({
      variant: "success",
      title: resolveSocialSuccessTitle(providerLabel, responseMessage),
      message: notificationMessage,
    });
    navigate("/", { replace: true });
    return true;
  };

  const handleGoogleSignUp = async (credential: string) => {
    setServerError("");
    setLinkedinError("");
    setGithubError("");
    setGoogleError("");
    setIsGoogleSubmitting(true);

    try {
      const response = await apiFetch("/api/auth/google", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          credential,
        }),
      });

      const rawResponse = await response.text();
      const payload = parseResponsePayload<
        Partial<AuthApiResponse> & { message?: string }
      >(rawResponse);

      if (!response.ok) {
        const message = getApiMessage(
          payload,
          "Unable to continue with Google right now."
        );
        setServerError(message);
        showNotification({
          variant: "error",
          title: "Google authentication failed",
          message,
        });
        return;
      }

      if (!payload) {
        const message = "The server returned an empty response.";
        setServerError(message);
        showNotification({
          variant: "error",
          title: "Google authentication failed",
          message,
        });
        return;
      }

      completeSocialAuthentication(payload, "Google");
    } catch {
      const message =
        "Cannot reach the server. Make sure Spring Boot is running.";
      setServerError(message);
      showNotification({
        variant: "error",
        title: "Google authentication failed",
        message,
      });
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setServerError("");
    setLinkedinError("");
    setGithubError("");
    setGoogleError("");

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    const trimmedEmail = formData.email.trim();

    try {
      const response = await apiFetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: trimmedEmail,
          password: formData.password,
        }),
      });

      const rawResponse = await response.text();
      const payload = parseResponsePayload<{ message?: string }>(rawResponse);

      if (!response.ok) {
        const message = getApiMessage(
          payload,
          "Unable to create your account right now."
        );
        setServerError(message);
        showNotification({
          variant: "error",
          title: "Sign-up failed",
          message,
        });
        return;
      }

      const message = getApiMessage(
        payload,
        "Account created successfully. Sign in with your new account."
      );
      setFormData(initialFormData);
      setErrors({});
      setShowPassword(false);
      showNotification({
        variant: "success",
        title: "Account created",
        message,
      });
      navigate("/signin", {
        replace: true,
        state: {
          email: trimmedEmail,
        },
      });
    } catch {
      const message =
        "Cannot reach the server. Make sure Spring Boot is running.";
      setServerError(message);
      showNotification({
        variant: "error",
        title: "Sign-up failed",
        message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col w-full overflow-y-auto no-scrollbar">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
        <div className="relative" aria-busy={isAuthenticating}>
          {isAuthenticating ? (
            <div className="absolute inset-0 z-20 flex items-center justify-center rounded-3xl bg-white/85 px-6 backdrop-blur-sm dark:bg-gray-900/85">
              <LoadingIndicator
                layout="stacked"
                size="lg"
                label={loadingLabel}
                description={loadingDescription}
              />
            </div>
          ) : null}

          <div
            className={
              isAuthenticating ? "pointer-events-none select-none opacity-60" : ""
            }
          >
            <div className="mb-5 sm:mb-8">
              <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
                Sign Up
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Create your account with your email and password, or continue
                with Google, LinkedIn, or GitHub.
              </p>
            </div>

           

            {linkedinError || githubError || googleError ? (
              <p className="mt-3 text-xs text-error-600 dark:text-error-400">
                {linkedinError || githubError || googleError}
              </p>
            ) : (
              <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
              </p>
            )}

        

            <form onSubmit={handleSubmit}>
              <div className="space-y-5">
                <div>
                  <Label htmlFor="email">
                    Email<span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={(event) => handleChange("email", event.target.value)}
                    placeholder="Enter your email"
                    disabled={isAuthenticating}
                    error={Boolean(errors.email)}
                    hint={errors.email}
                  />
                </div>

                <div>
                  <Label htmlFor="password">
                    Password<span className="text-error-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={(event) =>
                        handleChange("password", event.target.value)
                      }
                      placeholder="Create a password"
                      disabled={isAuthenticating}
                      error={Boolean(errors.password)}
                      hint={errors.password}
                    />
                    <span
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute right-4 top-1/2 z-30 -translate-y-1/2 cursor-pointer"
                    >
                      {showPassword ? (
                        <EyeIcon className="size-5 fill-gray-500 dark:fill-gray-400" />
                      ) : (
                        <EyeCloseIcon className="size-5 fill-gray-500 dark:fill-gray-400" />
                      )}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Use at least 6 characters for your password.
                  </p>
                </div>

                {serverError ? (
                  <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
                    {serverError}
                  </div>
                ) : null}

                <Button
                  className="w-full"
                  size="sm"
                  disabled={isAuthenticating}
                  startIcon={
                    isSubmitting ? (
                      <LoadingIndicator size="sm" tone="inverse" />
                    ) : undefined
                  }
                >
                  {isSubmitting ? "Creating account" : "Create account"}
                </Button>
              </div>
            </form>

            <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                Already have an account?{" "}
                <Link
                  to="/signin"
                  className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Sign In
                </Link>
              </p>
            </div>
    <div className="relative py-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white p-2 text-gray-400 dark:bg-gray-900 sm:px-5 sm:py-2">
                  Or
                </span>
              </div>
            </div>
             <div className="space-y-3">
              <GoogleSignInButton
                disabled={isAuthenticating}
                onCredential={handleGoogleSignUp}
                onError={setGoogleError}
              />
              <LinkedInSignInButton
                disabled={isAuthenticating}
                onError={setLinkedinError}
                source="signup"
              />
              <GitHubSignInButton
                disabled={isAuthenticating}
                onError={setGithubError}
                source="signup"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
