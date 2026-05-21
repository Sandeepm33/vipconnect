'use client';

export default function ChatHome() {
  return (
    <div className="h-full flex flex-col items-center justify-center bg-chat-bg">
      <div className="text-center">
        {/* Decorative icon */}
        <div className="w-32 h-32 rounded-full bg-primary-500/10 border border-primary-500/20 flex items-center justify-center mx-auto mb-6">
          <svg className="w-16 h-16 text-primary-500/60" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.37 5.07L2 22l4.93-1.37A9.96 9.96 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
          </svg>
        </div>
        <h2 className="text-2xl font-semibold text-white mb-2">VipConnect</h2>
        <p className="text-gray-400 max-w-sm mx-auto text-sm leading-relaxed">
          Select a chat to start messaging, or create a new one by clicking the compose icon in the sidebar.
        </p>
        <div className="flex items-center justify-center gap-6 mt-8 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-primary-500 rounded-full" />
            End-to-end encrypted
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full" />
            Real-time messaging
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-400 rounded-full" />
            HD video calls
          </div>
        </div>
      </div>
    </div>
  );
}
