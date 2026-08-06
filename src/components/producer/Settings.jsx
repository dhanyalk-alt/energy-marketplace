import React, { useEffect, useState } from "react";

export default function Settings() {
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("producer");
  const [phone, setPhone] = useState("");

  const [notifications, setNotifications] = useState(true);
  const [marketAlerts, setMarketAlerts] = useState(true);
  const [buyRequestAlerts, setBuyRequestAlerts] = useState(true);

  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState("30");

  const [message, setMessage] = useState("");

  // -----------------------------------------
  // Load logged-in user information
  // -----------------------------------------
  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    const storedRole = localStorage.getItem("role");
    const storedPhone = localStorage.getItem("phone_number");

    if (storedUsername) {
      setUsername(storedUsername);
    }

    if (storedRole) {
      setRole(storedRole);
    }

    if (storedPhone) {
      setPhone(storedPhone);
    }

    // Load saved settings
    const savedSettings = localStorage.getItem(
      "producerSettings"
    );

    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);

        setNotifications(
          settings.notifications ?? true
        );

        setMarketAlerts(
          settings.marketAlerts ?? true
        );

        setBuyRequestAlerts(
          settings.buyRequestAlerts ?? true
        );

        setAutoRefresh(
          settings.autoRefresh ?? true
        );

        setRefreshInterval(
          settings.refreshInterval ?? "30"
        );
      } catch (error) {
        console.error(
          "Unable to load saved settings:",
          error
        );
      }
    }
  }, []);

  // -----------------------------------------
  // Save settings
  // -----------------------------------------
  const handleSave = () => {
    const settings = {
      notifications,
      marketAlerts,
      buyRequestAlerts,
      autoRefresh,
      refreshInterval
    };

    localStorage.setItem(
      "producerSettings",
      JSON.stringify(settings)
    );

    setMessage("Settings saved successfully.");

    setTimeout(() => {
      setMessage("");
    }, 3000);
  };

  // -----------------------------------------
  // Reset settings
  // -----------------------------------------
  const handleReset = () => {
    setNotifications(true);
    setMarketAlerts(true);
    setBuyRequestAlerts(true);
    setAutoRefresh(true);
    setRefreshInterval("30");

    localStorage.removeItem(
      "producerSettings"
    );

    setMessage("Settings reset to default.");

    setTimeout(() => {
      setMessage("");
    }, 3000);
  };

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "1000px",
        margin: "0 auto",
        paddingBottom: "40px"
      }}
    >
      {/* -------------------------------- */}
      {/* HEADER */}
      {/* -------------------------------- */}

      <div
        style={{
          marginBottom: "24px"
        }}
      >
        <h2
          style={{
            margin: 0,
            color: "#1f2937",
            fontSize: "26px"
          }}
        >
          Settings
        </h2>

        <p
          style={{
            marginTop: "6px",
            color: "#6b7280",
            fontSize: "14px"
          }}
        >
          Manage your producer account and marketplace
          preferences.
        </p>
      </div>

      {/* -------------------------------- */}
      {/* ACCOUNT */}
      {/* -------------------------------- */}

      <section style={cardStyle}>
        <h3 style={sectionTitle}>
          👤 Account Information
        </h3>

        <div style={gridStyle}>
          <div>
            <label style={labelStyle}>
              Username
            </label>

            <input
              type="text"
              value={username}
              readOnly
              style={readOnlyInput}
            />
          </div>

          <div>
            <label style={labelStyle}>
              Role
            </label>

            <input
              type="text"
              value={role}
              readOnly
              style={readOnlyInput}
            />
          </div>

          <div>
            <label style={labelStyle}>
              Phone Number
            </label>

            <input
              type="text"
              value={phone}
              onChange={(e) =>
                setPhone(e.target.value)
              }
              placeholder="Phone number"
              style={inputStyle}
            />
          </div>
        </div>
      </section>

      {/* -------------------------------- */}
      {/* NOTIFICATIONS */}
      {/* -------------------------------- */}

      <section style={cardStyle}>
        <h3 style={sectionTitle}>
          🔔 Notifications
        </h3>

        <SettingRow
          title="Enable notifications"
          description="Receive marketplace notifications."
          checked={notifications}
          onChange={setNotifications}
        />

        <SettingRow
          title="Market price alerts"
          description="Get notified when market prices change significantly."
          checked={marketAlerts}
          onChange={setMarketAlerts}
        />

        <SettingRow
          title="Buy request alerts"
          description="Receive notifications when consumers send buy requests."
          checked={buyRequestAlerts}
          onChange={setBuyRequestAlerts}
        />
      </section>

      {/* -------------------------------- */}
      {/* MARKETPLACE */}
      {/* -------------------------------- */}

      <section style={cardStyle}>
        <h3 style={sectionTitle}>
          ⚡ Marketplace Preferences
        </h3>

        <SettingRow
          title="Automatic market refresh"
          description="Automatically refresh producer and IEX market information."
          checked={autoRefresh}
          onChange={setAutoRefresh}
        />

        <div
          style={{
            marginTop: "18px",
            maxWidth: "300px"
          }}
        >
          <label style={labelStyle}>
            Market refresh interval
          </label>

          <select
            value={refreshInterval}
            onChange={(e) =>
              setRefreshInterval(e.target.value)
            }
            disabled={!autoRefresh}
            style={{
              ...inputStyle,
              cursor: autoRefresh
                ? "pointer"
                : "not-allowed",
              opacity: autoRefresh ? 1 : 0.5
            }}
          >
            <option value="15">
              Every 15 seconds
            </option>

            <option value="30">
              Every 30 seconds
            </option>

            <option value="60">
              Every 1 minute
            </option>

            <option value="300">
              Every 5 minutes
            </option>
          </select>
        </div>
      </section>

      {/* -------------------------------- */}
      {/* SECURITY */}
      {/* -------------------------------- */}

      <section style={cardStyle}>
        <h3 style={sectionTitle}>
          🔐 Security
        </h3>

        <div
          style={{
            backgroundColor: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            padding: "16px"
          }}
        >
          <strong
            style={{
              color: "#374151"
            }}
          >
            Password & Authentication
          </strong>

          <p
            style={{
              margin: "6px 0 0",
              color: "#6b7280",
              fontSize: "13px"
            }}
          >
            Your account is protected using the
            marketplace authentication system.
          </p>
        </div>
      </section>

      {/* -------------------------------- */}
      {/* SAVE / RESET */}
      {/* -------------------------------- */}

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "10px",
          alignItems: "center",
          marginTop: "20px"
        }}
      >
        {message && (
          <span
            style={{
              color: "#16a34a",
              fontSize: "13px",
              marginRight: "auto"
            }}
          >
            ✓ {message}
          </span>
        )}

        <button
          onClick={handleReset}
          style={resetButton}
        >
          Reset
        </button>

        <button
          onClick={handleSave}
          style={saveButton}
        >
          Save Settings
        </button>
      </div>
    </div>
  );
}


