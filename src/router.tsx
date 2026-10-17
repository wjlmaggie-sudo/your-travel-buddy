import { QueryClient } from "@tanstack/react-query";
import { createRouter, createHashHistory } from "@tanstack/react-router";
import { STATIC_PAGES } from "./lib/deployment";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    ...(STATIC_PAGES ? { history: createHashHistory() } : {}),
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
