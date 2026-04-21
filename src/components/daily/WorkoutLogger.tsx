import { useState } from "react";
import { Workout, WorkoutSet } from "@/lib/data";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2 } from "lucide-react";

interface WorkoutLoggerProps {
    workouts: Workout[];
    onChange: (workouts: Workout[]) => void;
}

export function WorkoutLogger({ workouts, onChange }: WorkoutLoggerProps) {
    const handleAddWorkout = () => {
        onChange([...workouts, { name: "", sets: [{ weight: 0, reps: 0, isCompleted: false }] }]);
    };

    const handleWorkoutNameChange = (index: number, name: string) => {
        const updated = [...workouts];
        updated[index].name = name;
        onChange(updated);
    };

    const handleRemoveWorkout = (index: number) => {
        const updated = workouts.filter((_, i) => i !== index);
        onChange(updated);
    };

    const handleAddSet = (workoutIndex: number) => {
        const updated = [...workouts];
        updated[workoutIndex].sets.push({ weight: 0, reps: 0, isCompleted: false });
        onChange(updated);
    };

    const handleSetChange = (workoutIndex: number, setIndex: number, field: keyof WorkoutSet, value: number | boolean) => {
        const updated = [...workouts];
        updated[workoutIndex].sets[setIndex] = {
            ...updated[workoutIndex].sets[setIndex],
            [field]: value
        };
        onChange(updated);
    };

    const handleRemoveSet = (workoutIndex: number, setIndex: number) => {
        const updated = [...workouts];
        updated[workoutIndex].sets = updated[workoutIndex].sets.filter((_, i) => i !== setIndex);
        onChange(updated);
    };

    return (
        <div className="space-y-4">
            {workouts.map((workout, wIdx) => (
                <Card key={wIdx}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <Input 
                            value={workout.name} 
                            onChange={(e) => handleWorkoutNameChange(wIdx, e.target.value)} 
                            placeholder="운동 종목 (예: 스쿼트)" 
                            className="w-[60%] font-semibold text-lg border-none bg-muted/40 focus-visible:ring-1"
                        />
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveWorkout(wIdx)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {workout.sets.map((set, sIdx) => (
                                <div key={sIdx} className="flex items-center gap-2 text-sm">
                                    <span className="w-8 text-center text-muted-foreground">{sIdx + 1}세트</span>
                                    <Input
                                        type="number"
                                        value={set.weight || ""}
                                        onChange={(e) => handleSetChange(wIdx, sIdx, "weight", Number(e.target.value))}
                                        placeholder="kg"
                                        className="w-16 h-8 text-center"
                                    />
                                    <span className="text-muted-foreground">kg</span>
                                    <Input
                                        type="number"
                                        value={set.reps || ""}
                                        onChange={(e) => handleSetChange(wIdx, sIdx, "reps", Number(e.target.value))}
                                        placeholder="회"
                                        className="w-16 h-8 text-center"
                                    />
                                    <span className="text-muted-foreground">회</span>
                                    <div className="flex-1" />
                                    <Checkbox
                                        checked={set.isCompleted}
                                        onCheckedChange={(c) => handleSetChange(wIdx, sIdx, "isCompleted", Boolean(c))}
                                        className="w-5 h-5 rounded"
                                    />
                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveSet(wIdx, sIdx)} className="h-8 w-8 ml-1">
                                        <Trash2 className="w-3 h-3 text-muted-foreground" />
                                    </Button>
                                </div>
                            ))}
                            <Button variant="outline" size="sm" onClick={() => handleAddSet(wIdx)} className="w-full mt-2 text-xs h-8 text-muted-foreground">
                                <Plus className="w-3 h-3 mr-1" /> 세트 추가
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}
            <Button onClick={handleAddWorkout} variant="secondary" className="w-full h-12 shadow-sm rounded-xl">
                <Plus className="w-5 h-5 mr-2" /> 새 운동 추가
            </Button>
        </div>
    );
}
