import {
    Ionicons,
} from "@expo/vector-icons";

import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import {
    FlatList,
    Keyboard,
    Pressable,
    Text,
    TextInput,
    TouchableWithoutFeedback,
    View,
} from "react-native";

export interface DropdownOption {
    label: string;

    value:
    | string
    | number;
}

interface Props {
    label?: string;

    value:
    | string
    | number;

    options?: DropdownOption[];

    placeholder?: string;

    searchable?: boolean;

    onChange: (
        value:
            | string
            | number
    ) => void;
}

export default function AppSelect({
    label,
    value,
    options = [],
    placeholder = "Select",
    searchable = true,
    onChange,
}: Props) {
    const [
        open,
        setOpen,
    ] = useState(false);

    const [
        search,
        setSearch,
    ] = useState("");

    const inputRef =
        useRef<TextInput>(null);

    const selectedOption =
        options.find(
            (item) =>
                item.value ===
                value
        );

    useEffect(() => {
        if (open && searchable) {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 150);
        }
    }, [open]);

    const filteredOptions =
        useMemo(() => {
            return options.filter(
                (item) =>
                    item.label
                        .toLowerCase()
                        .includes(
                            search.toLowerCase()
                        )
            );
        }, [
            options,
            search,
        ]);

    return (
        <TouchableWithoutFeedback
            onPress={() => {
                Keyboard.dismiss();

                setOpen(false);
            }}
        >
            <View className="mb-4">
                {/* Label */}
                {label && (
                    <Text className="mb-2 text-sm font-semibold text-slate-700">
                        {label}
                    </Text>
                )}

                {/* Trigger */}
                <Pressable
                    onPress={() =>
                        setOpen(
                            !open
                        )
                    }
                    className={`flex-row items-center justify-between rounded-2xl border px-4 py-4 ${open
                        ? "border-blue-500 bg-white"
                        : "border-slate-200 bg-white"
                        }`}
                >
                    <Text
                        className={`font-medium ${selectedOption
                            ? "text-slate-900"
                            : "text-slate-400"
                            }`}
                    >
                        {selectedOption
                            ?.label ||
                            placeholder}
                    </Text>

                    <Ionicons
                        name={
                            open
                                ? "chevron-up"
                                : "chevron-down"
                        }
                        size={20}
                        color="#475569"
                    />
                </Pressable>

                {/* Dropdown */}
                {open && (
                    <View className="mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
                        {/* Search */}
                        {searchable && (
                            <View className="flex-row items-center border-b border-slate-100 px-4">
                                <Ionicons
                                    name="search"
                                    size={18}
                                    color="#94A3B8"
                                />

                                <TextInput
                                    ref={
                                        inputRef
                                    }
                                    value={
                                        search
                                    }
                                    onChangeText={
                                        setSearch
                                    }
                                    placeholder="Search..."
                                    placeholderTextColor="#94A3B8"
                                    className="flex-1 px-3 py-4 text-slate-900"
                                />
                            </View>
                        )}

                        {/* Options */}
                        <FlatList
                            keyboardShouldPersistTaps="handled"
                            nestedScrollEnabled
                            data={
                                filteredOptions
                            }
                            keyExtractor={(
                                item
                            ) =>
                                item.value.toString()
                            }
                            style={{
                                maxHeight: 280,
                            }}
                            renderItem={({
                                item,
                            }) => {
                                const isSelected =
                                    item.value ===
                                    value;

                                return (
                                    <Pressable
                                        onPress={() => {
                                            onChange(
                                                item.value
                                            );

                                            setOpen(
                                                false
                                            );

                                            setSearch(
                                                ""
                                            );
                                        }}
                                        className={`flex-row items-center justify-between px-4 py-4 ${isSelected
                                            ? "bg-blue-50"
                                            : "bg-white"
                                            }`}
                                    >
                                        <Text
                                            className={`font-medium ${isSelected
                                                ? "text-blue-700"
                                                : "text-slate-700"
                                                }`}
                                        >
                                            {
                                                item.label
                                            }
                                        </Text>

                                        {isSelected && (
                                            <Ionicons
                                                name="checkmark-circle"
                                                size={
                                                    20
                                                }
                                                color="#2563EB"
                                            />
                                        )}
                                    </Pressable>
                                );
                            }}
                            ListEmptyComponent={
                                <View className="items-center py-8">
                                    <Text className="text-slate-400">
                                        No results
                                        found
                                    </Text>
                                </View>
                            }
                        />
                    </View>
                )}
            </View>
        </TouchableWithoutFeedback>
    );
}