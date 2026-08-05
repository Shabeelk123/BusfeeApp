import { Text, View } from "react-native";

import { Colors } from "../../constants/colors";

export default function AccountStatusChip({ enabled }: { enabled: boolean }) {
    return (
        <View
            style={{
                backgroundColor: enabled ? Colors.successLight : Colors.dangerLight,
                borderRadius: 999,
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderWidth: 1,
                borderColor: enabled ? Colors.successBorder : Colors.dangerBorder,
            }}
        >
            <Text
                style={{
                    fontSize: 11,
                    fontWeight: "700",
                    color: enabled ? Colors.success : Colors.danger,
                }}
            >
                {enabled ? "Active" : "Disabled"}
            </Text>
        </View>
    );
}
