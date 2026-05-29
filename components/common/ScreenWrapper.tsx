import {
    ReactNode,
} from "react";

import {
    SafeAreaView,
    StatusBar,
    View,
} from "react-native";

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

            <View
                className="flex-1"
                style={{
                    paddingTop: 12,
                }}
            >
                {children}
            </View>
        </SafeAreaView>
    );
}