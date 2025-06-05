// src/components/OfferPdf.jsx
import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// --------------------------------------------------------------------------------------------------
// 1) Register a font if you need a custom font. Otherwise, you can use the default “Helvetica”
// If your sample PDF uses a specific font (e.g., Arial, Roboto), you can embed it here.
// --------------------------------------------------------------------------------------------------
/*
Font.register({
  family: "Arial",
  src: "/path/to/Arial.ttf",
});
*/

// --------------------------------------------------------------------------------------------------
// 2) Define all the styles (mimicking the exact measurements of the sample PDF).
//    We want margins, paddings, font sizes, table column widths, etc., to line up pixel-perfectly.
// --------------------------------------------------------------------------------------------------
const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 40,
    lineHeight: 1.2,
    // size “A4” by default; if you need a custom size: size: [595.28, 841.89],
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  logo: {
    width: 120,
    height: 40,
    objectFit: "contain",
  },
  companyInfo: {
    textAlign: "right",
    fontSize: 9,
    lineHeight: 1.2,
  },
  titleContainer: {
    marginBottom: 15,
  },
  titleText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  offerMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
  },
  offerMetaLeft: {
    flexDirection: "column",
  },
  offerMetaRight: {
    flexDirection: "column",
    textAlign: "right",
    fontSize: 10,
  },
  customerSection: {
    marginTop: 20,
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  customerBox: {
    fontSize: 10,
    lineHeight: 1.2,
  },
  tableContainer: {
    flexDirection: "column",
    borderWidth: 1,
    borderColor: "#000",
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#E8E8E8",
    borderBottomWidth: 1,
    borderColor: "#000",
    alignItems: "center",
    height: 24,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#E8E8E8",
    alignItems: "center",
    height: 22,
  },
  tableCellPos: {
    width: "5%",
    textAlign: "center",
    fontSize: 9,
  },
  tableCellDescription: {
    width: "35%",
    paddingLeft: 4,
    fontSize: 9,
  },
  tableCellDimensions: {
    width: "15%",
    textAlign: "center",
    fontSize: 9,
  },
  tableCellColor: {
    width: "10%",
    textAlign: "center",
    fontSize: 9,
  },
  tableCellQty: {
    width: "10%",
    textAlign: "center",
    fontSize: 9,
  },
  tableCellUnitPrice: {
    width: "12%",
    textAlign: "right",
    paddingRight: 4,
    fontSize: 9,
  },
  tableCellTotalPrice: {
    width: "13%",
    textAlign: "right",
    paddingRight: 4,
    fontSize: 9,
  },
  summaryContainer: {
    marginTop: 5,
    marginRight: 0,
    flexDirection: "column",
    alignItems: "flex-end",
    fontSize: 10,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "40%", // width of the summary block
    fontSize: 10,
    marginBottom: 2,
  },
  summaryLabel: {
    textAlign: "left",
  },
  summaryValue: {
    textAlign: "right",
  },
  vatLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "40%",
    fontSize: 10,
    marginBottom: 2,
    fontWeight: "bold",
  },
  totalLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "40%",
    fontSize: 12,
    marginTop: 4,
    marginBottom: 12,
    fontWeight: "bold",
  },
  terms: {
    fontSize: 9,
    marginTop: 10,
    lineHeight: 1.2,
  },
  footer: {
    position: "absolute",
    fontSize: 8,
    bottom: 20,
    left: 40,
    right: 40,
    textAlign: "center",
    color: "#555",
  },
});

// --------------------------------------------------------------------------------------------------
// 3) Helper functions: calculate line totals, subtotals, VAT, etc.
// --------------------------------------------------------------------------------------------------
const calculateLineTotal = (item) => {
  return item.unitPrice * item.quantity;
};

const calculateSubTotal = (items) => {
  return items.reduce((sum, it) => sum + calculateLineTotal(it), 0);
};

const calculateExtrasTotal = (extras) => {
  // extras.deliveryFee + extras.installationFee − extras.discount
  return (extras.deliveryFee || 0) + (extras.installationFee || 0) - (extras.discount || 0);
};

const calculateVAT = (amount, rate = 0.19) => {
  return amount * rate;
};

