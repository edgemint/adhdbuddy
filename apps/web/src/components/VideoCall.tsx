import { useVideoCall } from '../hooks/useVideoCall';

interface VideoCallProps {
  sessionId: string;
  peerId: string | null;
  onStatusChange?: (status: string) => void;
}

export function VideoCall({ sessionId, peerId, onStatusChange }: VideoCallProps) {
  const {
    state,
    connect,
    disconnect,
    toggleVideo,
    toggleAudio,
    isVideoEnabled,
    isAudioEnabled,
    localVideoRef,
    remoteVideoRef,
  } = useVideoCall({
    sessionId,
    peerId,
    autoConnect: true,
  });

  // Notify parent of status changes
  if (onStatusChange && state.status) {
    onStatusChange(state.status);
  }

  return (
    <div className="video-call">
      {/* Video grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Remote video (larger) */}
        <div className="col-span-2 md:col-span-1 aspect-video bg-gray-800 rounded-lg overflow-hidden relative">
          {state.remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              {state.status === 'connecting' ? (
                <div className="text-center">
                  <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2" />
                  <p>Connecting...</p>
                </div>
              ) : state.status === 'failed' ? (
                <div className="text-center text-red-400">
                  <p className="mb-2">Connection failed</p>
                  {state.error && <p className="text-sm">{state.error}</p>}
                  <button
                    onClick={connect}
                    className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <p>Waiting for partner...</p>
              )}
            </div>
          )}
          <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-sm text-white">
            Partner
          </div>
        </div>

        {/* Local video (smaller) */}
        <div className="col-span-2 md:col-span-1 aspect-video bg-gray-800 rounded-lg overflow-hidden relative">
          {state.localStream ? (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <p>Camera off</p>
            </div>
          )}
          <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-sm text-white">
            You
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-4">
        <button
          onClick={() => toggleVideo(!isVideoEnabled)}
          className={`p-3 rounded-full ${
            isVideoEnabled
              ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              : 'bg-red-600 text-white hover:bg-red-700'
          }`}
          title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
        >
          {isVideoEnabled ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M12 18.75H4.5a2.25 2.25 0 01-2.25-2.25V9m12.841 9.091L16.5 19.5m-1.409-1.409c.407-.407.659-.97.659-1.591v-9a2.25 2.25 0 00-2.25-2.25h-9c-.621 0-1.184.252-1.591.659m12.182 12.182L2.909 5.909M1.5 4.5l1.409 1.409" />
            </svg>
          )}
        </button>

        <button
          onClick={() => toggleAudio(!isAudioEnabled)}
          className={`p-3 rounded-full ${
            isAudioEnabled
              ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              : 'bg-red-600 text-white hover:bg-red-700'
          }`}
          title={isAudioEnabled ? 'Mute microphone' : 'Unmute microphone'}
        >
          {isAudioEnabled ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3zM3.27 3.27l17.46 17.46" />
            </svg>
          )}
        </button>

        <button
          onClick={disconnect}
          className="p-3 rounded-full bg-red-600 text-white hover:bg-red-700"
          title="End call"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 3.75L18 6m0 0l2.25 2.25M18 6l2.25-2.25M18 6l-2.25 2.25m1.5 13.5c-8.284 0-15-6.716-15-15V4.5A2.25 2.25 0 014.5 2.25h1.372c.516 0 .966.351 1.091.852l1.106 4.423c.11.44-.054.902-.417 1.173l-1.293.97a1.062 1.062 0 00-.38 1.21 12.035 12.035 0 007.143 7.143c.441.162.928-.004 1.21-.38l.97-1.293a1.125 1.125 0 011.173-.417l4.423 1.106c.5.125.852.575.852 1.091V19.5a2.25 2.25 0 01-2.25 2.25h-2.25z" />
          </svg>
        </button>
      </div>

      {/* Connection status */}
      <div className="text-center mt-4 text-sm text-gray-500">
        Status: <span className={`font-medium ${
          state.status === 'connected' ? 'text-green-600' :
          state.status === 'connecting' ? 'text-yellow-600' :
          state.status === 'failed' ? 'text-red-600' :
          'text-gray-600'
        }`}>{state.status}</span>
      </div>
    </div>
  );
}
