import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';

export default function LeaderboardPage() {
  return (
    <>
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <h1 className="text-2xl font-bold">Leaderboard</h1>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                See how you rank against other players in different game modes.
              </p>
              <div className="text-center py-8">
                <p className="text-gray-500">
                  🚧 This page is under construction. Player rankings will be displayed here.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </>
  );
}
