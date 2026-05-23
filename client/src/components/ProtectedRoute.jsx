import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth, useUser, SignedIn, SignedOut } from "@clerk/clerk-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🔒</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h1>
        <p className="text-sm text-gray-500 mb-6">
          You don't have permission to access the admin dashboard. Only admin and moderator accounts can view this area.
        </p>
        <p className="text-xs text-gray-500">
          Contact your administrator if you believe this is an error.
        </p>
      </div>
    </div>
  );
}

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
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isLoaded || !clerkUser) return;

    const syncUser = async () => {
      try {
        const token = await getToken();

        // Sync with backend (creates profile if first time)
        const res = await fetch(`${API_URL}/users/sync`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            email: clerkUser.primaryEmailAddress?.emailAddress,
            full_name: clerkUser.fullName || clerkUser.firstName || "",
          }),
        });

        if (!res.ok) {
          throw new Error("Failed to sync user profile");
        }

        const data = await res.json();
        setProfile(data);
      } catch (err) {
        console.error("User sync error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    syncUser();
  }, [isLoaded, clerkUser, getToken]);

  return (
    <>
      <SignedOut>
        <Navigate to="/login" replace />
      </SignedOut>
      <SignedIn>
        {loading ? (
          <LoadingScreen />
        ) : error ? (
          <UnauthorizedPage />
        ) : profile && ["admin", "moderator"].includes(profile.role) ? (
          children
        ) : profile ? (
          <UnauthorizedPage />
        ) : (
          <Navigate to="/login" replace />
        )}
      </SignedIn>
    </>
  );
}
