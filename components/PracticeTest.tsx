

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { PracticeQuestion, QuizResult, TopicPerformance } from '../types';
import { getDeepDiveAnalysis } from '../services/geminiService';
import { BarChartIcon, HistoryIcon, CheckCircleIcon, XCircleIcon, CheckSquareIcon } from './icons';

const allQuestions: PracticeQuestion[] = [
    {
        question: "Under the Fair Credit Reporting Act, if a consumer challenges the accuracy of information in their report, the reporting agency must:",
        options: [
            "Respond to the consumer's complaint within 5 business days.",
            "Remove the disputed information immediately.",
            "Investigate and rectify any errors within a reasonable period.",
            "Charge a fee to investigate the dispute."
        ],
        correctAnswer: "Investigate and rectify any errors within a reasonable period.",
        rationale: "The FCRA requires consumer reporting agencies to investigate disputes and correct or delete inaccurate, incomplete, or unverifiable information, usually within 30 days.",
        topic: "General Principles"
    },
    {
        question: "In Minnesota, how many hours of Continuing Education (CE) must a producer complete every renewal period?",
        options: [
            "15 hours, with 2 in ethics",
            "24 hours, with 3 in ethics",
            "30 hours, with 4 in ethics",
            "12 hours, with 1 in ethics"
        ],
        correctAnswer: "24 hours, with 3 in ethics",
        rationale: "Minnesota law requires licensed producers to complete 24 hours of CE, including 3 hours dedicated to ethics, every two-year license renewal period.",
        topic: "Minnesota Regulations"
    },
    {
        question: "Which of the following life insurance policies allows the policyowner to flexibly change both the premium payments and the death benefit?",
        options: [
            "Whole Life",
            "Term Life",
            "Variable Life",
            "Universal Life"
        ],
        correctAnswer: "Universal Life",
        rationale: "Universal Life insurance is characterized by its flexibility. Policyowners can adjust their premium payments and death benefit amounts to suit their changing financial needs.",
        topic: "Life Insurance"
    },
    {
        question: "A Medicare Supplement (Medigap) policy is designed to:",
        options: [
            "Replace Medicare Part A and B.",
            "Provide long-term care coverage.",
            "Cover the cost of prescription drugs (Part D).",
            "Fill in the gaps in coverage from Original Medicare."
        ],
        correctAnswer: "Fill in the gaps in coverage from Original Medicare.",
        rationale: "Medigap policies are sold by private companies to help pay for some of the out-of-pocket costs that Original Medicare (Part A and Part B) doesn't cover, like deductibles, copayments, and coinsurance.",
        topic: "Accident & Health"
    },
    {
        question: "A producer in Minnesota must notify the Commissioner of Commerce of a change in their residential address within how many days?",
        options: [
            "10 days",
            "30 days",
            "60 days",
            "Immediately"
        ],
        correctAnswer: "10 days",
        rationale: "Minnesota statutes require licensed insurance producers to report a change of address to the Commissioner within 10 days of the change.",
        topic: "Minnesota Regulations"
    },
    {
        question: "Which provision prevents an insurer from denying a claim after the policy has been in force for a certain period, typically two years?",
        options: [
            "Entire Contract Clause",
            "Grace Period",
            "Incontestability Clause",
            "Reinstatement Provision"
        ],
        correctAnswer: "Incontestability Clause",
        rationale: "The Incontestability Clause states that after a policy has been in force for a set period (usually two years), the insurer cannot contest the validity of the policy or deny a claim based on misstatements in the application, except for non-payment of premiums.",
        topic: "Life Insurance"
    }
];

const availableTopics = [...new Set(allQuestions.map(q => q.topic))];

