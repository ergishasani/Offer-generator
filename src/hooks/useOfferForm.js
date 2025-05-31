// src/hooks/useOfferForm.js
import { useState } from "react";

export default function useOfferForm(initialValues = {}) {
  // default shape if no initialValues provided
  const defaultState = {
    customerName: "",
    contactInfo: "",
    deliveryAddress: "",
    expirationDate: "", // "YYYY-MM-DD" string
    notes: "",
    items: [
      // { type:"", description:"", width:0, height:0, color:"", quantity:1, unitPrice:0, lineTotal:0 }
    ],
    deliveryFee: 0,
    installationFee: 0,
    discount: 0,
  };

  // If initialValues passed (when editing a draft), override defaults
  const [formValues, setFormValues] = useState({
    ...defaultState,
    ...initialValues,
  });

  // Handler to update a top‐level field, e.g. customerName, contactInfo, etc.
  const updateField = (fieldName, newValue) => {
    setFormValues(prev => ({ ...prev, [fieldName]: newValue }));
  };

  // Handlers for items array
  const addItem = () => {
    setFormValues(prev => ({
      ...prev,
      items: [
        ...prev.items,
        { type: "", description: "", width: 0, height: 0, color: "", quantity: 1, unitPrice: 0, lineTotal: 0 },
      ],
    }));
  };

  const removeItem = index => {
    setFormValues(prev => {
      const newItems = [...prev.items];
      newItems.splice(index, 1);
      return { ...prev, items: newItems };
    });
  };

  const updateItemField = (index, fieldName, newValue) => {
    setFormValues(prev => {
      const newItems = [...prev.items];
      newItems[index] = {
        ...newItems[index],
        [fieldName]: newValue,
      };
      return { ...prev, items: newItems };
    });
  };

  // Calculate line totals, subtotal, vat, total
  const calculateTotals = values => {
    const items = values.items.map(item => ({
      ...item,
      lineTotal: item.quantity * item.unitPrice,
    }));
    const subTotal = items.reduce((sum, it) => sum + it.lineTotal, 0);
    const vat = subTotal * 0.19;
    const total = subTotal + vat + Number(values.deliveryFee) + Number(values.installationFee) - Number(values.discount);
    return { items, subTotal, vat, total };
  };

  return {
    formValues,
    setFormValues,      // so parent can overwrite if editing
    updateField,
    items: formValues.items,
    addItem,
    removeItem,
    updateItemField,
    calculateTotals,
  };
}
