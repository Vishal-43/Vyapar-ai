
import { createContext, useContext, useState } from "react";

/**
 * BACKEND API RESPONSE (EXPECTED)
 * --------------------------------
 * GET /api/notifications
 *
 * {
 *   success: true,
 *   data: [
 *     {
 *       id: "notif_1",
 *       title: "Inventory Low",
 *       message: "Product ABC stock is below threshold",
 *       isRead: false,
 *       createdAt: "2026-01-25T10:30:00Z"
 *     }
 *   ]
 * }
 */

export type Notification = {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

type NotifyContextType = {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
};

const NotifyContext = createContext<NotifyContextType | null>(null);

export function NotifyProvider({
  children,
  initialData = [],
}: {
  children: React.ReactNode;
  initialData?: Notification[];
}) {
  const [notifications, setNotifications] =
    useState<Notification[]>(initialData);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === id ? { ...n, isRead: true } : n
      )
    );

  };

  return (
    <NotifyContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        setNotifications,
      }}
    >
      {children}
    </NotifyContext.Provider>
  );
}

export const useNotify = () => {
  const ctx = useContext(NotifyContext);
  if (!ctx) {
    throw new Error("useNotify must be used inside NotifyProvider");
  }
  return ctx;
};
