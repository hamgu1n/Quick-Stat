import { Route, Routes } from "react-router";
import "./App.css";
import Textbook from "./pages/Textbook";
import Analyzer from "./pages/Analyzer";
import Home from "./pages/Home";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/analyzer" element={<Analyzer />} />
        <Route path="/textbook/" element={<Textbook />} />
        <Route path="/textbook/:slug" element={<Textbook />} />
      </Routes>
    </>
  );
}

export default App;
