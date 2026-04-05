import { useMemo, useState } from "react";
import DataTable from "../components/DataTable";
import FormSelect from "../components/FormSelect";
import PageHeader from "../components/PageHeader";
import { useAuth } from "../context/AuthContext";
import { useRealtimeCollection } from "../hooks/useRealtimeCollection";
import { subscribeToDistributions, subscribeToUsers } from "../services/firestore";
import { formatDate } from "../utils/formatters";
import { getOrganizationOptions } from "../utils/inventory";

export default function DistributionsList() {
  const { isAdmin, organizationName, organizationId } = useAuth();
  const [selectedOrganization, setSelectedOrganization] = useState("all");
  const scope = useMemo(
    () => ({
      isAdmin,
      organizationName,
      selectedOrganization: isAdmin ? selectedOrganization : organizationName,
      userId: organizationId,
    }),
    [isAdmin, organizationId, organizationName, selectedOrganization],
  );
  const { items: distributions, loading, error } = useRealtimeCollection(
    subscribeToDistributions,
    scope,
  );
  const { items: users } = useRealtimeCollection(subscribeToUsers, scope);
  const organizationOptions = getOrganizationOptions(users, [], distributions);

  const columns = [
    { key: "organizationName", label: "Organization" },
    { key: "itemName", label: "Item" },
    { key: "quantity", label: "Quantity" },
    { key: "location", label: "Location" },
    {
      key: "date",
      label: "Date",
      render: (row) => formatDate(row.date),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Records"
        title={isAdmin ? "All distribution records" : `${organizationName} distributions`}
        description={
          isAdmin
            ? "Admin view of every organization distribution, with optional organization filtering."
            : "You are seeing only your organization distribution records."
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
          Loading distributions...
        </p>
      ) : (
        <DataTable
          columns={columns}
          rows={distributions}
          emptyMessage="No distributions recorded yet."
        />
      )}
    </div>
  );
}
