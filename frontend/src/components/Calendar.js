import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const FERIADOS = [
  { mes: 3, dia: 4 },
  { mes: 12, dia: 24 },
  { mes: 12, dia: 25 },
  { mes: 12, dia: 31 },
  { mes: 1, dia: 1 }
];

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function Calendar({ onSelectDate }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [reservas, setReservas] = useState([]);
  const [mensagemReserva, setMensagemReserva] = useState('');
  const [showWeekendMessage, setShowWeekendMessage] = useState(false);

  const hoje = new Date();
  const doisMesesAtras = new Date(hoje.getFullYear(), hoje.getMonth() - 2, 1);
  const dozeSemanasFuture = new Date(hoje.getTime() + (12 * 7 * 24 * 60 * 60 * 1000));

  const carregarReservas = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/reservas`, {
        params: {
          mes: currentDate.getMonth() + 1,
          ano: currentDate.getFullYear()
        }
      });
      setReservas(response.data);
    } catch (e) {
      console.error('Erro ao carregar reservas:', e);
    }
  }, [currentDate]);

  useEffect(() => {
    carregarReservas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carregarReservas]);

  const isFeriado = (dia, mes) => {
    return FERIADOS.some(f => f.dia === dia && f.mes === mes);
  };

  const isWeekend = (date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  const temReserva = (dia) => {
    const dataStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    return reservas.some(r => r.data === dataStr);
  };

  const getReservasParaDia = (dia) => {
    const dataStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    return reservas.filter(r => r.data === dataStr);
  };

  const getDiasDoMes = () => {
    const ano = currentDate.getFullYear();
    const mes = currentDate.getMonth();
    
    const primeiroDia = new Date(ano, mes, 1);
    const ultimoDia = new Date(ano, mes + 1, 0);
    
    const diasAnteriores = primeiroDia.getDay();
    const totalDias = ultimoDia.getDate();
    
    const dias = [];
    
    for (let i = 0; i < diasAnteriores; i++) {
      dias.push({ dia: null, mesAtual: false });
    }
    
    for (let dia = 1; dia <= totalDias; dia++) {
      const dataCompleta = new Date(ano, mes, dia);
      const isPast = dataCompleta < doisMesesAtras;
      const isFuture = dataCompleta > dozeSemanasFuture;
      const isFeriadoDia = isFeriado(dia, mes + 1);
      const isWeekendDia = isWeekend(dataCompleta);
      const hasReserva = temReserva(dia);
      
      dias.push({
        dia,
        mesAtual: true,
        desabilitado: isPast || isFuture || isFeriadoDia,
        isWeekend: isWeekendDia,
        hasReserva
      });
    }
    
    return dias;
  };

  const handlePrevMonth = () => {
    const novaMes = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    if (novaMes >= doisMesesAtras) {
      setCurrentDate(novaMes);
      setMensagemReserva('');
      setShowWeekendMessage(false);
    }
  };

  const handleNextMonth = () => {
    const novaMes = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    if (novaMes <= dozeSemanasFuture) {
      setCurrentDate(novaMes);
      setMensagemReserva('');
      setShowWeekendMessage(false);
    }
  };

  const handleDayClick = (diaObj) => {
    if (!diaObj.mesAtual || diaObj.desabilitado) return;
    
    const dataCompleta = new Date(currentDate.getFullYear(), currentDate.getMonth(), diaObj.dia);
    setSelectedDate(dataCompleta);
    
    if (diaObj.isWeekend) {
      setShowWeekendMessage(true);
    } else {
      setShowWeekendMessage(false);
    }
    
    if (diaObj.hasReserva) {
      const reservasDia = getReservasParaDia(diaObj.dia);
      const mensagens = reservasDia.map(r => `Sala ${r.sala}, ${r.horario}`).join(' | ');
      setMensagemReserva(`Há reserva(s) neste dia! ${mensagens}`);
    } else {
      setMensagemReserva('');
    }
    
    onSelectDate(dataCompleta);
  };

  const dias = getDiasDoMes();

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Área de mensagens */}
      <div className="mb-6 min-h-20 bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-3 h-3 bg-white rounded-full border-2 border-slate-400" />
          <p className="text-sm text-slate-600">Caso houver reserva avisaremos aqui</p>
        </div>
        {mensagemReserva && (
          <p className="text-blue-700 font-semibold" data-testid="reserva-message">
            {mensagemReserva}
          </p>
        )}
        {showWeekendMessage && (
          <p className="text-orange-600 font-semibold mt-2" data-testid="weekend-message">
            Reveja as regras no contrato, cláusula 5
          </p>
        )}
      </div>

      {/* Calendário */}
      <div className="bg-white rounded-2xl shadow-xl p-6">
        {/* Cabeçalho com navegação */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            data-testid="prev-month"
          >
            <ChevronLeft className="w-6 h-6 text-slate-700" />
          </button>
          
          <h3 className="text-2xl font-bold text-slate-800">
            {MESES[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>
          
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            data-testid="next-month"
          >
            <ChevronRight className="w-6 h-6 text-slate-700" />
          </button>
        </div>

        {/* Dias da semana */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {DIAS_SEMANA.map((dia, i) => (
            <div
              key={i}
              className="text-center font-semibold text-slate-600 text-sm py-2"
            >
              {dia}
            </div>
          ))}
        </div>

        {/* Grid de dias */}
        <div className="grid grid-cols-7 gap-2">
          {dias.map((diaObj, index) => {
            if (!diaObj.mesAtual) {
              return <div key={index} className="aspect-square" />;
            }

            const isSelected = selectedDate && 
              selectedDate.getDate() === diaObj.dia &&
              selectedDate.getMonth() === currentDate.getMonth() &&
              selectedDate.getFullYear() === currentDate.getFullYear();

            return (
              <button
                key={index}
                onClick={() => handleDayClick(diaObj)}
                disabled={diaObj.desabilitado}
                className={`
                  aspect-square rounded-xl flex flex-col items-center justify-center relative
                  transition-all font-semibold text-lg
                  ${diaObj.desabilitado
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'hover:bg-blue-100 hover:scale-105 cursor-pointer'
                  }
                  ${isSelected ? 'bg-blue-500 text-white ring-4 ring-blue-200' : 'bg-slate-50 text-slate-800'}
                `}
                data-testid={`day-${diaObj.dia}`}
              >
                <span>{diaObj.dia}</span>
                {diaObj.hasReserva && !diaObj.desabilitado && (
                  <div className="absolute bottom-1">
                    <div className="w-2 h-2 bg-white rounded-full border border-slate-400" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}