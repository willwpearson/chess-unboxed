import { GameModeSelector } from '@/components/game/GameModeSelector';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-primary-900 mb-4">
              Chess Optim Boo
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Challenge yourself with multiple game modes: play against AI, compete with other players online, 
              or test your skills in endless mode where one mistake ends it all.
            </p>
          </div>
          
          <GameModeSelector />
        </div>
      </main>
      <Footer />
    </>
  );
}
