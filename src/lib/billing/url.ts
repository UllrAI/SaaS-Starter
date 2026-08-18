const BILLING_REDIRECT_HOSTS: readonly string[] = [
  "billing.stripe.com",
  "checkout.stripe.com",
];

const isTrustedBillingHost = (hostname: string): boolean => {
  const normalizedHostname = hostname.toLowerCase();
  return BILLING_REDIRECT_HOSTS.includes(normalizedHostname);
};

export const assertTrustedBillingUrl = (url: string, label: string): string => {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error(`Invalid ${label}.`);
  }

  if (
    parsedUrl.protocol !== "https:" ||
    !isTrustedBillingHost(parsedUrl.hostname)
  ) {
    throw new Error(`Invalid ${label}.`);
  }

  return parsedUrl.toString();
};

export const getSafeBillingRedirectUrl = (
  url: unknown,
  currentLocation?: { protocol: string; hostname: string },
): string | null => {
  if (typeof url !== "string" || url.length === 0) return null;

  try {
    const parsedUrl = new URL(url);

    if (
      currentLocation &&
      parsedUrl.hostname === currentLocation.hostname &&
      parsedUrl.protocol === currentLocation.protocol
    ) {
      return parsedUrl.toString();
    }

    if (parsedUrl.protocol !== "https:") return null;
    return isTrustedBillingHost(parsedUrl.hostname)
      ? parsedUrl.toString()
      : null;
  } catch {
    return null;
  }
};
