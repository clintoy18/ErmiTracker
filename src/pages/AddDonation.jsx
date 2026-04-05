import { useMemo } from "react";
import DonationForm from "../components/DonationForm";
import DistributionForm from "../components/DistributionForm";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import { useAuth } from "../context/AuthContext";
import { useRealtimeCollection } from "../hooks/useRealtimeCollection";
import { subscribeToUsers } from "../services/firestore";
import { getOrganizationDirectory } from "../utils/inventory";

export default function AddDonation() {
  const { isAdmin, organizationName, organizationId } = useAuth();
  const userScope = useMemo(
    () => ({ isAdmin, userId: organizationId }),
    [isAdmin, organizationId],
  );
  const { items: users } = useRealtimeCollection(subscribeToUsers, userScope);
  const organizationOptions = getOrganizationDirectory(users);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Field Entry"
        title={isAdmin ? "Record organization activity" : "Record your organization activity"}
        description={
          isAdmin
            ? "Admins can log records for any organization and review coordination activity in real time."
            : `All records will be saved under ${organizationName}.`
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard
          title="Add Donation"
          subtitle="Every donation is linked to an organization and the logged-in user."
        >
          <DonationForm organizationOptions={organizationOptions} />
        </SectionCard>

        <SectionCard
          title="Record Distribution"
          subtitle="Capture where aid was distributed and which organization released it."
        >
          <DistributionForm organizationOptions={organizationOptions} />
        </SectionCard>
      </div>
    </div>
  );
}
