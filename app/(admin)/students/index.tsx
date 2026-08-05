import { ActivityIndicator, FlatList, View } from "react-native";

import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";

import AcademicMonthSelect from "@/components/common/AcademicMonthSelect";
import AppButton from "@/components/common/AppButton";
import AppInput from "@/components/common/AppInput";
import AppSelect from "@/components/common/AppSelect";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import PageHeader from "@/components/common/PageHeader";
import ScreenWrapper from "@/components/common/ScreenWrapper";
import StudentFeeRow from "@/components/students/StudentFeeRow";
import { Colors } from "@/constants/colors";
import { getClasses, resolveClassFilter } from "@/services/class.service";
import { getReportData, ReportStudentRow } from "@/services/report.service";
import {
  AcademicMonthOption,
  getDefaultAcademicMonth,
} from "@/utils/academicYear";

const LIMIT = 20;

export default function StudentsScreen() {
  const [selectedMonth, setSelectedMonth] = useState<AcademicMonthOption>(() =>
    getDefaultAcademicMonth(),
  );
  const [selectedClass, setSelectedClass] = useState("ALL");
  const [classes, setClasses] = useState<string[]>(["ALL"]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [rows, setRows] = useState<ReportStudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timeout);
  }, [search]);

  const fetchClasses = async () => {
    const { data, error } = await getClasses();
    if (error) {
      console.log(error);
      return;
    }
    setClasses(data);
  };

  const fetchStudents = useCallback(
    async (pageNumber: number) => {
      try {
        if (pageNumber === 0) {
          setLoading(true);
          setError(false);
        } else {
          setLoadingMore(true);
        }

        const { gradeId, divisionId } = await resolveClassFilter(selectedClass);
        const { data, error } = await getReportData({
          gradeId,
          divisionId,
          month: selectedMonth.month,
          year: selectedMonth.year,
          search: debouncedSearch,
          page: pageNumber,
          limit: LIMIT,
        });

        if (error || !data) {
          setError(true);
          return;
        }

        setHasMore(data.length === LIMIT);
        setRows((prev) => (pageNumber === 0 ? data : [...prev, ...data]));
      } catch (err) {
        console.log(err);
        setError(true);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [selectedClass, selectedMonth, debouncedSearch],
  );

  useFocusEffect(
    useCallback(() => {
      fetchClasses();
    }, []),
  );

  useEffect(() => {
    setPage(0);
    setHasMore(true);
    fetchStudents(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass, selectedMonth, debouncedSearch]);

  const loadMore = () => {
    if (loading || loadingMore || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchStudents(nextPage);
  };

  if (error) {
    return (
      <ErrorState
        title="Failed to Load Students"
        subtitle="Could not fetch student records. Please try again."
        onRetry={() => fetchStudents(0)}
      />
    );
  }

  return (
    <ScreenWrapper>
      <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        // Row cards below carry their own elevation (card shadow), which on
        // Android wins stacking over plain zIndex — the header (and its open
        // dropdowns) needs a higher elevation too or list rows draw over it.
        ListHeaderComponentStyle={{ zIndex: 10, elevation: 10 }}
        onEndReachedThreshold={0.5}
        onEndReached={loadMore}
        renderItem={({ item }) => (
          <StudentFeeRow
            row={item}
            onPress={() =>
              router.push({
                pathname: "/(admin)/students/[id]",
                params: { id: item.id },
              })
            }
          />
        )}
        ListEmptyComponent={
          loading ? null : (
            <EmptyState
              title={debouncedSearch.trim() ? "No Results" : "No Students Yet"}
              subtitle={
                debouncedSearch.trim()
                  ? `No students match "${debouncedSearch}"`
                  : "Tap “+ Add” to register the first student."
              }
              icon="school-outline"
              iconColor={Colors.primary}
              iconBgColor={Colors.primaryLight}
            />
          )
        }
        ListFooterComponent={
          loading || loadingMore ? (
            <View style={{ paddingVertical: 24, alignItems: "center" }}>
              <ActivityIndicator color={Colors.primary} />
            </View>
          ) : null
        }
        ListHeaderComponent={
          <>
            {/* Header */}
            <PageHeader
              title="Students"
              subtitle={`${rows.length}${hasMore ? "+" : ""} students`}
              showBack
              action={
                <AppButton
                  label="+ Add"
                  onPress={() => router.push("/(admin)/students/create")}
                  size="sm"
                  variant="primary"
                />
              }
            />

            {/* Academic Month + Class Filter — zIndex so an open dropdown here
                paints above the Search box below it, not the other way round. */}
            <View style={{ flexDirection: "row", gap: 10, zIndex: 10 }}>
              <View style={{ flex: 1 }}>
                <AcademicMonthSelect
                  value={selectedMonth}
                  onChange={setSelectedMonth}
                />
              </View>
              <View style={{ flex: 1 }}>
                <AppSelect
                  label="Class"
                  iconName="funnel-outline"
                  value={selectedClass}
                  options={classes.map((item) => ({ label: item, value: item }))}
                  searchable
                  onChange={(value) => setSelectedClass(String(value))}
                />
              </View>
            </View>

            {/* Search */}
            <View style={{ marginBottom: 16 }}>
              <AppInput
                placeholder="Search students..."
                value={search}
                onChangeText={setSearch}
                iconName="search"
              />
            </View>
          </>
        }
      />
    </ScreenWrapper>
  );
}
