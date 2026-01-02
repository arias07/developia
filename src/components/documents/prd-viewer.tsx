'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Download,
  FileText,
  Users,
  Code,
  Target,
  Clock,
  AlertTriangle,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import type { PRDDocument, UserStory, TechnicalSpec } from '@/lib/openai/prd-generator';

interface PRDViewerProps {
  prd?: PRDDocument;
  userStories?: UserStory[];
  technicalSpec?: TechnicalSpec;
  isLoading?: boolean;
  onGeneratePRD?: () => void;
  onGenerateStories?: () => void;
  onGenerateSpec?: () => void;
}

export function PRDViewer({
  prd,
  userStories,
  technicalSpec,
  isLoading,
  onGeneratePRD,
  onGenerateStories,
  onGenerateSpec,
}: PRDViewerProps) {
  const [activeTab, setActiveTab] = useState('prd');

  const downloadAsMarkdown = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const prdToMarkdown = (doc: PRDDocument): string => {
    return `# ${doc.title}

## Resumen Ejecutivo
${doc.executiveSummary}

## Problema
${doc.problemStatement}

## Objetivos
${doc.objectives.map((o) => `- ${o}`).join('\n')}

## Audiencia Objetivo
${doc.targetAudience.description}

### Personas
${doc.targetAudience.personas
  .map(
    (p) => `
#### ${p.name}
${p.description}

**Necesidades:**
${p.needs.map((n) => `- ${n}`).join('\n')}
`
  )
  .join('\n')}

## Alcance y Funcionalidades

### En Alcance
${doc.scopeAndFeatures.inScope.map((s) => `- ${s}`).join('\n')}

### Fuera de Alcance
${doc.scopeAndFeatures.outOfScope.map((s) => `- ${s}`).join('\n')}

### Funcionalidades
${doc.scopeAndFeatures.features
  .map(
    (f) => `
#### ${f.name} (${f.priority})
${f.description}

**User Stories:**
${f.userStories.map((s) => `- ${s}`).join('\n')}
`
  )
  .join('\n')}

## Requerimientos Técnicos

### Arquitectura
${doc.technicalRequirements.architecture}

### Tecnologías
${doc.technicalRequirements.technologies.map((t) => `- ${t}`).join('\n')}

### Integraciones
${doc.technicalRequirements.integrations.map((i) => `- ${i}`).join('\n')}

### Seguridad
${doc.technicalRequirements.security.map((s) => `- ${s}`).join('\n')}

### Performance
${doc.technicalRequirements.performance.map((p) => `- ${p}`).join('\n')}

## Requerimientos de Diseño

### Estilo
${doc.designRequirements.style}

### Lineamientos de Marca
${doc.designRequirements.brandGuidelines}

### Principios UX
${doc.designRequirements.uxPrinciples.map((p) => `- ${p}`).join('\n')}

### Accesibilidad
${doc.designRequirements.accessibility.map((a) => `- ${a}`).join('\n')}

## Cronograma

**Duración Estimada:** ${doc.timeline.estimatedDuration}

### Fases
${doc.timeline.phases
  .map(
    (p) => `
#### ${p.name} (${p.duration})
**Entregables:**
${p.deliverables.map((d) => `- ${d}`).join('\n')}
`
  )
  .join('\n')}

## Métricas de Éxito
| Métrica | Objetivo |
|---------|----------|
${doc.successMetrics.map((m) => `| ${m.metric} | ${m.target} |`).join('\n')}

## Riesgos
| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
${doc.risks.map((r) => `| ${r.risk} | ${r.impact} | ${r.mitigation} |`).join('\n')}

## Supuestos
${doc.assumptions.map((a) => `- ${a}`).join('\n')}

## Restricciones
${doc.constraints.map((c) => `- ${c}`).join('\n')}
`;
  };

  const storiesToMarkdown = (stories: UserStory[]): string => {
    return `# User Stories

${stories
  .map(
    (s) => `
## ${s.id}: ${s.title}

**Epic:** ${s.epic || 'N/A'}
**Prioridad:** ${s.priority}
**Story Points:** ${s.storyPoints}

**Como** ${s.asA},
**Quiero** ${s.iWant},
**Para** ${s.soThat}

### Criterios de Aceptación
${s.acceptanceCriteria.map((c) => `- [ ] ${c}`).join('\n')}

---
`
  )
  .join('\n')}`;
  };

  const priorityColors: Record<string, string> = {
    'must-have': 'bg-red-500',
    'should-have': 'bg-yellow-500',
    'nice-to-have': 'bg-blue-500',
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Documentación del Proyecto
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-slate-800 mb-6">
            <TabsTrigger value="prd" className="data-[state=active]:bg-purple-600">
              PRD
            </TabsTrigger>
            <TabsTrigger value="stories" className="data-[state=active]:bg-purple-600">
              User Stories
            </TabsTrigger>
            <TabsTrigger value="technical" className="data-[state=active]:bg-purple-600">
              Especificación Técnica
            </TabsTrigger>
          </TabsList>

          <TabsContent value="prd" className="space-y-6">
            {!prd ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 mb-4">No hay PRD generado aún</p>
                <Button
                  onClick={onGeneratePRD}
                  disabled={isLoading}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 mr-2" />
                      Generar PRD
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-white">{prd.title}</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadAsMarkdown(prdToMarkdown(prd), 'prd.md')}
                    className="border-slate-700"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Descargar MD
                  </Button>
                </div>

                <div className="space-y-6">
                  {/* Executive Summary */}
                  <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                    <h3 className="text-lg font-semibold text-white mb-2">Resumen Ejecutivo</h3>
                    <p className="text-slate-300">{prd.executiveSummary}</p>
                  </div>

                  {/* Objectives */}
                  <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                      <Target className="w-5 h-5 text-purple-400" />
                      Objetivos
                    </h3>
                    <ul className="space-y-2">
                      {prd.objectives.map((obj, i) => (
                        <li key={i} className="flex items-start gap-2 text-slate-300">
                          <CheckCircle className="w-4 h-4 text-green-400 mt-1 shrink-0" />
                          {obj}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Features */}
                  <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                    <h3 className="text-lg font-semibold text-white mb-3">Funcionalidades</h3>
                    <div className="space-y-3">
                      {prd.scopeAndFeatures.features.map((feature, i) => (
                        <div key={i} className="p-3 rounded bg-slate-700/50">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-white">{feature.name}</span>
                            <Badge className={`${priorityColors[feature.priority]} text-white border-none`}>
                              {feature.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-400">{feature.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-cyan-400" />
                      Cronograma
                    </h3>
                    <p className="text-slate-300 mb-4">
                      Duración estimada: <span className="font-medium">{prd.timeline.estimatedDuration}</span>
                    </p>
                    <div className="space-y-3">
                      {prd.timeline.phases.map((phase, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm font-medium shrink-0">
                            {i + 1}
                          </div>
                          <div>
                            <p className="font-medium text-white">
                              {phase.name} ({phase.duration})
                            </p>
                            <ul className="text-sm text-slate-400 mt-1">
                              {phase.deliverables.map((d, j) => (
                                <li key={j}>• {d}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Risks */}
                  <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-400" />
                      Riesgos
                    </h3>
                    <div className="space-y-2">
                      {prd.risks.map((risk, i) => (
                        <div key={i} className="flex items-start gap-3 p-2 rounded bg-slate-700/30">
                          <Badge
                            className={`${
                              risk.impact === 'high'
                                ? 'bg-red-500'
                                : risk.impact === 'medium'
                                ? 'bg-yellow-500'
                                : 'bg-blue-500'
                            } text-white border-none shrink-0`}
                          >
                            {risk.impact}
                          </Badge>
                          <div>
                            <p className="text-slate-300">{risk.risk}</p>
                            <p className="text-sm text-slate-500">Mitigación: {risk.mitigation}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="stories" className="space-y-6">
            {!userStories || userStories.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 mb-4">No hay user stories generadas</p>
                <Button
                  onClick={onGenerateStories}
                  disabled={isLoading}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <Users className="w-4 h-4 mr-2" />
                      Generar User Stories
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-white">User Stories ({userStories.length})</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadAsMarkdown(storiesToMarkdown(userStories), 'user-stories.md')}
                    className="border-slate-700"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Descargar MD
                  </Button>
                </div>

                <div className="space-y-4">
                  {userStories.map((story) => (
                    <div key={story.id} className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="border-slate-600 text-slate-300">
                            {story.id}
                          </Badge>
                          <span className="font-medium text-white">{story.title}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`${priorityColors[story.priority]} text-white border-none`}>
                            {story.priority}
                          </Badge>
                          <Badge variant="outline" className="border-purple-500 text-purple-400">
                            {story.storyPoints} pts
                          </Badge>
                        </div>
                      </div>

                      <div className="text-slate-300 mb-3">
                        <p>
                          <span className="text-slate-500">Como</span> {story.asA},{' '}
                          <span className="text-slate-500">quiero</span> {story.iWant},{' '}
                          <span className="text-slate-500">para</span> {story.soThat}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-slate-400 mb-2">Criterios de aceptación:</p>
                        <ul className="space-y-1">
                          {story.acceptanceCriteria.map((criteria, i) => (
                            <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                              <span className="w-4 h-4 border border-slate-600 rounded mt-0.5 shrink-0" />
                              {criteria}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="technical" className="space-y-6">
            {!technicalSpec ? (
              <div className="text-center py-12">
                <Code className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 mb-4">No hay especificación técnica generada</p>
                <Button
                  onClick={onGenerateSpec}
                  disabled={isLoading}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <Code className="w-4 h-4 mr-2" />
                      Generar Especificación Técnica
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Overview */}
                <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                  <h3 className="text-lg font-semibold text-white mb-2">Descripción General</h3>
                  <p className="text-slate-300">{technicalSpec.overview}</p>
                </div>

                {/* Architecture */}
                <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                  <h3 className="text-lg font-semibold text-white mb-3">Arquitectura del Sistema</h3>
                  <p className="text-slate-300 mb-4">{technicalSpec.systemArchitecture.description}</p>

                  <h4 className="text-sm font-medium text-slate-400 mb-2">Componentes:</h4>
                  <div className="space-y-2">
                    {technicalSpec.systemArchitecture.components.map((comp, i) => (
                      <div key={i} className="p-3 rounded bg-slate-700/50">
                        <p className="font-medium text-white">{comp.name}</p>
                        <p className="text-sm text-slate-400">{comp.purpose}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {comp.technologies.map((tech, j) => (
                            <Badge key={j} variant="outline" className="border-slate-600 text-slate-300 text-xs">
                              {tech}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* API */}
                <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                  <h3 className="text-lg font-semibold text-white mb-3">API ({technicalSpec.api.style})</h3>
                  <div className="space-y-2">
                    {technicalSpec.api.endpoints.slice(0, 5).map((endpoint, i) => (
                      <div key={i} className="flex items-center gap-3 p-2 rounded bg-slate-700/30">
                        <Badge
                          className={`${
                            endpoint.method === 'GET'
                              ? 'bg-green-600'
                              : endpoint.method === 'POST'
                              ? 'bg-blue-600'
                              : endpoint.method === 'PUT'
                              ? 'bg-yellow-600'
                              : 'bg-red-600'
                          } text-white border-none`}
                        >
                          {endpoint.method}
                        </Badge>
                        <code className="text-cyan-400 text-sm">{endpoint.path}</code>
                        <span className="text-slate-400 text-sm">{endpoint.description}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Security */}
                <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                  <h3 className="text-lg font-semibold text-white mb-3">Seguridad</h3>
                  <div className="space-y-2">
                    <p className="text-slate-300">
                      <span className="text-slate-500">Autenticación:</span> {technicalSpec.security.authentication}
                    </p>
                    <p className="text-slate-300">
                      <span className="text-slate-500">Autorización:</span> {technicalSpec.security.authorization}
                    </p>
                    <div>
                      <span className="text-slate-500">Protección de datos:</span>
                      <ul className="mt-1">
                        {technicalSpec.security.dataProtection.map((item, i) => (
                          <li key={i} className="text-slate-300">
                            • {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
