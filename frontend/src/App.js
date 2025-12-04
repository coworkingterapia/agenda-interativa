import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import Calendario from "@/pages/Calendario";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/calendario" element={<Calendario />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;