import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';

const VALOR_BASE = 30.00;

export default function Recorrencia() {
  const navigate = useNavigate();
  const [semanas, setSemanas] = useState(0);
  const [valorTotal, setValorTotal] = useState(VALOR_BASE);
  const [valorUnitario, setValorUnitario] = useState(VALOR_BASE);

  useEffect(() => {
    const profissionalNome = sessionStorage.getItem('profissionalNome');
    const selectedDate = sessionStorage.getItem('selectedDate');
    const horario = sessionStorage.getItem('horarioSelecionado');
    const sala = sessionStorage.getItem('salaSelecionada');
    
    if (!profissionalNome || !selectedDate || !horario || !sala) {
      navigate('/');
      return;
    }

    const acrescimoMinutos = parseInt(sessionStorage.getItem('acrescimoMinutos') || '0');
    let valorAcrescimo = 0;
    
    if (acrescimoMinutos === 15) {
      valorAcrescimo = 8.00;
    } else if (acrescimoMinutos === 30) {
      valorAcrescimo = 15.00;
    }
    
    const valorUnit = VALOR_BASE + valorAcrescimo;
    setValorUnitario(valorUnit);
    setValorTotal(valorUnit);
  }, [navigate]);

  useEffect(() => {
    const totalAgendamentos = 1 + semanas;
    const novoValorTotal = valorUnitario * totalAgendamentos;
    setValorTotal(novoValorTotal);
  }, [semanas, valorUnitario]);

  const handleIncrement = () => {
    if (semanas < 12) {
      setSemanas(semanas + 1);
    }
  };

  const handleDecrement = () => {
    if (semanas > 0) {
      setSemanas(semanas - 1);
    }
  };

  const calcularDatasRecorrentes = () => {
    const dataInicial = new Date(sessionStorage.getItem('selectedDate'));
    const datas = [dataInicial.toISOString().split('T')[0]];
    
    for (let i = 1; i <= semanas; i++) {
      const novaData = new Date(dataInicial);
      novaData.setDate(novaData.getDate() + (i * 7));
      datas.push(novaData.toISOString().split('T')[0]);
    }
    
    return datas;
  };

  const handleSeguir = () => {
    const datasRecorrentes = calcularDatasRecorrentes();
    
    sessionStorage.setItem('semanasRecorrentes', semanas.toString());
    sessionStorage.setItem('valorTotalFinal', valorTotal.toString());
    sessionStorage.setItem('datasRecorrentes', JSON.stringify(datasRecorrentes));
    sessionStorage.setItem('totalAgendamentos', (1 + semanas).toString());
    
    navigate('/pagamento');
  };

  const handleNaoRepetir = () => {
    const dataInicial = new Date(sessionStorage.getItem('selectedDate'));
    const datasRecorrentes = [dataInicial.toISOString().split('T')[0]];
    
    sessionStorage.setItem('semanasRecorrentes', '0');
    sessionStorage.setItem('valorTotalFinal', valorUnitario.toString());
    sessionStorage.setItem('datasRecorrentes', JSON.stringify(datasRecorrentes));
    sessionStorage.setItem('totalAgendamentos', '1');
    
    setSemanas(0);
    setValorTotal(valorUnitario);
    
    navigate('/pagamento');
  };

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
        <h2 className="text-4xl font-bold text-center text-slate-800 mb-4">
          Atendimento recorrente
        </h2>
        <p className="text-xl text-center text-slate-600 mb-10">
          Atenda nos mesmos dias e horários<br />
          das próximas semanas!
        </p>

        {/* Card principal */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 sm:p-12 mb-8">
          {/* Number Stepper */}
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center gap-6 mb-6">
              <button
                onClick={handleDecrement}
                disabled={semanas === 0}
                className="w-16 h-16 rounded-full bg-slate-200 hover:bg-slate-300 disabled:bg-slate-100 disabled:cursor-not-allowed flex items-center justify-center transition-all hover:scale-110"
                data-testid="button-decrement"
              >
                <Minus className="w-8 h-8 text-slate-700" />
              </button>
              
              <div className="text-center min-w-[120px]">
                <div 
                  className="text-7xl font-bold text-slate-900"
                  data-testid="semanas-count"
                >
                  {String(semanas).padStart(2, '0')}
                </div>
                <p className="text-lg text-slate-600 mt-2">
                  Até 12 semanas
                </p>
              </div>
              
              <button
                onClick={handleIncrement}
                disabled={semanas === 12}
                className="w-16 h-16 rounded-full bg-slate-200 hover:bg-slate-300 disabled:bg-slate-100 disabled:cursor-not-allowed flex items-center justify-center transition-all hover:scale-110"
                data-testid="button-increment"
              >
                <Plus className="w-8 h-8 text-slate-700" />
              </button>
            </div>
          </div>

          {/* Explicação */}
          <div className="bg-blue-50 rounded-2xl p-6 mb-8 border-2 border-blue-200">
            <p className="text-slate-700 mb-4 text-center">
              Considere a reserva atual mais o(s) próximo(s) atendimentos,<br />
              nas semanas seguintes.
            </p>
            <p className="text-slate-600 text-sm text-center">
              (Exemplo: reserva atual<br />
              + 2 semanas = 3 reservas)
            </p>
          </div>

          {/* Valor total */}
          <div className="bg-green-50 rounded-2xl p-6 mb-8 border-2 border-green-200">
            <p className="text-center text-lg text-slate-600 mb-2">
              Valor total
            </p>
            <p 
              className="text-center text-5xl font-bold text-slate-900"
              data-testid="valor-total"
            >
              R$ {valorTotal.toFixed(2).replace('.', ',')}
            </p>
          </div>

          {/* Botões */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={handleSeguir}
              className="flex-1 py-6 text-xl font-bold"
              style={{ backgroundColor: '#6169F2' }}
              data-testid="button-seguir"
            >
              Seguir
            </Button>
            <Button
              onClick={handleNaoRepetir}
              variant="outline"
              className="flex-1 py-6 text-xl font-bold"
              data-testid="button-nao-repetir"
            >
              Não repetir
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}