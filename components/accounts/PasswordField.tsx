import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, TextInput, View } from "react-native";

import { Colors } from "../../constants/colors";

interface Props {
    label: string;
    required?: boolean;
    value: string;
    onChangeText: (value: string) => void;
    placeholder?: string;
    error?: string;
    editable?: boolean;
    /** true = plaintext visible, false = masked with dots */
    visible: boolean;
    /** Renders the show/hide eye icon and calls back when tapped. Omit to hide the toggle (e.g. on a "confirm" field that mirrors another field's visibility). */
    onToggleVisible?: () => void;
}

export default function PasswordField({
    label,
    required,
    value,
    onChangeText,
    placeholder,
    error,
    editable = true,
    visible,
    onToggleVisible,
}: Props) {
    const hasError = !!error;

    return (
        <View style={{ marginBottom: 14 }}>
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
                {required && <Text style={{ color: Colors.danger }}> *</Text>}
            </Text>
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
                <Ionicons
                    name="lock-closed-outline"
                    size={18}
                    color={hasError ? Colors.danger : Colors.iconDefault}
                    style={{ marginRight: 10 }}
                />
                <TextInput
                    value={value}
                    onChangeText={onChangeText}
                    secureTextEntry={!visible}
                    placeholder={placeholder}
                    placeholderTextColor={Colors.textMuted}
                    editable={editable}
                    style={{ flex: 1, fontSize: 15, color: Colors.textPrimary, paddingVertical: 12 }}
                />
                {onToggleVisible && (
                    <Pressable onPress={onToggleVisible} hitSlop={8}>
                        <Ionicons
                            name={visible ? "eye-off-outline" : "eye-outline"}
                            size={18}
                            color={Colors.iconDefault}
                        />
                    </Pressable>
                )}
            </View>
            {hasError ? (
                <Text style={{ fontSize: 12, color: Colors.danger, marginTop: 4, marginLeft: 2 }}>
                    {error}
                </Text>
            ) : null}
        </View>
    );
}
