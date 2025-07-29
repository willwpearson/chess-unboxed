import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';

export default function SettingsPage() {
  return (
    <>
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <h1 className="text-2xl font-bold">Settings</h1>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Customize your game preferences and user settings.
              </p>
              <div className="text-center py-8">
                <p className="text-gray-500">
                  🚧 This page is under construction. User preferences will be configurable here.
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
