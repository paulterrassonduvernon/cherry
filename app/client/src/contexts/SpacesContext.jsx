import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { getSpaces } from "../api.js";

const SpacesContext = createContext(null);

export function SpacesProvider({ children }) {
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // See SpaceView.jsx for why out-of-order responses need guarding.
  const requestIdRef = useRef(0);

  const refresh = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    try {
      setError(null);
      const data = await getSpaces();
      if (requestIdRef.current !== requestId) return;
      setSpaces(data);
    } catch (err) {
      if (requestIdRef.current !== requestId) return;
      setError(err.message);
    } finally {
      if (requestIdRef.current === requestId) setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <SpacesContext.Provider value={{ spaces, loading, error, refresh }}>
      {children}
    </SpacesContext.Provider>
  );
}

export function useSpaces() {
  const ctx = useContext(SpacesContext);
  if (!ctx) throw new Error("useSpaces must be used within a SpacesProvider");
  return ctx;
}
