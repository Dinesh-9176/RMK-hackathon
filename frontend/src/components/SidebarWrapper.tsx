"use client";

import Sidebar from "@/components/Sidebar";
import { useAppContext } from "@/context/AppContext";

export default function SidebarWrapper({ children }: { children: React.ReactNode }) {
    const { state } = useAppContext();

    return (
        <div className={state.isCrisis ? "crisis" : ""} style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
            <Sidebar />
            <main style={{
                marginLeft: "var(--sidebar-width)",
                flex: 1,
                height: "100vh",
                overflowY: "auto",
                padding: "1.5rem 2rem",
                background: "var(--bg-main)",
                transition: "all 0.3s ease",
            }}>
                {children}
            </main>
        </div>
    );
}
