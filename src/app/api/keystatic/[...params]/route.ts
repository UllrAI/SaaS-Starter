import { makeRouteHandler } from "@keystatic/next/route-handler";
import keystaticConfig, { showAdminUI } from "@/keystatic.config";

export const { POST, GET } = (() => {
  const notFoundRouteHandler = () => {
    return new Response(null, {
      status: 404,
    });
  };
  if (showAdminUI === false) {
    return { GET: notFoundRouteHandler, POST: notFoundRouteHandler };
  }
  return makeRouteHandler({
    config: keystaticConfig,
  });
})();
