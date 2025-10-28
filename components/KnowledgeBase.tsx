import React, { useState, useCallback } from 'react';
import { Flashcard } from '../types';
import { textToSpeech, getLowLatencyHint } from '../services/geminiService';
import { decodeAudioData, decode } from '../utils/audioUtils';
import { Volume2Icon } from './icons';

const flashcardsData: Flashcard[] = [
    { term: "Waiver of Premium", definition: "A rider that waives the policyowner's obligation to pay premiums if they become disabled." },
    { term: "Incontestability Clause", definition: "Prevents the insurer from contesting a claim due to misstatements on the application after a certain period (usually 2 years)." },
    { term: "Entire Contract Provision", definition: "States that the policy, a copy of the application, and any riders constitute the entire contract between the policyowner and the insurer." },
    { term: "Rebating", definition: "Offering anything of value (not specified in the policy) to a prospective client as an inducement to purchase a policy. It is an unfair trade practice." },
    { term: "Twisting", definition: "A misrepresentation used to induce a policyholder to lapse, forfeit, or surrender their policy for another, often to their detriment." },
    { term: "Modified Endowment Contract (MEC)", definition: "A life insurance policy that has been funded with more money than allowed under federal tax laws, leading to unfavorable tax treatment on distributions." },
    { term: "Grace Period", definition: "A mandatory provision allowing a policyowner a certain period (e.g., 31 days) to pay an overdue premium before the policy lapses." },
    { term: "Health Maintenance Organization (HMO)", definition: "A type of health plan that typically limits coverage to care from doctors who work for or contract with the HMO. It often requires a primary care physician (PCP) referral to see a specialist." },
    { term: "Preferred Provider Organization (PPO)", definition: "A type of health plan that contracts with medical providers to create a network. You pay less if you use providers in-network but can use out-of-network providers at a higher cost." },
    { term: "Long-Term Care (LTC) Partnership", definition: "A program between a state and private insurance companies that allows individuals who purchase qualifying LTC policies to protect some of their assets from Medicaid spend-down requirements." },
    { term: "Annuity Suitability", definition: "The requirement that a producer must have a reasonable basis to believe an annuity recommendation is suitable for the consumer based on their financial status, objectives, and needs." },
    { term: "Commissioner of Commerce", definition: "The head of the Minnesota Department of Commerce, responsible for regulating the insurance industry within the state." },
];

const regulatoryData = [
    {
        area: "Licensing and Ethics",
        points: [
            "**Age Requirement:** Must be at least 18 years old.",
            "**License Renewal:** Renews every two years by the last day of the birth month.",
            "**Continuing Education (CE):** 24 hours required per renewal period, with 3 hours in ethics.",
            "**Address Change:** Must be reported to the Commissioner within 10 days.",
        ]
    },
    {
        area: "Unfair Trade Practices",
        points: [
            "**Rebating:** Cannot offer anything of value exceeding $10 to induce a sale.",
            "**Twisting/Misrepresentation:** Providing false information to induce the lapse or surrender of an existing policy is prohibited.",
            "**Defamation:** Making false or malicious statements about an insurer's financial condition.",
        ]
    },
     {
        area: "Producer Conduct",
        points: [
            "**Commissions:** Can only be paid to licensed individuals.",
            "**Record Keeping:** Must maintain records for a minimum of 3 years.",
            "**Fiduciary Duty:** Producers have a fiduciary responsibility to act in the best interest of their clients.",
        ]
    },
];

const trainingModulesData = [
    {
        title: "Annuity Best Interest Training",
        details: [
            "**Requirement:** A one-time, 4-hour course is required *before* selling annuities.",
            "**Key Focus:** Training must cover suitability, recognizing diminished capacity in clients, and understanding the consumer's financial objectives.",
        ]
    },
    {
        title: "Long-Term Care (LTC) Training",
        details: [
            "**Initial Requirement:** An 8-hour initial training course.",
            "**Ongoing Requirement:** A 4-hour refresher course every 24 months.",
            "**Partnership Program:** Training must cover the Minnesota LTC Partnership Program and its interaction with Medical Assistance (Medicaid).",
        ]
    },
];

