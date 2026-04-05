import { useMemo, useState } from "react";
import DataTable from "../components/DataTable";
import FormSelect from "../components/FormSelect";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
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
  const pendingDonations = donations.filter((item) => item.status === "pending");

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
      render: (row) => (
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
            row.status === "approved"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-amber-50 text-amber-700"
          }`}
        >
          {row.status}
        </span>
      ),
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

      {isAdmin ? (
        <SectionCard
          title="Pending approvals"
          subtitle="Approve organization donations here without needing to scroll the table."
        >
          {pendingDonations.length === 0 ? (
            <p className="text-sm text-slate-500">No pending donations to approve.</p>
          ) : (
            <div className="space-y-3">
              {pendingDonations.map((donation) => (
                <div
                  key={`pending-${donation.id}`}
                  className="flex flex-col gap-3 rounded-2xl border border-brand-100 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-brand-900">
                      {donation.organizationName}
                    </p>
                    <p className="text-sm text-slate-600">
                      {donation.type === "cash"
                        ? formatCurrency(donation.amount)
                        : `${donation.quantity} ${donation.itemName}`}
                    </p>
                    <p className="text-xs text-slate-500">{formatDate(donation.date)}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleApprove(donation.id)}
                    disabled={updatingId === donation.id}
                    className="rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {updatingId === donation.id ? "Approving..." : "Approve Donation"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      ) : (
        <SectionCard
          title="Approval status"
          subtitle="Organization donations stay pending until an admin approves them."
        >
          <p className="text-sm text-slate-500">
            Pending donations will appear on the public page after admin approval.
          </p>
        </SectionCard>
      )}

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
