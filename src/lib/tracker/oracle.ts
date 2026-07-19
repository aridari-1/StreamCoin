import type { SupabaseClient } from '@supabase/supabase-js'
import { createHash, randomBytes } from 'crypto'

export interface PacketInput {
  streamerId:      string
  walletAddress:   string
  sessionId:       string
  verifiedViewers: number
  streamMinutes:   number
  streamHours:     number
  avgViewers:      number
  chatRatio:       number
  totalEarned:     number
}

export async function buildOraclePacket(
  supabase: SupabaseClient,
  input: PacketInput
): Promise<string> {
  const packetId  = '0x' + createHash('sha256')
    .update(`${input.sessionId}-${input.walletAddress}-${Date.now()}-${randomBytes(4).toString('hex')}`)
    .digest('hex').slice(0, 40)
  const timestamp = Math.floor(Date.now() / 1000)

  const payload = {
    packetId,
    timestamp,
    streamer:        input.walletAddress,
    verifiedViewers: input.verifiedViewers,
    streamMinutes:   input.streamMinutes,
    streamHours:     input.streamHours,
    avgViewers:      input.avgViewers,
    chatRatioX1000:  Math.round(input.chatRatio * 1000),
    platformSource:  0,
    hash: '0x' + createHash('sha256')
      .update(['STMC_STREAM_V3', packetId, timestamp, input.walletAddress,
        input.verifiedViewers, input.streamMinutes, input.streamHours,
        input.avgViewers, Math.round(input.chatRatio * 1000), 0].join('|'))
      .digest('hex'),
  }

  await supabase.from('oracle_packets').insert({
    packet_id:       packetId,
    packet_type:     'streamer',
    session_id:      input.sessionId,
    wallet:          input.walletAddress,
    payload,
    signatures:      [],
    status:          'pending',
    expected_reward: input.totalEarned,
  })

  await supabase.from('stream_sessions')
    .update({ oracle_packet_id: packetId, status: 'pending_reward' })
    .eq('id', input.sessionId)

  console.log(`[Oracle] Packet ${packetId} — ${input.totalEarned.toFixed(4)} STMC`)
  return packetId
}

export async function getPendingPackets(supabase: SupabaseClient) {
  const { data } = await supabase
    .from('oracle_packets').select('*').eq('status', 'pending')
    .order('created_at', { ascending: true }).limit(50)
  return data ?? []
}

export async function markPacketSubmitted(supabase: SupabaseClient, packetId: string, txHash: string) {
  await supabase.from('oracle_packets')
    .update({ status: 'submitted', tx_hash: txHash, submitted_at: new Date().toISOString() })
    .eq('packet_id', packetId)
  await supabase.from('stream_sessions')
    .update({ status: 'rewarded', tx_hash: txHash })
    .eq('oracle_packet_id', packetId)
}

export async function markPacketFailed(supabase: SupabaseClient, packetId: string, reason: string) {
  await supabase.from('oracle_packets')
    .update({ status: 'rejected', rejection_reason: reason })
    .eq('packet_id', packetId)
}
