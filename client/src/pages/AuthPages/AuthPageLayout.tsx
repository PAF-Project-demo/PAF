import React from "react";
import ThemeTogglerTwo from "../../components/common/ThemeTogglerTwo";

const authImageSrc = "/sign.jpg";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative p-6 bg-white z-1 dark:bg-gray-900 sm:p-0">
      <div className="relative flex min-h-screen flex-col justify-center w-full dark:bg-gray-900 lg:h-screen lg:flex-row sm:p-0">
        <div className="mb-6 overflow-hidden rounded-3xl bg-brand-950 lg:hidden">

        </div>
        {children}
        <div className="relative hidden h-full w-full overflow-hidden bg-brand-950 dark:bg-white/5 lg:grid lg:w-1/2">
          <img
            src={authImageSrc}
            alt="Authentication visual"
            className="absolute inset-0 h-full w-full object-cover"
          />
       
        </div>
        <div className="fixed z-50 hidden bottom-6 right-6 sm:block">
          <ThemeTogglerTwo />
        </div>
      </div>
    </div>
  );
}
