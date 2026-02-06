import { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useUserSettings } from "../context/UserSettingsContext";
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Skeleton } from "../components/common";
import Breadcrumbs from "../components/common/Breadcrumbs";
import { FiUser, FiLock, FiLogOut, FiSave, FiCheck, FiX } from "react-icons/fi";

export default function UserSettings() {
  const { user } = useUser();
  const {
    profile,
    sessions,
    isLoading,
    error,
    getProfile,
    updateProfile,
    listSessions,
    revokeSession,
    revokeAllSessions,
  } = useUserSettings();

  const [activeTab, setActiveTab] = useState<"profile" | "security">("profile");
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        if (activeTab === "profile") {
          await getProfile();
        } else if (activeTab === "security") {
          await listSessions();
        }
      } catch (err) {
        console.error("Failed to load data:", err);
      }
    };
    loadData();
  }, [activeTab]);

  useEffect(() => {
    // Auto-fill form data from Clerk user or profile
    if (editMode) {
      setFormData({
        first_name: profile?.first_name || user?.firstName || "",
        last_name: profile?.last_name || user?.lastName || "",
        email: profile?.email || user?.primaryEmailAddress?.emailAddress || "",
        phone: profile?.phone || user?.primaryPhoneNumber?.phoneNumber || "",
        organization: profile?.organization || "",
        bio: profile?.bio || "",
      });
    }
  }, [profile, editMode, user]);

  const handleSaveProfile = async () => {
    try {
      await updateProfile(formData);
      setEditMode(false);
      setSuccessMessage("Profile updated successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error("Failed to update profile:", err);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await revokeSession(sessionId);
      setSuccessMessage("Session revoked!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error("Failed to revoke session:", err);
    }
  };

  const handleRevokeAllSessions = async () => {
    if (!confirm("This will log you out from all other devices. Continue?")) return;
    try {
      await revokeAllSessions();
      setSuccessMessage("All sessions revoked!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error("Failed to revoke sessions:", err);
    }
  };

  const breadcrumbs = [
    { label: "Settings", href: "/dashboard/settings" },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto pt-20 pb-12 px-4">
        {}
        <div className="mb-8">
          <Breadcrumbs items={breadcrumbs} />
          <h1 className="text-4xl font-bold mt-4" style={{ color: "var(--text-main)" }}>Settings</h1>
          <p className="mt-2" style={{ color: "var(--text-soft)" }}>Manage your profile, preferences, and security settings</p>
        </div>

        {}
        {successMessage && (
          <div className="mb-6 p-4 border flex items-center gap-3" style={{ borderColor: "rgba(16, 185, 129, 0.3)", background: "rgba(16, 185, 129, 0.1)" }}>
            <FiCheck className="text-emerald-600 dark:text-emerald-400" />
            <span style={{ color: "var(--text-main)" }}>{successMessage}</span>
          </div>
        )}

        {}
        {error && (
          <div className="mb-6 p-4 border flex items-center gap-3" style={{ borderColor: "rgba(239, 68, 68, 0.3)", background: "rgba(239, 68, 68, 0.1)" }}>
            <FiX className="text-red-600 dark:text-red-400" />
            <span style={{ color: "var(--text-main)" }}>{error}</span>
          </div>
        )}

        <div className="flex gap-4 mb-8 border-b" style={{ borderColor: "var(--border)" }}>
          {[
            { id: "profile", label: "Profile", icon: FiUser },
            { id: "security", label: "Security", icon: FiLock },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition ${
                activeTab === id
                  ? "border-[rgb(var(--emerald-main))] text-emerald-600 dark:text-emerald-400"
                  : "border-transparent hover:opacity-70"
              }`}
              style={activeTab !== id ? { color: "var(--text-soft)" } : {}}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </div>

        <div className="glass-card rounded-lg p-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-8 w-8 border-b-2 border-[rgb(var(--emerald-main))]"></div>
            </div>
          ) : activeTab === "profile" ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-soft)" }}>
                    First Name
                  </label>
                  <input
                    type="text"
                    value={editMode ? formData.first_name : (profile?.first_name || user?.firstName || "")}
                    onChange={(e) => editMode && setFormData({ ...formData, first_name: e.target.value })}
                    disabled={!editMode}
                    className="w-full px-4 py-2 border focus:outline-none focus:ring-2 transition disabled:opacity-50"
                    style={{ borderColor: "var(--border)", background: "var(--panel)", color: "var(--text-main)", borderRadius: 0 }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-soft)" }}>
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={editMode ? formData.last_name : (profile?.last_name || user?.lastName || "")}
                    onChange={(e) => editMode && setFormData({ ...formData, last_name: e.target.value })}
                    disabled={!editMode}
                    className="w-full px-4 py-2 border focus:outline-none focus:ring-2 transition disabled:opacity-50"
                    style={{ borderColor: "var(--border)", background: "var(--panel)", color: "var(--text-main)", borderRadius: 0 }}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-soft)" }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={editMode ? formData.email : (profile?.email || user?.primaryEmailAddress?.emailAddress || "")}
                    onChange={(e) => editMode && setFormData({ ...formData, email: e.target.value })}
                    disabled={!editMode}
                    className="w-full px-4 py-2 border focus:outline-none focus:ring-2 transition disabled:opacity-50"
                    style={{ borderColor: "var(--border)", background: "var(--panel)", color: "var(--text-main)", borderRadius: 0 }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-soft)" }}>
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={editMode ? formData.phone : (profile?.phone || user?.primaryPhoneNumber?.phoneNumber || "")}
                    onChange={(e) => editMode && setFormData({ ...formData, phone: e.target.value })}
                    disabled={!editMode}
                    className="w-full px-4 py-2 border focus:outline-none focus:ring-2 transition disabled:opacity-50"
                    style={{ borderColor: "var(--border)", background: "var(--panel)", color: "var(--text-main)", borderRadius: 0 }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-soft)" }}>
                    Organization
                  </label>
                  <input
                    type="text"
                    value={editMode ? formData.organization : profile?.organization}
                    onChange={(e) => editMode && setFormData({ ...formData, organization: e.target.value })}
                    disabled={!editMode}
                    className="w-full px-4 py-2 border focus:outline-none focus:ring-2 transition disabled:opacity-50"
                    style={{ borderColor: "var(--border)", background: "var(--panel)", color: "var(--text-main)", borderRadius: 0 }}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-soft)" }}>
                    Bio
                  </label>
                  <textarea
                    value={editMode ? formData.bio : profile?.bio}
                    onChange={(e) => editMode && setFormData({ ...formData, bio: e.target.value })}
                    disabled={!editMode}
                    rows={3}
                    className="w-full px-4 py-2 border focus:outline-none focus:ring-2 transition disabled:opacity-50"
                    style={{ borderColor: "var(--border)", background: "var(--panel)", color: "var(--text-main)", borderRadius: 0 }}
                  />
                </div>
              </div>
              <div className="flex gap-4">
                {!editMode ? (
                  <button
                    onClick={() => setEditMode(true)}
                    className="px-6 py-2.5 bg-[rgb(var(--emerald-main))] text-white hover:opacity-90 transition flex items-center gap-2"
                  >
                    <FiUser size={18} /> Edit Profile
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleSaveProfile}
                      className="px-6 py-2.5 bg-[rgb(var(--emerald-main))] text-white hover:opacity-90 transition flex items-center gap-2"
                    >
                      <FiSave size={18} /> Save Changes
                    </button>
                    <button
                      onClick={() => {
                        setEditMode(false);
                        setFormData({});
                      }}
                      className="px-6 py-2.5 border hover:opacity-70 transition"
                      style={{ borderColor: "var(--border)", color: "var(--text-main)" }}
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : activeTab === "security" ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--text-main)" }}>Active Sessions</h3>
                <div className="space-y-3">
                  {sessions?.map((session) => (
                    <div key={session.session_id} className="flex items-center justify-between p-4 border rounded-lg" style={{ borderColor: "var(--border)" }}>
                      <div>
                        <p className="font-medium flex items-center gap-2" style={{ color: "var(--text-main)" }}>
                          {session.device}
                          {session.is_current && (
                            <span className="px-2 py-1 text-xs bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 rounded">
                              Current
                            </span>
                          )}
                        </p>
                        <p className="text-sm" style={{ color: "var(--text-soft)" }}>IP: {session.ip_address}</p>
                        <p className="text-xs mt-1" style={{ color: "var(--text-soft)" }}>
                          Last active: {new Date(session.last_activity).toLocaleString()}
                        </p>
                      </div>
                      {!session.is_current && (
                        <button
                          onClick={() => handleRevokeSession(session.session_id)}
                          className="px-3 py-2 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/40 transition"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleRevokeAllSessions}
                  className="mt-4 px-4 py-2 border text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition flex items-center gap-2"
                  style={{ borderColor: "rgba(220, 38, 38, 0.3)" }}
                >
                  <FiLogOut size={18} /> Log Out All Other Devices
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </DashboardLayout>
  );
}
