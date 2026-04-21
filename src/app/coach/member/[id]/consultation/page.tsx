"use client";

import { useEffect, useState, use } from "react";
import { User } from "@/lib/auth";
import { db, MemberConsultation } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function ConsultationPage({ params }: { params: Promise<{ id: string }> }) {
    const { user } = useAuth();
    const router = useRouter();
    const [memberId, setMemberId] = useState<string>("");
    const [member, setMember] = useState<User | null>(null);
    const [consultation, setConsultation] = useState<Partial<MemberConsultation>>({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        params.then(async (p) => {
            setMemberId(p.id);
            if (user?.id) {
                const fetchedMember = await db.getUserById(p.id);
                if (fetchedMember) setMember(fetchedMember);

                const existing = await db.getConsultation(user.id, p.id);
                if (existing) {
                    setConsultation(existing);
                }
            }
            setIsLoading(false);
        });
    }, [params, user]);

    const handleChange = (field: keyof MemberConsultation, value: any) => {
        setConsultation(prev => ({ ...prev, [field]: value }));
    };

    const handleCheckboxChange = (field: 'purpose' | 'memberClassification', value: string, checked: boolean) => {
        setConsultation(prev => {
            const arr = prev[field] || [];
            if (checked) {
                return { ...prev, [field]: [...arr, value] };
            } else {
                return { ...prev, [field]: arr.filter(v => v !== value) };
            }
        });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.id || !memberId) return;

        try {
            await db.upsertConsultation({
                ...consultation,
                coachId: user.id,
                memberId: memberId,
            } as MemberConsultation);
            alert("상담 정보가 저장되었습니다.");
        } catch (error) {
            console.error(error);
            alert("저장 중 오류가 발생했습니다.");
        }
    };

    if (isLoading) return <div style={{ padding: '24px' }}>Loading...</div>;
    if (!member) return <div style={{ padding: '24px' }}>Member not found.</div>;

    const purposes = ["감량", "근비대", "퍼포먼스", "재활", "습관형성"];
    const classifications = ["일반군", "저체력군", "통증관리군"];

    return (
        <div style={{ padding: '24px', paddingBottom: '100px', maxWidth: '600px', margin: '0 auto' }}>
            <header style={{ marginBottom: '24px' }}>
                <Button size="sm" variant="ghost" onClick={() => router.back()} style={{ paddingLeft: 0, marginBottom: '8px' }}>
                    ← 뒤로가기
                </Button>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>회원 상담 정보</h1>
                <p style={{ color: 'var(--color-text-secondary)' }}>{member.name} 회원의 상담 내용을 기록하세요.</p>
            </header>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* 1. 회원 정보 입력 */}
                <Card>
                    <h3 style={{ fontWeight: 'bold', marginBottom: '16px', color: 'var(--color-primary)' }}>1. 회원 정보 입력</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
    <label className="text-sm font-medium mb-1 block">이름</label>
    <Input  value={consultation.name || ""} onChange={(e) => handleChange('name', e.target.value)} />
</div>
                        <div>
    <label className="text-sm font-medium mb-1 block">등록일</label>
    <Input type="date"  value={consultation.registrationDate || ""} onChange={(e) => handleChange('registrationDate', e.target.value)} />
</div>
                        <div>
    <label className="text-sm font-medium mb-1 block">PT 등록 횟수</label>
    <Input type="number"  value={consultation.ptCount || ""} onChange={(e) => handleChange('ptCount', parseInt(e.target.value) || 0)} />
</div>
                    </div>
                </Card>

                {/* 2. 회원 목표 설정 */}
                <Card>
                    <h3 style={{ fontWeight: 'bold', marginBottom: '16px', color: 'var(--color-primary)' }}>2. 회원 목표 설정</h3>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>목적</label>
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            {purposes.map(p => (
                                <label key={p} style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <input 
                                        type="checkbox" 
                                        checked={(consultation.purpose || []).includes(p)} 
                                        onChange={(e) => handleCheckboxChange('purpose', p, e.target.checked)} 
                                    /> {p}
                                </label>
                            ))}
                        </div>
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>정량 목표</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ width: '80px', fontSize: '14px' }}>체중 (kg):</span>
                                <Input type="number" step="0.1" value={consultation.targetWeight || ""} onChange={(e) => handleChange('targetWeight', parseFloat(e.target.value) || undefined)} />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ width: '80px', fontSize: '14px' }}>체지방률 (%):</span>
                                <Input type="number" step="0.1" value={consultation.targetBodyFat || ""} onChange={(e) => handleChange('targetBodyFat', parseFloat(e.target.value) || undefined)} />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ width: '80px', fontSize: '14px' }}>근력/기록:</span>
                                <Input value={consultation.targetStrength || ""} onChange={(e) => handleChange('targetStrength', e.target.value)} />
                            </div>
                        </div>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>정성 목표</label>
                        <textarea 
                            style={{ width: '100%', height: '80px', padding: '12px', borderRadius: '12px', border: '1px solid var(--color-border)', resize: 'none' }}
                            value={consultation.qualitativeGoal || ""} 
                            onChange={(e) => handleChange('qualitativeGoal', e.target.value)} 
                        />
                    </div>
                </Card>

                {/* 3. 회원 상태 평가 */}
                <Card>
                    <h3 style={{ fontWeight: 'bold', marginBottom: '16px', color: 'var(--color-primary)' }}>3. 회원 상태 평가</h3>
                    
                    <h4 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '8px' }}>부상 이력</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                        <div>
    <label className="text-sm font-medium mb-1 block">부위</label>
    <Input  value={consultation.injuryArea || ""} onChange={(e) => handleChange('injuryArea', e.target.value)} />
