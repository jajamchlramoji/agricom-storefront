/** The order lifecycle: which status an order may move to from each status. */
export const transitions = {
  new_request: ['checking_availability', 'cancelled'],
  checking_availability: ['confirmed', 'cancelled'],
  // Cash-on-delivery orders skip awaiting_payment.
  confirmed: ['awaiting_payment', 'ready_to_dispatch', 'cancelled'],
  awaiting_payment: ['ready_to_dispatch', 'cancelled'],
  ready_to_dispatch: ['dispatched', 'cancelled'],
  dispatched: ['delivered'],
  delivered: [],
  cancelled: [],
};
export const statuses = Object.keys(transitions);
export const nextStatuses = (status) => transitions[status] || [];
const label = (status) => status.replaceAll('_', ' ');

/** Moves the order and records who did it. Returns an error message if the move is not allowed. */
export function moveOrder(order, status, actor) {
  if (order.status === status) return `Order ${order.id} is already ${label(status)}.`;
  if (!nextStatuses(order.status).includes(status))
    return `Order ${order.id} cannot go from ${label(order.status)} to ${label(status)}.`;
  const at = new Date().toISOString();
  order.history = [...(order.history || []), { at, from: order.status, to: status, by: actor }];
  order.status = status;
  order.updatedAt = at;
  return null;
}
