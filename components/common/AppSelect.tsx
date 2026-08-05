import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    Modal,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";

import { Colors, Radius, Shadows } from "../../constants/colors";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DropdownOption {
    label: string;
    value: string | number;
    icon?: keyof typeof Ionicons.glyphMap;
}

interface Props {
    label?: string;
    required?: boolean;
    value: string | number | null | undefined;
    options?: DropdownOption[];
    placeholder?: string;
    /** Show a search box inside the dropdown. Default off — turn on for long lists. */
    searchable?: boolean;
    disabled?: boolean;
    loading?: boolean;
    error?: string;
    /** Leading icon on the trigger (e.g. "calendar-outline", "grid-outline"). */
    iconName?: keyof typeof Ionicons.glyphMap;
    onChange: (value: string | number) => void;
    /** Override how each row renders. Receives the option and whether it's selected. */
    renderOption?: (option: DropdownOption, selected: boolean) => React.ReactNode;
}

// ─── Constants ────────────────────────────────────────────────────────────────
// Fixed (not max) — every AppSelect across the app gets the same footprint
// regardless of how many options it has, scrolling internally past that.
const PANEL_HEIGHT = 260;
const ROW_MIN_HEIGHT = 50;

interface Anchor {
    top: number;
    left: number;
    width: number;
    /** Clamped to whatever room is actually left below the trigger on screen. */
    maxHeight: number;
}

