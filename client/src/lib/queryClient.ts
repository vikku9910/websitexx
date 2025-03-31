import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let text;
    try {
      // Try to get JSON error
      const jsonResponse = await res.json();
      text = jsonResponse.error || JSON.stringify(jsonResponse);
    } catch (e) {
      // If that fails, get text
      try {
        text = await res.text();
      } catch (e2) {
        text = res.statusText;
      }
    }
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  console.log(`API Request: ${method} ${url}`, data);
  
  try {
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });
    
    console.log(`API Response: ${res.status} ${res.statusText}`);
    
    if (!res.ok) {
      await throwIfResNotOk(res);
    }
    
    // Clone the response so we can both check it and return it
    const clone = res.clone();
    try {
      // Try to log the response body for debugging (but don't fail if we can't)
      const responseText = await clone.text();
      if (responseText) {
        console.log(`Response body (first 500 chars): ${responseText.substring(0, 500)}`);
      }
    } catch (e) {
      console.warn("Could not read response body for logging", e);
    }
    
    return res;
  } catch (error) {
    console.error(`API Request failed: ${method} ${url}`, error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
