"use client";

import dynamic from "next/dynamic";

/** Die Software arbeitet mit der Datenbank im Browser – deshalb nur im Browser rendern. */
const MacherOs = dynamic(() => import("@/os/MacherOs"), { ssr: false });

export function OsLaden() {
  return <MacherOs />;
}
