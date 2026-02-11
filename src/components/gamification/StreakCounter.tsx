export function StreakCounter({ streak }: { streak: number }) {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: streak > 0 ? '#FEF2F2' : '#F2F4F6',
            borderRadius: '20px',
            border: streak > 0 ? '1px solid #FECACA' : '1px solid #E5E8EB'
        }}>
            <span style={{ fontSize: '20px' }}>{streak > 0 ? '🔥' : '💤'}</span>
            <span style={{ fontSize: '14px', fontWeight: '700', color: streak > 0 ? '#DC2626' : '#6B7684' }}>
                {streak > 0 ? `${streak}일 연속 운동 중!` : '스트릭을 시작해보세요!'}
            </span>
        </div>
    );
}
