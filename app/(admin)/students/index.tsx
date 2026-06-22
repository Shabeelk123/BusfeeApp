import { ActivityIndicator, View } from "react-native";

import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";

import AppButton from "@/components/common/AppButton";
import AppInput from "@/components/common/AppInput";
import AppSelect from "@/components/common/AppSelect";
import ErrorState from "@/components/common/ErrorState";
import PageHeader from "@/components/common/PageHeader";
import ScreenWrapper from "@/components/common/ScreenWrapper";
import StudentsList from "@/components/students/StudentsList";
import { Colors } from "@/constants/colors";
import { getClasses } from "@/services/class.service";
import { getStudents } from "@/services/student.service";

export default function StudentsScreen() {
  const [students, setStudents] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState("ALL");
  const [classes, setClasses] = useState<string[]>(["ALL"]);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);

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

  const LIMIT = 20;

  const fetchStudents = async (pageNumber = 0) => {
    try {
      if (pageNumber === 0) {
        setLoading(true);
        setError(false);
      }

      const { data, error } = await getStudents({
        page: pageNumber,
        limit: LIMIT,
        search: debouncedSearch,
        selectedClass,
      });

      if (error) {
        console.log(error);
        setError(true);
        return;
      }

      if (data) {
        setHasMore(data.length === LIMIT);

        if (pageNumber === 0) {
          setStudents(data);
        } else {
          setStudents((prev) => [...prev, ...data]);
        }
      }
    } catch (err) {
      console.log(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchClasses();
    }, []),
  );

  useEffect(() => {
    setPage(0);
    setHasMore(true);
    setStudents([]);
    fetchStudents(0);
  }, [debouncedSearch, selectedClass]);

  const loadMore = () => {
    if (loading || !hasMore || search.trim()) {
      return;
    }

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
      {/* Header */}
      <PageHeader
        title="Students"
        subtitle={`${students.length} students`}
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

      {/* Filters */}
      <View style={{ marginBottom: 16 }}>
        <AppSelect
          value={selectedClass}
          options={classes.map((item) => ({
            label: item,
            value: item,
          }))}
          onChange={(value) => setSelectedClass(String(value))}
        />
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

      {/* Student List */}
      <StudentsList
        students={students}
        loading={loading}
        onEndReached={loadMore}
        ListFooterComponent={
          hasMore ? (
            <View style={{ paddingVertical: 24, alignItems: "center" }}>
              <ActivityIndicator color={Colors.primary} />
            </View>
          ) : null
        }
        onStudentPress={(student) =>
          router.push({
            pathname: "/(admin)/students/[id]",
            params: { id: student.id },
          })
        }
      />
    </ScreenWrapper>
  );
}
