import { createContext, useContext } from "react";

const UserContext = createContext(null);

export function UserProvider({ profile, children }) {
  return (
    <UserContext.Provider value={profile}>
      {children}
    </UserContext.Provider>
  );
}

export function useProfile() {
  return useContext(UserContext);
}

// Convenience hook: true for admin or moderator roles
export function useHasAdminAccess() {
  const profile = useProfile();
  return profile?.role === "admin" || profile?.role === "moderator";
}

// Backward-compatible alias
export const useIsAdmin = useHasAdminAccess;
