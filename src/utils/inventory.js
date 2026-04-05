import { normalizeOrganizationName } from "../services/firestore";

export function computeInventory(donations, distributions) {
  const inventoryMap = new Map();
  let totalCashDonations = 0;
  let totalGoodsDonated = 0;
  let totalGoodsDistributed = 0;

  donations.forEach((donation) => {
    if (donation.type === "cash") {
      totalCashDonations += Number(donation.amount || 0);
      return;
    }

    const itemName = donation.itemName || "Unspecified item";
    const currentValue = inventoryMap.get(itemName) || 0;
    const quantity = Number(donation.quantity || 0);

    inventoryMap.set(itemName, currentValue + quantity);
    totalGoodsDonated += quantity;
  });

  distributions.forEach((distribution) => {
    const itemName = distribution.itemName || "Unspecified item";
    const currentValue = inventoryMap.get(itemName) || 0;
    const quantity = Number(distribution.quantity || 0);

    inventoryMap.set(itemName, currentValue - quantity);
    totalGoodsDistributed += quantity;
  });

  const remainingInventory = Array.from(inventoryMap.entries())
    .map(([itemName, quantity]) => ({ itemName, quantity }))
    .filter((item) => item.quantity !== 0)
    .sort((a, b) => a.itemName.localeCompare(b.itemName));

  return {
    totalCashDonations,
    totalGoodsDonated,
    totalGoodsDistributed,
    remainingInventory,
  };
}

export function buildOrganizationStats(donations, distributions) {
  const organizations = new Map();

  function ensureOrg(name) {
    const organizationName = normalizeOrganizationName(name);

    if (!organizations.has(organizationName)) {
      organizations.set(organizationName, {
        organizationName,
        totalCashDonations: 0,
        totalGoodsDonated: 0,
        totalDistributed: 0,
        remainingBalance: 0,
      });
    }

    return organizations.get(organizationName);
  }

  donations.forEach((donation) => {
    const organization = ensureOrg(donation.organizationName);

    if (donation.type === "cash") {
      organization.totalCashDonations += Number(
        donation.amount ?? donation.quantity ?? 0,
      );
      return;
    }

    organization.totalGoodsDonated += Number(donation.quantity || 0);
  });

  distributions.forEach((distribution) => {
    const organization = ensureOrg(distribution.organizationName);
    organization.totalDistributed += Number(distribution.quantity || 0);
  });

  return Array.from(organizations.values())
    .map((organization) => ({
      id: organization.organizationName,
      ...organization,
      remainingBalance: organization.totalGoodsDonated - organization.totalDistributed,
    }))
    .sort((a, b) => a.organizationName.localeCompare(b.organizationName));
}

export function getOrganizationOptions(users = [], donations = [], distributions = []) {
  const names = new Set(["Barangay"]);

  users.forEach((user) => names.add(normalizeOrganizationName(user.organizationName)));
  donations.forEach((donation) => names.add(normalizeOrganizationName(donation.organizationName)));
  distributions.forEach((distribution) =>
    names.add(normalizeOrganizationName(distribution.organizationName)),
  );

  return Array.from(names).sort((a, b) => a.localeCompare(b));
}

export function getOrganizationDirectory(users = []) {
  const organizations = new Map();

  users
    .filter((user) => user.role === "org")
    .forEach((user) => {
      const organizationName = normalizeOrganizationName(user.organizationName);

      if (!organizations.has(organizationName)) {
        organizations.set(organizationName, {
          id: user.id,
          organizationName,
        });
      }
    });

  if (!organizations.has("Barangay")) {
    organizations.set("Barangay", {
      id: "",
      organizationName: "Barangay",
    });
  }

  return Array.from(organizations.values()).sort((a, b) =>
    a.organizationName.localeCompare(b.organizationName),
  );
}