</div>
                        <div>
    <label className="text-sm font-medium mb-1 block">시기</label>
    <Input  value={consultation.injuryTime || ""} onChange={(e) => handleChange('injuryTime', e.target.value)} />
</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <label style={{ fontSize: '14px', fontWeight: '500' }}>현재 통증 여부</label>
                            <label style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <input type="radio" name="pain" checked={consultation.injuryPain === false} onChange={() => handleChange('injuryPain', false)} /> 없음
                            </label>
                            <label style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <input type="radio" name="pain" checked={consultation.injuryPain === true} onChange={() => handleChange('injuryPain', true)} /> 있음
                            </label>
                        </div>
                        {consultation.injuryPain && (
                            <div>
    <label className="text-sm font-medium mb-1 block">통증 강도 (1-10)</label>
    <Input type="number"  min={1} max={10} value={consultation.injuryPainIntensity || ""} onChange={(e) => handleChange('injuryPainIntensity', parseInt(e.target.value))} />
</div>
                        )}
                    </div>

                    <h4 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '8px' }}>운동 배경</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>웨이트 경험</label>
                            <select 
                                value={consultation.exerciseExperience || ""} 
                                onChange={(e) => handleChange('exerciseExperience', e.target.value)}
                                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--color-border)' }}
                            >
                                <option value="">선택하세요</option>
                                <option value="없음">없음</option>
                                <option value="초급">초급</option>
                                <option value="중급">중급</option>
                                <option value="고급">고급</option>
                            </select>
                        </div>
                        <div>
    <label className="text-sm font-medium mb-1 block">현재 운동 빈도 (주 회)</label>
    <Input type="number"  value={consultation.exerciseFrequency || ""} onChange={(e) => handleChange('exerciseFrequency', parseInt(e.target.value) || undefined)} />
</div>
                    </div>

                    <h4 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '8px' }}>체력 수준 (초기 테스트)</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
    <label className="text-sm font-medium mb-1 block">스쿼트 (회)</label>
    <Input type="number"  value={consultation.fitnessSquat || ""} onChange={(e) => handleChange('fitnessSquat', parseInt(e.target.value) || undefined)} />
</div>
                        <div>
    <label className="text-sm font-medium mb-1 block">푸쉬업 (회)</label>
    <Input type="number"  value={consultation.fitnessPushup || ""} onChange={(e) => handleChange('fitnessPushup', parseInt(e.target.value) || undefined)} />
</div>
                        <div>
    <label className="text-sm font-medium mb-1 block">랫풀다운 (회)</label>
    <Input type="number"  value={consultation.fitnessLatpulldown || ""} onChange={(e) => handleChange('fitnessLatpulldown', parseInt(e.target.value) || undefined)} />
</div>
                    </div>
                </Card>

                {/* 4. 회원 분류 */}
                <Card>
                    <h3 style={{ fontWeight: 'bold', marginBottom: '16px', color: 'var(--color-primary)' }}>4. 회원 분류</h3>
                    <div style={{ marginBottom: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        {classifications.map(c => (
                            <label key={c} style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <input 
                                    type="checkbox" 
                                    checked={(consultation.memberClassification || []).includes(c)} 
                                    onChange={(e) => handleCheckboxChange('memberClassification', c, e.target.checked)} 
                                /> {c}
                            </label>
                        ))}
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>분류 근거</label>
                        <textarea 
                            style={{ width: '100%', height: '60px', padding: '12px', borderRadius: '12px', border: '1px solid var(--color-border)', resize: 'none' }}
                            value={consultation.classificationReason || ""} 
                            onChange={(e) => handleChange('classificationReason', e.target.value)} 
                        />
                    </div>
                </Card>

                {/* 5. 커리큘럼 설정 */}
                <Card>
                    <h3 style={{ fontWeight: 'bold', marginBottom: '16px', color: 'var(--color-primary)' }}>5. 커리큘럼 설정</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
    <label className="text-sm font-medium mb-1 block">방향</label>
    <Input  value={consultation.curriculumDirection || ""} onChange={(e) => handleChange('curriculumDirection', e.target.value)} />
</div>
                        <div>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>난이도</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                {['하', '중', '상'].map(diff => (
                                    <label key={diff} style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <input type="radio" name="difficulty" checked={consultation.curriculumDifficulty === diff} onChange={() => handleChange('curriculumDifficulty', diff)} /> {diff}
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div>
    <label className="text-sm font-medium mb-1 block">초기 분할</label>
    <Input  value={consultation.curriculumInitialSplit || ""} onChange={(e) => handleChange('curriculumInitialSplit', e.target.value)} />
</div>
                    </div>
                </Card>

                <Button type="submit" variant="default" style={{ width: '100%', padding: '16px', fontSize: '16px' }}>
                    상담 정보 저장
                </Button>
            </form>
        </div>
    );
}
