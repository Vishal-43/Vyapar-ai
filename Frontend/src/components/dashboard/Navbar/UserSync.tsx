import { useEffect, useRef } from "react";
import { useAuth } from "@clerk/clerk-react";
import { initUser } from "../../../libs/api";

export default function UserSync() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const hasSynced = useRef(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || hasSynced.current) return;

    const sync = async () => {
      try {
        const token = await getToken();
        if (!token) return;

        await initUser(token);
        hasSynced.current = true;
      } catch (err) {
        console.error("Backend user sync failed", err);
      }
    };

    sync();
  }, [isLoaded, isSignedIn, getToken]);

  return null; 
}
