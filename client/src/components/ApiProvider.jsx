import { useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { setTokenProvider } from "../lib/api";

export default function ApiProvider({ children }) {
  const { getToken } = useAuth();

  useEffect(() => {
    setTokenProvider(getToken);
  }, [getToken]);

  return children;
}
