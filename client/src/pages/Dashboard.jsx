import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/app/analytics", { replace: true });
  }, [navigate]);

  return null;
}

export default Dashboard;
