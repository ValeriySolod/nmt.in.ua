export type FunnelPerson = {
  source: string | null;
  emailVerified: boolean;
  daysCompleted: boolean[];
  finished: boolean;
  converted: boolean;
};

export type FunnelCounts = {
  registered: number;
  emailVerified: number;
  days: number[];
  final: number;
  converted: number;
};

export type FunnelReport = {
  totals: FunnelCounts;
  bySource: Array<{ source: string; counts: FunnelCounts }>;
};

function emptyCounts(daysCount: number): FunnelCounts {
  return {
    registered: 0,
    emailVerified: 0,
    days: Array.from({ length: daysCount }, () => 0),
    final: 0,
    converted: 0,
  };
}

function addPerson(counts: FunnelCounts, person: FunnelPerson): void {
  counts.registered += 1;
  if (person.emailVerified) counts.emailVerified += 1;
  person.daysCompleted.forEach((done, index) => {
    if (done && counts.days[index] !== undefined) counts.days[index] += 1;
  });
  if (person.finished) counts.final += 1;
  if (person.converted) counts.converted += 1;
}

export function funnelSourceKey(source: string | null): string {
  const value = source?.trim();
  return value ? value : "(none)";
}

export function aggregateFunnel(
  people: FunnelPerson[],
  daysCount: number,
): FunnelReport {
  const totals = emptyCounts(daysCount);
  const grouped = new Map<string, FunnelCounts>();
  for (const person of people) {
    addPerson(totals, person);
    const key = funnelSourceKey(person.source);
    const bucket = grouped.get(key) ?? emptyCounts(daysCount);
    addPerson(bucket, person);
    grouped.set(key, bucket);
  }
  const bySource = [...grouped.entries()]
    .map(([source, counts]) => ({ source, counts }))
    .sort((a, b) => b.counts.registered - a.counts.registered || a.source.localeCompare(b.source));
  return { totals, bySource };
}