const PracticeTest: React.FC = () => {
    const [view, setView] = useState<'dashboard' | 'setup' | 'quiz' | 'results'>('dashboard');
    
    // Setup State
    const [selectedTopics, setSelectedTopics] = useState<string[]>(availableTopics);
    const [questionCount, setQuestionCount] = useState(5);
    const [isExamMode, setIsExamMode] = useState(false);

    // Quiz State
    const [customQuizQuestions, setCustomQuizQuestions] = useState<PracticeQuestion[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<string[]>([]);

    // Results State
    const [analysis, setAnalysis] = useState<{ [key: number]: string }>({});
    const [isLoadingAnalysis, setIsLoadingAnalysis] = useState<number | null>(null);
    const [showDetailedReview, setShowDetailedReview] = useState(false);
    
    // Dashboard State
    const [quizHistory, setQuizHistory] = useState<QuizResult[]>([]);

    // Load history from localStorage on mount
    useEffect(() => {
        try {
            const storedHistory = localStorage.getItem('quizHistory');
            if (storedHistory) {
                setQuizHistory(JSON.parse(storedHistory));
            }
        } catch (error) {
            console.error("Could not parse quiz history:", error);
            localStorage.removeItem('quizHistory'); // Clear corrupted data
        }
    }, []);

    const questionsForSelectedTopics = useMemo(() => {
        return allQuestions.filter(q => selectedTopics.includes(q.topic));
    }, [selectedTopics]);

    // Moved from renderDashboard to top-level to fix Rules of Hooks violation.
    const topicPerformance = useMemo(() => {
        const performance: TopicPerformance = {};
        quizHistory.forEach(result => {
            Object.entries(result.topicBreakdown).forEach(([topic, breakdownData]) => {
                if (!performance[topic]) {
                    performance[topic] = { correct: 0, total: 0 };
                }
                // FIX: Cast `breakdownData` to the expected type to resolve TypeScript error with `Object.entries`.
                const data = breakdownData as { correct: number; total: number };
                performance[topic].correct += data.correct;
                performance[topic].total += data.total;
            });
        });
        return performance;
    }, [quizHistory]);

    // Effect to manage question count slider
    useEffect(() => {
        if (view === 'setup') {
            if (questionCount > questionsForSelectedTopics.length) {
                setQuestionCount(questionsForSelectedTopics.length);
            }
            if (questionCount === 0 && questionsForSelectedTopics.length > 0) {
                setQuestionCount(Math.min(5, questionsForSelectedTopics.length));
            }
        }
    }, [questionsForSelectedTopics, questionCount, view]);

    const handleTopicChange = (topic: string) => {
        setSelectedTopics(prev =>
            prev.includes(topic)
                ? prev.filter(t => t !== topic)
                : [...prev, topic]
        );
    };

    const saveResult = useCallback((score: number, questions: PracticeQuestion[], answers: string[], wasExamMode: boolean) => {
        const topicBreakdown: TopicPerformance = {};
        questions.forEach((q, index) => {
            if (!topicBreakdown[q.topic]) {
                topicBreakdown[q.topic] = { correct: 0, total: 0 };
            }
            topicBreakdown[q.topic].total++;
            if (answers[index] === q.correctAnswer) {
                topicBreakdown[q.topic].correct++;
            }
        });

        const newResult: QuizResult = {
            date: Date.now(),
            score,
            totalQuestions: questions.length,
            percentage: questions.length > 0 ? (score / questions.length) * 100 : 0,
            topicBreakdown,
            isExamMode: wasExamMode,
        };
        
        setQuizHistory(prevHistory => {
            const updatedHistory = [...prevHistory, newResult];
            localStorage.setItem('quizHistory', JSON.stringify(updatedHistory));
            return updatedHistory;
        });
    }, []);

    const handleStartQuiz = () => {
        const shuffled = questionsForSelectedTopics.sort(() => 0.5 - Math.random());
        const quiz = shuffled.slice(0, Math.min(questionCount, questionsForSelectedTopics.length));
        setCustomQuizQuestions(quiz);
        
        setCurrentQuestionIndex(0);
        setUserAnswers([]);
        setAnalysis({});
        setIsLoadingAnalysis(null);
        setShowDetailedReview(!isExamMode);
        
        setView('quiz');
    };

    const handleAnswerSelect = (answer: string) => {
        const newAnswers = [...userAnswers];
        newAnswers[currentQuestionIndex] = answer;
        setUserAnswers(newAnswers);

        setTimeout(() => {
            if (currentQuestionIndex < customQuizQuestions.length - 1) {
                setCurrentQuestionIndex(currentQuestionIndex + 1);
            } else {
                const score = newAnswers.reduce((acc, ans, index) => (ans === customQuizQuestions[index].correctAnswer ? acc + 1 : acc), 0);
                saveResult(score, customQuizQuestions, newAnswers, isExamMode);
                setView('results');
            }
        }, 500);
    };
    
    const fetchAnalysis = useCallback(async (index: number) => {
        setIsLoadingAnalysis(index);
        const question = customQuizQuestions[index];
        const context = `
            Question: "${question.question}"
            Correct Answer: "${question.correctAnswer}"
            My Answer: "${userAnswers[index]}"
            Rationale: "${question.rationale}"
            Please provide a deep dive analysis. Explain not just why the correct answer is right, but also why the other options are likely incorrect.
        `;
        try {
            const result = await getDeepDiveAnalysis(context);
            setAnalysis(prev => ({ ...prev, [index]: result }));
        } catch (error) {
            setAnalysis(prev => ({ ...prev, [index]: "Could not fetch deep dive analysis." }));
        } finally {
            setIsLoadingAnalysis(null);
        }
    }, [userAnswers, customQuizQuestions]);
    
    // --- RENDER FUNCTIONS ---
    
    const renderDashboard = () => {
        return (
             <div>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold text-slate-800">Performance Dashboard</h2>
                     <button
                        onClick={() => setView('setup')}
                        className="bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700 transition duration-300 flex items-center space-x-2"
                    >
                        <CheckSquareIcon className="w-5 h-5" />
                        <span>Start New Quiz</span>
                    </button>
                </div>

                {quizHistory.length === 0 ? (
                    <div className="text-center bg-white p-10 rounded-lg shadow-md">
                        <p className="text-slate-500">You haven't taken any quizzes yet. Start a new quiz to track your progress!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                             <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                                <h3 className="text-xl font-semibold mb-4 flex items-center"><BarChartIcon className="w-6 h-6 mr-2 text-blue-600"/>Score History</h3>
                                <div className="h-48 flex items-end space-x-2 overflow-x-auto p-2 bg-slate-50 rounded">
                                    {quizHistory.slice(-15).map((result, i) => (
                                        <div key={result.date + '-' + i} className="flex-1 min-w-[20px] group relative">
                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                                {result.percentage.toFixed(0)}%
                                            </div>
                                            <div className="w-full bg-blue-300 hover:bg-blue-500 rounded-t-sm" style={{ height: `${result.percentage}%` }}></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow-md">
                                <h3 className="text-xl font-semibold mb-4 flex items-center"><HistoryIcon className="w-6 h-6 mr-2 text-blue-600"/>Recent Quizzes</h3>
                                <ul className="space-y-3 max-h-96 overflow-y-auto">
                                    {quizHistory.slice().reverse().map((result, i) => (
                                        <li key={result.date + '-' + i} className="flex justify-between items-center p-3 bg-slate-50 rounded-md">
                                            <div>
                                                <p className="font-semibold">{new Date(result.date).toLocaleDateString()}</p>
                                                <p className="text-sm text-slate-500">{result.score}/{result.totalQuestions} questions correct {result.isExamMode && <span className="text-xs font-bold text-red-600 ml-2">EXAM</span>}</p>
                                            </div>
                                            <p className={`font-bold text-lg ${result.percentage >= 70 ? 'text-green-600' : 'text-red-600'}`}>{result.percentage.toFixed(0)}%</p>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <h3 className="text-xl font-semibold mb-4">Topic Performance</h3>
                            <ul className="space-y-4">
                                {Object.entries(topicPerformance).map(([topic, data]) => {
                                    // FIX: Cast `data` to the expected type to resolve TypeScript error with `Object.entries`.
                                    const perfData = data as { correct: number; total: number; };
                                    const percentage = perfData.total > 0 ? (perfData.correct / perfData.total) * 100 : 0;
                                    return (
                                        <li key={topic}>
                                            <div className="flex justify-between text-sm font-medium mb-1">
                                                <span>{topic}</span>
                                                <span className={`${percentage >= 70 ? 'text-green-600' : 'text-red-600'}`}>{percentage.toFixed(0)}%</span>
                                            </div>
                                            <div className="w-full bg-slate-200 rounded-full h-2.5">
                                                <div className={`${percentage >= 70 ? 'bg-green-500' : 'bg-red-500'} h-2.5 rounded-full`} style={{ width: `${percentage}%` }}></div>
                                            </div>
                                        </li>
                                    )
                                })}
                            </ul>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    const renderSetup = () => (
         <div className="max-w-2xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-slate-800">Practice Test QBank</h2>
                <button onClick={() => setView('dashboard')} className="text-sm text-blue-600 hover:underline font-semibold">
                    &larr; Back to Dashboard
                </button>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-xl space-y-6">
                <div>
                    <h3 className="text-lg font-semibold mb-3">1. Select Topics</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {availableTopics.map(topic => (
                            <label key={topic} className="flex items-center space-x-3 cursor-pointer p-2 rounded-md hover:bg-slate-50">
                                <input type="checkbox" checked={selectedTopics.includes(topic)} onChange={() => handleTopicChange(topic)} className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                <span className="text-slate-700">{topic}</span>
                            </label>
                        ))}
                    </div>
                </div>
                <div>
                    <label htmlFor="questionCount" className="block text-lg font-semibold mb-3">2. Number of Questions: <span className="font-bold text-blue-600">{questionCount}</span></label>
                    <input type="range" id="questionCount" min="1" max={questionsForSelectedTopics.length || 1} value={questionCount} onChange={(e) => setQuestionCount(parseInt(e.target.value, 10))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" disabled={questionsForSelectedTopics.length === 0} />
                </div>
                <div>
                    <h3 className="text-lg font-semibold mb-3">3. Choose Mode</h3>
                    <label className="flex items-center justify-between p-3 bg-slate-50 rounded-lg cursor-pointer">
                        <div>
                            <span className={`font-semibold ${isExamMode ? 'text-red-700' : 'text-slate-800'}`}>Exam Mode</span>
                            <p className="text-sm text-slate-500">Simulates real exam. Results are shown only at the end.</p>
                        </div>
                        <div className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={isExamMode} onChange={(e) => setIsExamMode(e.target.checked)} className="sr-only peer" />
                            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                        </div>
                    </label>
                </div>
                <button onClick={handleStartQuiz} disabled={selectedTopics.length === 0 || questionsForSelectedTopics.length === 0 || questionCount === 0} className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-md hover:bg-blue-700 transition duration-300 disabled:bg-slate-400 disabled:cursor-not-allowed">
                    Start {isExamMode ? "Exam" : "Practice"}
                </button>
            </div>
        </div>
    );

    const renderQuiz = () => {
        const currentQuestion = customQuizQuestions[currentQuestionIndex];
        return (
            <div className="max-w-2xl mx-auto">
                <div className="flex justify-between items-baseline">
                    <h2 className="text-3xl font-bold mb-2">Practice Test</h2>
                    {isExamMode && <span className="text-sm font-bold text-red-600 bg-red-100 px-2 py-1 rounded">EXAM MODE</span>}
                </div>
                <p className="text-slate-500 mb-6">Question {currentQuestionIndex + 1} of {customQuizQuestions.length}</p>
                <div className="bg-white p-8 rounded-lg shadow-xl">
                    <p className="text-xl font-medium mb-6">{currentQuestion.question}</p>
                    <div className="space-y-4">
                        {currentQuestion.options.map(option => (
                            <button key={option} onClick={() => handleAnswerSelect(option)} className={`w-full text-left p-4 rounded-lg border-2 transition-colors duration-300 ${userAnswers[currentQuestionIndex] === option ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white border-slate-300 hover:bg-slate-100'}`}>
                                {option}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }
    
    const renderResults = () => {
        const lastResult = quizHistory[quizHistory.length - 1];
        if (!lastResult) return <p>Loading results...</p>;
        const { score, totalQuestions, percentage } = lastResult;

        return (
            <div className="max-w-4xl mx-auto">
                <h2 className="text-3xl font-bold mb-4 text-center">Test Results</h2>
                <div className={`text-center p-6 rounded-lg shadow-md mb-8 ${percentage >= 70 ? 'bg-green-100' : 'bg-red-100'}`}>
                    <p className="text-xl font-semibold">You Scored</p>
                    <p className={`text-5xl font-bold my-2 ${percentage >= 70 ? 'text-green-700' : 'text-red-700'}`}>{percentage.toFixed(0)}%</p>
                    <p className="text-lg">{score} out of {totalQuestions} correct</p>
                </div>
                
                {showDetailedReview ? (
                     <div>
                        <div className="text-center mb-8 space-x-4">
                            <button onClick={() => setView('setup')} className="bg-blue-600 text-white font-bold py-2 px-6 rounded-md hover:bg-blue-700 transition duration-300">New Quiz</button>
                            <button onClick={() => setView('dashboard')} className="bg-slate-600 text-white font-bold py-2 px-6 rounded-md hover:bg-slate-700 transition duration-300">Dashboard</button>
                        </div>
                        <h3 className="text-2xl font-bold mb-4">Answer Review</h3>
                        <div className="space-y-4">
                            {customQuizQuestions.map((q, index) => {
                                const userAnswer = userAnswers[index];
                                const isCorrect = userAnswer === q.correctAnswer;
                                return (
                                <div key={index} className="bg-white p-6 rounded-lg shadow-md">
                                    <div className="flex items-start">
                                        {isCorrect ? <CheckCircleIcon className="w-5 h-5 text-green-500 mr-3 mt-1 flex-shrink-0"/> : <XCircleIcon className="w-5 h-5 text-red-500 mr-3 mt-1 flex-shrink-0"/>}
                                        <p className="font-semibold text-lg">{q.question}</p>
                                    </div>
                                    <div className="pl-8 mt-2 space-y-1 text-sm">
                                        <p className={isCorrect ? 'text-green-700' : 'text-red-700'}>Your answer: {userAnswer || "Not answered"}</p>
                                        {!isCorrect && <p className="text-blue-700">Correct answer: {q.correctAnswer}</p>}
                                    </div>
                                    <p className="text-sm mt-3 bg-slate-50 p-3 rounded-md ml-8"><strong>Rationale:</strong> {q.rationale}</p>
                                    
                                    {analysis[index] && (
                                        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md ml-8">
                                            <h4 className="text-md font-bold text-blue-800 mb-2">Deep Dive Analysis</h4>
                                            <p className="text-sm text-slate-700 whitespace-pre-wrap">{analysis[index]}</p>
                                        </div>
                                    )}

                                    <button onClick={() => fetchAnalysis(index)} disabled={isLoadingAnalysis === index} className="mt-4 ml-8 text-sm bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600 transition disabled:opacity-50">
                                        {isLoadingAnalysis === index ? "Analyzing..." : "Deep Dive Analysis"}
                                    </button>
                                </div>
                            )})}
                        </div>
                    </div>
                ) : (
                    <div className="text-center">
                        <button onClick={() => setShowDetailedReview(true)} className="bg-blue-600 text-white font-bold py-3 px-8 rounded-md hover:bg-blue-700 transition duration-300">
                            Review Answers
                        </button>
                    </div>
                )}
            </div>
        );
    }

    return (
         <div className="p-4 sm:p-6 lg:p-8">
            {view === 'dashboard' && renderDashboard()}
            {view === 'setup' && renderSetup()}
            {view === 'quiz' && renderQuiz()}
            {view === 'results' && renderResults()}
        </div>
    )
};

export default PracticeTest;