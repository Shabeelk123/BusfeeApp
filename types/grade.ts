// V2 Grade / Division / Account types

export interface Grade {
    id: string;
    name: string;      // '8' | '9' | '10'
    created_at: string;
}

export interface Division {
    id: string;
    grade_id: string;
    name: string;      // 'A' through 'Q'
    created_at: string;
}

export interface ClassAccount {
    id: string;
    user_id: string;
    grade_id: string;
    division_id: string;
    created_at: string;
    /** Joined fields (optional) */
    grade?: Grade;
    division?: Division;
}

export interface CoordinatorAccount {
    id: string;
    user_id: string;
    grade_id: string;
    created_at: string;
    /** Joined field (optional) */
    grade?: Grade;
}
