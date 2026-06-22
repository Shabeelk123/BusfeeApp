import AppButton from "@/components/common/AppButton";
import AppInput from "@/components/common/AppInput";
import { Colors } from "@/constants/colors";
import { useAppDispatch } from "@/hooks/redux";
import { supabase } from "@/lib/supabase";
import { loginUser } from "@/services/auth.service";
import { setUser } from "@/store/authSlice";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, SafeAreaView, Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

export default function LoginScreen() {
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );

  const validateForm = useCallback((): boolean => {
    const newErrors: typeof errors = {};

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Enter a valid email address";
    }

    if (!password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [email, password]);

  const handleLogin = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await loginUser(
        email.trim().toLowerCase(),
        password,
      );

      if (error) {
        Alert.alert("Login Failed", error.message || "Invalid credentials");
        return;
      }

      const authUser = data.user;
      if (!authUser) {
        Alert.alert("Error", "User not found");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("auth_id", authUser.id)
        .single();

      if (profileError || !profile) {
        Alert.alert("Profile Not Found", "Please contact administrator");
        return;
      }

      dispatch(setUser({ user: profile, role: profile.role }));

      if (profile.role === "ADMIN") router.replace("/(admin)/dashboard");
      else if (profile.role === "TEACHER")
        router.replace("/(teacher)/dashboard");
      else if (profile.role === "STUDENT")
        router.replace("/(student)/dashboard");
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.message || "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, [validateForm, email, password, dispatch]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <KeyboardAwareScrollView
        enableOnAndroid
        extraScrollHeight={40}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          paddingHorizontal: 24,
          paddingVertical: 40,
        }}
      >
        {/* ── Logo + Heading ── */}
        <View style={{ marginBottom: 56, alignItems: "center" }}>
          <View
            style={{
              marginBottom: 24,
              height: 96,
              width: 96,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 24,
              backgroundColor: Colors.primary,
              shadowColor: Colors.primary,
              shadowOpacity: 0.3,
              shadowRadius: 16,
              elevation: 6,
            }}
          >
            <Ionicons name="bus" size={48} color={Colors.textOnDark} />
          </View>
          <Text
            style={{
              textAlign: "center",
              fontSize: 32,
              fontWeight: "900",
              letterSpacing: -0.5,
              color: Colors.textPrimary,
            }}
          >
            Welcome Back
          </Text>
          <Text
            style={{
              marginTop: 12,
              textAlign: "center",
              fontSize: 15,
              lineHeight: 24,
              color: Colors.textSecondary,
            }}
          >
            Sign in to continue to your School ERP dashboard
          </Text>
        </View>

        {/* ── Login Card ── */}
        <View
          style={{
            borderRadius: 20,
            borderWidth: 1,
            borderColor: Colors.cardBorder,
            backgroundColor: Colors.card,
            padding: 28,
            shadowColor: "#000",
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
            marginBottom: 40,
          }}
        >
          {/* Email */}
          <AppInput
            label="Email Address"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            iconName="mail-outline"
            required
            error={errors.email}
          />

          {/* Password */}
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: Colors.textPrimary,
                marginBottom: 6,
                marginLeft: 2,
              }}
            >
              Password
              <Text style={{ color: Colors.danger }}> *</Text>
            </Text>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                borderRadius: 12,
                borderWidth: 1.5,
                borderColor: errors.password
                  ? Colors.danger
                  : Colors.inputBorder,
                backgroundColor: errors.password ? "#FEE2E2" : Colors.inputBg,
                paddingHorizontal: 14,
                minHeight: 50,
              }}
            >
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color={errors.password ? Colors.danger : Colors.iconDefault}
                style={{ marginRight: 10 }}
              />
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholder="Enter your password"
                placeholderTextColor={Colors.textMuted}
                style={{
                  flex: 1,
                  fontSize: 15,
                  color: Colors.textPrimary,
                  paddingVertical: 12,
                }}
              />
              <AppButton
                label={showPassword ? "Hide" : "Show"}
                onPress={() => setShowPassword(!showPassword)}
                variant="ghost"
                size="sm"
                iconRight={showPassword ? "eye-off-outline" : "eye-outline"}
              />
            </View>
            {errors.password && (
              <Text
                style={{
                  fontSize: 12,
                  color: Colors.danger,
                  marginTop: 4,
                  marginLeft: 2,
                }}
              >
                {errors.password}
              </Text>
            )}
          </View>

          {/* Login Button */}
          <AppButton
            label="Sign In"
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
            fullWidth
          />
        </View>

        {/* ── Footer ── */}
        <View style={{ alignItems: "center" }}>
          <Text
            style={{
              textAlign: "center",
              fontSize: 12,
              lineHeight: 18,
              color: Colors.textMuted,
            }}
          >
            School ERP Management System © 2026
          </Text>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
