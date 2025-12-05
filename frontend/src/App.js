import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import Calendario from "@/pages/Calendario";
import Horarios from "@/pages/Horarios";
import Acrescimo from "@/pages/Acrescimo";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/calendario" element={<Calendario />} />
          <Route path="/horarios" element={<Horarios />} />
          <Route path="/acrescimo" element={<Acrescimo />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;