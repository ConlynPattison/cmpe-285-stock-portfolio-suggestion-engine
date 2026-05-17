import { Navigate, Route, Routes } from "react-router-dom";

import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { CreatePortfolio } from "./pages/CreatePortfolio";
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { ViewPortfolios } from "./pages/ViewPortfolios";

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<CreatePortfolio />} />
          <Route path="portfolios" element={<ViewPortfolios />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
