import {
  createRevenueSnapshot,
} from './revenue-snapshot.js';

import {
  REVENUE_BUCKETS,
} from './revenue-value.js';

function bucketCounts(buckets = {}) {
  return Object.fromEntries(
    Object.values(REVENUE_BUCKETS).map((bucket) => [bucket, buckets[bucket]?.length || 0])
  );
}

function reasonList(reasonMap = {}) {
  return Object.entries(reasonMap).map(([reason, count]) => ({ reason, count }));
}

export function createRevenueViewModel(snapshotInput = {}) {
  const snapshot = snapshotInput.values && snapshotInput.buckets
    ? snapshotInput
    : createRevenueSnapshot(snapshotInput);

  return {
    visibleTotals: snapshot.visibleTotals,
    excludedBuckets: bucketCounts(snapshot.excludedBuckets),
    bucketCounts: bucketCounts(snapshot.buckets),
    warnings: [...snapshot.warnings],
    blockedReasons: reasonList(snapshot.blockedReasons),
    notModeledReasons: reasonList(snapshot.notModeledReasons),
    unknownReasons: reasonList(snapshot.unknownReasons),
    confidence: {
      generatedRevenueRequiresEvidence: true,
      paidConfirmedRequiresCommissionStatement: true,
      forecastIsNotPayoutTruth: true,
      managerScopeAppliedBeforeAggregation: true,
    },
    statusMetadata: {
      ...snapshot.statusMetadata,
      snapshotId: snapshot.snapshotId,
      createdAt: snapshot.createdAt,
    },
  };
}
