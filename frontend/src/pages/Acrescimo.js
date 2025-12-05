import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const IMAGE_MULHER_CHA = "https://customer-assets.emergentagent.com/job_id-validator-5/artifacts/z5lvtsj6_mulher%20trabalha%20com%20ch%C3%A1.png";

const ACRESCIMOS = [
  { id: 'sem', label: 'Sem acréscimo', minutos: 0, valor: 0 },
  { id: '15min', label: '+15 minutos = R$ 8,00', minutos: 15, valor: 8.00 },
  { id: '30min', label: '+30 minutos = R$ 15,00', minutos: 30, valor: 15.00 }
];

const horarioParaMinutos = (horario) => {
  const [h, m] = horario.split(':').map(Number);
  return h * 60 + m;
};

export default function Acrescimo() {
  const navigate = useNavigate();
  const [acrescimoSelecionado, setAcrescimoSelecionado] = useState('sem');
  const [valorAcumulado, setValorAcumulado] = useState(0);
  const [dataSelecionada, setDataSelecionada] = useState(null);
  const [horarioSelecionado, setHorarioSelecionado] = useState(null);
  const [reservas, setReservas] = useState([]);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const carregarReservas = async (data) => {
    try {
      const dataFormatada = data.toISOString().split('T')[0];
      const response = await axios.get(`${API}/reservas-por-data`, {
        params: { data: dataFormatada }
      });
      setReservas(response.data);
    } catch (e) {
      console.error('Erro ao carregar reservas:', e);
    }
  };

  useEffect(() => {
    const profissionalNome = sessionStorage.getItem('profissionalNome');
    const selectedDateStr = sessionStorage.getItem('selectedDate');
    const horario = sessionStorage.getItem('horarioSelecionado');
    
    if (!profissionalNome || !selectedDateStr || !horario) {
      navigate('/');
      return;
    }

    const date = new Date(selectedDateStr);
    setDataSelecionada(date);
    setHorarioSelecionado(horario);
    
    carregarReservas(date);
  }, [navigate]);

  const verificarConflito = useCallback((minutosAcrescimo) => {
    if (!horarioSelecionado || reservas.length === 0) {
      return false;
    }

    const horarioInicioMinutos = horarioParaMinutos(horarioSelecionado);
    const duracaoAtendimento = 60 + minutosAcrescimo;
    const fimAtendimento = horarioInicioMinutos + duracaoAtendimento;
    const fimComBuffer = fimAtendimento + 15;

    for (const reserva of reservas) {
      if (reserva.horario === horarioSelecionado) {
        continue;
      }

      const reservaInicio = horarioParaMinutos(reserva.horario);
      const reservaDuracao = reserva.duracao_minutos || 60;
      const reservaFim = reservaInicio + reservaDuracao;

      if (fimComBuffer > reservaInicio && horarioInicioMinutos < reservaFim) {
        return true;
      }
    }

    if (fimComBuffer > 20 * 60 + 15) {
      return true;
    }

    return false;
  }, [horarioSelecionado, reservas]);

  const handleAcrescimoChange = (acrescimoId) => {
    const acrescimo = ACRESCIMOS.find(a => a.id === acrescimoId);
    
    if (acrescimo.minutos > 0) {
      const temConflito = verificarConflito(acrescimo.minutos);
      
      if (temConflito) {
        setErrorMessage(
          'Neste horário não é possível adicionar esse acréscimo de tempo mantendo o intervalo obrigatório. Escolha outro acréscimo ou ajuste horário/sala.'
        );
        setShowErrorPopup(true);
        return;
      }
    }

    setAcrescimoSelecionado(acrescimoId);
    
    const valorBaseStr = sessionStorage.getItem('valorBase') || '0';
    const valorBase = parseFloat(valorBaseStr);
    const novoValorAcumulado = valorBase + acrescimo.valor;
    setValorAcumulado(novoValorAcumulado);
  };

  const handleProximo = () => {
    const acrescimo = ACRESCIMOS.find(a => a.id === acrescimoSelecionado);
    
    if (acrescimo.minutos > 0) {
      const temConflito = verificarConflito(acrescimo.minutos);
      
      if (temConflito) {
        setErrorMessage(
          'Não é possível prosseguir com este acréscimo. Por favor, selecione outra opção.'
        );
        setShowErrorPopup(true);
        return;
      }
    }

    sessionStorage.setItem('acrescimoMinutos', acrescimo.minutos.toString());
    sessionStorage.setItem('valorAcrescimo', acrescimo.valor.toString());
    sessionStorage.setItem('valorAcumulado', valorAcumulado.toString());
    
    console.log('Acréscimo confirmado:', acrescimo);
  };

  if (!dataSelecionada || !horarioSelecionado) {
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
        <div className="flex justify-end mb-8">
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
        <h2 className="text-4xl font-bold text-center text-slate-800 mb-8">
          Acréscimo de tempo
        </h2>

        {/* Card principal */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 sm:p-12 mb-8">
          {/* Opções de acréscimo */}
          <div className="space-y-4 mb-8">
            {ACRESCIMOS.map((acrescimo) => (
              <button
                key={acrescimo.id}
                onClick={() => handleAcrescimoChange(acrescimo.id)}
                className={`
                  w-full p-5 rounded-2xl text-xl font-semibold transition-all border-3
                  ${acrescimoSelecionado === acrescimo.id
                    ? 'bg-blue-500 text-white border-blue-600 shadow-lg scale-105'
                    : 'bg-white text-slate-800 border-slate-300 hover:border-blue-400 hover:bg-blue-50'
                  }
                `}
                data-testid={`acrescimo-${acrescimo.id}`}
              >
                {acrescimo.label}
              </button>
            ))}
          </div>

          {/* Valor acumulado */}
          <div className="bg-slate-100 rounded-2xl p-6 mb-8">
            <p className="text-center text-lg text-slate-600 mb-2">
              Valor acumulado
            </p>
            <p 
              className="text-center text-4xl font-bold text-slate-900"
              data-testid="valor-acumulado"
            >
              R$ {valorAcumulado.toFixed(2).replace('.', ',')}
            </p>
          </div>

          {/* Botão Próximo */}
          <Button
            onClick={handleProximo}
            className="w-full py-6 text-xl font-bold"
            style={{ backgroundColor: '#6169F2' }}
            data-testid="button-proximo"
          >
            Próximo
          </Button>
        </div>

        {/* Banner inferior */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center">
            <div className="w-full sm:w-1/2">
              <img 
                src={IMAGE_MULHER_CHA}
                alt="Coworking Terapia"
                className="w-full h-full object-cover"
                style={{ maxHeight: '300px' }}
              />
            </div>
            <div className="flex-1 p-8 text-center sm:text-left">
              <p className="text-2xl sm:text-3xl font-bold text-slate-800 leading-relaxed">
                Conforto e ambiente clean!<br />
                No Coworking Terapia<br />
                você conta com wi-fi,<br />
                chá, café e água!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Popup de erro */}
      <AlertDialog open={showErrorPopup} onOpenChange={setShowErrorPopup}>
        <AlertDialogContent data-testid="error-acrescimo-popup">
          <AlertDialogHeader>
            <AlertDialogTitle>Atenção</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              {errorMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button 
              onClick={() => setShowErrorPopup(false)}
              data-testid="button-fechar-erro-acrescimo"
            >
              Entendi
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}