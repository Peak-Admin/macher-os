import type { ReactNode } from "react";

export function Container({
  children,
  className = "",
  size = "default",
}: {
  children: ReactNode;
  className?: string;
  size?: "default" | "narrow" | "wide";
}) {
  const max =
    size === "narrow" ? "max-w-3xl" : size === "wide" ? "max-w-[88rem]" : "max-w-7xl";
  return <div className={`mx-auto w-full ${max} px-4 sm:px-6 lg:px-8 ${className}`}>{children}</div>;
}
