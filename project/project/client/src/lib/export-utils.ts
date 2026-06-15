/**
 * UTILITÁRIOS DE EXPORTAÇÃO
 * Exportar dados em CSV, JSON e PDF
 */

interface ExportOptions {
  filename?: string;
  dateRange?: { from: Date; to: Date };
  metadata?: Record<string, any>;
}

/**
 * Exportar para CSV
 */
export function exportToCSV(
  data: Record<string, any>[],
  options: ExportOptions = {}
) {
  if (data.length === 0) {
    console.warn('Nenhum dado para exportar');
    return;
  }

  const { filename = 'dados.csv', dateRange, metadata } = options;

  // Headers
  const headers = Object.keys(data[0]);
  const csvContent = [
    // Metadados (comentários)
    metadata ? `# Exportado em: ${new Date().toLocaleString('pt-BR')}` : '',
    metadata && dateRange ? `# Período: ${dateRange.from.toLocaleDateString('pt-BR')} - ${dateRange.to.toLocaleDateString('pt-BR')}` : '',
    metadata ? `# Total de registros: ${data.length}` : '',
    '',
    // Headers
    headers.map(h => `"${h}"`).join(','),
    // Dados
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) return '""';
        if (typeof value === 'string' && value.includes(',')) return `"${value.replace(/"/g, '""')}"`;
        return `"${value}"`;
      }).join(',')
    ),
  ].filter(Boolean).join('\n');

  downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
}

/**
 * Exportar para JSON
 */
export function exportToJSON(
  data: Record<string, any>[],
  options: ExportOptions = {}
) {
  const { filename = 'dados.json', dateRange, metadata } = options;

  const exportData = {
    metadata: {
      exportedAt: new Date().toISOString(),
      totalRecords: data.length,
      dateRange: dateRange ? {
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString(),
      } : null,
      ...metadata,
    },
    data,
  };

  const jsonContent = JSON.stringify(exportData, null, 2);
  downloadFile(jsonContent, filename, 'application/json;charset=utf-8;');
}

/**
 * Exportar para PDF (usando biblioteca externa)
 */
export async function exportToPDF(
  data: Record<string, any>[],
  title: string = 'Relatório',
  options: ExportOptions = {}
) {
  try {
    // Importar dinamicamente para não aumentar bundle
    const { jsPDF } = await import('jspdf');
    const { autoTable } = await import('jspdf-autotable');

    const { filename = 'relatorio.pdf', dateRange, metadata } = options;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Título
    doc.setFontSize(16);
    doc.text(title, pageWidth / 2, 15, { align: 'center' });

    // Metadados
    doc.setFontSize(10);
    let yPosition = 25;

    if (dateRange) {
      doc.text(
        `Período: ${dateRange.from.toLocaleDateString('pt-BR')} - ${dateRange.to.toLocaleDateString('pt-BR')}`,
        15,
        yPosition
      );
      yPosition += 7;
    }

    doc.text(`Exportado em: ${new Date().toLocaleString('pt-BR')}`, 15, yPosition);
    doc.text(`Total de registros: ${data.length}`, 15, yPosition + 7);

    // Tabela
    autoTable(doc, {
      head: [Object.keys(data[0] || {})],
      body: data.map(row => Object.values(row)),
      startY: yPosition + 15,
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [139, 92, 246], // Purple
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [248, 248, 248],
      },
    });

    doc.save(filename);
  } catch (error) {
    console.error('Erro ao exportar PDF:', error);
    alert('Erro ao exportar PDF. Tente exportar como JSON ou CSV.');
  }
}

/**
 * Exportar gráfico como imagem
 */
export async function exportChartAsImage(
  chartRef: HTMLElement,
  filename: string = 'grafico.png'
) {
  try {
    const html2canvas = (await import('html2canvas')).default;

    const canvas = await html2canvas(chartRef, {
      backgroundColor: '#0f172a', // Slate-950
      scale: 2,
    });

    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error) {
    console.error('Erro ao exportar gráfico:', error);
    alert('Erro ao exportar gráfico como imagem.');
  }
}

/**
 * Download genérico de arquivo - SEGURO contra removeChild errors
 */
function downloadFile(content: string, filename: string, mimeType: string) {
  let link: HTMLAnchorElement | null = null;
  let url: string | null = null;

  try {
    const blob = new Blob([content], { type: mimeType });
    url = URL.createObjectURL(blob);
    link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
  } catch (error) {
    console.error('Erro ao baixar arquivo:', error);
  } finally {
    // Remover link usando remove() em vez de removeChild
    if (link) {
      try {
        link.remove();
      } catch (e) {
        console.warn('Failed to remove download link:', e);
      }
    }

    // Revogar URL de forma segura
    if (url) {
      try {
        URL.revokeObjectURL(url);
      } catch (e) {
        console.warn('Failed to revoke object URL:', e);
      }
    }
  }
}

/**
 * Gerar nome de arquivo com data
 */
export function generateFilename(prefix: string, extension: string): string {
  const date = new Date().toISOString().split('T')[0];
  const time = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
  return `${prefix}_${date}_${time}.${extension}`;
}

/**
 * Formatar dados para exportação
 */
export function formatDataForExport(
  data: Record<string, any>[],
  dateFormat: 'iso' | 'br' = 'br'
): Record<string, any>[] {
  return data.map(row => {
    const formatted: Record<string, any> = {};

    Object.entries(row).forEach(([key, value]) => {
      if (value instanceof Date) {
        formatted[key] = dateFormat === 'br'
          ? value.toLocaleDateString('pt-BR')
          : value.toISOString();
      } else if (typeof value === 'number') {
        formatted[key] = Number(value.toFixed(2));
      } else {
        formatted[key] = value;
      }
    });

    return formatted;
  });
}
