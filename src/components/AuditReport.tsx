/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ArrowLeft,
  Scan,
  AlertTriangle,
  CheckCircle,
  FileText,
  ShieldCheck,
  Zap,
  Edit2,
  Check,
  X,
  FileSpreadsheet,
  Download,
  Unlock,
  AlertOctagon,
  Sparkles,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  UploadCloud,
  Layers,
  HelpCircle,
  FolderOpen
} from 'lucide-react';
import { CustomsProcess, Discrepancy, AuditField, UserRoleProfile } from '../types';
import { jsPDF } from 'jspdf';

interface AuditReportProps {
  process: CustomsProcess;
  onBack: () => void;
  onExecuteAIAudit: (id: string, pastedTexts?: any) => Promise<void>;
  onCorrectField: (id: string, fieldName: string, value: string) => Promise<void>;
  onSubmitProcess: (id: string) => Promise<void>;
  onOverrideProcess: (id: string) => Promise<void>;
  onUploadFile?: (
    id: string,
    docType: string,
    fileName: string,
    fileContent?: string,
    inlineData?: { data: string; mimeType: string }
  ) => Promise<void>;
  user: UserRoleProfile;
}

export default function AuditReport({
  process,
  onBack,
  onExecuteAIAudit,
  onCorrectField,
  onSubmitProcess,
  onOverrideProcess,
  onUploadFile,
  user
}: AuditReportProps) {
  const [auditing, setAuditing] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [pdfDownloaded, setPdfDownloaded] = useState(false);

  // View modes
  const [viewMode, setViewMode] = useState<'wizard' | 'consolidado'>('wizard');
  const [wizardStep, setWizardStep] = useState<number>(1);

  // Manual document text pasting inputs to experiment with IA
  const [showPastedInput, setShowPastedInput] = useState(false);
  const [customInvoice, setCustomInvoice] = useState('');
  const [customBL, setCustomBL] = useState('');
  const [customDUADO, setCustomDUADO] = useState('');

  // Local simulated upload names synchronized with database state
  const getInitialFiles = (p: CustomsProcess) => {
    const files: Record<string, string> = {
      invoice: '',
      bl: '',
      duado: '',
      license: ''
    };
    p.documents.forEach(doc => {
      if (doc.status === 'Presente') {
        const mappedKey = doc.type === 'bl_awb' ? 'bl' : doc.type;
        files[mappedKey] = doc.fileName || doc.name;
      }
    });
    return files;
  };

  const [uploadedFiles, setUploadedFiles] = useState<Record<string, string>>(() => getInitialFiles(process));

  React.useEffect(() => {
    setUploadedFiles(getInitialFiles(process));
  }, [process.id, process.documents]);

  const handleSimulatedFileUpload = async (docKey: string, demoFileName: string) => {
    const isPresent = !!uploadedFiles[docKey];
    const newFileName = isPresent ? '' : demoFileName;
    setUploadedFiles(prev => ({
      ...prev,
      [docKey]: newFileName
    }));

    if (onUploadFile) {
      if (isPresent) {
        await onUploadFile(process.id, docKey, '', '');
      } else {
        let simulationContent = '';
        if (docKey === 'invoice') simulationContent = "Fatura Comercial ABC-811 / Importador ABC Trading S.A., Maputo / Exportador Global Grains, Sul de Ásia. Artigo: Arroz Parboilizado de Alta qualidade. Marca: Estrela. Quantidade: 200 Sacos. Peso Líquido total: 10000 KG. Peso Bruto: 10050 KG. HS Code: 1006.30.90. Valor aduaneiro CIF Maputo: 45000 USD. Nº Fatura: ABC-2026-881. Porto de Descarga: Maputo Port.";
        if (docKey === 'bl') simulationContent = "Bill of Lading MAERSK99172. Shipper: GLOBAL GRAINS INC. Consignee: ABC TRADING LDA, Av. 25 de Setembro, Maputo. Port of Loading: Mumbai. Port of Discharge: Maputo, Moçambique. Container Number: MSCU1234567 (1x20ft Container). Total Gross Weight: 10050 KG. Package count: 200 bags of white parboiled rice.";
        if (docKey === 'duado') simulationContent = "DUADO Rascunho Documento Único Aduaneiro. Declarante: Despachante Autorizado Nº 22-C. Importador: ABC TRADING LDA. País de Procedência: Índia. Porto de Entrada: Maputo. Código Pauta Aduaneira: 10063090. Valores declarados: CIF 45000 USD. Contentor declarado: MSCU1234567. Peso Bruto declarado: 10030 KG.";
        
        await onUploadFile(process.id, docKey, demoFileName, simulationContent);
      }
    }
  };

  const handleFileChange = async (docKey: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadedFiles(prev => ({
      ...prev,
      [docKey]: file.name
    }));

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;

      const commaIndex = dataUrl.indexOf(',');
      if (commaIndex === -1) return;

      const base64Data = dataUrl.substring(commaIndex + 1);
      const mimeType = file.type || 'application/octet-stream';

      // If text file, decode it as content to display/paste in textboxes
      if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.json') || file.name.endsWith('.csv')) {
        const textReader = new FileReader();
        textReader.onload = async (textEvent) => {
          const text = textEvent.target?.result as string;
          if (docKey === 'invoice') setCustomInvoice(text);
          if (docKey === 'bl') setCustomBL(text);
          if (docKey === 'duado') setCustomDUADO(text);

          if (onUploadFile) {
            await onUploadFile(process.id, docKey, file.name, text, { data: base64Data, mimeType });
          }
        };
        textReader.readAsText(file);
      } else {
        // Binary doc (PDF, PNG, JPG, JPEG)
        const descriptionText = `Documento Real [${mimeType}]: ${file.name}. Tamanho: ${(file.size / 1024).toFixed(1)} KB.`;
        if (docKey === 'invoice') setCustomInvoice(descriptionText);
        if (docKey === 'bl') setCustomBL(descriptionText);
        if (docKey === 'duado') setCustomDUADO(descriptionText);

        if (onUploadFile) {
          await onUploadFile(process.id, docKey, file.name, descriptionText, { data: base64Data, mimeType });
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRunAudit = async () => {
    setAuditing(true);
    let pastedTexts = undefined;
    if (customInvoice || customBL || customDUADO) {
      pastedTexts = {
        invoice: customInvoice || undefined,
        bl: customBL || undefined,
        duado: customDUADO || undefined
      };
    }
    await onExecuteAIAudit(process.id, pastedTexts);
    setAuditing(false);
    // Auto advance wizard once analyzed to let them inspect OCR outputs in Step 2
    if (viewMode === 'wizard' && wizardStep === 1) {
      setWizardStep(2);
    }
  };

  const handleSaveCorrection = async (fieldName: string) => {
    if (!editValue) return;
    await onCorrectField(process.id, fieldName, editValue);
    setEditingField(null);
    setEditValue('');
  };

  const handleDownloadPDF = () => {
    setPdfDownloaded(true);
    setTimeout(() => {
      try {
        const doc = new jsPDF();
        
        // Header Banner (slate-900 style)
        doc.setFillColor(15, 23, 42); 
        doc.rect(0, 0, 210, 42, 'F');
        
        // Header Text
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(22);
        doc.text('LJ-ADUANEIRO', 15, 17);
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184); // Slate light grey
        doc.text('MOTOR DE DIAGNÓSTICO E COMPLIANCE ADUANEIRO DE MOÇAMBIQUE', 15, 24);
        doc.text('Documento oficial gerado de forma automatizada via processamento do motor aduaneiro LJ', 15, 29);
        doc.text(`Data de Emissão: ${new Date().toLocaleString('pt-PT')}`, 15, 35);
        
        // Title
        doc.setTextColor(30, 41, 59); // Slate-800
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text('RELATÓRIO DE CONFORMIDADE E FISCALIZAÇÃO', 15, 54);
        
        doc.setDrawColor(226, 232, 240); // Slate-200 border line top
        doc.line(15, 58, 195, 58);
        
        // Metadata grid
        doc.setFontSize(9.5);
        doc.setTextColor(71, 85, 105); // Slate-650
        doc.setFont('helvetica', 'bold');
        doc.text('INFORMAÇÃO DO DOSSIÊ', 15, 66);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(`Nº do Dossiê: ${process.id}`, 15, 74);
        doc.text(`Ref. Interna: ${process.internNumber}`, 15, 81);
        doc.text(`Cliente Associado: ${process.client}`, 15, 88);
        
        doc.text(`Regime Aduaneiro: ${process.type}`, 120, 74);
        doc.text(`Porto de Entrada: ${process.port}`, 120, 81);
        doc.text(`Status do Processo: ${process.status}`, 120, 88);
        
        doc.setDrawColor(226, 232, 240); 
        doc.line(15, 94, 195, 94);
        
        // Section: OCR & Confidence values
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('1. ANÁLISE DE DADOS EXTRAÍDOS E AUDITORIA OCR', 15, 103);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        let y = 111;
        Object.values(process.extractedFields).forEach((f) => {
          const rawVal = f.manuallyCorrectedValue || f.extractedValue || 'Campos não detectados ou pendentes';
          doc.setFont('helvetica', 'bold');
          doc.text(`${f.label}:`, 15, y);
          doc.setFont('helvetica', 'normal');
          doc.text(`${rawVal}   (Confiança do motor LJ: ${f.confidence}%)`, 60, y);
          y += 7.5;
        });
        
        doc.line(15, y + 1, 195, y + 1);
        y += 10;
        
        // Section: Discrepancies
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('2. INCONFORMIDADES OU DISCREPÂNCIAS IDENTIFICADAS', 15, y);
        y += 8;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        
        if (!process.discrepancies || process.discrepancies.length === 0) {
          doc.text('Nenhuma disparidade ou discrepância crítica de dados relatada entre os documentos carregados.', 15, y);
        } else {
          process.discrepancies.forEach((d) => {
            if (y > 255) {
              doc.addPage();
              y = 20;
            }
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(d.severity === 'critical' ? 220 : 120, 38, 38); // Red/Amber color text for critical
            doc.text(`[${d.severity.toUpperCase()}] ${d.title}`, 15, y);
            doc.setTextColor(71, 85, 105);
            
            doc.setFont('helvetica', 'normal');
            y += 5;
            const splitDescription = doc.splitTextToSize(d.description, 178);
            doc.text(splitDescription, 15, y);
            y += (splitDescription.length * 4.5) + 2;
            
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(8);
            doc.text(`Status: ${d.isCorrected ? 'Aprovado & Corrigido' : 'Pendente de Resolução'}`, 15, y);
            doc.setFontSize(9);
            y += 8.5;
          });
        }
        
        // Add final footer
        const totalPageCount = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= totalPageCount; i++) {
          doc.setPage(i);
          doc.setDrawColor(226, 232, 240);
          doc.line(15, 282, 195, 282);
          doc.setFontSize(8);
          doc.setTextColor(148, 163, 184); // Slate grey 400
          doc.setFont('helvetica', 'normal');
          doc.text(`LJ-Aduaneiro • Moçambique — Página ${i} de ${totalPageCount}`, 15, 287);
          doc.text('Análise realizada com conformidade aduaneira e confidencialidade total', 115, 287);
        }
        
        doc.save(`LJ_Aduaneiro_Relatorio_${process.id}.pdf`);
      } catch (err) {
        console.error('Error compiling PDF: ', err);
      }
      setPdfDownloaded(false);
    }, 1200);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence === 0) return 'text-slate-400 bg-slate-50';
    if (confidence >= 85) return 'text-emerald-700 bg-emerald-50 border border-emerald-200';
    if (confidence >= 70) return 'text-amber-700 bg-amber-50 border border-amber-200';
    return 'text-rose-700 bg-rose-50 border border-rose-200 animate-pulse';
  };

  const getDiscrepancyIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <div className="p-1 rounded bg-rose-100 text-rose-700 font-bold text-[10px] font-mono">CRÍTICO</div>;
      case 'warning':
        return <div className="p-1 rounded bg-amber-100 text-amber-700 font-bold text-[10px] font-mono">AVISO</div>;
      default:
        return <div className="p-1 rounded bg-slate-100 text-slate-700 font-bold text-[10px] font-mono">REGRA</div>;
    }
  };

  const hasUncorrectedCritical = process.discrepancies.some(d => d.severity === 'critical' && !d.isCorrected);

  return (
    <div className="space-y-6">
      
      {/* Upper controls & tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 bg-white border border-slate-200 rounded-lg transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao Painel
        </button>

        {/* Tab Selection for UI Preference */}
        <div className="bg-slate-200/80 p-0.5 rounded-lg inline-flex items-center text-xs font-semibold text-slate-700">
          <button
            onClick={() => setViewMode('wizard')}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
              viewMode === 'wizard' ? 'bg-slate-900 text-white shadow-sm' : 'hover:bg-slate-100/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Assistente Passo-a-Passo (Wizard)
          </button>
          
          <button
            onClick={() => setViewMode('consolidado')}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
              viewMode === 'consolidado' ? 'bg-slate-900 text-white shadow-sm' : 'hover:bg-slate-100/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            Visão Consolidada
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Export option */}
          <button
            onClick={handleDownloadPDF}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            {pdfDownloaded ? 'Gerando PDF...' : 'Descarregar PDF'}
          </button>
        </div>
      </div>

      {/* PROCESS META CARD */}
      <div className="bg-slate-900 text-white p-5 rounded-xl border border-slate-800 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold bg-emerald-950 border border-emerald-900 text-emerald-400 px-2 py-0.5 rounded">
              Dossiê {process.id}
            </span>
            <span className="text-xs text-slate-300">| Cliente: <strong>{process.client}</strong></span>
          </div>
          <h2 className="text-lg font-bold tracking-tight text-white font-display">
            Pasta Aduaneira — {process.internNumber}
          </h2>
          <p className="text-xs text-slate-400">
            Regime: <span className="text-slate-200">{process.type}</span> | Porto de entrada: <span className="text-slate-200">{process.port}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="bg-slate-800 px-3 py-1.5 rounded-lg">
            <span className="text-slate-400">Risco: </span>
            <span className={`font-semibold ${process.risk === 'Alto' ? 'text-rose-400' : 'text-emerald-400'}`}>
              {process.risk}
            </span>
          </div>
          <div className="bg-slate-800 px-3 py-1.5 rounded-lg">
            <span className="text-slate-400">Status AT: </span>
            <span className="text-slate-200 font-semibold">{process.status}</span>
          </div>
        </div>
      </div>

      {/* RENDER CHOSEN MODE */}
      {viewMode === 'wizard' ? (
        <div className="space-y-6">
          
          {/* WIZARD PROGRESS TRACKER */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-center text-xs font-semibold">
              {[
                { step: 1, label: 'Carregar Documentos', desc: 'Introdução de dados' },
                { step: 2, label: 'Verificar OCR', desc: 'Confiança de campos' },
                { step: 3, label: 'Divergências', desc: 'Cruzamento cruzado' },
                { step: 4, label: 'Pauta e Licenças', desc: 'Regularidade SADC' },
                { step: 5, label: 'Transmissão DUADO', desc: 'Envio Alfândega' }
              ].map((s) => (
                <button
                  key={s.step}
                  onClick={() => setWizardStep(s.step)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    wizardStep === s.step
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm ring-1 ring-emerald-500'
                      : wizardStep > s.step
                        ? 'bg-emerald-50/50 border-emerald-100/80 text-emerald-850'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100/55'
                  }`}
                >
                  <p className="text-[10px] text-slate-400 block font-bold">Etapa 0{s.step}</p>
                  <p className="font-bold truncate mt-0.5">{s.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* STEP CARD RENDERER */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm min-h-[400px] flex flex-col justify-between whitespace-normal">
            
            <div>
              {/* STEP 1: CARREGAR DOCUMENTOS */}
              {wizardStep === 1 && (
                <div className="space-y-6 animate-fade-in text-left">
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-slate-900 font-display flex items-center gap-2">
                      <UploadCloud className="w-5 h-5 text-emerald-600" /> Onde colocar os documentos que vão ser analisados?
                    </h3>
                    <p className="text-xs text-slate-500">
                      Aqui está o espaço digital integrado para upload dos principais arquivos de circulação aduaneira (Fatura e Conhecimento de Embarque BL). Use as caixas abaixo para simular uploads ou carregar novos dados para o motor LJ estruturar.
                    </p>
                  </div>

                  {/* 3 Upload slots zones */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 font-sans">
                    
                    {/* Invoice Slot */}
                    <div 
                      className={`p-5 rounded-xl border-2 border-dashed text-center flex flex-col items-center justify-center gap-2.5 transition-all ${
                        uploadedFiles.invoice 
                          ? 'border-emerald-400 bg-emerald-50/20 shadow-2xs' 
                          : 'border-slate-300 bg-slate-50/50'
                      }`}
                    >
                      <div className={`p-3 rounded-full ${uploadedFiles.invoice ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-800 text-xs">Fatura Comercial (Invoice)</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Valores, Moeda e Pesos</p>
                      </div>
                      {uploadedFiles.invoice ? (
                        <span className="text-[10px] bg-emerald-50 border border-emerald-200 text-emerald-850 px-2.5 py-1 rounded-md font-bold flex items-center justify-center gap-1 max-w-full">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> 
                          <span className="truncate max-w-[130px]">{uploadedFiles.invoice}</span>
                        </span>
                      ) : (
                        <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-mono">Pendente</span>
                      )}

                      <div className="flex flex-col gap-1 w-full pt-1.5">
                        <label className="text-[10px] font-bold text-center text-white bg-slate-950 border border-slate-850 hover:bg-slate-800 px-2 py-1.5 rounded-lg cursor-pointer transition-colors block shadow-sm">
                          Carregar Ficheiro Real
                          <input 
                            type="file" 
                            accept=".txt,.pdf,.png,.jpg,.jpeg,.json,.csv"
                            onChange={(e) => handleFileChange('invoice', e)} 
                            className="hidden" 
                          />
                        </label>
                        <button 
                          type="button"
                          onClick={() => handleSimulatedFileUpload('invoice', 'fatura_commercial_f52.pdf')}
                          className="text-[9px] text-slate-500 hover:text-emerald-700 underline font-semibold cursor-pointer py-1"
                        >
                          {uploadedFiles.invoice ? 'Remover Ficheiro' : 'Simular Demo Fictício'}
                        </button>
                      </div>
                    </div>

                    {/* BL/AWB Slot */}
                    <div 
                      className={`p-5 rounded-xl border-2 border-dashed text-center flex flex-col items-center justify-center gap-2.5 transition-all ${
                        uploadedFiles.bl 
                          ? 'border-emerald-400 bg-emerald-50/20 shadow-2xs' 
                          : 'border-slate-300 bg-slate-50/50'
                      }`}
                    >
                      <div className={`p-3 rounded-full ${uploadedFiles.bl ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-800 text-xs">Conhecimento de Embarque (BL)</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Contentores e Dados Marítimos</p>
                      </div>
                      {uploadedFiles.bl ? (
                        <span className="text-[10px] bg-emerald-50 border border-emerald-200 text-emerald-850 px-2.5 py-1 rounded-md font-bold flex items-center justify-center gap-1 max-w-full">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> 
                          <span className="truncate max-w-[130px]">{uploadedFiles.bl}</span>
                        </span>
                      ) : (
                        <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-mono">Pendente</span>
                      )}

                      <div className="flex flex-col gap-1 w-full pt-1.5">
                        <label className="text-[10px] font-bold text-center text-white bg-slate-950 border border-slate-850 hover:bg-slate-800 px-2 py-1.5 rounded-lg cursor-pointer transition-colors block shadow-sm">
                          Carregar Ficheiro Real
                          <input 
                            type="file" 
                            accept=".txt,.pdf,.png,.jpg,.jpeg,.json,.csv"
                            onChange={(e) => handleFileChange('bl', e)} 
                            className="hidden" 
                          />
                        </label>
                        <button 
                          type="button"
                          onClick={() => handleSimulatedFileUpload('bl', 'bl_maersk_99018.pdf')}
                          className="text-[9px] text-slate-500 hover:text-emerald-700 underline font-semibold cursor-pointer py-1"
                        >
                          {uploadedFiles.bl ? 'Remover Ficheiro' : 'Simular Demo Fictício'}
                        </button>
                      </div>
                    </div>

                    {/* Draft DUADO Slot */}
                    <div 
                      className={`p-5 rounded-xl border-2 border-dashed text-center flex flex-col items-center justify-center gap-2.5 transition-all ${
                        uploadedFiles.duado 
                          ? 'border-emerald-400 bg-emerald-50/20 shadow-2xs' 
                          : 'border-slate-300 bg-slate-50/50'
                      }`}
                    >
                      <div className={`p-3 rounded-full ${uploadedFiles.duado ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-800 text-xs">Rascunho Declarativo DUADO</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Moçambique Single Document</p>
                      </div>
                      {uploadedFiles.duado ? (
                        <span className="text-[10px] bg-emerald-50 border border-emerald-200 text-emerald-850 px-2.5 py-1 rounded-md font-bold flex items-center justify-center gap-1 max-w-full">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> 
                          <span className="truncate max-w-[130px]">{uploadedFiles.duado}</span>
                        </span>
                      ) : (
                        <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-mono">Pendente</span>
                      )}

                      <div className="flex flex-col gap-1 w-full pt-1.5">
                        <label className="text-[10px] font-bold text-center text-white bg-slate-950 border border-slate-850 hover:bg-slate-800 px-2 py-1.5 rounded-lg cursor-pointer transition-colors block shadow-sm">
                          Carregar Ficheiro Real
                          <input 
                            type="file" 
                            accept=".txt,.pdf,.png,.jpg,.jpeg,.json,.csv"
                            onChange={(e) => handleFileChange('duado', e)} 
                            className="hidden" 
                          />
                        </label>
                        <button 
                          type="button"
                          onClick={() => handleSimulatedFileUpload('duado', 'duado_draft_mo98.pdf')}
                          className="text-[9px] text-slate-500 hover:text-emerald-700 underline font-semibold cursor-pointer py-1"
                        >
                          {uploadedFiles.duado ? 'Remover Ficheiro' : 'Simular Demo Fictício'}
                        </button>
                      </div>
                    </div>

                  </div>

                  {/* Collapsible Laboratory Area (replaces unconditionally rendered dense textareas) */}
                  {!showPastedInput ? (
                    <div className="flex justify-center pt-2">
                      <button
                        type="button"
                        onClick={() => setShowPastedInput(true)}
                        className="text-xs font-semibold text-slate-600 hover:text-emerald-700 inline-flex items-center gap-2 transition-all cursor-pointer bg-slate-100 hover:bg-slate-200/80 px-4 py-2 rounded-lg border border-slate-250/70"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                        Ver Campo de Ingestão de Texto do Motor LJ (Copiar &amp; Colar trechos de PDF)
                      </button>
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-slate-300 rounded-xl p-4 space-y-3 relative animate-fade-in">
                      <button
                        type="button"
                        onClick={() => setShowPastedInput(false)}
                        className="absolute right-3 top-3.5 text-[10px] text-slate-400 hover:text-slate-700 font-bold uppercase transition-colors"
                      >
                        Ocultar [x]
                      </button>

                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                          <Scan className="w-4 h-4 text-emerald-600" /> Laboratório Copiar &amp; Colar Textos (Motor LJ)
                        </h4>
                        <button
                          type="button"
                          onClick={() => {
                            setCustomInvoice('ABC Trading Lda / Inv Ref #XYZ-5521 / Peso: 4890 KG / Contentor: MSCU1234567');
                            setCustomBL('BL MAERSK / Ref: Maersk-99018 / Container Code: MSCU1234567 / Peso Bruto de Linha: 4890 KG');
                            setCustomDUADO('Rascunho de Moçambique DUADO / Porto Maputo / Contentor de Carga: MSCU9999999 / Peso bruto: 4870 KG');
                          }}
                          className="text-[10px] font-semibold text-emerald-700 hover:underline mr-12"
                        >
                          Preencher Textos de Teste
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Caso queira simular a ingestão de PDFs reais pelo motor aduaneiro LJ, cole trechos ou sumários textuais nos campos abaixo. O motor de auditoria os confrontará de imediato.
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                        <div>
                          <span className="text-[10px] font-semibold text-slate-600 block mb-1">Invoice Info pasted:</span>
                          <textarea
                            rows={3}
                            value={customInvoice}
                            onChange={(e) => setCustomInvoice(e.target.value)}
                            placeholder="Cole textos de faturas comerciais aqui..."
                            className="w-full text-xs font-mono border border-slate-300 p-2 rounded-lg bg-white"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] font-semibold text-slate-600 block mb-1">Bill of Lading pasted:</span>
                          <textarea
                            rows={3}
                            value={customBL}
                            onChange={(e) => setCustomBL(e.target.value)}
                            placeholder="Cole informações de conhecimentos ou manifestos BL..."
                            className="w-full text-xs font-mono border border-slate-300 p-2 rounded-lg bg-white"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] font-semibold text-slate-600 block mb-1">Single Document DUADO draft:</span>
                          <textarea
                            rows={3}
                            value={customDUADO}
                            onChange={(e) => setCustomDUADO(e.target.value)}
                            placeholder="Cole rascunho de declaração nacional..."
                            className="w-full text-xs font-mono border border-slate-300 p-2 rounded-lg bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* AI audit trigger card style */}  {/* AI audit trigger card style */}
                  <div className="bg-indigo-50 border border-indigo-150 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="text-left space-y-1">
                      <h4 className="text-xs font-bold text-indigo-900 flex items-center gap-1.5 uppercase">
                        <Sparkles className="w-4 h-4 text-indigo-600" /> Analisar tudo com o motor aduaneiro LJ
                      </h4>
                      <p className="text-xs text-indigo-750">
                        O sistema examinará os arquivos e extrairá os dados de pesos, contentor, moedas e HS Codes com score de confiança OCR do motor LJ.
                      </p>
                    </div>
                    
                    <button
                      onClick={handleRunAudit}
                      disabled={auditing}
                      className="px-6 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 border border-slate-900 rounded-lg shadow font-display shrink-0 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Zap className={`w-3.5 h-3.5 text-emerald-400 ${auditing ? 'animate-bounce' : ''}`} />
                      {auditing ? 'Analisando com motor LJ...' : 'GERAR AUDITORIA DIGITAL'}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: CONFERENCIA OCR */}
              {wizardStep === 2 && (
                <div className="space-y-5 animate-fade-in text-left">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Etapa 2: Conferência OCR e Confiança do Motor LJ</h3>
                    <p className="text-xs text-slate-500">
                      O leitor OCR extraiu os campos fundamentais das faturas e conhecimentos de embarque. Verifique o nível de certeza emitido pelo motor. Corrija dados manualmente se houver baixa confiança.
                    </p>
                  </div>

                  <div className="border border-slate-200 rounded-xl divide-y divide-slate-150 bg-slate-50/30 overflow-hidden">
                    {Object.values(process.extractedFields).map((f) => (
                      <div key={f.fieldName} className="p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">{f.label}</span>
                          <span className="font-mono text-slate-900 text-xs font-bold bg-white border border-slate-200 px-2 py-0.5 rounded shadow-xs inline-block">
                            {f.manuallyCorrectedValue || f.extractedValue}
                          </span>
                          {f.isCorrected && (
                            <span className="text-[10px] text-emerald-600 font-bold ml-2">(Saneado Manualmente)</span>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-[10.5px] text-slate-400 italic font-mono hidden sm:inline">Origem: {f.docSource}</span>
                          <span className={`text-xs font-semibold font-mono px-2 py-0.5 rounded-sm ${getConfidenceColor(f.confidence)}`}>
                            {f.confidence}% Confiança
                          </span>

                          {editingField === f.fieldName ? (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="border border-slate-300 text-xs rounded px-2 py-0.5 max-w-[120px] focus:outline-none bg-white"
                              />
                              <button
                                onClick={() => handleSaveCorrection(f.fieldName)}
                                className="p-1 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingField(null)}
                                className="p-1 text-slate-400 bg-slate-100 hover:bg-slate-200 rounded"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingField(f.fieldName);
                                setEditValue(f.manuallyCorrectedValue || f.extractedValue);
                              }}
                              className="p-1.5 text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded-md transition-colors"
                              title="Corrigir Manualmente"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-3.5 bg-indigo-50 border border-indigo-100 text-indigo-900 rounded-xl text-xs">
                    💡 <strong>Conferência Manual:</strong> Campos abaixo de 75% geram alertas para evitar que erros de leitura fiquem por identificar. Você pode ajustar qualquer dado livremente.
                  </div>
                </div>
              )}

              {/* STEP 3: DIVERGÊNCIAS */}
              {wizardStep === 3 && (
                <div className="space-y-5 animate-fade-in text-left">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Etapa 3: Confrontamento Comparativo (Divergências Encontradas)</h3>
                    <p className="text-xs text-slate-500">
                      Cruzamento de informações entre Documentos de Origem (Invoice, BL) contra o Rascunho da Declaração Nacional (DUADO). Diferenças identificadas de imediato:
                    </p>
                  </div>

                  {process.discrepancies.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 space-y-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                      <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto" />
                      <p className="text-xs">Não foram identificadas divergências de transporte ou valores nesta pasta. Integridade de dados OK!</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {process.discrepancies.map((d) => (
                        <div 
                          key={d.id}
                          className={`p-4 rounded-xl border flex flex-col justify-between gap-3 ${
                            d.isCorrected 
                              ? 'border-emerald-200 bg-emerald-50/10 opacity-70' 
                              : d.severity === 'critical'
                                ? 'border-rose-200 bg-rose-50/10'
                                : 'border-amber-200 bg-amber-50/10'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5 font-display">
                                {getDiscrepancyIcon(d.severity)}
                                {d.title}
                              </span>
                              {d.isCorrected && (
                                <span className="text-emerald-600 font-bold text-[10px] inline-flex items-center gap-0.5 bg-emerald-50 border border-emerald-100 px-1 py-0.5 rounded">
                                  <Check className="w-3 h-3" /> Corrigido
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 mt-1">{d.description}</p>
                          </div>

                          <div className="bg-white border border-slate-200 p-2.5 rounded-lg text-xs space-y-1 font-mono">
                            <div className="flex justify-between text-[10.5px] text-slate-400">
                              <span>A: {d.documentA}</span>
                              <span>B: {d.documentB}</span>
                            </div>
                            <div className="flex justify-between items-center font-bold text-slate-850">
                              <span className="bg-rose-50 border border-rose-100 text-rose-700 px-1.5 rounded">{d.valA}</span>
                              <span className="text-slate-400">≠</span>
                              <span className="bg-amber-50 border border-amber-100 text-amber-700 px-1.5 rounded">{d.valB}</span>
                            </div>
                          </div>

                          {!d.isCorrected && (
                            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 mt-1.5">
                              <span className="text-slate-400 text-[10px]">Espera-se correspondência mútua</span>
                              <button
                                onClick={() => {
                                  setEditingField(d.fieldA);
                                  setEditValue(d.valB); // prefill with match
                                  setWizardStep(2); // take them to edit screen to confirm
                                }}
                                className="text-[10px] font-bold text-emerald-600 hover:text-white hover:bg-emerald-600 bg-emerald-50 px-2.5 py-1 rounded transition-colors"
                              >
                                Sanear com {d.valB}
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 4: PAUTA E LICENÇAS */}
              {wizardStep === 4 && (
                <div className="space-y-5 animate-fade-in text-left">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Etapa 4: Requisitos Ministeriais Regional Moçambique (Pauta SADC)</h3>
                    <p className="text-xs text-slate-500">
                      O produto classificado sob o código HS detectado exige licenças adicionais de importação (de acordo com regulamentos fitossanitários / MAPA ou sanitários / MISAU):
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Licença sanitária status check */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xs text-slate-700">Licença Governamental Requerida</h4>
                        <span className="text-[10px] bg-indigo-50 border border-indigo-150 text-indigo-700 px-2 py-0.5 rounded uppercase font-bold font-mono">Pauta SADC</span>
                      </div>
                      
                      <p className="text-xs text-slate-600">
                        Inspeção fitossanitária requerida pela delegação nacional para desembaraço de grãos e cereais no porto moçambicano.
                      </p>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-semibold">Status do Anexo:</span>
                        {process.checklist.mapaLicenseConfirmed ? (
                          <span className="text-xs text-emerald-700 font-bold inline-flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                            <Check className="w-3.5 h-3.5" /> Anexo Presente e Válido
                          </span>
                        ) : (
                          <span className="text-xs text-amber-700 font-bold inline-flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                            <AlertTriangle className="w-3.5 h-3.5" /> Ficheiro Ausente
                          </span>
                        )}
                      </div>
                    </div>

                    {/* HS Code verification ledger */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xs text-slate-700">Veracidade do HS Code Utilizado</h4>
                        <span className="text-[10px] bg-emerald-50 border border-emerald-150 text-emerald-700 px-2 py-0.5 rounded uppercase font-bold font-mono">OK</span>
                      </div>

                      <p className="text-xs text-slate-600">
                        Código aduaneiro declarado confrontado com a pauta de produtos importados vigente.
                      </p>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-semibold">Situação:</span>
                        {process.checklist.hsCodeConfirmed ? (
                          <span className="text-xs text-emerald-700 font-bold inline-flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                            <Check className="w-3.5 h-3.5" /> Código Válido na Pauta SADC
                          </span>
                        ) : (
                          <span className="text-xs text-rose-700 font-bold inline-flex items-center gap-1 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                            <AlertTriangle className="w-3.5 h-3.5" /> Código Não Catalogado
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-900 text-white rounded-xl text-xs space-y-1">
                    <p className="font-bold text-emerald-450">✓ Nota aos Despachantes:</p>
                    <p className="text-slate-350">
                      Submeter manifestos sem conformidade ministerial regional (certificados fitossanitários anexados no Porto de Maputo ou Beira) incorre em multas pesadas e em apreensão imediata de mercadorias no cais.
                    </p>
                  </div>
                </div>
              )}

              {/* STEP 5: TRANSMISSAO DUADO */}
              {wizardStep === 5 && (
                <div className="space-y-5 animate-fade-in text-left">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Etapa 5: Transmissão Eletrônica e Checklist Pré-Submissão</h3>
                    <p className="text-xs text-slate-500">
                      Revisão dos pontos-chave de integridade antes do envio final e liquidação tributária junto à Alfândega Moçambicana:
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4 text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                          <span className="text-slate-500 font-semibold">Commercial Invoice Validada</span>
                          {process.checklist.invoiceValidated ? (
                            <span className="text-emerald-700 font-bold inline-flex items-center gap-1"><Check className="w-4 h-4" /> Sim</span>
                          ) : (
                            <span className="text-slate-400 inline-flex items-center gap-1"><X className="w-4 h-4" /> Não</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                          <span className="text-slate-500 font-semibold">Bill of Lading Marítimo Confirmado</span>
                          {process.checklist.blValidated ? (
                            <span className="text-emerald-700 font-bold inline-flex items-center gap-1"><Check className="w-4 h-4" /> Sim</span>
                          ) : (
                            <span className="text-slate-400 inline-flex items-center gap-1"><X className="w-4 h-4" /> Não</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                          <span className="text-slate-500 font-semibold">Integridade de Pesos Transmitíveis</span>
                          {process.checklist.weightConfirmed ? (
                            <span className="text-emerald-700 font-bold inline-flex items-center gap-1"><Check className="w-4 h-4" /> Sem Desvio</span>
                          ) : (
                            <span className="text-amber-700 font-bold inline-flex items-center gap-1">⚠ Divergência</span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                          <span className="text-slate-500 font-semibold">Classificação Tarifária Aduaneira</span>
                          {process.checklist.hsCodeConfirmed ? (
                            <span className="text-emerald-700 font-bold inline-flex items-center gap-1"><Check className="w-4 h-4" /> Válida</span>
                          ) : (
                            <span className="text-rose-600 font-bold inline-flex items-center gap-1">⚠ Erro de Pauta</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                          <span className="text-slate-500 font-semibold">Licença SADC anexada</span>
                          {process.checklist.mapaLicenseConfirmed ? (
                            <span className="text-emerald-700 font-bold inline-flex items-center gap-1"><Check className="w-4 h-4" /> Presente</span>
                          ) : (
                            <span className="text-amber-700 font-bold inline-flex items-center gap-1">⚠ Ausente</span>
                          )}
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Submission and block states */}
                  {hasUncorrectedCritical && !process.checklist.adminOverridden ? (
                    <div className="p-4 bg-rose-50 border-2 border-rose-200 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-rose-800">
                        <AlertOctagon className="w-5 h-5 shrink-0" />
                        <h4 className="font-bold text-xs uppercase tracking-widest">SUBMISSÃO BLOQUEADA PELA AUDITORIA</h4>
                      </div>
                      <p className="text-xs text-rose-750">
                        Há discrepâncias críticas ativas detectadas na verificação cruzada (ex: incompatibilidade de contentores de embarque). Retifique estes campos antes de prosseguir com a declaração governamental.
                      </p>

                      <div className="flex items-center gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setWizardStep(2)}
                          className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow cursor-pointer transition-colors"
                        >
                          Corrigir Campo na Etapa 2
                        </button>
                        
                        {user.role === 'Admin' ? (
                          <button
                            type="button"
                            onClick={() => onOverrideProcess(process.id)}
                            className="px-4 py-2 text-xs font-bold text-rose-900 bg-rose-100 hover:bg-rose-200 rounded-lg border border-rose-300 transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <Unlock className="w-3.5 h-3.5" /> Forçar Override (Supervisor)
                          </button>
                        ) : (
                          <span className="text-[10.5px] text-slate-400 italic font-medium block">
                            *Controlo restrito a utilizadores com perfil de Administrador. Sindicância necessária.
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-emerald-50 border border-emerald-250 rounded-xl">
                      {process.checklist.adminOverridden && (
                        <div className="text-xs text-amber-800 font-bold flex items-center gap-1 pb-1 mb-2 border-b border-amber-200">
                          <Unlock className="w-3.5 h-3.5 text-amber-600" /> Aprovação Forçada Aceita: Supervisor {process.checklist.overriddenBy}
                        </div>
                      )}
                      
                      <p className="text-xs text-emerald-800 font-bold flex items-center gap-1.5 leading-none">
                        <CheckCircle className="w-4 h-4 text-emerald-600" /> Prontidão documental de Compliance Validada na Totalidade!
                      </p>
                      <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                        Todos os parâmetros foram cruzados sem desvios significativos no Porto de {process.port}.
                      </p>
                    </div>
                  )}

                  {/* Submit trigger button */}
                  <button
                    disabled={hasUncorrectedCritical && !process.checklist.adminOverridden || process.status === 'Submetido'}
                    onClick={() => onSubmitProcess(process.id)}
                    className="w-full py-4 text-xs font-bold uppercase tracking-wider text-center text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-100 disabled:text-slate-400 rounded-xl shadow transition-all cursor-pointer"
                  >
                    {process.status === 'Submetido' 
                      ? '✓ Pasta Digital Submetida com Sucesso' 
                      : 'TRANSMITIR MANIFESTO ADUANEIRO / TRANSMITIR DUADO'}
                  </button>

                  {process.status === 'Submetido' && (
                    <div className="p-5 rounded-xl border bg-slate-50 border-slate-200 text-slate-800 space-y-4 animate-fade-in mt-4">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                        <div className="flex items-center gap-2">
                          <FolderOpen className="w-5 h-5 text-emerald-600" />
                          <div>
                            <h4 className="font-bold text-xs text-slate-900 uppercase">Alfândegas de Moçambique — JUE / MCNET</h4>
                            <p className="text-[10px] text-slate-400 font-mono">D.U. Nº: {process.id}-MZ26 / REF: {process.internNumber}</p>
                          </div>
                        </div>
                        <span className="text-[10px] bg-slate-200 border border-slate-300 text-slate-700 font-bold px-2 py-0.5 rounded font-mono">
                          Processo Liquidado
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div className="p-3.5 rounded-lg bg-white border border-slate-200/80 space-y-1">
                          <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Canal de Seleção</span>
                          <div className="flex items-center gap-1.5 pt-1">
                            {process.canal === 'Verde' && (
                              <>
                                <span className="h-3 w-3 rounded-full bg-emerald-500 block"></span>
                                <span className="text-sm font-bold text-emerald-700 uppercase">Canal Verde</span>
                              </>
                            )}
                            {process.canal === 'Amarelo' && (
                              <>
                                <span className="h-3 w-3 rounded-full bg-amber-500 block"></span>
                                <span className="text-sm font-bold text-amber-700 uppercase">Canal Amarelo</span>
                              </>
                            )}
                            {process.canal === 'Vermelho' && (
                              <>
                                <span className="h-3 w-3 rounded-full bg-rose-500 block animate-pulse"></span>
                                <span className="text-sm font-bold text-rose-700 uppercase">Canal Vermelho</span>
                              </>
                            )}
                            {process.canal === 'Cinzento' && (
                              <>
                                <span className="h-3 w-3 rounded-full bg-slate-600 block"></span>
                                <span className="text-sm font-bold text-slate-700 uppercase">Canal Cinzento</span>
                              </>
                            )}
                          </div>
                          
                          <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                            {process.canal === 'Verde' && 'Desembaraço imediato concedido (Livre Prática). Carga autorizada para levantamento portuário imediatamente.'}
                            {process.canal === 'Amarelo' && 'Retenção temporária para verificação cruzada de documentos de suporte físicos pela equipe de vistoria documental.'}
                            {process.canal === 'Vermelho' && 'Vistoria física compulsória das mercadorias agendada no terminal de cargas do porto devido a inconsistências registadas.'}
                            {process.canal === 'Cinzento' && 'Dossiê submetido a auditoria de valor aduaneiro e declarações de origem posteriores pela Direção de Serviços Aduaneiros.'}
                          </p>
                        </div>

                        <div className="p-3.5 rounded-lg bg-white border border-slate-200/80 space-y-1.5">
                          <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Cálculo de Tributos Oficiais SADC</span>
                          <div className="flex justify-between font-mono font-semibold text-slate-600 pt-1">
                            <span>FOB/CIF Processado:</span>
                            <span className="text-slate-800">
                              {(Number(process.extractedFields.valorFobCif?.manuallyCorrectedValue || process.extractedFields.valorFobCif?.extractedValue || 0)).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                            </span>
                          </div>
                          <div className="flex justify-between font-mono font-semibold text-slate-600">
                            <span>Tarifa Consolidada (Direitos + IVA):</span>
                            <span className="text-emerald-750 font-bold text-emerald-700">
                              {process.id === 'IMP-2026-001' ? '$17,640.00' : '$15,288.00'}
                            </span>
                          </div>
                          <div className="flex justify-between font-mono font-bold text-slate-900 pt-1.5 border-t border-slate-150">
                            <span>Estado da Guia JUE:</span>
                            <span className="text-blue-600 text-[10px] uppercase bg-blue-50 px-1.5 rounded border border-blue-200 font-sans">
                              Paga via Banco (Liquidada)
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-[10px] text-slate-400 italic font-mono">
                        *A transmissão e o processamento de impostos integraram as tabelas regulatórias do JUE Moçambique MCNET sob protocolo fiscal ativo. No. Operação: JUE-TX-{process.id}-2026.
                      </p>
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* WIZARD ACTIONS NAV FOOTER CODES */}
            <div className="mt-8 pt-4 border-t border-slate-200 flex items-center justify-between">
              <button
                disabled={wizardStep === 1}
                onClick={() => setWizardStep(prev => prev - 1)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 px-4.5 py-2.5 rounded-lg shadow-xs transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </button>

              <div className="text-slate-400 text-xs font-semibold">
                Passo {wizardStep} de 5
              </div>

              {wizardStep < 5 ? (
                <button
                  onClick={() => setWizardStep(prev => prev + 1)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 px-4.5 py-2.5 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Seguinte
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={onBack}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-750 bg-emerald-50 hover:bg-emerald-100 px-4.5 py-2.5 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  ✓ Concluir e Sair
                </button>
              )}
            </div>

          </div>

        </div>
      ) : (
        /* ORIGINAL CONSOLIDATED VIEW GRID */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in text-left">
          
          {/* Extracted fields - 7 cols */}
          <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-200">
              <h4 className="font-semibold text-slate-800 text-sm font-display uppercase tracking-wider">Extração Inteligente OCR e Confiança</h4>
            </div>

            <div className="p-5 space-y-4">
              <div className="text-xs text-indigo-950 font-medium bg-indigo-50 border border-indigo-100 rounded-lg p-3 flex items-start gap-2">
                <Scan className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <p>Confiança Baixa (Abaixo de 75%): Indica necessidade de conferência manual no campo correspondente.</p>
                </div>
              </div>

              <div className="divide-y divide-slate-150 border-b border-slate-200">
                {Object.values(process.extractedFields).map((f) => (
                  <div key={f.fieldName} className="py-3.5 flex flex-wrap items-center justify-between gap-4 text-xs">
                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">{f.label}</span>
                      <span className="font-mono text-emerald-950 text-xs font-semibold bg-slate-50 border border-slate-200/65 px-2 py-0.5 rounded">
                        {f.manuallyCorrectedValue || f.extractedValue}
                      </span>
                      {f.isCorrected && (
                        <span className="text-[10px] text-emerald-600 font-semibold ml-2">(Saneado Manualmente)</span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-slate-400 italic font-mono hidden sm:inline">Fonte: {f.docSource}</span>
                      <span className={`text-xs font-semibold font-mono px-2 py-0.5 rounded-sm ${getConfidenceColor(f.confidence)}`}>
                        {f.confidence}% Confiança
                      </span>

                      {editingField === f.fieldName ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            placeholder="Ex: MSCU1234567"
                            className="border border-slate-300 text-xs rounded-lg px-2 py-1 max-w-[120px] focus:outline-none"
                          />
                          <button
                            onClick={() => handleSaveCorrection(f.fieldName)}
                            className="p-1 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingField(null)}
                            className="p-1 text-slate-400 bg-slate-100 hover:bg-slate-200 rounded"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingField(f.fieldName);
                            setEditValue(f.manuallyCorrectedValue || f.extractedValue);
                          }}
                          className="p-1.5 text-slate-405 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md transition-colors"
                          title="Corrigir Manualmente"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-[11px] text-slate-405">
                *O motor do app LJ atribui scores menores em campos com caligrafia danificada, códigos de faturas similares ou redacção incomum, pedindo que um despachante valide.
              </div>
            </div>
          </div>

          {/* Side Logs and verification checklists - 5 cols */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Detected anomalies cards */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <h4 className="font-semibold text-slate-800 text-sm font-display uppercase tracking-wider">Cruzamento de Dados (Divergências)</h4>
                <span className="text-xs bg-rose-50 text-rose-600 font-semibold px-2 py-0.5 rounded-full border border-rose-100">
                  {process.discrepancies.filter(d => !d.isCorrected).length} Ativas
                </span>
              </div>

              <div className="p-4 space-y-4">
                {process.discrepancies.length === 0 ? (
                  <div className="py-8 text-center text-slate-450 space-y-2">
                    <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto" />
                    <p className="text-xs">Nenhuma divergência documental recomendando retificação.</p>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {process.discrepancies.map((d) => (
                      <div 
                        key={d.id} 
                        className={`p-3.5 rounded-xl border flex flex-col gap-3 transition-colors ${
                          d.isCorrected 
                            ? 'border-emerald-200 bg-emerald-50/20 opacity-80' 
                            : d.severity === 'critical'
                              ? 'border-rose-200 bg-rose-50/10'
                              : 'border-slate-200 bg-slate-50/30'
                        }`}
                      >
                        <div>
                          <p className="font-bold text-slate-800 text-xs flex items-center gap-1.5 font-display">
                            {getDiscrepancyIcon(d.severity)}
                            {d.title}
                          </p>
                          <p className="text-xs text-slate-600 mt-1">{d.description}</p>
                        </div>

                        <div className="bg-slate-50 border border-slate-150 p-2.5 rounded-lg text-xs space-y-1.5 font-mono">
                          <div className="flex justify-between items-center text-slate-400">
                            <span className="truncate">{d.documentA}</span>
                            <span className="truncate">{d.documentB}</span>
                          </div>
                          <div className="flex justify-between items-center font-bold text-slate-900">
                            <span className="text-rose-700 bg-rose-50 border border-rose-100 px-1.5 rounded">{d.valA}</span>
                            <span>≠</span>
                            <span className="text-amber-700 bg-amber-50 border border-amber-100 px-1.5 rounded">{d.valB}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-150">
                          <span className="text-[10px] text-slate-400">Resolvido?</span>
                          {d.isCorrected ? (
                            <span className="text-emerald-700 font-bold">Sim • Saneado</span>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingField(d.fieldA);
                                setEditValue(d.valB);
                              }}
                              className="text-[10px] font-bold text-emerald-600 hover:text-white hover:bg-emerald-600 bg-emerald-50 px-2.5 py-1 rounded transition-colors"
                            >
                              Corrigir Agora
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Checklist Pre submissions */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="px-5 py-4 bg-slate-50 border-b border-slate-200">
                <h4 className="font-semibold text-slate-800 text-sm font-display uppercase tracking-wider">Checklist Inteligente Pré-Submissão</h4>
              </div>

              <div className="p-5 space-y-5">
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 font-semibold">Fatura Validada (Commercial Invoice)</span>
                    {process.checklist.invoiceValidated ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-1"><Check className="w-4 h-4" /> Validada</span>
                    ) : (
                      <span className="text-slate-400 inline-flex items-center gap-1"><X className="w-4 h-4" /> Pendente</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 font-semibold">BL Conhecimento Marítimo Validado</span>
                    {process.checklist.blValidated ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-1"><Check className="w-4 h-4" /> Validado</span>
                    ) : (
                      <span className="text-slate-400 inline-flex items-center gap-1"><X className="w-4 h-4" /> Pendente</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 font-semibold">Peso Bruto &amp; Líquido Confirmado</span>
                    {process.checklist.weightConfirmed ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-1"><Check className="w-4 h-4" /> Sem Divergência</span>
                    ) : (
                      <span className="text-amber-700 font-bold inline-flex items-center gap-1">⚠ Peso Divergente</span>
                    )}
                  </div>
                </div>

                {/* Overrides and submit */}
                {hasUncorrectedCritical && !process.checklist.adminOverridden ? (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                    <h5 className="font-bold text-xs text-rose-700 font-display">SUBMISSÃO BLOQUEADA</h5>
                    <p className="text-[11px] text-rose-600 leading-normal">
                      Existem erros críticos pendentes. Corrija na tabela ou solicite o Override de aprovação.
                    </p>
                    <div className="pt-2 flex items-center gap-3">
                      {user.role === 'Admin' && (
                        <button
                          onClick={() => onOverrideProcess(process.id)}
                          className="text-[10px] font-bold text-rose-900 bg-rose-100 hover:bg-rose-200 px-3 py-1.5 rounded transition-colors"
                        >
                          Forçar Aprovação
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-emerald-50 border border-emerald-250 rounded-xl">
                    <p className="text-xs text-emerald-800 font-bold">✓ Prontidão aduaneira válida!</p>
                  </div>
                )}

                <button
                  disabled={hasUncorrectedCritical && !process.checklist.adminOverridden || process.status === 'Submetido'}
                  onClick={() => onSubmitProcess(process.id)}
                  className="w-full py-3.5 text-xs font-bold uppercase tracking-wider text-center text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-100 disabled:text-slate-400 rounded-xl shadow cursor-pointer transition-colors"
                >
                  {process.status === 'Submetido' ? '✓ Dossiê Submetido' : 'Submeter e Transmitir Manifestos'}
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