const KnowledgeBase: React.FC = () => {
    const [flippedCard, setFlippedCard] = useState<number | null>(null);
    const [isLoadingTTS, setIsLoadingTTS] = useState<number | null>(null);
    const [isLoadingHint, setIsLoadingHint] = useState<number | null>(null);
    const [hint, setHint] = useState<string | null>(null);

    const handleFlip = (index: number) => {
        setFlippedCard(flippedCard === index ? null : index);
        setHint(null);
    };

    const playAudio = useCallback(async (text: string, index: number) => {
        setIsLoadingTTS(index);
        try {
            const base64Audio = await textToSpeech(text);
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            const audioBuffer = await decodeAudioData(decode(base64Audio), audioContext, 24000, 1);
            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContext.destination);
            source.start();
        } catch (error) {
            console.error("Error playing audio:", error);
            alert("Failed to play audio.");
        } finally {
            setIsLoadingTTS(null);
        }
    }, []);

    const fetchHint = useCallback(async (term: string, index: number) => {
        setIsLoadingHint(index);
        try {
            const generatedHint = await getLowLatencyHint(term);
            setHint(generatedHint);
        } catch (error) {
            console.error("Error fetching hint:", error);
            setHint("Could not fetch a hint at this time.");
        } finally {
            setIsLoadingHint(null);
        }
    }, []);

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <h2 className="text-3xl font-bold mb-6 text-slate-800">Knowledge Base</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold mb-3">Life Insurance - General Knowledge</h3>
                    <ul className="list-disc pl-5 space-y-2 text-slate-600">
                        <li><strong>Types of Policies:</strong> Term, Whole, Universal, Variable Life</li>
                        <li><strong>Provisions, Riders, and Options:</strong> Waiver of Premium, Accidental Death Benefit, Guaranteed Insurability</li>
                        <li><strong>Underwriting and Policy Delivery:</strong> Insurable interest, application process, Fair Credit Reporting Act</li>
                        <li><strong>Taxation and Concepts:</strong> Tax treatment of premiums and proceeds, Modified Endowment Contracts (MECs)</li>
                    </ul>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold mb-3">Accident & Health - General Knowledge</h3>
                    <ul className="list-disc pl-5 space-y-2 text-slate-600">
                        <li><strong>Types of Policies:</strong> Disability Income, Medical Expense (HMOs, PPOs), Medicare Supplements</li>
                        <li><strong>Mandatory & Optional Provisions:</strong> Entire Contract, Grace Period, Reinstatement, Deductibles/Copayments</li>
                        <li><strong>Social Insurance:</strong> Medicare (Parts A, B, C, D), Medicaid (Medical Assistance), Social Security Benefits</li>
                        <li><strong>Group vs. Individual Health Insurance:</strong> Master policy, certificates of insurance, COBRA</li>
                    </ul>
                </div>
            </div>

            <div className="mb-10">
                <h3 className="text-2xl font-bold mb-4">Minnesota Regulatory Deep Dive</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {regulatoryData.map((section) => (
                        <div key={section.area} className="bg-white p-6 rounded-lg shadow-md">
                             <h4 className="text-lg font-semibold mb-3 text-blue-700">{section.area}</h4>
                             <ul className="space-y-2">
                                {section.points.map(point => <li key={point} className="text-slate-600 text-sm" dangerouslySetInnerHTML={{ __html: point }} />)}
                             </ul>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mb-10">
                <h3 className="text-2xl font-bold mb-4">Mandatory Product Training Modules</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {trainingModulesData.map((module) => (
                        <div key={module.title} className="bg-white p-6 rounded-lg shadow-md">
                             <h4 className="text-lg font-semibold mb-3 text-blue-700">{module.title}</h4>
                             <ul className="space-y-2">
                                {module.details.map(detail => <li key={detail} className="text-slate-600 text-sm" dangerouslySetInnerHTML={{ __html: detail }} />)}
                             </ul>
                        </div>
                    ))}
                </div>
            </div>

            <h3 className="text-2xl font-bold mt-10 mb-4">Interactive Flashcards</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {flashcardsData.map((card, index) => (
                    <div key={index} className="perspective-1000">
                        <div
                            className={`relative w-full h-56 transform-style-preserve-3d transition-transform duration-700 ${flippedCard === index ? 'rotate-y-180' : ''}`}
                            onClick={() => handleFlip(index)}
                        >
                            <div className="absolute w-full h-full backface-hidden bg-blue-500 text-white rounded-lg shadow-lg flex items-center justify-center p-4 text-center cursor-pointer">
                                <h4 className="text-xl font-bold">{card.term}</h4>
                            </div>
                            <div className="absolute w-full h-full backface-hidden bg-white text-slate-700 rounded-lg shadow-lg flex flex-col justify-between p-4 rotate-y-180">
                                <div>
                                    <p>{card.definition}</p>
                                    {flippedCard === index && hint && (
                                        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                                            <p className="text-sm text-blue-700 font-semibold">Hint:</p>
                                            <p className="text-sm text-blue-600">{hint}</p>
                                        </div>
                                    )}
                                </div>
                                <div className="flex justify-between items-center mt-2">
                                     <button
                                        onClick={(e) => { e.stopPropagation(); fetchHint(card.term, index); }}
                                        disabled={isLoadingHint === index}
                                        className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 disabled:opacity-50"
                                    >
                                        {isLoadingHint === index ? "Getting hint..." : "Get Hint"}
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); playAudio(card.definition, index); }}
                                        disabled={isLoadingTTS === index}
                                        className="p-2 rounded-full hover:bg-slate-200 disabled:opacity-50"
                                    >
                                        {isLoadingTTS === index ? (
                                            <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                            <Volume2Icon className="w-5 h-5 text-slate-600"/>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <style>{`
                .perspective-1000 { perspective: 1000px; }
                .transform-style-preserve-3d { transform-style: preserve-3d; }
                .rotate-y-180 { transform: rotateY(180deg); }
                .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
            `}</style>
        </div>
    );
};

export default KnowledgeBase;
