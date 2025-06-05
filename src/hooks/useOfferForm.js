// src/hooks/useOfferForm.js
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";

export default function useOfferForm(initialValues = {}) {
  // ────────────────────────────────────────────────────────────────────────────
  // Default item state with two new fields: interiorImage & exteriorImage
  // ────────────────────────────────────────────────────────────────────────────
  const defaultItem = {
    id: uuidv4(),
    title: "",
    quantity: 1,
    system: "",
    color: "",
    width: 0,
    height: 0,
    frameOuterColor: "",
    frameInnerColor: "",
    frameDimensions: "",
    frameVeneerColor: "",
    sashVeneerColor: "",
    coreSealFrameColor: "",
    coreSealSashColor: "",
    thresholdType: "",
    weldingMethod: "",
    glazingRequired: "",
    glazingBead1: "",
    sashDescription: "",
    glazingBead2: "",
    hardwareType: "",
    fittingType: "",
    handleType: "",
    handleColorInside: "",
    handleColorOutside: "",
    thermalCoefficient: "",
    unitWeight: 0,
    perimeterMeters: 0,
    // ─── Two new image fields: store base64 data URLs ───
    interiorImage: null,
    exteriorImage: null,
    accessories: [],
    fillings: [],
    basePrice: 0,
    discountPercent: 0,
  };

  // ────────────────────────────────────────────────────────────────────────────
  // Default state for the entire form
  // ────────────────────────────────────────────────────────────────────────────
  const defaultState = {
    companyName: "",
    companyVAT: "",
    companyAddress: "",
    companyEmail: "",
    companyContactName: "",
    companyPhone: "",
    bankName: "",
    bankIBAN: "",

    salespersonName: "",
    salespersonEmail: "",
    salespersonPhone: "",

    customerName: "",
    customerContact: "",
    customerAddress: "",

    // Items array now uses our new defaultItem
    items: [ { ...defaultItem } ],

    deliveryFee: 0,
    installationFee: 0,

    expirationDate: "",
    notes: "",
  };

  const [formValues, setFormValues] = useState({
    ...defaultState,
    ...initialValues,
  });

  // ────────────────────────────────────────────────────────────────────────────
  // updateField: same as before
  // ────────────────────────────────────────────────────────────────────────────
  const updateField = (fieldName, newValue) => {
    setFormValues((prev) => ({ ...prev, [fieldName]: newValue }));
  };

  // ────────────────────────────────────────────────────────────────────────────
  // addItem / removeItem / updateItemField etc. (same as before, but with our new defaultItem)
  // ────────────────────────────────────────────────────────────────────────────
  const addItem = () => {
    setFormValues((prev) => ({
      ...prev,
      items: [...prev.items, { ...defaultItem, id: uuidv4() }],
    }));
  };

  const removeItem = (index) => {
    setFormValues((prev) => {
      const newItems = [...prev.items];
      newItems.splice(index, 1);
      return { ...prev, items: newItems };
    });
  };

  const updateItemField = (index, fieldName, newValue) => {
    setFormValues((prev) => {
      const newItems = [...prev.items];
      newItems[index] = {
        ...newItems[index],
        [fieldName]: newValue,
      };
      return { ...prev, items: newItems };
    });
  };

  // ────────────────────────────────────────────────────────────────────────────
  // updateImageField: sets either interiorImage or exteriorImage to a base64 string
  // ────────────────────────────────────────────────────────────────────────────
  const updateImageField = (itemIndex, imageFieldName, base64DataUrl) => {
    setFormValues((prev) => {
      const newItems = [...prev.items];
      const target = { ...newItems[itemIndex] };
      target[imageFieldName] = base64DataUrl; // either "interiorImage" or "exteriorImage"
      newItems[itemIndex] = target;
      return { ...prev, items: newItems };
    });
  };

  // ────────────────────────────────────────────────────────────────────────────
  // updateAccessory / removeAccessory / updateFilling / removeFilling (unchanged)
  // ────────────────────────────────────────────────────────────────────────────
  const updateAccessory = (itemIndex, accIndex, newAccData) => {
    setFormValues((prev) => {
      const newItems = [...prev.items];
      const targetItem = { ...newItems[itemIndex] };
      const accs = [...(targetItem.accessories || [])];
      if (accIndex === null) {
        accs.push({ id: uuidv4(), description: "", quantity: 1, ...newAccData });
      } else {
        accs[accIndex] = { ...accs[accIndex], ...newAccData };
      }
      targetItem.accessories = accs;
      newItems[itemIndex] = targetItem;
      return { ...prev, items: newItems };
    });
  };

  const removeAccessory = (itemIndex, accIndex) => {
    setFormValues((prev) => {
      const newItems = [...prev.items];
      const targetItem = { ...newItems[itemIndex] };
      const accs = [...(targetItem.accessories || [])];
      accs.splice(accIndex, 1);
      targetItem.accessories = accs;
      newItems[itemIndex] = targetItem;
      return { ...prev, items: newItems };
    });
  };

  const updateFilling = (itemIndex, fillIndex, newFillData) => {
    setFormValues((prev) => {
      const newItems = [...prev.items];
      const targetItem = { ...newItems[itemIndex] };
      const fills = [...(targetItem.fillings || [])];
      if (fillIndex === null) {
        fills.push({
          id: uuidv4(),
          code: "",
          glazing: "",
          spacerType: "",
          gPercent: 0,
          tvPercent: 0,
          fillWidth: 0,
          fillHeight: 0,
          ...newFillData,
        });
      } else {
        fills[fillIndex] = { ...fills[fillIndex], ...newFillData };
      }
      targetItem.fillings = fills;
      newItems[itemIndex] = targetItem;
      return { ...prev, items: newItems };
    });
  };

  const removeFilling = (itemIndex, fillIndex) => {
    setFormValues((prev) => {
      const newItems = [...prev.items];
      const targetItem = { ...newItems[itemIndex] };
      const fills = [...(targetItem.fillings || [])];
      fills.splice(fillIndex, 1);
      targetItem.fillings = fills;
      newItems[itemIndex] = targetItem;
      return { ...prev, items: newItems };
    });
  };

  // ────────────────────────────────────────────────────────────────────────────
  // calculateTotals (unchanged from before)
  // ────────────────────────────────────────────────────────────────────────────
  const calculateTotals = (values) => {
    const computedItems = values.items.map((item) => {
      const widthMeters = (item.width || 0) / 1000;
      const heightMeters = (item.height || 0) / 1000;
      const areaM2 = parseFloat((widthMeters * heightMeters).toFixed(3));
      const perimeterMeters = parseFloat(
        (2 * (widthMeters + heightMeters)).toFixed(3)
      );

      const rawLineTotal = (item.basePrice || 0) * (item.quantity || 1);
      const discountAmount = parseFloat(
        ((rawLineTotal * (item.discountPercent || 0)) / 100).toFixed(2)
      );
      const totalItemPrice = parseFloat((rawLineTotal - discountAmount).toFixed(2));
      return {
        ...item,
        areaM2,
        perimeterMeters,
        lineTotal: rawLineTotal,
        discountAmount,
        totalItemPrice,
      };
    });

    const subTotalItems = computedItems.reduce(
      (sum, it) => sum + it.totalItemPrice,
      0
    );

    const deliveryFee = parseFloat(values.deliveryFee || 0);
    const installationFee = parseFloat(values.installationFee || 0);

    const subTotalAll = subTotalItems + deliveryFee + installationFee;
    const vat = parseFloat((subTotalAll * 0.19).toFixed(2));
    const grandTotal = parseFloat((subTotalAll + vat).toFixed(2));

    return {
      items: computedItems,
      subTotalItems: parseFloat(subTotalItems.toFixed(2)),
      subTotalAll,
      vat,
      grandTotal,
    };
  };

  return {
    formValues,
    setFormValues,
    updateField,
    addItem,
    removeItem,
    updateItemField,
    updateImageField,   // NEW
    updateAccessory,
    removeAccessory,
    updateFilling,
    removeFilling,
    calculateTotals,
  };
}
