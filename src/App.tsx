import { useState } from "react";
import LandingPage from "./components/LandingPage";
import Dashboard from "./components/Dashboard";

function App() {
  const [view, setView] = useState<"landing" | "dashboard">("landing");

  return (
    <div className="dark">
      {view === "landing" ? (
        <LandingPage onGetStarted={() => setView("dashboard")} />
      ) : (
        <Dashboard />
      )}
    </div>
  );
}

export default App;
