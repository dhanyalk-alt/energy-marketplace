import React, { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  BatteryCharging,
  CheckCircle2,
  Cpu,
  FolderOpen,
  LockKeyhole,
  Phone,
  RefreshCw,
  Sun,
  Upload,
  UserRound,
  UsersRound,
  Video,
  X,
  Zap,
} from "lucide-react";
import { API_BASE_URL } from "../../config";
import "./AuthGateway.css";

const emptyErrors = {
  username: "",
  phoneNumber: "",
  password: "",
  confirmPassword: "",
  form: "",
};

export default function AuthGateway({ onLoginSuccess }) {
  // Modal visibility & active auth mode
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("login"); // 'login' | 'register'

  // Custom Video Settings (Local PC Only)
  const [isVideoSettingsOpen, setIsVideoSettingsOpen] = useState(false);
  const [customVideoSrc, setCustomVideoSrc] = useState(() => {
    return localStorage.getItem("energix_custom_video") || "";
  });
  const [customVideoName, setCustomVideoName] = useState(() => {
    return localStorage.getItem("energix_custom_video_name") || "";
  });
  const fileInputRef = useRef(null);

  // Video state
  const videoRef = useRef(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);

  // Form states
  const [username, setUsername] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("producer");
  const [errors, setErrors] = useState(emptyErrors);
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordRequirements = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "One uppercase letter", met: /[A-Z]/.test(password) },
    { label: "One lowercase letter", met: /[a-z]/.test(password) },
    { label: "One number", met: /\d/.test(password) },
    { label: "One special character", met: /[^A-Za-z0-9]/.test(password) },
  ];

  // Open modal with specific tab
  const openAuthModal = (tab = "login") => {
    setActiveTab(tab);
    setErrors(emptyErrors);
    setSuccessMessage("");
    setIsAuthModalOpen(true);
  };

  // Close modal and resume video
  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setErrors(emptyErrors);
    setSuccessMessage("");
  };

  // Synchronize video play/pause with modal state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isAuthModalOpen || isVideoSettingsOpen) {
      video.pause();
      setIsVideoPlaying(false);
    } else {
      video.play().catch(() => {
        // Autoplay policy fallback
      });
      setIsVideoPlaying(true);
    }
  }, [isAuthModalOpen, isVideoSettingsOpen]);

  // Reload media when local custom video source changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.load();
    if (!isAuthModalOpen && !isVideoSettingsOpen) {
      video.play().catch(() => {});
      setIsVideoPlaying(true);
    }
  }, [customVideoSrc]);

  // Close modals on Escape key press
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        if (isAuthModalOpen) closeAuthModal();
        if (isVideoSettingsOpen) setIsVideoSettingsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAuthModalOpen, isVideoSettingsOpen]);

  // Local PC Video File Upload Handler (.mp4, .webm, .ogg only)
  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      const allowedExtensions = [".mp4", ".webm", ".ogg"];
      const lowerName = file.name.toLowerCase();
      const isAllowed = allowedExtensions.some((ext) => lowerName.endsWith(ext));

      if (!isAllowed) {
        alert("Please select a supported local video file format: .mp4, .webm, or .ogg");
        return;
      }

      const objectUrl = URL.createObjectURL(file);
      setCustomVideoSrc(objectUrl);
      setCustomVideoName(file.name);
      localStorage.setItem("energix_custom_video", objectUrl);
      localStorage.setItem("energix_custom_video_name", file.name);
      setIsVideoSettingsOpen(false);
    }
  };

  // Select local project asset (/assets/videos/... or /...)
  const handleUseProjectAsset = (assetPath, displayName) => {
    setCustomVideoSrc(assetPath);
    setCustomVideoName(displayName);
    localStorage.setItem("energix_custom_video", assetPath);
    localStorage.setItem("energix_custom_video_name", displayName);
    setIsVideoSettingsOpen(false);
  };

  // Reset to default local project asset
  const handleResetVideo = () => {
    setCustomVideoSrc("");
    setCustomVideoName("");
    localStorage.removeItem("energix_custom_video");
    localStorage.removeItem("energix_custom_video_name");
    setIsVideoSettingsOpen(false);
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    setErrors(emptyErrors);
    setSuccessMessage("");
  };

  const validate = () => {
    const next = { ...emptyErrors };
    if (!username.trim()) next.username = "Required to fill";
    if (activeTab === "register" && !phoneNumber.trim()) {
      next.phoneNumber = "Required to fill";
    }
    if (!password) {
      next.password = "Required to fill";
    } else if (
      activeTab === "register" &&
      passwordRequirements.some((requirement) => !requirement.met)
    ) {
      next.password = "Password must meet all requirements below";
    }
    if (activeTab === "register") {
      if (!confirmPassword) next.confirmPassword = "Required to fill";
      else if (password !== confirmPassword) {
        next.confirmPassword = "Passwords do not match";
      }
    }
    setErrors(next);
    return !Object.values(next).some(Boolean);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSuccessMessage("");
    if (!validate()) return;
    setLoading(true);

    const isRegistering = activeTab === "register";
    const payload = isRegistering
      ? {
          username: username.trim(),
          phone_number: phoneNumber.trim(),
          password,
          role,
        }
      : { username: username.trim(), password, role };

    try {
      const response = await fetch(
        `${API_BASE_URL}${isRegistering ? "/auth/register" : "/auth/login"}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const safeMessage =
          response.status === 401
            ? "Invalid username or password"
            : data.detail || "Authentication failed. Please try again.";
        setErrors({ ...emptyErrors, form: safeMessage });
        return;
      }

      if (isRegistering) {
        setSuccessMessage("Registration completed successfully. Please sign in.");
        setActiveTab("login");
        setPhoneNumber("");
        setPassword("");
        setConfirmPassword("");
        setRole("producer");
        return;
      }

      if (data.access_token) {
        localStorage.setItem("energy_marketplace_jwt", data.access_token);
      }
      localStorage.setItem("user_role", data.role);
      localStorage.setItem("username", username.trim());
      onLoginSuccess(data.role);
    } catch (error) {
      setErrors({
        ...emptyErrors,
        form:
          error.name === "AbortError"
            ? "The sign-in request timed out. Check that the backend is running and try again."
            : "Unable to reach the server. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const field = (key, label, icon, input) => (
    <div className="energix-field">
      <label htmlFor={key}>{label}</label>
      <div className={`energix-input-shell ${errors[key] ? "has-error" : ""}`}>
        {icon}
        {input}
      </div>
      {errors[key] && (
        <p className="energix-field-error" role="alert">
          {errors[key]}
        </p>
      )}
    </div>
  );

  return (
    <div className="landing-viewport">
      {/* ========================================================
          1. FULL-SCREEN BACKGROUND VIDEO LOOP (LOCAL PC FILES ONLY)
      ======================================================== */}
      <div className={`video-wrapper ${isAuthModalOpen || isVideoSettingsOpen ? "video-dimmed" : ""}`}>
        <video
          ref={videoRef}
          key={customVideoSrc || "local-video-loop"}
          className="background-video"
          autoPlay
          loop
          muted
          playsInline
        >
          {/* 1. Local PC file chosen via file picker */}
          {customVideoSrc && (
            <source src={customVideoSrc} />
          )}

          {/* 2. Local project assets (/assets/videos/) */}
          <source src="/assets/videos/background.mp4" type="video/mp4" />
          <source src="/assets/videos/hero.mp4" type="video/mp4" />
          <source src="/assets/videos/background.webm" type="video/webm" />
          <source src="/assets/videos/background.ogg" type="video/ogg" />

          {/* 3. Local root public directory files */}
          <source src="/hero-video.mp4" type="video/mp4" />
          <source src="/background.mp4" type="video/mp4" />
          <source src="/hero-video.webm" type="video/webm" />
          <source src="/hero-video.ogg" type="video/ogg" />
        </video>

        {/* Subtle Dark Gradient Overlay */}
        <div className="video-gradient-overlay" />
      </div>

      {/* ========================================================
          2. LANDING PAGE LAYOUT & HERO SECTION
      ======================================================== */}
      <div className={`landing-content ${isAuthModalOpen || isVideoSettingsOpen ? "content-dimmed" : ""}`}>
        {/* TOP BAR */}
        <header className="landing-topbar">
          {/* Top-Left: Project Logo & Title */}
          <div className="landing-brand">
            <div className="brand-logo-badge">
              <Zap size={22} fill="currentColor" />
            </div>
            <div className="brand-text-wrap">
              <span className="brand-title">Energix</span>
              <span className="brand-subtitle">Energy Marketplace</span>
            </div>
          </div>

          {/* Top-Right: Sign In / Register Buttons */}
          <nav className="landing-top-actions">
            <button
              type="button"
              className="btn-glass"
              onClick={() => openAuthModal("login")}
            >
              Sign In
            </button>
            <button
              type="button"
              className="btn-primary-glow"
              onClick={() => openAuthModal("register")}
            >
              Register
            </button>
          </nav>
        </header>

        {/* HERO CENTER SECTION */}
        <main className="landing-hero">
          <div className="hero-center-container">
            {/* Pill Tag */}
            <div className="hero-pill-badge">
              <span className="pulse-dot" />
              <span>AI-POWERED DECENTRALIZED ENERGY NETWORK</span>
            </div>

            {/* Main Headline */}
            <h1 className="hero-headline">
              A Multi-Agent–Based Renewable Energy<br />
              <span className="hero-headline-gradient"> Trading System for Smart Buildings</span>
            </h1>

            {/* Sub-headline / About Text */}
            <p className="hero-subheadline">
              Enabling seamless, direct energy transactions and automated
              negotiations between local energy producers and consumers. Trade
              surplus rooftop solar directly, stabilize the local microgrid, and
              maximize clean power ROI with real-time intelligence.
            </p>


            {/* Feature Highlights Ribbon */}
            <div className="hero-features-ribbon">
              <div className="hero-feature-item">
                <Zap size={18} className="feature-icon" />
                <span>Direct P2P Trading</span>
              </div>
              <div className="feature-divider" />
              <div className="hero-feature-item">
                <Cpu size={18} className="feature-icon" />
                <span>AI Price Negotiation</span>
              </div>
              <div className="feature-divider" />
              <div className="hero-feature-item">
                <BatteryCharging size={18} className="feature-icon" />
                <span>Battery &amp; Weather Telemetry</span>
              </div>
              <div className="feature-divider" />
              <div className="hero-feature-item">
                <CheckCircle2 size={18} className="feature-icon" />
                <span>Verified Transparency</span>
              </div>
            </div>
          </div>
        </main>

        {/* FOOTER BAR */}
        <footer className="landing-footer">
          <div className="landing-footer-content">
            <p>© 2026 Energix Marketplace. Clean power, democratized.</p>
            <button
              type="button"
              className="footer-video-badge"
              onClick={() => setIsVideoSettingsOpen(true)}
              title="Click to select local PC video file or project asset"
            >
              <Video size={14} />
              <span>Video: {customVideoName || "Local Project Asset (/assets/videos/)"}</span>
              <span className="footer-video-action">(Change)</span>
            </button>
          </div>
        </footer>
      </div>

      {/* ========================================================
          3. LOGIN / REGISTER MODAL & SMOOTH TRANSITION
      ======================================================== */}
      {isAuthModalOpen && (
        <div
          className="auth-modal-overlay"
          onClick={closeAuthModal}
          role="dialog"
          aria-modal="true"
          aria-label="User Authentication Modal"
        >
          <div
            className="auth-modal-dialog"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Modal Close Button */}
            <button
              type="button"
              className="auth-modal-close"
              onClick={closeAuthModal}
              aria-label="Close modal"
            >
              <X size={20} />
            </button>

            {/* Modal Header */}
            <div className="auth-modal-brand-header">
              <div className="auth-brand-bolt">
                <Zap size={22} fill="currentColor" />
              </div>
              <h3>Energix</h3>
              <p>Sign in or register to access the smart energy marketplace</p>
            </div>

            {/* Tab Switcher */}
            <div className="energix-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "login"}
                className={activeTab === "login" ? "active" : ""}
                onClick={() => switchTab("login")}
              >
                Sign In
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "register"}
                className={activeTab === "register" ? "active" : ""}
                onClick={() => switchTab("register")}
              >
                Register
              </button>
            </div>

            {/* Authentication Form */}
            <form noValidate onSubmit={handleSubmit} className="auth-form-shell">
              {field(
                "username",
                "Username",
                <UserRound size={18} />,
                <input
                  id="username"
                  name="username"
                  autoComplete="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Enter your username"
                />
              )}

              {activeTab === "login" && (
                <div className="energix-field">
                  <label htmlFor="signin-role">Sign in as</label>
                  <div className="energix-input-shell">
                    <select
                      id="signin-role"
                      value={role}
                      onChange={(event) => setRole(event.target.value)}
                    >
                      <option value="producer">Solar Producer</option>
                      <option value="consumer">Energy Consumer</option>
                    </select>
                  </div>
                </div>
              )}

              {activeTab === "register" && (
                <>
                  {field(
                    "phoneNumber",
                    "Phone Number",
                    <Phone size={18} />,
                    <input
                      id="phoneNumber"
                      name="tel"
                      type="tel"
                      autoComplete="tel"
                      value={phoneNumber}
                      onChange={(event) => setPhoneNumber(event.target.value)}
                      placeholder="+91 XXXXX XXXXX"
                    />
                  )}
                  <fieldset className="energix-role-fieldset">
                    <legend>Marketplace Role</legend>
                    <div className="energix-role-options">
                      <button
                        type="button"
                        className={role === "producer" ? "selected" : ""}
                        onClick={() => setRole("producer")}
                      >
                        <Sun size={17} />
                        Solar Producer
                      </button>
                      <button
                        type="button"
                        className={role === "consumer" ? "selected" : ""}
                        onClick={() => setRole("consumer")}
                      >
                        <UsersRound size={17} />
                        Consumer
                      </button>
                    </div>
                  </fieldset>
                </>
              )}

              <div>
                {field(
                  "password",
                  "Password",
                  <LockKeyhole size={18} />,
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete={
                      activeTab === "login"
                        ? "current-password"
                        : "new-password"
                    }
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                  />
                )}
                {activeTab === "register" && (
                  <ul
                    className="energix-password-requirements"
                    aria-label="Password requirements"
                  >
                    {passwordRequirements.map((requirement) => (
                      <li
                        key={requirement.label}
                        className={requirement.met ? "met" : "unmet"}
                      >
                        <span aria-hidden="true">
                          {requirement.met ? "✓" : "✕"}
                        </span>
                        {requirement.label}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {activeTab === "register" &&
                field(
                  "confirmPassword",
                  "Confirm Password",
                  <LockKeyhole size={18} />,
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Re-enter your password"
                  />
                )}

              {errors.form && (
                <p className="energix-form-error" role="alert">
                  {errors.form}
                </p>
              )}

              <button
                className="energix-submit"
                type="submit"
                disabled={loading}
              >
                {loading
                  ? activeTab === "login"
                    ? "Signing In..."
                    : "Registering..."
                  : activeTab === "login"
                  ? "SIGN IN"
                  : "CREATE ACCOUNT"}
              </button>

              {successMessage && (
                <p className="energix-success" role="status">
                  {successMessage}
                </p>
              )}
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          4. CUSTOM BACKGROUND VIDEO SETTINGS MODAL
      ======================================================== */}
      {isVideoSettingsOpen && (
        <div
          className="auth-modal-overlay"
          onClick={() => setIsVideoSettingsOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Customize Background Video"
        >
          <div
            className="video-settings-dialog"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              className="auth-modal-close"
              onClick={() => setIsVideoSettingsOpen(false)}
              aria-label="Close video settings"
            >
              <X size={20} />
            </button>

            {/* Header */}
            <div className="video-settings-header">
              <div className="video-settings-icon-badge">
                <Video size={22} />
              </div>
              <h3>Local Video Background</h3>
              <p>Configure local PC video files (.mp4, .webm, .ogg) or project folder assets.</p>
            </div>

            {/* Currently Active Video Status */}
            {customVideoName && (
              <div className="video-active-pill">
                <span className="pulse-dot" />
                <span>
                  Active local video: <strong>{customVideoName}</strong>
                </span>
              </div>
            )}

            {/* Local Video Options */}
            <div className="video-options-list">
              {/* Option 1: Pick from Local PC */}
              <div className="video-option-card">
                <div className="video-option-head">
                  <div className="option-icon-wrap">
                    <Upload size={18} />
                  </div>
                  <div>
                    <h4>Select File From Your PC</h4>
                    <p>Load any local video file directly into the background. Supported formats: .mp4, .webm, .ogg.</p>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".mp4,.webm,.ogg,video/mp4,video/webm,video/ogg"
                  onChange={handleFileUpload}
                  style={{ display: "none" }}
                />
                <button
                  type="button"
                  className="btn-option-action btn-option-primary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={15} />
                  <span>Choose Local File (.mp4, .webm, .ogg)...</span>
                </button>
              </div>

              {/* Option 2: Local Project Folder (/assets/videos/) */}
              <div className="video-option-card">
                <div className="video-option-head">
                  <div className="option-icon-wrap">
                    <FolderOpen size={18} />
                  </div>
                  <div>
                    <h4>Local Project Folder Asset</h4>
                    <p>
                      Store local videos directly in your project at:{" "}
                      <code>energy-marketplace/public/assets/videos/</code>
                    </p>
                  </div>
                </div>
                <div className="option-actions-row">
                  <button
                    type="button"
                    className="btn-option-action btn-option-secondary"
                    onClick={() => handleUseProjectAsset("/assets/videos/background.mp4", "background.mp4")}
                  >
                    Load /assets/videos/background.mp4
                  </button>
                  <button
                    type="button"
                    className="btn-option-action btn-option-secondary"
                    onClick={() => handleUseProjectAsset("/assets/videos/hero.mp4", "hero.mp4")}
                  >
                    Load /assets/videos/hero.mp4
                  </button>
                  <button
                    type="button"
                    className="btn-option-action btn-option-secondary"
                    onClick={() => handleUseProjectAsset("/hero-video.mp4", "hero-video.mp4")}
                  >
                    Load /hero-video.mp4
                  </button>
                </div>
              </div>
            </div>

            {/* Footer / Reset Default */}
            <div className="video-settings-footer">
              <button
                type="button"
                className="btn-reset-video"
                onClick={handleResetVideo}
              >
                <RefreshCw size={15} />
                <span>Reset to Project Default Asset</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
