import { Ionicons } from "@expo/vector-icons";
import { useCallback, useState } from "react";
import { ActivityIndicator, Text, TextInput, View, Pressable } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

import AppButton from "@/components/common/AppButton";
import AppInput from "@/components/common/AppInput";
import PageHeader from "@/components/common/PageHeader";
import ScreenWrapper from "@/components/common/ScreenWrapper";
import { useToast } from "@/components/common/ToastContext";
import { Colors, Shadows } from "@/constants/colors";
import { createStudent } from "@/services/student.service";
import { composeClassName } from "@/utils/className";

// ── Validation Utilities ────────────────────────────────────────────
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone: string): boolean => {
  return phone.length === 0 || /^[0-9]{10}$/.test(phone.replace(/\D/g, ""));
};

const validatePassword = (password: string): boolean => {
  return password.length >= 6;
};

// ── Types ────────────────────────────────────────────────────────────
interface FormErrors {
  fullName?: string;
  admissionNo?: string;
  parentName?: string;
  phone?: string;
  busRoute?: string;
  monthlyFee?: string;
  email?: string;
  password?: string;
}

// ── Section Card ─────────────────────────────────────────────────────
function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  children: React.ReactNode;
}) {
  return (
    <View style={{ marginBottom: 20 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            backgroundColor: Colors.primaryLight,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 8,
          }}
        >
          <Ionicons name={icon} size={15} color={Colors.primary} />
        </View>
        <Text
          style={{
            fontSize: 12,
            fontWeight: "700",
            color: Colors.textSecondary,
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          {title}
        </Text>
      </View>

      <View
        style={[
          {
            backgroundColor: Colors.card,
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: Colors.cardBorderLight,
          },
          Shadows.card,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

// ── Component ────────────────────────────────────────────────────────
export default function CreateStudentScreen() {
  const toast = useToast();

  // ── Form State ──────────────────────────────────────────
  const [fullName, setFullName] = useState("");
  const [admissionNo, setAdmissionNo] = useState("");
  const [parentName, setParentName] = useState("");
  const [phone, setPhone] = useState("");
  const [classLevel, setClassLevel] = useState("");
  const [division, setDivision] = useState("");
  const [busRoute, setBusRoute] = useState("");
  const [monthlyFee, setMonthlyFee] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // ── UI State ────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // ── Validation ──────────────────────────────────────────
  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    if (!admissionNo.trim()) {
      newErrors.admissionNo = "Admission number is required";
    }

    if (!monthlyFee.trim()) {
      newErrors.monthlyFee = "Monthly fee is required";
    } else if (isNaN(Number(monthlyFee)) || Number(monthlyFee) <= 0) {
      newErrors.monthlyFee = "Enter a valid amount";
    }

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(email)) {
      newErrors.email = "Enter a valid email address";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (!validatePassword(password)) {
      newErrors.password = "Minimum 6 characters required";
    }

    if (phone && !validatePhone(phone)) {
      newErrors.phone = "Phone must be 10 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [fullName, admissionNo, monthlyFee, email, password, phone]);

  // ── Submit Handler ──────────────────────────────────────
  const handleCreate = useCallback(async () => {
    if (!validateForm()) {
      toast.warning("Validation Error", "Please check all required fields");
      return;
    }

    try {
      setLoading(true);

      const { error } = await createStudent({
        full_name: fullName.trim(),
        admission_no: admissionNo.trim(),
        parent_name: parentName.trim() || "",
        phone: phone.trim() || "",
        class_name: composeClassName(classLevel, division),
        bus_route: busRoute.trim() || "",
        email: email.trim().toLowerCase(),
        password,
        monthly_fee: Number(monthlyFee),
      });

      if (error) {
        if (error.message?.includes("already exists")) {
          setErrors({ email: "This email is already registered" });
          toast.error("Registration Failed", "Email already exists");
        } else if (error.message?.includes("admission")) {
          setErrors({ admissionNo: "This admission number already exists" });
          toast.error("Registration Failed", "Admission number already exists");
        } else {
          toast.error(
            "Creation Failed",
            error.message || "Unable to create student profile",
          );
        }
        return;
      }

      toast.success("Success", "Student profile created successfully");
      setLoading(false);
      // Reset form
      setFullName("");
      setAdmissionNo("");
      setParentName("");
      setPhone("");
      setClassLevel("");
      setDivision("");
      setBusRoute("");
      setMonthlyFee("");
      setEmail("");
      setPassword("");
      setErrors({});
    } catch (error: any) {
      toast.error(
        "Network Error",
        error?.message || "Failed to create student",
      );
    } finally {
      setLoading(false);
    }
  }, [
    validateForm,
    fullName,
    admissionNo,
    parentName,
    phone,
    classLevel,
    division,
    busRoute,
    monthlyFee,
    email,
    password,
    toast,
  ]);

  // ── Render ──────────────────────────────────────────────
  if (loading) {
    return (
      <ScreenWrapper>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={{ marginTop: 12, color: Colors.textSecondary, fontSize: 14 }}>
            Creating student profile...
          </Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <KeyboardAwareScrollView
        enableOnAndroid
        extraScrollHeight={40}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* ── Header ── */}
        <PageHeader
          title="Add Student"
          subtitle="Create new student profile and login credentials"
          showBack
        />

        {/* ── Personal Information ── */}
        <SectionCard title="Personal Information" icon="person-outline">
          <AppInput
            label="Full Name"
            placeholder="e.g. Rahul Kumar"
            value={fullName}
            onChangeText={setFullName}
            iconName="person-outline"
            required
            error={errors.fullName}
            editable={!loading}
          />

          <AppInput
            label="Admission Number"
            placeholder="e.g. ADM-2026-001"
            value={admissionNo}
            onChangeText={setAdmissionNo}
            iconName="id-card-outline"
            required
            error={errors.admissionNo}
            editable={!loading}
          />

          <AppInput
            label="Parent Name"
            placeholder="e.g. Raj Kumar"
            value={parentName}
            onChangeText={setParentName}
            iconName="people-outline"
            error={errors.parentName}
            editable={!loading}
          />

          <AppInput
            label="Phone Number"
            placeholder="10-digit mobile number"
            value={phone}
            onChangeText={setPhone}
            iconName="call-outline"
            keyboardType="phone-pad"
            maxLength={10}
            error={errors.phone}
            editable={!loading}
          />
        </SectionCard>

        {/* ── School Details ── */}
        <SectionCard title="School Details" icon="school-outline">
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <AppInput
                label="Class"
                placeholder="e.g. 10"
                value={classLevel}
                onChangeText={setClassLevel}
                iconName="book-outline"
                autoCapitalize="characters"
                editable={!loading}
              />
            </View>
            <View style={{ flex: 1 }}>
              <AppInput
                label="Division"
                placeholder="e.g. A"
                value={division}
                onChangeText={setDivision}
                iconName="grid-outline"
                autoCapitalize="characters"
                editable={!loading}
              />
            </View>
          </View>

          <AppInput
            label="Bus Route"
            placeholder="e.g. Route 3"
            value={busRoute}
            onChangeText={setBusRoute}
            iconName="bus-outline"
            editable={!loading}
          />

          <AppInput
            label="Monthly Fee (₹)"
            placeholder="e.g. 1200"
            value={monthlyFee}
            onChangeText={setMonthlyFee}
            iconName="cash-outline"
            keyboardType="decimal-pad"
            required
            error={errors.monthlyFee}
            editable={!loading}
          />
        </SectionCard>

        {/* ── Login Credentials ── */}
        <SectionCard title="Login Credentials" icon="lock-closed-outline">
          <AppInput
            label="Email"
            placeholder="student@school.com"
            value={email}
            onChangeText={setEmail}
            iconName="mail-outline"
            keyboardType="email-address"
            autoCapitalize="none"
            required
            error={errors.email}
            editable={!loading}
          />

          {/* Password with toggle */}
          <View style={{ marginBottom: 16 }}>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: Colors.textPrimary,
                marginBottom: 6,
                marginLeft: 2,
              }}
            >
              Password<Text style={{ color: Colors.danger }}> *</Text>
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                borderRadius: 12,
                borderWidth: 1.5,
                borderColor: errors.password ? Colors.danger : Colors.inputBorder,
                backgroundColor: errors.password ? Colors.dangerLight : Colors.inputBg,
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
                placeholder="Minimum 6 characters"
                placeholderTextColor={Colors.textMuted}
                editable={!loading}
                style={{
                  flex: 1,
                  fontSize: 15,
                  color: Colors.textPrimary,
                  paddingVertical: 12,
                }}
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, padding: 8 })}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? "Hide password" : "Show password"}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color={Colors.iconDefault}
                />
              </Pressable>
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
        </SectionCard>

        {/* ── Info Note ── */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            borderRadius: 12,
            backgroundColor: Colors.primaryLight,
            borderWidth: 1,
            borderColor: Colors.primaryBorder,
            padding: 14,
            marginBottom: 24,
          }}
        >
          <Ionicons
            name="information-circle-outline"
            size={18}
            color={Colors.primary}
            style={{ marginRight: 10, marginTop: 1 }}
          />
          <Text style={{ flex: 1, fontSize: 12, color: Colors.primary, lineHeight: 18 }}>
            The student will use these credentials to log in and view their fee records.
          </Text>
        </View>

        {/* ── Submit Button ── */}
        <AppButton
          label="Create Student"
          onPress={handleCreate}
          loading={loading}
          disabled={loading}
          fullWidth
          iconLeft="person-add-outline"
        />
      </KeyboardAwareScrollView>
    </ScreenWrapper>
  );
}
