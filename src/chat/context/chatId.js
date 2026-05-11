export const MAX_SERVER_CHAT_ID = 1_000_000_000;

// Local fallback IDs use Date.now() millisecond timestamps (~1e12),
// while backend chat IDs are small integer primary keys from SQLite.
export const isServerChatId = (id) =>
  Number.isInteger(id) && id > 0 && id < MAX_SERVER_CHAT_ID;
