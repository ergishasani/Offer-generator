// src/pages/OfferFormPage.jsx
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import DatePicker from "react-datepicker";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
} from "firebase/firestore";

import "react-datepicker/dist/react-datepicker.css";
import "../assets/styles/pages/_offerFormPage.scss";

// ——————————————————————————————————————————————————————————————————————————
// CONSTANTS (Units, VAT Options)
// ——————————————————————————————————————————————————————————————————————————
const UNIT_OPTIONS = [
  { label: "Stk", value: "Stk" },
  { label: "m²", value: "m2" },
  { label: "m", value: "m" },
  { label: "lfdm", value: "lfdm" },
];

const VAT_OPTIONS = [
  { label: "19%", value: 19 },
  { label: "7%", value: 7 },
  { label: "0%", value: 0 },
];

// ——————————————————————————————————————————————————————————————————————————
// COMPONENT: OfferFormPage
// ——————————————————————————————————————————————————————————————————————————
export default function OfferFormPage() {
  const { offerId } = useParams();
  const auth = getAuth();
  const db = getFirestore();

  // ──────────────────────────────────────────────────────────────────────────────
  // COMPANY PROFILE STATE (fetched from Firestore)
  // ──────────────────────────────────────────────────────────────────────────────
  const [companyProfile, setCompanyProfile] = useState({
    name: "",
    logoUrl: "",
    street: "",
    zipCity: "",
    country: "",
    phone: "",
    email: "",
    website: "",
    vatNumber: "",
  });
  const [profileLoading, setProfileLoading] = useState(true);

  // ──────────────────────────────────────────────────────────────────────────────
  // CONTACT / OFFER STATE (same as before)
  // ──────────────────────────────────────────────────────────────────────────────
  const [contactName, setContactName] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [countryAddr, setCountryAddr] = useState("Deutschland");

  const [regarding, setRegarding] = useState("");
  const [offerNumber, setOfferNumber] = useState("");
  const [offerDate, setOfferDate] = useState(new Date());
  const [expirationDate, setExpirationDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  );
  const [referenceOrder, setReferenceOrder] = useState("");

  const [headerText, setHeaderText] = useState(
    "Sehr geehrte Damen und Herren,\n\nvielen Dank für Ihre Anfrage. Gerne unterbreiten wir Ihnen das gewünschte freibleibende Angebot:"
  );

  // ──────────────────────────────────────────────────────────────────────────────
  // PRODUCTS SECTION STATE
  // ──────────────────────────────────────────────────────────────────────────────
  const [useNetPrices, setUseNetPrices] = useState(true);
  const [items, setItems] = useState([
    {
      id: Date.now(),
      productName: "",
      quantity: 1,
      unit: "Stk",
      unitPrice: 0.0,
      vat: 19,
      discount: 0,
    },
  ]);
  const [totalDiscount, setTotalDiscount] = useState(0);

  // Helpers for line totals & subtotals
  const computeLineTotalNet = (item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unitPrice) || 0;
    const disc = parseFloat(item.discount) || 0;
    const discountedPrice = price * (1 - disc / 100);
    return qty * discountedPrice;
  };
  const computeLineTotalGross = (item) => {
    const net = computeLineTotalNet(item);
    const vatRate = parseFloat(item.vat) || 0;
    return net * (1 + vatRate / 100);
  };
  const computeSubTotal = () =>
    items.reduce((sum, item) => {
      return (
        sum +
        (useNetPrices
          ? computeLineTotalNet(item)
          : computeLineTotalGross(item))
      );
    }, 0);
  const computeSubTotalAfterDiscount = () => {
    const raw = computeSubTotal();
    return raw * (1 - (parseFloat(totalDiscount) || 0) / 100);
  };
  const computeTotalVAT = () => {
    if (!useNetPrices) return 0;
    return items.reduce((sum, item) => {
      const netLine = computeLineTotalNet(item);
      const netAfterGlobal = netLine * (1 - totalDiscount / 100);
      const vatRate = parseFloat(item.vat) || 0;
      return sum + netAfterGlobal * (vatRate / 100);
    }, 0);
  };

  const handleAddItem = () => {
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
      },
    ]);
  };
  const handleRemoveItem = (id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };
  const handleItemChange = (id, field, value) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [field]: value } : i))
    );
  };
  const toggleNetGross = () => {
    setUseNetPrices((prev) => !prev);
  };

  // ──────────────────────────────────────────────────────────────────────────────
  // FOOTER TEXT
  // ──────────────────────────────────────────────────────────────────────────────
  const [footerText, setFooterText] = useState(
    "Für Rückfragen stehen wir Ihnen jederzeit gerne zur Verfügung.\nWir bedanken uns sehr für Ihr Vertrauen.\n\nMit freundlichen Grüßen\n[%KONTAKTPERSON%]"
  );

  // ──────────────────────────────────────────────────────────────────────────────
  // MORE OPTIONS STATE
  // ──────────────────────────────────────────────────────────────────────────────
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [currency, setCurrency] = useState("EUR");
  const [internalContact, setInternalContact] = useState("");
  const [deliveryConditions, setDeliveryConditions] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [vatRegulation, setVatRegulation] = useState("In Germany");
  const [salesSubjectToVAT, setSalesSubjectToVAT] = useState(true);
  const [taxFree, setTaxFree] = useState(false);
  const [reverseCharge, setReverseCharge] = useState(false);

  // ──────────────────────────────────────────────────────────────────────────────
  // 1) Fetch Company Profile Once User is Authenticated
  // ──────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const profileRef = doc(
            db,
            "users",
            currentUser.uid,
            "companyProfile",
            "profile"
          );
          const profileSnap = await getDoc(profileRef);
          if (profileSnap.exists()) {
            setCompanyProfile(profileSnap.data());
          }
        } catch (err) {
          console.error("Error loading company profile:", err);
        }
      }
      setProfileLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // ──────────────────────────────────────────────────────────────────────────────
  // 2) Generate PDF (uses companyProfile from state)
  // ──────────────────────────────────────────────────────────────────────────────
  const generatePDF = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 40;
    let cursorY = 40;

    // --- COMPANY HEADER (logo or name) ---
    if (companyProfile.logoUrl) {
      // If you want to fetch the image into jsPDF, you must load it as data URL first.
      // For simplicity, we’ll just write the company name text here, but you could do:
      //   const imgData = await loadImageAsDataURL(companyProfile.logoUrl);
      //   doc.addImage(imgData, "PNG", margin, cursorY, 100, 40);
      doc.setFontSize(18).setTextColor("#000");
      doc.text(companyProfile.name, margin, cursorY + 5);
      doc.setFontSize(10).setTextColor("#555");
      doc.text(
        `${companyProfile.street}, ${companyProfile.zipCity}, ${companyProfile.country}`,
        margin,
        cursorY + 20
      );
      doc.text(
        `Phone: ${companyProfile.phone}  Email: ${companyProfile.email}`,
        margin,
        cursorY + 35
      );
      doc.text(`Web: ${companyProfile.website}`, margin, cursorY + 50);
      if (companyProfile.vatNumber) {
        doc.text(`VAT: ${companyProfile.vatNumber}`, margin, cursorY + 65);
      }
      cursorY += 80;
    } else {
      // Fallback: just show name & address
      doc.setFontSize(18).setTextColor("#000");
      doc.text(companyProfile.name || "Your Company Name", margin, cursorY);
      doc.setFontSize(10).setTextColor("#555");
      doc.text(
        `${companyProfile.street}, ${companyProfile.zipCity}, ${companyProfile.country}`,
        margin,
        cursorY + 20
      );
      if (companyProfile.phone) {
        doc.text(`Phone: ${companyProfile.phone}`, margin, cursorY + 35);
      }
      if (companyProfile.email) {
        doc.text(`Email: ${companyProfile.email}`, margin, cursorY + 50);
      }
      cursorY += 60;
    }

    // --- OFFER TITLE & DATES ---
    doc.setFontSize(16).setTextColor("#000");
    doc.text("Angebot", margin, cursorY);
    doc.setFontSize(12);
    doc.text(`Offer No.: ${offerNumber}`, pageWidth - margin - 200, cursorY);
    doc.text(
      `Date: ${offerDate.toLocaleDateString("de-DE")}`,
      pageWidth - margin - 200,
      cursorY + 15
    );
    doc.text(
      `Expires: ${expirationDate.toLocaleDateString("de-DE")}`,
      pageWidth - margin - 200,
      cursorY + 30
    );
    cursorY += 45;

    // --- CONTACT & ADDRESS BOX ---
    doc.setDrawColor("#ccc")
      .setFillColor("#f9f9f9")
      .roundedRect(margin, cursorY, pageWidth - margin * 2, 90, 4, 4, "FD");
    doc.setFontSize(10).setTextColor("#333");
    doc.text(`Contact: ${contactName}`, margin + 6, cursorY + 20);
    doc.text(`Address:`, margin + 6, cursorY + 40);
    doc.text(`${addressLine1}`, margin + 60, cursorY + 40);
    doc.text(`${addressLine2}`, margin + 60, cursorY + 55);
    doc.text(`${countryAddr}`, margin + 60, cursorY + 70);
    cursorY += 110;

    // --- REGARDING & REFERENCE ---
    doc.setFontSize(11);
    doc.text(`Regarding: ${regarding}`, margin, cursorY);
    doc.text(
      `Reference / Order No.: ${referenceOrder}`,
      margin,
      cursorY + 15
    );
    cursorY += 30;

    // --- HEADER TEXT ---
    doc.setFontSize(10).setTextColor("#333");
    const headerLines = doc.splitTextToSize(
      headerText,
      pageWidth - margin * 2
    );
    doc.text(headerLines, margin, cursorY);
    cursorY += headerLines.length * 12 + 10;

    // --- PRODUCTS TABLE ---
    const rawSubtotal = computeSubTotal();
    const subAfterDisc = computeSubTotalAfterDiscount();
    const totalVAT = computeTotalVAT();
    const grandTotal = useNetPrices
      ? subAfterDisc + totalVAT
      : subAfterDisc;

    const tableColumnHeaders = [
      "#",
      "Product or service",
      "Qty",
      "Unit",
      `Price (${useNetPrices ? "net" : "brutto"})`,
      "USt.",
      "Disc. (%)",
      "Line Total",
    ];
    const tableRows = items.map((item, idx) => {
      const rawLineNet = computeLineTotalNet(item);
      const rawLineGross = computeLineTotalGross(item);
      const lineAfterGlobalDisc = useNetPrices
        ? rawLineNet * (1 - totalDiscount / 100)
        : rawLineGross * (1 - totalDiscount / 100);

      return [
        idx + 1,
        item.productName,
        item.quantity.toString(),
        item.unit,
        item.unitPrice.toFixed(2) + " €",
        item.vat + "%",
        item.discount + "%",
        lineAfterGlobalDisc.toFixed(2) + " €",
      ];
    });

    autoTable(doc, {
      head: [tableColumnHeaders],
      body: tableRows,
      startY: cursorY,
      margin: { left: margin, right: margin },
      headStyles: { fillColor: "#f5f5f5", textColor: "#333", fontSize: 10 },
      bodyStyles: { fontSize: 9, textColor: "#333" },
      theme: "striped",
      styles: { cellPadding: 4 },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 150 },
        2: { cellWidth: 40, halign: "right" },
        3: { cellWidth: 40, halign: "right" },
        4: { cellWidth: 60, halign: "right" },
        5: { cellWidth: 40, halign: "right" },
        6: { cellWidth: 50, halign: "right" },
        7: { cellWidth: 60, halign: "right" },
      },
      willDrawCell: (data) => {
        if (data.row.index === tableRows.length - 1) {
          const pCount = doc.internal.getNumberOfPages();
          for (let i = 1; i <= pCount; i++) {
            doc.setPage(i).setFontSize(9);
            doc.text(
              `Page ${i} / ${pCount}`,
              pageWidth / 2,
              doc.internal.pageSize.getHeight() - 20,
              { align: "center" }
            );
          }
        }
      },
      didDrawPage: (data) => {
        cursorY = data.cursor.y + 10;
      },
    });

    // --- TOTALS ---
    doc.setFontSize(10).setTextColor("#000");
    const totalsX = pageWidth - margin - 200;
    let totalsY = cursorY + 20;

    doc.text(
      `Subtotal (before discount): ${rawSubtotal.toFixed(2)} €`,
      totalsX,
      totalsY
    );
    totalsY += 15;

    if (parseFloat(totalDiscount) > 0) {
      doc.text(
        `Global Discount (${totalDiscount}%): -${(
          rawSubtotal * (totalDiscount / 100)
        ).toFixed(2)} €`,
        totalsX,
        totalsY
      );
      totalsY += 15;
    }

    doc.text(
      `Subtotal (after discount): ${subAfterDisc.toFixed(2)} €`,
      totalsX,
      totalsY
    );
    totalsY += 15;

    if (useNetPrices) {
      doc.text(`VAT Total: ${totalVAT.toFixed(2)} €`, totalsX, totalsY);
      totalsY += 15;
    }

    doc.setFontSize(12).setFont(undefined, "bold");
    doc.text(`Total: ${grandTotal.toFixed(2)} €`, totalsX, totalsY);
    doc.setFont(undefined, "normal");

    // --- FOOTER TEXT ---
    let footerY = totalsY + 40;
    doc.setFontSize(10).setTextColor("#333");
    const footerLines = doc.splitTextToSize(
      footerText,
      pageWidth - margin * 2
    );
    doc.text(footerLines, margin, footerY);
    footerY += footerLines.length * 12 + 20;

    // --- MORE OPTIONS SUMMARY ---
    doc.setFontSize(9).setTextColor("#555");
    doc.text("----- More Options -----", margin, footerY);
    footerY += 12;
    doc.text(`Currency: ${currency}`, margin, footerY);
    footerY += 12;
    doc.text(`Internal Contact: ${internalContact}`, margin, footerY);
    footerY += 12;
    doc.text(`Delivery Conditions: ${deliveryConditions}`, margin, footerY);
    footerY += 12;
    doc.text(`Payment Terms: ${paymentTerms}`, margin, footerY);
    footerY += 12;
    doc.text(`VAT Regulation: ${vatRegulation}`, margin, footerY);
    footerY += 12;
    let vatLine = "";
    if (salesSubjectToVAT) vatLine = "Sales subject to VAT";
    if (taxFree) vatLine = "Tax-free sales (§4 UStG)";
    if (reverseCharge) vatLine = "Reverse charge (§13b UStG)";
    doc.text(`VAT Option: ${vatLine}`, margin, footerY);

    // --- DOWNLOAD PDF ---
    doc.save(`Angebot-${offerNumber || "new"}.pdf`);
  };

  // ──────────────────────────────────────────────────────────────────────────────
  // FORM SUBMIT HANDLER
  // ──────────────────────────────────────────────────────────────────────────────
  const handleSubmitForm = (e) => {
    e.preventDefault();
    // Basic validation
    if (!contactName.trim() || !offerNumber.trim()) {
      alert("Bitte Kontaktname und Angebotsnummer angeben.");
      return;
    }
    const validItems = items.filter(
      (it) =>
        it.productName.trim() &&
        parseFloat(it.quantity) > 0 &&
        parseFloat(it.unitPrice) >= 0
    );
    if (validItems.length === 0) {
      alert(
        "Bitte mindestens ein Produkt mit Menge > 0 und gültigem Preis eingeben."
      );
      return;
    }
    // (You could save the offer to Firestore here if desired)
    generatePDF();
  };

  // ──────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────────────────────────
  if (profileLoading) {
    return (
      <div className="offer-form-page">
        <p>Loading company profile…</p>
      </div>
    );
  }

  return (
    <div className="offer-form-page">
      {/* You can show company name/logo at top of form, if you like: */}
      {!profileLoading && (
        <div className="company-header">
          {companyProfile.logoUrl ? (
            <img
              src={companyProfile.logoUrl}
              alt="Company logo"
              className="company-logo"
            />
          ) : null}
          <div className="company-info">
            <h3 className="company-name">
              {companyProfile.name || "Your Company Name"}
            </h3>
            <p className="company-address">
              {companyProfile.street}, {companyProfile.zipCity},{" "}
              {companyProfile.country}
            </p>
            <p className="company-contact">
              {companyProfile.phone && <>Tel: {companyProfile.phone} · </>}
              {companyProfile.email && <>E-Mail: {companyProfile.email}</>}
            </p>
            <p className="company-website">
              {companyProfile.website && <>Web: {companyProfile.website}</>}
            </p>
            {companyProfile.vatNumber && (
              <p className="company-vat">VAT: {companyProfile.vatNumber}</p>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmitForm}>
        {/* ────────────────────────────────────────────────────────────── */}
        {/* SECTION 1: CONTACT & OFFER INFORMATION */}
        {/* ────────────────────────────────────────────────────────────── */}
        <section className="section contact-offer-info">
          <div className="section-header">
            CONTACT AND OFFER INFORMATION
          </div>
          <div className="two-columns">
            {/* Left Column */}
            <div className="column left-col">
              <label className="label">Contact</label>
              <input
                type="text"
                className="input full-width"
                placeholder="Search / create contact"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
              />

              <label className="label">Address</label>
              <textarea
                className="textarea full-width"
                rows={2}
                placeholder="Straße und Hausnummer"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
              />
              <textarea
                className="textarea full-width"
                rows={1}
                placeholder="PLZ Ort"
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
              />
              <input
                type="text"
                className="input full-width"
                placeholder="Land"
                value={countryAddr}
                onChange={(e) => setCountryAddr(e.target.value)}
              />
            </div>

            {/* Right Column */}
            <div className="column right-col">
              <label className="label">Regarding</label>
              <input
                type="text"
                className="input full-width"
                placeholder="Angebot AN-1109"
                value={regarding}
                onChange={(e) => setRegarding(e.target.value)}
              />

              <div className="horizontal-group">
                <div className="field-group">
                  <label className="label">Offer number</label>
                  <div className="offer-number-wrapper">
                    <input
                      type="text"
                      className="input small-input"
                      placeholder="AN-1109"
                      value={offerNumber}
                      onChange={(e) => setOfferNumber(e.target.value)}
                    />
                    <button
                      type="button"
                      className="icon-button"
                      title="Settings"
                    >
                      ⚙️
                    </button>
                  </div>
                </div>

                <div className="field-group">
                  <label className="label">Offer date</label>
                  <DatePicker
                    selected={offerDate}
                    onChange={(date) => setOfferDate(date)}
                    className="input date-input"
                    dateFormat="dd.MM.yyyy"
                  />
                </div>
              </div>

              <div className="horizontal-group">
                <div className="field-group">
                  <label className="label">Expiration date</label>
                  <DatePicker
                    selected={expirationDate}
                    onChange={(date) => setExpirationDate(date)}
                    className="input date-input"
                    dateFormat="dd.MM.yyyy"
                  />
                </div>
                <div className="field-group">
                  <label className="label">
                    Reference / Order number
                  </label>
                  <input
                    type="text"
                    className="input full-width"
                    value={referenceOrder}
                    onChange={(e) =>
                      setReferenceOrder(e.target.value)
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ────────────────────────────────────────────────────────────── */}
        {/* SECTION 2: HEADER TEXT */}
        {/* ────────────────────────────────────────────────────────────── */}
        <section className="section header-text">
          <div className="section-header">HEADER TEXT</div>
          <textarea
            className="textarea full-width"
            rows={4}
            value={headerText}
            onChange={(e) => setHeaderText(e.target.value)}
          />
        </section>

        {/* ────────────────────────────────────────────────────────────── */}
        {/* SECTION 3: PRODUCTS */}
        {/* ────────────────────────────────────────────────────────────── */}
        <section className="section products-section">
          <div className="section-header">PRODUCTS</div>

          {/* Net/Gross Toggle */}
          <div className="net-gross-toggle">
            <button
              type="button"
              className={`toggle-btn ${useNetPrices ? "active" : ""}`}
              onClick={toggleNetGross}
            >
              Net
            </button>
            <button
              type="button"
              className={`toggle-btn ${!useNetPrices ? "active" : ""}`}
              onClick={toggleNetGross}
            >
              Gross
            </button>
          </div>

          {/* Table Header */}
          <div className="products-table-header">
            <div className="col col-index">#</div>
            <div className="col col-product">Product or service</div>
            <div className="col col-qty">Crowd</div>
            <div className="col col-unit">Unit</div>
            <div className="col col-price">
              Price ({useNetPrices ? "net" : "brutto"})
            </div>
            <div className="col col-vat">USt.</div>
            <div className="col col-discount">Disc. (%)</div>
            <div className="col col-amount">Amount</div>
            <div className="col col-action"></div>
          </div>

          {/* Item Rows */}
          {items.map((item, idx) => {
            const rawLineNet = computeLineTotalNet(item);
            const rawLineGross = computeLineTotalGross(item);
            const lineAfterGlobalDisc = useNetPrices
              ? rawLineNet * (1 - totalDiscount / 100)
              : rawLineGross * (1 - totalDiscount / 100);

            return (
              <div className="products-table-row" key={item.id}>
                <div className="col col-index">{idx + 1}.</div>

                <div className="col col-product">
                  <input
                    type="text"
                    className="input"
                    placeholder="Search product"
                    value={item.productName}
                    onChange={(e) =>
                      handleItemChange(item.id, "productName", e.target.value)
                    }
                  />
                </div>

                <div className="col col-qty">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    className="input small-input"
                    value={item.quantity}
                    onChange={(e) =>
                      handleItemChange(item.id, "quantity", e.target.value)
                    }
                  />
                </div>

                <div className="col col-unit">
                  <select
                    className="select small-select"
                    value={item.unit}
                    onChange={(e) =>
                      handleItemChange(item.id, "unit", e.target.value)
                    }
                  >
                    {UNIT_OPTIONS.map((u) => (
                      <option key={u.value} value={u.value}>
                        {u.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col col-price">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="input small-input"
                    value={item.unitPrice}
                    onChange={(e) =>
                      handleItemChange(item.id, "unitPrice", e.target.value)
                    }
                  />{" "}
                  €
                </div>

                <div className="col col-vat">
                  <select
                    className="select small-select"
                    value={item.vat}
                    onChange={(e) =>
                      handleItemChange(item.id, "vat", e.target.value)
                    }
                  >
                    {VAT_OPTIONS.map((v) => (
                      <option key={v.value} value={v.value}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col col-discount">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    className="input small-input"
                    value={item.discount}
                    onChange={(e) =>
                      handleItemChange(item.id, "discount", e.target.value)
                    }
                  />{" "}
                  %
                </div>

                <div className="col col-amount">
                  {lineAfterGlobalDisc.toFixed(2)} €
                </div>

                <div className="col col-action">
                  <button
                    type="button"
                    className="icon-button delete-btn"
                    onClick={() => handleRemoveItem(item.id)}
                    title="Delete line"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}

          {/* Footer Links */}
          <div className="products-footer-links">
            <button
              type="button"
              className="add-link"
              onClick={handleAddItem}
            >
              + Add position
            </button>
            <button
              type="button"
              className="add-link"
              onClick={() => setTotalDiscount(0)}
            >
              + Reset global discount
            </button>
            <button type="button" className="add-link">
              + Select product
            </button>
          </div>

          {/* Global Discount Input */}
          <div className="global-discount">
            <label className="label small-label">
              Total Discount (%):
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="1"
              className="input small-input"
              value={totalDiscount}
              onChange={(e) => setTotalDiscount(e.target.value)}
            />
          </div>

          {/* Totals Area */}
          <div className="totals-area">
            <div className="totals-row">
              <div className="totals-label">
                Subtotal (before discount):
              </div>
              <div className="totals-value">
                {computeSubTotal().toFixed(2)} €
              </div>
            </div>
            {parseFloat(totalDiscount) > 0 && (
              <div className="totals-row">
                <div className="totals-label">
                  Subtotal (after {totalDiscount}% disc.):
                </div>
                <div className="totals-value">
                  {computeSubTotalAfterDiscount().toFixed(2)} €
                </div>
              </div>
            )}
            {useNetPrices && (
              <div className="totals-row">
                <div className="totals-label">VAT Total:</div>
                <div className="totals-value">
                  {computeTotalVAT().toFixed(2)} €
                </div>
              </div>
            )}
            <div className="totals-row grand-total">
              <div className="totals-label">Grand Total:</div>
              <div className="totals-value">
                {(
                  computeSubTotalAfterDiscount() +
                  (useNetPrices ? computeTotalVAT() : 0)
                ).toFixed(2)}{" "}
                €
              </div>
            </div>
          </div>
        </section>

        {/* ────────────────────────────────────────────────────────────── */}
        {/* SECTION 4: FOOTER TEXT */}
        {/* ────────────────────────────────────────────────────────────── */}
        <section className="section footer-text">
          <div className="section-header">FOOTER TEXT</div>
          <textarea
            className="textarea full-width"
            rows={5}
            value={footerText}
            onChange={(e) => setFooterText(e.target.value)}
          />
        </section>

        {/* ────────────────────────────────────────────────────────────── */}
        {/* SECTION 5: MORE OPTIONS */}
        {/* ────────────────────────────────────────────────────────────── */}
        <section className="section more-options">
          <div className="section-header">
            MORE OPTIONS
            <button
              type="button"
              className="toggle-more"
              onClick={() => setShowMoreOptions((p) => !p)}
            >
              {showMoreOptions
                ? "Hide more options"
                : "Show more options"}
            </button>
          </div>

          {showMoreOptions && (
            <div className="extra-options">
              <div className="two-columns">
                <div className="column">
                  <label className="label">Currency</label>
                  <select
                    className="select full-width"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                  >
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                    <option value="CHF">CHF</option>
                  </select>
                </div>
                <div className="column">
                  <label className="label">
                    Internal Contact Person
                  </label>
                  <input
                    type="text"
                    className="input full-width"
                    placeholder="e.g. Rivaldo Dini"
                    value={internalContact}
                    onChange={(e) =>
                      setInternalContact(e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="two-columns">
                <div className="column">
                  <label className="label">
                    Delivery conditions
                  </label>
                  <input
                    type="text"
                    className="input full-width"
                    value={deliveryConditions}
                    onChange={(e) =>
                      setDeliveryConditions(e.target.value)
                    }
                  />
                </div>
                <div className="column">
                  <label className="label">Payment terms</label>
                  <input
                    type="text"
                    className="input full-width"
                    value={paymentTerms}
                    onChange={(e) =>
                      setPaymentTerms(e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="column vat-regulations">
                <label className="label">VAT regulations</label>
                <select
                  className="select full-width"
                  value={vatRegulation}
                  onChange={(e) =>
                    setVatRegulation(e.target.value)
                  }
                >
                  <option value="In Germany">In Germany</option>
                  <option value="In other EU countries">
                    In other EU countries
                  </option>
                  <option value="Outside the EU">Outside the EU</option>
                </select>

                <div className="vat-radio-group">
                  <label>
                    <input
                      type="radio"
                      checked={salesSubjectToVAT}
                      onChange={() => {
                        setSalesSubjectToVAT(true);
                        setTaxFree(false);
                        setReverseCharge(false);
                      }}
                    />{" "}
                    Sales subject to VAT
                  </label>
                  <label>
                    <input
                      type="radio"
                      checked={taxFree}
                      onChange={() => {
                        setSalesSubjectToVAT(false);
                        setTaxFree(true);
                        setReverseCharge(false);
                      }}
                    />{" "}
                    Tax-free sales (§4 UStG)
                  </label>
                  <label>
                    <input
                      type="radio"
                      checked={reverseCharge}
                      onChange={() => {
                        setSalesSubjectToVAT(false);
                        setTaxFree(false);
                        setReverseCharge(true);
                      }}
                    />{" "}
                    Reverse charge (§13b UStG)
                  </label>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ────────────────────────────────────────────────────────────── */}
        {/* SUBMIT BUTTON */}
        {/* ────────────────────────────────────────────────────────────── */}
        <div className="form-actions">
          <button type="submit" className="btn-primary">
            Save & Generate PDF
          </button>
        </div>
      </form>
    </div>
  );
}
