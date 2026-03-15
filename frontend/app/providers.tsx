"use client";

import { ReactNode } from "react";
import { AppKitProvider } from "@/context/AppKitProvider";

export function Providers({ children }: { children: ReactNode }) {
    return <AppKitProvider>{children}</AppKitProvider>;
}