import React, { useState, useEffect } from "react";

import DatePicker from "react-datepicker";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { auth, db } from "../services/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  getDoc,
  collection,
  onSnapshot,
} from "firebase/firestore";

import ProductRow from "../components/ProductRow";
import NavBar from "../components/NavBar";

import "react-datepicker/dist/react-datepicker.css";
import "../assets/styles/pages/_offerFormPage.scss";

export default function OfferFormPage() {

  // ──────────────────────────────────────────────────────────────────────────────
  // 1) COMPANY PROFILE STATE (fetched from Firestore)
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
  // 2) CATALOG PRODUCTS (Firestore “users/{uid}/products”)
  // ──────────────────────────────────────────────────────────────────────────────
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);

  // ──────────────────────────────────────────────────────────────────────────────
  // 3) CONTACT / OFFER STATE
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
  // 4) PRODUCTS SECTION STATE
  // ──────────────────────────────────────────────────────────────────────────────
  const [useNetPrices, setUseNetPrices] = useState(true);
  const [items, setItems] = useState([
    {
      id: Date.now(),
      productId: "",
      productName: "",
      quantity: 1,
      unit: "Stk",
      unitPrice: 0.0,
      vat: 19,
      discount: 0,

      // “Fenster” fields (populated from Firestore once a product is chosen):
      system: "",
      colorOuter: "",
      colorInner: "",
      frameType: "",
      frameDimensions: "",
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

      images: {
        insideView: "",
        outsideView: "",
      },
    },
  ]);
  const [totalDiscount, setTotalDiscount] = useState(0);

  // ──────────────────────────────────────────────────────────────────────────────
  // 4a) LINE TOTAL / SUBTOTAL HELPERS (now including “fillings”)
  // ──────────────────────────────────────────────────────────────────────────────
  const computeLineTotalNet = (item) => {
    // 1) Base net price: qty × unitPrice × (1 – discount%).
    const qty = parseFloat(item.quantity) || 0;
    const basePrice = parseFloat(item.unitPrice) || 0;
    const baseDisc = parseFloat(item.discount) || 0;
    const discountedUnitPrice = basePrice * (1 - baseDisc / 100);
    const baseNet = qty * discountedUnitPrice;

    // 2) Add each filling’s own net price: (f.price × (1 – f.discountPercent/100)).
    const fillingsNet = (item.fillings || []).reduce((sum, f) => {
      const fPrice = parseFloat(f.price) || 0;
      const fDiscPercent = parseFloat(f.discountPercent) || 0;
      const fNet = fPrice * (1 - fDiscPercent / 100);
      return sum + fNet;
    }, 0);

    return baseNet + fillingsNet;
  };

  const computeLineTotalGross = (item) => {
    // Take the net sum and apply VAT:
    const netSum = computeLineTotalNet(item);
    const vatRate = parseFloat(item.vat) || 0;
    return netSum * (1 + vatRate / 100);
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
      // 1) compute this line’s net (including fillings)
      const netLine = computeLineTotalNet(item);

      // 2) apply global discount to that net
      const netAfterGlobal = netLine * (1 - (parseFloat(totalDiscount) || 0) / 100);

      // 3) compute VAT on netAfterGlobal
      const vatRate = parseFloat(item.vat) || 0;
      return sum + netAfterGlobal * (vatRate / 100);
    }, 0);
  };

  // ──────────────────────────────────────────────────────────────────────────────
  // 4b) ADD / REMOVE / CHANGE ITEM
  // ──────────────────────────────────────────────────────────────────────────────
  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: Date.now(),
        productId: "",
        productName: "",
        quantity: 1,
        unit: "Stk",
        unitPrice: 0.0,
        vat: 19,
        discount: 0,

        system: "",
        colorOuter: "",
        colorInner: "",
        frameType: "",
        frameDimensions: "",
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

        images: {
          insideView: "",
          outsideView: "",
        },
      },
    ]);
  };

  const handleRemoveItem = (id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  /**
   * When a field changes in a ProductRow, call handleItemChange(itemId, fieldName, newValue).
   * If fieldName === "productId", we look up that product in catalogProducts and
   * copy all its Firestore fields (including “fillings” & “accessories”) into this line.
   */
  const handleItemChange = (id, field, value) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;

        // 1) If user selected a “product” from the dropdown:
        if (field === "productId") {
          const chosen = catalogProducts.find((p) => p.id === value);
          if (chosen) {
            return {
              ...i,
              productId: value,
              productName: chosen.data.productName || "",
              unitPrice: chosen.data.unitPrice ?? 0,
              vat: chosen.data.vat ?? 0,

              // Copy all “Fenster” details from Firestore:
              system: chosen.data.system || "",
              colorOuter: chosen.data.colorOuter || "",
              colorInner: chosen.data.colorInner || "",
              frameType: chosen.data.frameType || "",
              frameDimensions: chosen.data.frameDimensions || "",
              frameVeneerColor: chosen.data.frameVeneerColor || "",
              sashVeneerColor: chosen.data.sashVeneerColor || "",
              coreSealFrame: chosen.data.coreSealFrame || "",
              coreSealSash: chosen.data.coreSealSash || "",
              thresholdType: chosen.data.thresholdType || "",
              weldingType: chosen.data.weldingType || "",
              glazing: chosen.data.glazing || "",
              glassHold: chosen.data.glassHold || "",
              sashType: chosen.data.sashType || "",
              fitting: chosen.data.fitting || "",
              fittingType: chosen.data.fittingType || "",
              handleTypeInner: chosen.data.handleTypeInner || "",
              handleColorInner: chosen.data.handleColorInner || "",
              handleColorOuter: chosen.data.handleColorOuter || "",
              UwCoefficient: chosen.data.UwCoefficient || "",
              weightUnit: chosen.data.weightUnit || "",
              perimeter: chosen.data.perimeter || "",
              accessories: Array.isArray(chosen.data.accessories)
                ? chosen.data.accessories
                : [],
              fillings: Array.isArray(chosen.data.fillings)
                ? chosen.data.fillings
                : [],

              images: chosen.data.images || {
                insideView: "",
                outsideView: "",
              },

              // Keep the existing quantity/unit/discount if already typed:
              quantity: i.quantity ?? 1,
              unit: i.unit || "Stk",
              discount: i.discount ?? 0,
            };
          } else {
            // If not found in catalog → just clear productName
            return {
              ...i,
              productId: "",
              productName: "",
            };
          }
        }

        // 2) Otherwise, update only that field:
        return {
          ...i,
          [field]: value,
        };
      })
    );
  };

  const toggleNetGross = () => {
    setUseNetPrices((prev) => !prev);
  };

  // ──────────────────────────────────────────────────────────────────────────────
  // 5) FOOTER TEXT
  // ──────────────────────────────────────────────────────────────────────────────
  const [footerText, setFooterText] = useState(
    "Für Rückfragen stehen wir Ihnen jederzeit gerne zur Verfügung.\nWir bedanken uns sehr für Ihr Vertrauen.\n\nMit freundlichen Grüßen\n[%KONTAKTPERSON%]"
  );

  // ──────────────────────────────────────────────────────────────────────────────
  // 6) MORE OPTIONS STATE
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
  // 7) FETCH COMPANY PROFILE & CATALOG PRODUCTS once user is authenticated
  // ──────────────────────────────────────────────────────────────────────────────
  const fetchLatestProfile = async () => {
    const user = auth.currentUser;
    if (!user) return null;
    try {
      const profileRef = doc(
        db,
        "users",
        user.uid,
        "companyProfile",
        "profile"
      );
      const snap = await getDoc(profileRef);
      if (snap.exists()) {
        const data = snap.data();
        setCompanyProfile(data);
        return data;
      }
    } catch (err) {
      console.error("Error refreshing company profile:", err);
    }
    return null;
  };

  useEffect(() => {
    let unsubscribeCatalog = () => {};
    const unsubscribeAuth = onAuthStateChanged(
      auth,
      async (currentUser) => {
        if (currentUser) {
          // 7a) Load Company Profile
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
          setProfileLoading(false);

          // 7b) Subscribe to “catalog products”
          try {
            const productsColRef = collection(
              db,
              "users",
              currentUser.uid,
              "products"
            );
            unsubscribeCatalog = onSnapshot(
              productsColRef,
              (snapshot) => {
                const arr = [];
                snapshot.forEach((docSnap) => {
                  arr.push({ id: docSnap.id, data: docSnap.data() });
                });
                setCatalogProducts(arr);
                setCatalogLoading(false);
              },
              (error) => {
                console.error("Error fetching catalog products:", error);
                setCatalogLoading(false);
              }
            );
          } catch (err) {
            console.error("Error subscribing to catalog:", err);
            setCatalogLoading(false);
          }
        } else {
          setProfileLoading(false);
          setCatalogLoading(false);
        }
      }
    );

    return () => {
      unsubscribeAuth();
      unsubscribeCatalog();
    };
  }, []);

  // ──────────────────────────────────────────────────────────────────────────────
  // 8) GENERATE PDF
  // ──────────────────────────────────────────────────────────────────────────────
  const generatePDF = async () => {
    // Refresh company profile if needed
    await fetchLatestProfile();

    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 40;
    let cursorY = 40;

    // --- (1) COMPANY HEADER ---
    if (companyProfile.logoUrl) {
      doc.setFontSize(18).setTextColor("#000");
      doc.text(companyProfile.name, margin, cursorY + 5);
      doc.setFontSize(10).setTextColor("#555");
      doc.text(
        `${companyProfile.street}, ${companyProfile.zipCity}, ${companyProfile.country}`,
        margin,
        cursorY + 20
      );
      doc.text(
        `Tel: ${companyProfile.phone}  ·  E-Mail: ${companyProfile.email}`,
        margin,
        cursorY + 35
      );
      doc.text(`Web: ${companyProfile.website}`, margin, cursorY + 50);
      if (companyProfile.vatNumber) {
        doc.text(`VAT: ${companyProfile.vatNumber}`, margin, cursorY + 65);
      }
      cursorY += 80;
    } else {
      doc.setFontSize(18).setTextColor("#000");
      doc.text(companyProfile.name || "Your Company Name", margin, cursorY);
      doc.setFontSize(10).setTextColor("#555");
      doc.text(
        `${companyProfile.street}, ${companyProfile.zipCity}, ${companyProfile.country}`,
        margin,
        cursorY + 20
      );
      if (companyProfile.phone) {
        doc.text(`Tel: ${companyProfile.phone}`, margin, cursorY + 35);
      }
      if (companyProfile.email) {
        doc.text(`E-Mail: ${companyProfile.email}`, margin, cursorY + 50);
      }
      cursorY += 60;
    }

    // --- (2) OFFER TITLE & DATES ---
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

    // --- (3) CONTACT & ADDRESS BOX ---
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

    // --- (4) REGARDING & REFERENCE ---
    doc.setFontSize(11).setTextColor("#000");
    doc.text(`Regarding: ${regarding}`, margin, cursorY);
    doc.text(
      `Reference / Order No.: ${referenceOrder}`,
      margin,
      cursorY + 15
    );
    cursorY += 30;

    // --- (5) HEADER TEXT ---
    doc.setFontSize(10).setTextColor("#333");
    const headerLines = doc.splitTextToSize(
      headerText,
      pageWidth - margin * 2
    );
    doc.text(headerLines, margin, cursorY);
    cursorY += headerLines.length * 12 + 10;

    // --- (6) PRODUCTS TABLE (Basic columns) ---
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
      const qtyString = (item.quantity ?? 0).toString();
      // Price column shows raw net (quantity×discounted + fillings)
      const rawLineNet = computeLineTotalNet(item);
      const priceString = rawLineNet.toFixed(2) + " €";

      // Then compute the “after global discount” line total:
      const rawLineGross = computeLineTotalGross(item);
      const lineAfterGlobalDisc = useNetPrices
        ? rawLineNet * (1 - (parseFloat(totalDiscount) || 0) / 100)
        : rawLineGross * (1 - (parseFloat(totalDiscount) || 0) / 100);

      return [
        idx + 1,
        item.productName,
        qtyString,
        item.unit,
        priceString,
        (item.vat ?? 0) + "%",
        (item.discount ?? 0) + "%",
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

    // --- (7) DETAILED “FENSTER” BLOCKS (one per item) ---
    for (let idx = 0; idx < items.length; idx++) {
      const item = items[idx];

      // (7a) Heading bar: “Fenster 00X | Menge: … | System: … | Farbe: …”
      doc.setDrawColor("#4169E1").setFillColor("#E6E6FA");
      const boxHeight = 20;
      doc.rect(margin, cursorY, pageWidth - 2 * margin, boxHeight, "FD");
      doc.setFontSize(10).setTextColor("#000");

      const totalBoxWidth = pageWidth - 2 * margin;
      const segmentWidth = totalBoxWidth / 4;

      doc.text(`Fenster 00${idx + 1}`, margin + 4, cursorY + 13);
      doc.text(
        `Menge: ${item.quantity ?? 0}`,
        margin + segmentWidth + 4,
        cursorY + 13
      );
      doc.text(
        `System: ${item.system}`,
        margin + segmentWidth * 2 + 4,
        cursorY + 13
      );
      doc.text(
        `Farbe: ${item.colorOuter}`,
        margin + segmentWidth * 3 + 4,
        cursorY + 13
      );
      cursorY += boxHeight + 8;

      // (7b) Images, if present
      if (item.images.insideView) {
        try {
          doc.addImage(item.images.insideView, "JPEG", margin, cursorY, 200, 120);
        } catch (e) {
          console.warn("Failed to add inside view image", e);
        }
      }
      if (item.images.outsideView) {
        try {
          doc.addImage(
            item.images.outsideView,
            "JPEG",
            pageWidth - margin - 200,
            cursorY,
            200,
            120
          );
        } catch (e) {
          console.warn("Failed to add outside view image", e);
        }
      }
      if (item.images.insideView || item.images.outsideView) {
        cursorY += 120 + 8;
      }

      // (7c) “Rahmen” details table (two columns)
      const frameRows = [
        ["Rahmen", item.frameType],
        ["Außen Farbe", item.colorOuter],
        ["Innen Farbe", item.colorInner],
        ["Maße", item.frameDimensions],
        ["Furnierfarbe des Rahmens", item.frameVeneerColor],
        ["Furnierfarbe des Flügels", item.sashVeneerColor],
        ["Farbe des Kerns + Dichtung (Rahmen)", item.coreSealFrame],
        ["Farbe des Kerns + Dichtung (Flügel)", item.coreSealSash],
        ["Schwellentyp HST", item.thresholdType],
        ["Verschweißungsart", item.weldingType],
        ["Glazing required", item.glazing],
        ["Glasleiste", item.glassHold],
        ["Flügel", item.sashType],
        ["Glasleiste", item.glassHold],
        ["Beschlag", item.fitting],
        ["  Beschlagsart", item.fittingType],
        ["  Art der Olive (innen)", item.handleTypeInner],
        ["  Drückerfarbe innen", item.handleColorInner],
        ["  Farbe des Außengriffs", item.handleColorOuter],
        ["Wärmekoeffizient", item.UwCoefficient],
        ["Gewichtseinheit", item.weightUnit],
        ["Umrandung", item.perimeter],
      ];

      autoTable(doc, {
        startY: cursorY,
        margin: { left: margin, right: margin },
        theme: "grid",
        head: [["", ""]],
        body: frameRows,
        showHead: false,
        styles: {
          fontSize: 9,
          cellPadding: 4,
          textColor: "#333",
        },
        columnStyles: {
          0: { cellWidth: 150, fontStyle: "bold" },
          1: { cellWidth: 250 },
        },
        tableLineColor: "#4169E1",
        tableLineWidth: 0.5,
      });
      cursorY = doc.lastAutoTable.finalY + 10;

      // (7d) Accessories table, if any
      if (Array.isArray(item.accessories) && item.accessories.length > 0) {
        const accRows = item.accessories.map((acc) => [
          acc.description || acc.code,
          (acc.qty ?? 0).toString(),
        ]);
        autoTable(doc, {
          startY: cursorY,
          margin: { left: margin, right: margin },
          head: [["Zubehör", "Menge"]],
          body: accRows,
          headStyles: {
            fillColor: "#F0F8FF",
            textColor: "#333",
            fontSize: 9,
          },
          bodyStyles: { fontSize: 9, textColor: "#333" },
          theme: "striped",
          styles: { cellPadding: 4 },
          columnStyles: {
            0: { cellWidth: 350 },
            1: { cellWidth: 60, halign: "right" },
          },
        });
        cursorY = doc.lastAutoTable.finalY + 10;
      }

      // (7e) Fillings table, if any
      if (Array.isArray(item.fillings) && item.fillings.length > 0) {
        const fillRows = item.fillings.map((f) => {
          const fNetPrice = parseFloat(f.price) || 0;
          const fDiscPct = parseFloat(f.discountPercent) || 0;
          const fDiscValue = fNetPrice * (fDiscPct / 100);
          const fTotal = fNetPrice - fDiscValue;
          return [
            f.id,
            f.spec,
            f.dimensions,
            fNetPrice.toFixed(2) + " €",
            fDiscPct + "%",
            fDiscValue.toFixed(2) + " €",
            fTotal.toFixed(2) + " €",
          ];
        });
        autoTable(doc, {
          startY: cursorY,
          margin: { left: margin, right: margin },
          head: [
            [
              "ID",
              "Füllung",
              "Maße",
              "Netto Preis",
              "Disc %",
              "Rabatt",
              "Summe",
            ],
          ],
          body: fillRows,
          headStyles: {
            fillColor: "#E6E6FA",
            textColor: "#333",
            fontSize: 8,
          },
          bodyStyles: { fontSize: 8, textColor: "#333" },
          theme: "grid",
          styles: { cellPadding: 3 },
          columnStyles: {
            0: { cellWidth: 30, halign: "center" },
            1: { cellWidth: 200 },
            2: { cellWidth: 60, halign: "center" },
            3: { cellWidth: 60, halign: "right" },
            4: { cellWidth: 40, halign: "right" },
            5: { cellWidth: 60, halign: "right" },
            6: { cellWidth: 60, halign: "right" },
          },
        });
        cursorY = doc.lastAutoTable.finalY + 10;
      }

      // (7f) Fenster total line (net + VAT):
      const singleNet = computeLineTotalNet(item);
      // Note: item.discount has already been applied into computeLineTotalNet (base + fillings),
      // because computeLineTotalNet’s “baseNet” calculation did “unitPrice × (1 – discount/100)”.
      // So “singleNet” is after the *item‐level discount*. We now only need to apply “global discount”:
      const singleAfterGlobalDisc =
        singleNet * (1 - (parseFloat(totalDiscount) || 0) / 100);
      const singleVAT = useNetPrices
        ? singleAfterGlobalDisc * ((parseFloat(item.vat) || 0) / 100)
        : 0;
      const singleGrand = useNetPrices
        ? singleAfterGlobalDisc + singleVAT
        : singleAfterGlobalDisc;

      doc.setFontSize(10).setFont(undefined, "bold");
      doc.text(
        `Fenster total: ${singleAfterGlobalDisc.toFixed(2)} €  +USt ${singleVAT.toFixed(
          2
        )} €  = ${singleGrand.toFixed(2)} €`,
        margin,
        cursorY
      );
      doc.setFont(undefined, "normal");
      cursorY += 20;

      // If we’re near the bottom, add a new page:
      if (cursorY > doc.internal.pageSize.getHeight() - 80) {
        doc.addPage();
        cursorY = margin;
      }
    }

    // --- (8) OVERALL TOTALS (After all Fenster blocks) ---
    doc.setFontSize(10).setTextColor("#000");
    const totalsX = pageWidth - margin - 200;
    let totalsY = cursorY + 20;

    doc.text(`Subtotal (before discount): ${rawSubtotal.toFixed(2)} €`, totalsX, totalsY);
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

    doc.text(`Subtotal (after discount): ${subAfterDisc.toFixed(2)} €`, totalsX, totalsY);
    totalsY += 15;

    if (useNetPrices) {
      doc.text(`VAT Total: ${totalVAT.toFixed(2)} €`, totalsX, totalsY);
      totalsY += 15;
    }

    doc.setFontSize(12).setFont(undefined, "bold");
    doc.text(`Total: ${grandTotal.toFixed(2)} €`, totalsX, totalsY);
    doc.setFont(undefined, "normal");
    cursorY = totalsY + 40;

    // --- (9) FOOTER TEXT ---
    doc.setFontSize(10).setTextColor("#333");
    const footerLines = doc.splitTextToSize(
      footerText,
      pageWidth - margin * 2
    );
    doc.text(footerLines, margin, cursorY);
    cursorY += footerLines.length * 12 + 20;

    // --- (10) MORE OPTIONS SUMMARY ---
    doc.setFontSize(9).setTextColor("#555");
    doc.text("----- More Options -----", margin, cursorY);
    cursorY += 12;
    doc.text(`Currency: ${currency}`, margin, cursorY);
    cursorY += 12;
    doc.text(`Internal Contact: ${internalContact}`, margin, cursorY);
    cursorY += 12;
    doc.text(`Delivery Conditions: ${deliveryConditions}`, margin, cursorY);
    cursorY += 12;
    doc.text(`Payment Terms: ${paymentTerms}`, margin, cursorY);
    cursorY += 12;
    doc.text(`VAT Regulation: ${vatRegulation}`, margin, cursorY);
    cursorY += 12;
    let vatLine = "";
    if (salesSubjectToVAT) vatLine = "Sales subject to VAT";
    if (taxFree) vatLine = "Tax-free sales (§4 UStG)";
    if (reverseCharge) vatLine = "Reverse charge (§13b UStG)";
    doc.text(`VAT Option: ${vatLine}`, margin, cursorY);

    // --- (11) SAVE PDF ---
    doc.save(`Angebot-${offerNumber || "new"}.pdf`);
  };

  // ──────────────────────────────────────────────────────────────────────────────
  // 9) FORM SUBMIT HANDLER
  // ──────────────────────────────────────────────────────────────────────────────
  const handleSubmitForm = async (e) => {
    e.preventDefault();
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
        "Bitte mindestens ein Produkt auswählen, mit Menge > 0 und gültigem Preis eingeben."
      );
      return;
    }
    await generatePDF();
  };

  // ──────────────────────────────────────────────────────────────────────────────
  // 10) RENDER
  // ──────────────────────────────────────────────────────────────────────────────
  if (profileLoading || catalogLoading) {
    return (
      <div className="offer-form-page">
        <NavBar />
        <p>Loading…</p>
      </div>
    );
  }

  return (
    <div className="offer-form-page">
      <NavBar />

      {/* COMPANY HEADER */}
      {!profileLoading && (
        <div className="company-header">
          {companyProfile.logoUrl && (
            <img
              src={companyProfile.logoUrl}
              alt="Company logo"
              className="company-logo"
            />
          )}
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
              {companyProfile.email && <>E‐Mail: {companyProfile.email}</>}
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
        {/* ──────────────────────────────────────────────────────────── */}
        {/* SECTION 1: CONTACT & OFFER INFORMATION */}
        {/* ──────────────────────────────────────────────────────────── */}
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
                  <label className="label">Reference / Order number</label>
                  <input
                    type="text"
                    className="input full-width"
                    value={referenceOrder}
                    onChange={(e) => setReferenceOrder(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ──────────────────────────────────────────────────────────── */}
        {/* SECTION 2: HEADER TEXT */}
        {/* ──────────────────────────────────────────────────────────── */}
        <section className="section header-text">
          <div className="section-header">HEADER TEXT</div>
          <textarea
            className="textarea full-width"
            rows={4}
            value={headerText}
            onChange={(e) => setHeaderText(e.target.value)}
          />
        </section>

        {/* ──────────────────────────────────────────────────────────── */}
        {/* SECTION 3: PRODUCTS */}
        {/* ──────────────────────────────────────────────────────────── */}
        <section className="section products-section">
          <div className="section-header">PRODUCTS</div>

          {/* Net/Gross Toggle */}
          <div className="net-gross-toggle">
            <button
              type="button"
              className={`toggle-btn ${
                useNetPrices ? "active" : ""
              }`}
              onClick={toggleNetGross}
            >
              Net
            </button>
            <button
              type="button"
              className={`toggle-btn ${
                !useNetPrices ? "active" : ""
              }`}
              onClick={toggleNetGross}
            >
              Gross
            </button>
          </div>

          {/* Table Header (Basic columns) */}
          <div className="products-table-header">
            <div className="col col-index">#</div>
            <div className="col col-product">Product or service</div>
            <div className="col col-qty">Qty</div>
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
          {items.map((item, idx) => (
            <ProductRow
              key={item.id}
              item={item}
              index={idx}
              productCatalog={catalogProducts}
              useNetPrices={useNetPrices}
              totalDiscount={totalDiscount}
              onChange={handleItemChange}
              onRemove={handleRemoveItem}
              computeLineTotalNet={computeLineTotalNet}
              computeLineTotalGross={computeLineTotalGross}
            />
          ))}

          {/* Footer Links for Adding more lines, Reset Discount */}
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

        {/* ──────────────────────────────────────────────────────────── */}
        {/* SECTION 4: FOOTER TEXT */}
        {/* ──────────────────────────────────────────────────────────── */}
        <section className="section footer-text">
          <div className="section-header">FOOTER TEXT</div>
          <textarea
            className="textarea full-width"
            rows={5}
            value={footerText}
            onChange={(e) => setFooterText(e.target.value)}
          />
        </section>

        {/* ──────────────────────────────────────────────────────────── */}
        {/* SECTION 5: MORE OPTIONS */}
        {/* ──────────────────────────────────────────────────────────── */}
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
                    placeholder="z. B. Rivaldo Dini"
                    value={internalContact}
                    onChange={(e) =>
                      setInternalContact(e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="two-columns">
                <div className="column">
                  <label className="label">Delivery conditions</label>
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
                  onChange={(e) => setVatRegulation(e.target.value)}
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

        {/* ──────────────────────────────────────────────────────────── */}
        {/* SUBMIT BUTTON */}
        {/* ──────────────────────────────────────────────────────────── */}
        <div className="form-actions">
          <button type="submit" className="btn-primary">
            Save &amp; Generate PDF
          </button>
        </div>
      </form>
    </div>
  );
}
