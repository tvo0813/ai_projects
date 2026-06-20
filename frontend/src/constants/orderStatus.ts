export const ORDER_STATUS_COLORS: Record<string, string> = {
  received: '#3498db',
  brewing: '#e67e22',
  ready_for_pickup: '#27ae60',
  completed: '#95a5a6',
  cancelled: '#e74c3c',
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  received: '📋 Received',
  brewing: '♨️ Brewing',
  ready_for_pickup: '✅ Ready for Pickup',
  completed: '✓ Completed',
  cancelled: '✕ Cancelled',
}

export const ORDER_STATUSES = Object.keys(ORDER_STATUS_LABELS)
