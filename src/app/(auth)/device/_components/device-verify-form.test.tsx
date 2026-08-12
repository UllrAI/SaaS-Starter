import { fireEvent, render, screen } from "@testing-library/react";

import { DeviceVerifyForm } from "./device-verify-form";

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("@/lib/auth/client", () => ({
  useSession: () => ({ data: null, isPending: false }),
}));

jest.mock("@/lib/i18n/translation/client", () => ({
  useTranslation: () => ({
    t: Object.assign((key: string) => key, {
      rich: (key: string) => key,
    }),
  }),
}));

describe("DeviceVerifyForm", () => {
  beforeEach(() => {
    mockPush.mockReset();
  });

  it("uses App Router navigation for the internal login callback", () => {
    render(<DeviceVerifyForm prefilledCode="abcd-efgh" />);

    fireEvent.click(
      screen.getByRole("button", { name: "device_sign_in_continue" }),
    );

    expect(mockPush).toHaveBeenCalledWith(
      "/login?callbackUrl=%2Fdevice%3Fcode%3DABCD-EFGH",
    );
  });
});
