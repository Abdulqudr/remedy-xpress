import { createClient } from '@supabase/supabase-js'

declare const __SUPABASE_URL__: string
declare const __SUPABASE_ANON_KEY__: string

export const supabase = createClient(__SUPABASE_URL__, __SUPABASE_ANON_KEY__)

export type Order = {
  order_id: string
  customer_name: string
  customer_phone: string
  pickup_address: string
  delivery_address: string
  rider_id: string | null
  status: string
  progress: number
  live_updates: string[] | null
  current_location_lat: number | null
  current_location_lng: number | null
  estimated_delivery: string | null
  created_at: string
  riders?: { name: string; phone: string } | null
}

export type Rider = {
  id: string
  name: string
  phone: string
  status: string | null
}

export const ORDER_STATUSES = [
  'Order Received',
  'Rider Assigned',
  'Rider Picked Up Item',
  'Rider In Transit',
  'Rider Arriving',
  'Delivered',
] as const

export function getStatusIndex(status: string): number {
  const idx = ORDER_STATUSES.indexOf(status as typeof ORDER_STATUSES[number])
  return idx === -1 ? 0 : idx
}

export function generateOrderId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let id = 'RX-'
  for (let i = 0; i < 5; i++) id += chars[Math.floor(Math.random() * chars.length)]
  return id
}
