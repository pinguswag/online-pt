import { Card } from "@/components/ui/card";

interface LevelProgressProps {
    currentLevel: { level: number; title: string };
    nextLevelXp: number;
    currentXp: number;
    progress: number;
}

export function LevelProgress({ 
    currentLevel = { level: 1, title: '비기너' }, 
    nextLevelXp = 100, 
    currentXp = 0, 
    progress = 0 
}: Partial<LevelProgressProps>) {
    // Ensure numeric values are safe
    const xpRemaining = Math.max(0, (nextLevelXp || 0) - (currentXp || 0));
    const safeProgress = Math.min(100, Math.max(0, progress || 0));

    return (
        <Card style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div>
                    <span style={{ fontSize: '13px', color: 'var(--color-primary)', fontWeight: '700' }}>
                        LEVEL {currentLevel?.level || 1}
                    </span>
                    <h3 style={{ fontSize: '18px', fontWeight: '800' }}>{currentLevel?.title || '비기너'}</h3>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '14px', fontWeight: '600' }}>{currentXp || 0}</span>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}> / {nextLevelXp || 100} XP</span>
                </div>
            </div>

            {/* Progress Bar Container */}
            <div style={{ width: '100%', height: '8px', background: '#E5E8EB', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                    style={{
                        width: `${safeProgress}%`,
                        height: '100%',
                        background: 'var(--color-primary)',
                        borderRadius: '4px',
                        transition: 'width 0.5s ease-out'
                    }}
                />
            </div>
            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '8px' }}>
                다음 레벨까지 {xpRemaining} XP 남았어요!
            </p>
        </Card>
    );
}
