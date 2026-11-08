import { STATUSES } from "./constants.js";

export const getOrderStatus = (createdAt, now = Date.now()) => {
  const age = Math.max(0, now - createdAt);
  return STATUSES.reduce((current, status) => (age >= status.afterMs ? status.key : current), 'placed');
}