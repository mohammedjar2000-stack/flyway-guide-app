import { useCallback, useEffect, useState } from 'react';
import {
  isLiveApiEnabled,
  isLiveMasterOn,
  readLiveApiState,
  setLiveApiChannel,
  setLiveApiMaster,
  subscribeLiveApi,
  type LiveApiChannel,
  type LiveApiState,
} from '@/lib/liveApiGate';

export function useLiveApiGate() {
  const [state, setState] = useState<LiveApiState>(readLiveApiState);

  useEffect(() => subscribeLiveApi(setState), []);

  const setMaster = useCallback((on: boolean) => {
    setState(setLiveApiMaster(on));
  }, []);

  const setChannel = useCallback((channel: LiveApiChannel, on: boolean) => {
    setState(setLiveApiChannel(channel, on));
  }, []);

  const toggleMaster = useCallback(() => {
    setState(setLiveApiMaster(!isLiveMasterOn()));
  }, []);

  return {
    state,
    master: state.master,
    channels: state.channels,
    enabled: isLiveApiEnabled,
    setMaster,
    setChannel,
    toggleMaster,
  };
}
