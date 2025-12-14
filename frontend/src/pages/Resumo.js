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

  const obterLinkPagamento = () => {
    const acrescimoMinutos = parseInt(sessionStorage.getItem('acrescimoMinutos') || '0');
    const semanasRecorrentes = parseInt(sessionStorage.getItem('semanasRecorrentes') || '0');
    const tipoPagamento = dadosResumo.formaPagamento === 'antecipado' ? 'pre' : 'pos';
    
    if (semanasRecorrentes === 0) {
      return LINKS_PAGAMENTO[tipoPagamento][0][acrescimoMinutos] || LINKS_PAGAMENTO[tipoPagamento][0][0];
    } else {
      if (tipoPagamento === 'pre' && LINKS_PAGAMENTO.pre[semanasRecorrentes]) {
        return LINKS_PAGAMENTO.pre[semanasRecorrentes];
      }
    }
    
    return null;
  };

  const formatarDataPorExtenso = (data) => {
    const meses = ['janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho', 
                   'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
    const dia = data.getDate();
    const mes = meses[data.getMonth()];
    const ano = data.getFullYear();
    return `${dia} de ${mes} de ${ano}`;
  };

  const getDiaSemanaPorExtenso = (dataStr) => {
    const data = new Date(dataStr);
    const dias = ['Domingo', 'Segunda-feira', 'Terca-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sabado'];
    return dias[data.getDay()];
  };

  const calcularHorarioFinal = () => {
    const [hora, minuto] = dadosResumo.horario.split(':').map(Number);
    const duracaoTotal = 60 + dadosResumo.acrescimoMinutos;
    const novoMinuto = minuto + duracaoTotal;
    const novaHora = hora + Math.floor(novoMinuto / 60);
    const minutoFinal = novoMinuto % 60;
    return `${String(novaHora).padStart(2, '0')}:${String(minutoFinal).padStart(2, '0')}`;
  };

  const salvarReservasNoBanco = async () => {
    try {
      const horarioFinal = calcularHorarioFinal();
      const reservas = dadosResumo.datasRecorrentes.map(dataStr => ({
        data: dataStr,
        sala: dadosResumo.sala,
        horario: dadosResumo.horario,
        duracao_minutos: 60 + dadosResumo.acrescimoMinutos,
        id_profissional: dadosResumo.idProfissional,
        nome_profissional: `${dadosResumo.profissionalStatus} ${dadosResumo.profissionalNome}`,
        horario_inicio: dadosResumo.horario,
        horario_fim: horarioFinal,
        acrescimo_minutos: dadosResumo.acrescimoMinutos,
        valor_unitario: dadosResumo.valorUnitario,
        forma_pagamento: dadosResumo.formaPagamento,
        status: 'Pendente'
      }));

      const response = await fetch(`${API}/reservas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reservas })
      });

      if (response.ok) {
        try {
          const chaveHistorico = `historico_agendamentos_${dadosResumo.idProfissional}`;
          const historicoAtual = JSON.parse(localStorage.getItem(chaveHistorico) || '[]');
          const linkPagamento = obterLinkPagamento();
          const agora = new Date();
          const dataCriacao = `${String(agora.getDate()).padStart(2, '0')}/${String(agora.getMonth() + 1).padStart(2, '0')}/${agora.getFullYear()} ${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}`;
          
          console.log('💾 Salvando no localStorage:', chaveHistorico);
          
          dadosResumo.datasRecorrentes.forEach(dataStr => {
            const novoItem = {
              id: `${dadosResumo.idProfissional}-${dataStr}-${dadosResumo.horario}`,
              data: dataStr,
              horario: dadosResumo.horario,
              sala: dadosResumo.sala,
              status: 'confirmado',
              recorrencia: dadosResumo.semanasRecorrentes || 0,
              status_pagamento: 'aguardando',
              link_pagamento: linkPagamento,
              data_criacao: dataCriacao,
              valor_total: dadosResumo.valorTotal
            };
            
            console.log('📝 Item adicionado:', novoItem);
            historicoAtual.push(novoItem);
          });
          
          localStorage.setItem(chaveHistorico, JSON.stringify(historicoAtual));
          console.log('✅ Histórico salvo com sucesso! Total de itens:', historicoAtual.length);
          
          return { success: true };
        } catch (localStorageError) {
          console.error('❌ Erro ao salvar no localStorage:', localStorageError);
          return { success: true, warning: 'Reserva criada, mas não foi possível salvar no histórico local' };
        }
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.detail || 'Erro ao salvar reservas';
        console.error('Erro ao salvar reservas:', errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      console.error('Erro ao salvar reservas:', error);
      return { success: false, error: error.message || 'Erro ao conectar com o servidor' };
    }
  };

  const handleOkReservar = () => {
    setShowOrientacaoPopup(true);
  };

  const handleConfirmarReserva = async () => {
    try {
      const resultado = await salvarReservasNoBanco();
      
      if (resultado.success) {
        setShowOrientacaoPopup(false);
        
        alert('✅ Reserva confirmada com sucesso!\n\nVocê pode consultar seus agendamentos em "Meu Histórico" na tela inicial.');
        
        sessionStorage.clear();
        navigate('/');
      } else {
        setShowOrientacaoPopup(false);
        
        alert(`❌ Erro ao confirmar reserva:\n\n${resultado.error}\n\nPor favor, verifique os dados e tente novamente.`);
      }
    } catch (error) {
      console.error('Erro ao confirmar reserva:', error);
      setShowOrientacaoPopup(false);
      alert('❌ Erro ao confirmar reserva. Por favor, tente novamente.');
    }
  };

  const handleReiniciar = () => {
    setShowReiniciarPopup(true);
  };

  const handleConfirmarReiniciar = () => {
    sessionStorage.clear();
    navigate('/');
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

        {/* Texto de Aviso */}
        <p className="text-center text-sm text-slate-500 mb-6">
          A reserva será salva e você poderá consultá-la em "Meu Histórico"
        </p>

        {/* Botões de Ação */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Button
            onClick={handleOkReservar}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg font-semibold rounded-xl shadow-lg transition-all"
          >
            Ok, reservar
          </Button>
          <Button
            onClick={handleReiniciar}
            className="bg-slate-400 hover:bg-slate-500 text-white px-8 py-6 text-lg font-semibold rounded-xl shadow-lg transition-all"
          >
            Reiniciar
          </Button>
        </div>

        {/* Banner Inferior */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl shadow-xl p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-full md:w-1/2">
              <img 
                src={IMAGE_MULHER_CELULAR}
                alt="Mulher no celular"
                className="w-full h-auto rounded-2xl shadow-md"
              />
            </div>
            <div className="w-full md:w-1/2 text-center md:text-left">
              <h3 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-2">
                Agende tudo pelo aplicativo
              </h3>
              <p className="text-xl sm:text-2xl text-slate-600 font-light">
                com liberdade
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Popup de Orientação */}
      <AlertDialog open={showOrientacaoPopup} onOpenChange={setShowOrientacaoPopup}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-bold text-slate-800">
              Confirmação de Agendamento
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base text-slate-600 space-y-4 pt-4">
              <p>
                Agradecemos por agendar com a gente! Assim que clicar em "Confirmar", sua reserva será salva e você poderá conferir no botão "Meu Histórico", ao efetuar o login com sua ID Profissional. Lá estarão todos os seus agendamentos realizados.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-3">
            <Button
              onClick={() => setShowOrientacaoPopup(false)}
              className="bg-slate-300 hover:bg-slate-400 text-slate-700"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmarReserva}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Confirmar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Popup de Reiniciar */}
      <AlertDialog open={showReiniciarPopup} onOpenChange={setShowReiniciarPopup}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-slate-800">
              Tem certeza que deseja reiniciar?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base text-slate-600 pt-2">
              Todos os dados serão perdidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-3">
            <Button
              onClick={() => setShowReiniciarPopup(false)}
              className="bg-slate-300 hover:bg-slate-400 text-slate-700"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmarReiniciar}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Sim, reiniciar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}