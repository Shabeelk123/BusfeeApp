export type AccountType = "CLASS" | "COORDINATOR";

export interface ResetAccountPasswordRequest {
  accountId: string;
  accountType: AccountType;
  newPassword: string;
}
