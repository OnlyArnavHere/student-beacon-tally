import { useState } from "react";
import LoginForm from "@/components/LoginForm";
import AttendanceDashboard from "@/components/AttendanceDashboard";

const Index = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    return <LoginForm onLoginSuccess={handleLoginSuccess} />;
  }

  return <AttendanceDashboard onLogout={handleLogout} />;
};

export default Index;
