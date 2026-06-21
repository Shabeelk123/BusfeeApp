import {
    ReactNode,
} from "react";

import {
    StatusBar,
    View,
} from "react-native";

import {
    SafeAreaView,
} from "react-native-safe-area-context";

interface Props {
    children: ReactNode;

    backgroundColor?: string;
}

export default function ScreenWrapper({
    children,
    backgroundColor = "#F8FAFC",
}: Props) {
    return (
        <SafeAreaView
            edges={["top"]}
            style={{
                flex: 1,
                backgroundColor,
            }}
        >
            <StatusBar
                barStyle="dark-content"
                backgroundColor={
                    backgroundColor
                }
            />

            <View className="flex-1 px-5 pt-4">
                {children}
            </View>
        </SafeAreaView>
    );
}