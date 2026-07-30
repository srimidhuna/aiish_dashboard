import { useTheme } from '../../components/ThemeProvider';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Moon, Sun, Monitor, Bell, Accessibility, Globe } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in zoom-in duration-300">
      <h1 className="text-3xl font-bold tracking-tight">Settings</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              <CardTitle>Appearance</CardTitle>
            </div>
            <CardDescription>Customize the look and feel of the application.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <Button
                variant={theme === 'light' ? 'default' : 'outline'}
                onClick={() => setTheme('light')}
              >
                <Sun className="mr-2 h-4 w-4" /> Light
              </Button>
              <Button
                variant={theme === 'dark' ? 'default' : 'outline'}
                onClick={() => setTheme('dark')}
              >
                <Moon className="mr-2 h-4 w-4" /> Dark
              </Button>
              <Button
                variant={theme === 'system' ? 'default' : 'outline'}
                onClick={() => setTheme('system')}
              >
                <Monitor className="mr-2 h-4 w-4" /> System
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <CardTitle>Notifications</CardTitle>
            </div>
            <CardDescription>Manage how you receive alerts and reports.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Email Alerts</span>
                <Button variant="outline" onClick={() => toast.info('Demo: Preference saved.')}>
                  Configure
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Daily Summary</span>
                <Button variant="outline" onClick={() => toast.info('Demo: Preference saved.')}>
                  Configure
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              <CardTitle>Language & Region</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm focus-visible:ring-1 focus-visible:ring-ring"
              onChange={() => toast.info('Demo: Language set.')}
            >
              <option>English (US)</option>
              <option>Kannada</option>
              <option>Hindi</option>
            </select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Accessibility className="h-5 w-5" />
              <CardTitle>Accessibility</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">High Contrast Mode</span>
              <Button variant="outline" onClick={() => toast.info('Demo: Toggle High Contrast.')}>
                Enable
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
