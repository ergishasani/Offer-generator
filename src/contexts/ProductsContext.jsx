// src/contexts/ProductsContext.jsx
// ─────────────────────────────────────────────────────────────────────────────────
// This context holds the "items" list for the current offer in memory.
// You can extend this to save to Firestore if desired, but for now it lives in React state.
// We expose `items`, `addItem()`, `updateItem()`, and `removeItem()` so that
// OfferFormPage and ProductEditPage can share the same data.

import React, { createContext, useContext, useState } from "react";

const ProductsContext = createContext();

export function useProducts() {
  return useContext(ProductsContext);
}

export function ProductsProvider({ children }) {
  const [items, setItems] = useState([
    {
      id: Date.now(),
      productName: "",
      quantity: 1,
      unit: "Stk",
      unitPrice: 0.0,
      vat: 19,
      discount: 0,

      // ────────────────────────────────
      // NEW CONFIGURATION FIELDS (initially empty)
      // ────────────────────────────────
      frameType: "",
      outerColor: "",
      innerColor: "",
      dimensions: "",
      frameVeneerColor: "",
      sashVeneerColor: "",
      coreSealFrame: "",
      coreSealSash: "",
      thresholdType: "",
      weldingType: "",
      glazing: "",
      glassHold: "",
      sashType: "",
      fitting: "",
      fittingType: "",
      handleTypeInner: "",
      handleColorInner: "",
      handleColorOuter: "",
      UwCoefficient: "",
      weightUnit: "",
      perimeter: "",
      accessories: [],   // array of { code, description, qty }
      fillings: [],      // array of { id, spec, dimensions, price, discountPercent }
    },
  ]);

  // Add a brand-new, blank item:
  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: Date.now(),
        productName: "",
        quantity: 1,
        unit: "Stk",
        unitPrice: 0.0,
        vat: 19,
        discount: 0,
        frameType: "",
        outerColor: "",
        innerColor: "",
        dimensions: "",
        frameVeneerColor: "",
        sashVeneerColor: "",
        coreSealFrame: "",
        coreSealSash: "",
        thresholdType: "",
        weldingType: "",
        glazing: "",
        glassHold: "",
        sashType: "",
        fitting: "",
        fittingType: "",
        handleTypeInner: "",
        handleColorInner: "",
        handleColorOuter: "",
        UwCoefficient: "",
        weightUnit: "",
        perimeter: "",
        accessories: [],
        fillings: [],
      },
    ]);
  };

  // Update an existing item by index (entire object)
  const updateItem = (index, updatedItem) => {
    setItems((prev) =>
      prev.map((itm, idx) => (idx === index ? { ...updatedItem } : itm))
    );
  };

  // Remove an item by id
  const removeItem = (id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const value = {
    items,
    addItem,
    updateItem,
    removeItem,
    setItems, // if you ever want to overwrite the entire array
  };

  return (
    <ProductsContext.Provider value={value}>
      {children}
    </ProductsContext.Provider>
  );
}
