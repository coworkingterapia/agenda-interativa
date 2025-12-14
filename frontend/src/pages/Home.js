import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Menu } from "lucide-react";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Home() {
  const navigate = useNavigate();
  const [digit1, setDigit1] = useState("");
  const [digit2, setDigit2] = useState("");
  const [digit3, setDigit3] = useState("");
  const [letter, setLetter] = useState("");
  const [noID, setNoID] = useState(false);
  const [isValidID, setIsValidID] = useState(false);
  const [invalidAttempts, setInvalidAttempts] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [profissionalNome, setProfissionalNome] = useState("");
  const [profissionalStatus, setProfissionalStatus] = useState("");
  const [showHistoricoModal, setShowHistoricoModal] = useState(false);
  const [historico, setHistorico] = useState([]);
  const [creditos, setCreditos] = useState(0);

  const input1Ref = useRef(null);
  const input2Ref = useRef(null);
  const input3Ref = useRef(null);
  const letterRef = useRef(null);

  const handleDigitChange = (value, setter, nextRef) => {
    if (/^[0-9]$/.test(value) || value === "") {
      setter(value);
      if (value && nextRef) {
        nextRef.current?.focus();
      }
    }
  };

  const handleLetterChange = (value) => {
    if (/^[A-Za-z]$/.test(value) || value === "") {
      setLetter(value.toUpperCase());
      if (value) {
        validateID(digit1 + digit2 + digit3 + "-" + value.toUpperCase());
      }
    }
  };

  const validateID = async (idToValidate) => {
    try {
      const response = await axios.post(`${API}/validate-id`, {
        id_profissional: idToValidate
      });

      if (response.data.valid) {
        setIsValidID(true);
        setInvalidAttempts(0);
        setProfissionalNome(response.data.profissional.nome);
        setProfissionalStatus(response.data.profissional.status_tratamento);
        sessionStorage.setItem('profissionalNome', response.data.profissional.nome);
        sessionStorage.setItem('profissionalStatus', response.data.profissional.status_tratamento);
        sessionStorage.setItem('idProfissional', idToValidate);
      } else {
        setIsValidID(false);
        const newAttempts = invalidAttempts + 1;
        setInvalidAttempts(newAttempts);

        if (newAttempts === 1) {
          setPopupMessage("Por favor, digite três números e uma letra referente à sua ID Profissional.");
          setShowPopup(true);
        } else if (newAttempts >= 2) {
          showIDNotFoundMessage();
        }
      }
    } catch (e) {
      console.error("Erro ao validar ID:", e);
    }
  };

  const carregarHistorico = () => {
    const idProfissional = sessionStorage.getItem('idProfissional');
    if (!idProfissional) return;
    
    const chave = `historico_agendamentos_${idProfissional}`;
    const historicoSalvo = localStorage.getItem(chave);
    
    if (historicoSalvo) {
      try {
        const dados = JSON.parse(historicoSalvo);
        setHistorico(dados);
      } catch (e) {
        console.error('Erro ao carregar histórico:', e);
        setHistorico([]);
      }
    } else {
      setHistorico([]);
    }
  };

  const abrirHistorico = async () => {
    carregarHistorico();
    const idProfissional = sessionStorage.getItem('idProfissional');
    if (idProfissional) {
      await carregarCreditos(idProfissional);
    }
    setShowHistoricoModal(true);
  };

  const getStatusCor = (item) => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const dataAgendamento = new Date(item.data + 'T00:00:00');
    dataAgendamento.setHours(0, 0, 0, 0);
    
    if (item.status === 'cancelado') {
      return 'bg-red-100 border-red-300';
    }
    
    if (dataAgendamento < hoje) {
      return 'bg-gray-200 border-gray-400';
    }
    
    if (dataAgendamento.getTime() === hoje.getTime()) {
      return 'bg-white border-blue-400 shadow-md';
    }
    
    return 'bg-blue-50 border-blue-300';
  };

  const carregarCreditos = async (idProfissional) => {
    try {
      const response = await axios.get(`${API}/creditos/${idProfissional}`);
      setCreditos(response.data.creditos || 0);
    } catch (error) {
      console.error('Erro ao carregar créditos:', error);
      setCreditos(0);
    }
  };

  const desmarcarReserva = async (reserva) => {
    if (!window.confirm('Tem certeza que deseja desmarcar esta reserva?')) {
      return;
    }
    
    try {
      const response = await axios.post(`${API}/reservas/${reserva.id}/desmarcar`);
      
      const idProfissional = sessionStorage.getItem('idProfissional');
      const chave = `historico_agendamentos_${idProfissional}`;
      const historicoAtual = JSON.parse(localStorage.getItem(chave) || '[]');
      
      const historicoAtualizado = historicoAtual.map(item => 
        item.id === reserva.id 
          ? { 
              ...item, 
              status_reserva: 'cancelado',
              data_cancelamento: response.data.data_cancelamento,
              hora_cancelamento: response.data.hora_cancelamento,
              credito_gerado: response.data.credito_gerado
            }
          : item
      );
      
      localStorage.setItem(chave, JSON.stringify(historicoAtualizado));
      setHistorico(historicoAtualizado);
      
      if (response.data.credito_gerado > 0) {
        await carregarCreditos(idProfissional);
        alert(`✅ Reserva desmarcada!\n\nCrédito gerado: R$ ${response.data.credito_gerado.toFixed(2).replace('.', ',')}\n\nVocê pode usar este crédito em próximas reservas.`);
      } else {
        alert('✅ Reserva desmarcada com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao desmarcar reserva:', error);
      alert('❌ Erro ao desmarcar reserva. Tente novamente.');
    }
  };

  const formatarData = (dataStr) => {
    const data = new Date(dataStr + 'T00:00:00');
    return data.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  const showIDNotFoundMessage = () => {
    alert('❌ ID Profissional não encontrada\n\nSe você não possui uma ID ou está com problemas para validar, entre em contato com o administrador do sistema.');
  };

  const handleButtonClick = (buttonName) => {
    if (noID) {
      showIDNotFoundMessage();
    } else if (buttonName === "Reservar") {
      navigate('/calendario');
    } else {
      console.log(`Botão ${buttonName} clicado`);
    }
  };

  const handleKeyDown = (e, currentValue, prevRef) => {
    if (e.key === "Backspace" && !currentValue && prevRef) {
      prevRef.current?.focus();
    }
  };

  const isButtonsEnabled = isValidID && !noID;

  const getSaudacao = () => {
    if (!profissionalNome || !profissionalStatus) return '';
    
    const genero = profissionalStatus === 'Dra.' ? 'vinda' : 'vindo';
    return `Bem-${genero}, ${profissionalStatus} ${profissionalNome}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex justify-end mb-8">
          <button 
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
            data-testid="menu-hamburger"
          >
            <Menu className="w-8 h-8 text-slate-700" />
          </button>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-slate-900 mb-4 tracking-tight">
            AGENDA INTERATIVA
          </h1>
          <p className="text-xl sm:text-2xl text-slate-600 font-light">
            Fácil e intuitiva
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 sm:p-12 mb-8">
          <div className="mb-6">
            <label className="block text-center text-2xl font-semibold text-slate-800 mb-8">
              Digite sua ID Profissional
            </label>

            <div className="flex items-center justify-center gap-3 mb-8">
              <input
                ref={input1Ref}
                type="text"
                maxLength="1"
                value={digit1}
                onChange={(e) => handleDigitChange(e.target.value, setDigit1, input2Ref)}
                onKeyDown={(e) => handleKeyDown(e, digit1, null)}
                className="w-14 h-16 sm:w-16 sm:h-20 text-center text-3xl font-bold border-2 border-slate-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-200 outline-none transition-all"
                data-testid="id-input-1"
              />
              <input
                ref={input2Ref}
                type="text"
                maxLength="1"
                value={digit2}
                onChange={(e) => handleDigitChange(e.target.value, setDigit2, input3Ref)}
                onKeyDown={(e) => handleKeyDown(e, digit2, input1Ref)}
                className="w-14 h-16 sm:w-16 sm:h-20 text-center text-3xl font-bold border-2 border-slate-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-200 outline-none transition-all"
                data-testid="id-input-2"
              />
              <input
                ref={input3Ref}
                type="text"
                maxLength="1"
                value={digit3}
                onChange={(e) => handleDigitChange(e.target.value, setDigit3, letterRef)}
                onKeyDown={(e) => handleKeyDown(e, digit3, input2Ref)}
                className="w-14 h-16 sm:w-16 sm:h-20 text-center text-3xl font-bold border-2 border-slate-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-200 outline-none transition-all"
                data-testid="id-input-3"
              />
              <span className="text-3xl font-bold text-slate-400 mx-2">-</span>
              <input
                ref={letterRef}
                type="text"
                maxLength="1"
                value={letter}
                onChange={(e) => handleLetterChange(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, letter, input3Ref)}
                className="w-14 h-16 sm:w-16 sm:h-20 text-center text-3xl font-bold border-2 border-slate-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-200 outline-none transition-all uppercase"
                data-testid="id-input-letter"
              />
            </div>

            {isValidID && profissionalNome && (
              <div className="text-center mb-6 px-4">
                <p className="text-green-600 font-bold text-2xl sm:text-3xl leading-tight">
                  {getSaudacao()}
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-3 mb-10">
            <Checkbox
              id="no-id"
              checked={noID}
              onCheckedChange={setNoID}
              data-testid="checkbox-no-id"
            />
            <label
              htmlFor="no-id"
              className="text-lg text-slate-700 cursor-pointer select-none"
            >
              Não tenho minha ID
            </label>
          </div>

          <div className="space-y-4">
            <button
              onClick={abrirHistorico}
              disabled={!isValidID}
              className="w-full py-5 text-xl font-bold text-white rounded-2xl transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 hover:shadow-xl"
              style={{ backgroundColor: '#3B82F6' }}
              data-testid="button-meu-historico"
            >
              📋 Meu Histórico
            </button>
            
            <button
              onClick={() => handleButtonClick("Reservar")}
              disabled={!isButtonsEnabled && !noID}
              className="w-full py-5 text-xl font-bold text-white rounded-2xl transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 hover:shadow-xl"
              style={{ backgroundColor: '#6169F2' }}
              data-testid="button-reservar"
            >
              Reservar
            </button>

            <button
              onClick={() => handleButtonClick("Visitar o local")}
              disabled={!isButtonsEnabled && !noID}
              className="w-full py-5 text-xl font-bold text-white rounded-2xl transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 hover:shadow-xl"
              style={{ backgroundColor: '#20C36A' }}
              data-testid="button-visitar-local"
            >
              Visitar o local
            </button>

            <button
              onClick={() => handleButtonClick("Enviar comprovante")}
              disabled={!isButtonsEnabled && !noID}
              className="w-full py-5 text-xl font-bold text-slate-800 bg-white border-3 border-slate-300 rounded-2xl transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 hover:shadow-xl hover:border-slate-400"
              data-testid="button-enviar-comprovante"
            >
              Enviar comprovante
            </button>
          </div>
        </div>
      </div>

      <AlertDialog open={showPopup} onOpenChange={setShowPopup}>
        <AlertDialogContent data-testid="error-popup">
          <AlertDialogHeader>
            <AlertDialogTitle>Atenção</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              {popupMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button onClick={() => setShowPopup(false)} data-testid="popup-close-button">
              OK
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showHistoricoModal} onOpenChange={setShowHistoricoModal}>
        <AlertDialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-bold text-center text-slate-800">
              📋 Meu Histórico de Agendamentos
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-slate-600">
              {profissionalNome && `${profissionalStatus} ${profissionalNome}`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {/* Saldo de Créditos */}
          {creditos > 0 && (
            <div className="mx-6 bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-slate-700">💳 Saldo de Créditos:</span>
                <span className="text-2xl font-bold text-blue-700">
                  R$ {creditos.toFixed(2).replace('.', ',')}
                </span>
              </div>
              <p className="text-sm text-slate-600 mt-2">
                Este crédito será usado automaticamente em suas próximas reservas.
              </p>
            </div>
          )}
          
          {/* Legenda de Status */}
          <div className="flex items-center gap-4 text-sm bg-slate-50 p-3 rounded-lg mx-6">
            <span className="font-semibold text-slate-700">Status de Pagamento:</span>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500"></span>
              <span className="text-slate-600">Pago</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-gray-400"></span>
              <span className="text-slate-600">Aguardando Pagamento</span>
            </div>
          </div>
          
          <div className="py-4">
            {historico.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-500 text-lg">
                  Você ainda não tem agendamentos registrados.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {historico.map((item, index) => {
                  const estaCancelado = item.status_reserva === 'cancelado';
                  return (
                  <div
                    key={item.id || index}
                    className={`border-2 rounded-xl p-4 transition-all ${
                      estaCancelado ? 'bg-gray-200 border-gray-400 opacity-60' : getStatusCor(item)
                    }`}
                  >
                    <div className="flex flex-col gap-4">
                      {/* Header com status */}
                      <div className="flex items-center gap-2">
                        {/* Bolinha de status de pagamento */}
                        <span 
                          className={`w-4 h-4 rounded-full ${
                            item.status_pagamento === 'pago' ? 'bg-green-500' : 'bg-gray-400'
                          }`}
                          title={item.status_pagamento === 'pago' ? 'Pago' : 'Aguardando Pagamento'}
                        ></span>
                        <span className={`text-lg font-bold ${estaCancelado ? 'text-gray-600 line-through' : 'text-slate-800'}`}>
                          📅 {formatarData(item.data)}
                        </span>
                        {estaCancelado && (
                          <span className="px-2 py-1 bg-gray-600 text-white text-xs font-bold rounded-full">
                            DESMARCADO
                          </span>
                        )}
                      </div>

                      {/* Informações da reserva */}
                      <div className={`space-y-1 ${estaCancelado ? 'text-gray-600' : 'text-slate-700'}`}>
                        <p>🕐 Horário: <strong>{item.horario}</strong></p>
                        <p>🏠 Sala: <strong>{item.sala}</strong></p>
                        {item.recorrencia > 0 && (
                          <p>🔄 Recorrência: <strong>{item.recorrencia} semana(s)</strong></p>
                        )}
                        {item.valor_total && (
                          <p>💰 Valor: <strong>R$ {item.valor_total.toFixed(2).replace('.', ',')}</strong></p>
                        )}
                      </div>

                      {/* Informação de cancelamento e crédito */}
                      {estaCancelado && item.credito_gerado > 0 && (
                        <div className="bg-blue-50 border border-blue-300 rounded-lg p-3">
                          <p className="text-sm text-slate-700">
                            Reserva desmarcada em {item.data_cancelamento}, às {item.hora_cancelamento} e possui{' '}
                            <span className="font-bold text-blue-800">
                              crédito de R$ {item.credito_gerado.toFixed(2).replace('.', ',')}
                            </span>
                          </p>
                        </div>
                      )}

                      {/* Link de Pagamento */}
                      {item.link_pagamento && !estaCancelado && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <p className="text-sm font-semibold text-green-800 mb-2">🔗 Link de Pagamento:</p>
                          <a 
                            href={item.link_pagamento}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline text-sm break-all"
                          >
                            {item.link_pagamento}
                          </a>
                        </div>
                      )}

                      {/* Botão Desmarcar */}
                      {!estaCancelado && (
                        <button
                          onClick={() => desmarcarReserva(item)}
                          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-all self-start"
                        >
                          Cancelar
                        </button>
                      )}

                      {/* Data/Hora de Criação no rodapé */}
                      {item.data_criacao && (
                        <div className="text-xs text-slate-400 border-t border-slate-200 pt-2 mt-2">
                          Criado em: {item.data_criacao}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <AlertDialogFooter>
            <Button 
              onClick={() => setShowHistoricoModal(false)}
              className="w-full sm:w-auto"
            >
              Fechar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}