import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function App() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Welcome to EitherWay</CardTitle>
            <CardDescription>
              Your app is ready! Start building with React, TypeScript, Tailwind CSS, and shadcn/ui.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This is a starter template with everything configured. Edit <code className="bg-muted px-1 py-0.5 rounded">src/App.tsx</code> to get started.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default App;
