// src/pages/Index.tsx - Redirects to Login page
// This file is kept for compatibility

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const user = localStorage.getItem("user");
    if (user) {
      navigate("/dashboard");
    } else {
      navigate("/");
    }
  }, [navigate]);

  return null;
};

export default Index;
