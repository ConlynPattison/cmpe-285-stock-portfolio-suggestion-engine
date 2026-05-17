import { Navigate, Route, Routes } from "react-router-dom";

import { Layout } from "./components/Layout";
import { CreatePortfolio } from "./pages/CreatePortfolio";
import { ViewPortfolios } from "./pages/ViewPortfolios";

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<CreatePortfolio />} />
        <Route path="portfolios" element={<ViewPortfolios />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
