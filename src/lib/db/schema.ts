import {
  bigserial, bigint, boolean, integer, jsonb, pgEnum, pgTable, text, timestamp, unique,
} from 'drizzle-orm/pg-core';

export const orderStatus = pgEnum('order_status', [
  'pending', 'confirmed', 'paid', 'shipped', 'delivered', 'cancelled', 'rejected',
]);
export const payMethod = pgEnum('pay_method', ['cod', 'yape', 'transfer', 'card']);
export const claimKind = pgEnum('claim_kind', ['reclamo', 'queja']);
export const claimStatus = pgEnum('claim_status', ['recibido', 'en_revision', 'respondido', 'cerrado']);

export const customers = pgTable('customers', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  email: text('email').notNull().unique(),
  phoneE164: text('phone_e164').notNull(),
  name: text('name').notNull(),
  marketingOk: boolean('marketing_ok').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const coupons = pgTable('coupons', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  code: text('code').notNull().unique(),
  kind: text('kind').notNull(),
  value: integer('value').notNull().default(0),
  minSubtotalCents: integer('min_subtotal_cents').notNull().default(0),
  startsAt: timestamp('starts_at', { withTimezone: true }).notNull().defaultNow(),
  endsAt: timestamp('ends_at', { withTimezone: true }),
  maxUses: integer('max_uses'),
  maxUsesPerCustomer: integer('max_uses_per_customer').notNull().default(1),
  stacksWithSale: boolean('stacks_with_sale').notNull().default(false),
  uses: integer('uses').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const orders = pgTable('orders', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  number: text('number').notNull().unique(),
  customerId: bigint('customer_id', { mode: 'number' }).notNull(),
  status: orderStatus('status').notNull().default('pending'),
  channel: text('channel').notNull().default('web'),
  zone: text('zone').notNull(),
  isExpress: boolean('is_express').notNull().default(false),
  payMethod: payMethod('pay_method').notNull(),
  subtotalCents: integer('subtotal_cents').notNull(),
  discountCents: integer('discount_cents').notNull().default(0),
  shippingCents: integer('shipping_cents').notNull().default(0),
  igvCents: integer('igv_cents').notNull().default(0),
  totalCents: integer('total_cents').notNull(),
  couponId: bigint('coupon_id', { mode: 'number' }),
  idempotencyKey: text('idempotency_key').unique(),
  paymentRef: text('payment_ref'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const orderItems = pgTable('order_items', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  orderId: bigint('order_id', { mode: 'number' }).notNull(),
  productSlug: text('product_slug').notNull(),
  productName: text('product_name').notNull(),
  qty: integer('qty').notNull(),
  unitCents: integer('unit_cents').notNull(),
  lineCents: integer('line_cents').notNull(),
});

export const shippingDetails = pgTable('shipping_details', {
  orderId: bigint('order_id', { mode: 'number' }).primaryKey(),
  district: text('district'),
  address: text('address'),
  reference: text('reference'),
  city: text('city'),
  agency: text('agency'),
  dni: text('dni'),
  tracking: text('tracking'),
  windowFrom: timestamp('window_from', { withTimezone: true }),
  windowTo: timestamp('window_to', { withTimezone: true }),
});

export const inventory = pgTable('inventory', {
  productSlug: text('product_slug').primaryKey(),
  onHand: integer('on_hand').notNull().default(0),
  reserved: integer('reserved').notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const stockMoves = pgTable('stock_moves', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  productSlug: text('product_slug').notNull(),
  delta: integer('delta').notNull(),
  reason: text('reason').notNull(),
  orderId: bigint('order_id', { mode: 'number' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const subscribers = pgTable('subscribers', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  email: text('email').notNull().unique(),
  source: text('source').notNull().default('popup'),
  couponId: bigint('coupon_id', { mode: 'number' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const couponRedemptions = pgTable('coupon_redemptions', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  couponId: bigint('coupon_id', { mode: 'number' }).notNull(),
  orderId: bigint('order_id', { mode: 'number' }).notNull(),
  email: text('email').notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ oncePerPerson: unique().on(t.couponId, t.email) }));

export const claims = pgTable('claims', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  sheetNumber: text('sheet_number').notNull().unique(),
  kind: claimKind('kind').notNull(),
  status: claimStatus('status').notNull().default('recibido'),
  name: text('name').notNull(),
  docId: text('doc_id').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  address: text('address'),
  guardian: text('guardian'),
  product: text('product').notNull(),
  orderNumber: text('order_number'),
  amountCents: integer('amount_cents'),
  detail: text('detail').notNull(),
  request: text('request').notNull(),
  response: text('response'),
  respondedAt: timestamp('responded_at', { withTimezone: true }),
  dueAt: timestamp('due_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const claimEvents = pgTable('claim_events', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  claimId: bigint('claim_id', { mode: 'number' }).notNull(),
  event: text('event').notNull(),
  payload: jsonb('payload'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const emails = pgTable('emails', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  toEmail: text('to_email').notNull(),
  template: text('template').notNull(),
  ref: text('ref'),
  providerId: text('provider_id'),
  status: text('status').notNull().default('queued'),
  error: text('error'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
