import { supabase } from "../supabase";

export function normalizeOrganizationName(value) {
  return value?.trim() || "Barangay";
}

function normalizeUser(record) {
  return {
    id: record.id,
    name: record.name || "User",
    email: record.email || "",
    role: record.role || "org",
    organizationName: normalizeOrganizationName(record.organization_name),
    createdAt: record.created_at || null,
  };
}

export function normalizeDonation(record) {
  const type = record.type || (record.quantity ? "goods" : "cash");
  const organizationName = normalizeOrganizationName(
    record.organizationName ||
      record.organization_name ||
      record.organization?.organization_name ||
      record.users?.organization_name,
  );

  return {
    id: record.id,
    type,
    organizationId: record.organizationId || record.organization_id || "",
    organizationName,
    createdBy: record.createdBy || record.organization_id || "",
    quantity: Number(record.quantity || 0),
    amount: type === "cash" ? Number(record.quantity || 0) : 0,
    itemName: record.itemName || record.item_name || "Unspecified item",
    status: record.status || "approved",
    date: record.date || record.created_at || null,
    createdAt: record.created_at || null,
  };
}

export function normalizeDistribution(record) {
  const organizationName = normalizeOrganizationName(
    record.organizationName ||
      record.organization_name ||
      record.organization?.organization_name ||
      record.users?.organization_name,
  );

  return {
    id: record.id,
    organizationId: record.organizationId || record.organization_id || "",
    organizationName,
    createdBy: record.createdBy || record.organization_id || "",
    quantity: Number(record.quantity || 0),
    itemName: record.itemName || record.item_name || "Unspecified item",
    location: record.location || "Unspecified location",
    status: record.status || "approved",
    date: record.date || record.created_at || null,
    createdAt: record.created_at || null,
  };
}

function filterByScope(items, scope = {}) {
  const { isAdmin, organizationName, selectedOrganization } = scope;

  if (isAdmin) {
    if (selectedOrganization && selectedOrganization !== "all") {
      return items.filter(
        (item) => normalizeOrganizationName(item.organizationName) === selectedOrganization,
      );
    }

    return items;
  }

  return items.filter(
    (item) => normalizeOrganizationName(item.organizationName) === organizationName,
  );
}

export async function getUserProfile(userId) {
  const { data, error } = await supabase
    .from("users")
    .select("id, name, email, role, organization_name, created_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? normalizeUser(data) : null;
}

async function fetchUsers(scope = {}) {
  let request = supabase
    .from("users")
    .select("id, name, email, role, organization_name, created_at")
    .order("organization_name", { ascending: true });

  if (!scope.isAdmin && scope.userId) {
    request = request.eq("id", scope.userId);
  }

  const { data, error } = await request;

  if (error) {
    throw error;
  }

  return (data || []).map(normalizeUser);
}

async function fetchDonations(scope = {}) {
  let request = supabase
    .from("donations")
    .select(`
      id,
      organization_id,
      item_name,
      quantity,
      type,
      status,
      created_at,
      organization:users!donations_organization_id_fkey (
        id,
        organization_name
      )
    `)
    .order("created_at", { ascending: false });

  if (!scope.isAdmin && scope.userId) {
    request = request.eq("organization_id", scope.userId);
  }

  if (scope.publicOnly) {
    request = request.eq("status", "approved");
  }

  const { data, error } = await request;

  if (error) {
    throw error;
  }

  return filterByScope((data || []).map(normalizeDonation), scope);
}

async function fetchDistributions(scope = {}) {
  let request = supabase
    .from("distributions")
    .select(`
      id,
      organization_id,
      item_name,
      quantity,
      location,
      status,
      created_at,
      organization:users!distributions_organization_id_fkey (
        id,
        organization_name
      )
    `)
    .order("created_at", { ascending: false });

  if (!scope.isAdmin && scope.userId) {
    request = request.eq("organization_id", scope.userId);
  }

  if (scope.publicOnly) {
    request = request.eq("status", "approved");
  }

  const { data, error } = await request;

  if (error) {
    throw error;
  }

  return filterByScope((data || []).map(normalizeDistribution), scope);
}

function createRealtimeSubscription(tables, fetcher, scope, callback, onError) {
  const channel = supabase.channel(
    `realtime:${tables.join("-")}:${JSON.stringify(scope || {})}`,
  );

  const refresh = async () => {
    try {
      const data = await fetcher(scope);
      callback(data);
    } catch (error) {
      onError?.(error);
    }
  };

  refresh();

  tables.forEach((table) => {
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table },
      () => {
        refresh();
      },
    );
  });

  channel.subscribe((status) => {
    if (status === "CHANNEL_ERROR") {
      onError?.(new Error(`Realtime subscription failed for ${tables.join(", ")}.`));
    }
  });

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeToUsers(scope, callback, onError) {
  return createRealtimeSubscription(["users"], fetchUsers, scope, callback, onError);
}

export function subscribeToDonations(scope, callback, onError) {
  return createRealtimeSubscription(
    ["donations", "users"],
    fetchDonations,
    scope,
    callback,
    onError,
  );
}

export function subscribeToDistributions(scope, callback, onError) {
  return createRealtimeSubscription(
    ["distributions", "users"],
    fetchDistributions,
    scope,
    callback,
    onError,
  );
}

export async function registerOrganizationUser({ name, email, password, organizationName }) {
  const normalizedOrganizationName = normalizeOrganizationName(organizationName);
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        role: "org",
        organization_name: normalizedOrganizationName,
      },
    },
  });

  if (error) {
    throw error;
  }

  if (!data.user) {
    throw new Error("Supabase registration did not return a user.");
  }

  return data.user;
}

export async function addDonation(payload) {
  const { error } = await supabase.from("donations").insert({
    organization_id: payload.organizationId,
    item_name: payload.itemName,
    quantity: Number(payload.quantity || 0),
    type: payload.type,
    status: payload.status || "pending",
    created_at: payload.date ? new Date(payload.date).toISOString() : new Date().toISOString(),
  });

  if (error) {
    throw error;
  }
}

export async function updateDonationStatus(donationId, status) {
  const { error } = await supabase
    .from("donations")
    .update({ status })
    .eq("id", donationId);

  if (error) {
    throw error;
  }
}

export async function addDistribution(payload) {
  const { error } = await supabase.from("distributions").insert({
    organization_id: payload.organizationId,
    item_name: payload.itemName,
    quantity: Number(payload.quantity || 0),
    location: payload.location,
    status: payload.status || "pending",
    created_at: payload.date ? new Date(payload.date).toISOString() : new Date().toISOString(),
  });

  if (error) {
    throw error;
  }
}

export async function updateDistributionStatus(distributionId, status) {
  const { error } = await supabase
    .from("distributions")
    .update({ status })
    .eq("id", distributionId);

  if (error) {
    throw error;
  }
}
