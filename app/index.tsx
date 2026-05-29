import "@/global.css";

import SplashScreen from "./splash";

import { useSessionRestore } from "../hooks/useSessionRestore";

export default function Index() {
  useSessionRestore();

  return <SplashScreen />;
}