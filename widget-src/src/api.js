/**
 * Send a message to the Hey804 chat API.
 * @param {string} baseUrl - Server base URL (derived from script src)
 * @param {string} message - User's question
 * @param {string} partner - Partner org identifier
 * @returns {Promise<object>} API response data
 */
export async function sendMessage(baseUrl, message, partner) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        channel: "widget",
        context: { partner },
      }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  } finally {
    clearTimeout(timeout);
  }
}
