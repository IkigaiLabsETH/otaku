import { ChannelType, type IAgentRuntime, type Room } from '@elizaos/core';

export function shouldBypassShouldRespond(
  runtime: IAgentRuntime,
  room?: Room,
  source?: string
): boolean {
  if (!room) return false;

  function normalizeEnvList(value: unknown): string[] {
    if (!value || typeof value !== 'string') return [];

    const cleaned = value.trim().replace(/^\[|\]$/g, '');
    return cleaned
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
  }

  const defaultBypassTypes = [
    ChannelType.DM,
    ChannelType.VOICE_DM,
    ChannelType.SELF,
    ChannelType.API,
  ];

  const defaultBypassSources = ['client_chat'];

  const bypassTypesSetting = normalizeEnvList(runtime.getSetting('SHOULD_RESPOND_BYPASS_TYPES'));
  const bypassSourcesSetting = normalizeEnvList(
    runtime.getSetting('SHOULD_RESPOND_BYPASS_SOURCES')
  );

  const bypassTypes = new Set(
    [...defaultBypassTypes.map((t) => t.toString()), ...bypassTypesSetting].map((s: string) =>
      s.trim().toLowerCase()
    )
  );

  const bypassSources = [...defaultBypassSources, ...bypassSourcesSetting].map((s: string) =>
    s.trim().toLowerCase()
  );

  const roomType = room.type?.toString().toLowerCase();
  const sourceStr = source?.toLowerCase() || '';

  return bypassTypes.has(roomType) || bypassSources.some((pattern) => sourceStr.includes(pattern));
}

