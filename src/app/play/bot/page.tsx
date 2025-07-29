import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';

export default function BotGamePage() {
  return (
    <>
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <h1 className="text-2xl font-bold">Play vs Bot</h1>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Choose your difficulty level and start playing against our AI.
              </p>
              <div className="text-center py-8">
                <p className="text-gray-500">
                  🚧 This page is under construction. The chess game interface will be implemented here.
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
