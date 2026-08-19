# 计费 Webhook 运维说明

Stripe 入口会先校验请求签名和 payload，再开启数据库事务。事务内先认领提供商的事件
ID，然后执行该事件涉及的全部计费写入。因此，事件认领与业务变更只会一起提交或一起
回滚。

## 投递与重试语义

- 成功事件会在 `webhook_events` 中保留一条以 `(provider, eventId)` 唯一标识的记录。
  同一事件再次投递时会直接返回成功，不会重复执行。
- 处理失败时返回非 2xx；事件认领和计费写入都会回滚，Stripe 可以安全地重试完整事件。
- 签名或 payload 无效时返回 `400`。修复发送方或入口配置后再重放。
- 日志只包含 `provider`、`eventId`、`eventType` 和 `outcome`，不会记录或持久化原始
  payload 与签名。

事件账本只保存成功事件的元数据，并应持续保留以提供幂等性。删除记录可能导致历史
投递再次执行。

## 人工重放

需要人工重放时，请在 Stripe Dashboard 中将事件重新发送到现有 Webhook 入口，不要
手工插入或删除账本记录。已成功处理的事件会被识别为重复事件；事务曾失败的事件则可
正常重新处理。

本脚手架不额外提供第二套重试队列或重放后台。Stripe 是事件投递源，数据库事务是本地
一致性边界。

请将 Stripe Endpoint 配置为 `/api/billing/webhooks/stripe`，并订阅
`checkout.session.completed`、`checkout.session.async_payment_succeeded`、
`customer.subscription.created`、`customer.subscription.updated`、
`customer.subscription.deleted`、`customer.subscription.paused`、
`customer.subscription.resumed`、`invoice.paid`、`invoice.payment_failed`、
`charge.refunded` 和 `charge.dispute.created`。

## Endpoint API 版本

Stripe 的每个 Endpoint 会锁定在创建时的 API 版本，投递的 payload 结构也由该版本
决定。本脚手架依赖 `invoice.parent.subscription_details` 与订阅明细上的账期字段，
二者均自 `2025-04-30` 起提供。低于该版本的 Endpoint 投递的订阅与账单事件无法被解析，
会返回 `400` 并记录 `api_version_unsupported`。重新创建 Endpoint，或在 Dashboard
中升级其 API 版本即可恢复。
