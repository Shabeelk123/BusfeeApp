import {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useRef,
    useState,
} from "react";
import { View } from "react-native";
import Toast, { ToastConfig, ToastType } from "./Toast";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ShowToastOptions {
    type: ToastType;
    title: string;
    subtitle?: string;
    duration?: number;
}

interface ToastContextValue {
    show: (opts: ShowToastOptions) => void;
    success: (title: string, subtitle?: string) => void;
    error: (title: string, subtitle?: string) => void;
    warning: (title: string, subtitle?: string) => void;
    info: (title: string, subtitle?: string) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastConfig[]>([]);
    const counter = useRef(0);

    const show = useCallback((opts: ShowToastOptions) => {
        const id = `toast_${++counter.current}_${Date.now()}`;
        setToasts((prev) => [...prev, { id, ...opts }]);
    }, []);

    const dismiss = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const success = useCallback(
        (title: string, subtitle?: string) => show({ type: "success", title, subtitle }),
        [show]
    );
    const error = useCallback(
        (title: string, subtitle?: string) => show({ type: "error", title, subtitle }),
        [show]
    );
    const warning = useCallback(
        (title: string, subtitle?: string) => show({ type: "warning", title, subtitle }),
        [show]
    );
    const info = useCallback(
        (title: string, subtitle?: string) => show({ type: "info", title, subtitle }),
        [show]
    );

    return (
        <ToastContext.Provider value={{ show, success, error, warning, info }}>
            {children}

            {/* Toast overlay — absolutely positioned, above everything */}
            <View
                pointerEvents="box-none"
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 9999,
                }}
            >
                {toasts.map((toast) => (
                    <Toast key={toast.id} {...toast} onDismiss={dismiss} />
                ))}
            </View>
        </ToastContext.Provider>
    );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useToast(): ToastContextValue {
    const ctx = useContext(ToastContext);
    if (!ctx) {
        throw new Error("useToast must be used inside <ToastProvider>");
    }
    return ctx;
}
