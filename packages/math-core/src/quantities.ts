export type UnknownQuantity = 'total' | 'unit' | 'count';
export function quantityRelation(unitValue: number, count: number) {
  if (
    !Number.isSafeInteger(unitValue) ||
    !Number.isSafeInteger(count) ||
    unitValue <= 0 ||
    count <= 0 ||
    !Number.isSafeInteger(unitValue * count)
  )
    throw new RangeError('Quantities must be positive safe integers');
  const total = unitValue * count;
  return {
    unitValue,
    count,
    total,
    repeated: Array.from({ length: count }, (_, i) => unitValue * (i + 1)),
    equations: {
      total: `${unitValue} × ${count} = ${total}`,
      unit: `${total} ÷ ${count} = ${unitValue}`,
      count: `${total} ÷ ${unitValue} = ${count}`,
    },
  };
}
export function travelComparison(trips: { name: string; distance: number; time: number }[]) {
  return trips.map((trip) => {
    if (
      !Number.isFinite(trip.distance) ||
      trip.distance < 0 ||
      !Number.isFinite(trip.time) ||
      trip.time <= 0
    )
      throw new RangeError('Invalid trip');
    return { ...trip, speed: trip.distance / trip.time };
  });
}
export function purchaseChange(
  originalTotal: number,
  originalCount: number,
  newCount: number,
  paid: number,
) {
  if (
    ![originalTotal, originalCount, newCount, paid].every(Number.isSafeInteger) ||
    originalTotal <= 0 ||
    originalCount <= 0 ||
    originalTotal % originalCount ||
    newCount <= 0 ||
    paid < 0
  )
    throw new RangeError('Invalid purchase');
  const unitValue = originalTotal / originalCount,
    cost = unitValue * newCount;
  return { unitValue, cost, change: paid - cost };
}
