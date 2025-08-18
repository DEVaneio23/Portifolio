// Gerador de PDF simples — RangeClub Demo
(function() {
  'use strict';

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function exportAsTxtFallback(lines, fileName) {
    const content = lines.join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    downloadBlob(blob, fileName.replace(/\.pdf$/i, '') + '.txt');
    return { success: true, message: 'Exportado como .txt (fallback DEMO)' };
  }

  class PDFGenerator {
    // Gera um "PDF" simplificado: aqui usamos TXT como fallback para evitar dependências
    generateDailySalesPDF(vendas, data) {
      try {
        const d = data || new Date();
        const header = `Relatório de Vendas (Dia) — ${d.toLocaleDateString('pt-BR')}`;
        const lines = [header, ''.padEnd(header.length, '=')];
        let total = 0;
        vendas.forEach((v) => {
          const valor = Number(v.total || 0);
          total += valor;
          lines.push(`#${v.id}\t${v.cliente_nome || v.cliente?.nome || 'N/A'}\tR$ ${valor.toFixed(2)}`);
        });
        lines.push('');
        lines.push(`Total: R$ ${total.toFixed(2)}`);
        return exportAsTxtFallback(lines, 'relatorio_vendas_dia.pdf');
      } catch (error) {
        return { success: false, error: error.message };
      }
    }

    generatePeriodSalesPDF(vendas, inicio, fim) {
      try {
        const header = `Relatório de Vendas (Período) — ${new Date(inicio).toLocaleDateString('pt-BR')} a ${new Date(fim).toLocaleDateString('pt-BR')}`;
        const lines = [header, ''.padEnd(header.length, '=')];
        let total = 0;
        vendas.forEach((v) => {
          const valor = Number(v.total || 0);
          total += valor;
          lines.push(`#${v.id}\t${v.cliente_nome || v.cliente?.nome || 'N/A'}\tR$ ${valor.toFixed(2)}`);
        });
        lines.push('');
        lines.push(`Total: R$ ${total.toFixed(2)}`);
        return exportAsTxtFallback(lines, 'relatorio_vendas_periodo.pdf');
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  }

  window.PDFGenerator = PDFGenerator;
})();


