import { useMemo } from "react";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import StatBadge from "../components/StatBadge";
import SummaryCard from "../components/SummaryCard";
import { useAuth } from "../context/AuthContext";
import { useRealtimeCollection } from "../hooks/useRealtimeCollection";
import {
  subscribeToDistributions,
  subscribeToDonations,
} from "../services/firestore";
import { formatCurrency, formatDate } from "../utils/formatters";
import { computeInventory } from "../utils/inventory";

export default function OrganizationDashboard() {
  const { organizationName, organizationId } = useAuth();
  const scope = useMemo(
    () => ({
      isAdmin: false,
      organizationName,
      selectedOrganization: organizationName,
      userId: organizationId,
    }),
    [organizationId, organizationName],
  );
  const { items: donations, loading: donationsLoading, error: donationsError } =
    useRealtimeCollection(subscribeToDonations, scope);
  const {
    items: distributions,
    loading: distributionsLoading,
    error: distributionsError,
  } = useRealtimeCollection(subscribeToDistributions, scope);

  const dashboardLoading = donationsLoading || distributionsLoading;
  const dashboardError = donationsError || distributionsError;
  const inventory = computeInventory(donations, distributions);
  const latestDonation = donations[0];
  const latestDistribution = distributions[0];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Organization"
        title={`${organizationName} dashboard`}
        description="Your organization can only view and manage its own donation and distribution records."
      />

      {dashboardError ? (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {dashboardError}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Cash Donations"
          value={formatCurrency(inventory.totalCashDonations)}
          hint="Logged by your organization"
        />
        <SummaryCard
          label="Goods Donated"
          value={inventory.totalGoodsDonated}
          hint="Total incoming items"
        />
        <SummaryCard
          label="Goods Distributed"
          value={inventory.totalGoodsDistributed}
          hint="Total released items"
        />
        <SummaryCard
          label="Remaining Balance"
          value={inventory.remainingInventory.reduce(
            (total, item) => total + item.quantity,
            0,
          )}
          hint="Current stock on hand"
        />
        <SummaryCard
          label="Pending Approvals"
          value={donations.filter((item) => item.status === "pending").length}
          hint="Awaiting admin review"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <SectionCard
          title="Inventory Snapshot"
          subtitle="Computed from your donation records minus your distribution records."
        >
          {dashboardLoading ? (
            <p className="text-sm text-slate-500">Loading inventory...</p>
          ) : inventory.remainingInventory.length === 0 ? (
            <p className="text-sm text-slate-500">No remaining inventory yet.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {inventory.remainingInventory.map((item) => (
                <StatBadge key={item.itemName} label={item.itemName} value={item.quantity} />
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Recent Activity" subtitle="Latest records saved by your organization.">
          <div className="space-y-4">
            <div className="rounded-2xl bg-brand-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-600">
                Latest Donation
              </p>
              {latestDonation ? (
                <div className="mt-2 space-y-1 text-sm text-slate-700">
                  <p className="font-semibold">{latestDonation.organizationName}</p>
                  <p>
                    {latestDonation.type === "cash"
                      ? formatCurrency(latestDonation.amount)
                      : `${latestDonation.quantity} ${latestDonation.itemName}`}
                  </p>
                  <p>{formatDate(latestDonation.date)}</p>
                </div>
              ) : (
                <p className="mt-2 text-sm text-slate-500">No donation records yet.</p>
              )}
            </div>

            <div className="rounded-2xl bg-amber-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-700">
                Latest Distribution
              </p>
              {latestDistribution ? (
                <div className="mt-2 space-y-1 text-sm text-slate-700">
                  <p className="font-semibold">{latestDistribution.organizationName}</p>
                  <p>
                    {latestDistribution.quantity} {latestDistribution.itemName}
                  </p>
                  <p>{latestDistribution.location}</p>
                  <p>{formatDate(latestDistribution.date)}</p>
                </div>
              ) : (
                <p className="mt-2 text-sm text-slate-500">No distribution records yet.</p>
              )}
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
