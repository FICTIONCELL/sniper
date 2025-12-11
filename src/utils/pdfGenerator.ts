import jsPDF from 'jspdf';

interface PVData {
  pvNumber: string;
  date: string;
  title: string;
  projectName: string;
  description: string;
  qrCodeDataUrl?: string;
  companyLogo?: string;
  details?: Array<{
    label: string;
    value: string;
  }>;
}

export const generatePVPDF = (data: PVData, language = 'fr'): jsPDF => {
  const doc = new jsPDF();

  // Set font to support Unicode (for Arabic)
  try {
    doc.setFont('helvetica');
  } catch (error) {
    console.warn('Font setting failed, using default');
  }

  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  let yPosition = 20;

  // Translations
  const translations = {
    fr: {
      title: 'PROCÈS-VERBAL',
      pvNumber: 'N° PV',
      date: 'Date',
      project: 'Projet',
      description: 'Description',
      details: 'Détails',
      generatedOn: 'Généré le',
      qrCode: 'Code QR'
    },
    en: {
      title: 'MINUTES',
      pvNumber: 'PV Number',
      date: 'Date',
      project: 'Project',
      description: 'Description',
      details: 'Details',
      generatedOn: 'Generated on',
      qrCode: 'QR Code'
    },
    ar: {
      title: 'محضر اجتماع',
      pvNumber: 'رقم المحضر',
      date: 'التاريخ',
      project: 'المشروع',
      description: 'الوصف',
      details: 'التفاصيل',
      generatedOn: 'تم إنشاؤه في',
      qrCode: 'رمز الاستجابة السريعة'
    },
    es: {
      title: 'ACTA',
      pvNumber: 'N° Acta',
      date: 'Fecha',
      project: 'Proyecto',
      description: 'Descripción',
      details: 'Detalles',
      generatedOn: 'Generado el',
      qrCode: 'Código QR'
    }
  };

  const t = translations[language as keyof typeof translations] || translations.fr;

  // Add Company Logo if present
  if (data.companyLogo) {
    try {
      const logoWidth = 40;
      const logoHeight = 20; // Aspect ratio might need adjustment or auto-calculation
      doc.addImage(data.companyLogo, 'PNG', 20, 10, logoWidth, logoHeight, undefined, 'FAST');
      // Adjust yPosition if logo is present, but title is centered so maybe just ensure no overlap
    } catch (error) {
      console.error('Error adding company logo to PDF:', error);
    }
  }

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(t.title, pageWidth / 2, yPosition + 10, { align: 'center' });
  yPosition += 30;

  // PV Info
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');

  // PV Number and Date
  doc.text(`${t.pvNumber}: ${data.pvNumber}`, 20, yPosition);
  doc.text(`${t.date}: ${data.date}`, 120, yPosition);
  yPosition += 15;

  // Project
  doc.setFont('helvetica', 'bold');
  doc.text(`${t.project}:`, 20, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(data.projectName, 60, yPosition);
  yPosition += 15;

  // Title
  doc.setFont('helvetica', 'bold');
  doc.text(data.title, 20, yPosition);
  yPosition += 20;

  // Description
  doc.setFont('helvetica', 'bold');
  doc.text(`${t.description}:`, 20, yPosition);
  yPosition += 10;

  doc.setFont('helvetica', 'normal');
  const descriptionLines = doc.splitTextToSize(data.description, pageWidth - 40);
  doc.text(descriptionLines, 20, yPosition);
  yPosition += descriptionLines.length * 7 + 15;

  // Details section
  if (data.details && data.details.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.text(`${t.details}:`, 20, yPosition);
    yPosition += 10;

    doc.setFont('helvetica', 'normal');
    data.details.forEach(detail => {
      doc.text(`• ${detail.label}: ${detail.value}`, 25, yPosition);
      yPosition += 8;
    });
    yPosition += 10;
  }

  // QR Code
  if (data.qrCodeDataUrl) {
    try {
      const qrSize = 30; // Taille du QR code
      const qrXPosition = pageWidth - qrSize - 30;
      const qrYPosition = pageHeight - qrSize - 20; // Positionner le QR code plus bas, dans la marge
      doc.addImage(data.qrCodeDataUrl, 'PNG', qrXPosition, qrYPosition, qrSize, qrSize);
    } catch (error) {
      console.error('Error adding QR code to PDF:', error);
    }
  }

  // Footer
  const footerY = pageHeight - 20;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.text(`${t.generatedOn} ${new Date().toLocaleString(language === 'ar' ? 'ar-SA' : language)}`, pageWidth / 2, footerY, { align: 'center' });

  // Page border
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

  return doc;
};

export const downloadPVPDF = (data: PVData, language = 'fr') => {
  const doc = generatePVPDF(data, language);
  const filename = `PV_${data.pvNumber}_${data.date.replace(/\//g, '-')}.pdf`;
  doc.save(filename);
};

export const printPVPDF = (data: PVData, language = 'fr') => {
  const doc = generatePVPDF(data, language);

  // Create blob and open in new window for printing
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);

  const printWindow = window.open(pdfUrl, '_blank');
  if (printWindow) {
    printWindow.onload = () => {
      printWindow.print();
    };
  }
};