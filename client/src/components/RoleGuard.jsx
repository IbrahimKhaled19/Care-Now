import AccessDenied from "./AccessDenied";
import { useProfile } from "../context/UserContext";

export default function RoleGuard({ roles, children }) {
  const profile = useProfile();

  if (!profile || !roles.includes(profile.role)) {
    return <AccessDenied />;
  }

  return children;
}
