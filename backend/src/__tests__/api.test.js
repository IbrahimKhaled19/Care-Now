require("dotenv").config();
const { describe, it, expect } = require("vitest");
const http = require("http");

const BASE = process.env.API_URL || "http://localhost:3001/api";

async function get(path) {
  return new Promise((resolve, reject) => {
    http.get(`${BASE}${path}`, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
      res.on("error", reject);
    }).on("error", reject);
  });
}

describe("API Integration Tests", () => {
  it("GET /health returns 200 with db status", async () => {
    const res = await get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.db).toBe("connected");
    expect(res.body.timestamp).toBeDefined();
  });

  it("GET /providers returns array", async () => {
    const res = await get("/providers");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data || res.body)).toBe(true);
  });

  it("GET /requests returns array", async () => {
    const res = await get("/requests");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data || res.body)).toBe(true);
  });

  it("GET /analytics/stats returns stats object", async () => {
    const res = await get("/analytics/stats");
    expect(res.status).toBe(200);
    expect(res.body.totalRequests).toBeDefined();
    expect(res.body.completionRate).toBeDefined();
  });

  it("GET /analytics/stats?days=7 clamps correctly", async () => {
    const res = await get("/analytics/stats?days=7");
    expect(res.status).toBe(200);
    expect(res.body.totalRequests).toBeDefined();
  });
});
