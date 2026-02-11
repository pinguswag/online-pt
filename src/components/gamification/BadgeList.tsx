import { Badge } from "@/lib/gamification";
import { Card } from "@/components/ui/Card";

export function BadgeList({ badges }: { badges: Badge[] }) {
    return (
        <Card>
            <h3 style={{ fontWeight: '600', marginBottom: '16px' }}>나의 뱃지</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                {badges.map(badge => (
                    <div key={badge.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', opacity: badge.obtainedResult ? 1 : 0.4 }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            background: badge.obtainedResult ? '#FEF9C3' : '#F2F4F6',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '24px',
                            border: badge.obtainedResult ? '2px solid #FDE047' : 'none'
                        }}>
                            {badge.icon}
                        </div>
                        <span style={{ fontSize: '11px', textAlign: 'center', color: '#6B7280', fontWeight: '500' }}>{badge.name}</span>
                    </div>
                ))}
            </div>
        </Card>
    );
}
