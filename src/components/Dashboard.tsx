/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  FolderSync, 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  Plus, 
  Search, 
  ChevronRight, 
  ArrowUpRight, 
  CheckCircle,
  FileText,
  TrendingUp,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { CustomsProcess, ProcessStatus, UserRoleProfile } from '../types';

interface DashboardProps {
  processes: CustomsProcess[];
  stats: {
    activeProcesses: number;
    criticalCount: number;
    correctingCount: number;
    okCount: number;
    activeAlertsCount: number;
    totalCostAtRisk: number;
    dueAlerts: number;
    correctionsCount: number;
    costsAvoided: number;
  };
  onSelectProcess: (id: string) => void;
  onOpenNewAudit: () => void;
  onOpenAdvisor: () => void;
  user: UserRoleProfile;
  onResetData: () => void;
}

export default function Dashboard({
  processes,
  stats,
  onSelectProcess,
  onOpenNewAudit,
  onOpenAdvisor,
  user,
  onResetData
}: DashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [portFilter, setPortFilter] = useState<string>('todos');
  const [showAdvancedStats, setShowAdvancedStats] = useState(false);

  // Filtered processes based on user controls
  const filteredProcesses = processes.filter(p => {
    const matchesSearch = 
      p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.internNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'todos' || p.status === statusFilter;
    const matchesPort = portFilter === 'todos' || p.port === portFilter;

    return matchesSearch && matchesStatus && matchesPort;
  });

  // Helper class for status labels
  const getStatusBadge = (status: ProcessStatus, canal?: 'Verde' | 'Amarelo' | 'Vermelho' | 'Cinzento' | null) => {
    switch (status) {
      case 'OK':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            OK
          </span>
        );
      case 'Em Correção':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            Em Correção
          </span>
        );
      case 'Erro Crítico':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-300">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            Erro Crítico
          </span>
        );
      case 'Submetido':
        if (canal === 'Verde') {
          return (
            <div className="flex flex-col items-center gap-0.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 text-white shadow-xs">
                🟢 Canal Verde
              </span>
              <span className="text-[9px] text-emerald-600 font-bold uppercase tracking-wider font-mono">Livre Prática</span>
            </div>
          );
        }
        if (canal === 'Amarelo') {
          return (
            <div className="flex flex-col items-center gap-0.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500 text-slate-900 shadow-xs">
                🟡 Canal Amarelo
              </span>
              <span className="text-[9px] text-amber-600 font-bold uppercase tracking-wider font-mono">Controle Doc</span>
            </div>
          );
        }
        if (canal === 'Vermelho') {
          return (
            <div className="flex flex-col items-center gap-0.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-600 text-white shadow-xs animate-pulse">
                🔴 Canal Vermelho
              </span>
              <span className="text-[9px] text-rose-600 font-bold uppercase tracking-wider font-mono">Vistoria Física</span>
            </div>
          );
        }
        if (canal === 'Cinzento') {
          return (
            <div className="flex flex-col items-center gap-0.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-700 text-white shadow-xs">
                ⚫ Canal Cinzento
              </span>
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider font-mono">Pós-Desembaraço</span>
            </div>
          );
        }
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
            Submetido
          </span>
        );
    }
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'Alto':
        return <span className="text-rose-600 font-semibold text-xs">Alto</span>;
      case 'Médio':
        return <span className="text-amber-600 font-semibold text-xs">Médio</span>;
      default:
        return <span className="text-slate-500 font-semibold text-xs">Baixo</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Clean elegant header (replaces bloated dark layout block) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 font-display">Pastas Operacionais</h2>
          <p className="text-xs text-slate-500 mt-1">Gerencie suas pastas aduaneiras de importação/exportação e execute análises de conformidade.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={onOpenNewAudit}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow font-display transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Nova Pasta Aduaneira
          </button>

          <button
            onClick={onOpenAdvisor}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4 text-slate-500" /> Consultar Pauta SADC
          </button>
        </div>
      </div>

      {/* Collapsible Ticker of Stats */}
      {!showAdvancedStats ? (
        <div 
          onClick={() => setShowAdvancedStats(true)}
          className="p-4 bg-slate-50/50 hover:bg-slate-50 border border-slate-250/50 hover:border-slate-305 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs transition-colors cursor-pointer group shadow-2xs"
        >
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <strong>{stats.activeProcesses}</strong> Pastas Ativas
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
              <strong className="text-rose-600">{stats.criticalCount}</strong> Alertas Críticos
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <strong className="text-amber-600">{stats.dueAlerts}</strong> Alertas de Prazo
            </span>
            {stats.costsAvoided > 0 && (
              <span className="flex items-center gap-1.5 text-slate-900">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                <strong>{stats.costsAvoided.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 })}</strong> Impedidos em Multas (Supervisor)
              </span>
            )}
          </div>
          <span className="text-xs font-bold text-emerald-600 group-hover:underline flex items-center gap-1">
            Mostrar Métricas e Economias Completas ▲
          </span>
        </div>
      ) : (
        <div className="bg-slate-50/50 border border-slate-200 p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Painel Completo de Métricas</h3>
            <button
              onClick={() => setShowAdvancedStats(false)}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors uppercase cursor-pointer"
            >
              Recolher Painel ▼
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1 */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Processos Ativos</p>
                <h3 className="text-2xl font-bold text-slate-900 font-display">{stats.activeProcesses}</h3>
                <p className="text-xs text-slate-500">Pastas Digitais em andamento</p>
              </div>
              <div className="p-3 rounded-lg bg-teal-50 text-teal-600">
                <FolderSync className="w-5 h-5" />
              </div>
            </div>

            {/* KPI 2 */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Alertas Críticos</p>
                <h3 className="text-2xl font-bold text-rose-600 font-display">{stats.criticalCount}</h3>
                <p className="text-xs text-rose-500">Inconsistências impeditivas</p>
              </div>
              <div className="p-3 rounded-lg bg-rose-50 text-rose-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>

            {/* KPI 3 */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Alertas de Prazo</p>
                <h3 className="text-2xl font-bold text-amber-600 font-display">{stats.dueAlerts}</h3>
                <p className="text-xs text-slate-500">Storage / Demurrage &lt; 5 dias</p>
              </div>
              <div className="p-3 rounded-lg bg-amber-50 text-amber-600">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            {/* KPI 4 */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Custos em Risco</p>
                <h3 className="text-2xl font-bold text-slate-950 font-display">
                  {stats.totalCostAtRisk.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 })}
                </h3>
                <p className="text-xs text-slate-500">Estimativas de multas de alfândega</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-100 text-slate-700">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Table Segment */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Controls */}
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por Processo, Cliente ou Nº Interno..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 w-full text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50/50"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Filter by Status */}
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs border border-slate-300 rounded-lg p-1.5 focus:outline-none bg-white text-slate-700"
              >
                <option value="todos">Todos Status</option>
                <option value="OK">OK</option>
                <option value="Em Correção">Em Correção</option>
                <option value="Erro Crítico">Erro Crítico</option>
                <option value="Submetido">Submetido</option>
              </select>
            </div>

            {/* Filter by Port */}
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Porto</label>
              <select
                value={portFilter}
                onChange={(e) => setPortFilter(e.target.value)}
                className="text-xs border border-slate-300 rounded-lg p-1.5 focus:outline-none bg-white text-slate-700"
              >
                <option value="todos">Todos Portos</option>
                <option value="Maputo">Maputo</option>
                <option value="Beira">Beira</option>
                <option value="Nacala">Nacala</option>
              </select>
            </div>
          </div>
        </div>

        {/* Processes List Table */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider">
                <th className="px-6 py-3.5">Processo</th>
                <th className="px-6 py-3.5">Cliente</th>
                <th className="px-6 py-3.5 text-center">Status</th>
                <th className="px-6 py-3.5 text-center">Risco</th>
                <th className="px-6 py-3.5 text-center">Resolução de Prazo</th>
                <th className="px-6 py-3.5">Última Atualização</th>
                <th className="px-6 py-3.5 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150">
              {filteredProcesses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    Nenhuma pasta digital aduaneira coincide com os filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredProcesses.map((p) => (
                  <tr 
                    key={p.id}
                    className="hover:bg-slate-50/50 cursor-pointer group transition-colors"
                    onClick={() => onSelectProcess(p.id)}
                  >
                    <td className="px-6 py-4 font-semibold text-slate-900 border-l-4 border-transparent group-hover:border-emerald-500 transition-all font-mono text-xs">
                      {p.id}
                      <span className="block text-[10px] text-slate-400 font-normal mt-0.5">Ref: {p.internNumber}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-800">{p.client}</span>
                      <span className="block text-xs text-slate-400 mt-0.5">Porto: {p.port} | {p.type}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getStatusBadge(p.status, p.canal)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getRiskBadge(p.risk)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {p.status === 'Submetido' ? (
                        <span className="text-slate-400 text-xs">-</span>
                      ) : p.daysRemaining <= 5 ? (
                        <span className="text-rose-600 font-bold text-xs bg-rose-50 px-2 py-0.5 rounded border border-rose-150 block w-fit mx-auto">
                          Alerta: {p.daysRemaining} d
                        </span>
                      ) : (
                        <span className="text-slate-600 text-xs font-semibold">{p.daysRemaining} dias</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {new Date(p.updatedAt).toLocaleTimeString('pt-PT', {hour: '2-digit', minute:'2-digit'})} • {new Date(p.updatedAt).toLocaleDateString('pt-PT')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50/80 hover:bg-emerald-100/90 px-3 py-1.5 rounded-lg transition-colors">
                        Ver Dossiê
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Legend Panel strictly exactly from page 1 criteria */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-600">
          <span className="font-semibold text-slate-700">Legenda de Status:</span>
          <span className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            OK
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            Em Correção (Avisos menores ou licença em verificação)
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            Erro Crítico (Discrepâncias impeditivas / Submissão bloqueada)
          </span>
          <span className="flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
            Submetido (Transparente e validado junto à Alfândega)
          </span>
        </div>
      </div>

      {/* Advanced Compliance Savings Section (No Tech-Larping / Real Operational reports as in page 6 & 7) */}
      {showAdvancedStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
            <h4 className="font-semibold text-slate-800 font-display flex items-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4 text-emerald-600" /> Economia em Multas Evitadas
            </h4>
            <p className="text-2xl font-bold text-slate-900 mt-2 font-display">
              {stats.costsAvoided.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Minimização baseada em taxas de penalidades médias e estadia indevida evitada nos portos de entrada.
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
            <h4 className="font-semibold text-slate-800 font-display flex items-center gap-2 text-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Erros Saneados na Pasta
            </h4>
            <p className="text-2xl font-bold text-slate-900 mt-2 font-display">
              {stats.correctionsCount} Divergências
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Descreve a quantidade total de discrepâncias corrigidas manualmente pelos despachantes antes da submissão alfandegária.
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
            <h4 className="font-semibold text-slate-800 font-display flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-emerald-600" /> Tempo Médio de Resolução
            </h4>
            <p className="text-2xl font-bold text-slate-900 mt-2 font-display">
              18 minutos
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Intervalo decorrido entre o alerta de discrepância gerado pelo motor LJ-Aduaneiro e o envio definitivo.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
