"use client";

import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { store } from "@/store";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { getCsrfToken } from "@/services/authService";
import { checkAuth } from "@/store/authSlice";

export default function Providers({ children }) {
  useEffect(() => {
    getCsrfToken().catch(console.error);
    //dispatch check auth thunk
    store.dispatch(checkAuth());
  }, []);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            retry: 1,
          },
        },
      })
  );

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <AuthWrapper>{children}</AuthWrapper>
      </QueryClientProvider>
    </Provider>
  );
}

function AuthWrapper({ children }) {
  const isCheckingAuth = useSelector((state) => state.auth.isCheckingAuth);

  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center ">
        <i className="fa-solid fa-spinner fa-spin text-4xl text-blue-500"></i>
      </div>
    );
  }

  return <>{children}</>;
}
