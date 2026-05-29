import StudentDetails from "../../../components/students/StudentDetails";

export default function AdminStudentDetails() {
    return (
        <StudentDetails
            role="ADMIN"
            baseRoute="/(admin)"
        />
    );
}