import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const IMAGE_MULHER_CELULAR = "https://customer-assets.emergentagent.com/job_id-validator-5/artifacts/w74pg0wp_mulher%20no%20celular.png";

const LINKS_PAGAMENTO = {
  pre: {
    0: {
      0: "https://mpago.la/2UNmgLb",
      15: "https://mpago.la/2AdQC8h",
      30: "https://mpago.la/21b6Gcw"
    },
    1: "https://mpago.la/1EoCMLW",
    2: "https://mpago.la/1wQGvg4",
    3: "https://mpago.la/1JGcviH",
    4: "https://mpago.la/24v7ebk",
    5: "https://mpago.la/1LZdUQz",
    6: "https://mpago.la/2RCyGdh",
    7: "https://mpago.la/1KP9wSN",
    8: "https://mpago.la/1LSc7DP",
    9: "https://mpago.la/319rxt5",
    10: "https://mpago.la/2HBrxKk"
  },
  pos: {
    0: {
      0: "https://mpago.la/26dfm2M",
      15: "https://mpago.la/2v5KN1s",
      30: "https://mpago.la/1AtThz8"
    }
  }
};

export default function Resumo() {
  const navigate = useNavigate();
  const [dadosResumo, setDadosResumo] = useState(null);
  const [showOrientacaoPopup, setShowOrientacaoPopup] = useState(false);
  const [showReiniciarPopup, setShowReiniciarPopup] = useState(false);

  useEffect(() => {
    const profissionalNome = sessionStorage.getItem('profissionalNome');
    const profissionalStatus = sessionStorage.getItem('profissionalStatus');
    const idProfissional = sessionStorage.getItem('idProfissional');
    const selectedDate = sessionStorage.getItem('selectedDate');
    const horario = sessionStorage.getItem('horarioSelecionado');
    const sala = sessionStorage.getItem('salaSelecionada');
    
    if (!profissionalNome || !selectedDate || !horario || !sala) {
      navigate('/');
      return;
    }

    const acrescimoMinutos = parseInt(sessionStorage.getItem('acrescimoMinutos') || '0');
    const semanasRecorrentes = parseInt(sessionStorage.getItem('semanasRecorrentes') || '0');
    const valorTotalFinal = parseFloat(sessionStorage.getItem('valorTotalFinal') || '0');
    const valorFinalComPagamento = parseFloat(sessionStorage.getItem('valorFinalComPagamento') || '0');
    const totalAgendamentos = parseInt(sessionStorage.getItem('totalAgendamentos') || '1');
    const datasRecorrentes = JSON.parse(sessionStorage.getItem('datasRecorrentes') || '[]');
    const formaPagamento = sessionStorage.getItem('formaPagamento') || 'antecipado';

    let valorAcrescimo = 0;
    if (acrescimoMinutos === 15) valorAcrescimo = 8;
    else if (acrescimoMinutos === 30) valorAcrescimo = 15;

    const valorUnitario = 30 + valorAcrescimo;
    const adicionalPagamento = valorFinalComPagamento - valorTotalFinal;

    setDadosResumo({
      profissionalNome,
      profissionalStatus,
      idProfissional,
      data: new Date(selectedDate),
      horario,
      sala,
      acrescimoMinutos,
      valorAcrescimo,
      semanasRecorrentes,
      valorUnitario,
      totalAgendamentos,
      datasRecorrentes,
      formaPagamento,
      adicionalPagamento,
      valorTotal: valorFinalComPagamento
    });
  }, [navigate]);

  const formatarData = (data) => {
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                   'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const dia = data.getDate();
    const mes = meses[data.getMonth()];
    const ano = data.getFullYear();
    return `${dia} de ${mes} de ${ano}`;
  };

  const formatarDataCurta = (dataStr) => {
    const data = new Date(dataStr);
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    return `${dia}/${mes}/${ano}`;
  };

  const getDiaSemana = (dataStr) => {
    const data = new Date(dataStr);
    const dias = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    return dias[data.getDay()];
  };

  const getSalaDescricao = (sala) => {
    if (sala === '03') return 'Sala 03 (com maca)';
    return `Sala ${sala}`;
  };

  if (!dadosResumo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <p className="text-slate-600">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex justify-between mb-8">
          <button 
            onClick={() => navigate('/pagamento')}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
            data-testid="button-voltar"
          >
            <svg className="w-8 h-8 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button 
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
            data-testid="menu-hamburger"
          >
            <Menu className="w-8 h-8 text-slate-700" />
          </button>
        </div>

        {/* Título */}
        <div className="text-center mb-12">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-slate-900 mb-4 tracking-tight">
            AGENDA INTERATIVA
          </h1>
          <p className="text-xl sm:text-2xl text-slate-600 font-light">
            Fácil e intuitiva
          </p>
        </div>

        {/* Título da seção */}
        <h2 className="text-4xl font-bold text-center text-slate-800 mb-10">
          Resumo do agendamento
        </h2>

        {/* Card de resumo */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 sm:p-12 mb-8">
          {/* Informações Pessoais */}
          <div className="mb-8 pb-8 border-b-2 border-slate-200">
            <h3 className="text-2xl font-bold text-slate-800 mb-4">Informações Pessoais</h3>
            <div className="space-y-3">
              <div className="flex flex-wrap">
                <span className="font-bold text-slate-700 mr-2">ID Profissional:</span>
                <span className="text-slate-600">{dadosResumo.idProfissional}</span>
              </div>
              <div className="flex flex-wrap">
                <span className="font-bold text-slate-700 mr-2">Nome:</span>
                <span className="text-slate-600">{dadosResumo.profissionalStatus} {dadosResumo.profissionalNome}</span>
              </div>
            </div>
          </div>

          {/* Informações do Agendamento */}
          <div className="mb-8 pb-8 border-b-2 border-slate-200">
            <h3 className="text-2xl font-bold text-slate-800 mb-4">Informações do Agendamento</h3>
            <div className="space-y-3">
              <div className="flex flex-wrap">
                <span className="font-bold text-slate-700 mr-2">Data:</span>
                <span className="text-slate-600">{formatarData(dadosResumo.data)}</span>
              </div>
              <div className="flex flex-wrap">
                <span className="font-bold text-slate-700 mr-2">Horário:</span>
                <span className="text-slate-600">{dadosResumo.horario}</span>
              </div>
              <div className="flex flex-wrap">
                <span className="font-bold text-slate-700 mr-2">Consultório:</span>
                <span className="text-slate-600">{getSalaDescricao(dadosResumo.sala)}</span>
              </div>
            </div>
          </div>

          {/* Tempo e Valores */}
          <div className="mb-8 pb-8 border-b-2 border-slate-200">
            <h3 className="text-2xl font-bold text-slate-800 mb-4">Tempo e Valores</h3>
            <div className="space-y-3">
              <div className="flex flex-wrap">
                <span className="font-bold text-slate-700 mr-2">Acréscimo de tempo:</span>
                <span className="text-slate-600">
                  {dadosResumo.acrescimoMinutos > 0 
                    ? `+${dadosResumo.acrescimoMinutos} minutos` 
                    : 'Sem acréscimo'}
                </span>
              </div>
              <div className="flex flex-wrap">
                <span className="font-bold text-slate-700 mr-2">Valor acréscimo:</span>
                <span className="text-slate-600">R$ {dadosResumo.valorAcrescimo.toFixed(2).replace('.', ',')}</span>
              </div>
            </div>
          </div>

          {/* Recorrência */}
          <div className="mb-8 pb-8 border-b-2 border-slate-200">
            <h3 className="text-2xl font-bold text-slate-800 mb-4">Recorrência</h3>
            <div className="space-y-3">
              <div className="flex flex-wrap">
                <span className="font-bold text-slate-700 mr-2">Atendimento recorrente:</span>
                <span className="text-slate-600">
                  {dadosResumo.semanasRecorrentes > 0 
                    ? `${dadosResumo.semanasRecorrentes} ${dadosResumo.semanasRecorrentes === 1 ? 'semana' : 'semanas'}` 
                    : 'Sem recorrência'}
                </span>
              </div>
              <div className="flex flex-wrap">
                <span className="font-bold text-slate-700 mr-2">Valor unitário:</span>
                <span className="text-slate-600">R$ {dadosResumo.valorUnitario.toFixed(2).replace('.', ',')}</span>
              </div>
              <div className="flex flex-wrap">
                <span className="font-bold text-slate-700 mr-2">Quantidade de atendimentos:</span>
                <span className="text-slate-600">
                  {dadosResumo.totalAgendamentos} {dadosResumo.totalAgendamentos === 1 ? 'atendimento' : 'atendimentos'}
                </span>
              </div>
            </div>

            {/* Datas Recorrentes */}
            {dadosResumo.datasRecorrentes.length > 1 && (
              <div className="mt-6">
                <h4 className="font-bold text-slate-700 mb-3">Datas dos atendimentos:</h4>
                <div className="space-y-2">
                  {dadosResumo.datasRecorrentes.map((data, index) => (
                    <div 
                      key={index} 
                      className="bg-blue-50 rounded-lg p-3 border border-blue-200"
                    >
                      <span className="text-slate-700">
                        {formatarDataCurta(data)} - {getDiaSemana(data)} - {dadosResumo.horario} - {getSalaDescricao(dadosResumo.sala)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Pagamento */}
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-slate-800 mb-4">Pagamento</h3>
            <div className="space-y-3">
              <div className="flex flex-wrap">
                <span className="font-bold text-slate-700 mr-2">Forma de pagamento:</span>
                <span className="text-slate-600">
                  {dadosResumo.formaPagamento === 'antecipado' ? 'Antecipado (pré)' : 'No dia (pós)'}
                </span>
              </div>
              <div className="flex flex-wrap">
                <span className="font-bold text-slate-700 mr-2">Adicional pagamento:</span>
                <span className="text-slate-600">R$ {dadosResumo.adicionalPagamento.toFixed(2).replace('.', ',')}</span>
              </div>
              <div className="flex flex-wrap items-center pt-4">
                <span className="font-bold text-slate-700 text-xl mr-2">Valor total:</span>
                <span className="text-green-600 font-bold text-3xl">R$ {dadosResumo.valorTotal.toFixed(2).replace('.', ',')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}