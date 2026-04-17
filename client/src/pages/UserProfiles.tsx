import { useCallback, useEffect, useState } from "react";
import LoadingIndicator from "../components/common/LoadingIndicator";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import { useNotification } from "../components/common/NotificationProvider";
import Badge from "../components/ui/badge/Badge";
import Button from "../components/ui/button/Button";
import { useAuthSession } from "../context/AuthSessionContext";
import { formatRoleLabel, getUserDisplayName, type AuthSession } from "../lib/auth";
import { getCurrentUserProfile, type UserProfile } from "../lib/profile";
import {
  formatTimestamp,
  getRoleBadgeColor,
  getUserInitials,
  normalizeRole,
  roleDescriptions,
} from "../lib/userRoles";

type ProfileFieldProps = {
  label: string;
  value: string;
  mono?: boolean;
  fullWidth?: boolean;
};

const providerLabelMap: Record<string, string> = {
  LOCAL: "Email & Password",
  GOOGLE: "Google",
  LINKEDIN: "LinkedIn",
  GITHUB: "GitHub",
};

const getProviderLabel = (provider?: string | null) => {
  const normalizedProvider =
    typeof provider === "string" && provider.trim()
      ? provider.trim().toUpperCase()
      : "LOCAL";

  return providerLabelMap[normalizedProvider] ?? normalizedProvider;
};

const buildFallbackProfile = (authSession: AuthSession): UserProfile => ({
  userId: authSession.userId,
  email: authSession.email,
  displayName: authSession.displayName ?? null,
  photoUrl: authSession.photoUrl ?? null,
  provider: authSession.provider ?? "LOCAL",
  role: authSession.role ?? "USER",
  createdAt: null,
  googleSubject: null,
  linkedinSubject: null,
  githubSubject: null,
});

function ProfileField({
  label,
  value,
  mono = false,
  fullWidth = false,
}: ProfileFieldProps) {
  return (
    <div className={fullWidth ? "lg:col-span-2" : ""}>
      <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
        {label}
      </p>
      <p
        className={`break-words text-sm font-medium text-gray-800 dark:text-white/90 ${
          mono ? "font-mono text-xs sm:text-sm" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

export default function UserProfiles() {
  const { authSession } = useAuthSession();
  const { showNotification } = useNotification();
  const [profile, setProfile] = useState<UserProfile | null>(
    authSession ? buildFallbackProfile(authSession) : null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadProfile = useCallback(
    async (showErrorToast = false) => {
      setIsLoading(true);

      try {
        const nextProfile = await getCurrentUserProfile();
        setProfile(nextProfile);
        setErrorMessage(null);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to load your profile right now.";

        setErrorMessage(message);

        if (showErrorToast) {
          showNotification({
            variant: "error",
            title: "Profile unavailable",
            message,
          });
        }
      } finally {
        setIsLoading(false);
      }
    },
    [showNotification]
  );

  useEffect(() => {
    if (!authSession) {
      return;
    }

    void loadProfile();
  }, [authSession, loadProfile]);

  if (!authSession) {
    return null;
  }

  const fallbackProfile = buildFallbackProfile(authSession);
  const activeProfile = profile ?? fallbackProfile;
  const normalizedRole = normalizeRole(activeProfile.role);
  const roleLabel = formatRoleLabel(activeProfile.role);
  const providerLabel = getProviderLabel(activeProfile.provider);
  const displayName = activeProfile.displayName?.trim() || getUserDisplayName(activeProfile.email);
  const storedDisplayName = activeProfile.displayName?.trim() || "Not set";
  const photoUrl = activeProfile.photoUrl?.trim() || "";
  const joinedLabel = formatTimestamp(activeProfile.createdAt);
  const providerIdentifiers = [
    activeProfile.googleSubject
      ? { label: "Google subject", value: activeProfile.googleSubject }
      : null,
    activeProfile.linkedinSubject
      ? { label: "LinkedIn subject", value: activeProfile.linkedinSubject }
      : null,
    activeProfile.githubSubject
      ? { label: "GitHub subject", value: activeProfile.githubSubject }
      : null,
  ].filter((item): item is { label: string; value: string } => item !== null);

  return (
    <>
      <PageMeta
        title="EduNexus"
        description="EduNexus - Student Management System"
      />
      <PageBreadcrumb pageTitle="Profile" />

      {isLoading ? (
        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 dark:border-gray-800 dark:bg-white/[0.03]">
          <LoadingIndicator
            className="mx-auto"
            layout="stacked"
            size="lg"
            label="Loading your profile"
            description="Fetching your latest account details from the server."
          />
        </div>
      ) : null}

      {!isLoading ? (
        <div className="space-y-6">
          <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-col items-center gap-6 text-center xl:flex-row xl:text-left">
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-gray-800">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={displayName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gray-900 text-xl font-semibold text-white dark:bg-gray-700">
                      {getUserInitials(displayName, activeProfile.email)}
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">
                    {displayName}
                  </h4>
                  <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {activeProfile.email}
                    </p>
                    <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {providerLabel}
                    </p>
                    <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Joined {joinedLabel}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                <Badge color={getRoleBadgeColor(normalizedRole)} variant="light">
                  {roleLabel}
                </Badge>
                <Badge color="info" variant="light">
                  {providerLabel}
                </Badge>
              </div>
            </div>

            <div className="mt-5 border-t border-gray-100 pt-5 dark:border-gray-800">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {roleDescriptions[normalizedRole]} This page only displays your account
                information and does not allow edits.
              </p>
            </div>
          </section>

          {errorMessage ? (
            <div className="flex flex-col gap-4 rounded-2xl border border-warning-200 bg-warning-50 px-5 py-4 dark:border-warning-500/20 dark:bg-warning-500/10 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-warning-700 dark:text-orange-300">
                  Some profile fields could not be refreshed
                </p>
                <p className="mt-1 text-sm text-warning-700/90 dark:text-orange-200/80">
                  {errorMessage}
                </p>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  void loadProfile(true);
                }}
              >
                Retry
              </Button>
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="w-full">
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
                    Personal Information
                  </h4>
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
                    <ProfileField label="Display name" value={storedDisplayName} />
                    <ProfileField label="Email address" value={activeProfile.email} />
                    <ProfileField label="User ID" value={activeProfile.userId} mono />
                    <ProfileField label="Joined" value={joinedLabel} />
                    <ProfileField
                      label="Photo URL"
                      value={activeProfile.photoUrl?.trim() || "Not set"}
                      mono
                      fullWidth
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="w-full">
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
                    Account Access
                  </h4>
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
                    <div>
                      <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                        Role
                      </p>
                      <Badge color={getRoleBadgeColor(normalizedRole)} variant="light">
                        {roleLabel}
                      </Badge>
                    </div>

                    <div>
                      <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                        Provider
                      </p>
                      <Badge color="info" variant="light">
                        {providerLabel}
                      </Badge>
                    </div>

                    <div className="lg:col-span-2">
                      <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                        Role description
                      </p>
                      <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                        {roleDescriptions[normalizedRole]}
                      </p>
                    </div>

                    {providerIdentifiers.length > 0 ? (
                      providerIdentifiers.map((identifier) => (
                        <ProfileField
                          key={identifier.label}
                          label={identifier.label}
                          value={identifier.value}
                          mono
                        />
                      ))
                    ) : (
                      <div className="lg:col-span-2">
                        <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                          Linked account
                        </p>
                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                          No third-party identity is linked to this account. You are using
                          the local email and password sign-in flow.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
