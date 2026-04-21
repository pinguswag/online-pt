import { useState } from "react";
import { NutritionData } from "@/lib/data";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera } from "lucide-react";

interface NutritionCardProps {
    nutrition: NutritionData;
    onChange: (nutrition: NutritionData) => void;
}

const MEAL_TYPES = [
    { id: "breakfast", label: "아침" },
    { id: "lunch", label: "점심" },
    { id: "dinner", label: "저녁" },
    { id: "snack", label: "간식" },
] as const;

type MealType = typeof MEAL_TYPES[number]["id"];

export function NutritionCard({ nutrition, onChange }: NutritionCardProps) {
    const handleMealChange = (meal: MealType, field: string, value: any) => {
        const updated = { ...nutrition };
        let mealData: any = updated[meal] || { carbs: 0, protein: 0, fat: 0, memo: "", image: "" };
        mealData = { ...mealData, [field]: value };
        updated[meal] = mealData;
        onChange(updated);
    };

    const handleImageUpload = (meal: MealType, e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                handleMealChange(meal, "image", reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const calculateMacrosAndCals = (mealData: any) => {
        const carbs = Number(mealData?.carbs || 0);
        const protein = Number(mealData?.protein || 0);
        const fat = Number(mealData?.fat || 0);
        const cals = (carbs * 4) + (protein * 4) + (fat * 9);
        const totalMacros = carbs + protein + fat;
        
        const carbPct = totalMacros ? (carbs / totalMacros) * 100 : 0;
        const proteinPct = totalMacros ? (protein / totalMacros) * 100 : 0;
        const fatPct = totalMacros ? (fat / totalMacros) * 100 : 0;

        return { cals, carbPct, proteinPct, fatPct };
    };

    return (
        <div className="space-y-6">
            {MEAL_TYPES.map(mealType => {
                const mealData = (nutrition as any)[mealType.id] || { carbs: 0, protein: 0, fat: 0, memo: "", image: "" };
                const { cals, carbPct, proteinPct, fatPct } = calculateMacrosAndCals(mealData);

                return (
                    <Card key={mealType.id} className="overflow-hidden border-muted/60 shadow-sm">
                        <CardHeader className="bg-muted/20 pb-4">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-base font-semibold flex items-center gap-2">
                                    {mealType.label} 
                                    <span className="text-xs font-normal text-muted-foreground">{cals} kcal</span>
                                </CardTitle>
                            </div>
                            
                            {/* Macro visualizer */}
                            <div className="h-1.5 flex w-full rounded-full overflow-hidden mt-3 bg-muted">
                                <div style={{ width: `${carbPct}%`}} className="bg-emerald-400 transition-all"/>
                                <div style={{ width: `${proteinPct}%`}} className="bg-blue-400 transition-all"/>
                                <div style={{ width: `${fatPct}%`}} className="bg-orange-400 transition-all"/>
                            </div>
                            <div className="flex justify-between text-[10px] text-muted-foreground mt-1.5 font-medium">
                                <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400"/> 탄수 {mealData.carbs}g</span>
                                <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-blue-400"/> 단백 {mealData.protein}g</span>
                                <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-orange-400"/> 지방 {mealData.fat}g</span>
                            </div>
                        </CardHeader>

                        <CardContent className="pt-4 space-y-4">
                            <div className="flex gap-4">
                                <div className="w-24 shrink-0">
                                    {mealData.image ? (
                                        <div className="relative w-24 h-24 rounded-lg overflow-hidden border shadow-sm">
                                            <img src={mealData.image} alt="food" className="w-full h-full object-cover" />
                                            <Button 
                                                variant="destructive" 
                                                size="icon" 
                                                className="absolute top-1 right-1 w-5 h-5 rounded-full opacity-80 hover:opacity-100"
                                                onClick={() => handleMealChange(mealType.id, "image", "")}
                                            >
                                                &times;
                                            </Button>
                                        </div>
                                    ) : (
                                        <label className="w-24 h-24 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors text-muted-foreground/60">
                                            <Camera className="w-6 h-6 mb-1 text-muted-foreground/40" />
                                            <span className="text-[10px] font-medium">사진 추가</span>
                                            <input type="file" accept="image/*" onChange={(e) => handleImageUpload(mealType.id, e)} className="hidden" />
                                        </label>
                                    )}
                                </div>
                                
                                <div className="flex-1 space-y-2">
                                    <div className="grid grid-cols-3 gap-2">
                                        <div>
                                            <label className="text-[10px] text-muted-foreground font-semibold mb-1 block">탄수화물(g)</label>
                                            <Input type="number" placeholder="0" className="h-8 text-[11px] px-2 shadow-none" value={mealData.carbs || ""} onChange={e => handleMealChange(mealType.id, "carbs", Number(e.target.value))} />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-muted-foreground font-semibold mb-1 block">단백질(g)</label>
                                            <Input type="number" placeholder="0" className="h-8 text-[11px] px-2 shadow-none" value={mealData.protein || ""} onChange={e => handleMealChange(mealType.id, "protein", Number(e.target.value))} />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-muted-foreground font-semibold mb-1 block">지방(g)</label>
                                            <Input type="number" placeholder="0" className="h-8 text-[11px] px-2 shadow-none" value={mealData.fat || ""} onChange={e => handleMealChange(mealType.id, "fat", Number(e.target.value))} />
                                        </div>
                                    </div>
                                    <div>
                                        <Input 
                                            placeholder="식단 메모 (예: 닭가슴살 샐러드)" 
                                            className="h-8 text-xs shadow-none mt-1"
                                            value={mealData.memo}
                                            onChange={e => handleMealChange(mealType.id, "memo", e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
