import "@/global.css";
import { Stack } from "expo-router";
import { Provider } from "react-redux";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ToastProvider } from "../components/common/ToastContext";
import { store } from "../store";
import * as SplashScreen from "expo-splash-screen";

// Keep the native splash visible until we explicitly hide it
// after session restore is complete. This prevents the blank
// white/black flash between the OS splash and your custom UI.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <ToastProvider>
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          />
        </ToastProvider>
      </SafeAreaProvider>
    </Provider>
  );
}
