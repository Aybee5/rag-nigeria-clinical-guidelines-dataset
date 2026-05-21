import React, { useState } from "react";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import Login from "./auth/Login";
import Register from "./auth/Register";
import ChatApp from "./chat/ChatApp";
import "./auth/style.less";
import { Routes, Route } from "react-router-dom";
import HealthBotLanding from "./components/Landing/HealthBotNG";

function AuthGate() {
  const { user, loading } = useAuth();
  const [mode, setMode] = useState("login");

  if (loading) return <div className="auth-loading">Loading…</div>;
  if (user)
    return (
      <div className="app-with-logout">
        <ChatApp />
        <LogoutBar />
      </div>
    );

  return (
    <div className="auth-container">
      {mode === "login" ? (
        <Login onSwitch={setMode} />
      ) : (
        <Register onSwitch={setMode} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HealthBotLanding />} />
      <Route
        path="/app"
        element={
          <AuthProvider>
            <AuthGate />
          </AuthProvider>
        }
      />
    </Routes>
  );
}

function LogoutBar() {
  const { user, logout } = useAuth();
  return (
    <div className="logout-bar">
      <div className="logout-inner">
        <span className="logout-user">{user?.email}</span>
        <button className="logout-btn" onClick={logout}>
          Sign out
        </button>
      </div>
    </div>
  );
}
