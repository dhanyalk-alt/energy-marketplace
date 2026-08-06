import React, { useState } from "react";

import AIAssistant from "./AIAssistant";
import ProducerMarketplace from "./ProducerMarketplace";
import RequestBuying from "./RequestBuying";
import Overview from "./Overview";
import EnergyFlowMap from "./EnergyFlowMap";
import ReviewProducers from "./ReviewProducers";
import Settings from "./Settings";

export default function ConsumerLayout({ onLogout }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedProducer, setSelectedProducer] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // ============================================================
  // USER
  // ============================================================

  const username = localStorage.getItem("username");

  // ============================================================
  // PAGE CONTENT
  // ============================================================

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return <Overview />;

      case "marketplace":
        return (
          <ProducerMarketplace
            onRedirectToRequests={(producer) => {
              setSelectedProducer(producer);
              setActiveTab("requests");
            }}
          />
        );

      case "requests":
        return <RequestBuying producer={selectedProducer} />;

      case "flow":
        return <EnergyFlowMap />;

      case "reviews":
        return <ReviewProducers />;

      case "settings":
        return <Settings />;

      default:
        return <Overview />;
    }
  };

  // ============================================================
  // NAVIGATION
  // ============================================================

  const navigation = [
    {
      id: "overview",
      label: "Overview",
      icon: "⌂",
    },
    {
      id: "marketplace",
      label: "Marketplace",
      icon: "⚡",
    },
    {
      id: "requests",
      label: "Requests",
      icon: "▣",
    },
    {
      id: "flow",
      label: "Energy Flow",
      icon: "⇄",
    },
    {
      id: "reviews",
      label: "Reviews",
      icon: "★",
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
        backgroundColor: "#f8fafc",
        fontFamily:
          "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        color: "#111827",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      {/* ========================================================
          HEADER
      ======================================================== */}

      <header
        style={{
          width: "100%",
          height: "76px",
          minHeight: "76px",

          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",

          padding: "0 32px",

          backgroundColor: "#ffffff",
          borderBottom: "1px solid #e5e7eb",

          position: "relative",
          zIndex: 1000,

          boxSizing: "border-box",
        }}
      >
        {/* ------------------------------------------------------
            LEFT HEADER
        ------------------------------------------------------ */}

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
                "0 6px 18px rgba(37,99,235,0.22)",
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
              Consumer Dashboard
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------
            RIGHT HEADER
        ------------------------------------------------------ */}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
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
                fontSize: "15px",
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
              Consumer
            </div>
          </div>

          {/* AVATAR */}

          <div
            style={{
              width: "44px",
              height: "44px",

              borderRadius: "50%",

              background:
                "linear-gradient(135deg, #dbeafe, #e0f2fe)",

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

          {/* MENU */}

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              width: "44px",
              height: "44px",

              borderRadius: "12px",

              border: "1px solid #e5e7eb",

              backgroundColor: "#ffffff",

              cursor: "pointer",

              fontSize: "21px",

              display: "flex",
              alignItems: "center",
              justifyContent: "center",

              color: "#374151",
            }}
          >
            ☰
          </button>

          {/* DROPDOWN */}

          {menuOpen && (
            <div
              style={{
                position: "absolute",

                right: "32px",
                top: "66px",

                width: "230px",

                backgroundColor: "#ffffff",

                border: "1px solid #e5e7eb",

                borderRadius: "14px",

                padding: "10px",

                boxShadow:
                  "0 18px 40px rgba(15,23,42,0.16)",

                zIndex: 2000,
              }}
            >
              <div
                style={{
                  padding: "10px 12px 12px",
                  borderBottom: "1px solid #f1f5f9",
                  marginBottom: "8px",
                }}
              >
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: "700",
                    color: "#111827",
                  }}
                >
                  {username || "User"}
                </div>

                <div
                  style={{
                    fontSize: "11px",
                    color: "#6b7280",
                    marginTop: "3px",
                  }}
                >
                  Consumer account
                </div>
              </div>

              <button
                onClick={() => {
                  setMenuOpen(false);

                  if (onLogout) {
                    onLogout();
                  }
                }}
                style={{
                  width: "100%",

                  padding: "12px",

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
          MAIN DESKTOP AREA
      ======================================================== */}

      <div
        style={{
          flex: 1,

          minHeight: 0,

          width: "100%",

          display: "grid",

          gridTemplateColumns:
            "minmax(0, 1fr) 420px",

          gap: "24px",

          padding: "24px 28px 120px",

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

            backgroundColor: "#ffffff",

            border: "1px solid #e5e7eb",

            borderRadius: "20px",

            padding: "30px",

            overflowY: "auto",
            overflowX: "hidden",

            boxShadow:
              "0 5px 22px rgba(15,23,42,0.06)",

            boxSizing: "border-box",
          }}
        >
          {renderContent()}
        </main>

        {/* ======================================================
            AI ASSISTANT
        ====================================================== */}

        <aside
          style={{
            width: "100%",

            minWidth: 0,
            minHeight: 0,

            backgroundColor: "#ffffff",

            border: "1px solid #e5e7eb",

            borderRadius: "20px",

            padding: "26px",

            overflowY: "auto",
            overflowX: "hidden",

            boxShadow:
              "0 5px 22px rgba(15,23,42,0.06)",

            boxSizing: "border-box",
          }}
        >
          {/* AI HEADER */}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "13px",

              paddingBottom: "20px",

              borderBottom:
                "1px solid #e5e7eb",

              marginBottom: "22px",
            }}
          >
            <div
              style={{
                width: "52px",
                height: "52px",

                borderRadius: "15px",

                background:
                  "linear-gradient(135deg, #dbeafe, #e0f2fe)",

                display: "flex",
                alignItems: "center",
                justifyContent: "center",

                fontSize: "27px",

                flexShrink: 0,
              }}
            >
              🤖
            </div>

            <div>
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: "700",
                  color: "#111827",
                }}
              >
                AI Assistant
              </div>

              <div
                style={{
                  fontSize: "12px",
                  color: "#16a34a",
                  marginTop: "4px",
                  fontWeight: "600",
                }}
              >
                ● Live insights
              </div>
            </div>
          </div>

          {/* EXISTING AI COMPONENT */}

          <div
            style={{
              width: "100%",
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
          bottom: "22px",

          transform: "translateX(-50%)",

          display: "flex",
          alignItems: "center",
          justifyContent: "center",

          gap: "7px",

          padding: "9px",

          backgroundColor:
            "rgba(255,255,255,0.97)",

          backdropFilter: "blur(16px)",

          border:
            "1px solid #e5e7eb",

          borderRadius: "22px",

          boxShadow:
            "0 16px 40px rgba(15,23,42,0.18)",

          zIndex: 1500,

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
              title={item.label}
              style={{
                minWidth: "105px",
                height: "68px",

                padding: "7px 14px",

                border: "none",

                borderRadius: "17px",

                backgroundColor: active
                  ? "#eff6ff"
                  : "transparent",

                color: active
                  ? "#2563eb"
                  : "#64748b",

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
                  "all 0.2s ease",

                whiteSpace:
                  "nowrap",

                flexShrink: 0,
              }}
            >
              {/* ICON */}

              <span
                style={{
                  fontSize: "23px",
                  lineHeight: "1",
                }}
              >
                {item.icon}
              </span>

              {/* LABEL */}

              <span
                style={{
                  fontSize: "12px",
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