import { NotifyProvider } from "../context/NotifyContext";

const dummyNotifications = [
  {
    id: "1",
    title: "Inventory Alert",
    message: "Low stock detected for Item A",
    isRead: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    title: "Model Updated",
    message: "Forecast model retrained successfully",
    isRead: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "3",
    title: "Insight Generated",
    message: "New demand trend available",
    isRead: true,
    createdAt: new Date().toISOString(),
  },
];

export default function NotifyComponent({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NotifyProvider initialData={dummyNotifications}>
      {children}
    </NotifyProvider>
  );
}
