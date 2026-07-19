import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="max-w-2xl w-full text-center">
        <div className="w-20 h-20 rounded-full bg-[#7F77DD] flex items-center justify-center text-4xl mb-8 mx-auto">
          ▶
        </div>
        <h1 className="text-5xl font-bold mb-4 text-white">StreamCoin</h1>
        <p className="text-xl text-gray-400 mb-2">Mine STMC while you stream.</p>
        <p className="text-gray-500 mb-10 text-sm max-w-md mx-auto">
          Connect your Twitch or YouTube account, verify your wallet,
          and start earning STMC every minute you go live.
        </p>
        <div className="flex gap-4 justify-center flex-wrap mb-16">
          <Link href="/auth/connect"
            className="px-8 py-3 bg-[#7F77DD] hover:bg-[#6b63c7] text-white font-semibold rounded-lg transition-colors">
            Connect & Start Mining
          </Link>
          <Link href="/dashboard"
            className="px-8 py-3 bg-[#161b22] hover:bg-[#1c2128] border border-[#30363d] text-gray-300 font-semibold rounded-lg transition-colors">
            View Dashboard
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-6 border border-[#30363d] rounded-xl p-6 bg-[#161b22]">
          <div><div className="text-2xl font-bold text-white">10 STMC</div><div className="text-xs text-gray-500 mt-1">max per stream hour</div></div>
          <div><div className="text-2xl font-bold text-white">15 STMC</div><div className="text-xs text-gray-500 mt-1">max viewer daily</div></div>
          <div><div className="text-2xl font-bold text-white">400M</div><div className="text-xs text-gray-500 mt-1">STMC pool</div></div>
        </div>
      </div>
    </main>
  )
}
