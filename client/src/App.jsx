import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import { ToastProvider } from "./ui/common/Toast";
import { ThemeProvider } from "./context/ThemeContext";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleGuard from "./components/RoleGuard";
import ApiProvider from "./components/ApiProvider";
import ErrorBoundary from "./components/ErrorBoundary";
import Home from "./pages/Home";
import Login from "./pages/Login";
import SignUpPage from "./pages/SignUp";
import NotFound from "./pages/NotFound";
import AppLayout from "./pages/AppLayout";
import { dark } from "@clerk/ui/themes";

// Lazy-loaded pages
const Analytics = lazy(() => import("./pages/Analytics"));
const Requests = lazy(() => import("./pages/Requests"));
const RequestDetails = lazy(() => import("./ui/Requests/RequestDetails"));
const Reports = lazy(() => import("./pages/Reports"));
const Providers = lazy(() => import("./pages/Providers"));
const ProviderDetails = lazy(
  () => import("./ui/Providers/ProviderDetails.jsx"),
);
const Billing = lazy(() => import("./pages/Billing"));
const TransactionsView = lazy(() => import("./ui/Billing/TransactionsView"));
const WithdrawalsView = lazy(() => import("./ui/Billing/WithdrawalsView"));
const WalletsView = lazy(() => import("./ui/Billing/WalletsView"));
const Patient = lazy(() => import("./pages/Patient.jsx"));
const PatientDetails = lazy(() => import("./ui/Patients/PatientDetails.jsx"));
const AdminsManagement = lazy(() => import("./pages/AdminsManagement.jsx"));

function PageSkeleton() {
  return (
    <div className="animate-pulse p-6 space-y-4">
      <div className="h-8 bg-gray-100 rounded w-48" />
      <div className="h-64 bg-gray-100 rounded-xl" />
    </div>
  );
}

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in .env");
}

function App() {
  // Read theme from localStorage directly — useTheme() can't be called here
  // because ThemeProvider is inside ClerkProvider
  const theme =
    typeof window !== "undefined"
      ? localStorage.getItem("carenow-theme") || "light"
      : "light";

  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      appearance={{
        baseTheme: theme === "dark" ? dark : null,
        variables: {
          colorPrimary: "#14b8a6", // Tailwind's teal-600
          colorPrimaryHover: "#0d9488", // Tailwind's teal-700
          colorBackground: "var(--bg-primary)",
          colorBackgroundSecondary: "var(--bg-secondary)",
          colorText: "var(--text-primary)",
          colorTextSecondary: "var(--text-secondary)",
        },
      }}
    >
      <ThemeProvider>
        <ApiProvider>
          <ToastProvider>
            <BrowserRouter>
              <Routes>
                <Route index element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/sign-up" element={<SignUpPage />} />
                <Route
                  element={
                    <ProtectedRoute>
                      <AppLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route element={<ErrorBoundary />}>
                    <Route
                      index
                      element={<Navigate replace to="dashboard" />}
                    />
                    <Route
                      path="dashboard"
                      element={
                        <Suspense fallback={<PageSkeleton />}>
                          <Analytics />
                        </Suspense>
                      }
                    />
                    <Route
                      path="requests"
                      element={
                        <Suspense fallback={<PageSkeleton />}>
                          <Requests />
                        </Suspense>
                      }
                    />
                    <Route
                      path="requests/:id"
                      element={
                        <Suspense fallback={<PageSkeleton />}>
                          <RequestDetails />
                        </Suspense>
                      }
                    />
                    <Route
                      path="billing"
                      element={
                        <Suspense fallback={<PageSkeleton />}>
                          <Billing />
                        </Suspense>
                      }
                    >
                      <Route index element={<TransactionsView />} />
                      <Route path="withdrawals" element={<WithdrawalsView />} />
                      <Route path="wallet" element={<WalletsView />} />
                    </Route>

                    {/* Admin/moderator only */}
                    <Route
                      path="providers"
                      element={
                        <RoleGuard roles={["admin", "moderator"]}>
                          <Suspense fallback={<PageSkeleton />}>
                            <Providers />
                          </Suspense>
                        </RoleGuard>
                      }
                    />
                    <Route
                      path="providers/:id"
                      element={
                        <RoleGuard roles={["admin", "moderator"]}>
                          <Suspense fallback={<PageSkeleton />}>
                            <ProviderDetails />
                          </Suspense>
                        </RoleGuard>
                      }
                    />
                    <Route
                      path="patients"
                      element={
                        <RoleGuard roles={["admin", "moderator"]}>
                          <Suspense fallback={<PageSkeleton />}>
                            <Patient />
                          </Suspense>
                        </RoleGuard>
                      }
                    />
                    <Route
                      path="patients/:id"
                      element={
                        <RoleGuard roles={["admin", "moderator"]}>
                          <Suspense fallback={<PageSkeleton />}>
                            <PatientDetails />
                          </Suspense>
                        </RoleGuard>
                      }
                    />
                    <Route
                      path="report"
                      element={
                        <RoleGuard roles={["admin", "moderator"]}>
                          <Suspense fallback={<PageSkeleton />}>
                            <Reports />
                          </Suspense>
                        </RoleGuard>
                      }
                    />

                    {/* Admin only */}
                    <Route
                      path="admins"
                      element={
                        <RoleGuard roles={["admin"]}>
                          <Suspense fallback={<PageSkeleton />}>
                            <AdminsManagement />
                          </Suspense>
                        </RoleGuard>
                      }
                    />
                  </Route>
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </ToastProvider>
        </ApiProvider>
      </ThemeProvider>
    </ClerkProvider>
  );
}

export default App;
