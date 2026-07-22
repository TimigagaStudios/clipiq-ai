import { useState } from "react";
import LandingPage from "./components/LandingPage";
import Dashboard from "./components/Dashboard";
import { AuthProvider } from "./lib/auth";
import { Protected } from "./components/Protected";

function App() {
  const [view, setView] = useState<"landing" | "dashboard">("landing");

  return (
    <AuthProvider>
      <div className="dark">
        {view === "landing" ? (
          <LandingPage onGetStarted={() => setView("dashboard")} />
        ) : (
          <Protected>
            <Dashboard />
          </Protected>
        )}
      </div>
    </AuthProvider>
  );
}

export default App;