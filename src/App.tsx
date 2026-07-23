import { useState } from "react";
import LandingPage from "./components/LandingPage";
import Dashboard from "./components/Dashboard";
import { AuthProvider, useAuth } from "./lib/auth";
import { Protected } from "./components/Protected";
import { AuthFlash } from "./components/AuthFlash";

function AppShell() {
  const { isAuthenticated, isConfigured, loading } = useAuth();
  const [entered, setEntered] = useState(false);

  // Show the protected area when the user explicitly enters (Get Started / Log in),
  // or when auth is configured and we're loading a session / already signed in
  // (returning users + post-redirect sign-in skip the marketing landing page).
  // Guest mode (Supabase not configured) keeps the landing page first, as before.
  const showApp = entered || (isConfigured && (isAuthenticated || loading));

  return showApp ? (
    <Protected>
      <Dashboard />
    </Protected>
  ) : (
    <LandingPage onGetStarted={() => setEntered(true)} />
  );
}

function App() {
  return (
    <AuthProvider>
      <AuthFlash />
      <div className="dark">
        <AppShell />
      </div>
    </AuthProvider>
  );
}

export default App;
