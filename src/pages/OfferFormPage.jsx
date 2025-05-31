// src/pages/OfferFormPage.jsx

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import "../assets/styles/pages/_offerFormPage.scss";
import CustomerDetails from "../components/CustomerDetails";
import ProductList from "../components/ProductList";
import ExtrasSection from "../components/ExtrasSection";
import SummarySection from "../components/SummarySection";
import TermsSection from "../components/TermsSection";

// Note: default import for jsPDF
import jsPDF from "jspdf";
// Import autoTable as a standalone function
import autoTable from "jspdf-autotable";

import {
  getDraftById,
  saveDraft,
  submitOfferMetadata,
} from "../services/offerService";
import useOfferForm from "../hooks/useOfferForm";

const OfferFormPage = () => {
  const { offerId } = useParams();
  const navigate = useNavigate();
  const [loadingDraft, setLoadingDraft] = useState(true);

  const {
    formValues,
    setFormValues,
    addItem,
    removeItem,
    updateItemField,
    updateField,
    calculateTotals,
  } = useOfferForm();

  // 1) Load existing draft if offerId is present
  useEffect(() => {
    if (!offerId) {
      setLoadingDraft(false);
      return;
    }

    async function fetchDraft() {
      try {
        const draft = await getDraftById(offerId);
        if (draft) {
          setFormValues({
            customerName: draft.customerName || "",
            contactInfo: draft.contactInfo || "",
            deliveryAddress: draft.deliveryAddress || "",
            expirationDate:
              draft.expirationDate?.toDate().toISOString().substr(0, 10) || "",
            notes: draft.notes || "",
            items: draft.items || [],
            deliveryFee: draft.deliveryFee || 0,
            installationFee: draft.installationFee || 0,
            discount: draft.discount || 0,
          });
        } else {
          console.warn(`No draft found with ID ${offerId}`);
        }
      } catch (err) {
        console.error("Error loading draft:", err);
      } finally {
        setLoadingDraft(false);
      }
    }

    fetchDraft();
  }, [offerId, setFormValues]);

  // 2) Save or update a draft
  const handleSaveDraft = async () => {
    try {
      const { subTotal, vat, total } = calculateTotals(formValues);

      const dataToSave = {
        customerName: formValues.customerName,
        contactInfo: formValues.contactInfo,
        deliveryAddress: formValues.deliveryAddress,
        expirationDate: new Date(formValues.expirationDate),
        notes: formValues.notes,
        items: formValues.items,
        deliveryFee: formValues.deliveryFee,
        installationFee: formValues.installationFee,
        discount: formValues.discount,
        subTotal,
        vat,
        total,
      };

      const savedId = await saveDraft(dataToSave, offerId || null);

      if (!offerId) {
        navigate(`/offer/${savedId}`);
      } else {
        alert("Draft updated successfully!");
      }
    } catch (err) {
      console.error("Error saving draft:", err);
      alert("Error saving draft. Check console.");
    }
  };

  // 3) Submit the offer: build PDF, trigger download, mark submitted
  const handleSubmitOffer = async () => {
    try {
      const { subTotal, vat, total } = calculateTotals(formValues);

      const dataToSave = {
        customerName: formValues.customerName,
        contactInfo: formValues.contactInfo,
        deliveryAddress: formValues.deliveryAddress,
        expirationDate: new Date(formValues.expirationDate),
        notes: formValues.notes,
        items: formValues.items,
        deliveryFee: formValues.deliveryFee,
        installationFee: formValues.installationFee,
        discount: formValues.discount,
        subTotal,
        vat,
        total,
      };

      // Ensure a Firestore doc exists (draft or new)
      let effectiveOfferId = offerId;
      if (!effectiveOfferId) {
        effectiveOfferId = await saveDraft(dataToSave, null);
      }

      // Create a jsPDF document
      const doc = new jsPDF({
        unit: "pt",
        format: "a4",
      });

      // 3A) Header
      doc.setFontSize(18);
      doc.text("Offer Document", 40, 50);
      doc.setFontSize(12);
      doc.text(`Customer: ${formValues.customerName}`, 40, 80);
      doc.text(`Contact: ${formValues.contactInfo}`, 40, 100);
      doc.text(`Address: ${formValues.deliveryAddress}`, 40, 120);
      doc.text(`Expires On: ${formValues.expirationDate}`, 40, 140);

      // 3B) Table of items using autoTable(doc, options)
      const tableColumnHeaders = [
        "Type",
        "Description",
        "Qty",
        "Unit Price",
        "Line Total",
      ];
      const tableRows = formValues.items.map((item) => {
        const lineTotal = item.quantity * item.unitPrice;
        return [
          item.type || "-",
          item.description || "-",
          item.quantity.toString(),
          item.unitPrice.toFixed(2) + " €",
          lineTotal.toFixed(2) + " €",
        ];
      });

      autoTable(doc, {
        head: [tableColumnHeaders],
        body: tableRows,
        startY: 160,
        theme: "grid",
        styles: { fontSize: 10 },
      });

      // 3C) Totals below the table
      const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 160;
      doc.text(`Subtotal: ${subTotal.toFixed(2)} €`, 350, finalY + 30);
      doc.text(`VAT (19%): ${vat.toFixed(2)} €`, 350, finalY + 50);
      doc.text(
        `Delivery Fee: ${formValues.deliveryFee.toFixed(2)} €`,
        350,
        finalY + 70
      );
      doc.text(
        `Installation Fee: ${formValues.installationFee.toFixed(2)} €`,
        350,
        finalY + 90
      );
      doc.text(
        `Discount: −${formValues.discount.toFixed(2)} €`,
        350,
        finalY + 110
      );
      doc.setFontSize(14);
      doc.text(`Grand Total: ${total.toFixed(2)} €`, 350, finalY + 140);

      // 3D) Notes / footer
      doc.setFontSize(10);
      doc.text(`Notes: ${formValues.notes}`, 40, finalY + 180);

      // 3E) Trigger “Save As” in the browser
      doc.save(`offer_${effectiveOfferId}.pdf`);

      // 4) Mark as submitted in Firestore
      await submitOfferMetadata(effectiveOfferId, dataToSave);

      alert("Offer marked as submitted. PDF downloaded to your device.");
      navigate("/admin/offers");
    } catch (err) {
      console.error("Error submitting offer:", err);
      alert("Error submitting offer. Check console.");
    }
  };

  if (loadingDraft) {
    return <p>Loading draft…</p>;
  }

  return (
    <div className="offer-form-page">
      <h1>{offerId ? "Edit Draft Offer" : "Create New Offer"}</h1>

      {/* 1) Customer details */}
      <CustomerDetails
        values={{
          customerName: formValues.customerName,
          contactInfo: formValues.contactInfo,
          deliveryAddress: formValues.deliveryAddress,
        }}
        onChange={updateField}
      />

      {/* 2) Product list */}
      <ProductList
        items={formValues.items}
        addItem={addItem}
        removeItem={removeItem}
        updateItemField={updateItemField}
      />

      {/* 3) Extras (delivery, installation, discount) */}
      <ExtrasSection
        deliveryFee={formValues.deliveryFee}
        installationFee={formValues.installationFee}
        discount={formValues.discount}
        onChange={updateField}
      />

      {/* 4) Summary (auto-calculated) */}
      <SummarySection
        items={formValues.items}
        deliveryFee={formValues.deliveryFee}
        installationFee={formValues.installationFee}
        discount={formValues.discount}
        calculateTotals={calculateTotals}
      />

      {/* 5) Terms & Notes */}
      <TermsSection
        expirationDate={formValues.expirationDate}
        notes={formValues.notes}
        onChange={updateField}
      />

      {/* 6) Buttons: Save Draft & Submit Offer */}
      <div className="button-row">
        <button onClick={handleSaveDraft}>
          {offerId ? "Update Draft" : "Save as Draft"}
        </button>
        <button onClick={handleSubmitOffer}>
          Submit Offer (Download PDF)
        </button>
      </div>
    </div>
  );
};

export default OfferFormPage;
