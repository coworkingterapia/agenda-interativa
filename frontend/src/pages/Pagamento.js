import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter } from "@/components/ui/alert-dialog";

const AUDIO_URL = "https://audio.jukehost.co.uk/FKRO4oNrvRIwHmfpx32hFkqDTODF7Inc";

export default function Pagamento() {
  const navigate = useNavigate();
  const [formaPagamento, setFormaPagamento] = useState('antecipado');
  const [valorFinal] = useState(0);
  const [showAudioPopup, setShowAudioPopup] = useState(false);

  useEffect(() => {
    const profissionalNome = sessionStorage.getItem('profissionalNome');
    const selectedDate = sessionStorage.getItem('selectedDate');
    const horario = sessionStorage.getItem('horarioSelecionado');
    const sala = sessionStorage.getItem('salaSelecionada');
    
    if (!profissionalNome || !selectedDate || !horario || !sala) {
      navigate('/');
      return;
    }
  }, [navigate]);

  const handleFormaPagamentoChange = (forma) => {
    setFormaPagamento(forma);
  };

  const handleVerResumo = () => {
    sessionStorage.setItem('formaPagamento', formaPagamento);
    console.log('Forma de pagamento selecionada:', formaPagamento);
  };

  const handleOpenAudioPopup = () => {
    setShowAudioPopup(true);
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
        <h2 className="text-4xl font-bold text-center text-slate-800 mb-10">
          Forma de pagamento
        </h2>

        {/* Card principal */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 sm:p-12 mb-8">
          {/* Opções de pagamento */}
          <div className="space-y-6 mb-8">
            {/* Opção 1: Antecipado */}
            <button
              onClick={() => handleFormaPagamentoChange('antecipado')}
              className={`
                w-full p-6 rounded-2xl text-left transition-all border-3
                ${formaPagamento === 'antecipado'
                  ? 'bg-blue-500 text-white border-blue-600 shadow-lg'
                  : 'bg-white text-slate-800 border-slate-300 hover:border-blue-400 hover:bg-blue-50'
                }
              `}
              data-testid="opcao-antecipado"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold mb-2">
                    Antecipado (pré)
                  </h3>
                  <p className={`text-lg ${
                    formaPagamento === 'antecipado' ? 'text-white/90' : 'text-slate-600'
                  }`}>
                    Pague agora e garanta sua reserva
                  </p>
                </div>
                <div className={`w-8 h-8 rounded-full border-4 flex items-center justify-center ${
                  formaPagamento === 'antecipado' 
                    ? 'border-white bg-white' 
                    : 'border-slate-300'
                }`}>
                  {formaPagamento === 'antecipado' && (
                    <div className="w-4 h-4 rounded-full bg-blue-500" />
                  )}
                </div>
              </div>
            </button>

            {/* Opção 2: No dia */}
            <button
              onClick={() => handleFormaPagamentoChange('no-dia')}
              className={`
                w-full p-6 rounded-2xl text-left transition-all border-3
                ${formaPagamento === 'no-dia'
                  ? 'bg-blue-500 text-white border-blue-600 shadow-lg'
                  : 'bg-white text-slate-800 border-slate-300 hover:border-blue-400 hover:bg-blue-50'
                }
              `}
              data-testid="opcao-no-dia"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-2xl font-bold">
                      No dia (pós)
                    </h3>
                    <span className={`text-xl font-bold ${
                      formaPagamento === 'no-dia' ? 'text-white' : 'text-orange-600'
                    }`}>
                      + R$ 10,00
                    </span>
                  </div>
                  <p className={`text-lg ${
                    formaPagamento === 'no-dia' ? 'text-white/90' : 'text-slate-600'
                  }`}>
                    Pague no dia do atendimento
                  </p>
                </div>
                <div className={`w-8 h-8 rounded-full border-4 flex items-center justify-center ${
                  formaPagamento === 'no-dia' 
                    ? 'border-white bg-white' 
                    : 'border-slate-300'
                }`}>
                  {formaPagamento === 'no-dia' && (
                    <div className="w-4 h-4 rounded-full bg-blue-500" />
                  )}
                </div>
              </div>
            </button>

            {/* Link explicativo */}
            <div className="text-center">
              <button
                onClick={handleOpenAudioPopup}
                className="text-blue-600 hover:text-blue-700 underline text-lg font-medium"
                data-testid="link-explicativo"
              >
                Por que tem esse adicional?
              </button>
            </div>
          </div>

          {/* Valor final */}
          <div className="bg-green-50 rounded-2xl p-6 mb-8 border-2 border-green-200">
            <p className="text-center text-lg text-slate-600 mb-2">
              Valor final
            </p>
            <p 
              className="text-center text-5xl font-bold text-slate-900"
              data-testid="valor-final"
            >
              R$ {valorFinal.toFixed(2).replace('.', ',')}
            </p>
          </div>

          {/* Botão */}
          <Button
            onClick={handleVerResumo}
            className="w-full py-6 text-xl font-bold"
            style={{ backgroundColor: '#6169F2' }}
            data-testid="button-ver-resumo"
          >
            Ver Resumo
          </Button>
        </div>
      </div>

      {/* Popup de áudio */}
      <AlertDialog open={showAudioPopup} onOpenChange={setShowAudioPopup}>
        <AlertDialogContent data-testid="audio-popup" className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl">
              Por que tem esse adicional?
            </AlertDialogTitle>
          </AlertDialogHeader>
          <div className="py-6">
            <div className="flex items-center justify-center gap-4 mb-6">
              <Play className="w-12 h-12 text-blue-500" />
              <p className="text-lg text-slate-600">
                Ouça a explicação:
              </p>
            </div>
            <audio 
              controls 
              className="w-full"
              data-testid="audio-player"
            >
              <source src={AUDIO_URL} type="audio/mpeg" />
              Seu navegador não suporta o elemento de áudio.
            </audio>
          </div>
          <AlertDialogFooter>
            <Button 
              onClick={() => setShowAudioPopup(false)}
              data-testid="button-fechar-audio"
            >
              Fechar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}