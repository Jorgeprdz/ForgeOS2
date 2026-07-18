// src/intelligence/alpha-runtime/event-extraction-engine.js
class EventExtractionEngine {
  extract(rawText) {
    const events = [];
    const text = rawText.toLowerCase();

    const conversationPatterns = [
        "hablé", "revisa", "look at it", "call you", "dijo", "platicamos",
        "después de platicar", "vimos", "revisamos", "hablamos de", "comentamos sobre"
    ];
    
    const prospectActionPhrases = [
        "me llama", "me avisa", "me confirma", "lo revisa", "lo revisan", 
        "me busca", "me contacta", "me escribe", "me manda documentos", 
        "me comparte información", "quedó de mandarme", "mandarme",
        "i'll look at it", "i will look at it", "she will review", "he will review",
        "call you", "call me back"
    ];
    const advisorActionPhrases = [
        "quedé de enviar", "le enviaré", "voy a enviar", "le mando", 
        "le compartiré", "prepararé propuesta", "cotizaré", "agendé llamada", "enviar propuesta",
        "le paso una propuesta", "le paso opciones", "le comparto alternativas", "le envío información", "le comparto el comparativo",
        "le paso", "le comparto", "i'll send", "i will send", "i'll prepare", "i will prepare",
        "i'll call the prospect", "i will call the prospect"
    ];
    const temporalMarkers = [
        "el viernes", "mañana", "la próxima semana", "el lunes", 
        "en unos días", "después de vacaciones", "by friday", "tomorrow", "next week", "on monday"
    ];
    const weakPatterns = ["luego hablamos", "ya veremos", "lo pienso"];

    if (conversationPatterns.some(p => text.includes(p))) {
        events.push({ type: 'conversation_occurred', data: { raw: rawText } });
    }
    
    // Check for commitments
    const prospectActionFound = prospectActionPhrases.some(p => text.includes(p));
    const advisorActionFound = advisorActionPhrases.some(p => text.includes(p));
    const actionFound = prospectActionFound || advisorActionFound;
    
    const temporalFound = temporalMarkers.find(t => text.includes(t));
    const isWeak = weakPatterns.some(p => text.includes(p));

    if (actionFound || isWeak) {
        let quality, recommendation;
        if (isWeak || !actionFound) {
            quality = 'weak';
            recommendation = "Commitment is ambiguous. Consider agreeing on a specific next step.";
        } else if (temporalFound) {
            quality = 'strong';
            recommendation = "Valid commitment detected.";
        } else {
            quality = 'medium';
            recommendation = "Commitment detected without explicit timeframe.";
        }

        const owner = advisorActionFound ? 'advisor' : 'prospect';
        
        events.push({ 
            type: 'commitment_established', 
            data: { 
                owner: owner,
                due: temporalFound || null,
                quality: quality,
                recommendation: recommendation,
                description: rawText 
            } 
        });
    }

    return events;
  }
}
module.exports = EventExtractionEngine;
