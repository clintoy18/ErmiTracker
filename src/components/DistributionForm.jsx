import { useState } from "react";
import FormInput from "./FormInput";
import FormSelect from "./FormSelect";
import { addDistribution } from "../services/firestore";
import { toIsoDate } from "../utils/formatters";
import { useAuth } from "../context/AuthContext";

const itemOptions = [
  { value: "", label: "Select item" },
  { value: "Rice", label: "Rice" },
  { value: "Bottled Water", label: "Bottled Water" },
  { value: "Canned Goods", label: "Canned Goods" },
  { value: "Blanket", label: "Blanket" },
  { value: "Clothes", label: "Clothes" },
  { value: "Hygiene Kit", label: "Hygiene Kit" },
];

export default function DistributionForm({ organizationOptions = [] }) {
  const {
    isAdmin,
    organizationId: userOrganizationId,
    organizationName: userOrganizationName,
  } = useAuth();
  const [formData, setFormData] = useState({
    organizationId: userOrganizationId || organizationOptions[0]?.id || "",
    location: "",
    itemName: "",
    quantity: "",
    date: toIsoDate(),
  });
  const [status, setStatus] = useState({ message: "", type: "" });

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus({ message: "", type: "" });

    try {
      await addDistribution({
        location: formData.location.trim(),
        itemName: formData.itemName,
        quantity: Number(formData.quantity || 0),
        date: formData.date,
        organizationId: isAdmin ? formData.organizationId : userOrganizationId,
        status: isAdmin ? "approved" : "pending",
      });

      setFormData({
        organizationId: isAdmin ? formData.organizationId : userOrganizationId,
        location: "",
        itemName: "",
        quantity: "",
        date: toIsoDate(),
      });
      setStatus({ message: "Distribution saved successfully.", type: "success" });
    } catch (error) {
      setStatus({
        message: error.message || "Unable to save distribution.",
        type: "error",
      });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {isAdmin ? (
          <FormSelect
            label="Organization"
            name="organizationId"
            value={formData.organizationId}
            onChange={handleChange}
            required
            options={organizationOptions.map((organization) => ({
              value: organization.id,
              label: organization.organizationName,
            }))}
          />
        ) : (
          <FormInput
            label="Organization"
            name="organizationName"
            value={userOrganizationName}
            onChange={() => {}}
            required
            disabled
          />
        )}
        <FormInput
          label="Distribution Location"
          name="location"
          value={formData.location}
          onChange={handleChange}
          placeholder="Evacuation center / sitio"
          required
        />
        <FormSelect
          label="Item"
          name="itemName"
          value={formData.itemName}
          onChange={handleChange}
          required
          options={itemOptions}
        />
        <FormInput
          label="Quantity"
          name="quantity"
          type="number"
          value={formData.quantity}
          onChange={handleChange}
          min="1"
          placeholder="Enter quantity"
          required
        />
        <FormInput
          label="Date"
          name="date"
          type="date"
          value={formData.date}
          onChange={handleChange}
          required
        />
      </div>

      {status.message ? (
        <p
          className={`rounded-2xl px-4 py-3 text-sm ${
            status.type === "success"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {status.message}
        </p>
      ) : null}

      <button
        type="submit"
        className="w-full rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-brand-900 transition hover:brightness-95 sm:w-auto"
      >
        Save Distribution Record
      </button>
    </form>
  );
}
