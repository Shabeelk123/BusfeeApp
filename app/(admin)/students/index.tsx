import {
    ActivityIndicator,
    Pressable,
    Text,
    TextInput,
    View
} from "react-native";

import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import {
    useCallback,
    useEffect,
    useState
} from "react";


import AppSelect from "../../../components/common/AppSelect";
import ScreenWrapper from "../../../components/common/ScreenWrapper";
import StudentsList from "../../../components/students/StudentsList";
import { getClasses } from "../../../services/class.service";
import { getStudents } from "../../../services/student.service";

export default function StudentsScreen() {
    const [students, setStudents] =
        useState<any[]>([]);
    const [selectedClass, setSelectedClass] =
        useState("ALL");
    const [classes, setClasses] =
        useState<string[]>([
            "ALL",
        ]);

    const [debouncedSearch, setDebouncedSearch] =
        useState("");
    const [loading, setLoading] =
        useState(true);

    const [search, setSearch] =
        useState("");

    const [page, setPage] =
        useState(0);

    const [hasMore, setHasMore] =
        useState(true);

    useEffect(() => {
        const timeout =
            setTimeout(() => {
                setDebouncedSearch(
                    search
                );
            }, 500);

        return () =>
            clearTimeout(timeout);
    }, [search]);

    const fetchClasses =
        async () => {
            const {
                data,
                error,
            } =
                await getClasses();

            if (error) {
                console.log(error);

                return;
            }

            setClasses(data);
        };

    const LIMIT = 20;

    const fetchStudents =
        async (
            pageNumber = 0
        ) => {
            try {
                if (
                    pageNumber === 0
                ) {
                    setLoading(true);
                }

                const {
                    data,
                    error,
                } =
                    await getStudents({
                        page: pageNumber,
                        limit: LIMIT,
                        search: debouncedSearch,
                        selectedClass,
                    });

                if (error) {
                    console.log(
                        error
                    );

                    return;
                }

                if (data) {
                    setHasMore(
                        data.length === LIMIT
                    );

                    if (
                        pageNumber ===
                        0
                    ) {
                        setStudents(
                            data
                        );
                    } else {
                        setStudents(
                            (
                                prev
                            ) => [
                                    ...prev,
                                    ...data,
                                ]
                        );
                    }
                }
            } catch (error) {
                console.log(error);
            } finally {
                setLoading(false);
            }
        };

    useFocusEffect(
        useCallback(() => {
            fetchClasses();
        }, [])
    );

    useEffect(() => {
        setPage(0);

        setHasMore(true);
        setStudents([]);

        fetchStudents(0);
    }, [debouncedSearch, selectedClass]);


    const loadMore =
        () => {
            if (
                loading ||
                !hasMore ||
                search.trim()
            ) {
                return;
            }

            const nextPage =
                page + 1;

            setPage(nextPage);

            fetchStudents(
                nextPage
            );
        };

    return (
        <ScreenWrapper>
            {/* Header */}
            <View className="mb-6 flex-row items-center justify-between">
                <View>
                    <Text className="text-3xl font-black tracking-tight text-gray-900">
                        Students
                    </Text>

                    <Text className="mt-1 text-sm text-gray-500">
                        {
                            students.length
                        }{" "}
                        students
                    </Text>
                </View>

                <Pressable
                    onPress={() =>
                        router.push(
                            "/(admin)/students/create"
                        )
                    }
                    className="rounded-2xl bg-blue-600 px-5 py-3"
                >
                    <Text className="font-semibold text-white">
                        + Add
                    </Text>
                </Pressable>
            </View>

            <AppSelect
                value={selectedClass}
                options={classes.map(
                    (item) => ({
                        label: item,
                        value: item,
                    })
                )}
                onChange={(value) =>
                    setSelectedClass(
                        String(value)
                    )
                }
            />

            {/* Search */}
            <View className="mb-5 flex-row items-center rounded-2xl border border-gray-200 bg-white px-4">
                <Text className="mr-2 text-gray-400">
                    🔍
                </Text>

                <TextInput
                    value={search}
                    onChangeText={
                        setSearch
                    }
                    placeholder="Search students..."
                    placeholderTextColor="#9CA3AF"
                    className="flex-1 py-4 text-base text-gray-900"
                />
            </View>

            {/* Student List */}
            <StudentsList
                students={students}
                loading={loading}
                onEndReached={
                    loadMore
                }
                ListFooterComponent={
                    hasMore ? (
                        <View className="py-6">
                            <ActivityIndicator />
                        </View>
                    ) : null
                }
                onStudentPress={(
                    student
                ) =>
                    router.push({
                        pathname:
                            "/(admin)/students/[id]",

                        params: {
                            id: student.id,
                        },
                    })
                }
            />
        </ScreenWrapper >
    );
}
