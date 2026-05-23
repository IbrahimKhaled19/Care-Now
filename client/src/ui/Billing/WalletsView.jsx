import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Download } from "lucide-react";
import StatusBadge from "../common/StatusBadge";
import BaseTable from "../common/BaseTable";
import Card from "../common/Card";
import Button from "../common/Button";
import Skeleton from "../common/Skeleton";
import {
  tooltipStyle,
  gridProps,
  axisProps,
  tickStyle,
} from "../Analytics/chartTheme";
import { useWallets, useBillingSummary, useEarningsOverTime, useTransactionTypes } from "../../hooks/useApi";
import { formatDate } from "../../lib/formatDate";
import { exportCsv } from "../../lib/exportCsv";

const walletColumns = [
  "ID",
  "Name",
  "Role",
  "Balance",
  "On-Hold",
  "Earnings",
  "Last Txn",
  "Type",
  "Status",
];

const header = (
  <tr>
    {walletColumns.map((h) => (
      <th
        key={h}
        className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider"
      >
        {h}
      </th>
    ))}
  </tr>
);

const renderRow = (w) => (
  <tr key={w.id} className="hover:bg-gray-50 transition-colors duration-100">
    <td className="px-5 py-3.5 text-sm font-medium text-gray-800">{w.id}</td>
    <td className="px-5 py-3.5 text-sm text-gray-600">{w.user_name || w.name}</td>
    <td className="px-5 py-3.5 text-sm text-gray-600">{w.user_role || w.role}</td>
    <td className="px-5 py-3.5 text-sm font-medium text-gray-800">{w.balance}</td>
    <td className="px-5 py-3.5 text-sm text-gray-600">{w.on_hold}</td>
    <td className="px-5 py-3.5 text-sm text-gray-600">{w.earnings}</td>
    <td className="px-5 py-3.5 text-sm text-gray-600">{formatDate(w.last_transaction_date)}</td>
    <td className="px-5 py-3.5 text-sm text-gray-600">{w.type}</td>
    <td className="px-5 py-3.5"><StatusBadge status={w.status} /></td>
  </tr>
);

const formatEgp = (v) => [`${v} EGP`, "Earnings"];

function WalletsView() {
  const { data: wallets, loading } = useWallets();
  const { data: summary, loading: loadingSummary } = useBillingSummary();
  const { data: earningsData, loading: loadingEarnings } = useEarningsOverTime();
  const { data: typeBars, loading: loadingTypes } = useTransactionTypes();
  const rows = wallets || [];

  const summaryCards = [
    { label: "Total Balance", value: summary ? `${summary.totalBalance.toLocaleString()} EGP` : "—" },
    { label: "Total Earnings", value: summary ? `${summary.totalEarnings.toLocaleString()} EGP` : "—" },
    { label: "Pending Withdrawals", value: summary ? `${summary.pendingWithdrawals.toLocaleString()} EGP` : "—" },
    { label: "On-Hold Funds", value: summary ? `${summary.onHoldFunds.toLocaleString()} EGP` : "—" },
  ];

  const handleExport = () => {
    exportCsv(
      "wallets.csv",
      ["ID", "Name", "Role", "Balance", "On-Hold", "Earnings", "Last Txn", "Type", "Status"],
      rows.map((w) => [
        w.id, w.user_name || w.name, w.user_role || w.role, w.balance,
        w.on_hold, w.earnings, formatDate(w.last_transaction_date), w.type, w.status,
      ]),
    );
  };

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {summaryCards.map((card, idx) => (
          <Card key={card.label} className={idx === 0 ? "bg-teal-50 border-teal-100" : ""}>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">{card.label}</p>
            {loadingSummary ? <Skeleton className="h-6 w-24" /> : (
              <p className="text-xl font-bold text-gray-800">{card.value}</p>
            )}
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
        <Card className="lg:col-span-2" padding={false}>
          <div className="p-6 pb-0">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Earnings</h3>
          </div>
          <div className="px-6 pb-6" style={{ height: 240 }}>
            {loadingEarnings ? <Skeleton className="h-full w-full" /> : (
              <ResponsiveContainer>
                <LineChart data={earningsData || []} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="month" {...axisProps} tick={tickStyle} />
                  <YAxis {...axisProps} tick={tickStyle} />
                  <Tooltip contentStyle={tooltipStyle} formatter={formatEgp} />
                  <Line type="monotone" dataKey="value" stroke="#0d9488" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Transaction Types</h3>
          {loadingTypes ? <Skeleton className="h-32 w-full" /> : (
            <div className="space-y-4">
              {(typeBars || []).map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-gray-600">{item.label}</span>
                    <span className="text-sm font-medium text-gray-800">{item.value}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full`} style={{ width: item.value }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="mb-4">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-700">User Wallets</h3>
        </div>
        <BaseTable
          header={header}
          colCount={walletColumns.length}
          data={rows}
          currentPage={1}
          totalPages={1}
          rowRenderer={renderRow}
          isLoading={loading}
        />
      </div>

      <div className="mt-6 flex justify-end">
        <Button variant="outline" onClick={handleExport} disabled={rows.length === 0}>
          <Download size={16} className="mr-2" />
          Export
        </Button>
      </div>
    </div>
  );
}

export default WalletsView;
