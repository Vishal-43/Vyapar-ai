import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import AuthComponent from "./components/auth/AuthComponent";
import Landing from "./pages/Landing";



function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
        {}
        <Route path="/auth" element={<AuthComponent />} />

        {}
        <Route path="/" element={<Landing />} />
        {/* <Route path="/blog" element={<ComingSoon />} />
        <Route path="/pricing" element={<ComingSoon />} />
        <Route path="/docs" element={<Docs />} />
        <Route path="/about" element={<ComingSoon />} />
        <Route path="/contact" element={<ComingSoon />} />
        <Route path="/error" element={<ErrorPage />} />
        <Route path="*" element={<ErrorPage statusCode={404} />} /> */}

      </Routes>
    </BrowserRouter>
  </ErrorBoundary>
  );
}
export default App;
