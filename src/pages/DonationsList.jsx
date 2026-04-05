import { useMemo, useState } from "react";
import DataTable from "../components/DataTable";
import FormSelect from "../components/FormSelect";
import PageHeader from "../components/PageHeader";
import { useAuth } from "../context/AuthContext";
import { useRealtimeCollection } from "../hooks/useRealtimeCollection";
import {
  subscribeToDonations,
  subscribeToUsers,
  updateDonationStatus,
} from "../services/firestore";
import { formatCurrency, formatDate } from "../utils/formatters";
import { getOrganizationOptions } from "../utils/inventory";

export default function DonationsList() {
  const { isAdmin, organizationName, organizationId } = useAuth();
  const [selectedOrganization, setSelectedOrganization] = useState("all");
  const [updatingId, setUpdatingId] = useState("");
  const scope = useMemo(
    () => ({
      isAdmin,
      organizationName,
      selectedOrganization: isAdmin ? selectedOrganization : organizationName,
      userId: organizationId,
    }),
    [isAdmin, organizationId, organizationName, selectedOrganization],
  );
  const { items: donations, loading, error } = useRealtimeCollection(
    subscribeToDonations,
    scope,
  );
  const { items: users } = useRealtimeCollection(subscribeToUsers, scope);
  const organizationOptions = getOrganizationOptions(users, donations);

  async function handleApprove(donationId) {
    setUpdatingId(donationId);

    try {
      await updateDonationStatus(donationId, "approved");
    } finally {
      setUpdatingId("");
    }
  }

  const columns = [
    { key: "organizationName", label: "Organization" },
    { key: "type", label: "Type" },
    {
      key: "details",
      label: "Item / Amount",
      render: (row) =>
        row.type === "cash"
          ? formatCurrency(row.amount)
          : `${row.itemName} (${row.quantity})`,
    },
    {
      key: "status",
      label: "Status",
      render: (row) => row.status,
    },
    {
      key: "date",
      label: "Date",
      render: (row) => formatDate(row.date),
    },
  ];

  if (isAdmin) {
    columns.push({
      key: "actions",
      label: "Action",
      render: (row) =>
        row.status === "approved" ? (
          "Approved"
        ) : (
          <button
            type="button"
            onClick={() => handleApprove(row.id)}
            disabled={updatingId === row.id}
            className="rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-60"
          >
            {updatingId === row.id ? "Approving..." : "Approve"}
          </button>
        ),
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Records"
        title={isAdmin ? "All donation records" : `${organizationName} donations`}
        description={
          isAdmin
            ? "Admin view of every organization donation, with optional organization filtering."
            : "You are seeing only your organization donation records."
        }
        action={
          isAdmin ? (
            <div className="w-full max-w-xs">
              <FormSelect
                label="Filter organization"
                name="selectedOrganization"
                value={selectedOrganization}
                onChange={(event) => setSelectedOrganization(event.target.value)}
                options={[
                  { value: "all", label: "All organizations" },
                  ...organizationOptions.map((item) => ({ value: item, label: item })),
                ]}
              />
            </div>
          ) : null
        }
      />

      {error ? (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}

      {loading ? (
        <p className="rounded-3xl bg-white px-5 py-4 text-sm text-slate-500 shadow-card">
          Loading donations...
        </p>
      ) : (
        <DataTable columns={columns} rows={donations} emptyMessage="No donations recorded yet." />
      )}
    </div>
  );
}