export default function AppSelect({
    label,
    required,
    value,
    options = [],
    placeholder = "Select",
    searchable = false,
    disabled = false,
    loading = false,
    error,
    iconName,
    onChange,
    renderOption,
}: Props) {
    const [open, setOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [search, setSearch] = useState("");
    const [anchor, setAnchor] = useState<Anchor | null>(null);
    const triggerRef = useRef<View>(null);
    const inputRef = useRef<TextInput>(null);
    const progress = useSharedValue(0);

    const hasError = !!error;
    const isInteractive = !disabled && !loading;
    const selectedOption = options.find((item) => item.value === value);

    const filteredOptions = useMemo(() => {
        if (!searchable || !search.trim()) return options;
        const q = search.toLowerCase();
        return options.filter((item) => item.label.toLowerCase().includes(q));
    }, [options, search, searchable]);

    const close = () => {
        progress.value = withTiming(0, { duration: 150 });
        setOpen(false);
        setTimeout(() => setMounted(false), 150);
    };

    const toggle = () => {
        if (!isInteractive) return;
        if (open) {
            close();
            return;
        }

        // Measure the trigger's on-screen position so the dropdown (rendered in
        // a Modal, outside this component's own layout tree) can anchor itself
        // directly under it.
        triggerRef.current?.measureInWindow((x, y, width, height) => {
            const windowHeight = Dimensions.get("window").height;
            const top = y + height + 8;
            setAnchor({
                top,
                left: x,
                width,
                maxHeight: Math.max(120, Math.min(PANEL_HEIGHT, windowHeight - top - 16)),
            });
            setMounted(true);
            setOpen(true);
            progress.value = withTiming(1, { duration: 180 });
        });
    };

    useEffect(() => {
        if (open && searchable) {
            const t = setTimeout(() => inputRef.current?.focus(), 150);
            return () => clearTimeout(t);
        }
    }, [open, searchable]);

    const panelStyle = useAnimatedStyle(() => ({
        opacity: progress.value,
        transform: [{ translateY: (1 - progress.value) * -6 }],
    }));

    const chevronStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${progress.value * 180}deg` }],
    }));

    const triggerBorderColor = hasError
        ? Colors.danger
        : open
            ? Colors.primary
            : Colors.inputBorder;

    const triggerBg = hasError ? Colors.dangerLight : disabled ? Colors.cardBorderLight : Colors.inputBg;

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
                    {required && <Text style={{ color: Colors.danger }}> *</Text>}
                </Text>
            )}

            {/* Trigger */}
            <Pressable
                ref={triggerRef}
                onPress={toggle}
                disabled={!isInteractive}
                accessibilityRole="button"
                accessibilityLabel={label ?? placeholder}
                accessibilityState={{ disabled: !isInteractive, expanded: open }}
                style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    borderRadius: Radius.input,
                    borderWidth: 1.5,
                    borderColor: triggerBorderColor,
                    backgroundColor: triggerBg,
                    paddingHorizontal: 14,
                    minHeight: ROW_MIN_HEIGHT,
                    opacity: disabled ? 0.6 : pressed ? 0.85 : 1,
                })}
            >
                {iconName && (
                    <Ionicons
                        name={iconName}
                        size={18}
                        color={hasError ? Colors.danger : Colors.iconDefault}
                        style={{ marginRight: 10 }}
                    />
                )}

                <Text
                    numberOfLines={1}
                    style={{
                        flex: 1,
                        fontSize: 15,
                        fontWeight: "500",
                        color: selectedOption ? Colors.textPrimary : Colors.textMuted,
                    }}
                >
                    {selectedOption?.label || placeholder}
                </Text>

                {loading ? (
                    <ActivityIndicator size="small" color={Colors.iconDefault} />
                ) : (
                    <Animated.View style={chevronStyle}>
                        <Ionicons name="chevron-down" size={18} color={Colors.iconDefault} />
                    </Animated.View>
                )}
            </Pressable>

            {/* Error */}
            {hasError && (
                <Text style={{ fontSize: 12, color: Colors.danger, marginTop: 4, marginLeft: 2 }}>
                    {error}
                </Text>
            )}

            {/*
                Dropdown — rendered in a Modal, which mounts in its own native
                layer outside this screen's ScrollView entirely. Previously this
                panel was an absolutely-positioned inline View, which meant it
                was still a descendant of whatever ScrollView the screen wrapped
                it in (dashboards, forms, ...) — when both scrolled the same
                direction, the outer ScrollView won the touch gesture and the
                panel's own option list couldn't be scrolled, cutting long lists
                (Academic Month, Class filters) off partway. A Modal sidesteps
                that entirely since it isn't nested inside any ancestor scroll view.
            */}
            {mounted && anchor && (
                <Modal
                    transparent
                    visible={mounted}
                    animationType="none"
                    statusBarTranslucent
                    onRequestClose={close}
                >
                    <Pressable style={{ flex: 1 }} onPress={close}>
                        <Animated.View
                            style={[
                                {
                                    position: "absolute",
                                    top: anchor.top,
                                    left: anchor.left,
                                    width: anchor.width,
                                    borderRadius: Radius.card,
                                    borderWidth: 1,
                                    borderColor: Colors.cardBorder,
                                    backgroundColor: Colors.card,
                                    overflow: "hidden",
                                },
                                Shadows.cardMd,
                                panelStyle,
                            ]}
                        >
                            {/* Stop taps inside the panel from bubbling to the backdrop's onPress */}
                            <Pressable onPress={(e) => e.stopPropagation()}>
                                {searchable && (
                                    <View
                                        style={{
                                            flexDirection: "row",
                                            alignItems: "center",
                                            borderBottomWidth: 1,
                                            borderBottomColor: Colors.cardBorderLight,
                                            paddingHorizontal: 14,
                                        }}
                                    >
                                        <Ionicons name="search" size={16} color={Colors.iconDefault} style={{ marginRight: 8 }} />
                                        <TextInput
                                            ref={inputRef}
                                            value={search}
                                            onChangeText={setSearch}
                                            placeholder="Search..."
                                            placeholderTextColor={Colors.textMuted}
                                            style={{
                                                flex: 1,
                                                paddingVertical: 12,
                                                fontSize: 14,
                                                color: Colors.textPrimary,
                                            }}
                                        />
                                    </View>
                                )}

                                <ScrollView
                                    keyboardShouldPersistTaps="handled"
                                    showsVerticalScrollIndicator
                                    style={{ maxHeight: anchor.maxHeight }}
                                >
                                    {filteredOptions.length === 0 ? (
                                        <View style={{ alignItems: "center", paddingVertical: 32 }}>
                                            <Text style={{ color: Colors.textMuted, fontSize: 13 }}>No results found</Text>
                                        </View>
                                    ) : (
                                        filteredOptions.map((item, index) => {
                                            const isSelected = item.value === value;
                                            const isLast = index === filteredOptions.length - 1;

                                            if (renderOption) {
                                                return (
                                                    <Pressable
                                                        key={item.value.toString()}
                                                        onPress={() => { onChange(item.value); close(); setSearch(""); }}
                                                        accessibilityRole="button"
                                                    >
                                                        {renderOption(item, isSelected)}
                                                    </Pressable>
                                                );
                                            }

                                            return (
                                                <View key={item.value.toString()}>
                                                    <Pressable
                                                        onPress={() => { onChange(item.value); close(); setSearch(""); }}
                                                        accessibilityRole="button"
                                                        style={({ pressed }) => ({
                                                            flexDirection: "row",
                                                            alignItems: "center",
                                                            justifyContent: "space-between",
                                                            minHeight: ROW_MIN_HEIGHT,
                                                            paddingHorizontal: 14,
                                                            backgroundColor: isSelected
                                                                ? Colors.primaryLight
                                                                : pressed
                                                                    ? Colors.cardBorderLight
                                                                    : Colors.card,
                                                        })}
                                                    >
                                                        <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                                                            {item.icon && (
                                                                <Ionicons
                                                                    name={item.icon}
                                                                    size={16}
                                                                    color={isSelected ? Colors.primary : Colors.iconDefault}
                                                                    style={{ marginRight: 8 }}
                                                                />
                                                            )}
                                                            <Text
                                                                numberOfLines={1}
                                                                style={{
                                                                    flex: 1,
                                                                    fontSize: 14,
                                                                    fontWeight: isSelected ? "700" : "500",
                                                                    color: isSelected ? Colors.primary : Colors.textPrimary,
                                                                }}
                                                            >
                                                                {item.label}
                                                            </Text>
                                                        </View>

                                                        {isSelected && (
                                                            <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />
                                                        )}
                                                    </Pressable>
                                                    {!isLast && (
                                                        <View style={{ height: 1, backgroundColor: Colors.cardBorderLight }} />
                                                    )}
                                                </View>
                                            );
                                        })
                                    )}
                                </ScrollView>
                            </Pressable>
                        </Animated.View>
                    </Pressable>
                </Modal>
            )}
        </View>
    );
}
