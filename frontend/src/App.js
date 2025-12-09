import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import Calendario from "@/pages/Calendario";
import Horarios from "@/pages/Horarios";
import Acrescimo from "@/pages/Acrescimo";
import Consultorio from "@/pages/Consultorio";
import Recorrencia from "@/pages/Recorrencia";
import Pagamento from "@/pages/Pagamento";
import Resumo from "@/pages/Resumo";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/calendario" element={<Calendario />} />
          <Route path="/horarios" element={<Horarios />} />
          <Route path="/acrescimo" element={<Acrescimo />} />
          <Route path="/consultorio" element={<Consultorio />} />
          <Route path="/recorrencia" element={<Recorrencia />} />
          <Route path="/pagamento" element={<Pagamento />} />
          <Route path="/resumo" element={<Resumo />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;