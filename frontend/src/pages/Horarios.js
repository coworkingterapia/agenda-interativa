import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import HorariosGrid from '@/components/HorariosGrid';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

const IMAGE_MOCA_LUZ = "https://customer-assets.emergentagent.com/job_id-validator-5/artifacts/41kameap_mo%C3%A7a%20e%20luz.jpg";

export default function Horarios() {
  const navigate = useNavigate();
  const [dataSelecionada, setDataSelecionada] = useState(null);
  const [horarioSelecionado, setHorarioSelecionado] = useState(null);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [acrescimoMinutos] = useState(0);

  useEffect(() => {
    const profissionalNome = sessionStorage.getItem('profissionalNome');
    const selectedDateStr = sessionStorage.getItem('selectedDate');
    
    if (!profissionalNome || !selectedDateStr) {
      navigate('/');
      return;
    }

    const date = new Date(selectedDateStr);
    setDataSelecionada(date);
  }, [navigate]);

  const handleSelectHorario = (horario, temConflito) => {
    setHorarioSelecionado(horario);
    
    if (temConflito) {
      setShowErrorPopup(true);
    } else {
      setShowConfirmPopup(true);
    }
  };

  const handleConfirm = () => {
    sessionStorage.setItem('horarioSelecionado', horarioSelecionado);
    sessionStorage.setItem('acrescimoMinutos', acrescimoMinutos.toString());
    setShowConfirmPopup(false);
    console.log('Horário confirmado:', horarioSelecionado);
  };

  const handleVoltar = () => {
    setShowConfirmPopup(false);
    setHorarioSelecionado(null);
  };

  const handleErrorClose = () => {
    setShowErrorPopup(false);
    setHorarioSelecionado(null);
  };

  const formatDate = (date) => {
    if (!date) return '';
    const dia = String(date.getDate()).padStart(2, '0');
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const ano = date.getFullYear();
    return `${dia}/${mes}/${ano}`;
  };

  if (!dataSelecionada) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <p className="text-slate-600">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
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
          Escolha o horário
        </h2>

        <p className="text-center text-slate-600 mb-8">
          Data selecionada: {formatDate(dataSelecionada)}
        </p>

        {/* Grade de horários */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 sm:p-12 mb-8">
          <HorariosGrid 
            dataSelecionada={dataSelecionada}
            acrescimoMinutos={acrescimoMinutos}
            onSelectHorario={handleSelectHorario}
          />
        </div>

        {/* Banner inferior */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center">
            <div className="w-full sm:w-1/3 md:w-1/4">
              <img 
                src={IMAGE_MOCA_LUZ}
                alt="Coworking Terapia"
                className="w-full h-full object-cover"
                style={{ maxHeight: '250px' }}
              />
            </div>
            <div className="flex-1 p-8 text-center sm:text-left">
              <p className="text-2xl sm:text-3xl font-bold text-slate-800 leading-relaxed">
                No Coworking Terapia<br />
                a luz avisa sobre o<br />
                encerramento em 10 min.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Popup de confirmação */}
      <AlertDialog open={showConfirmPopup} onOpenChange={setShowConfirmPopup}>
        <AlertDialogContent data-testid="confirm-horario-popup">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmação de horário</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Você escolheu o horário: {horarioSelecionado}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={handleVoltar}
              data-testid="button-voltar-horario"
            >
              Voltar
            </Button>
            <Button 
              onClick={handleConfirm}
              data-testid="button-confirmo-horario"
            >
              Confirmo
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Popup de erro de conflito */}
      <AlertDialog open={showErrorPopup} onOpenChange={setShowErrorPopup}>
        <AlertDialogContent data-testid="error-horario-popup">
          <AlertDialogHeader>
            <AlertDialogTitle>Conflito de horário</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Este horário não comporta o acréscimo de tempo escolhido. Será necessário voltar para a escolha de sala para tentar outro horário ou sala com disponibilidade.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button 
              onClick={handleErrorClose}
              data-testid="button-fechar-erro"
            >
              Entendi
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}