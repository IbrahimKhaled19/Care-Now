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
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useProfile must be used within UserProvider");
  return ctx;
}
