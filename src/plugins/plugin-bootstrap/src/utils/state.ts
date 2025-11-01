import type { State } from '@elizaos/core';

export function mergeState(base: State, updates: State): State {
  return {
    ...base,
    ...updates,
    data: {
      ...(base.data ?? {}),
      ...(updates.data ?? {}),
    },
    values: {
      ...(base.values ?? {}),
      ...(updates.values ?? {}),
    },
  };
}

export function isJobMessage(metadata: unknown): metadata is { isJobMessage: boolean } {
  return (
    typeof metadata === 'object' &&
    metadata !== null &&
    'isJobMessage' in metadata &&
    typeof (metadata as { isJobMessage: unknown }).isJobMessage === 'boolean'
  );
}

