import { useNotify } from "../../../context/NotifyContext";

export default function NotificationComponent() {
  const { notifications, markAsRead } = useNotify();

  return (
    <div className="absolute right-0 mt-3 w-80 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f1f1b] shadow-xl">
      <div className="p-3 border-b border-gray-200 dark:border-white/10">
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          Notifications
        </p>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 && (
          <p className="p-4 text-sm text-gray-500">
            No notifications
          </p>
        )}

        {notifications.map(n => (
          <button
            key={n.id}
            onClick={() => markAsRead(n.id)}
            className={`w-full text-left px-4 py-3 border-b border-gray-100 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5 transition ${
              !n.isRead
                ? "bg-emerald-50/40 dark:bg-emerald-500/5"
                : ""
            }`}
          >
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {n.title}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {n.message}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
