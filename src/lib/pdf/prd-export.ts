// ============================================
// PRD EXPORT TO PDF
// ============================================

import { PRDDocument } from '@/types/project';

interface PDFSection {
  title: string;
  content: string | string[];
  type: 'heading' | 'paragraph' | 'list' | 'table';
}

// Generate HTML that can be printed as PDF
export function generatePRDHTML(prd: PRDDocument): string {
  const sections: PDFSection[] = [];

  // Project Overview
  sections.push({
    title: 'Resumen del Proyecto',
    content: prd.projectDescription,
    type: 'paragraph',
  });

  // Problem Statement
  if (prd.problemStatement) {
    sections.push({
      title: 'Problema a Resolver',
      content: prd.problemStatement,
      type: 'paragraph',
    });
  }

  // Objectives
  sections.push({
    title: 'Objetivos',
    content: prd.objectives,
    type: 'list',
  });

  // Target Audience
  sections.push({
    title: 'Audiencia Objetivo',
    content: prd.targetAudience,
    type: 'paragraph',
  });

  // Core Features
  sections.push({
    title: 'Funcionalidades Principales',
    content: prd.coreFeatures.map((f) => `${f.name}: ${f.description}`),
    type: 'list',
  });

  // Secondary Features
  if (prd.secondaryFeatures && prd.secondaryFeatures.length > 0) {
    sections.push({
      title: 'Funcionalidades Secundarias',
      content: prd.secondaryFeatures.map((f) => `${f.name}: ${f.description}`),
      type: 'list',
    });
  }

  // User Stories
  if (prd.userStories && prd.userStories.length > 0) {
    sections.push({
      title: 'Historias de Usuario',
      content: prd.userStories.map(
        (story) => `Como ${story.persona}, quiero ${story.action} para ${story.benefit}`
      ),
      type: 'list',
    });
  }

  // Technical Requirements
  sections.push({
    title: 'Requisitos Técnicos',
    content: prd.technicalRequirements,
    type: 'list',
  });

  // Design Guidelines
  if (prd.designGuidelines) {
    sections.push({
      title: 'Guías de Diseño',
      content: prd.designGuidelines,
      type: 'paragraph',
    });
  }

  // Success Metrics
  if (prd.successMetrics && prd.successMetrics.length > 0) {
    sections.push({
      title: 'Métricas de Éxito',
      content: prd.successMetrics,
      type: 'list',
    });
  }

  // Timeline
  if (prd.timeline) {
    const phases = prd.timeline.phases || [];
    sections.push({
      title: 'Cronograma',
      content: phases.map((p) => `${p.name} (${p.duration}): ${p.deliverables.join(', ')}`),
      type: 'list',
    });
  }

  // Budget
  if (prd.budget) {
    sections.push({
      title: 'Presupuesto',
      content: `Total: ${new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: prd.budget.currency || 'MXN',
      }).format(prd.budget.total)}`,
      type: 'paragraph',
    });
  }

  return generateHTMLDocument(prd.projectName, sections);
}

function generateHTMLDocument(projectName: string, sections: PDFSection[]): string {
  const sectionsHTML = sections
    .map((section) => {
      let contentHTML = '';

      if (section.type === 'paragraph') {
        contentHTML = `<p class="content">${section.content}</p>`;
      } else if (section.type === 'list' && Array.isArray(section.content)) {
        contentHTML = `
          <ul class="list">
            ${section.content.map((item) => `<li>${item}</li>`).join('')}
          </ul>
        `;
      }

      return `
        <section class="section">
          <h2>${section.title}</h2>
          ${contentHTML}
        </section>
      `;
    })
    .join('');

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PRD - ${projectName}</title>
  <style>
    @page {
      size: A4;
      margin: 2cm;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      background: white;
      padding: 40px;
    }

    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid #a855f7;
    }

    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #a855f7;
      margin-bottom: 8px;
    }

    .subtitle {
      color: #64748b;
      font-size: 14px;
    }

    h1 {
      font-size: 28px;
      color: #0f172a;
      margin-top: 20px;
    }

    .date {
      font-size: 12px;
      color: #94a3b8;
      margin-top: 8px;
    }

    .section {
      margin-bottom: 30px;
      page-break-inside: avoid;
    }

    h2 {
      font-size: 18px;
      color: #7c3aed;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e2e8f0;
    }

    .content {
      color: #475569;
      font-size: 14px;
    }

    .list {
      list-style-type: none;
      padding-left: 0;
    }

    .list li {
      padding: 8px 0 8px 24px;
      position: relative;
      color: #475569;
      font-size: 14px;
      border-bottom: 1px solid #f1f5f9;
    }

    .list li:before {
      content: "▸";
      position: absolute;
      left: 0;
      color: #a855f7;
    }

    .list li:last-child {
      border-bottom: none;
    }

    .footer {
      margin-top: 60px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      font-size: 12px;
      color: #94a3b8;
    }

    .footer a {
      color: #a855f7;
      text-decoration: none;
    }

    @media print {
      body {
        padding: 0;
      }

      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">Devvy</div>
    <div class="subtitle">Documento de Requisitos del Producto</div>
    <h1>${projectName}</h1>
    <div class="date">Generado el ${new Date().toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })}</div>
  </div>

  ${sectionsHTML}

  <div class="footer">
    <p>Documento generado por <a href="https://devvy.tech">Devvy</a></p>
    <p>&copy; ${new Date().getFullYear()} Devvy. Todos los derechos reservados.</p>
  </div>
