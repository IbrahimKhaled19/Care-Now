import { NavLink, Outlet } from "react-router-dom";
import BaseHeader from "../ui/common/BaseHeader";
import PageContainer from "../ui/common/PageContainer";

const tabs = [
  { id: "transactions", label: "Transactions", path: "/billing" },
  { id: "withdrawals", label: "Withdrawals", path: "/billing/withdrawals" },
  { id: "wallet", label: "Wallet", path: "/billing/wallet" },
];

function Billing() {
  return (
    <PageContainer>
      <BaseHeader
        title="Billing & Finance"
        subtitle="Manage financial transactions, revenue reports, and payment methods"
      />

      <div className="mt-6 mb-5">
        <nav aria-label="Billing tabs" className="flex items-center gap-1 border-b border-gray-100">
          {tabs.map((tab) => (
            <NavLink
              key={tab.id}
              to={tab.path}
              end={tab.id === "transactions"}
              className={({ isActive }) =>
                `relative px-4 py-2.5 text-sm font-medium transition-colors duration-150 rounded-t-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-1 ${
                  isActive
                    ? "text-teal-700"
                    : "text-gray-500 hover:text-gray-700"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {tab.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-teal-600 rounded-full" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      <Outlet />
    </PageContainer>
  );
}

export default Billing;
