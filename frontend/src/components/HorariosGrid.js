import { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const gerarHorarios = () => {
  const horarios = [];
  for (let h = 7; h <= 20; h++) {
    for (let m = 0; m < 60; m += 15) {
      if (h === 20 && m > 0) break;
      const hora = String(h).padStart(2, '0');
      const minuto = String(m).padStart(2, '0');
      horarios.push(`${hora}:${minuto}`);
    }
  }
  return horarios;
};

const horarioParaMinutos = (horario) => {
  const [h, m] = horario.split(':').map(Number);
  return h * 60 + m;
};

const minutosParaHorario = (minutos) => {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

export default function HorariosGrid({ dataSelecionada, acrescimoMinutos = 0, onSelectHorario }) {
  const [reservas, setReservas] = useState([]);
  const [horariosBloqueados, setHorariosBloqueados] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (dataSelecionada) {
      carregarReservas();
    }
  }, [dataSelecionada]);

  useEffect(() => {
    if (reservas.length > 0) {
      calcularBloqueios();
    }
  }, [reservas, acrescimoMinutos]);

  const carregarReservas = async () => {
    try {
      setLoading(true);
      const dataFormatada = dataSelecionada.toISOString().split('T')[0];
      const response = await axios.get(`${API}/reservas-por-data`, {
        params: { data: dataFormatada }
      });
      setReservas(response.data);
    } catch (e) {
      console.error('Erro ao carregar reservas:', e);
      setReservas([]);
    } finally {
      setLoading(false);
    }
  };

  const calcularBloqueios = () => {
    const bloqueados = new Set();

    reservas.forEach(reserva => {
      const horarioInicioMinutos = horarioParaMinutos(reserva.horario);
      const duracaoTotal = reserva.duracao_minutos || 60;
      
      const bloqueioAntesInicio = horarioInicioMinutos - 60;
      const bloqueioAntesLimite = horarioInicioMinutos;
      
      const reservaFim = horarioInicioMinutos + duracaoTotal;
      const bloqueioDepoisInicio = horarioInicioMinutos;
      const bloqueioDepoisLimite = reservaFim + 75;

      for (let m = bloqueioAntesInicio; m < bloqueioAntesLimite; m += 15) {
        if (m >= 7 * 60 && m <= 20 * 60) {
          bloqueados.add(minutosParaHorario(m));
        }
      }

      for (let m = bloqueioDepoisInicio; m <= bloqueioDepoisLimite; m += 15) {
        if (m >= 7 * 60 && m <= 20 * 60) {
          bloqueados.add(minutosParaHorario(m));
        }
      }
    });

    setHorariosBloqueados(bloqueados);
  };

  const verificarConflito = (horario) => {
    const horarioInicioMinutos = horarioParaMinutos(horario);
    const duracaoAtendimento = 60 + acrescimoMinutos;
    const fimAtendimento = horarioInicioMinutos + duracaoAtendimento;
    const fimComBuffer = fimAtendimento + 15;

    for (const reserva of reservas) {
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
  };

  const handleHorarioClick = (horario) => {
    if (horariosBloqueados.has(horario)) {
      return;
    }

    const temConflito = verificarConflito(horario);
    onSelectHorario(horario, temConflito);
  };

  const todosHorarios = gerarHorarios();

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">Carregando horários...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
      {todosHorarios.map((horario) => {
        const bloqueado = horariosBloqueados.has(horario);

        return (
          <button
            key={horario}
            onClick={() => handleHorarioClick(horario)}
            disabled={bloqueado}
            className={`
              py-3 px-4 rounded-xl font-semibold text-base transition-all
              ${bloqueado
                ? 'bg-pink-100 text-pink-400 cursor-not-allowed border-2 border-pink-200'
                : 'bg-white text-slate-800 hover:bg-blue-100 hover:scale-105 cursor-pointer border-2 border-slate-300 hover:border-blue-400'
              }
            `}
            data-testid={`horario-${horario.replace(':', '-')}`}
          >
            {horario}
          </button>
        );
      })}
    </div>
  );
}