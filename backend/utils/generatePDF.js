import PDFDocument from "pdfkit";

const currency = (value) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(value || 0);

const generatePDF = (res, { month, year, expenses }) => {
  const doc = new PDFDocument({ margin: 40, size: "A4" });
  doc.pipe(res);

  doc.fontSize(20).text("Expense AI Monthly Report", { align: "center" });
  doc.moveDown(0.5);
  doc.fontSize(12).text(`Month: ${month} / ${year}`, { align: "center" });
  doc.moveDown(1);

  let total = 0;
  expenses.forEach((expense) => {
    total += expense.amount || 0;
    doc
      .fontSize(10)
      .text(
        `${new Date(expense.date).toLocaleDateString()} - ${expense.title} - ${expense.category} - ${currency(
          expense.amount
        )}`
      );
  });

  doc.moveDown(1);
  doc.fontSize(12).text(`Total: ${currency(total)}`);

  doc.end();
};

export default generatePDF;