// =====================================================
// SETTING ROW COMPONENT
// =====================================================

function SettingRow({
  title,
  description,
  checked,
  onChange
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "14px 0",
        borderBottom: "1px solid #f3f4f6"
      }}
    >
      <div>
        <div
          style={{
            fontWeight: "500",
            color: "#374151",
            fontSize: "14px"
          }}
        >
          {title}
        </div>

        <div
          style={{
            color: "#6b7280",
            fontSize: "12px",
            marginTop: "4px"
          }}
        >
          {description}
        </div>
      </div>

      <label
        style={{
          position: "relative",
          display: "inline-block",
          width: "44px",
          height: "24px",
          cursor: "pointer"
        }}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) =>
            onChange(e.target.checked)
          }
          style={{
            opacity: 0,
            width: 0,
            height: 0
          }}
        />

        <span
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "20px",
            backgroundColor: checked
              ? "#2563eb"
              : "#d1d5db",
            transition: "0.2s"
          }}
        />

        <span
          style={{
            position: "absolute",
            top: "3px",
            left: checked
              ? "23px"
              : "3px",
            width: "18px",
            height: "18px",
            borderRadius: "50%",
            backgroundColor: "white",
            transition: "0.2s",
            boxShadow:
              "0 1px 3px rgba(0,0,0,0.2)"
          }}
        />
      </label>
    </div>
  );
}


// =====================================================
// STYLES
// =====================================================

const cardStyle = {
  backgroundColor: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "10px",
  padding: "20px",
  marginBottom: "18px",
  boxShadow:
    "0 1px 2px rgba(0,0,0,0.04)"
};

const sectionTitle = {
  margin: "0 0 18px",
  color: "#1f2937",
  fontSize: "17px"
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "16px"
};

const labelStyle = {
  display: "block",
  marginBottom: "6px",
  color: "#4b5563",
  fontSize: "13px",
  fontWeight: "500"
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 12px",
  border: "1px solid #d1d5db",
  borderRadius: "7px",
  fontSize: "14px",
  outline: "none",
  backgroundColor: "#ffffff",
  color: "#374151"
};

const readOnlyInput = {
  ...inputStyle,
  backgroundColor: "#f3f4f6",
  color: "#6b7280"
};

const saveButton = {
  padding: "10px 18px",
  border: "none",
  borderRadius: "7px",
  backgroundColor: "#2563eb",
  color: "#ffffff",
  fontSize: "13px",
  fontWeight: "600",
  cursor: "pointer"
};

const resetButton = {
  padding: "10px 18px",
  border: "1px solid #d1d5db",
  borderRadius: "7px",
  backgroundColor: "#ffffff",
  color: "#374151",
  fontSize: "13px",
  fontWeight: "500",
  cursor: "pointer"
};