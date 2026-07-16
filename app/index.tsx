import "@/global.css";

import { useSessionRestore } from "../hooks/useSessionRestore";

/**
 * Entry point — renders nothing visible.
 * The native splash screen stays visible (via SplashScreen.preventAutoHideAsync
 * in _layout.tsx) until useSessionRestore finishes and hides it.
 */
export default function Index() {
    useSessionRestore();

    return null;
}