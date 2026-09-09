import { Route, Routes } from "react-router";
import "./App.css";
import { SiteNav } from "./components/SiteNav";
import { SiteFooter } from "./components/SiteFooter";
import Textbook from "./pages/Textbook";
import Analyzer from "./pages/Analyzer";
import Applets from "./pages/Applets";
import Home from "./pages/Home";

function App() {
  return (
    <>
      <SiteNav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/analyzer" element={<Analyzer />} />
        <Route path="/applets" element={<Applets />} />
        <Route path="/textbook/" element={<Textbook />} />
        <Route path="/textbook/:slug" element={<Textbook />} />
      </Routes>
      <SiteFooter />
    </>
  );
}

export default App;
