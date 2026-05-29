import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { tokenStorage } from "../lib/tokenStorage";
import { setOnUnauthorized } from "../api/client";
import {
  fetchMe,
  login as apiLogin,
  signup as apiSignup,
  verifyEmail as apiVerifyEmail,
  resendVerification as apiResendVerification,
  updateProfile as apiUpdateProfile,
  forgotPassword as apiForgotPassword,
  resetPassword as apiResetPassword,
  changePassword as apiChangePassword,
  uploadAvatar as apiUploadAvatar,
  removeAvatar as apiRemoveAvatar,
} from "../api/auth";
import type { User } from "../types";

type AuthContextValue = {
  user: User | null;
  initialising: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<{ email: string }>;
  verifyEmail: (email: string, code: string) => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (name: string) => Promise<void>;
  uploadAvatar: (file: { uri: string; name: string; type: string }) => Promise<void>;
  removeAvatar: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initialising, setInitialising] = useState(true);

  const signOut = useCallback(async () => {
    await tokenStorage.clear();
    setUser(null);
  }, []);

  // On startup: if we have a token, validate it with /me.
  useEffect(() => {
    (async () => {
      const token = await tokenStorage.get();
      if (!token) { setInitialising(false); return; }
      try {
        const me = await fetchMe();
        setUser(me);
      } catch {
        await tokenStorage.clear();
      } finally {
        setInitialising(false);
      }
    })();
  }, []);

  useEffect(() => {
    setOnUnauthorized(() => { void signOut(); });
    return () => setOnUnauthorized(null);
  }, [signOut]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { token, user: u } = await apiLogin(email, password);
    await tokenStorage.set(token);
    setUser(u);
  }, []);

  // Sign up DOES NOT log the user in — they need to verify first.
  // Returns the email so the screen can navigate to /verify with it.
  const signUp = useCallback(async (email: string, password: string, name: string) => {
    const res = await apiSignup(email, password, name);
    return { email: res.email };
  }, []);

  const verifyEmail = useCallback(async (email: string, code: string) => {
    const { token, user: u } = await apiVerifyEmail(email, code);
    await tokenStorage.set(token);
    setUser(u);
  }, []);

  const resendVerification = useCallback(async (email: string) => {
    await apiResendVerification(email);
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    await apiForgotPassword(email);
  }, []);

  // Reset password also logs in — server returns a fresh token.
  const resetPassword = useCallback(async (email: string, code: string, newPassword: string) => {
    const { token, user: u } = await apiResetPassword(email, code, newPassword);
    await tokenStorage.set(token);
    setUser(u);
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    await apiChangePassword(currentPassword, newPassword);
  }, []);

  const updateProfile = useCallback(async (name: string) => {
    const updated = await apiUpdateProfile(name);
    setUser(updated);
  }, []);

  const uploadAvatar = useCallback(async (file: { uri: string; name: string; type: string }) => {
    const updated = await apiUploadAvatar(file);
    setUser(updated);
  }, []);

  const removeAvatar = useCallback(async () => {
    const updated = await apiRemoveAvatar();
    setUser(updated);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user, initialising,
        signIn, signUp, signOut,
        verifyEmail, resendVerification,
        forgotPassword, resetPassword, changePassword,
        updateProfile, uploadAvatar, removeAvatar,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
};
