import { useState } from "react";

import {
    ActivityIndicator,
    Alert,
    Pressable,
    SafeAreaView,
    Text,
    TextInput,
    View
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

import { router } from "expo-router";

import { useAppDispatch } from "../../hooks/redux";
import { supabase } from "../../lib/supabase";
import { loginUser } from "../../services/auth.service";
import { setUser } from "../../store/authSlice";

export default function LoginScreen() {
    const dispatch = useAppDispatch();

    const [email, setEmail] =
        useState("");

    const [password, setPassword] =
        useState("");

    const [loading, setLoading] =
        useState(false);

    const [showPassword, setShowPassword] =
        useState(false);

    const handleLogin =
        async () => {
            if (!email || !password) {
                Alert.alert(
                    "Missing Fields",
                    "Please enter your email and password."
                );

                return;
            }

            try {
                setLoading(true);

                const {
                    data,
                    error,
                } = await loginUser(
                    email,
                    password
                );

                if (error) {
                    Alert.alert(
                        "Login Failed",
                        error.message
                    );

                    return;
                }

                const authUser =
                    data.user;

                if (!authUser) {
                    Alert.alert(
                        "Error",
                        "User not found"
                    );

                    return;
                }

                const {
                    data: profile,
                    error:
                    profileError,
                } = await supabase
                    .from("users")
                    .select("*")
                    .eq(
                        "auth_id",
                        authUser.id
                    )
                    .single();

                if (
                    profileError ||
                    !profile
                ) {
                    Alert.alert(
                        "Profile Not Found",
                        "Please contact administrator."
                    );

                    return;
                }

                dispatch(
                    setUser({
                        user: profile,
                        role: profile.role,
                    })
                );

                // Role Redirect
                if (
                    profile.role ===
                    "ADMIN"
                ) {
                    router.replace(
                        "/(admin)/dashboard"
                    );
                } else if (
                    profile.role ===
                    "TEACHER"
                ) {
                    router.replace(
                        "/(teacher)/dashboard"
                    );
                } else if (
                    profile.role ===
                    "STUDENT"
                ) {
                    router.replace(
                        "/(student)/dashboard"
                    );
                }
            } catch (error) {
                Alert.alert(
                    "Error",
                    "Something went wrong."
                );
            } finally {
                setLoading(false);
            }
        };

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <KeyboardAwareScrollView
                enableOnAndroid
                extraScrollHeight={30}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                    flexGrow: 1,
                    justifyContent: "center",
                    paddingHorizontal: 24,
                    paddingVertical: 40,
                }}
            >
                {/* Logo + Heading */}
                <View className="mb-14 items-center">
                    <View className="mb-6 h-24 w-24 items-center justify-center rounded-[30px] bg-blue-600 shadow">
                        <Text className="text-5xl text-white">
                            🚌
                        </Text>
                    </View>

                    <Text className="text-center text-4xl font-black tracking-tight text-gray-900">
                        Welcome Back
                    </Text>

                    <Text className="mt-3 text-center text-base leading-6 text-gray-500">
                        Sign in to continue to
                        your School ERP dashboard
                    </Text>
                </View>

                {/* Login Card */}
                <View className="rounded-[32px] border border-gray-100 bg-white p-7 shadow">
                    {/* Email */}
                    <View className="mb-5">
                        <Text className="mb-2 ml-1 text-sm font-semibold text-gray-700">
                            Email Address
                        </Text>

                        <View className="flex-row items-center rounded-2xl border border-gray-200 bg-gray-50 px-4">
                            <Text className="mr-3 text-lg text-gray-400">
                                ✉️
                            </Text>

                            <TextInput
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                placeholder="Enter your email"
                                placeholderTextColor="#9CA3AF"
                                className="flex-1 py-4 text-base text-gray-900"
                            />
                        </View>
                    </View>

                    {/* Password */}
                    <View className="mb-8">
                        <Text className="mb-2 ml-1 text-sm font-semibold text-gray-700">
                            Password
                        </Text>

                        <View className="flex-row items-center rounded-2xl border border-gray-200 bg-gray-50 px-4">
                            <Text className="mr-3 text-lg text-gray-400">
                                🔒
                            </Text>

                            <TextInput
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                placeholder="Enter your password"
                                placeholderTextColor="#9CA3AF"
                                className="flex-1 py-4 text-base text-gray-900"
                            />

                            <Pressable
                                onPress={() =>
                                    setShowPassword(
                                        !showPassword
                                    )
                                }
                            >
                                <Text className="text-sm font-semibold text-blue-600">
                                    {showPassword
                                        ? "Hide"
                                        : "Show"}
                                </Text>
                            </Pressable>
                        </View>
                    </View>

                    {/* Login Button */}
                    <Pressable
                        onPress={handleLogin}
                        disabled={loading}
                        className={`h-14 items-center justify-center rounded-2xl ${loading
                                ? "bg-blue-400"
                                : "bg-blue-600"
                            }`}
                    >
                        {loading ? (
                            <ActivityIndicator color="#ffffff" />
                        ) : (
                            <Text className="text-base font-bold tracking-wide text-white">
                                Sign In
                            </Text>
                        )}
                    </Pressable>
                </View>

                {/* Footer */}
                <View className="mt-10 items-center">
                    <Text className="text-center text-xs leading-5 text-gray-400">
                        School ERP Management
                        System © 2026
                    </Text>
                </View>
            </KeyboardAwareScrollView>
        </SafeAreaView>
    );
}