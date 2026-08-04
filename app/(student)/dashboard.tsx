import AppButton from "@/components/common/AppButton";
import AppDrawer from "@/components/common/AppDrawer";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import ScreenWrapper from "@/components/common/ScreenWrapper";
import { Colors } from "@/constants/colors";
import { logoutUser } from "@/services/auth.service";
import {
    LedgerMonth,
    getStudentFeeLedger,
    summarizeLedger,
} from "@/services/payment.service";
import { getCurrentStudent } from "@/services/student.service";
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
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
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
  const [ledger, setLedger] = useState<LedgerMonth[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"monthly" | "history">("monthly");
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);

  const fetchStudent = async () => {
    try {
      setLoading(true);
      const { data } = await getCurrentStudent();
      setStudent(data);

      if (data) {
        const { data: ledgerData } = await getStudentFeeLedger(
          data.id,
          data.monthly_fee,
          data.created_at,
        );
        setLedger(ledgerData);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    router.replace("/(auth)/role-select");
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

  const monthlyFee = student.monthly_fee ?? 0;
  const { totalPaid, outstanding, recentTransactions } = summarizeLedger(ledger);

  const paidCount = ledger.filter((m) => m.status === "Paid").length;
  const pendingCount = ledger.filter((m) => m.status === "Pending").length;
  const isCleared = outstanding === 0;

  return (
    <ScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ── Header ── */}
        <View
          style={{
            marginBottom: 24,
            flexDirection: "row",
            alignItems: "flex-start",
          }}
        >
          {/* Hamburger menu (top-left) */}
          <Pressable
            onPress={() => setShowDrawer(true)}
            style={({ pressed }) => ({
              width: 42,
              height: 42,
              borderRadius: 13,
              backgroundColor: Colors.card,
              borderWidth: 1,
              borderColor: Colors.cardBorderLight,
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.7 : 1,
              marginRight: 12,
              marginTop: 2,
              shadowColor: "#000",
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            })}
            accessibilityRole="button"
            accessibilityLabel="Open menu"
          >
            <Ionicons name="menu-outline" size={22} color={Colors.textPrimary} />
          </Pressable>

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
                fontSize: 22,
                fontWeight: "800",
                color: Colors.textPrimary,
              }}
              numberOfLines={1}
            >
              {student.name}
            </Text>
            <View style={{ marginTop: 10, flexDirection: "row", gap: 8 }}>
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
                  {student.grade?.name && student.division?.name
                    ? `${student.grade.name}-${student.division.name}`
                    : "No Class"}
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
                  name="id-card-outline"
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
                  #{student.admission_no}
                </Text>
              </View>
            </View>
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
            {outstanding > 0 ? `₹${outstanding}` : "All Clear"}
          </Text>
          <Text
            style={{
              marginTop: 4,
              fontSize: 13,
              color: Colors.textOnDark,
              opacity: 0.85,
            }}
          >
            {outstanding > 0
              ? "Please clear your dues as soon as possible"
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
            value={`₹${totalPaid}`}
            valueColor={Colors.success}
          />
          <MiniStat
            label="Months"
            value={String(ledger.length)}
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
            {ledger.length === 0 ? (
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
              ledger.map((entry, index) => {
                const isPaid = entry.status === "Paid";
                const isPartial = entry.status === "Partial";
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
                        {MONTH_NAMES[entry.month - 1]} {entry.year}
                      </Text>
                      <Text
                        style={{
                          marginTop: 2,
                          fontSize: 12,
                          color: Colors.textSecondary,
                        }}
                      >
                        Paid ₹{entry.paid_amount} of ₹{entry.fee}
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
                        {entry.status}
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
            {recentTransactions.length === 0 ? (
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
              recentTransactions.map((item) => (
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
                          {MONTH_NAMES[item.month - 1]} {item.year}
                        </Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 11, color: Colors.textMuted }}>
                      {item.payment_date}
                    </Text>
                  </View>
                  {item.remarks && (
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
                      {item.remarks}
                    </Text>
                  )}
                </View>
              ))
            )}
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      <AppDrawer
        visible={showDrawer}
        onClose={() => setShowDrawer(false)}
        userName={student?.name}
        userRole="Student"
        items={[
          {
            id: "about",
            icon: "information-circle-outline",
            label: "About",
            sublabel: "App info & version",
            onPress: () => router.push("/about"),
          },
          {
            id: "privacy",
            icon: "shield-checkmark-outline",
            label: "Privacy Policy",
            sublabel: "busfeeapp.netlify.app",
            onPress: () => router.push("/privacy-policy"),
          },
          {
            id: "signout",
            icon: "log-out-outline",
            label: "Sign Out",
            sublabel: "Return to login screen",
            onPress: () => setShowLogoutDialog(true),
            variant: "danger",
          },
        ]}
      />

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
