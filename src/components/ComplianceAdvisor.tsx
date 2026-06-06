/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  HelpCircle, 
  CheckSquare, 
  ArrowRight,
  Calculator,
  Percent,
  FileText
} from 'lucide-react';
import { HSAdvisorProduct } from '../types';

interface ComplianceAdvisorProps {
  onSearchHSCode: (query: string) => Promise<HSAdvisorProduct>;
}

export default function ComplianceAdvisor({ onSearchHSCode }: ComplianceAdvisorProps) {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'reference'>('search');
  
  // Custom states for active consulted product
  const [consulted, setConsulted] = useState<HSAdvisorProduct | null>(null);

  // Simulation values for tax calculation
  const [customsVal, setCustomsVal] = useState<number>(10000); // CIF USD
  const [calculatedTax, setCalculatedTax] = useState<{
    fobCif: number;
    duty: number;
    vat: number;
    ice?: number;
    total: number;
  } | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setSearching(true);
    setCalculatedTax(null);
    try {
      const match = await onSearchHSCode(query);
      setConsulted(match);
    } catch (err) {
      console.error(err);
    }
    setSearching(false);
  };

  const handleQuickCheck = async (productTerm: string) => {
    setQuery(productTerm);
    setSearching(true);
    setCalculatedTax(null);
    try {
      const match = await onSearchHSCode(productTerm);
      setConsulted(match);
    } catch (err) {
      console.error(err);
    }
    setSearching(false);
  };

  const calculateTaxes = (product: HSAdvisorProduct) => {
    const dutyAmount = customsVal * product.dutyRate;
    const iceAmount = customsVal * (product.otherTaxRate || 0);
    // VAT is calculated on (CIF value + Duty value + ICE value) as per Mozambique Customs rules
    const vatBase = customsVal + dutyAmount + iceAmount;
    const vatAmount = vatBase * product.vatRate;

    setCalculatedTax({
      fobCif: customsVal,
      duty: dutyAmount,
      vat: vatAmount,
      ice: product.otherTaxRate ? iceAmount : undefined,
      total: dutyAmount + vatAmount + iceAmount
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Search landing header */}
      <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-4">
        <div className="space-y-1">
          <h3 className="font-semibold text-slate-900 font-display flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-600" /> Consultor de Pauta Aduaneira e Classificação SADC
          </h3>
          <p className="text-xs text-slate-500">
            Encontre códigos HS, taxas aduaneiras e os requisitos prévios ministeriais obrigatórios de importação/exportação em Moçambique.
          </p>
        </div>

        {/* Dynamic selector search inputs */}
        <form onSubmit={handleSearch} className="flex gap-2.5 max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Digite o produto (ex. Arroz, Medicamentos, Automóvel, ou código)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 pr-4 py-2.5 w-full text-xs font-medium border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50/20"
            />
          </div>
          <button
            type="submit"
            disabled={searching}
            className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-80 rounded-lg cursor-pointer transition-colors"
          >
            {searching ? 'Pesquisando...' : 'Pesquisar SADC'}
          </button>
        </form>

        {/* Quick links to SADC search examples */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-400 font-medium mr-1">Consultas comuns:</span>
          {['Arroz', 'Medicamentos', 'Automóvel', 'Camarões'].map((tag) => (
            <button
              key={tag}
              onClick={() => handleQuickCheck(tag)}
              className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors cursor-pointer"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Main lookup results */}
      {consulted && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* SADC specs - 7 cols */}
          <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-200">
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded">
                Código HS Encontrado
              </span>
              <h4 className="text-xl font-bold text-slate-900 font-mono mt-2 flex items-center gap-2">
                {consulted.code.replace(/(\d{4})(\d{2})(\d{2})/, '$1.$2.$3')}
              </h4>
              <p className="text-sm font-semibold text-slate-800 mt-1.5">{consulted.product}</p>
              <p className="text-xs text-slate-500 mt-1">{consulted.description}</p>
            </div>

            {/* Tax parameters */}
            <div className="p-5 border-b border-slate-200 space-y-4">
              <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Taxas Aduaneiras de Entrada</h5>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                {/* Duty */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-150 flex items-center gap-3">
                  <div className="p-2 rounded bg-emerald-100 text-emerald-700">
                    <Percent className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Direitos Imposto</span>
                    <span className="text-sm font-bold text-slate-800">{(consulted.dutyRate * 100).toFixed(1)}%</span>
                  </div>
                </div>

                {/* VAT */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-150 flex items-center gap-3">
                  <div className="p-2 rounded bg-indigo-100 text-indigo-700">
                    <Percent className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">IVA de Moçambique</span>
                    <span className="text-sm font-bold text-slate-800">{(consulted.vatRate * 100).toFixed(1)}%</span>
                  </div>
                </div>

                {/* ICE */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-150 flex items-center gap-3">
                  <div className="p-2 rounded bg-amber-100 text-amber-700">
                    <Percent className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">ICE (Específico)</span>
                    <span className="text-sm font-bold text-slate-800">
                      {consulted.otherTaxRate ? `${(consulted.otherTaxRate * 100).toFixed(1)}%` : 'Isento'}
                    </span>
                  </div>
                </div>

              </div>
            </div>

            {/* Ministerial requirements checklists */}
            <div className="p-5 space-y-4">
              <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Requisitos Ministeriais Prévios Obrigatorios</h5>
              
              <div className="space-y-2.5">
                {consulted.ministerialChecklist.map((req, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700">
                    <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{req}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Simulated import tax calculator - 5 cols */}
          <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-200">
              <h4 className="font-semibold text-slate-800 text-sm font-display uppercase tracking-wider flex items-center gap-2">
                <Calculator className="w-4 h-4 text-emerald-600" /> Simulador de Tributos Aduaneiros
              </h4>
            </div>

            <div className="p-5 space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 block uppercase tracking-wider">Valor Comercial de Carga CIF (USD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 text-xs font-semibold">USD</span>
                  <input
                    type="number"
                    value={customsVal}
                    onChange={(e) => setCustomsVal(Number(e.target.value))}
                    className="pl-12 pr-4 py-2 w-full text-slate-800 font-mono text-xs border border-slate-300 rounded-lg focus:outline-none"
                    placeholder="Ex: 10000"
                  />
                </div>
              </div>

              <button
                onClick={() => calculateTaxes(consulted)}
                className="w-full py-2.5 text-xs font-bold text-center text-white bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                CÁLCULAR ESTIMATIVA TRIBUTÁRIA
              </button>

              {calculatedTax && (
                <div className="space-y-3 pt-3 border-t border-slate-150 text-xs">
                  {/* Item 1 */}
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Valor CIF de Origem:</span>
                    <span className="font-mono font-semibold">
                      {calculatedTax.fobCif.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                    </span>
                  </div>

                  {/* Item 2 */}
                  <div className="flex items-center justify-between text-slate-700">
                    <span>Direito Aduaneiro ({(consulted.dutyRate * 100).toFixed(0)}%):</span>
                    <span className="font-mono font-bold text-emerald-700">
                      {calculatedTax.duty.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                    </span>
                  </div>

                  {/* ICE */}
                  {calculatedTax.ice !== undefined && (
                    <div className="flex items-center justify-between text-slate-700">
                      <span>ICE Consumos Especiais ({(consulted.otherTaxRate! * 100).toFixed(0)}%):</span>
                      <span className="font-mono font-bold text-amber-700">
                        {calculatedTax.ice.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                      </span>
                    </div>
                  )}

                  {/* Item 3 */}
                  <div className="flex items-center justify-between text-slate-700">
                    <span>IVA Regional de Moçambique (16%):</span>
                    <span className="font-mono font-bold text-indigo-700">
                      {calculatedTax.vat.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                    </span>
                  </div>

                  {/* Total */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-200 text-sm font-bold text-slate-950">
                    <span>Subtotal de Impostos Estimado:</span>
                    <span className="font-mono text-emerald-800">
                      {calculatedTax.total.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-400 leading-normal pt-2 italic">
                    *Aviso: Este cálculo simula a tributação aduaneira padrão. Outras taxas de manuseio portuário (Moçambique Port Maputo/Beira) e taxas de agenciamento de despachante aplicam-se à parte.
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* SADC Knowledge guidelines */}
      <div className="p-5 bg-white border border-slate-200 rounded-xl">
        <h4 className="text-sm font-bold text-slate-800 font-display">Informações Adicionais (Pauta Governamental Moçambique)</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 text-xs leading-normal text-slate-600">
          <div className="space-y-2">
            <h5 className="font-bold text-slate-700">Importações Isentas / Beneficiadas</h5>
            <p>Moçambique confere isenções adicionais ou direitos nulos para doações humanitárias medicamentosas autorizadas pelo MISAU e bens de capital inseridos no Regulamento da Lei de Investimentos.</p>
          </div>
          <div className="space-y-2">
            <h5 className="font-bold text-slate-700">Controlo de Câmbios e Origem SADC</h5>
            <p>Os exportadores regionais angariando o Certificado de Origem Comercial SADC gozam de tarifas de desembaraço reduzidas ou eliminadas no quadro de integração aduaneira regional da Linha de Maputo.</p>
          </div>
        </div>
      </div>

    </div>
  );
}
