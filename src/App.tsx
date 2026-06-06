/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  FolderSync, 
  HelpCircle, 
  User, 
  ShieldCheck, 
  BookOpen, 
  History, 
  AlertTriangle,
  LogOut,
  RefreshCw,
  FolderOpen,
  Lock
} from 'lucide-react';
import { CustomsProcess, AuditLog, HSAdvisorProduct, UserRoleProfile } from './types';
import Dashboard from './components/Dashboard';
import NewAuditModal from './components/NewAuditModal';
import AuditReport from './components/AuditReport';
import ComplianceAdvisor from './components/ComplianceAdvisor';
import AuditHistory from './components/AuditHistory';

export default function App() {
  const [processes, setProcesses] = useState<CustomsProcess[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState({
    activeProcesses: 0,
    criticalCount: 0,
    correctingCount: 0,
    okCount: 0,
    activeAlertsCount: 0,
    totalCostAtRisk: 0,
    dueAlerts: 0,
    correctionsCount: 0,
    costsAvoided: 0
  });

  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'history' | 'advisor'>('dashboard');
  const [selectedProcessId, setSelectedProcessId] = useState<string | null>(null);
  const [showNewAuditModal, setShowNewAuditModal] = useState(false);

  // Simulation settings for User Management (Administrador vs Despachante Operacional Page 7)
  const [userProfile, setUserProfile] = useState<UserRoleProfile>({
    role: 'Operacional',
    name: 'Sofia Tembe',
    email: 'sofia.despache@logiflow.co.mz'
  });

  // Toggle profile role to demonstrate permissions flow
  const handleToggleRole = (role: 'Admin' | 'Operacional') => {
    if (role === 'Admin') {
      setUserProfile({
        role: 'Admin',
        name: 'Dário Meneses',
        email: 'dario.meneses@logiflow.co.mz'
      });
    } else {
      setUserProfile({
        role: 'Operacional',
        name: 'Sofia Tembe',
        email: 'sofia.despache@logiflow.co.mz'
      });
    }
  };

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [resProcesses, resStats] = await Promise.all([
        fetch('/api/processes').then(r => r.json()),
        fetch('/api/stats').then(r => r.json())
      ]);

      if (resProcesses.processes) {
        setProcesses(resProcesses.processes);
      }
      if (resStats) {
        setStats({
          activeProcesses: resStats.activeProcesses,
          criticalCount: resStats.criticalCount,
          correctingCount: resStats.correctingCount,
          okCount: resStats.okCount,
          activeAlertsCount: resStats.activeAlertsCount,
          totalCostAtRisk: resStats.totalCostAtRisk,
          dueAlerts: resStats.dueAlerts,
          correctionsCount: resStats.correctionsCount,
          costsAvoided: resStats.costsAvoided
        });
        if (resStats.logs) {
          setLogs(resStats.logs);
        }
      }
    } catch (e) {
      console.error('Error fetching data from full-stack server endpoints', e);
    } finally {
      setLoading(false);
    }
  };

  // Perform fetching on boot
  useEffect(() => {
    loadAllData();
  }, []);

  const handleCreateProcess = async (data: {
    client: string;
    internNumber: string;
    type: any;
    port: any;
    simulatedFiles: { type: string; name: string }[];
  }) => {
    try {
      // Create primary customs folder
      const response = await fetch('/api/processes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client: data.client,
          internNumber: data.internNumber,
          type: data.type,
          port: data.port
        })
      });
      const resData = await response.json();

      if (resData.process) {
        const newProc = resData.process;

        // Perform uploads for selected simulated goods
        for (const file of data.simulatedFiles) {
          let simulationContent = '';
          const cName = data.client ? data.client.toUpperCase() : 'ABC TRADING LDA';
          const iNum = data.internNumber ? data.internNumber.toUpperCase() : 'IMP-2026-0812';
          const prt = data.port || 'Maputo';

          if (file.type === 'invoice') {
            simulationContent = `Fatura Comercial ABC-811 / Importador ${cName} / Ref ${iNum}. Exportador Global Grains, Sul de Ásia. Artigo: Arroz Parboilizado de Alta qualidade. Marca: Estrela. Quantidade: 200 Sacos. Peso Líquido total: 10000 KG. Peso Bruto: 10050 KG. HS Code: 1006.30.90. Valor aduaneiro CIF Maputo: 45000 USD. Nº Fatura: ABC-2026-881. Porto de Descarga: ${prt} Port.`;
          } else if (file.type === 'packing_list') {
            simulationContent = `Packing List / Lista de Embalagem para Fatura ABC-811 / Importador ${cName}. 200 Sacos de Arroz Parboilizado em 10 Paletes de Madeira. Peso Bruto Total: 10050 KG.`;
          } else if (file.type === 'bl_awb') {
            simulationContent = `Bill of Lading MAERSK99172. Shipper: GLOBAL GRAINS INC. Consignee: ${cName}, Av. 25 de Setembro, Maputo. Port of Loading: Mumbai. Port of Discharge: ${prt}, Moçambique. Container Number: MSCU1234567 (1x20ft Container). Total Gross Weight: 10050 KG. Package count: 200 bags of white parboiled rice.`;
          } else if (file.type === 'duado') {
            simulationContent = `DUADO Rascunho Documento Único Aduaneiro preliminar. Declarante: Despachante Autorizado Nº 22-C. Importador: ${cName}. País de Procedência: Índia. Porto de Entrada: ${prt}. Código Pauta Aduaneira: 10063090. Valores declarados: CIF 45000 USD. Contentor declarado: MSCU1234567. Peso Bruto declarado: 10030 KG.`;
          } else if (file.type === 'license') {
            simulationContent = `LICENÇA FITOSSANITÁRIA DE IMPORTAÇÃO Nº 442/MAPA/2026. Autoridade: Ministério da Agricultura e Desenvolvimento Rural. Importador: ${cName}. Produto autorizado: Arroz Parboilizado. Estado: Emitido e Válido.`;
          } else if (file.type === 'certificate') {
            simulationContent = `Certificado de Origem SADC Ref: MOZ-SADC-599182. Exportador: GLOBAL GRAINS INC, Origem SADC. Isenção Aduaneira aplicável conforme anexo 2 de livre circulação SADC.`;
          }

          await fetch(`/api/processes/${newProc.id}/upload`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              docType: file.type,
              fileName: file.name,
              fileContent: simulationContent
            })
          });
        }

        setShowNewAuditModal(false);
        await loadAllData();
        // Redirect to audit verification right away to let dispatcher inspect
        setSelectedProcessId(newProc.id);
      }
    } catch (e) {
      console.error('Failed to create new aduaneiro folder', e);
    }
  };

  const handleExecuteAIAudit = async (id: string, pastedTexts?: any) => {
    try {
      const response = await fetch(`/api/audit/execute/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pastedTexts })
      });
      const resData = await response.json();
      if (resData.process) {
        await loadAllData();
      }
    } catch (e) {
      console.error('Failed to run machine aduaneiro audit', e);
    }
  };

  const handleUploadFile = async (
    id: string,
    docType: string,
    fileName: string,
    fileContent?: string,
    inlineData?: { data: string; mimeType: string }
  ) => {
    try {
      const response = await fetch(`/api/processes/${id}/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docType,
          fileName,
          fileContent,
          inlineData
        })
      });
      const resData = await response.json();
      if (resData.process) {
        await loadAllData();
      }
    } catch (e) {
      console.error('Failed uploading file to process', e);
    }
  };

  const handleCorrectField = async (id: string, fieldName: string, value: string) => {
    try {
      const response = await fetch(`/api/processes/${id}/fields`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fieldName,
          correctedValue: value,
          userProfile
        })
      });
      const resData = await response.json();
      if (resData.process) {
        await loadAllData();
      }
    } catch (e) {
      console.error('Failed manual correction', e);
    }
  };

  const handleSubmitProcess = async (id: string) => {
    try {
      const response = await fetch(`/api/processes/${id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userProfile })
      });
      const resData = await response.json();
      if (resData.process) {
        await loadAllData();
      }
    } catch (e) {
      console.error('Failed transmission to customs', e);
    }
  };

  const handleOverrideProcess = async (id: string) => {
    try {
      const response = await fetch(`/api/processes/${id}/override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userProfile })
      });
      const resData = await response.json();
      if (resData.process) {
        await loadAllData();
      }
    } catch (e) {
      console.error('Failed admin override bypass', e);
    }
  };

  const handleSearchHSCode = async (query: string): Promise<HSAdvisorProduct> => {
    try {
      const response = await fetch('/api/hs-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      const resData = await response.json();
      return resData.result;
    } catch (e) {
      console.error('Failed searching HS classification', e);
      throw e;
    }
  };

  const handleResetData = async () => {
    if (confirm('Tem certeza que deseja resetar os dados do LJ-Aduaneiro para o estado original de demonstração?')) {
      try {
        await fetch('/api/debug/reset', { method: 'POST' });
        await loadAllData();
        setSelectedProcessId(null);
        setCurrentTab('dashboard');
      } catch (e) {
        console.error(e);
      }
    }
  };

  const activeProcessObj = processes.find(p => p.id === selectedProcessId) || null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      
      {/* Upper Navigation Rail bar */}
      <header className="bg-slate-900 border-b border-slate-800 text-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setSelectedProcessId(null); setCurrentTab('dashboard'); }}>
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center font-bold text-white font-display shadow-sm">
              LJ
            </div>
            <span className="font-extrabold tracking-tight font-display text-lg">
              LJ-<span className="text-emerald-400">Aduaneiro</span>
            </span>
            <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-950 border border-emerald-900 px-1.5 py-0.5 rounded leading-none">MVP</span>
          </div>
          {/* Navigation Tab Links */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            <button
              onClick={() => { setSelectedProcessId(null); setCurrentTab('dashboard'); }}
              className={`px-4 py-2 rounded-lg transition-colors cursor-pointer ${
                currentTab === 'dashboard' && !selectedProcessId 
                  ? 'bg-slate-800 text-emerald-400 font-semibold' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Pastas Operacionais
            </button>
            <button
              onClick={() => { setSelectedProcessId(null); setCurrentTab('advisor'); }}
              className={`px-4 py-2 rounded-lg transition-colors cursor-pointer ${
                currentTab === 'advisor' 
                  ? 'bg-slate-800 text-emerald-400 font-semibold' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Pauta Aduaneira SADC
            </button>
            <button
              onClick={() => { setSelectedProcessId(null); setCurrentTab('history'); }}
              className={`px-4 py-2 rounded-lg transition-colors cursor-pointer ${
                currentTab === 'history' 
                  ? 'bg-slate-800 text-emerald-400 font-semibold' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Auditoria &amp; Compliance
            </button>
          </nav>

          {/* User Simulator Dropdown integrated in header */}
          <div className="flex items-center gap-2">
            <div className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <select
                value={userProfile.role}
                onChange={(e) => handleToggleRole(e.target.value as 'Admin' | 'Operacional')}
                className="bg-transparent border-none text-white text-xs font-bold focus:outline-none focus:ring-0 cursor-pointer p-0 select-none"
              >
                <option value="Operacional" className="bg-slate-900 text-white">Sofia Tembe (Operacional)</option>
                <option value="Admin" className="bg-slate-900 text-white">Dário Meneses (Administrador)</option>
              </select>
            </div>
            
            {/* Minimal permission badge */}
            <div className="hidden lg:flex items-center gap-1.5">
              <span className="text-[10px] bg-sky-950 text-sky-300 font-extrabold border border-sky-900 px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                Supabase Cloud Ativo
              </span>
              {userProfile.role === 'Admin' ? (
                <span className="text-[10px] bg-emerald-950 text-emerald-400 font-bold border border-emerald-900/50 px-2 py-1 rounded-md">
                  Acesso Total
                </span>
              ) : (
                <span className="text-[10px] bg-amber-950 text-amber-400 font-bold border border-amber-900/50 px-2 py-1 rounded-md">
                  Limitação Financeira
                </span>
              )}
            </div>
          </div>

          {/* Mobile Tab Icons */}
          <div className="flex md:hidden items-center gap-1">
            <button
              onClick={() => { setSelectedProcessId(null); setCurrentTab('dashboard'); }}
              className={`p-2 rounded ${currentTab === 'dashboard' && !selectedProcessId ? 'text-emerald-450 bg-slate-800' : 'text-slate-300'}`}
              title="Dashboard"
            >
              <FolderOpen className="w-5 h-5" />
            </button>
            <button
              onClick={() => { setSelectedProcessId(null); setCurrentTab('advisor'); }}
              className={`p-2 rounded ${currentTab === 'advisor' ? 'text-emerald-450 bg-slate-800' : 'text-slate-300'}`}
              title="Pauta SADC"
            >
              <BookOpen className="w-5 h-5" />
            </button>
            <button
              onClick={() => { setSelectedProcessId(null); setCurrentTab('history'); }}
              className={`p-2 rounded ${currentTab === 'history' ? 'text-emerald-450 bg-slate-800' : 'text-slate-300'}`}
              title="Compliance"
            >
              <History className="w-5 h-5" />
            </button>
          </div>

        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 py-6 font-sans">
        
        {loading ? (
          <div className="py-24 text-center space-y-4">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm text-slate-500 font-display font-medium">Carregando painel de compliance LJ-Aduaneiro...</p>
          </div>
        ) : selectedProcessId && activeProcessObj ? (
          
          <AuditReport
            process={activeProcessObj}
            onBack={() => setSelectedProcessId(null)}
            onExecuteAIAudit={handleExecuteAIAudit}
            onCorrectField={handleCorrectField}
            onSubmitProcess={handleSubmitProcess}
            onOverrideProcess={handleOverrideProcess}
            onUploadFile={handleUploadFile}
            user={userProfile}
          />

        ) : (
          
          <>
            {currentTab === 'dashboard' && (
              <Dashboard
                processes={processes}
                stats={{
                  ...stats,
                  costsAvoided: userProfile.role === 'Admin' ? stats.costsAvoided : 0 // semantics: ✖ Sem acesso financeiro for operacional!
                }}
                onSelectProcess={setSelectedProcessId}
                onOpenNewAudit={() => setShowNewAuditModal(true)}
                onOpenAdvisor={() => { setCurrentTab('advisor'); setSelectedProcessId(null); }}
                user={userProfile}
                onResetData={handleResetData}
              />
            )}

            {currentTab === 'advisor' && (
              <ComplianceAdvisor
                onSearchHSCode={handleSearchHSCode}
              />
            )}

            {currentTab === 'history' && (
              <AuditHistory
                logs={logs}
              />
            )}
          </>

        )}

      </main>

      {/* Footer credits block without any margin clutter */}
      <footer className="bg-slate-950 border-t border-slate-900 text-slate-400 py-4 text-xs font-display text-center">
        <p>© {new Date().getFullYear()} LJ-Aduaneiro Moçambique S.A. Todos os direitos reservados de acordo com regulamentos aduaneiros SADC.</p>
      </footer>

      {/* New customs folder popup modal */}
      {showNewAuditModal && (
        <NewAuditModal
          onClose={() => setShowNewAuditModal(false)}
          onSubmit={handleCreateProcess}
        />
      )}

    </div>
  );
}
