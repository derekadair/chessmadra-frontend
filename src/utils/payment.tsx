import { isDevelopment } from "./env";

export const MAX_MOVES_FREE_TIER = 200;
export const PAYMENT_ENABLED =
  isDevelopment || window.location.href.includes("staging");
