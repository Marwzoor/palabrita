
import React, { useEffect, useRef, useState } from 'react';
import type { Word } from '../types';
import { ReviewQuality } from '../types';
import Icon from './common/Icon';

const escapeRegExp = (text: string) =>
	text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const highlightSentence = (sentence: string, word: string): React.ReactNode => {
	const regex = new RegExp(`(${escapeRegExp(word)})`, 'gi');
	const parts = sentence.split(regex);

	if (parts.length === 1) {
		return sentence;
	}

	return parts.map((part, index) =>
		part.toLowerCase() === word.toLowerCase() ? (
			<strong key={index} className="font-semibold text-slate-900 dark:text-slate-100 not-italic">
				{part}
			</strong>
		) : (
			<React.Fragment key={index}>{part}</React.Fragment>
		)
	);
};

interface FlashcardProps {
	word: Word;
	onAnswer: (quality: ReviewQuality) => void;
}

const parsePixels = (value: string) => {
	const parsed = parseFloat(value);
	return Number.isNaN(parsed) ? 0 : parsed;
};

const getLineHeight = (computed: CSSStyleDeclaration, fontSize: number) => {
	const lineHeightValue = computed.lineHeight;

	if (lineHeightValue === 'normal') {
		return fontSize * 1.2;
	}

	const parsed = parseFloat(lineHeightValue);
	return Number.isNaN(parsed) ? fontSize * 1.2 : parsed;
};

const adjustElementFontSize = (element: HTMLElement, maxLines: number, minFontSize: number) => {
	const originalInlineFontSize = element.style.fontSize;

	element.style.fontSize = '';
	const baseComputed = window.getComputedStyle(element);
	let fontSize = parseFloat(baseComputed.fontSize);

	if (!Number.isFinite(fontSize)) {
		element.style.fontSize = originalInlineFontSize;
		return;
	}

	fontSize = Math.max(fontSize, minFontSize);
	element.style.fontSize = `${fontSize}px`;

	const paddingTop = parsePixels(baseComputed.paddingTop);
	const paddingBottom = parsePixels(baseComputed.paddingBottom);

	let lineHeight = getLineHeight(baseComputed, fontSize);
	let maxAllowedHeight = lineHeight * maxLines + paddingTop + paddingBottom;

	let iterations = 0;
	const maxIterations = 20;

	while (element.scrollHeight > maxAllowedHeight && fontSize > minFontSize && iterations < maxIterations) {
		fontSize -= 1;
		element.style.fontSize = `${fontSize}px`;

		const computed = window.getComputedStyle(element);
		lineHeight = getLineHeight(computed, fontSize);
		maxAllowedHeight = lineHeight * maxLines + parsePixels(computed.paddingTop) + parsePixels(computed.paddingBottom);
		iterations += 1;
	}

	if (fontSize < minFontSize) {
		element.style.fontSize = `${minFontSize}px`;
	}
};

