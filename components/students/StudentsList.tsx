import { FlatList } from "react-native";
import StudentCard from "./StudentCard";
import EmptyState from "../common/EmptyState";
import LoadingState from "../common/LoadingState";

interface Props {
    students: any[];

    loading: boolean;

    onStudentPress: (
        student: any
    ) => void;

    onEndReached?: () => void;

    ListFooterComponent?: React.ReactElement | null;

    ListEmptyComponent?: React.ReactElement | null;
}
export default function StudentsList({ students, loading, onStudentPress, onEndReached, ListFooterComponent, ListEmptyComponent }: Props) {
    if (loading) {
        return <LoadingState title="Loading Students" subtitle="Fetching student records…" fullScreen={false} />;
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
            ListEmptyComponent={
                ListEmptyComponent ?? (
                    <EmptyState
                        title="No Students Found"
                        subtitle="Add a student to get started."
                        icon="school-outline"
                        iconColor="#6366F1"
                        iconBgColor="#EEF2FF"
                    />
                )
            }
            renderItem={({ item }) => (
                <StudentCard
                    student={item}
                    onPress={() => onStudentPress(item)}
                />
            )}
        />
    );
}