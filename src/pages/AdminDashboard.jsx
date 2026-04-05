import { useMemo, useState } from "react";
import DataTable from "../components/DataTable";
import FormSelect from "../components/FormSelect";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import StatBadge from "../components/StatBadge";
import SummaryCard from "../components/SummaryCard";
import { useRealtimeCollection } from "../hooks/useRealtimeCollection";
import {
  subscribeToDistributions,
  subscribeToDonations,
  subscribeToUsers,
} from "../services/firestore";
import { formatCurrency, formatDate } from "../utils/formatters";
import {
  buildOrganizationStats,
  computeInventory,
  getOrganizationOptions,
} from "../utils/inventory";

export default function AdminDashboard() {
  const [selectedOrganization, setSelectedOrganization] = useState("all");
  const adminScope = useMemo(
    () => ({ isAdmin: true, selectedOrganization: "all", userId: null }),
    [],
  );
  const { items: donations, loading: donationsLoading, error: donationsError } =
    useRealtimeCollection(subscribeToDonations, adminScope);
  const {
    items: distributions,
    loading: distributionsLoading,
    error: distributionsError,
  } = useRealtimeCollection(subscribeToDistributions, adminScope);
  const { items: users } = useRealtimeCollection(subscribeToUsers);

  const organizationOptions = getOrganizationOptions(users, donations, distributions);
  const activeDonations =
    selectedOrganization === "all"
      ? donations
      : donations.filter((item) => item.organizationName === selectedOrganization);
  const activeDistributions =
    selectedOrganization === "all"
      ? distributions
      : distributions.filter((item) => item.organizationName === selectedOrganization);
  const overallInventory = computeInventory(donations, distributions);
  const activeInventory = computeInventory(activeDonations, activeDistributions);
  const organizationStats = buildOrganizationStats(donations, distributions);
  const activityLoading = donationsLoading || distributionsLoading;
  const activityError = donationsError || distributionsError;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Coordination dashboard"
        description="Track all participating organizations, compare stock movement, and monitor the latest donation and distribution activity."
        action={
          <div className="w-full max-w-xs">
            <FormSelect
              label="View organization"
              name="selectedOrganization"
              value={selectedOrganization}
              onChange={(event) => setSelectedOrganization(event.target.value)}
              options={[
                { value: "all", label: "All organizations" },
                ...organizationOptions.map((organization) => ({
                  value: organization,
                  label: organization,
                })),
              ]}
            />
          </div>
        }
      />

      {activityError ? (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {activityError}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Overall Cash Donations"
          value={formatCurrency(overallInventory.totalCashDonations)}
          hint="All organizations combined"
        />
        <SummaryCard
          label="Overall Goods Donated"
          value={overallInventory.totalGoodsDonated}
          hint="Total incoming stock"
        />
        <SummaryCard
          label="Overall Distributed"
          value={overallInventory.totalGoodsDistributed}
          hint="Total released stock"
        />
        <SummaryCard
          label="Overall Remaining"
          value={overallInventory.remainingInventory.reduce(
            (total, item) => total + item.quantity,
            0,
          )}
          hint="Goods still on hand"
        />
        <SummaryCard
          label="Pending Approvals"
          value={donations.filter((item) => item.status === "pending").length}
          hint="Donations waiting for admin approval"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <SectionCard
          title={
            selectedOrganization === "all"
              ? "Combined inventory snapshot"
              : `${selectedOrganization} inventory snapshot`
          }
          subtitle="Computed dynamically from total donations minus total distributions."
        >
          {activityLoading ? (
            <p className="text-sm text-slate-500">Loading inventory...</p>
          ) : activeInventory.remainingInventory.length === 0 ? (
            <p className="text-sm text-slate-500">No remaining inventory for this view.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {activeInventory.remainingInventory.map((item) => (
                <StatBadge
                  key={`${selectedOrganization}-${item.itemName}`}
                  label={item.itemName}
                  value={item.quantity}
                />
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Latest updates"
          subtitle="Most recent donation and distribution in the current dashboard filter."
        >
          <div className="space-y-4">
            <div className="rounded-2xl bg-brand-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-600">
                Latest Donation
              </p>
              {activeDonations[0] ? (
                <div className="mt-2 space-y-1 text-sm text-slate-700">
                  <p className="font-semibold">{activeDonations[0].organizationName}</p>
                  <p>
                    {activeDonations[0].type === "cash"
                      ? formatCurrency(activeDonations[0].amount)
                      : `${activeDonations[0].quantity} ${activeDonations[0].itemName}`}
                  </p>
                  <p>{formatDate(activeDonations[0].date)}</p>
                </div>
              ) : (
                <p className="mt-2 text-sm text-slate-500">No donation records yet.</p>
              )}
            </div>

            <div className="rounded-2xl bg-amber-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-700">
                Latest Distribution
              </p>
              {activeDistributions[0] ? (
                <div className="mt-2 space-y-1 text-sm text-slate-700">
                  <p className="font-semibold">{activeDistributions[0].organizationName}</p>
                  <p>
                    {activeDistributions[0].quantity} {activeDistributions[0].itemName}
                  </p>
                  <p>{activeDistributions[0].location}</p>
                  <p>{formatDate(activeDistributions[0].date)}</p>
                </div>
              ) : (
                <p className="mt-2 text-sm text-slate-500">No distribution records yet.</p>
              )}
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Per-organization totals"
        subtitle="Admin-only comparison of donated goods, distributed goods, and remaining balance."
      >
        <DataTable
          columns={[
            { key: "organizationName", label: "Organization" },
            { key: "totalGoodsDonated", label: "Donated" },
            { key: "totalDistributed", label: "Distributed" },
            { key: "remainingBalance", label: "Remaining" },
            {
              key: "totalCashDonations",
              label: "Cash",
              render: (row) => formatCurrency(row.totalCashDonations),
            },
          ]}
          rows={
            selectedOrganization === "all"
              ? organizationStats
              : organizationStats.filter(
                  (row) => row.organizationName === selectedOrganization,
                )
          }
          emptyMessage="No organization totals available yet."
        />
      </SectionCard>
    </div>
  );
}
