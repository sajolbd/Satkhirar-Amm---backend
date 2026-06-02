#!/usr/bin/env node

/**
 * Backend API Health Check Script
 * Run: node scripts/testAPI.js [apiUrl]
 * Example: node scripts/testAPI.js http://localhost:5000
 * Example: node scripts/testAPI.js https://satkhirar-api.vercel.app
 */

const http = require("http");
const https = require("https");

const API_URL = process.argv[2] || "http://localhost:5000";

console.log(`\n🔍 Testing API at: ${API_URL}\n`);

async function testEndpoint(path, method = "GET", body = null) {
  return new Promise((resolve) => {
    const url = new URL(path, API_URL);
    const protocol = url.protocol === "https:" ? https : http;

    const options = {
      method,
      hostname: url.hostname,
      port: url.port || (url.protocol === "https:" ? 443 : 80),
      path: url.pathname + url.search,
      headers: {
        "Content-Type": "application/json",
      },
    };

    const req = protocol.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          resolve({
            status: res.statusCode,
            body: JSON.parse(data),
            success: res.statusCode >= 200 && res.statusCode < 300,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            body: data,
            success: res.statusCode >= 200 && res.statusCode < 300,
          });
        }
      });
    });

    req.on("error", (error) => {
      resolve({
        status: 0,
        body: error.message,
        success: false,
      });
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function runTests() {
  const tests = [
    {
      name: "Root endpoint",
      path: "/",
      expectedStatus: 200,
    },
    {
      name: "Health check",
      path: "/health",
      expectedStatus: 200,
    },
    {
      name: "Database health check",
      path: "/health/db",
      expectedStatus: 200,
    },
    {
      name: "Get products",
      path: "/api/products",
      expectedStatus: 200,
    },
    {
      name: "Get products - active only",
      path: "/api/products?active=true",
      expectedStatus: 200,
    },
    {
      name: "404 Not Found",
      path: "/invalid-route",
      expectedStatus: 404,
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const result = await testEndpoint(test.path);
    const isSuccess = result.success && result.status === test.expectedStatus;

    console.log(`${isSuccess ? "✅" : "❌"} ${test.name}`);
    console.log(
      `   Status: ${result.status} (expected: ${test.expectedStatus})`,
    );

    if (result.body?.message || result.body?.status) {
      const msg =
        result.body?.message || result.body?.status || "Response received";
      console.log(`   Response: ${msg.substring(0, 60)}`);
    }

    if (isSuccess) {
      passed++;
    } else {
      failed++;
    }

    console.log("");
  }

  console.log(`📊 Results: ${passed} passed, ${failed} failed\n`);

  if (failed === 0) {
    console.log("🎉 All tests passed! API is ready for production.\n");
    process.exit(0);
  } else {
    console.log(`⚠️  ${failed} test(s) failed. Check the issues above.\n`);
    process.exit(1);
  }
}

runTests().catch((error) => {
  console.error("Test error:", error);
  process.exit(1);
});
