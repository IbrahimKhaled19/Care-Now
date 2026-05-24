import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import { ToastProvider } from "./ui/common/Toast";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleGuard from "./components/RoleGuard";
import ApiProvider from "./components/ApiProvider";
import Home from "./pages/Home";
import Login from "./pages/Login";
import SignUpPage from "./pages/SignUp";
import RequestDetails from "./ui/Requests/RequestDetails";
import NotFound from "./pages/NotFound";
import AppLayout from "./pages/AppLayout";
import Analytics from "./pages/Analytics";
import Requests from "./pages/Requests";
import Reports from "./pages/Reports";
import Providers from "./pages/Providers";
import Billing from "./pages/Billing";
import TransactionsView from "./ui/Billing/TransactionsView";
import WithdrawalsView from "./ui/Billing/WithdrawalsView";
import WalletsView from "./ui/Billing/WalletsView";
import Patient from "./pages/Patient.jsx";
import AdminsManagement from "./pages/AdminsManagement.jsx";
import ProviderDetails from "./ui/Providers/ProviderDetails.jsx";
import PatientDetails from "./ui/Patients/PatientDetails.jsx";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in .env");
}

function App() {
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
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
                <Route index element={<Navigate replace to="dashboard" />} />
                <Route path="dashboard" element={<Analytics />} />
                <Route path="requests" element={<Requests />} />
                <Route path="requests/:id" element={<RequestDetails />} />
                <Route path="billing" element={<Billing />}>
                  <Route index element={<TransactionsView />} />
                  <Route path="withdrawals" element={<WithdrawalsView />} />
                  <Route path="wallet" element={<WalletsView />} />
                </Route>

                {/* Admin/moderator only */}
                <Route path="providers" element={<RoleGuard roles={["admin", "moderator"]}><Providers /></RoleGuard>} />
                <Route path="providers/:id" element={<RoleGuard roles={["admin", "moderator"]}><ProviderDetails /></RoleGuard>} />
                <Route path="patients" element={<RoleGuard roles={["admin", "moderator"]}><Patient /></RoleGuard>} />
                <Route path="patients/:id" element={<RoleGuard roles={["admin", "moderator"]}><PatientDetails /></RoleGuard>} />
                <Route path="report" element={<RoleGuard roles={["admin", "moderator"]}><Reports /></RoleGuard>} />

                {/* Admin only */}
                <Route path="admins" element={<RoleGuard roles={["admin"]}><AdminsManagement /></RoleGuard>} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </ApiProvider>
    </ClerkProvider>
  );
}

export default App;
