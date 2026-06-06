/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  X, 
  FileText, 
  UploadCloud, 
  Check, 
  AlertCircle,
  HelpCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { ProcessType, PortType } from '../types';

interface NewAuditModalProps {
  onClose: () => void;
  onSubmit: (data: {
    client: string;
    internNumber: string;
    type: ProcessType;
    port: PortType;
    simulatedFiles: { type: string; name: string }[];
  }) => void;
}

export default function NewAuditModal({ onClose, onSubmit }: NewAuditModalProps) {
  const [client, setClient] = useState('');
  const [internNumber, setInternNumber] = useState('');
  const [type, setType] = useState<ProcessType>('Importação');
  const [port, setPort] = useState<PortType>('Maputo');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Simulated uploads for mandatory & complementary files
  const [uploads, setUploads] = useState<Record<string, string>>({
    invoice: '',
    packing_list: '',
    bl_awb: '',
    duado: '',
    license: '',
    certificate: ''
  });

  const handleSimulatedUpload = (key: string, defaultName: string) => {
    setUploads(prev => ({
      ...prev,
      [key]: prev[key] ? '' : defaultName
    }));
  };

  const handleDraftSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!client.trim()) {
      setErrorMsg('Por favor defina o nome do Cliente / Empresa.');
      return;
    }
    if (!internNumber.trim()) {
      setErrorMsg('Por favor especifique o Número do Processo Interno.');
      return;
    }

    setLoading(true);

    const uploadedList = Object.entries(uploads)
      .filter(([_, value]) => !!value)
      .map(([key, value]) => ({ type: key, name: value as string }));

    setTimeout(() => {
      onSubmit({
        client,
        internNumber,
        type,
        port,
        simulatedFiles: uploadedList
      });
      setLoading(false);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="relative bg-white rounded-xl shadow-xl border border-slate-200 max-w-2xl w-full overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg font-display text-emerald-400">Criar Nova Pasta Digital Aduaneira</h3>
            <p className="text-xs text-slate-300">Entrada de dados e upload inteligente para conformidade documental</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal body */}
        <form onSubmit={handleDraftSubmit} className="p-6 space-y-6">

          {/* Quick Demo Fill Buttons */}
          <div className="bg-emerald-50/70 border border-emerald-150 p-4 rounded-xl space-y-2.5 text-left">
            <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
              <span>⚡ Preenchimento Rápido de Teste (1-Clique)</span>
            </div>
            <p className="text-[11px] text-slate-600">
              Não quer preencher campos vazios? Escolha um dos casos reais de teste em Moçambique para carregar tudo, incluindo as simulações dos ficheiros:
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setClient('ABC TRADING LDA');
                  setInternNumber('IMP-2026-0812');
                  setType('Importação');
                  setPort('Maputo');
                  setUploads({
                    invoice: 'fatura_commercial_f52.pdf',
                    packing_list: 'packing_list_arroz.pdf',
                    bl_awb: 'bl_maersk_99018.pdf',
                    duado: 'duado_draft_mo98.pdf',
                    license: 'licenca_sanitaria_agricultura.pdf',
                    certificate: 'certificado_origem_sadc.pdf'
                  });
                }}
                className="bg-emerald-650 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs px-3.5 py-2 rounded-lg transition-colors shadow-sm cursor-pointer"
              >
                Caso 1: Importação de Arroz (Maputo)
              </button>
              <button
                type="button"
                onClick={() => {
                  setClient('MEDIS FARMACÊUTICA LDA');
                  setInternNumber('IMP-2026-1044');
                  setType('Importação');
                  setPort('Beira');
                  setUploads({
                    invoice: 'invoice_medis_pharma_germany.pdf',
                    packing_list: 'packing_medical_pack.pdf',
                    bl_awb: 'bl_safmarine_8112.pdf',
                    duado: 'duado_draft_medicamentos.pdf',
                    license: 'licenca_misau_farmacia.pdf',
                    certificate: 'certificado_conformidade.pdf'
                  });
                }}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3.5 py-2 rounded-lg transition-colors shadow-sm cursor-pointer"
              >
                Caso 2: Medicamentos SADC (Porto Beira)
              </button>
            </div>
          </div>
          
          {errorMsg && (
            <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-lg flex items-center gap-2 border border-rose-200">
              <AlertCircle className="w-4 h-4" />
              {errorMsg}
            </div>
          )}

          {/* Form parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Cliente */}
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">Cliente / Empresa adquirente</label>
              <input
                type="text"
                placeholder="Ex. ABC Trading Lda"
                value={client}
                onChange={(e) => setClient(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            {/* Número interno */}
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">Nº Processo Interno</label>
              <input
                type="text"
                placeholder="Ex. A-98782"
                value={internNumber}
                onChange={(e) => setInternNumber(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            {/* Tipo */}
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">Regime aduaneiro</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setType('Importação')}
                  className={`py-2 text-sm font-semibold rounded-lg border text-center transition-all ${
                    type === 'Importação'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-1 ring-emerald-500'
                      : 'border-slate-300 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  Importação
                </button>
                <button
                  type="button"
                  onClick={() => setType('Exportação')}
                  className={`py-2 text-sm font-semibold rounded-lg border text-center transition-all ${
                    type === 'Exportação'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-1 ring-emerald-500'
                      : 'border-slate-300 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  Exportação
                </button>
              </div>
            </div>

            {/* Porto */}
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">Porto de Entrada / Desembaraço</label>
              <select
                value={port}
                onChange={(e) => setPort(e.target.value as PortType)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="Maputo">Maputo</option>
                <option value="Beira">Beira</option>
                <option value="Nacala">Nacala</option>
                <option value="Outro">Outro Porto</option>
              </select>
            </div>
          </div>

          {/* Smart Upload Workspace */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200">
              <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">Upload Inteligente (Anexar PDFs/Imagens)</h4>
            </div>

            <div className="p-4 space-y-4">
              <p className="text-xs text-slate-500">
                Anexe os ficheiros para validação cruzada automática de dados. Dica: Clique nos slots para simular o upload de documentos de amostras em Moçambique.
              </p>

              {/* Documentos Principais Section */}
              <div className="space-y-2.5">
                <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Documentos Principais (Obrigatórios)</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* Commercial Invoice */}
                  <div 
                    onClick={() => handleSimulatedUpload('invoice', 'fatura_commercial_f52.pdf')}
                    className={`p-3 rounded-lg border cursor-pointer flex flex-col justify-between gap-1.5 transition-all group ${
                      uploads.invoice 
                        ? 'border-emerald-500 bg-emerald-50/60 ring-1 ring-emerald-500' 
                        : 'border-slate-250 hover:border-slate-350 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-1.5 rounded ${uploads.invoice ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-semibold text-slate-800">Commercial Invoice (Fatura Comercial)</p>
                          <p className="text-[10px] text-slate-400">{uploads.invoice ? uploads.invoice : 'Clique para simular upload'}</p>
                        </div>
                      </div>
                      {uploads.invoice ? (
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <UploadCloud className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors shrink-0" />
                      )}
                    </div>
                    {uploads.invoice && (
                      <div className="w-full text-[10px] text-emerald-800 bg-emerald-100/50 px-2 py-1 rounded border border-emerald-200 mt-1">
                        ✨ Fatura #ABC-2026-881 pronta para o motor LJ. Arroz Parboilizado (Peso: 10.050 KG).
                      </div>
                    )}
                  </div>

                  {/* Bill of Lading / Air Waybill */}
                  <div 
                    onClick={() => handleSimulatedUpload('bl_awb', 'bl_maersk_99018.pdf')}
                    className={`p-3 rounded-lg border cursor-pointer flex flex-col justify-between gap-1.5 transition-all group ${
                      uploads.bl_awb 
                        ? 'border-emerald-500 bg-emerald-50/60 ring-1 ring-emerald-500' 
                        : 'border-slate-250 hover:border-slate-350 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-1.5 rounded ${uploads.bl_awb ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-semibold text-slate-800">Conhecimento de Embarque (BL)</p>
                          <p className="text-[10px] text-slate-400">{uploads.bl_awb ? uploads.bl_awb : 'Clique para simular upload'}</p>
                        </div>
                      </div>
                      {uploads.bl_awb ? (
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <UploadCloud className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors shrink-0" />
                      )}
                    </div>
                    {uploads.bl_awb && (
                      <div className="w-full text-[10px] text-emerald-800 bg-emerald-100/50 px-2 py-1 rounded border border-emerald-200 mt-1">
                        ✨ BL Maersk #99172 pronta: Contentor MSCU1234567 (Rota Mumbai-Maputo).
                      </div>
                    )}
                  </div>

                </div>
              </div>

              {/* Complementary Section */}
              <div className="space-y-2.5 pt-2">
                <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Documentos Complementares ou Recomendados</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* Packing List */}
                  <div 
                    onClick={() => handleSimulatedUpload('packing_list', 'packing_list_grains.pdf')}
                    className={`p-3 rounded-lg border cursor-pointer flex flex-col justify-between gap-1.5 transition-all group ${
                      uploads.packing_list 
                        ? 'border-emerald-500 bg-emerald-50/60 ring-1 ring-emerald-500' 
                        : 'border-slate-250 hover:border-slate-350 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-1.5 rounded ${uploads.packing_list ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-semibold text-slate-800">Packing List (Lista de Embalagem)</p>
                          <p className="text-[10px] text-slate-400">{uploads.packing_list ? uploads.packing_list : 'Opcional / Clique para simular'}</p>
                        </div>
                      </div>
                      {uploads.packing_list ? (
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <UploadCloud className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors shrink-0" />
                      )}
                    </div>
                    {uploads.packing_list && (
                      <div className="w-full text-[10px] text-emerald-800 bg-emerald-100/50 px-2 py-1 rounded border border-emerald-200 mt-1">
                        ✨ Lista de Embalagem pronta: 200 sacos sob paletes estriadas de madeira.
                      </div>
                    )}
                  </div>

                  {/* Rascunho DUADO */}
                  <div 
                    onClick={() => handleSimulatedUpload('duado', 'duado_draft_moçambique.pdf')}
                    className={`p-3 rounded-lg border cursor-pointer flex flex-col justify-between gap-1.5 transition-all group ${
                      uploads.duado 
                        ? 'border-emerald-500 bg-emerald-50/60 ring-1 ring-emerald-500' 
                        : 'border-slate-250 hover:border-slate-350 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-1.5 rounded ${uploads.duado ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-semibold text-slate-800">Rascunho Declarativo DUADO</p>
                          <p className="text-[10px] text-slate-400">{uploads.duado ? uploads.duado : 'Opcional / Clique para simular'}</p>
                        </div>
                      </div>
                      {uploads.duado ? (
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <UploadCloud className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors shrink-0" />
                      )}
                    </div>
                    {uploads.duado && (
                      <div className="w-full text-[10px] text-emerald-800 bg-emerald-100/50 px-2 py-1 rounded border border-emerald-200 mt-1">
                        ✨ DUADO preliminar pronto: Pauta 1006.30.90 (Arroz). Código Porto 101.
                      </div>
                    )}
                  </div>

                  {/* Licenças */}
                  <div 
                    onClick={() => handleSimulatedUpload('license', 'licenca_sanitaria_agricultura.pdf')}
                    className={`p-3 rounded-lg border cursor-pointer flex flex-col justify-between gap-1.5 transition-all group ${
                      uploads.license 
                        ? 'border-emerald-500 bg-emerald-50/60 ring-1 ring-emerald-500' 
                        : 'border-slate-250 hover:border-slate-350 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-1.5 rounded ${uploads.license ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-semibold text-slate-800">Licenças e Anuências</p>
                          <p className="text-[10px] text-slate-400">{uploads.license ? uploads.license : 'Opcional / Requerido por pauta'}</p>
                        </div>
                      </div>
                      {uploads.license ? (
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <UploadCloud className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors shrink-0" />
                      )}
                    </div>
                    {uploads.license && (
                      <div className="w-full text-[10px] text-emerald-800 bg-emerald-100/50 px-2 py-1 rounded border border-emerald-200 mt-1">
                        ✨ Licença Fitossanitária de Importação MAPA anexada com sucesso.
                      </div>
                    )}
                  </div>

                  {/* Certificados */}
                  <div 
                    onClick={() => handleSimulatedUpload('certificate', 'certificado_origem_sadc.pdf')}
                    className={`p-3 rounded-lg border cursor-pointer flex flex-col justify-between gap-1.5 transition-all group ${
                      uploads.certificate 
                        ? 'border-emerald-500 bg-emerald-50/60 ring-1 ring-emerald-500' 
                        : 'border-slate-250 hover:border-slate-350 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-1.5 rounded ${uploads.certificate ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-semibold text-slate-800">Certificados (Origem, COI)</p>
                          <p className="text-[10px] text-slate-400">{uploads.certificate ? uploads.certificate : 'Opcional (SADC, EUR.1, etc.)'}</p>
                        </div>
                      </div>
                      {uploads.certificate ? (
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <UploadCloud className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors shrink-0" />
                      )}
                    </div>
                    {uploads.certificate && (
                      <div className="w-full text-[10px] text-emerald-800 bg-emerald-100/50 px-2 py-1 rounded border border-emerald-200 mt-1">
                        ✨ Certificado de Origem SADC para isenção tarifária de exportação.
                      </div>
                    )}
                  </div>

                </div>
              </div>

            </div>
          </div>

          {/* Footer controls */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-sm font-display flex items-center gap-1.5 disabled:opacity-75 transition-colors"
            >
              {loading ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  Salvando Pasta...
                </>
              ) : (
                <>
                  Criar Pasta Digital
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
