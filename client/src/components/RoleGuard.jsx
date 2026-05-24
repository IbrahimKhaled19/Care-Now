import { Navigate } from "react-router-dom";
import { useProfile } from "../context/UserContext";

export default function RoleGuard({ roles, children }) {
  const profile = useProfile();

  if (!profile || !roles.includes(profile.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
