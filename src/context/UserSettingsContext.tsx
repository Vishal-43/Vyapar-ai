import React, { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

export const NotificationType = {
  EMAIL: "EMAIL",
  PUSH: "PUSH",
  IN_APP: "IN_APP",
} as const;
export type NotificationType = typeof NotificationType[keyof typeof NotificationType];

export const PreferredLanguage = {
  ENGLISH: "ENGLISH",
  HINDI: "HINDI",
  SPANISH: "SPANISH",
  FRENCH: "FRENCH",
} as const;
export type PreferredLanguage = typeof PreferredLanguage[keyof typeof PreferredLanguage];

export const Theme = {
  LIGHT: "LIGHT",
  DARK: "DARK",
  AUTO: "AUTO",
} as const;
export type Theme = typeof Theme[keyof typeof Theme];

export interface NotificationPreference {
  notification_type: NotificationType;
  enabled: boolean;
  frequency: string;
}

export interface UserProfile {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  organization?: string;
  bio?: string;
  language: PreferredLanguage;
  theme: Theme;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  is_email_verified: boolean;
  is_phone_verified: boolean;
}

export interface APIKey {
  key_id: string;
  name: string;
  key_prefix: string;
  created_at: string;
  last_used?: string;
  expires_at?: string;
  is_active: boolean;
}

export interface CreatedAPIKey extends APIKey {
  secret_key: string;
}

export interface SecuritySettings {
  user_id: string;
  two_factor_enabled: boolean;
  two_factor_method?: string;
  last_password_change?: string;
  active_sessions: number;
  suspicious_login_attempts: number;
  last_login?: string;
}

export interface Session {
  session_id: string;
  device: string;
  ip_address: string;
  created_at: string;
  last_activity: string;
  is_current: boolean;
}

interface UserSettingsContextType {
  profile: UserProfile | null;
  notifications: NotificationPreference[] | null;
  apiKeys: APIKey[];
  securitySettings: SecuritySettings | null;
  sessions: Session[];
  isLoading: boolean;
  error: string | null;
  
  getProfile: () => Promise<UserProfile>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<UserProfile>;
  getNotifications: () => Promise<NotificationPreference[]>;
  updateNotifications: (prefs: NotificationPreference[]) => Promise<NotificationPreference[]>;
  listAPIKeys: () => Promise<APIKey[]>;
  createAPIKey: (name: string, expiresInDays?: number) => Promise<CreatedAPIKey>;
  revokeAPIKey: (keyId: string) => Promise<void>;
  getSecuritySettings: () => Promise<SecuritySettings>;
  enableTwoFactor: (method: string) => Promise<{ secret: string; method: string }>;
  disableTwoFactor: () => Promise<void>;
  listSessions: () => Promise<Session[]>;
  revokeSession: (sessionId: string) => Promise<void>;
  revokeAllSessions: () => Promise<void>;
}

const UserSettingsContext = createContext<UserSettingsContextType | undefined>(undefined);

export const useUserSettings = () => {
  const context = useContext(UserSettingsContext);
  if (!context) {
    throw new Error("useUserSettings must be used within UserSettingsProvider");
  }
  return context;
};

interface UserSettingsProviderProps {
  children: ReactNode;
}

export const UserSettingsProvider: React.FC<UserSettingsProviderProps> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [notifications, setNotifications] = useState<NotificationPreference[] | null>(null);
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

  const getProfile = async (): Promise<UserProfile> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/v1/settings/profile`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch profile");
      const data = await response.json();
      setProfile(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>): Promise<UserProfile> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/v1/settings/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error("Failed to update profile");
      const data = await response.json();
      setProfile(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getNotifications = async (): Promise<NotificationPreference[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/v1/settings/notifications`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch notifications");
      const data = await response.json();
      setNotifications(data.preferences);
      return data.preferences;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateNotifications = async (prefs: NotificationPreference[]): Promise<NotificationPreference[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/v1/settings/notifications`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ preferences: prefs }),
      });
      if (!response.ok) throw new Error("Failed to update notifications");
      const data = await response.json();
      setNotifications(data.preferences);
      return data.preferences;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const listAPIKeys = async (): Promise<APIKey[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/v1/settings/api-keys`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch API keys");
      const data = await response.json();
      setApiKeys(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const createAPIKey = async (name: string, expiresInDays?: number): Promise<CreatedAPIKey> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/v1/settings/api-keys`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ name, expires_in_days: expiresInDays }),
      });
      if (!response.ok) throw new Error("Failed to create API key");
      const data = await response.json();
      await listAPIKeys();
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const revokeAPIKey = async (keyId: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/v1/settings/api-keys/${keyId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to revoke API key");
      await listAPIKeys();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getSecuritySettings = async (): Promise<SecuritySettings> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/v1/settings/security`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch security settings");
      const data = await response.json();
      setSecuritySettings(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const enableTwoFactor = async (method: string): Promise<{ secret: string; method: string }> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/v1/settings/security/two-factor/enable`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ method }),
      });
      if (!response.ok) throw new Error("Failed to enable 2FA");
      const data = await response.json();
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const disableTwoFactor = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/v1/settings/security/two-factor/disable`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to disable 2FA");
      await getSecuritySettings();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const listSessions = async (): Promise<Session[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/v1/settings/sessions`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch sessions");
      const data = await response.json();
      setSessions(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const revokeSession = async (sessionId: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/v1/settings/sessions/${sessionId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to revoke session");
      await listSessions();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const revokeAllSessions = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/v1/settings/sessions/revoke-all`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to revoke all sessions");
      await listSessions();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const value: UserSettingsContextType = {
    profile,
    notifications,
    apiKeys,
    securitySettings,
    sessions,
    isLoading,
    error,
    getProfile,
    updateProfile,
    getNotifications,
    updateNotifications,
    listAPIKeys,
    createAPIKey,
    revokeAPIKey,
    getSecuritySettings,
    enableTwoFactor,
    disableTwoFactor,
    listSessions,
    revokeSession,
    revokeAllSessions,
  };

  return (
    <UserSettingsContext.Provider value={value}>
      {children}
    </UserSettingsContext.Provider>
  );
};
