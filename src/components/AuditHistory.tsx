/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  FileLock, 
  Search, 
  Calendar, 
  User, 
  ChevronRight, 
  Globe, 
  Database,
  ArrowRight
} from 'lucide-react';
import { AuditLog } from '../types';

interface AuditHistoryProps {
  logs: AuditLog[];
}

export default function AuditHistory({ logs }: AuditHistoryProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = logs.filter(log => 
    log.processId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.field.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Search Header Banner */}
      <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="font-semibold text-slate-900 font-display flex items-center gap-2">
            <FileLock className="w-5 h-5 text-emerald-600" /> Histórico Legal &amp; Compliance Audit Trail
          </h3>
          <p className="text-xs text-slate-500">
            Registo persistente e imutável de retificações aduaneiras e envios DUADO de acordo com regulamentos nacionais.
          </p>
        </div>

        {/* Searching bar */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Procurar logs (Despachante, Campo)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 w-full text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50/50"
          />
        </div>
      </div>

      {/* Audit trails log grids */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h4 className="font-semibold text-slate-800 text-sm font-display uppercase tracking-wider">Registo de Alterações e Submissões</h4>
          <span className="text-xs text-slate-400 font-mono font-semibold">{filteredLogs.length} Registros</span>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            Nenhum registo de compliance coincide com o critério de busca.
          </div>
        ) : (
          <div className="divide-y divide-slate-150">
            {filteredLogs.map((log) => (
              <div key={log.id} className="p-5 hover:bg-slate-50/50 transition-colors space-y-3">
                
                {/* Meta details */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs text-slate-400">
                  <span className="font-mono text-emerald-800 font-bold bg-emerald-50 border border-emerald-100/50 px-2.5 py-0.5 rounded">
                    Processo: {log.processNumber}
                  </span>
                  
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {log.user} ({log.userRole})
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(log.timestamp).toLocaleTimeString('pt-PT')} • {new Date(log.timestamp).toLocaleDateString('pt-PT')}
                    </span>
                  </div>
                </div>

                {/* Audit Change Description */}
                <div>
                  <p className="text-sm font-semibold text-slate-800 font-display">
                    Campo Retificado: <span className="text-slate-600 font-mono">{log.field}</span>
                  </p>
                  <p className="text-xs text-slate-650 mt-1 leading-normal">{log.action}</p>
                </div>

                {/* Side by side comparison if values are provided */}
                {log.oldValue !== 'Nenhum' && log.oldValue !== 'Análise Pendente' && (
                  <div className="inline-flex items-center gap-3 text-xs bg-slate-50 border border-slate-150 px-3 py-1.5 rounded-lg max-w-full font-mono overflow-x-auto custom-scrollbar">
                    <span className="text-slate-400">De:</span>
                    <span className="text-rose-700 bg-rose-50 px-1 py-0.5 rounded">{log.oldValue}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                    <span className="text-slate-400">Para:</span>
                    <span className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded font-bold">{log.newValue}</span>
                  </div>
                )}

              </div>
            ))}
          </div>
        )}
      </div>

      {/* Audit ledger legal note */}
      <div className="indigo-p-4 bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs text-slate-300 leading-relaxed font-display">
        <p className="font-semibold text-emerald-400">✓ Regulamentação das Alândegas de Moçambique (Decreto 56/2002)</p>
        <p className="text-[11px] mt-1 text-slate-400">
          De acordo com as leis alfandegárias vigentes na República de Moçambique, todos os dossiers documentais, faturas mercantis, conhecimentos de embarque, relatórios de anomalias fitossanitárias e traçabilidade eletrônica de correções manuais de despachantes devem ser mantidos e guardados em arquivo fiscal local por um período de 5 (cinco) anos para auditorias tributárias consecutivas.
        </p>
      </div>

    </div>
  );
}
