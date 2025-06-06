// src/components/PdfDocument.jsx
import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from "@react-pdf/renderer";

// (Optional) Register a font if you need a custom typeface
// Font.register({ family: "Roboto", src: "/assets/fonts/Roboto-Regular.ttf" });

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 12,
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 20,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
  },
  section: {
    marginBottom: 10,
  },
  table: {
    display: "table",
    width: "auto",
    marginVertical: 10,
  },
  tableRow: {
    flexDirection: "row",
  },
  tableColHeader: {
    width: "20%",
    borderStyle: "solid",
    borderBottomWidth: 1,
    borderColor: "#000",
    padding: 4,
  },
  tableCol: {
    width: "20%",
    borderStyle: "solid",
    borderBottomWidth: 1,
    borderColor: "#ddd",
    padding: 4,
  },
  tableCellHeader: {
    fontSize: 12,
    fontWeight: "bold",
  },
  tableCell: {
    fontSize: 10,
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
  },
  totalsLabel: {
    width: "60%",
    textAlign: "right",
    paddingRight: 10,
  },
  totalsValue: {
    width: "20%",
    textAlign: "right",
  },
});

const PdfDocument = ({ formValues, totals }) => {
  const {
    customerName,
    contactInfo,
    deliveryAddress,
    expirationDate,
    notes,
    items,
    deliveryFee,
    installationFee,
    discount,
  } = formValues;

  const { subTotal, vat, total } = totals;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <Text style={styles.header}>Offer Document</Text>

        {/* Customer Info */}
        <View style={styles.section}>
          <Text>Customer: {customerName}</Text>
          <Text>Contact: {contactInfo}</Text>
          <Text>Delivery Address: {deliveryAddress}</Text>
          <Text>Expires On: {expirationDate}</Text>
        </View>

        {/* Table of items */}
        <View style={styles.table}>
          {/* Table Header Row */}
          <View style={styles.tableRow}>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCellHeader}>Type</Text>
            </View>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCellHeader}>Description</Text>
            </View>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCellHeader}>Qty</Text>
            </View>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCellHeader}>Unit Price</Text>
            </View>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCellHeader}>Line Total</Text>
            </View>
          </View>
          {/* Table Data Rows */}
          {items.map((item, idx) => {
            const lineTotal = item.quantity * item.unitPrice;
            return (
              <View style={styles.tableRow} key={idx}>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>{item.type}</Text>
                </View>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>{item.description}</Text>
                </View>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>{item.quantity}</Text>
                </View>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>
                    {item.unitPrice.toFixed(2)} €
                  </Text>
                </View>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>
                    {lineTotal.toFixed(2)} €
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Totals Section */}
        <View style={styles.totalsRow}>
          <Text style={styles.totalsLabel}>Subtotal:</Text>
          <Text style={styles.totalsValue}>{subTotal.toFixed(2)} €</Text>
        </View>
        <View style={styles.totalsRow}>
          <Text style={styles.totalsLabel}>VAT (19%):</Text>
          <Text style={styles.totalsValue}>{vat.toFixed(2)} €</Text>
        </View>
        <View style={styles.totalsRow}>
          <Text style={styles.totalsLabel}>Delivery Fee:</Text>
          <Text style={styles.totalsValue}>{deliveryFee.toFixed(2)} €</Text>
        </View>
        <View style={styles.totalsRow}>
          <Text style={styles.totalsLabel}>Installation Fee:</Text>
          <Text style={styles.totalsValue}>{installationFee.toFixed(2)} €</Text>
        </View>
        <View style={styles.totalsRow}>
          <Text style={styles.totalsLabel}>Discount:</Text>
          <Text style={styles.totalsValue}>−{discount.toFixed(2)} €</Text>
        </View>
        <View style={styles.totalsRow}>
          <Text style={styles.totalsLabel}>Grand Total:</Text>
          <Text style={styles.totalsValue}>{total.toFixed(2)} €</Text>
        </View>

        {/* Notes / Footer */}
        <View style={styles.section}>
          <Text>Notes: {notes}</Text>
        </View>
      </Page>
    </Document>
  );
};

export default PdfDocument;
