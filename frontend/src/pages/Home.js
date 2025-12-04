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
        sessionStorage.setItem('profissionalNome', response.data.profissional.nome);
        sessionStorage.setItem('idProfissional', idToValidate);
      } else {
        setIsValidID(false);
        const newAttempts = invalidAttempts + 1;
        setInvalidAttempts(newAttempts);

        if (newAttempts === 1) {
          setPopupMessage("Por favor, digite três números e uma letra referente à sua ID Profissional.");
          setShowPopup(true);
        } else if (newAttempts >= 2) {
          redirectToWhatsApp();
        }
      }
    } catch (e) {
      console.error("Erro ao validar ID:", e);
    }
  };

  const redirectToWhatsApp = () => {
    const phone = "5561996082572";
    const message = encodeURIComponent(
      "Olá, minha ID Profissional não está validando ou ainda não tenho, gostaria que olhasse isso para mim."
    );
    window.location.href = `https://wa.me/${phone}?text=${message}`;
  };

  const handleButtonClick = (buttonName) => {
    if (noID) {
      redirectToWhatsApp();
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
              <div className="text-center mb-4">
                <p className="text-green-600 font-semibold text-lg">
                  Bem-vinda, {profissionalNome}!
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
              onClick={() => handleButtonClick("Reservar")}
              disabled={!isButtonsEnabled && !noID}
              className="w-full py-5 text-xl font-bold text-white rounded-2xl transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 hover:shadow-xl"
              style={{ backgroundColor: '#6169F2' }}
              data-testid="button-reservar"
            >
              Reservar
            </button>

            <button
              onClick={() => handleButtonClick("Desmarcar/Remarcar")}
              disabled={!isButtonsEnabled && !noID}
              className="w-full py-5 text-xl font-bold text-white rounded-2xl transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 hover:shadow-xl"
              style={{ backgroundColor: '#E449A7' }}
              data-testid="button-desmarcar-remarcar"
            >
              Desmarcar/ Remarcar
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
    </div>
  );
}