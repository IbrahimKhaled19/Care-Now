const NOVU_API_URL = "https://api.novu.co/v1";

async function trigger(workflowId, subscriberId, payload = {}) {
  const apiKey = process.env.NOVU_API_KEY;
  if (!apiKey) {
    console.warn("[Novu] NOVU_API_KEY not set, skipping notification");
    return null;
  }

  if (!subscriberId) {
    console.warn("[Novu] No subscriberId provided, skipping");
    return null;
  }

  try {
    const res = await fetch(`${NOVU_API_URL}/events/trigger`, {
      method: "POST",
      headers: {
        "Authorization": `ApiKey ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: workflowId,
        to: { subscriberId },
        payload,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error(`[Novu] Trigger failed for "${workflowId}":`, data);
      return null;
    }

    console.log(`[Novu] Triggered "${workflowId}" → subscriber "${subscriberId}" (txn: ${data.data?.transactionId})`);
    return data;
  } catch (err) {
    console.error(`[Novu] Trigger error for "${workflowId}":`, err.message);
    return null;
  }
}

module.exports = { trigger };
