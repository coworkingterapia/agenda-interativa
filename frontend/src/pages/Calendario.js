import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Calendar from '@/components/Calendar';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Calendario() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(null);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);

  const seedReservas = async () => {
    try {
      await axios.post(`${API}/seed-reservas`);
      console.log('Reservas populadas');
    } catch (e) {
      console.error('Erro ao popular reservas:', e);
    }
  };

  useEffect(() => {
    const profissionalNome = sessionStorage.getItem('profissionalNome');
    if (!profissionalNome) {
      navigate('/');
    }
    
    seedReservas();
  }, [navigate]);

  const handleSelectDate = (date) => {
    setSelectedDate(date);
    setShowConfirmPopup(true);
  };

  const handleConfirm = () => {
    sessionStorage.setItem('selectedDate', selectedDate.toISOString());
    setShowConfirmPopup(false);
    navigate('/horarios');
  };

  const handleVoltar = () => {
    setShowConfirmPopup(false);
    setSelectedDate(null);
  };

  const formatDate = (date) => {
    if (!date) return '';
    const dia = String(date.getDate()).padStart(2, '0');
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const ano = date.getFullYear();
    return `${dia}/${mes}/${ano}`;
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
        <h2 className="text-4xl font-bold text-center text-slate-800 mb-8">
          Escolha o dia
        </h2>

        {/* Mural de avisos */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border-2 border-slate-200">
          <h3 className="text-xl font-semibold text-slate-700 text-center">
            Mural de avisos
          </h3>
        </div>

        {/* Calendário */}
        <Calendar onSelectDate={handleSelectDate} />
      </div>

      {/* Popup de confirmação */}
      <AlertDialog open={showConfirmPopup} onOpenChange={setShowConfirmPopup}>
        <AlertDialogContent data-testid="confirm-popup">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmação de data</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Você escolheu este dia: {formatDate(selectedDate)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={handleVoltar}
              data-testid="button-voltar"
            >
              Voltar
            </Button>
            <Button 
              onClick={handleConfirm}
              data-testid="button-confirmo"
            >
              Confirmo
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}