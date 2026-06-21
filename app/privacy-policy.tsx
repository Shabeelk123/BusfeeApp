import { ScrollView, Text, View } from "react-native";
import ScreenWrapper from "../components/common/ScreenWrapper";

export default function PrivacyPolicyScreen() {
    return (
        <ScreenWrapper>
            <ScrollView showsVerticalScrollIndicator={false}>
                <Text className="mb-2 text-3xl font-bold text-slate-900">
                    Privacy Policy
                </Text>

                <Text className="mb-6 text-slate-500">
                    Last Updated: July 2026
                </Text>

                <Section
                    title="Information We Collect"
                    content="BusFee Tracker collects student, parent, teacher, and fee-related information necessary for school transport fee management."
                />

                <Section
                    title="How We Use Information"
                    content="We use the information solely for managing students, teachers, fee collection, reports, and school administration activities."
                />

                <Section
                    title="Data Storage"
                    content="All data is securely stored using Supabase cloud services and is accessible only to authorized school administrators and teachers."
                />

                <Section
                    title="Data Sharing"
                    content="We do not sell, rent, or share personal information with third parties except as required by law."
                />

                <Section
                    title="Security"
                    content="We use authentication, access controls, and industry-standard security measures to protect stored information."
                />

                <Section
                    title="Contact"
                    content="For privacy-related questions, contact your school administrator."
                />
            </ScrollView>
        </ScreenWrapper>
    );
}

function Section({
    title,
    content,
}: {
    title: string;
    content: string;
}) {
    return (
        <View className="mb-6">
            <Text className="mb-2 text-lg font-bold text-slate-900">
                {title}
            </Text>

            <Text className="leading-6 text-slate-600">
                {content}
            </Text>
        </View>
    );
}