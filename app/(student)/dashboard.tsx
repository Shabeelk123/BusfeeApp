import AppButton from "@/components/common/AppButton";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import ScreenWrapper from "@/components/common/ScreenWrapper";
import { Colors } from "@/constants/colors";
import { logoutUser } from "@/services/auth.service";
import { getCurrentStudent } from "@/services/student.service";
import { calculateFeeBalance } from "@/utils/fee";
import { generateMonthlyFeeStatus } from "@/utils/monthlyFeeStatus";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    Text,
    View,
} from "react-native";

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function MiniStat({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        borderRadius: 12,
        backgroundColor: Colors.card,
        padding: 16,
        shadowColor: "#000",
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 1,
      }}
    >
      <Text style={{ fontSize: 12, color: Colors.textMuted, marginBottom: 4 }}>
        {label}
      </Text>
      <Text style={{ fontSize: 16, fontWeight: "700", color: valueColor }}>
        {value}
      </Text>
    </View>
  );
}

export default function StudentDashboard() {
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"monthly" | "history">("monthly");
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const fetchStudent = async () => {
    try {
      setLoading(true);
      const { data } = await getCurrentStudent();
      setStudent(data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    router.replace("/(auth)/login");
  };

  useFocusEffect(
    useCallback(() => {
      fetchStudent();
    }, []),
  );

  if (loading) {
    return (
      <ScreenWrapper>
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text
            style={{ marginTop: 12, color: Colors.textSecondary, fontSize: 14 }}
          >
            Loading your account…
          </Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (!student) {
    return (
      <ScreenWrapper>
        <View style={{ paddingHorizontal: 32, alignItems: "center" }}>
          <View
            style={{
              marginBottom: 16,
              height: 80,
              width: 80,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 40,
              backgroundColor: Colors.cardBorderLight,
            }}
          >
            <Ionicons
              name="lock-closed"
              size={40}
              color={Colors.textSecondary}
            />
          </View>
          <Text
            style={{
              marginTop: 16,
              textAlign: "center",
              fontSize: 18,
              fontWeight: "700",
              color: Colors.textPrimary,
            }}
          >
            Profile Not Found
          </Text>
          <Text
            style={{
              marginTop: 8,
              textAlign: "center",
              fontSize: 14,
              color: Colors.textSecondary,
            }}
          >
            Please contact your school administrator to set up your account.
          </Text>
          <View style={{ marginTop: 24, width: "100%" }}>
            <AppButton
              label="Sign Out"
              onPress={() => setShowLogoutDialog(true)}
              variant="danger"
              fullWidth
              iconLeft="log-out-outline"
            />
          </View>
        </View>
      </ScreenWrapper>
    );
  }

  const monthlyFee = student?.student_fee_assignments?.[0]?.monthly_fee || 0;
  const feeSummary = calculateFeeBalance({
    monthlyFee,
    transactions: student?.fee_transactions || [],
    joinDate: student.created_at,
  });
  const monthlyStatus = generateMonthlyFeeStatus({
    monthlyFee,
    joinDate: student.created_at,
    transactions: student?.fee_transactions || [],
  });

  const paidCount = monthlyStatus.months.filter(
    (m) => m.status === "PAID",
  ).length;
  const pendingCount = monthlyStatus.months.filter(
    (m) => m.status === "PENDING",
  ).length;
  const isCleared = feeSummary.dueAmount === 0;

  return (
    <ScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ── Header ── */}
        <View
          style={{
            marginBottom: 24,
            flexDirection: "row",
            alignItems: "flex-start",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: "700",
                color: Colors.textSecondary,
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              Student Portal
            </Text>
            <Text
              style={{
                marginTop: 4,
                fontSize: 24,
                fontWeight: "800",
                color: Colors.textPrimary,
              }}
              numberOfLines={1}
            >
              {student.full_name}
            </Text>
            <View style={{ marginTop: 12, flexDirection: "row", gap: 8 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: Colors.cardBorder,
                  backgroundColor: Colors.card,
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                }}
              >
                <Ionicons
                  name="book-outline"
                  size={12}
                  color={Colors.textSecondary}
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "500",
                    color: Colors.textSecondary,
                  }}
                >
                  {student.class_name || "No Class"}
                </Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: Colors.cardBorder,
                  backgroundColor: Colors.card,
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                }}
              >
                <Ionicons
                  name="bus-outline"
                  size={12}
                  color={Colors.textSecondary}
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "500",
                    color: Colors.textSecondary,
                  }}
                >
                  {student.bus_route || "No Route"}
                </Text>
              </View>
            </View>
          </View>
          <View style={{ marginLeft: 12 }}>
            <AppButton
              label="Sign Out"
              onPress={() => setShowLogoutDialog(true)}
              variant="danger"
              size="sm"
              iconLeft="log-out-outline"
            />
          </View>
        </View>

        {/* ── Fee Status Hero Banner ── */}
        <View
          style={{
            marginBottom: 20,
            overflow: "hidden",
            borderRadius: 16,
            padding: 24,
            backgroundColor: isCleared ? Colors.success : Colors.danger,
            shadowColor: isCleared ? Colors.success : Colors.danger,
            shadowOpacity: 0.3,
            shadowRadius: 16,
            elevation: 6,
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: "700",
              color: Colors.textOnDark,
              opacity: 0.8,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            {isCleared ? "Account Status" : "Outstanding Balance"}
          </Text>
          <Text
            style={{
              marginTop: 8,
              fontSize: 36,
              fontWeight: "900",
              color: Colors.textOnDark,
            }}
          >
            {feeSummary.dueAmount > 0
              ? `₹${feeSummary.dueAmount}`
              : feeSummary.advanceAmount > 0
                ? `+₹${feeSummary.advanceAmount}`
                : "All Clear"}
          </Text>
          <Text
            style={{
              marginTop: 4,
              fontSize: 13,
              color: Colors.textOnDark,
              opacity: 0.85,
            }}
          >
            {feeSummary.dueAmount > 0
              ? "Please clear your dues as soon as possible"
              : feeSummary.advanceAmount > 0
                ? "You have an advance balance — great work!"
                : "Your fee account is fully up to date"}
          </Text>
          <View style={{ marginTop: 16, flexDirection: "row", gap: 8 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                borderRadius: 8,
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                paddingHorizontal: 12,
                paddingVertical: 6,
              }}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={12}
                color={Colors.textOnDark}
                style={{ marginRight: 4 }}
              />
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: Colors.textOnDark,
                }}
              >
                {paidCount} Paid
              </Text>
            </View>
            {pendingCount > 0 && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  borderRadius: 8,
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                }}
              >
                <Ionicons
                  name="time-outline"
                  size={12}
                  color={Colors.textOnDark}
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "700",
                    color: Colors.textOnDark,
                  }}
                >
                  {pendingCount} Pending
                </Text>
              </View>
            )}
            {monthlyStatus.advanceAmount > 0 && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  borderRadius: 8,
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                }}
              >
                <Ionicons
                  name="trending-up-outline"
                  size={12}
                  color={Colors.textOnDark}
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "700",
                    color: Colors.textOnDark,
                  }}
                >
                  ₹{monthlyStatus.advanceAmount} Advance
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Stats Row ── */}
        <View style={{ marginBottom: 24, flexDirection: "row", gap: 12 }}>
          <MiniStat
            label="Monthly Fee"
            value={`₹${monthlyFee}`}
            valueColor={Colors.primary}
          />
          <MiniStat
            label="Total Paid"
            value={`₹${feeSummary.totalPaid}`}
            valueColor={Colors.success}
          />
          <MiniStat
            label="Months"
            value={String(feeSummary.totalMonths)}
            valueColor={Colors.textPrimary}
          />
        </View>

        {/* ── Tabs ── */}
        <View
          style={{
            marginBottom: 20,
            flexDirection: "row",
            borderRadius: 12,
            borderWidth: 1,
            borderColor: Colors.cardBorder,
            backgroundColor: Colors.card,
            padding: 4,
          }}
        >
          {(["monthly", "history"] as const).map((tab) => (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={({ pressed }) => ({
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 8,
                paddingVertical: 10,
                backgroundColor:
                  activeTab === tab ? Colors.primary : "transparent",
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Ionicons
                name={
                  tab === "monthly" ? "calendar-outline" : "receipt-outline"
                }
                size={14}
                color={activeTab === tab ? Colors.textOnDark : Colors.textMuted}
                style={{ marginRight: 5 }}
              />
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color:
                    activeTab === tab ? Colors.textOnDark : Colors.textMuted,
                }}
              >
                {tab === "monthly" ? "Monthly" : "History"}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* ── Monthly Status Tab ── */}
        {activeTab === "monthly" && (
          <View>
            {monthlyStatus.months.length === 0 ? (
              <View style={{ marginTop: 40, alignItems: "center" }}>
                <View
                  style={{
                    marginBottom: 12,
                    height: 64,
                    width: 64,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 32,
                    backgroundColor: Colors.cardBorderLight,
                  }}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={32}
                    color={Colors.textMuted}
                  />
                </View>
                <Text
                  style={{
                    marginTop: 8,
                    color: Colors.textMuted,
                    fontSize: 14,
                  }}
                >
                  No monthly records yet
                </Text>
              </View>
            ) : (
              monthlyStatus.months.map((item, index) => {
                const isPaid = item.status === "PAID";
                const isPartial = item.status === "PARTIAL";
                const bgColor = isPaid
                  ? Colors.successLight
                  : isPartial
                    ? Colors.warningLight
                    : Colors.dangerLight;
                const borderColor = isPaid
                  ? Colors.successBorder
                  : isPartial
                    ? Colors.warningBorder
                    : Colors.dangerBorder;
                const iconColor = isPaid
                  ? Colors.success
                  : isPartial
                    ? Colors.warning
                    : Colors.danger;

                return (
                  <View
                    key={index}
                    style={{
                      marginBottom: 10,
                      flexDirection: "row",
                      alignItems: "center",
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor,
                      backgroundColor: bgColor,
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                    }}
                  >
                    <Ionicons
                      name={
                        isPaid
                          ? "checkmark-circle"
                          : isPartial
                            ? "time"
                            : "alert-circle"
                      }
                      size={20}
                      color={iconColor}
                      style={{ marginRight: 12 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{ fontWeight: "600", color: Colors.textPrimary }}
                      >
                        {MONTH_NAMES[item.month - 1]} {item.year}
                      </Text>
                      <Text
                        style={{
                          marginTop: 2,
                          fontSize: 12,
                          color: Colors.textSecondary,
                        }}
                      >
                        Paid ₹{item.paid} of ₹{item.expected}
                      </Text>
                    </View>
                    <View
                      style={{
                        borderRadius: 20,
                        paddingHorizontal: 12,
                        paddingVertical: 4,
                        backgroundColor: iconColor,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: "700",
                          color: Colors.textOnDark,
                        }}
                      >
                        {item.status}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* ── History Tab ── */}
        {activeTab === "history" && (
          <View>
            {!student?.fee_transactions?.length ? (
              <View style={{ marginTop: 40, alignItems: "center" }}>
                <View
                  style={{
                    marginBottom: 12,
                    height: 64,
                    width: 64,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 32,
                    backgroundColor: Colors.cardBorderLight,
                  }}
                >
                  <Ionicons
                    name="card-outline"
                    size={32}
                    color={Colors.textMuted}
                  />
                </View>
                <Text
                  style={{
                    marginTop: 8,
                    color: Colors.textMuted,
                    fontSize: 14,
                  }}
                >
                  No payments recorded yet
                </Text>
              </View>
            ) : (
              [...student.fee_transactions]
                .sort(
                  (a: any, b: any) =>
                    new Date(b.created_at).getTime() -
                    new Date(a.created_at).getTime(),
                )
                .map((item: any) => (
                  <View
                    key={item.id}
                    style={{
                      marginBottom: 12,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: Colors.cardBorder,
                      backgroundColor: Colors.card,
                      padding: 16,
                      shadowColor: "#000",
                      shadowOpacity: 0.04,
                      shadowRadius: 8,
                      elevation: 1,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <View
                        style={{ flexDirection: "row", alignItems: "center" }}
                      >
                        <View
                          style={{
                            marginRight: 12,
                            height: 40,
                            width: 40,
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: 20,
                            backgroundColor: Colors.successLight,
                          }}
                        >
                          <Ionicons
                            name="cash-outline"
                            size={20}
                            color={Colors.success}
                          />
                        </View>
                        <View>
                          <Text
                            style={{
                              fontSize: 16,
                              fontWeight: "700",
                              color: Colors.success,
                            }}
                          >
                            ₹{item.amount}
                          </Text>
                          <Text
                            style={{
                              marginTop: 2,
                              fontSize: 11,
                              color: Colors.textMuted,
                            }}
                          >
                            {MONTH_NAMES[(item.payment_month || 1) - 1]}{" "}
                            {item.payment_year}
                          </Text>
                        </View>
                      </View>
                      <Text style={{ fontSize: 11, color: Colors.textMuted }}>
                        {new Date(item.created_at).toLocaleDateString("en-IN")}
                      </Text>
                    </View>
                    {item.note && (
                      <Text
                        style={{
                          marginTop: 12,
                          paddingTop: 12,
                          borderTopWidth: 1,
                          borderTopColor: Colors.cardBorder,
                          fontSize: 12,
                          color: Colors.textMuted,
                        }}
                      >
                        {item.note}
                      </Text>
                    )}
                  </View>
                ))
            )}
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      <ConfirmDialog
        visible={showLogoutDialog}
        variant="warning"
        title="Sign Out?"
        subtitle="You'll be returned to the login screen."
        confirmLabel="Sign Out"
        cancelLabel="Stay"
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutDialog(false)}
      />
    </ScreenWrapper>
  );
}
