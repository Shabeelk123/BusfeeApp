import StudentDetails from "../../../components/students/StudentDetails";

export default function TeacherStudentDetails() {
    return (
        <StudentDetails
            role="TEACHER"
            baseRoute="/(teacher)"
        />
    );
}