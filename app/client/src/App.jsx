import { Routes, Route } from "react-router-dom";
import { SpacesProvider } from "./contexts/SpacesContext.jsx";
import Layout from "./components/Layout.jsx";
import SpaceList from "./components/SpaceList.jsx";
import SpaceView from "./components/SpaceView.jsx";

export default function App() {
  return (
    <SpacesProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<SpaceList />} />
          <Route path="/spaces/:id" element={<SpaceView />} />
        </Route>
      </Routes>
    </SpacesProvider>
  );
}
