"use client";

import dynamic from "next/dynamic";

/** Die Software arbeitet mit der Datenbank im Browser – deshalb nur im Browser rendern. */
const HandwerkOs = dynamic(() => import("@/os/HandwerkOs"), { ssr: false });

export function OsLaden() {
  return <HandwerkOs />;
}
