import React, { useEffect, useState } from "react";

const API = "http://127.0.0.1:8000";

export default function Settings({ onLogout }) {
  const username = localStorage.getItem("username");

  const [profile, setProfile] = useState({
    username: username || "",
    phone_number: "",
    role: "consumer",
    is_active: true,
  });

  const [phone, setPhone] = useState("");

  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] =
    useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // ============================================================
  // LOAD USER PROFILE
  // ============================================================

  useEffect(() => {
    const loadProfile = async () => {
      if (!username) {
        setError("Username not found.");
        setLoading(false);
        return;
      }

      try {
        /*
         * This endpoint assumes your backend exposes:
         *
         * GET /settings/{username}
         *
         * If your endpoint has a different path,
         * change it here.
         */

        const response = await fetch(
          `${API}/settings/${encodeURIComponent(username)}`
        );

        if (!response.ok) {
          throw new Error("Failed to load profile.");
        }

        const data = await response.json();

        setProfile(data);
        setPhone(data.phone_number || "");
      } catch (err) {
        console.error("Profile loading error:", err);

        /*
         * We still keep the username from localStorage
         * so the page remains usable.
         */
        setProfile((prev) => ({
          ...prev,
          username: username,
        }));
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [username]);

  // ============================================================
  // SAVE PROFILE
  // ============================================================

  const handleSaveProfile = async () => {
    setMessage("");
    setError("");

    if (!phone.trim()) {
      setError("Phone number cannot be empty.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        `${API}/settings/${encodeURIComponent(username)}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone_number: phone,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to update profile."
        );
      }

      setProfile((prev) => ({
        ...prev,
        phone_number: phone,
      }));

      setMessage("Profile updated successfully.");
    } catch (err) {
      console.error("Profile update error:", err);
      setError(err.message || "Unable to update profile.");
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // CHANGE PASSWORD
  // ============================================================

  const handleChangePassword = async () => {
    setMessage("");
    setError("");

    if (!currentPassword) {
      setError("Enter your current password.");
      return;
    }

    if (!newPassword) {
      setError("Enter a new password.");
      return;
    }

    if (newPassword.length < 6) {
      setError(
        "New password must contain at least 6 characters."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setChangingPassword(true);

    try {
      const response = await fetch(
        `${API}/settings/${encodeURIComponent(
          username
        )}/change-password`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            current_password: currentPassword,
            new_password: newPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to change password."
        );
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setMessage(
        "Password changed successfully."
      );
    } catch (err) {
      console.error("Password change error:", err);
      setError(
        err.message || "Unable to change password."
      );
    } finally {
      setChangingPassword(false);
    }
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100%",
          padding: "32px",
          background: "#f8fafc",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <div
          style={{
            color: "#6b7280",
            fontSize: "14px",
          }}
        >
          Loading settings...
        </div>
      </div>
    );
  }

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <div
      style={{
        minHeight: "100%",
        padding: "30px",
        background:
          "linear-gradient(135deg, #f8fafc, #eef2ff)",
        fontFamily: "Inter, sans-serif",
        boxSizing: "border-box",
      }}
    >
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div style={{ marginBottom: "26px" }}>
        <div
          style={{
            fontSize: "12px",
            fontWeight: "700",
            color: "#6366f1",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            marginBottom: "6px",
          }}
        >
          Consumer · Account
        </div>

        <h1
          style={{
            margin: 0,
            fontSize: "30px",
            fontWeight: "700",
            color: "#111827",
          }}
        >
          Settings
        </h1>

        <p
          style={{
            marginTop: "7px",
            color: "#6b7280",
            fontSize: "14px",
          }}
        >
          Manage your account and security preferences.
        </p>
      </div>

      {/* ======================================================
          SUCCESS / ERROR
      ====================================================== */}

      {message && (
        <div
          style={{
            marginBottom: "18px",
            padding: "12px 15px",
            borderRadius: "9px",
            background: "#ecfdf5",
            border: "1px solid #a7f3d0",
            color: "#047857",
            fontSize: "13px",
            fontWeight: "600",
          }}
        >
          ✓ {message}
        </div>
      )}

      {error && (
        <div
          style={{
            marginBottom: "18px",
            padding: "12px 15px",
            borderRadius: "9px",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#dc2626",
            fontSize: "13px",
            fontWeight: "600",
          }}
        >
          {error}
        </div>
      )}

      {/* ======================================================
          PROFILE CARD
      ====================================================== */}

      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "14px",
          padding: "24px",
          marginBottom: "20px",
          boxShadow:
            "0 8px 25px rgba(15,23,42,0.05)",
        }}
      >
        <h2
          style={{
            margin: "0 0 5px 0",
            fontSize: "18px",
            color: "#111827",
          }}
        >
          👤 Profile
        </h2>

        <p
          style={{
            margin: "0 0 20px 0",
            fontSize: "13px",
            color: "#6b7280",
          }}
        >
          Your consumer account information.
        </p>

        {/* Username */}

        <div style={{ marginBottom: "17px" }}>
          <label style={labelStyle}>
            Username
          </label>

          <input
            value={profile.username}
            disabled
            style={{
              ...inputStyle,
              background: "#f3f4f6",
              color: "#6b7280",
              cursor: "not-allowed",
            }}
          />
        </div>

        {/* Phone */}

        <div style={{ marginBottom: "17px" }}>
          <label style={labelStyle}>
            Phone Number
          </label>

          <input
            value={phone}
            onChange={(e) =>
              setPhone(e.target.value)
            }
            placeholder="Enter phone number"
            style={inputStyle}
          />
        </div>

        {/* Role */}

        <div style={{ marginBottom: "20px" }}>
          <label style={labelStyle}>
            Account Type
          </label>

          <input
            value="Consumer"
            disabled
            style={{
              ...inputStyle,
              background: "#f3f4f6",
              color: "#6b7280",
              cursor: "not-allowed",
            }}
          />
        </div>

        <button
          onClick={handleSaveProfile}
          disabled={saving}
          style={primaryButtonStyle}
        >
          {saving
            ? "Saving..."
            : "Save Profile"}
        </button>
      </div>

      {/* ======================================================
          ACCOUNT STATUS
      ====================================================== */}

      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "14px",
          padding: "24px",
          marginBottom: "20px",
          boxShadow:
            "0 8px 25px rgba(15,23,42,0.05)",
        }}
      >
        <h2
          style={{
            margin: "0 0 5px 0",
            fontSize: "18px",
            color: "#111827",
          }}
        >
          🛒 Account Status
        </h2>

        <p
          style={{
            margin: "0 0 18px 0",
            fontSize: "13px",
            color: "#6b7280",
          }}
        >
          Current status of your marketplace account.
        </p>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 16px",
            borderRadius: "10px",
            background: "#f8fafc",
            border: "1px solid #e5e7eb",
          }}
        >
          <span
            style={{
              fontSize: "14px",
              color: "#374151",
              fontWeight: "600",
            }}
          >
            Account
          </span>

          <span
            style={{
              padding: "6px 12px",
              borderRadius: "20px",
              background:
                profile.is_active
                  ? "#dcfce7"
                  : "#fee2e2",
              color:
                profile.is_active
                  ? "#15803d"
                  : "#dc2626",
              fontSize: "12px",
              fontWeight: "700",
            }}
          >
            {profile.is_active
              ? "Active"
              : "Inactive"}
          </span>
        </div>
      </div>

      {/* ======================================================
          CHANGE PASSWORD
      ====================================================== */}

      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "14px",
          padding: "24px",
          marginBottom: "20px",
          boxShadow:
            "0 8px 25px rgba(15,23,42,0.05)",
        }}
      >
        <h2
          style={{
            margin: "0 0 5px 0",
            fontSize: "18px",
            color: "#111827",
          }}
        >
          🔐 Change Password
        </h2>

        <p
          style={{
            margin: "0 0 20px 0",
            fontSize: "13px",
            color: "#6b7280",
          }}
        >
          Keep your account secure by using a strong password.
        </p>

        <div style={{ marginBottom: "16px" }}>
          <label style={labelStyle}>
            Current Password
          </label>

          <input
            type="password"
            value={currentPassword}
            onChange={(e) =>
              setCurrentPassword(
                e.target.value
              )
            }
            placeholder="Current password"
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label style={labelStyle}>
            New Password
          </label>

          <input
            type="password"
            value={newPassword}
            onChange={(e) =>
              setNewPassword(
                e.target.value
              )
            }
            placeholder="Minimum 6 characters"
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={labelStyle}>
            Confirm New Password
          </label>

          <input
            type="password"
            value={confirmPassword}
            onChange={(e) =>
              setConfirmPassword(
                e.target.value
              )
            }
            placeholder="Confirm new password"
            style={inputStyle}
          />
        </div>

        <button
          onClick={handleChangePassword}
          disabled={changingPassword}
          style={{
            ...primaryButtonStyle,
            background:
              "linear-gradient(135deg, #6366f1, #4f46e5)",
          }}
        >
          {changingPassword
            ? "Changing..."
            : "Change Password"}
        </button>
      </div>

      {/* ======================================================
          LOGOUT
      ====================================================== */}

      <div
        style={{
          background: "#ffffff",
          border: "1px solid #fecaca",
          borderRadius: "14px",
          padding: "24px",
        }}
      >
        <h2
          style={{
            margin: "0 0 5px 0",
            fontSize: "18px",
            color: "#111827",
          }}
        >
          🚪 Account Actions
        </h2>

        <p
          style={{
            margin: "0 0 18px 0",
            fontSize: "13px",
            color: "#6b7280",
          }}
        >
          Sign out of your Energy Marketplace account.
        </p>

        <button
          onClick={onLogout}
          style={{
            width: "100%",
            padding: "12px",
            border: "none",
            borderRadius: "8px",
            background: "#fee2e2",
            color: "#dc2626",
            cursor: "pointer",
            fontWeight: "700",
            fontSize: "13px",
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}

// ============================================================
// SHARED STYLES
// ============================================================

const labelStyle = {
  display: "block",
  marginBottom: "7px",
  fontSize: "13px",
  fontWeight: "600",
  color: "#374151",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "11px 13px",
  border: "1px solid #d1d5db",
  borderRadius: "8px",
  outline: "none",
  fontSize: "13px",
  color: "#111827",
  background: "#ffffff",
};

const primaryButtonStyle = {
  width: "100%",
  padding: "12px",
  border: "none",
  borderRadius: "8px",
  background:
    "linear-gradient(135deg, #2563eb, #1d4ed8)",
  color: "#ffffff",
  cursor: "pointer",
  fontWeight: "700",
  fontSize: "13px",
};