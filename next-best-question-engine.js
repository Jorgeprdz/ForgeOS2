/*
|--------------------------------------------------------------------------
| MODULE: next-best-question-engine.js
|--------------------------------------------------------------------------
|
| VERSION:
| v0.1.0
|
|--------------------------------------------------------------------------
|
| Genera preguntas humanas para completar evidencia faltante.
|
|--------------------------------------------------------------------------
*/

const QUESTIONS = {
  diagnosis: 'What diagnosis did the doctor give you?',
  eventDate: 'When did this happen?',
  country: 'Did this happen in Mexico or another country?',
  eventLocation: 'Where did this happen?',
  treatmentLocation: 'Where are you being treated?',
  hospital: 'What hospital are you being treated at?',
  admissionDate: 'When were you admitted to the hospital?',
  firstExpenseDate: 'When was the first medical expense related to this event?',
  accidentDescription: 'What exactly happened in the accident?',
  accidentRelated: 'Was this related to an accident or an illness?',
  policyStartDate: 'When did this policy start?',
  insuredAge: 'How old is the insured person?',
  pregnancyWeeks: 'How many weeks pregnant is she?',
  deliveryDate: 'What is the expected or actual delivery date?',
  medicalIndication: 'What medical reason did the doctor give for the procedure?',
  medicalReport: 'Do you have the medical report or diagnosis note?',
  medicationName: 'What medication is being requested?',
  prescription: 'Do you have the prescription or medical order?',
  surgeryDate: 'When is the surgery scheduled?',
  surgeryType: 'What surgery did the doctor recommend?',
  foreignCoverage: 'Does the policy show any foreign or international protection?',
  emergencyVsPlanned: 'Is this an emergency or planned treatment?',
  circumstances: 'What happened and what medical attention did you receive?',
  maternityContext: 'Is this pregnancy, childbirth, cesarean, or assisted reproduction?',
  eventDescription: 'What did the hospital or doctor say happened?'
};

const FORBIDDEN = [
  'What evidence is missing?',
  'More information required.',
  'Additional documentation needed.'
];

export function getNextBestQuestion({ missingEvidence = [], eventLabels = [] } = {}) {
  const labels = new Set(eventLabels);

  if (labels.has('FOREIGN_EVENT') && missingEvidence.includes('country')) {
    return QUESTIONS.country;
  }

  if ((labels.has('ACCIDENT') || labels.has('SPORTS_INJURY')) && missingEvidence.includes('accidentDescription')) {
    return QUESTIONS.accidentDescription;
  }

  const field = missingEvidence[0] || (
    labels.has('UNKNOWN_CONTEXT')
      ? 'eventDescription'
      : null
  );

  const question = QUESTIONS[field] || 'What did the doctor or hospital tell you?';

  return FORBIDDEN.includes(question)
    ? 'What did the doctor or hospital tell you?'
    : question;
}

export default getNextBestQuestion;