</body>
</html>
  `;
}

// Client-side function to trigger print dialog
export function printPRDAsPDF(prd: PRDDocument): void {
  const html = generatePRDHTML(prd);
  const printWindow = window.open('', '_blank');

  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();

    // Wait for content to load then trigger print
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}

// Client-side function to download as HTML file (can be converted to PDF)
export function downloadPRDAsHTML(prd: PRDDocument): void {
  const html = generatePRDHTML(prd);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `PRD-${prd.projectName.replace(/\s+/g, '-')}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Generate markdown version
export function generatePRDMarkdown(prd: PRDDocument): string {
  let md = `# ${prd.projectName}\n\n`;
  md += `**Documento de Requisitos del Producto**\n\n`;
  md += `Generado el ${new Date().toLocaleDateString('es-MX')}\n\n`;
  md += `---\n\n`;

  md += `## Resumen del Proyecto\n\n${prd.projectDescription}\n\n`;

  if (prd.problemStatement) {
    md += `## Problema a Resolver\n\n${prd.problemStatement}\n\n`;
  }

  md += `## Objetivos\n\n`;
  prd.objectives.forEach((obj) => {
    md += `- ${obj}\n`;
  });
  md += `\n`;

  md += `## Audiencia Objetivo\n\n${prd.targetAudience}\n\n`;

  md += `## Funcionalidades Principales\n\n`;
  prd.coreFeatures.forEach((f) => {
    md += `### ${f.name}\n${f.description}\n\n`;
  });

  if (prd.secondaryFeatures && prd.secondaryFeatures.length > 0) {
    md += `## Funcionalidades Secundarias\n\n`;
    prd.secondaryFeatures.forEach((f) => {
      md += `- **${f.name}**: ${f.description}\n`;
    });
    md += `\n`;
  }

  if (prd.userStories && prd.userStories.length > 0) {
    md += `## Historias de Usuario\n\n`;
    prd.userStories.forEach((story) => {
      md += `- Como **${story.persona}**, quiero ${story.action} para ${story.benefit}\n`;
    });
    md += `\n`;
  }

  md += `## Requisitos Técnicos\n\n`;
  prd.technicalRequirements.forEach((req) => {
    md += `- ${req}\n`;
  });
  md += `\n`;

  if (prd.designGuidelines) {
    md += `## Guías de Diseño\n\n${prd.designGuidelines}\n\n`;
  }

  if (prd.successMetrics && prd.successMetrics.length > 0) {
    md += `## Métricas de Éxito\n\n`;
    prd.successMetrics.forEach((metric) => {
      md += `- ${metric}\n`;
    });
    md += `\n`;
  }

  if (prd.timeline) {
    const phases = prd.timeline.phases || [];
    md += `## Cronograma\n\n`;
    phases.forEach((phase) => {
      md += `### ${phase.name} (${phase.duration})\n`;
      phase.deliverables.forEach((d) => {
        md += `- ${d}\n`;
      });
      md += `\n`;
    });
  }

  if (prd.budget) {
    md += `## Presupuesto\n\n`;
    md += `**Total**: ${new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: prd.budget.currency || 'MXN',
    }).format(prd.budget.total)}\n\n`;
  }

  md += `---\n\n`;
  md += `*Documento generado por Devvy*\n`;

  return md;
}

// Download as Markdown
export function downloadPRDAsMarkdown(prd: PRDDocument): void {
  const md = generatePRDMarkdown(prd);
  const blob = new Blob([md], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `PRD-${prd.projectName.replace(/\s+/g, '-')}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
