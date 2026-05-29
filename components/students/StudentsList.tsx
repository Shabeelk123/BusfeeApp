import { ActivityIndicator, FlatList, Text, View } from "react-native";
import StudentCard from "./StudentCard";

interface Props {
    students: any[];

    loading: boolean;

    onStudentPress: (
        student: any
    ) => void;

    onEndReached?: () => void;

    ListFooterComponent?: React.ReactElement | null;
}
export default function StudentsList({ students, loading, onStudentPress, onEndReached, ListFooterComponent }: Props) {
    if (loading) {
        return (
            <View className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" color="#6366f1" />
                <Text className="mt-3 text-sm text-slate-400">Loading students...</Text>
            </View>
        );
    }

    return (
        <FlatList
            data={students}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
            onEndReached={onEndReached}

            onEndReachedThreshold={0.5}

            ListFooterComponent={
                ListFooterComponent
            }
            ListEmptyComponent={() => (
                <View className="mt-20 items-center">
                    <Text className="text-5xl">🎓</Text>
                    <Text className="mt-4 text-lg font-semibold text-slate-400">No students found</Text>
                    <Text className="mt-1 text-sm text-slate-600">Add a student to get started</Text>
                </View>
            )}
            renderItem={({ item }) => (
                <StudentCard
                    student={item}
                    onPress={() => onStudentPress(item)}
                />
            )}
        />
    );
}