// --------------------------------------------------------------------------------------------------
// 4) The actual Document component.
//    We’ll break it into logical pieces: Header, Customer Info, Items Table, Summary, Terms, Footer.
// --------------------------------------------------------------------------------------------------
const OfferPdf = ({ data }) => {
  // Destructure all fields from data
  const {
    offerNumber,
    offerDate,
    customer,
    items,
    extras,
    terms,
    expirationDate,
    company,
  } = data;

  // 4.a) Pre-calc numbers
  const subTotal = calculateSubTotal(items);
  const extrasTotal = calculateExtrasTotal(extras);
  const netBeforeVAT = subTotal + extrasTotal; // if discount is negative, it’s already subtracted in extrasTotal
  const vatAmount = calculateVAT(netBeforeVAT, 0.19);
  const grandTotal = netBeforeVAT + vatAmount;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ---------------------------- */}
        {/* HEADER: Logo (left), Company Info (right) */}
        {/* ---------------------------- */}
        <View style={styles.headerContainer}>
          <View>
            <Image
              style={styles.logo}
              src={data.company.logoUrl || "/logo.png"}
            />
          </View>
          <View style={styles.companyInfo}>
            <Text>{company.name}</Text>
            <Text>{company.addressLine1}</Text>
            <Text>{company.addressLine2}</Text>
            <Text>Tel: {company.phone}</Text>
            <Text>{company.email}</Text>
            <Text>{company.website}</Text>
            <Text>{company.taxId}</Text>
          </View>
        </View>

        {/* ---------------------------- */}
        {/* TITLE and OFFER META */}
        {/* ---------------------------- */}
        <View style={styles.titleContainer}>
          <Text style={styles.titleText}>Angebot</Text>
          <View style={styles.offerMeta}>
            <View style={styles.offerMetaLeft}>
              <Text>Angebotsnummer:</Text>
              <Text>Angebotsdatum:</Text>
            </View>
            <View style={styles.offerMetaRight}>
              <Text>{offerNumber}</Text>
              <Text>{offerDate}</Text>
            </View>
          </View>
        </View>

        {/* ---------------------------- */}
        {/* CUSTOMER INFO */}
        {/* ---------------------------- */}
        <View style={styles.customerSection}>
          <View style={styles.customerBox}>
            <Text>
              {customer.name}
            </Text>
            <Text>{customer.company}</Text>
            <Text>{customer.addressLine1}</Text>
            <Text>{customer.addressLine2}</Text>
            <Text>{customer.email}</Text>
            <Text>{customer.phone}</Text>
          </View>
          <View style={styles.customerBox}>
            {/* Optionally, you can repeat your company address on the right if needed */}
          </View>
        </View>

        {/* ---------------------------- */}
        {/* ITEMS TABLE */}
        {/* ---------------------------- */}
        <View style={styles.tableContainer}>
          {/* Header Row */}
          <View style={styles.tableHeader}>
            <Text style={styles.tableCellPos}>Pos.</Text>
            <Text style={styles.tableCellDescription}>Bezeichnung</Text>
            <Text style={styles.tableCellDimensions}>Breite × Höhe (mm)</Text>
            <Text style={styles.tableCellColor}>Farbe</Text>
            <Text style={styles.tableCellQty}>Menge</Text>
            <Text style={styles.tableCellUnitPrice}>Einzelpreis (€)</Text>
            <Text style={styles.tableCellTotalPrice}>Gesamt (€)</Text>
          </View>

          {/* Each item row */}
          {items.map((item, idx) => {
            const lineTotal = calculateLineTotal(item).toFixed(2);
            return (
              <View style={styles.tableRow} key={idx}>
                <Text style={styles.tableCellPos}>{item.pos}</Text>
                <Text style={styles.tableCellDescription}>{item.description}</Text>
                <Text style={styles.tableCellDimensions}>
                  {item.width}×{item.height}
                </Text>
                <Text style={styles.tableCellColor}>{item.color}</Text>
                <Text style={styles.tableCellQty}>{item.quantity}</Text>
                <Text style={styles.tableCellUnitPrice}>
                  {item.unitPrice.toFixed(2)}
                </Text>
                <Text style={styles.tableCellTotalPrice}>{lineTotal}</Text>
              </View>
            );
          })}
        </View>

        {/* ---------------------------- */}
        {/* SUMMARY (Subtotal, Extras, VAT, Grand Total) */}
        {/* ---------------------------- */}
        <View style={styles.summaryContainer}>
          {/* Subtotal */}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Zwischensumme:</Text>
            <Text style={styles.summaryValue}>
              {subTotal.toFixed(2)} €
            </Text>
          </View>
          {/* Delivery Fee */}
          {extras.deliveryFee != null && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Lieferung:</Text>
              <Text style={styles.summaryValue}>
                {extras.deliveryFee.toFixed(2)} €
              </Text>
            </View>
          )}
          {/* Installation Fee */}
          {extras.installationFee != null && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Montage:</Text>
              <Text style={styles.summaryValue}>
                {extras.installationFee.toFixed(2)} €
              </Text>
            </View>
          )}
          {/* Discount */}
          {extras.discount != null && extras.discount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Rabatt:</Text>
              <Text style={styles.summaryValue}>
                -{extras.discount.toFixed(2)} €
              </Text>
            </View>
          )}
          {/* Net before VAT (automatically included) */}
          <View style={styles.vatLine}>
            <Text>Netto-Betrag (vor USt 19%):</Text>
            <Text>{(netBeforeVAT).toFixed(2)} €</Text>
          </View>
          {/* VAT line */}
          <View style={styles.vatLine}>
            <Text>USt 19%:</Text>
            <Text>{vatAmount.toFixed(2)} €</Text>
          </View>
          {/* Grand Total */}
          <View style={styles.totalLine}>
            <Text>Gesamtbetrag:</Text>
            <Text>{grandTotal.toFixed(2)} €</Text>
          </View>
        </View>

        {/* ---------------------------- */}
        {/* TERMS & Notes */}
        {/* ---------------------------- */}
        <Text style={styles.terms}>{terms}</Text>
        <Text style={styles.terms}>
          Gültig bis: {expirationDate}
        </Text>

        {/* ---------------------------- */}
        {/* FOOTER: Company Small Print */}
        {/* ---------------------------- */}
        <Text style={styles.footer}>
          {company.name} • {company.addressLine1}, {company.addressLine2} •
          Tel: {company.phone} • {company.email} • {company.website} • {company.taxId}
        </Text>
      </Page>
    </Document>
  );
};

export default OfferPdf;
