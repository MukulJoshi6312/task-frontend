import client from "./client";
import { describeDevice } from "../lib/device";
import type { User } from "../types";

type AuthResponse = { success: boolean; token: string; user: User };
type MeResponse = { success: boolean; user: User };
type SignupResponse = { success: boolean; message: string; email: string };
type SimpleResponse = { success: boolean; message: string };

export const signup = (
  email: string,
  password: string,
  name: string
): Promise<SignupResponse> =>
  client.post<SignupResponse>("/auth/signup", { email, password, name }).then((r) => r.data);

export const verifyEmail = (email: string, code: string): Promise<AuthResponse> =>
  client.post<AuthResponse>("/auth/verify", { email, code, device: describeDevice() }).then((r) => r.data);

export const resendVerification = (email: string): Promise<SimpleResponse> =>
  client.post<SimpleResponse>("/auth/resend-verification", { email }).then((r) => r.data);

export const login = (email: string, password: string): Promise<AuthResponse> =>
  client.post<AuthResponse>("/auth/login", { email, password, device: describeDevice() }).then((r) => r.data);

export const fetchMe = (): Promise<User> =>
  client.get<MeResponse>("/auth/me").then((r) => r.data.user);

export const updateProfile = (name: string): Promise<User> =>
  client.put<MeResponse>("/auth/profile", { name }).then((r) => r.data.user);

export const forgotPassword = (email: string): Promise<SimpleResponse> =>
  client.post<SimpleResponse>("/auth/forgot-password", { email }).then((r) => r.data);

export const resetPassword = (
  email: string,
  code: string,
  newPassword: string
): Promise<AuthResponse> =>
  client.post<AuthResponse>("/auth/reset-password", { email, code, newPassword, device: describeDevice() }).then((r) => r.data);

export const changePassword = (
  currentPassword: string,
  newPassword: string
): Promise<SimpleResponse> =>
  client.put<SimpleResponse>("/auth/password", { currentPassword, newPassword }).then((r) => r.data);

// React Native's FormData accepts this shape for files. The web/browser type
// for FormData.append rejects it, so we cast through `any` at the boundary.
type RNFile = { uri: string; name: string; type: string };

export const uploadAvatar = (file: RNFile): Promise<User> => {
  const form = new FormData();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form.append("avatar", file as any);
  return client
    .post<MeResponse>("/auth/avatar", form, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data.user);
};

export const removeAvatar = (): Promise<User> =>
  client.delete<MeResponse>("/auth/avatar").then((r) => r.data.user);
