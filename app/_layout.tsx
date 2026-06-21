import "@/global.css";
import { Stack } from "expo-router";
import { Provider } from "react-redux";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ToastProvider } from "../components/common/ToastContext";
import { store } from "../store";

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
