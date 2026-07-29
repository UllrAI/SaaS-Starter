import "server-only";

import type { SupportedLocale } from "@/lib/config/i18n";

export type AppMessages = Record<string, string>;

export const MARKETING_CLIENT_MESSAGE_KEYS = [
  "common_toggle_theme",
  "common_system",
  "billing_failed_check_payment_status",
  "common_back_home",
  "billing_core_starter_package_solo_builders_shipping",
  "billing_monthly",
  "billing_marketing_pages_blog_foundation",
  "billing_recommended",
  "common_page_not_found",
  "billing_please_wait_while_we_confirm_payment",
  "billing_checkout_link_was_blocked_because_it",
  "billing_initializing_secure_checkout_sequence",
  "billing_login_buy",
  "common_language",
  "billing_we_received_checkout_return_but_reference",
  "billing_unexpected_error_occurred",
  "common_go_dashboard",
  "billing_processing",
  "billing_please_log_in_continue_purchase",
  "billing_localization_setup",
  "billing_unable_start_checkout_current_selection",
  "billing_checking_payment_status",
  "billing_save_17",
  "common_close",
  "billing_failed_create_checkout_session_please_try",
  "billing_one_time",
  "billing_yearly",
  "billing_implementation_guidance",
  "common_need_help_contact_support_team",
  "billing_full_featured_starter_package_teams_shipping",
  "billing_verifying_payment",
  "common_dark",
  "common_light",
  "billing_get_tier",
  "common_page_youre_looking_doesnt_exist_has",
  "billing_authentication_protected_dashboard",
  "billing_billed_annually",
  "billing_billed_monthly",
  "billing_everything_in_professional_plus_rollout_support",
  "common_select_language",
  "billing_one_time_purchase_no_automatic_renewal",
  "billing_cloudflare_r2_upload_workflows",
  "billing_subscription_already_active",
  "billing_admin_operations_screens",
  "billing_creem_checkout_billing_portal_flow",
  "billing_subscription",
  "common_error_404",
  "payment_status_access_dashboard",
  "payment_status_cancelled_badge",
  "payment_status_cancelled_description",
  "payment_status_cancelled_title",
  "payment_status_check_billing",
  "payment_status_completed_badge",
  "payment_status_contact_support",
  "payment_status_failed_badge",
  "payment_status_failed_description",
  "payment_status_failed_title",
  "payment_status_go_dashboard",
  "payment_status_lifetime_success_description",
  "payment_status_manage_billing",
  "payment_status_processing_badge",
  "payment_status_processing_description",
  "payment_status_processing_title",
  "payment_status_subscription_success_description",
  "payment_status_success_title",
  "payment_status_timeout",
  "payment_status_try_again",
  "payment_status_view_plans",
  "pricing_per_month",
] as const;

const messageLoaders: Record<
  SupportedLocale,
  () => Promise<{ default: AppMessages }>
> = {
  en: () => import("@/messages/en.json"),
  "zh-Hans": () => import("@/messages/zh-Hans.json"),
};

export async function loadMessages(
  locale: SupportedLocale,
): Promise<AppMessages> {
  return (await messageLoaders[locale]()).default;
}

export async function loadMarketingMessages(
  locale: SupportedLocale,
): Promise<AppMessages> {
  const messages = await loadMessages(locale);

  return Object.fromEntries(
    MARKETING_CLIENT_MESSAGE_KEYS.map((key) => {
      const message = messages[key];
      if (message === undefined) {
        throw new Error(
          `Missing marketing client message "${key}" for ${locale}`,
        );
      }
      return [key, message];
    }),
  );
}
