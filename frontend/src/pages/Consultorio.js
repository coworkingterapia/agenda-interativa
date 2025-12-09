import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { AlertDialog, AlertDialogContent } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

const IMAGE_MINIATURA_01 = "https://customer-assets.emergentagent.com/job_id-validator-5/artifacts/n1vmr6bl_Miniatura%20sala%2001.png";
const IMAGE_MINIATURA_02 = "https://customer-assets.emergentagent.com/job_id-validator-5/artifacts/nxlo7hz5_Miniatura%20sala%2002.png";
const IMAGE_MINIATURA_03 = "https://customer-assets.emergentagent.com/job_id-validator-5/artifacts/icpguuhy_Miniatura%20sala%2003.png";
const IMAGE_MINIATURA_04 = "https://customer-assets.emergentagent.com/job_id-validator-5/artifacts/t9u64v6p_Miniatura%20sala%2004.png";

const IMAGE_COMPLETA_01 = "https://customer-assets.emergentagent.com/job_id-validator-5/artifacts/shpv8i1c_FOTO%20SALA%201.2.png";
const IMAGE_COMPLETA_02 = "https://customer-assets.emergentagent.com/job_id-validator-5/artifacts/vtzv8vqn_FOTO%20SALA%202.2.png";
const IMAGE_COMPLETA_03 = "https://customer-assets.emergentagent.com/job_id-validator-5/artifacts/498uiz6h_FOTO%20SALA%203.2.png";
const IMAGE_COMPLETA_04 = "https://customer-assets.emergentagent.com/job_id-validator-5/artifacts/t9u64v6p_Miniatura%20sala%2004.png";

const IMAGE_VENTIL = "https://customer-assets.emergentagent.com/job_id-validator-5/artifacts/86c3a2u9_FOTO%20VENTIL%20TETO.png";

const SALAS = [
  { id: '01', nome: 'Sala 01', miniatura: IMAGE_MINIATURA_01, imagemCompleta: IMAGE_COMPLETA_01, descricao: '' },
  { id: '02', nome: 'Sala 02', miniatura: IMAGE_MINIATURA_02, imagemCompleta: IMAGE_COMPLETA_02, descricao: '' },
  { id: '03', nome: 'Sala 03', miniatura: IMAGE_MINIATURA_03, imagemCompleta: IMAGE_COMPLETA_03, descricao: '(com maca)' },
  { id: '04', nome: 'Sala 04', miniatura: IMAGE_MINIATURA_04, imagemCompleta: IMAGE_COMPLETA_04, descricao: '' }
];

export default function Consultorio() {
  const navigate = useNavigate();
  const [salaSelecionada, setSalaSelecionada] = useState(null);
  const [showImagePopup, setShowImagePopup] = useState(false);

  useEffect(() => {
    const profissionalNome = sessionStorage.getItem('profissionalNome');
    const selectedDate = sessionStorage.getItem('selectedDate');
    const horario = sessionStorage.getItem('horarioSelecionado');
    const acrescimo = sessionStorage.getItem('acrescimoMinutos');
    
    if (!profissionalNome || !selectedDate || !horario || !acrescimo) {
      navigate('/');
      return;
    }
  }, [navigate]);

  const handleSalaClick = (sala) => {
    setSalaSelecionada(sala);
    setShowImagePopup(true);
  };

  const handleReservar = () => {
    sessionStorage.setItem('salaSelecionada', salaSelecionada.id);
    setShowImagePopup(false);
    navigate('/recorrencia');
  };

  const handleFechar = () => {
    setShowImagePopup(false);
    setSalaSelecionada(null);
  };

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
        <h2 className="text-4xl font-bold text-center text-slate-800 mb-10">
          Escolha o consultório
        </h2>

        {/* Grid de salas 2x2 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12 max-w-4xl mx-auto">
          {SALAS.map((sala) => (
            <button
              key={sala.id}
              onClick={() => handleSalaClick(sala)}
              className="relative bg-white rounded-3xl shadow-xl overflow-hidden hover:scale-105 transition-transform cursor-pointer group"
              data-testid={`sala-${sala.id}`}
            >
              <div className="aspect-[4/3] relative">
                <img
                  src={sala.miniatura}
                  alt={sala.nome}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="text-3xl font-bold text-white mb-1">
                    {sala.id}
                  </h3>
                  {sala.descricao && (
                    <p className="text-lg text-white/90">
                      {sala.descricao}
                    </p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Banner informativo */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center">
            <div className="w-full sm:w-1/2">
              <img 
                src={IMAGE_VENTIL}
                alt="Ventilação"
                className="w-full h-full object-cover"
                style={{ maxHeight: '300px' }}
              />
            </div>
            <div className="flex-1 p-8 text-center sm:text-left">
              <p className="text-2xl sm:text-3xl font-bold text-slate-800 leading-relaxed">
                No Coworking Terapia<br />
                as salas são climatizadas<br />
                e organizadas.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de visualização ampliada */}
      <AlertDialog open={showImagePopup} onOpenChange={setShowImagePopup}>
        <AlertDialogContent className="max-w-4xl" data-testid="image-popup">
          {salaSelecionada && (
            <>
              <div className="relative mb-6">
                <img
                  src={salaSelecionada.imagemCompleta}
                  alt={salaSelecionada.nome}
                  className="w-full rounded-lg"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={handleReservar}
                  className="flex-1 py-6 text-xl font-bold"
                  style={{ backgroundColor: '#6169F2' }}
                  data-testid="button-reservar-consultorio"
                >
                  Reservar
                </Button>
                <Button
                  onClick={handleFechar}
                  variant="outline"
                  className="flex-1 py-6 text-xl font-bold"
                  data-testid="button-fechar-modal"
                >
                  Fechar
                </Button>
              </div>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}