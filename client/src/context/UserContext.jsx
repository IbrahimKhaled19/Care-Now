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

// Convenience hook
export function useIsAdmin() {
  const profile = useProfile();
  return profile?.role === "admin" || profile?.role === "moderator";
}
