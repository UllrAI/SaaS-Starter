import { expect, type Page } from "@playwright/test";

type TestRole = "user" | "admin" | "super_admin";

interface TestUser {
  id: string;
  email: string;
  name: string;
  role: TestRole;
}

const E2E_TEST_SECRET = process.env.E2E_TEST_SECRET || "local-e2e-secret";

function getTestUser(role: TestRole): TestUser {
  return {
    id: `e2e-${role}`,
    email: `${role}@e2e.local`,
    name: `E2E ${role.replace("_", " ")}`,
    role,
  };
}

export async function loginAs(page: Page, role: TestRole): Promise<TestUser> {
  const user = getTestUser(role);

  await page.goto("/");

  const response = await page.evaluate(
    async ({ secret, userPayload }) => {
      const result = await fetch("/api/test/session", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-e2e-test-secret": secret,
        },
        body: JSON.stringify(userPayload),
      });

      const rawBody = await result.text();

      return {
        ok: result.ok,
        status: result.status,
        body: rawBody ? JSON.parse(rawBody) : null,
      };
    },
    {
      secret: E2E_TEST_SECRET,
      userPayload: user,
    },
  );

  expect(
    response.ok,
    JSON.stringify({
      status: response.status,
      body: response.body,
    }),
  ).toBeTruthy();

  return user;
}
