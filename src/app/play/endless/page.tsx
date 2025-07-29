import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';

export default function EndlessGamePage() {
  return (
    <>
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <h1 className="text-2xl font-bold">Endless Mode</h1>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Challenge yourself in endless mode where one mistake ends your run!
              </p>
              <div className="text-center py-8">
                <p className="text-gray-500">
                  🚧 This page is under construction. The endless game mode will be implemented here.
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
