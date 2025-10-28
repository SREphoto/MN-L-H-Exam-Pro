
import React, { useState, useCallback } from 'react';
import { generateStudyPlan } from '../services/geminiService';

const StudyPlan: React.FC = () => {
    const [examDate, setExamDate] = useState('');
    const [weeklyHours, setWeeklyHours] = useState(10);
    const [plan, setPlan] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleGeneratePlan = useCallback(async () => {
        if (!examDate) {
            alert("Please select an exam date.");
            return;
        }
        setIsLoading(true);
        try {
            const generatedPlan = await generateStudyPlan(examDate, weeklyHours);
            setPlan(generatedPlan);
        } catch (error) {
            console.error("Error generating study plan:", error);
            setPlan("Could not generate a study plan at this time. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    }, [examDate, weeklyHours]);

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-slate-800">Mindset & Study Plan</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold mb-3 text-slate-700">Optimal Study Practices</h3>
                    <ul className="list-disc pl-5 space-y-2 text-slate-600">
                        <li><strong>Focus on Core Concepts:</strong> Don't get bogged down in exceptions until you master the fundamentals.</li>
                        <li><strong>Consistent Practice:</strong> Use the practice tests daily to identify weak areas. Aim for 85% or higher consistently.</li>
                        <li><strong>Avoid Overthinking:</strong> Read the question carefully and choose the *best* answer. Don't read into what isn't there.</li>
                        <li><strong>Address Mental Blocks:</strong> Acknowledge that exam anxiety is real. Take breaks and focus on your "why" for getting licensed.</li>
                    </ul>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                     <h3 className="text-xl font-semibold mb-3 text-blue-700">AI-Powered Study Plan Generator</h3>
                     <p className="text-sm text-slate-500 mb-4">Enter your target exam date and weekly study commitment to get a personalized plan.</p>
                     
                     <div className="space-y-4">
                         <div>
                            <label htmlFor="examDate" className="block text-sm font-medium text-slate-700">Target Exam Date</label>
                            <input
                                type="date"
                                id="examDate"
                                value={examDate}
                                onChange={(e) => setExamDate(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                         </div>
                         <div>
                            <label htmlFor="weeklyHours" className="block text-sm font-medium text-slate-700">Hours per Week: {weeklyHours}</label>
                            <input
                                type="range"
                                id="weeklyHours"
                                min="1"
                                max="40"
                                value={weeklyHours}
                                onChange={(e) => setWeeklyHours(parseInt(e.target.value, 10))}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                            />
                         </div>
                         <button
                            onClick={handleGeneratePlan}
                            disabled={isLoading}
                            className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700 transition duration-300 disabled:bg-blue-300"
                         >
                            {isLoading ? "Generating..." : "Generate Plan"}
                         </button>
                     </div>
                </div>
            </div>

            {plan && (
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-2xl font-semibold mb-4 text-slate-700">Your Custom Study Plan</h3>
                    <div className="prose prose-slate max-w-none whitespace-pre-wrap">
                        {plan}
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudyPlan;
