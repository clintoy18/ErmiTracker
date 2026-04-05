import { useState } from "react";
import FormInput from "./FormInput";
import FormSelect from "./FormSelect";
import { addDonation } from "../services/firestore";
import { toIsoDate } from "../utils/formatters";
import { useAuth } from "../context/AuthContext";

const donationTypeOptions = [
  { value: "goods", label: "Goods" },
  { value: "cash", label: "Cash" },
];

const itemOptions = [
  { value: "", label: "Select item" },
  { value: "Rice", label: "Rice" },
  { value: "Bottled Water", label: "Bottled Water" },
  { value: "Canned Goods", label: "Canned Goods" },
  { value: "Blanket", label: "Blanket" },
  { value: "Clothes", label: "Clothes" },
  { value: "Hygiene Kit", label: "Hygiene Kit" },
];

export default function DonationForm({ organizationOptions = [] }) {
  const {
    isAdmin,
    organizationId: userOrganizationId,
    organizationName: userOrganizationName,
  } = useAuth();
  const [formData, setFormData] = useState({
    type: "goods",
    itemName: "",
    quantity: "",
    date: toIsoDate(),
    organizationId: userOrganizationId || organizationOptions[0]?.id || "",
  });
  const [status, setStatus] = useState({ message: "", type: "" });
  const isCash = formData.type === "cash";

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
      ...(name === "type" && value === "cash" ? { itemName: "Cash Donation" } : {}),
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus({ message: "", type: "" });

    try {
      await addDonation({
        type: formData.type,
        itemName: isCash ? "Cash Donation" : formData.itemName,
        quantity: Number(formData.quantity || 0),
        date: formData.date,
        organizationId: isAdmin ? formData.organizationId : userOrganizationId,
        status: isAdmin ? "approved" : "pending",
      });

      setFormData({
        type: "goods",
        itemName: "",
        quantity: "",
        date: toIsoDate(),
        organizationId: isAdmin ? formData.organizationId : userOrganizationId,
      });
      setStatus({ message: "Donation saved successfully.", type: "success" });
    } catch (error) {
      setStatus({
        message: error.message || "Unable to save donation.",
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
        <FormSelect
          label="Donation Type"
          name="type"
          value={formData.type}
          onChange={handleChange}
          required
          options={donationTypeOptions}
        />
        {isCash ? (
          <FormInput
            label="Amount (PHP)"
            name="quantity"
            type="number"
            value={formData.quantity}
            onChange={handleChange}
            min="0"
            step="0.01"
            placeholder="0.00"
            required
          />
        ) : (
          <>
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
          </>
        )}
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
        className="w-full rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 sm:w-auto"
      >
        Save Donation Record
      </button>
    </form>
  );
}
