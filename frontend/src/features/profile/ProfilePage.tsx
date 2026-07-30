import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { user } = useAuth();

  const handleNoOp = () => toast.info('This action is disabled in the demo.');

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
      <h1 className="text-3xl font-bold tracking-tight">User Profile</h1>
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <span className="text-sm text-muted-foreground block">Name</span>
            <div className="font-medium">{user?.name}</div>
          </div>
          <div>
            <span className="text-sm text-muted-foreground block">Email</span>
            <div className="font-medium">{user?.email}</div>
          </div>
          <div>
            <span className="text-sm text-muted-foreground block">Role</span>
            <div className="font-medium">{user?.role}</div>
          </div>
          <div className="pt-4 space-x-2">
            <Button onClick={handleNoOp}>Edit Profile</Button>
            <Button variant="outline" onClick={handleNoOp}>
              Change Password
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
