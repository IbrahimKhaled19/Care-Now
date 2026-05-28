import { useEffect, useState, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { useAuth, useUser, SignedIn, SignedOut } from "@clerk/clerk-react";
import RolePicker from "./RolePicker";
import { UserProvider } from "../context/UserContext";
import { api } from "../lib/api";

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
          <span className="text-white text-sm font-bold">C</span>
        </div>
        <div className="w-6 h-6 border-2 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
      </div>
    </div>
  );
}

export default function ProtectedRoute({ children }) {
  const { getToken } = useAuth();
  const { user: clerkUser, isLoaded } = useUser();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [needsRole, setNeedsRole] = useState(false);
  const [error, setError] = useState(null);

  const syncUser = useCallback(async (role) => {
    try {
      const body = {
        email: clerkUser.primaryEmailAddress?.emailAddress,
        full_name: clerkUser.fullName || clerkUser.firstName || "",
        avatar_url: clerkUser.imageUrl || null,
      };
      if (role) body.role = role;

      const data = await api.post("/users/sync", body);

      if (data.needsRole) {
        setNeedsRole(true);
        setLoading(false);
        return;
      }

      setProfile(data);
      setNeedsRole(false);
    } catch (err) {
      setError(err.message || "Failed to sync user profile");
    } finally {
      setLoading(false);
    }
  }, [clerkUser]);

  useEffect(() => {
    if (!isLoaded || !clerkUser) return;
    syncUser();
  }, [isLoaded, clerkUser, syncUser]);

  const handleRoleSelect = (role) => {
    setLoading(true);
    syncUser(role);
  };

  return (
    <>
      <SignedOut>
        <Navigate to="/login" replace />
      </SignedOut>
      <SignedIn>
        {loading ? (
          <LoadingScreen />
        ) : error ? (
          <div className="min-h-screen bg-cream-50 flex items-center justify-center px-4">
            <div className="text-center">
              <p className="text-sm text-red-500">{error}</p>
              <button onClick={() => syncUser()} className="mt-3 text-sm text-teal-600 underline">Retry</button>
            </div>
          </div>
        ) : needsRole ? (
          <RolePicker onSelect={handleRoleSelect} />
        ) : profile ? (
          <UserProvider profile={profile}>{children}</UserProvider>
        ) : (
          <Navigate to="/login" replace />
        )}
      </SignedIn>
    </>
  );
}
