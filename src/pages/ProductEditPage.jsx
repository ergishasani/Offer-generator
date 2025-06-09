// src/pages/OfferFormPage.jsx
import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { auth, db, storage } from "../services/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  getDoc,
  collection,
  onSnapshot,
} from "firebase/firestore";

import ProductRow from "../components/ProductRow";
import WindowPreview from "../components/WindowPreview";
import NavBar from "../components/NavBar";

import "react-datepicker/dist/react-datepicker.css";
import "../assets/styles/pages/_offerFormPage.scss";

export default function OfferFormPage() {
  // 1) COMPANY PROFILE
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

  // 2) CATALOG
  const [userCatalog, setUserCatalog]   = useState([]);
  const [globalCatalog, setGlobalCatalog] = useState([]);
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [catalogLoading, setCatalogLoading]   = useState(true);

  // 3) CONTACT / OFFER HEADERS
  const [contactName,    setContactName]    = useState("");
  const [addressLine1,   setAddressLine1]   = useState("");
  const [addressLine2,   setAddressLine2]   = useState("");
  const [countryAddr,    setCountryAddr]    = useState("Deutschland");
  const [regarding,      setRegarding]      = useState("");
  const [offerNumber,    setOfferNumber]    = useState("");
  const [offerDate,      setOfferDate]      = useState(new Date());
  const [expirationDate, setExpirationDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  );
  const [referenceOrder, setReferenceOrder] = useState("");
  const [headerText,     setHeaderText]     = useState(
    "Sehr geehrte Damen und Herren,\n\nvielen Dank für Ihre Anfrage. Gerne unterbreiten wir Ihnen das gewünschte freibleibende Angebot:"
  );

  // 4) LINE ITEMS
  const [useNetPrices, setUseNetPrices] = useState(true);
  const [items, setItems] = useState([
    {
      id:        Date.now(),
      productId: "",
      productName: "",
      quantity:  1,
      unit:      "Stk",
      unitPrice: 0.0,
      vat:       19,
      discount:  0,
      // all your “system, colorOuter… perimeter” etc fields
      system:            "",
      colorOuter:        "",
      colorInner:        "",
      frameType:         "",
      frameDimensions:   "",
      frameVeneerColor:  "",
      sashVeneerColor:   "",
      coreSealFrame:     "",
      coreSealSash:      "",
      thresholdType:     "",
      weldingType:       "",
      glazing:           "",
      glassHold:         "",
      sashType:          "",
      fitting:           "",
      fittingType:       "",
      handleTypeInner:   "",
      handleColorInner:  "",
      handleColorOuter:  "",
      UwCoefficient:     "",
      weightUnit:        "",
      perimeter:         "",
      accessories:       [],
      fillings:          [],
      // *** NEW *** window SVG + dims from the catalog product
      windowSvgUrl:      "",
      widthMm:           0,
      heightMm:          0,
      // also if you store inside/outside photos:
      images: { insideView: "", outsideView: "" },
    },
  ]);
  const [totalDiscount, setTotalDiscount] = useState(0);

  // helpers for net / gross totals (unchanged) …
  const computeLineTotalNet = (item) => {
    const qty       = parseFloat(item.quantity) || 0;
    const basePrice = parseFloat(item.unitPrice) || 0;
    const baseDisc  = parseFloat(item.discount)   || 0;
    const netUnit   = basePrice * (1 - baseDisc / 100);
    const baseNet   = qty * netUnit;
    const fillingsNet = (item.fillings || []).reduce((sum, f) => {
      const price = parseFloat(f.price)         || 0;
      const disc  = parseFloat(f.discountPercent) || 0;
      return sum + price * (1 - disc / 100);
    }, 0);
    return baseNet + fillingsNet;
  };
  const computeLineTotalGross = (item) =>
    computeLineTotalNet(item) * (1 + (parseFloat(item.vat)||0)/100);
  const computeSubTotal = () =>
    items.reduce((sum, it) =>
      sum + (useNetPrices
        ? computeLineTotalNet(it)
        : computeLineTotalGross(it)
      )
    , 0);
  const computeSubTotalAfterDiscount = () =>
    computeSubTotal() * (1 - (parseFloat(totalDiscount)||0)/100);
  const computeTotalVAT = () => {
    if (!useNetPrices) return 0;
    return items.reduce((sum, it) => {
      const netLine    = computeLineTotalNet(it) * (1 - (parseFloat(totalDiscount)||0)/100);
      const rate       = (parseFloat(it.vat)||0)/100;
      return sum + netLine * rate;
    }, 0);
  };

  // add / remove / change line items
  const handleAddItem = () =>
    setItems(prev=>[
      ...prev,
      { id:Date.now(), productId:"", productName:"", quantity:1, unit:"Stk", unitPrice:0, vat:19, discount:0,
        system:"", colorOuter:"", colorInner:"", frameType:"", frameDimensions:"",
        frameVeneerColor:"", sashVeneerColor:"", coreSealFrame:"", coreSealSash:"",
        thresholdType:"", weldingType:"", glazing:"", glassHold:"", sashType:"",
        fitting:"", fittingType:"", handleTypeInner:"", handleColorInner:"",
        handleColorOuter:"", UwCoefficient:"", weightUnit:"", perimeter:"",
        accessories:[], fillings:[], windowSvgUrl:"", widthMm:0, heightMm:0,
        images:{insideView:"", outsideView:""}
      }
    ]);

  const handleRemoveItem = id =>
    setItems(prev=>prev.filter(i=>i.id!==id));

  // when user selects a product → pull in **all** fields including windowSvgUrl & dims
  const handleItemChange = (id, field, value) => {
    setItems(prev=>
      prev.map(i=>{
        if (i.id!==id) return i;
        if (field==="productId") {
          const chosen = catalogProducts.find(p=>p.id===value);
          if (!chosen) return { ...i, productId:"", productName:"" };
          const d = chosen.data;
          return {
            ...i,
            productId:    value,
            productName:  d.productName||d.name||"",
            unitPrice:    d.unitPrice ?? d.price ?? 0,
            vat:          d.vat       ?? 0,
            system:       d.system    || "",
            colorOuter:   d.colorOuter||d.color    || "",
            colorInner:   d.colorInner||"",
            frameType:    d.frameType || "",
            frameDimensions: d.frameDimensions||
                             `${d.width||""}×${d.height||""}`.trim(),
            frameVeneerColor: d.frameVeneerColor||"",
            sashVeneerColor:  d.sashVeneerColor||"",
            coreSealFrame: d.coreSealFrame||"",
            coreSealSash:  d.coreSealSash||"",
            thresholdType:d.thresholdType||"",
            weldingType:  d.weldingType||"",
            glazing:      d.glazing    ||"",
            glassHold:    d.glassHold  ||"",
            sashType:     d.sashType   ||"",
            fitting:      d.fitting    ||"",
            fittingType:  d.fittingType||"",
            handleTypeInner:  d.handleTypeInner||"",
            handleColorInner: d.handleColorInner||"",
            handleColorOuter: d.handleColorOuter||"",
            UwCoefficient:    d.UwCoefficient||"",
            weightUnit:       d.weightUnit   ||"",
            perimeter:        d.perimeter    ||"",
            accessories: Array.isArray(d.accessories)?d.accessories:[],
            fillings:    Array.isArray(d.fillings)?d.fillings:[],
            // **window SVG** + dims from product document:
            windowSvgUrl: d.windowSvgUrl||"",
            widthMm:      d.widthMm   ||0,
            heightMm:     d.heightMm  ||0,
            quantity:     i.quantity,
            unit:         i.unit,
            discount:     i.discount,
            images:       d.images||{insideView:"",outsideView:""}
          };
        }
        // for all other fields (qty, discount, etc)
        return { ...i, [field]: value };
      })
    );
  };

  const toggleNetGross = () => setUseNetPrices(p=>!p);

  // 5) FOOTER TEXT
  const [footerText, setFooterText] = useState(
    "Für Rückfragen stehen wir Ihnen jederzeit gerne zur Verfügung.\nWir bedanken uns sehr für Ihr Vertrauen.\n\nMit freundlichen Grüßen\n[%KONTAKTPERSON%]"
  );

  // 6) MORE OPTIONS
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [currency, setCurrency] = useState("EUR");
  const [internalContact, setInternalContact] = useState("");
  const [deliveryConditions, setDeliveryConditions] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [vatRegulation, setVatRegulation] = useState("In Germany");
  const [salesSubjectToVAT, setSalesSubjectToVAT] = useState(true);
  const [taxFree, setTaxFree] = useState(false);
  const [reverseCharge, setReverseCharge] = useState(false);

  // 7) LOAD COMPANY PROFILE & CATALOGS
  useEffect(()=>{
    let unsubUser   = ()=>{};
    let unsubGlobal = ()=>{};
    const unsubAuth = onAuthStateChanged(auth, async user=>{
      if (!user) {
        setProfileLoading(false);
        setCatalogLoading(false);
        return;
      }
      // 7a) company profile
      try {
        const profileRef = doc(db, "users", user.uid, "companyProfile", "profile");
        const snap = await getDoc(profileRef);
        if (snap.exists()) setCompanyProfile(snap.data());
      } catch(err){ console.error(err) }
      setProfileLoading(false);

      // 7b) user catalog
      const userRef   = collection(db, "users", user.uid, "products");
      unsubUser = onSnapshot(userRef, snap=>{
        const arr=[];
        snap.forEach(d=>arr.push({ id:d.id, data:d.data() }));
        setUserCatalog(arr);
        setCatalogLoading(false);
      },err=>{
        console.error(err);
        setCatalogLoading(false);
      });

      // 7c) global catalog
      const globalRef = collection(db, "products");
      unsubGlobal = onSnapshot(globalRef, snap=>{
        const arr=[];
        snap.forEach(d=>arr.push({ id:d.id, data:d.data() }));
        setGlobalCatalog(arr);
        setCatalogLoading(false);
      },err=>{
        console.error(err);
        setCatalogLoading(false);
      });
    });
    return()=>{
      unsubAuth();
      unsubUser();
      unsubGlobal();
    };
  },[]);

  // 7d) merge catalogs
  useEffect(()=>{
    setCatalogProducts([...globalCatalog, ...userCatalog]);
  },[globalCatalog, userCatalog]);

  // 8) GENERATE PDF
  const generatePDF = async () => {
    // refresh company profile
    const user = auth.currentUser;
    if (user) {
      try {
        const profileRef = doc(db, "users", user.uid, "companyProfile", "profile");
        const snap = await getDoc(profileRef);
        if (snap.exists()) setCompanyProfile(snap.data());
      } catch(err){ console.error(err) }
    }

    const pdf       = new jsPDF({ unit:"pt", format:"a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin    = 40;
    let cursorY     = 40;

    // PRELOAD ALL ITEM SVGs into a map
    const svgDataUris = {};
    for (const it of items) {
      if (it.windowSvgUrl) {
        try {
          const res = await fetch(it.windowSvgUrl);
          const text= await res.text();
          svgDataUris[it.id] = 
            "data:image/svg+xml;base64,"+
            btoa(unescape(encodeURIComponent(text)));
        } catch(err){
          console.warn("SVG load failed:", err);
        }
      }
    }

    // (1) HEADER
    if (companyProfile.logoUrl) {
      pdf.setFontSize(18).setTextColor("#000");
      pdf.text(companyProfile.name, margin, cursorY+5);
      pdf.setFontSize(10).setTextColor("#555");
      pdf.text(
        `${companyProfile.street}, ${companyProfile.zipCity}, ${companyProfile.country}`,
        margin, cursorY+20
      );
      pdf.text(
        `Tel: ${companyProfile.phone} · E-Mail: ${companyProfile.email}`,
        margin, cursorY+35
      );
      pdf.text(`Web: ${companyProfile.website}`, margin, cursorY+50);
      if (companyProfile.vatNumber) {
        pdf.text(`VAT: ${companyProfile.vatNumber}`, margin, cursorY+65);
      }
      cursorY += 80;
    } else {
      pdf.setFontSize(18).setTextColor("#000");
      pdf.text(companyProfile.name||"Your Company Name", margin, cursorY);
      pdf.setFontSize(10).setTextColor("#555");
      pdf.text(
        `${companyProfile.street}, ${companyProfile.zipCity}, ${companyProfile.country}`,
        margin, cursorY+20
      );
      if (companyProfile.phone) {
        pdf.text(`Tel: ${companyProfile.phone}`, margin, cursorY+35);
      }
      if (companyProfile.email) {
        pdf.text(`E-Mail: ${companyProfile.email}`, margin, cursorY+50);
      }
      cursorY += 60;
    }

    // (2) OFFER TITLE & DATES
    pdf.setFontSize(16).setTextColor("#000");
    pdf.text("Angebot", margin, cursorY);
    pdf.setFontSize(12);
    pdf.text(`Offer No.: ${offerNumber}`, pageWidth-margin-200, cursorY);
    pdf.text(
      `Date: ${offerDate.toLocaleDateString("de-DE")}`,
      pageWidth-margin-200, cursorY+15
    );
    pdf.text(
      `Expires: ${expirationDate.toLocaleDateString("de-DE")}`,
      pageWidth-margin-200, cursorY+30
    );
    cursorY += 45;

    // (3) CONTACT BOX
    pdf
      .setDrawColor("#ccc")
      .setFillColor("#f9f9f9")
      .roundedRect(margin, cursorY, pageWidth- margin*2, 90, 4, 4, "FD");
    pdf.setFontSize(10).setTextColor("#333");
    pdf.text(`Contact: ${contactName}`, margin+6, cursorY+20);
    pdf.text(`Address:`, margin+6, cursorY+40);
    pdf.text(addressLine1, margin+60, cursorY+40);
    pdf.text(addressLine2, margin+60, cursorY+55);
    pdf.text(countryAddr,  margin+60, cursorY+70);
    cursorY += 110;

    // (4) REGARDING & REFERENCE
    pdf.setFontSize(11).setTextColor("#000");
    pdf.text(`Regarding: ${regarding}`, margin, cursorY);
    pdf.text(`Reference / Order No.: ${referenceOrder}`, margin, cursorY+15);
    cursorY += 30;

    // (5) HEADER TEXT
    pdf.setFontSize(10).setTextColor("#333");
    const headerLines = pdf.splitTextToSize(headerText, pageWidth- margin*2);
    pdf.text(headerLines, margin, cursorY);
    cursorY += headerLines.length*12 + 10;

    // (6) PRODUCTS TABLE
    const rawSubtotal   = computeSubTotal();
    const subAfterDisc = computeSubTotalAfterDiscount();
    const totalVAT     = computeTotalVAT();
    const grandTotal   = useNetPrices
      ? subAfterDisc + totalVAT
      : subAfterDisc;

    const tableColumnHeaders = [
      "#","Product or service","Qty","Unit",
      `Price (${useNetPrices?"net":"brutto"})`, "USt.","Disc. (%)","Line Total"
    ];
    const tableRows = items.map((item, idx)=>{
      const netLine  = computeLineTotalNet(item);
      const grossLine= computeLineTotalGross(item);
      const afterGlobal = (useNetPrices?netLine:grossLine)
        * (1 - (parseFloat(totalDiscount)||0)/100);

      return [
        idx+1,
        item.productName,
        (item.quantity||0).toString(),
        item.unit,
        (useNetPrices?netLine:grossLine).toFixed(2)+" €",
        (item.vat||0)+"%",
        (item.discount||0)+"%",
        afterGlobal.toFixed(2)+" €"
      ];
    });

    autoTable(pdf, {
      head: [tableColumnHeaders],
      body: tableRows,
      startY: cursorY,
      margin: { left:margin, right:margin },
      headStyles: { fillColor:"#f5f5f5", textColor:"#333", fontSize:10 },
      bodyStyles:{ fontSize:9, textColor:"#333" },
      theme:"striped",
      styles:{ cellPadding:4 },
      columnStyles:{
        0:{ cellWidth:20 },
        1:{ cellWidth:150 },
        2:{ cellWidth:40, halign:"right" },
        3:{ cellWidth:40, halign:"right" },
        4:{ cellWidth:60, halign:"right" },
        5:{ cellWidth:40, halign:"right" },
        6:{ cellWidth:50, halign:"right" },
        7:{ cellWidth:60, halign:"right" },
      },
      willDrawCell: data=> {
        if (data.row.index===tableRows.length-1) {
          const pageCount = pdf.internal.getNumberOfPages();
          for (let i=1; i<=pageCount; i++) {
            pdf.setPage(i).setFontSize(9);
            pdf.text(
              `Page ${i} / ${pageCount}`,
              pageWidth/2,
              pdf.internal.pageSize.getHeight()-20,
              { align:"center" }
            );
          }
        }
      },
      didDrawPage: data=>{
        cursorY = data.cursor.y + 10;
      }
    });

    // (7) DETAILED “FENSTER” BLOCKS
    for (let idx=0; idx<items.length; idx++) {
      const item = items[idx];

      // 7a) Heading bar
      pdf.setDrawColor("#4169E1").setFillColor("#E6E6FA");
      const boxH = 20;
      pdf.rect(margin, cursorY, pageWidth-2*margin, boxH, "FD");
      pdf.setFontSize(10).setTextColor("#000");
      const segW = (pageWidth-2*margin)/4;
      pdf.text(`Fenster 00${idx+1}`, margin+4, cursorY+13);
      pdf.text(`Menge: ${item.quantity}`, margin+segW+4, cursorY+13);
      pdf.text(`System: ${item.system}`, margin+segW*2+4, cursorY+13);
      pdf.text(`Farbe: ${item.colorOuter}`, margin+segW*3+4, cursorY+13);
      cursorY += boxH + 8;

      // 7b) window.svg preview on right
      let previewH = 0;
      const svgUri = svgDataUris[item.id];
      if (svgUri && item.widthMm>0 && item.heightMm>0) {
        const previewW = 80; // pts
        const aspectRatio = item.heightMm / item.widthMm || 1;
        previewH = previewW * aspectRatio;
        try {
          pdf.addImage(
            svgUri,
            "SVG",
            pageWidth-margin-previewW,
            cursorY,
            previewW,
            previewH
          );
        } catch(err){
          console.warn("SVG render failed:", err);
        }
      }

      // 7c) inside/outside images (unchanged) …
      let imageH = 0;
      if (item.images.insideView) {
        try {
          pdf.addImage(item.images.insideView, "JPEG",
            margin, cursorY, 200, 120
          );
          imageH = 120;
        } catch{}
      }
      if (item.images.outsideView) {
        try {
          pdf.addImage(item.images.outsideView, "JPEG",
            pageWidth-margin-200, cursorY, 200, 120
          );
          imageH = Math.max(imageH,120);
        } catch{}
      }

      // advance cursor below tallest graphic
      const graphicHeight = Math.max(previewH, imageH);
      if (graphicHeight>0) {
        cursorY += graphicHeight + 8;
      }

      // 7d) Frame details table (unchanged) …
      const frameRows = [
        ["Rahmen", item.frameType],
        ["Außen Farbe", item.colorOuter],
        ["Innen Farbe", item.colorInner],
        ["Maße", item.frameDimensions],
        ["Furnierfarbe des Rahmens", item.frameVeneerColor],
        ["Furnierfarbe des Flügels",   item.sashVeneerColor],
        ["Farbe des Kerns + Dichtung (Rahmen)", item.coreSealFrame],
        ["Farbe des Kerns + Dichtung (Flügel)", item.coreSealSash],
        ["Schwellentyp HST",          item.thresholdType],
        ["Verschweißungsart",        item.weldingType],
        ["Glazing required",          item.glazing],
        ["Glasleiste",                item.glassHold],
        ["Flügel",                    item.sashType],
        ["Beschlag",                  item.fitting],
        ["  Beschlagsart",            item.fittingType],
        ["  Olive (innen)",           item.handleTypeInner],
        ["  Drückerfarbe innen",      item.handleColorInner],
        ["  Grifffarbe außen",        item.handleColorOuter],
        ["Wärmekoeffizient",          item.UwCoefficient],
        ["Gewichtseinheit",           item.weightUnit],
        ["Umrandung",                 item.perimeter],
      ];

      autoTable(pdf, {
        startY: cursorY,
        margin: { left:margin, right:margin },
        theme: "grid",
        head: [["",""]],
        body: frameRows,
        showHead: false,
        styles:{ fontSize:9, cellPadding:4, textColor:"#333" },
        columnStyles:{
          0:{ cellWidth:150, fontStyle:"bold" },
          1:{ cellWidth:250 }
        },
        tableLineColor:"#4169E1",
        tableLineWidth:0.5,
      });

      cursorY = pdf.lastAutoTable.finalY + 10;

      // 7e) Accessories table (unchanged) …
      if (item.accessories.length) {
        const accRows = item.accessories.map(a=>[
          a.description||a.code,
          (a.qty||0).toString()
        ]);
        autoTable(pdf, {
          startY: cursorY,
          margin:{left:margin, right:margin},
          head:[["Zubehör","Menge"]],
          body:accRows,
          headStyles:{ fillColor:"#F0F8FF", textColor:"#333", fontSize:9 },
          bodyStyles:{ fontSize:9, textColor:"#333" },
          theme:"striped",
          styles:{ cellPadding:4 },
          columnStyles:{ 0:{ cellWidth:350 }, 1:{ cellWidth:60, halign:"right" } }
        });
        cursorY = pdf.lastAutoTable.finalY + 10;
      }

      // 7f) Fillings table (unchanged) …
      if (item.fillings.length) {
        const fillRows = item.fillings.map(f=>{
          const price   = parseFloat(f.price)||0;
          const discPct = parseFloat(f.discountPercent)||0;
          const discVal = price*(discPct/100);
          const total   = price - discVal;
          return [
            f.id,
            f.spec,
            f.dimensions,
            price.toFixed(2)+" €",
            discPct+"%",
            discVal.toFixed(2)+" €",
            total.toFixed(2)+" €"
          ];
        });
        autoTable(pdf, {
          startY: cursorY,
          margin:{left:margin, right:margin},
          head:[["ID","Füllung","Maße","Netto Preis","Disc %","Rabatt","Summe"]],
          body:fillRows,
          headStyles:{ fillColor:"#E6E6FA", textColor:"#333", fontSize:8 },
          bodyStyles:{ fontSize:8, textColor:"#333" },
          theme:"grid",
          styles:{ cellPadding:3 },
          columnStyles:{
            0:{ cellWidth:30, halign:"center" },
            1:{ cellWidth:200 },
            2:{ cellWidth:60, halign:"center" },
            3:{ cellWidth:60, halign:"right" },
            4:{ cellWidth:40, halign:"right" },
            5:{ cellWidth:60, halign:"right" },
            6:{ cellWidth:60, halign:"right" },
          }
        });
        cursorY = pdf.lastAutoTable.finalY + 10;
      }

      // 7g) Fenster total line
      const net         = computeLineTotalNet(item);
      const afterGlobal = net*(1-(parseFloat(totalDiscount)||0)/100);
      const vatAmt      = afterGlobal*((parseFloat(item.vat)||0)/100);
      const grand       = afterGlobal + vatAmt;

      pdf.setFontSize(10).setFont(undefined,"bold");
      pdf.text(
        `Fenster total: ${afterGlobal.toFixed(2)} €  +USt ${vatAmt.toFixed(2)} €  = ${grand.toFixed(2)} €`,
        margin, cursorY
      );
      pdf.setFont(undefined,"normal");
      cursorY += 20;

      // new page if needed
      if (cursorY > pdf.internal.pageSize.getHeight()-80) {
        pdf.addPage();
        cursorY = margin;
      }
    }

    // (8) OVERALL TOTALS
    pdf.setFontSize(10).setTextColor("#000");
    const tx = pageWidth-margin-200;
    let ty = cursorY+20;

    pdf.text(`Subtotal (before discount): ${rawSubtotal.toFixed(2)} €`, tx, ty); ty+=15;
    if (parseFloat(totalDiscount)>0) {
      pdf.text(
        `Global Discount (${totalDiscount}%): -${(rawSubtotal*(totalDiscount/100)).toFixed(2)} €`,
        tx, ty
      );
      ty+=15;
    }
    pdf.text(`Subtotal (after discount): ${subAfterDisc.toFixed(2)} €`, tx, ty); ty+=15;
    if (useNetPrices) {
      pdf.text(`VAT Total: ${totalVAT.toFixed(2)} €`, tx, ty); ty+=15;
    }
    pdf.setFontSize(12).setFont(undefined,"bold");
    pdf.text(`Total: ${grandTotal.toFixed(2)} €`, tx, ty);
    pdf.setFont(undefined,"normal");
    cursorY = ty+40;

    // (9) FOOTER TEXT
    pdf.setFontSize(10).setTextColor("#333");
    const footerLines = pdf.splitTextToSize(footerText, pageWidth- margin*2);
    pdf.text(footerLines, margin, cursorY);
    cursorY += footerLines.length*12 + 20;

    // (10) MORE OPTIONS SUMMARY
    pdf.setFontSize(9).setTextColor("#555");
    pdf.text("----- More Options -----", margin, cursorY);
    cursorY += 12;
    pdf.text(`Currency: ${currency}`, margin, cursorY); cursorY+=12;
    pdf.text(`Internal Contact: ${internalContact}`, margin, cursorY); cursorY+=12;
    pdf.text(`Delivery Conditions: ${deliveryConditions}`, margin, cursorY); cursorY+=12;
    pdf.text(`Payment Terms: ${paymentTerms}`, margin, cursorY); cursorY+=12;
    pdf.text(`VAT Regulation: ${vatRegulation}`, margin, cursorY); cursorY+=12;

    let vatLine = "";
    if (salesSubjectToVAT) vatLine = "Sales subject to VAT";
    if (taxFree)            vatLine = "Tax-free sales (§4 UStG)";
    if (reverseCharge)      vatLine = "Reverse charge (§13b UStG)";
    pdf.text(`VAT Option: ${vatLine}`, margin, cursorY);

    // (11) SAVE
    pdf.save(`Angebot-${offerNumber||"new"}.pdf`);
  };

  // 9) FORM SUBMIT
  const handleSubmitForm = async e => {
    e.preventDefault();
    if (!contactName.trim() || !offerNumber.trim()) {
      alert("Bitte Kontaktname und Angebotsnummer angeben.");
      return;
    }
    const validItems = items.filter(it=>
      it.productName.trim() &&
      parseFloat(it.quantity)>0 &&
      parseFloat(it.unitPrice)>=0
    );
    if (validItems.length===0) {
      alert("Bitte mindestens ein Produkt auswählen, mit Menge>0 und Preis.");
      return;
    }
    await generatePDF();
  };

  if (profileLoading||catalogLoading) {
    return (
      <div className="offer-form-page">
        <NavBar/>
        <p>Loading…</p>
      </div>
    );
  }

  return (
    <div className="offer-form-page">
      <NavBar/>

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
              {companyProfile.name||"Your Company Name"}
            </h3>
            <p className="company-address">
              {companyProfile.street}, {companyProfile.zipCity}, {companyProfile.country}
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
        {/* … your sections 1 & 2 as before … */}

        {/* SECTION 3: PRODUCTS */}
        <section className="section products-section">
          <div className="section-header">PRODUCTS</div>

          {/* Net/Gross Toggle */}
          <div className="net-gross-toggle">
            <button
              type="button"
              className={`toggle-btn ${useNetPrices?"active":""}`}
              onClick={toggleNetGross}
            >Net</button>
            <button
              type="button"
              className={`toggle-btn ${!useNetPrices?"active":""}`}
              onClick={toggleNetGross}
            >Gross</button>
          </div>

          {/* Table Header */}
          <div className="products-table-header">
            <div className="col col-index">#</div>
            <div className="col col-product">Product / service</div>
            <div className="col col-qty">Qty</div>
            <div className="col col-unit">Unit</div>
            <div className="col col-price">
              Price ({useNetPrices?"net":"brutto"})
            </div>
            <div className="col col-vat">USt.</div>
            <div className="col col-discount">Disc. (%)</div>
            <div className="col col-amount">Amount</div>
            <div className="col col-preview">Preview</div>
            <div className="col col-action"></div>
          </div>

          {/* Item Rows + SVG Preview */}
          {items.map((item, idx)=>(
            <React.Fragment key={item.id}>
              <ProductRow
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
              {item.windowSvgUrl && (
                <div className="row-preview">
                  <WindowPreview
                    widthMm={item.widthMm}
                    heightMm={item.heightMm}
                    svgUrl={item.windowSvgUrl}
                  />
                </div>
              )}
            </React.Fragment>
          ))}

          {/* Footer Links */}
          <div className="products-footer-links">
            <button type="button" className="add-link" onClick={handleAddItem}>
              + Add position
            </button>
            <button
              type="button"
              className="add-link"
              onClick={()=>setTotalDiscount(0)}
            >
              + Reset global discount
            </button>
          </div>

          {/* Global Discount */}
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
              onChange={e=>setTotalDiscount(e.target.value)}
            />
          </div>

          {/* Totals */}
          <div className="totals-area">
            <div className="totals-row">
              <div className="totals-label">
                Subtotal (before discount):
              </div>
              <div className="totals-value">
                {computeSubTotal().toFixed(2)} €
              </div>
            </div>
            {parseFloat(totalDiscount)>0 && (
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
                ).toFixed(2)} €
              </div>
            </div>
          </div>
        </section>

        {/* … sections 4 & 5 & submit remain the same … */}

        {/* SECTION 4: FOOTER TEXT */}
        <section className="section footer-text">
          <div className="section-header">FOOTER TEXT</div>
          <textarea
            className="textarea full-width"
            rows={5}
            value={footerText}
            onChange={e=>setFooterText(e.target.value)}
          />
        </section>

        {/* SECTION 5: MORE OPTIONS */}
        <section className="section more-options">
          <div className="section-header">
            MORE OPTIONS
            <button
              type="button"
              className="toggle-more"
              onClick={()=>setShowMoreOptions(p=>!p)}
            >
              {showMoreOptions?"Hide more options":"Show more options"}
            </button>
          </div>

          {showMoreOptions && (
            <div className="extra-options">
              {/* currency, internal contact, delivery, payment, VAT regs */}
              {/* identical to your previous code */}
            </div>
          )}
        </section>

        {/* SUBMIT */}
        <div className="form-actions">
          <button type="submit" className="btn-primary">
            Save & Generate PDF
          </button>
        </div>
      </form>
    </div>
  );
}
