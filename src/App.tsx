import { WelcomeGate } from './modules/welcome/WelcomeGate'
import { Scoreboard } from './modules/scoreboard/Scoreboard'
import { Scripttyper } from './modules/typing/Scripttyper'
import { StorePanel } from './modules/store/StorePanel'
import { BusinessPanel } from './modules/business/BusinessPanel'
import { Manufacturing } from './modules/manufacturing/Manufacturing'
import { ProgressionLog } from './modules/progression/ProgressionLog'
import { Footer } from './modules/layout/Footer'
import { useGameInit } from './state/store'

export default function App() {
  useGameInit()
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 container mx-auto p-4 space-y-4">
        <WelcomeGate />
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-4">
            <Scoreboard />
            <Scripttyper />
          </div>
          <div className="space-y-4">
            <StorePanel />
            <BusinessPanel />
            <Manufacturing />
          </div>
        </div>
        <ProgressionLog />
      </main>
      <Footer />
    </div>
  )
}
