/*
|--------------------------------------------------------------------------
| MODULE: event-client-review-engine.js
|--------------------------------------------------------------------------
|
| VERSION:
| v0.1.0
|
|--------------------------------------------------------------------------
|
| Explica eventos GMM al cliente en lenguaje simple.
|
|--------------------------------------------------------------------------
*/

import { getNextBestQuestion } from './next-best-question-engine.js';

function plainKnown(eventLabels = []) {
  if (eventLabels.includes('FOREIGN_EVENT')) {
    return 'We know this may involve care outside Mexico.';
  }

  if (eventLabels.includes('ACCIDENT')) {
    return 'We know this started as an accident situation.';
  }

  if (eventLabels.includes('PREGNANCY') || eventLabels.includes('CHILDBIRTH')) {
    return 'We know this is related to pregnancy or childbirth.';
  }

  if (eventLabels.includes('CANCER') || eventLabels.includes('HEART_ATTACK') || eventLabels.includes('KIDNEY_FAILURE')) {
    return 'We know this is a serious medical situation.';
  }

  return 'We know there is a medical situation that needs review.';
}

export function buildEventClientReview({
  eventLabels = [],
  missingEvidence = [],
  evaluationStatus = ''
} = {}) {
  return {
    whatWeKnow: plainKnown(eventLabels),
    whatWeNeed:
      missingEvidence.length > 0
        ? `We still need: ${missingEvidence.join(', ')}.`
        : 'We have enough information for initial routing, but source documents still matter.',
    whyWeCannotAnswerYet:
      evaluationStatus === 'LIKELY_COVERED'
        ? 'This is only an early route, not a final answer from the insurer.'
        : 'A reliable answer needs medical facts and policy documents before anyone should promise an outcome.',
    nextStep: getNextBestQuestion({ missingEvidence, eventLabels })
  };
}

export default buildEventClientReview;
