import React, { useState } from "react";
import { LockKeyhole, Phone, Sun, UserRound, UsersRound, Zap } from "lucide-react";
import { API_BASE_URL } from "../../config";
import "./AuthGateway.css";

const emptyErrors = { username: "", phoneNumber: "", password: "", confirmPassword: "", form: "" };

export default function AuthGateway({ onLoginSuccess }) {
  const [activeTab, setActiveTab] = useState("login");
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

  const switchTab = (tab) => {
    setActiveTab(tab);
    setErrors(emptyErrors);
    setSuccessMessage("");
  };

  const validate = () => {
    const next = { ...emptyErrors };
    if (!username.trim()) next.username = "Required to fill";
    if (activeTab === "register" && !phoneNumber.trim()) next.phoneNumber = "Required to fill";
    if (!password) next.password = "Required to fill";
    else if (activeTab === "register" && passwordRequirements.some((requirement) => !requirement.met)) {
      next.password = "Password must meet all requirements below";
    }
    if (activeTab === "register") {
      if (!confirmPassword) next.confirmPassword = "Required to fill";
      else if (password !== confirmPassword) next.confirmPassword = "Passwords do not match";
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
      ? { username: username.trim(), phone_number: phoneNumber.trim(), password, role }
      : { username: username.trim(), password, role };

    try {
      const response = await fetch(`${API_BASE_URL}${isRegistering ? "/auth/register" : "/auth/login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const safeMessage = response.status === 401
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

      if (data.access_token) localStorage.setItem("energy_marketplace_jwt", data.access_token);
      localStorage.setItem("user_role", data.role);
      localStorage.setItem("username", username.trim());
      onLoginSuccess(data.role);
    } catch (error) {
      setErrors({
        ...emptyErrors,
        form: error.name === "AbortError"
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
      {errors[key] && <p className="energix-field-error" role="alert">{errors[key]}</p>}
    </div>
  );

  return (
    <main className="energix-auth-page">
      <div className="energix-orbit energix-orbit-one" />
      <div className="energix-orbit energix-orbit-two" />
      <section className="energix-auth-shell" aria-label="Energix authentication">
        <header className="energix-brand">
          <span className="energix-bolt" aria-hidden="true"><Zap size={23} fill="currentColor" /></span>
          <h1>Energix</h1>
          <p>Welcome to Energix — smart, sustainable energy trading.</p>
        </header>

        <div className="energix-auth-grid">
          <aside className="energix-illustration" aria-hidden="true">
            <div className="energix-sun"><span /></div>
            <div className="energix-panel">
              <i /><i /><i /><i /><i /><i /><i /><i /><i />
            </div>
            <div className="energix-energy-card">
              <span><Zap size={18} fill="currentColor" /></span>
              <strong>Energy, shared securely.</strong>
              <small>Trade renewable power with confidence.</small>
            </div>
            <div className="energix-leaf energix-leaf-left" />
            <div className="energix-leaf energix-leaf-right" />
          </aside>

          <section className="energix-form-card">
            <div className="energix-tabs" role="tablist" aria-label="Authentication options">
              <button type="button" role="tab" aria-selected={activeTab === "login"} className={activeTab === "login" ? "active" : ""} onClick={() => switchTab("login")}>Sign In</button>
              <button type="button" role="tab" aria-selected={activeTab === "register"} className={activeTab === "register" ? "active" : ""} onClick={() => switchTab("register")}>Register</button>
            </div>

            <div className="energix-form-heading">
              <p>{activeTab === "login" ? "WELCOME BACK" : "JOIN THE MARKETPLACE"}</p>
              <h2>{activeTab === "login" ? "LOG IN" : "CREATE ACCOUNT"}</h2>
            </div>

            <form noValidate onSubmit={handleSubmit}>
              {field("username", "Username", <UserRound size={18} />, <input id="username" name="username" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Enter your username" />)}

              {activeTab === "login" && (
                <div className="energix-field">
                  <label htmlFor="signin-role">Sign in as</label>
                  <select id="signin-role" value={role} onChange={(event) => setRole(event.target.value)}>
                    <option value="producer">Producer</option>
                    <option value="consumer">Consumer</option>
                  </select>
                </div>
              )}

              {activeTab === "register" && <>
                {field("phoneNumber", "Phone Number", <Phone size={18} />, <input id="phoneNumber" name="tel" type="tel" autoComplete="tel" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} placeholder="+91 XXXXX XXXXX" />)}
                <fieldset className="energix-role-fieldset">
                  <legend>Marketplace Role</legend>
                  <div className="energix-role-options">
                    <button type="button" className={role === "producer" ? "selected" : ""} onClick={() => setRole("producer")}><Sun size={17} />Solar Producer</button>
                    <button type="button" className={role === "consumer" ? "selected" : ""} onClick={() => setRole("consumer")}><UsersRound size={17} />Consumer</button>
                  </div>
                </fieldset>
              </>}

              <div>
                {field("password", "Password", <LockKeyhole size={18} />, <input id="password" name="password" type="password" autoComplete={activeTab === "login" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" />)}
                {activeTab === "register" && (
                  <ul className="energix-password-requirements" aria-label="Password requirements">
                    {passwordRequirements.map((requirement) => (
                      <li key={requirement.label} className={requirement.met ? "met" : "unmet"}>
                        <span aria-hidden="true">{requirement.met ? "✓" : "✕"}</span>{requirement.label}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {activeTab === "register" && field("confirmPassword", "Confirm Password", <LockKeyhole size={18} />, <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Re-enter your password" />)}

              {errors.form && <p className="energix-form-error" role="alert">{errors.form}</p>}
              <button className="energix-submit" type="submit" disabled={loading}>{loading ? (activeTab === "login" ? "Signing In..." : "Registering...") : (activeTab === "login" ? "LOG IN" : "REGISTER NOW")}</button>
              {successMessage && <p className="energix-success" role="status">{successMessage}</p>}
            </form>
          </section>
        </div>
      </section>
    </main>
  );
}