const Flashcard: React.FC<FlashcardProps> = ({ word, onAnswer }) => {
	const [isFlipped, setIsFlipped] = useState(false);
	const [isAnswered, setIsAnswered] = useState(false);
	const swedishTextRef = useRef<HTMLHeadingElement>(null);
	const againButtonRef = useRef<HTMLButtonElement>(null);
	const hardButtonRef = useRef<HTMLButtonElement>(null);
	const goodButtonRef = useRef<HTMLButtonElement>(null);
	const easyButtonRef = useRef<HTMLButtonElement>(null);

	const handleFlip = () => {
		if (!isAnswered) {
			setIsFlipped(!isFlipped);
		}
	};

	const handleGrade = (quality: ReviewQuality) => {
		setIsAnswered(true);
		// Add a short delay to see the feedback before the next card loads
		setTimeout(() => {
			onAnswer(quality);
			setIsFlipped(false);
			setIsAnswered(false);
		}, 500);
	};

	useEffect(() => {
		if (typeof window === 'undefined') {
			return;
		}

		const elements = [
			{ element: swedishTextRef.current, minFontSize: 18, maxLines: 2 },
			{ element: againButtonRef.current, minFontSize: 12, maxLines: 2 },
			{ element: hardButtonRef.current, minFontSize: 12, maxLines: 2 },
			{ element: goodButtonRef.current, minFontSize: 12, maxLines: 2 },
			{ element: easyButtonRef.current, minFontSize: 12, maxLines: 2 },
		];

		const adjustAll = () => {
			elements
				.filter((item): item is { element: HTMLElement; minFontSize: number; maxLines: number } => Boolean(item.element))
				.forEach(({ element, minFontSize, maxLines }) => {
					element.style.fontSize = '';
					adjustElementFontSize(element, maxLines, minFontSize);
				});
		};

		adjustAll();
		window.addEventListener('resize', adjustAll);

		return () => {
			window.removeEventListener('resize', adjustAll);
		};
	}, [word]);

	return (
		<div className="w-full max-w-sm h-[430px] md:h-[460px] perspective-[1000px]">
			<div
				className={`relative w-full h-full transform-3d transition-transform duration-700 ${isFlipped ? 'rotate-y-180' : ''}`}
				onClick={handleFlip}
			>
				{/* Front of card */}
				<div className="absolute w-full h-full backface-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-lg flex flex-col justify-center items-center p-6 text-center cursor-pointer">
					<p className="text-slate-500 dark:text-slate-400 mb-4">Spanska</p>
					<h2 className="text-5xl font-bold text-slate-900 dark:text-slate-100">{word.spanish}</h2>
					<div className="absolute bottom-6 text-slate-400 dark:text-slate-500 flex items-center space-x-2">
						<Icon name="flip" />
						<span>Klicka för att vända</span>
					</div>
				</div>

				{/* Back of card */}
				<div className="absolute w-full h-full rotate-u-180 backface-hidden bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/40 rounded-2xl shadow-lg flex flex-col justify-between p-6 text-center rotate-y-180">
					<div>
						<div>
							<p className="text-indigo-500 dark:text-indigo-300 mb-2 font-semibold">Svenska</p>
							<h3 ref={swedishTextRef} className="text-4xl font-bold text-indigo-900 dark:text-indigo-200">{word.swedish}</h3>
							<div className="mt-6 space-y-4 text-slate-600 dark:text-slate-300">
								<div>
									<p className="text-xs uppercase tracking-wide text-indigo-500/80 dark:text-indigo-300/80">
										Exempel (spanska)
									</p>
									<p className="mt-1 italic text-base text-slate-700 dark:text-slate-200">
										<span aria-hidden="true">“</span>
										{highlightSentence(word.exampleSentenceSpanish, word.spanish)}
										<span aria-hidden="true">”</span>
									</p>
								</div>
								<div>
									<p className="text-xs uppercase tracking-wide text-indigo-500/80 dark:text-indigo-300/80">
										Exempel (svenska)
									</p>
									<p className="mt-1 italic text-base">“{word.exampleSentenceSwedish}”</p>
								</div>
							</div>
						</div>
						<div className="mt-6">
							<p className="text-sm text-slate-500 dark:text-slate-400 mb-8">Hur bra kan du detta ord?</p>
							<div className="grid grid-cols-2 gap-3">
								<button
									ref={againButtonRef}
									onClick={(e) => { e.stopPropagation(); handleGrade(ReviewQuality.Again); }}
									className="py-3 px-4 border border-[currentColor] bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-200 rounded-lg font-semibold hover:bg-red-200 dark:hover:bg-red-500/30 transition-colors text-sm leading-tight md:text-base"
								>
									Inte alls
								</button>
								<button
									ref={hardButtonRef}
									onClick={(e) => { e.stopPropagation(); handleGrade(ReviewQuality.Hard); }}
									className="py-3 px-4 border border-[currentColor] bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-200 rounded-lg font-semibold hover:bg-amber-200 dark:hover:bg-amber-500/30 transition-colors text-sm leading-tight md:text-base"
								>
									Svårt
								</button>
								<button
									ref={goodButtonRef}
									onClick={(e) => { e.stopPropagation(); handleGrade(ReviewQuality.Good); }}
									className="py-3 px-4 border border-[currentColor] bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-200 rounded-lg font-semibold hover:bg-sky-200 dark:hover:bg-sky-500/30 transition-colors text-sm leading-tight md:text-base"
								>
									Ganska bra
								</button>
								<button
									ref={easyButtonRef}
									onClick={(e) => { e.stopPropagation(); handleGrade(ReviewQuality.Easy); }}
									className="py-3 px-4 border border-[currentColor] bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-200 rounded-lg font-semibold hover:bg-emerald-200 dark:hover:bg-emerald-500/30 transition-colors text-sm leading-tight md:text-base"
								>
									Mycket bra
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Flashcard;
