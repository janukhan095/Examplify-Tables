import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getStoredUserId,
  setStoredUserId,
  getDeviceId,
  getLanguage,
  setLanguage as storeLanguage,
} from "@/lib/storage";
import { apiRequest } from "@/lib/query-client";

export function useUser() {
  const queryClient = useQueryClient();
  const [isInitialized, setIsInitialized] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [language, setLanguageState] = useState("en");

  useEffect(() => {
    async function init() {
      const storedUserId = await getStoredUserId();
      const storedLanguage = await getLanguage();
      setUserId(storedUserId);
      setLanguageState(storedLanguage);
      setIsInitialized(true);
    }
    init();
  }, []);

  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ["/api/users", userId],
    enabled: !!userId && isInitialized,
  });

  const loginAsGuestMutation = useMutation({
    mutationFn: async () => {
      const deviceId = await getDeviceId();
      const response = await apiRequest("POST", "/api/users/guest", { deviceId });
      return response.json();
    },
    onSuccess: async (data) => {
      await setStoredUserId(data.id);
      setUserId(data.id);
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
  });

  const loginAsGuest = useCallback(() => {
    return loginAsGuestMutation.mutateAsync();
  }, [loginAsGuestMutation]);

  const setLanguage = useCallback(async (code: string) => {
    await storeLanguage(code);
    setLanguageState(code);
  }, []);

  return {
    user,
    userId,
    language,
    isInitialized,
    isLoading: !isInitialized || isLoadingUser,
    isGuest: user?.userType === "guest",
    loginAsGuest,
    setLanguage,
  };
}
