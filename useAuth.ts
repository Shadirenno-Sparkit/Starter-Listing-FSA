import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  // First try local auth, then fall back to Replit auth
  const { data: localUser, isLoading: localLoading } = useQuery({
    queryKey: ["/api/local/user"],
    retry: false,
  });

  const { data: replitUser, isLoading: replitLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    enabled: !localUser, // Only check Replit auth if local auth failed
  });

  const user = localUser || replitUser;
  const isLoading = localLoading || (replitLoading && !localUser);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
