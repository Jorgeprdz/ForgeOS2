/*
|--------------------------------------------------------------------------
| MODULE: event-advisor-review-engine.js
|--------------------------------------------------------------------------
|
| VERSION:
| v0.1.0
|
|--------------------------------------------------------------------------
|
| Genera guia de asesor para eventos GMM sin prometer cobertura.
|
|--------------------------------------------------------------------------
*/

import { getNextBestQuestion } from './next-best-question-engine.js';

export function buildEventAdvisorReview({
  event = '',
  eventLabels = [],
  missingEvidence = [],
  evaluationStatus = ''
} = {}) {
  const labels = eventLabels.join(', ') || 'UNKNOWN';

  return {
    advisorSummary: `This situation should be handled as ${labels}. Current route: ${evaluationStatus || 'not evaluated yet'}.`,
    whatToAskNext: getNextBestQuestion({ missingEvidence, eventLabels }),
    whatNotToPromise: [
      'Do not promise coverage.',
      'Do not say the insurer will pay.',
      'Do not treat the quote as the issued policy.',
      'Do not ignore missing medical or policy evidence.'
    ],
    evidenceToRequest: missingEvidence.length > 0
      ? missingEvidence
      : ['policy caratula', 'medical report', 'event date evidence'],
    expectationRisk:
      eventLabels.includes('FOREIGN_EVENT')
        ? 'Client may assume national coverage works the same abroad.'
        : eventLabels.includes('ACCIDENT')
          ? 'Client may assume every accident automatically activates benefits.'
          : eventLabels.includes('PREGNANCY') || eventLabels.includes('CHILDBIRTH')
            ? 'Client may assume maternity timing is automatically enough.'
            : 'Client may expect a simple answer before evidence is complete.',
    event
  };
}

export default buildEventAdvisorReview;
