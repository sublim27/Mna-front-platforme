import { Shield, ShieldCheck, Users } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/card';

export function UserStats({
  totalUsers,
  totalAdmins,
  totalRegularUsers,
}: {
  totalUsers: number;
  totalAdmins: number;
  totalRegularUsers: number;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {[
        { label: 'Total Users', value: totalUsers, color: '#1AABBA', icon: Users },
        { label: 'Admins', value: totalAdmins, color: '#2563EB', icon: ShieldCheck },
        { label: 'Regular Users', value: totalRegularUsers, color: '#10B981', icon: Shield },
      ].map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label}>
            <CardContent className="pt-5">
              <div className="flex items-center gap-4">
                <div
                  className="flex items-center justify-center rounded-xl w-12 h-12 shrink-0"
                  style={{ backgroundColor: `${stat.color}18`, border: `1px solid ${stat.color}35` }}
                >
                  <Icon size={20} style={{ color: stat.color }} />
                </div>
                <div>
                  <p style={{ color: stat.color, fontSize: 28, fontWeight: 800, margin: 0, lineHeight: 1 }}>
                    {stat.value}
                  </p>
                  <p style={{ color: '#94A3B8', fontSize: 12, margin: 0 }}>{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
