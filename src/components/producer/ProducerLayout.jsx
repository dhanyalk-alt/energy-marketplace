import React, { useState } from "react";

import AIAssistant from "./AIAssistant";
import Forecasting from "./weather/Forecasting";
import Trading from "./Trading";
import Overview from "./Overview";
import RecentSales from "./RecentSales";
import EnergyFlowMap from "./EnergyFlowMap";
import Market from "./Market";
import Settings from "./Settings";

export default function ProducerLayout({
  onSwitchToConsumer,
  onLogout,
}) {
  const [activeTab, setActiveTab] = useState("overview");
  const [menuOpen, setMenuOpen] = useState(false);

  const username = localStorage.getItem("username");

  // ============================================================
  // PAGE CONTENT
  // ============================================================

  const renderContent = () => {
    switch (activeTab) {
      case "forecasting":
        return <Forecasting />;

      case "trading":
        return <Trading />;

      case "overview":
        return <Overview />;

      case "sales":
        return <RecentSales />;

      case "flow":
        return <EnergyFlowMap />;

      case "market":
        return <Market />;

      case "settings":
        return <Settings />;

      default:
        return <Overview />;
    }
  };

  // ============================================================
  // NAVIGATION ITEMS
  // ============================================================

  const navigation = [
    {
      id: "overview",
      label: "Overview",
      icon: "⌂",
    },
    {
      id: "forecasting",
      label: "Forecasting",
      icon: "☁",
    },
    {
      id: "trading",
      label: "Trading",
      icon: "⚡",
    },
    {
      id: "sales",
      label: "Sales",
      icon: "▣",
    },
    {
      id: "flow",
      label: "Energy Flow",
      icon: "⇄",
    },
    {
      id: "market",
      label: "Market",
      icon: "◇",
    },
    {
      id: "settings",
      label: "Settings",
      icon: "⚙",
    },
  ];

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",

        display: "flex",
        flexDirection: "column",

        fontFamily:
          "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",

        backgroundColor: "#f8fafc",

        overflow: "hidden",

        boxSizing: "border-box",
      }}
    >
      {/* ========================================================
          TOP HEADER
      ======================================================== */}

      <header
        style={{
          height: "74px",
          minHeight: "74px",

          width: "100%",

          borderBottom: "1px solid #e5e7eb",

          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",

          padding: "0 32px",

          backgroundColor: "#ffffff",

          position: "relative",

          zIndex: 100,

          boxSizing: "border-box",
        }}
      >
        {/* ======================================================
            LEFT HEADER
        ====================================================== */}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
          }}
        >
          {/* LOGO */}

          <div
            style={{
              width: "46px",
              height: "46px",

              borderRadius: "13px",

              background:
                "linear-gradient(135deg, #2563eb, #06b6d4)",

              display: "flex",
              alignItems: "center",
              justifyContent: "center",

              color: "#ffffff",

              fontSize: "23px",
              fontWeight: "700",

              boxShadow:
                "0 6px 16px rgba(37,99,235,0.22)",
            }}
          >
            ⚡
          </div>

          {/* TITLE */}

          <div>
            <div
              style={{
                fontSize: "19px",
                fontWeight: "700",
                color: "#111827",
                lineHeight: "1.2",
              }}
            >
              Energy Marketplace
            </div>

            <div
              style={{
                fontSize: "12px",
                color: "#6b7280",
                marginTop: "3px",
              }}
            >
              Producer Dashboard
            </div>
          </div>
        </div>

        {/* ======================================================
            RIGHT HEADER
        ====================================================== */}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "13px",
          }}
        >
          {/* USERNAME */}

          <div
            style={{
              textAlign: "right",
            }}
          >
            <div
              style={{
                fontSize: "14px",
                fontWeight: "600",
                color: "#111827",
              }}
            >
              {username || "User"}
            </div>

            <div
              style={{
                fontSize: "11px",
                color: "#6b7280",
                marginTop: "2px",
              }}
            >
              Producer
            </div>
          </div>

          {/* AVATAR */}

          <div
            style={{
              width: "44px",
              height: "44px",

              borderRadius: "50%",

              backgroundColor: "#eff6ff",

              border: "1px solid #bfdbfe",

              display: "flex",
              alignItems: "center",
              justifyContent: "center",

              color: "#2563eb",

              fontWeight: "700",
              fontSize: "17px",
            }}
          >
            {username
              ? username.charAt(0).toUpperCase()
              : "U"}
          </div>

          {/* MENU BUTTON */}

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              width: "44px",
              height: "44px",

              borderRadius: "11px",

              border: "1px solid #e5e7eb",

              backgroundColor: "#ffffff",

              cursor: "pointer",

              fontSize: "20px",

              display: "flex",
              alignItems: "center",
              justifyContent: "center",

              color: "#374151",
            }}
          >
            ☰
          </button>

          {/* ====================================================
              DROPDOWN
          ==================================================== */}

          {menuOpen && (
            <div
              style={{
                position: "absolute",

                right: "32px",
                top: "64px",

                width: "240px",

                backgroundColor: "#ffffff",

                border: "1px solid #e5e7eb",

                borderRadius: "14px",

                padding: "10px",

                boxShadow:
                  "0 18px 40px rgba(0,0,0,0.15)",

                zIndex: 500,
              }}
            >
              <button
                onClick={() => {
                  onSwitchToConsumer();
                  setMenuOpen(false);
                }}
                style={{
                  width: "100%",

                  padding: "13px",

                  border: "none",

                  borderRadius: "9px",

                  backgroundColor: "#eff6ff",

                  color: "#2563eb",

                  cursor: "pointer",

                  textAlign: "left",

                  fontSize: "13px",

                  fontWeight: "600",

                  marginBottom: "7px",
                }}
              >
                🔄 Switch to Consumer
              </button>

              <button
                onClick={onLogout}
                style={{
                  width: "100%",

                  padding: "13px",

                  border: "none",

                  borderRadius: "9px",

                  backgroundColor: "#fef2f2",

                  color: "#dc2626",

                  cursor: "pointer",

                  textAlign: "left",

                  fontSize: "13px",

                  fontWeight: "600",
                }}
              >
                ↪ Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ========================================================
          MAIN AREA
      ======================================================== */}

      <div
        style={{
          flex: 1,

          minHeight: 0,

          width: "100%",

          display: "grid",

          /*
           * MAIN CONTENT + LARGE AI PANEL
           */
          gridTemplateColumns:
            "minmax(0, 1fr) 420px",

          gap: "22px",

          padding: "22px 26px 105px 26px",

          boxSizing: "border-box",

          overflow: "hidden",
        }}
      >
        {/* ======================================================
            MAIN CONTENT
        ====================================================== */}

        <main
          style={{
            minWidth: 0,
            minHeight: 0,

            padding: "4px",

            overflowY: "auto",
            overflowX: "hidden",

            backgroundColor: "#f8fafc",

            boxSizing: "border-box",
          }}
        >
          {renderContent()}
        </main>

        {/* ======================================================
            LARGE AI ASSISTANT PANEL
        ====================================================== */}

        <aside
          style={{
            width: "100%",

            minWidth: 0,
            minHeight: 0,

            height: "100%",

            backgroundColor: "#ffffff",

            border: "1px solid #e5e7eb",

            borderRadius: "22px",

            padding: "28px",

            display: "flex",

            justifyContent: "center",

            alignItems: "flex-start",

            overflowY: "auto",
            overflowX: "hidden",

            boxSizing: "border-box",

            boxShadow:
              "0 8px 30px rgba(15,23,42,0.08)",
          }}
        >
          {/* AI CONTENT WIDTH */}

          <div
            style={{
              width: "100%",
              maxWidth: "380px",

              minWidth: 0,
            }}
          >
            <AIAssistant username={username} />
          </div>
        </aside>
      </div>

      {/* ========================================================
          FLOATING NAVIGATION
      ======================================================== */}

      <nav
        style={{
          position: "fixed",

          left: "50%",

          bottom: "20px",

          transform: "translateX(-50%)",

          display: "flex",

          alignItems: "center",

          justifyContent: "center",

          gap: "6px",

          padding: "9px",

          backgroundColor:
            "rgba(255,255,255,0.97)",

          backdropFilter: "blur(16px)",

          WebkitBackdropFilter:
            "blur(16px)",

          border: "1px solid #e5e7eb",

          borderRadius: "20px",

          boxShadow:
            "0 15px 40px rgba(15,23,42,0.18)",

          zIndex: 1000,

          maxWidth:
            "calc(100vw - 40px)",

          boxSizing: "border-box",
        }}
      >
        {navigation.map((item) => {
          const active =
            activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() =>
                setActiveTab(item.id)
              }
              style={{
                minWidth: "96px",

                height: "64px",

                padding: "6px 14px",

                border: "none",

                borderRadius: "15px",

                backgroundColor: active
                  ? "#eff6ff"
                  : "transparent",

                color: active
                  ? "#2563eb"
                  : "#6b7280",

                cursor: "pointer",

                display: "flex",

                flexDirection:
                  "column",

                alignItems: "center",

                justifyContent:
                  "center",

                gap: "6px",

                fontWeight: active
                  ? "700"
                  : "500",

                transition:
                  "background-color 0.2s ease, color 0.2s ease",

                whiteSpace: "nowrap",
              }}
            >
              {/* ICON */}

              <span
                style={{
                  fontSize: "21px",
                  lineHeight: "1",
                }}
              >
                {item.icon}
              </span>

              {/* LABEL */}

              <span
                style={{
                  fontSize: "11px",
                  lineHeight: "1",
                }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}