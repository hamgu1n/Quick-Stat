import { Navigate, Route, Routes } from "react-router";
import "./App.css";
import { SiteNav } from "./components/SiteNav";
import { SiteFooter } from "./components/SiteFooter";
import { ScrollToTop } from "./components/ScrollToTop";
import { MathTooltip } from "./components/MathTooltip";
import Textbook from "./pages/Textbook";
import Analyzer from "./pages/Analyzer";
import Applets from "./pages/Applets";
import Home from "./pages/Home";
import Review from "./pages/Review";
import About from "./pages/About";

function App() {
  return (
    <>
      <ScrollToTop />
      <MathTooltip />
      <SiteNav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/analyzer" element={<Analyzer />} />
        {/* The Glossary lives in the textbook; keep the old link working. */}
        <Route path="/glossary" element={<Navigate to="/textbook/glossary" replace />} />
        <Route path="/about" element={<About />} />
        <Route path="/applets" element={<Applets />} />
        <Route path="/textbook/" element={<Textbook />} />
        <Route path="/textbook/:slug" element={<Textbook />} />
        <Route path="/textbook/:slug/review" element={<Review />} />
      </Routes>
      <SiteFooter />
    </>
  );
}

export default App;
