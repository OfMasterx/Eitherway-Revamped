import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function PageName() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Page Title</CardTitle>
            <CardDescription>
              Page description goes here
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Page content */}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
