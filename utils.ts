import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Invoice } from './types';

export const formatCurrency = (amount: number, currency: string = 'IDR', locale: string = 'id-ID') => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Simple Terbilang (Number to Words) for Indonesian
// Handles up to Billions roughly for demo purposes
export const terbilang = (nilai: number): string => {
  const angka = Math.abs(nilai);
  const huruf = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];
  let temp = "";

  if (nilai < 0) {
    return "Minus " + terbilang(Math.abs(nilai));
  }

  if (nilai < 12) {
    temp = " " + huruf[Math.floor(nilai)];
  } else if (nilai < 20) {
    temp = terbilang(nilai - 10) + " Belas";
  } else if (nilai < 100) {
    temp = terbilang(Math.floor(nilai / 10)) + " Puluh" + terbilang(nilai % 10);
  } else if (nilai < 200) {
    temp = " Seratus" + terbilang(nilai - 100);
  } else if (nilai < 1000) {
    temp = terbilang(Math.floor(nilai / 100)) + " Ratus" + terbilang(nilai % 100);
  } else if (nilai < 2000) {
    temp = " Seribu" + terbilang(nilai - 1000);
  } else if (nilai < 1000000) {
    temp = terbilang(Math.floor(nilai / 1000)) + " Ribu" + terbilang(nilai % 1000);
  } else if (nilai < 1000000000) {
    temp = terbilang(Math.floor(nilai / 1000000)) + " Juta" + terbilang(nilai % 1000000);
  } else if (nilai < 1000000000000) {
    temp = terbilang(Math.floor(nilai / 1000000000)) + " Milyar" + terbilang(nilai % 1000000000);
  }

  return temp.trim();
};

export const generatePDF = async (elementId: string, fileName: string) => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with ID ${elementId} not found`);
    return;
  }

  // Hide all elements with 'no-print' class before capturing
  const noPrintElements = document.querySelectorAll('.no-print');
  const originalDisplays: string[] = [];

  try {
    noPrintElements.forEach((el, index) => {
      const htmlEl = el as HTMLElement;
      originalDisplays[index] = htmlEl.style.display;
      htmlEl.style.display = 'none';
    });

    // Use a reasonable scale for good quality without exploding memory
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    if (canvas.width === 0 || canvas.height === 0) {
      console.error("Canvas generation failed: 0 dimensions");
      alert("Failed to capture invoice image. Please ensure the invoice is visible.");
      return;
    }

    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    // Initialize jsPDF with proper configuration
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    // First page
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Additional pages if content overflows.
    // We use a tolerance of 2mm (~7-8px) to prevent a new page if the overflow is microscopic
    // which often happens due to floating point math in canvas scaling.
    while (heightLeft >= 2) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`${fileName}.pdf`);
  } catch (err) {
    console.error("PDF Generation Error:", err);
    alert("Failed to generate PDF. Please check console for details.");
  } finally {
    // Always restore visibility of hidden elements, even if there was an error
    noPrintElements.forEach((el, index) => {
      const htmlEl = el as HTMLElement;
      htmlEl.style.display = originalDisplays[index];
    });
  }
};

export const generateCSV = (invoices: Invoice[]) => {
  // Define CSV Headers
  const headers = [
    "Invoice Number",
    "Date",
    "Due Date",
    "Sender Name",
    "Client Name",
    "Client Email",
    "Currency",
    "Subtotal",
    "Tax Rate (%)",
    "Tax Amount",
    "Grand Total",
    "Status",
    "Notes"
  ];

  // Map Data to CSV Rows
  const rows = invoices.map(inv => {
    const subtotal = inv.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const taxAmount = (subtotal * inv.settings.taxRate) / 100;
    const total = subtotal + taxAmount;

    // Helper to escape commas and quotes in text fields
    const safe = (text: string) => `"${(text || "").replace(/"/g, '""')}"`;

    return [
      safe(inv.invoiceNumber),
      safe(inv.date),
      safe(inv.dueDate),
      safe(inv.sender.name),
      safe(inv.receiver.name),
      safe(inv.receiver.email),
      safe(inv.settings.currency),
      subtotal.toFixed(2), // Raw number for Excel calculation
      inv.settings.taxRate,
      taxAmount.toFixed(2),
      total.toFixed(2),
      safe(inv.status),
      safe(inv.notes)
    ].join(",");
  });

  // Combine Headers and Rows
  const csvContent = [headers.join(","), ...rows].join("\n");

  // Create Blob and Trigger Download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `invoice_history_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};