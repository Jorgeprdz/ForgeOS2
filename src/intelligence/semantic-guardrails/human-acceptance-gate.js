// src/intelligence/semantic-guardrails/human-acceptance-gate.js
// Human Acceptance Gate for Semantic Event Candidates v0.1

const { validateCandidate } = require('./semantic-candidate-guardrail');

class HumanAcceptanceGate {
    propose(candidate, actor) {
        if (!actor) throw new Error('Actor is required for proposal');
        
        const validation = validateCandidate(candidate);
        if (!validation.valid) {
            throw new Error(`Invalid candidate: ${validation.reasons.join(', ')}`);
        }

        const candidateRecord = {
            candidate: validation.sanitizedCandidate,
            status: 'proposed',
            transitions: [{
                previous_status: null,
                new_status: 'proposed',
                actor,
                timestamp: new Date().toISOString(),
                reason: 'Initial proposal'
            }]
        };
        return candidateRecord;
    }

    _transition(record, newStatus, actor, reason) {
        if (!actor) throw new Error('Actor is required');
        if (!reason && (newStatus === 'rejected' || newStatus === 'expired')) {
            throw new Error('Reason is required for rejection/expiration');
        }
        if (record.status !== 'proposed') {
            throw new Error(`Cannot transition from ${record.status}`);
        }

        record.transitions.push({
            previous_status: record.status,
            new_status: newStatus,
            actor,
            timestamp: new Date().toISOString(),
            reason
        });
        record.status = newStatus;
        return record;
    }

    accept(record, actor, reason = 'Accepted by human') {
        return this._transition(record, 'accepted', actor, reason);
    }

    reject(record, actor, reason) {
        return this._transition(record, 'rejected', actor, reason);
    }

    expire(record, actor, reason) {
        return this._transition(record, 'expired', actor, reason);
    }

    getStatus(record) {
        return {
            ...record,
            canEnterLedger: record.status === 'accepted'
        };
    }
}

module.exports = new HumanAcceptanceGate();
