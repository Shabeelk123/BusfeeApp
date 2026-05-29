import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import {
    AppUser,
    UserRole,
} from "../types/auth";

interface AuthState {
    user: AppUser | null;
    role: UserRole | null;
    loading: boolean;
    isAuthenticated: boolean;
}

const initialState: AuthState = {
    user: null,
    role: null,
    loading: false,
    isAuthenticated: false,
};

const authSlice = createSlice({
    name: "auth",

    initialState,

    reducers: {
        setUser: (
            state,
            action: PayloadAction<{
                user: AppUser;
                role: UserRole;
            }>
        ) => {
            state.user = action.payload.user;
            state.role = action.payload.role;
            state.isAuthenticated = true;
        },

        clearUser: (state) => {
            state.user = null;
            state.role = null;
            state.isAuthenticated = false;
        },

        setLoading: (
            state,
            action: PayloadAction<boolean>
        ) => {
            state.loading = action.payload;
        },
    },
});

export const {
    setUser,
    clearUser,
    setLoading,
} = authSlice.actions;

export default authSlice.reducer;