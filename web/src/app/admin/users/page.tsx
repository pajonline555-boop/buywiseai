"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth, checkIsAdminUser } from "@/lib/AuthContext";

interface AdminUser {
  uid: string;
  displayName: string;
  email: string;
  phone: string;
  role: string;
  isBanned: boolean;
  photoUrl: string;
  createdAt: string;
  lastLoginAt: string;
  platform: string;
  appVersion: string;
}

const AVATAR_COLORS = [
  "#E65100", // Orange
  "#00838F", // Teal
  "#6A1B9A", // Purple
  "#1565C0", // Blue
  "#2E7D32", // Green
  "#C2185B", // Pink
  "#D84315", // Rust
  "#0097A7", // Cyan
];

function getAvatarColor(name: string): string {
  const code = name ? name.charCodeAt(0) : 0;
  return AVATAR_COLORS[Math.abs(code) % AVATAR_COLORS.length];
}

export default function AdminUsersPage() {
  const { user: authUser, isAdmin: isAuthContextAdmin, loading } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Check admin session authorization
  const [isAdminAuthorized, setIsAdminAuthorized] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const queryEmail = params.get("admin_email")?.toLowerCase().trim();
      const localEmail = localStorage.getItem("buywise_admin_email")?.toLowerCase().trim();
      const authEmail = authUser?.email?.toLowerCase().trim();

      const authorized =
        (queryEmail && checkIsAdminUser(queryEmail)) ||
        (localEmail && checkIsAdminUser(localEmail)) ||
        (authEmail && checkIsAdminUser(authEmail)) ||
        isAuthContextAdmin ||
        window.navigator?.userAgent?.includes("BuyWiseNativeApp");

      setIsAdminAuthorized(!!authorized);
    }
  }, [authUser, isAuthContextAdmin]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Real-time Firestore sync
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snapshot) => {
      const list: AdminUser[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        const uid = d.id;
        const name = data.displayName || data.name || data.fullName || "";
        const email = data.email || "";
        const phone = data.phone || data.mobile || data.phoneNumber || "";
        const role = (data.role || "SHOPPER").toUpperCase();
        const isBanned = !!(data.isBanned || data.status === "BANNED");
        const photoUrl = data.photoURL || data.photoUrl || data.avatar || "";

        let createdAt = "Recent";
        if (data.createdAt?.toDate) {
          createdAt = data.createdAt.toDate().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
        } else if (typeof data.createdAt === "number") {
          createdAt = new Date(data.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
        } else if (typeof data.createdAt === "string") {
          createdAt = data.createdAt;
        }

        let lastLoginAt = "Active";
        const loginRaw = data.lastLoginAt || data.lastTokenUpdate;
        if (loginRaw?.toDate) {
          lastLoginAt = loginRaw.toDate().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
        } else if (typeof loginRaw === "number") {
          lastLoginAt = new Date(loginRaw).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
        } else if (typeof loginRaw === "string") {
          lastLoginAt = loginRaw;
        }

        const platform = data.platform || "Android";
        const appVersion = data.appVersion || "1.0.5";

        const displayName = name.trim() || (email ? email.split("@")[0].replace(".", " ") : `User-${uid.slice(0, 5)}`);

        list.push({
          uid,
          displayName,
          email,
          phone,
          role,
          isBanned,
          photoUrl,
          createdAt,
          lastLoginAt,
          platform,
          appVersion,
        });
      });

      // Sort by newest or name
      list.sort((a, b) => a.displayName.localeCompare(b.displayName));
      setUsers(list);
    });

    return () => unsub();
  }, []);

  // Export Users to Excel (CSV with UTF-8 BOM)
  const handleExportExcel = () => {
    if (users.length === 0) {
      showToast("No users to export");
      return;
    }

    const headers = ["User ID", "Display Name", "Email", "Phone", "Role", "Status", "Platform", "App Version", "Registered At", "Last Active"];
    const rows = users.map((u) => [
      `"${u.uid}"`,
      `"${u.displayName.replace(/"/g, '""')}"`,
      `"${u.email.replace(/"/g, '""')}"`,
      `"${u.phone.replace(/"/g, '""')}"`,
      `"${u.role}"`,
      `"${u.isBanned ? "BANNED" : "ACTIVE"}"`,
      `"${u.platform}"`,
      `"${u.appVersion}"`,
      `"${u.createdAt.replace(/"/g, '""')}"`,
      `"${u.lastLoginAt.replace(/"/g, '""')}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `BuyWise_Users_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Exported ${users.length} users to Excel CSV!`);
  };

  // Toggle Ban Status
  const handleToggleBan = async (user: AdminUser) => {
    setIsProcessing(true);
    try {
      const userRef = doc(db, "users", user.uid);
      const newBanned = !user.isBanned;
      await updateDoc(userRef, {
        isBanned: newBanned,
        status: newBanned ? "BANNED" : "ACTIVE",
      });
      showToast(newBanned ? `🚫 User "${user.displayName}" banned` : `✅ User "${user.displayName}" unbanned`);
      if (selectedUser?.uid === user.uid) {
        setSelectedUser({ ...selectedUser, isBanned: newBanned });
      }
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    } finally {
      setIsProcessing(false);
      setActiveMenuId(null);
    }
  };

  // Toggle Partner Role
  const handleToggleRole = async (user: AdminUser) => {
    setIsProcessing(true);
    try {
      const userRef = doc(db, "users", user.uid);
      const newRole = user.role === "PARTNER" ? "SHOPPER" : "PARTNER";
      await updateDoc(userRef, { role: newRole });
      showToast(`Role updated: "${user.displayName}" is now ${newRole}`);
      if (selectedUser?.uid === user.uid) {
        setSelectedUser({ ...selectedUser, role: newRole });
      }
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    } finally {
      setIsProcessing(false);
      setActiveMenuId(null);
    }
  };

  // Delete User Record
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsProcessing(true);
    try {
      await deleteDoc(doc(db, "users", userToDelete.uid));
      showToast(`🗑️ User "${userToDelete.displayName}" permanently deleted`);
      setUserToDelete(null);
    } catch (err: any) {
      showToast(`Error deleting user: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Filter users by search query
  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      u.displayName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.phone.toLowerCase().includes(q) ||
      u.uid.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ minHeight: "100vh", background: "#070512", color: "#ffffff", padding: "24px 16px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        {/* Top Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Link
              href="/admin"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "38px",
                height: "38px",
                borderRadius: "12px",
                background: "rgba(255, 255, 255, 0.08)",
                color: "#ffffff",
                textDecoration: "none",
                fontSize: "18px",
              }}
            >
              ←
            </Link>
            <div>
              <h1 style={{ margin: 0, fontSize: "20px", fontWeight: 900, display: "flex", alignItems: "center", gap: "8px" }}>
                <span>👑</span> Admin Dashboard
              </h1>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#00d4ff", fontWeight: 700 }}>
                BuyWise AI Users Directory & Access Control
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              onClick={handleExportExcel}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "10px",
                background: "rgba(0, 212, 255, 0.15)",
                border: "1px solid rgba(0, 212, 255, 0.4)",
                color: "#00d4ff",
                fontWeight: 800,
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              📥 Download Excel
            </button>
            <span
              style={{
                padding: "4px 8px",
                borderRadius: "8px",
                background: "rgba(0, 230, 118, 0.15)",
                border: "1px solid rgba(0, 230, 118, 0.5)",
                color: "#00e676",
                fontSize: "10px",
                fontWeight: 900,
              }}
            >
              ● LIVE
            </span>
          </div>
        </div>

        {/* Navigation Tabs (Dreamz Properties Pattern) */}
        <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "10px", marginBottom: "20px" }}>
          <Link
            href="/admin"
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              background: "transparent",
              color: "rgba(255,255,255,0.6)",
              fontSize: "13px",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            📊 Overview
          </Link>
          <div
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              background: "rgba(0, 212, 255, 0.15)",
              color: "#00d4ff",
              fontSize: "13px",
              fontWeight: 800,
              borderBottom: "2px solid #00d4ff",
            }}
          >
            👥 Users ({users.length})
          </div>
          <Link
            href="/admin/inventory"
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              background: "transparent",
              color: "rgba(255,255,255,0.6)",
              fontSize: "13px",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            📦 Inventory
          </Link>
          <Link
            href="/admin/competitions"
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              background: "transparent",
              color: "rgba(255,255,255,0.6)",
              fontSize: "13px",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            🏆 Competitions
          </Link>
        </div>

        {/* Toast Alert */}
        {toastMessage && (
          <div
            style={{
              position: "fixed",
              bottom: "24px",
              right: "24px",
              background: "#1976D2",
              color: "white",
              padding: "12px 20px",
              borderRadius: "12px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
              fontWeight: 700,
              fontSize: "13px",
              zIndex: 9999,
            }}
          >
            {toastMessage}
          </div>
        )}

        {/* Total Users Metric Card (Exact Dreamz Properties Pattern) */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "20px",
            padding: "20px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "16px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "#E3F2FD",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "26px",
              }}
            >
              👥
            </div>
            <div>
              <div style={{ color: "#78909C", fontSize: "14px", fontWeight: 600 }}>Total Users</div>
              <div style={{ color: "#102027", fontSize: "32px", fontWeight: 900, lineHeight: 1.1 }}>{users.length}</div>
            </div>
          </div>

          <button
            onClick={handleExportExcel}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 18px",
              borderRadius: "12px",
              background: "#1976D2",
              border: "none",
              color: "white",
              fontWeight: 800,
              fontSize: "13px",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(25, 118, 210, 0.35)",
            }}
          >
            📊 Export Excel
          </button>
        </div>

        {/* Search Bar */}
        <div style={{ marginBottom: "18px" }}>
          <div style={{ position: "relative" }}>
            <span
              style={{
                position: "absolute",
                left: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: "16px",
                color: "#00d4ff",
              }}
            >
              🔍
            </span>
            <input
              type="text"
              placeholder="Search users by name, email, phone, role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "13px 40px 13px 42px",
                borderRadius: "14px",
                background: "#141026",
                border: "1px solid rgba(0, 212, 255, 0.3)",
                color: "#ffffff",
                fontSize: "14px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  color: "#aaa",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* User List */}
        {filteredUsers.length === 0 ? (
          <div
            style={{
              background: "#141026",
              borderRadius: "16px",
              padding: "36px 20px",
              textAlign: "center",
              color: "rgba(255,255,255,0.6)",
            }}
          >
            <div style={{ fontSize: "36px", marginBottom: "8px" }}>🔍</div>
            <div>{searchQuery ? `No users matching "${searchQuery}"` : "No registered users found in Firestore"}</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {filteredUsers.map((user) => {
              const avatarBg = getAvatarColor(user.displayName);
              const initial = (user.displayName?.[0] || user.email?.[0] || "U").toUpperCase();
              const isMenuOpen = activeMenuId === user.uid;

              return (
                <div
                  key={user.uid}
                  style={{
                    background: "#ffffff",
                    borderRadius: "18px",
                    padding: "14px 18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
                    position: "relative",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "14px", flex: 1, minWidth: 0 }}>
                    {user.photoUrl ? (
                      <img
                        src={user.photoUrl}
                        alt={user.displayName}
                        style={{ width: "46px", height: "46px", borderRadius: "50%", objectFit: "cover" }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "46px",
                          height: "46px",
                          borderRadius: "50%",
                          background: avatarBg,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          fontWeight: 900,
                          fontSize: "19px",
                          flexShrink: 0,
                        }}
                      >
                        {initial}
                      </div>
                    )}

                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ color: "#102027", fontWeight: 800, fontSize: "15px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {user.displayName}
                        </span>
                        {user.isBanned && (
                          <span
                            style={{
                              background: "#FFEBEE",
                              color: "#D32F2F",
                              fontSize: "10px",
                              fontWeight: 900,
                              padding: "2px 6px",
                              borderRadius: "6px",
                              border: "1px solid #FFCDD2",
                            }}
                          >
                            BANNED
                          </span>
                        )}
                      </div>

                      <div style={{ color: "#78909C", fontSize: "12px", marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {user.email || "No email"}
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                        <span
                          style={{
                            background: user.role === "PARTNER" ? "#EDE7F6" : user.role === "ADMIN" ? "#FFF8E1" : "#E0F7FA",
                            color: user.role === "PARTNER" ? "#5E35B1" : user.role === "ADMIN" ? "#F57F17" : "#00838F",
                            fontSize: "10px",
                            fontWeight: 800,
                            padding: "2px 6px",
                            borderRadius: "6px",
                          }}
                        >
                          {user.role}
                        </span>
                        {user.phone && <span style={{ color: "#90A4AE", fontSize: "11px" }}>📞 {user.phone}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Three Dots Menu Button (Dreamz Properties Pattern) */}
                  <div style={{ position: "relative" }}>
                    <button
                      onClick={() => setActiveMenuId(isMenuOpen ? null : user.uid)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#78909C",
                        fontSize: "20px",
                        cursor: "pointer",
                        padding: "6px 10px",
                        borderRadius: "8px",
                      }}
                    >
                      ⋮
                    </button>

                    {isMenuOpen && (
                      <div
                        style={{
                          position: "absolute",
                          right: "0",
                          top: "34px",
                          background: "#ffffff",
                          borderRadius: "14px",
                          boxShadow: "0 8px 30px rgba(0,0,0,0.25)",
                          zIndex: 100,
                          minWidth: "165px",
                          padding: "6px 0",
                          border: "1px solid #ECEFF1",
                        }}
                      >
                        <button
                          onClick={() => {
                            setActiveMenuId(null);
                            setSelectedUser(user);
                          }}
                          style={{
                            width: "100%",
                            padding: "10px 14px",
                            background: "transparent",
                            border: "none",
                            textAlign: "left",
                            cursor: "pointer",
                            fontSize: "13px",
                            fontWeight: 700,
                            color: "#37474F",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <span>👁️</span> View Details
                        </button>

                        <button
                          onClick={() => handleToggleRole(user)}
                          style={{
                            width: "100%",
                            padding: "10px 14px",
                            background: "transparent",
                            border: "none",
                            textAlign: "left",
                            cursor: "pointer",
                            fontSize: "13px",
                            fontWeight: 700,
                            color: "#1976D2",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <span>👥</span> {user.role === "PARTNER" ? "Revoke Partner" : "Make Partner"}
                        </button>

                        <button
                          onClick={() => handleToggleBan(user)}
                          style={{
                            width: "100%",
                            padding: "10px 14px",
                            background: "transparent",
                            border: "none",
                            textAlign: "left",
                            cursor: "pointer",
                            fontSize: "13px",
                            fontWeight: 700,
                            color: "#EF6C00",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <span>🚫</span> {user.isBanned ? "Unban User" : "Ban User"}
                        </button>

                        <button
                          onClick={() => {
                            setActiveMenuId(null);
                            setUserToDelete(user);
                          }}
                          style={{
                            width: "100%",
                            padding: "10px 14px",
                            background: "transparent",
                            border: "none",
                            textAlign: "left",
                            cursor: "pointer",
                            fontSize: "13px",
                            fontWeight: 700,
                            color: "#D32F2F",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <span>🗑️</span> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* View Details Modal */}
        {selectedUser && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.75)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: "20px",
            }}
          >
            <div
              style={{
                background: "#141026",
                borderRadius: "20px",
                border: "1px solid rgba(0, 212, 255, 0.4)",
                padding: "24px",
                maxWidth: "480px",
                width: "100%",
                boxShadow: "0 20px 50px rgba(0,0,0,0.8)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "50%",
                      background: getAvatarColor(selectedUser.displayName),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontWeight: 900,
                      fontSize: "18px",
                    }}
                  >
                    {(selectedUser.displayName?.[0] || "U").toUpperCase()}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800 }}>{selectedUser.displayName}</h3>
                    <span style={{ fontSize: "11px", color: selectedUser.isBanned ? "#FF5252" : "#00E676", fontWeight: 800 }}>
                      {selectedUser.isBanned ? "🚫 BANNED ACCOUNT" : "🟢 ACTIVE ACCOUNT"}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  style={{ background: "transparent", border: "none", color: "#aaa", fontSize: "18px", cursor: "pointer" }}
                >
                  ✕
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "6px" }}>
                  <span style={{ color: "#aaa" }}>User ID</span>
                  <span style={{ fontFamily: "monospace", color: "#00d4ff", fontSize: "12px" }}>{selectedUser.uid}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "6px" }}>
                  <span style={{ color: "#aaa" }}>Email</span>
                  <span>{selectedUser.email || "Not provided"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "6px" }}>
                  <span style={{ color: "#aaa" }}>Phone</span>
                  <span>{selectedUser.phone || "Not provided"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "6px" }}>
                  <span style={{ color: "#aaa" }}>Role</span>
                  <span style={{ fontWeight: 800, color: "#ffd700" }}>{selectedUser.role}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "6px" }}>
                  <span style={{ color: "#aaa" }}>Platform</span>
                  <span>{selectedUser.platform}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "6px" }}>
                  <span style={{ color: "#aaa" }}>App Version</span>
                  <span>{selectedUser.appVersion}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "6px" }}>
                  <span style={{ color: "#aaa" }}>Registered</span>
                  <span>{selectedUser.createdAt}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "6px" }}>
                  <span style={{ color: "#aaa" }}>Last Active</span>
                  <span>{selectedUser.lastLoginAt}</span>
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                <button
                  onClick={() => handleToggleBan(selectedUser)}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: "10px",
                    background: selectedUser.isBanned ? "rgba(0, 230, 118, 0.2)" : "rgba(255, 152, 0, 0.2)",
                    border: `1px solid ${selectedUser.isBanned ? "#00E676" : "#FF9800"}`,
                    color: selectedUser.isBanned ? "#00E676" : "#FF9800",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  {selectedUser.isBanned ? "Unban User" : "Ban User"}
                </button>
                <button
                  onClick={() => setSelectedUser(null)}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: "10px",
                    background: "#00d4ff",
                    border: "none",
                    color: "#000",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {userToDelete && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.75)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: "20px",
            }}
          >
            <div
              style={{
                background: "#18122B",
                borderRadius: "20px",
                border: "1px solid rgba(255, 77, 77, 0.5)",
                padding: "24px",
                maxWidth: "440px",
                width: "100%",
                boxShadow: "0 20px 50px rgba(0,0,0,0.8)",
              }}
            >
              <h3 style={{ margin: "0 0 10px", fontSize: "17px", fontWeight: 800, color: "#ffffff" }}>
                Delete User Account?
              </h3>
              <p style={{ margin: "0 0 20px", fontSize: "13px", color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>
                Are you sure you want to permanently delete <strong>"{userToDelete.displayName}"</strong> ({userToDelete.email || userToDelete.uid}) from Cloud Firestore? This action will remove all their saved data and cannot be undone.
              </p>
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  onClick={() => setUserToDelete(null)}
                  style={{
                    padding: "10px 18px",
                    borderRadius: "10px",
                    background: "transparent",
                    border: "1px solid #666",
                    color: "#fff",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteUser}
                  disabled={isProcessing}
                  style={{
                    padding: "10px 18px",
                    borderRadius: "10px",
                    background: "#D32F2F",
                    border: "none",
                    color: "#fff",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  {isProcessing ? "Deleting..." : "Delete Permanently"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

