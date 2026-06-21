import { Ionicons } from "@expo/vector-icons";
import { forwardRef } from "react";
import { Text, TextInput, TextInputProps, View } from "react-native";
import { Colors } from "../../constants/colors";

interface Props extends TextInputProps {
    label?: string;
    required?: boolean;
    iconName?: keyof typeof Ionicons.glyphMap;
    error?: string;
    hint?: string;
}

const AppInput = forwardRef<TextInput, Props>(function AppInput(
    { label, required, iconName, error, hint, style, ...rest },
    ref
) {
    const hasError = !!error;

    return (
        <View style={{ marginBottom: 16 }}>
            {/* Label */}
            {label && (
                <Text
                    style={{
                        fontSize: 13,
                        fontWeight: "600",
                        color: Colors.textPrimary,
                        marginBottom: 6,
                        marginLeft: 2,
                    }}
                >
                    {label}
                    {required && (
                        <Text style={{ color: Colors.danger }}> *</Text>
                    )}
                </Text>
            )}

            {/* Input row */}
            <View
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    borderRadius: 12,
                    borderWidth: 1.5,
                    borderColor: hasError ? Colors.danger : Colors.inputBorder,
                    backgroundColor: Colors.inputBg,
                    paddingHorizontal: 14,
                    minHeight: 50,
                }}
            >
                {iconName && (
                    <Ionicons
                        name={iconName}
                        size={18}
                        color={hasError ? Colors.danger : Colors.iconDefault}
                        style={{ marginRight: 10 }}
                    />
                )}
                <TextInput
                    ref={ref}
                    placeholderTextColor={Colors.textMuted}
                    style={[
                        {
                            flex: 1,
                            fontSize: 15,
                            color: Colors.textPrimary,
                            paddingVertical: 12,
                        },
                        style,
                    ]}
                    {...rest}
                />
            </View>

            {/* Error / hint */}
            {hasError ? (
                <Text
                    style={{
                        fontSize: 12,
                        color: Colors.danger,
                        marginTop: 4,
                        marginLeft: 2,
                    }}
                >
                    {error}
                </Text>
            ) : hint ? (
                <Text
                    style={{
                        fontSize: 12,
                        color: Colors.textMuted,
                        marginTop: 4,
                        marginLeft: 2,
                    }}
                >
                    {hint}
                </Text>
            ) : null}
        </View>
    );
});

export default AppInput;
