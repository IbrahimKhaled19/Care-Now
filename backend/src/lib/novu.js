const { Novu } = require("@novu/api");

let novu = null;

function getNovu() {
  if (!novu && process.env.NOVU_API_KEY) {
    novu = new Novu(process.env.NOVU_API_KEY);
  }
  return novu;
}

async function trigger(workflowId, subscriberId, payload = {}) {
  const client = getNovu();
  if (!client) {
    console.warn("[Novu] NOVU_API_KEY not set, skipping notification");
    return null;
  }

  if (!subscriberId) {
    console.warn("[Novu] No subscriberId provided, skipping");
    return null;
  }

  try {
    // Ensure subscriber exists in Novu
    await client.subscribers.create({
      subscriberId,
    });

    const result = await client.trigger(workflowId, {
      to: { subscriberId },
      payload,
    });

    console.log(`[Novu] Triggered "${workflowId}" to subscriber "${subscriberId}"`);
    return result;
  } catch (err) {
    console.error(`[Novu] Trigger failed for "${workflowId}":`, err.message);
    return null;
  }
}

module.exports = { trigger };
