import { useMemo } from "react";
import DataTable from "../components/DataTable";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import SummaryCard from "../components/SummaryCard";
import { useRealtimeCollection } from "../hooks/useRealtimeCollection";
import {
  subscribeToDistributions,
  subscribeToDonations,
} from "../services/firestore";
import { formatCurrency, formatDate } from "../utils/formatters";
import { computeInventory } from "../utils/inventory";

export default function PublicView() {
  const publicScope = useMemo(
    () => ({ isAdmin: true, selectedOrganization: "all", publicOnly: true }),
    [],
  );
  const {
    items: donations,
    loading: loadingDonations,
    error: donationsError,
  } = useRealtimeCollection(subscribeToDonations, publicScope);
  const {
    items: distributions,
    loading: loadingDistributions,
    error: distributionsError,
  } = useRealtimeCollection(subscribeToDistributions, publicScope);

  const inventory = computeInventory(donations, distributions);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Transparency"
        title="Public donation report"
        description="Residents can view all recorded organization donations and distributions without logging in."
      />

      {donationsError || distributionsError ? (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {donationsError || distributionsError}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          label="Cash Donations"
          value={formatCurrency(inventory.totalCashDonations)}
        />
        <SummaryCard
          label="Goods Distributed"
          value={inventory.totalGoodsDistributed}
        />
        <SummaryCard
          label="Remaining Goods"
          value={inventory.remainingInventory.reduce(
            (total, item) => total + item.quantity,
            0,
          )}
        />
      </div>

      <SectionCard title="Donations" subtitle="Read-only public view of all donations.">
        {loadingDonations ? (
          <p className="text-sm text-slate-500">Loading donations...</p>
        ) : (
          <DataTable
            columns={[
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
                key: "date",
                label: "Date",
                render: (row) => formatDate(row.date),
              },
            ]}
            rows={donations}
            emptyMessage="No donations available for public view yet."
          />
        )}
      </SectionCard>

      <SectionCard
        title="Distributions"
        subtitle="Read-only public view of all recorded distributions."
      >
        {loadingDistributions ? (
          <p className="text-sm text-slate-500">Loading distributions...</p>
        ) : (
          <DataTable
            columns={[
              { key: "organizationName", label: "Organization" },
              { key: "itemName", label: "Item" },
              { key: "quantity", label: "Quantity" },
              { key: "location", label: "Location" },
              {
                key: "date",
                label: "Date",
                render: (row) => formatDate(row.date),
              },
            ]}
            rows={distributions}
            emptyMessage="No distributions available for public view yet."
          />
        )}
      </SectionCard>
    </div>
  );
}
