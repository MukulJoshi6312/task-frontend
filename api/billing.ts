import client from "./client";
import type { User } from "../types";

type UserResponse = { success: boolean; user: User };

// DEV ONLY — mimics a successful purchase so you can test the premium UX
// before wiring real RevenueCat in-app purchases.
export const mockUpgrade = (): Promise<User> =>
  client.post<UserResponse>("/billing/mock-upgrade").then((r) => r.data.user);

export const mockDowngrade = (): Promise<User> =>
  client.post<UserResponse>("/billing/mock-downgrade").then((r) => r.data.user);
