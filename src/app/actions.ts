
'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { subDays, startOfDay, endOfDay, isAfter, isBefore } from 'date-fns';
import { unstable_noStore as noStore } from 'next/cache';

export type Policy = {
  Policy_ID: number;
  Policy_Name: string;
  Policy_Description: string;
};

export type SOP = {
  Policy_ID: number;
  Policy_Name: string;
  SOP: string;
};

export type Alert = {
  Title: string;
  policy_name: string;
  classification: string;
  classification_reason: string;
  duplicate_count: number;
  risk_score: number;
  user_principal_name: string;
  email_sender: string;
  email_subject: string;
  email_recipient: string;
  first_seen_at: string;
  last_seen_at: string;
  fingerprint: string;
  evidence_createdDateTime?: string;
  alert_upload_time?: string;
  behavior?: string;
  behavior_reason?: string;
  SOP_Instructions?: string;
  whatNotToDoNextTime?: string;
  Feedback_L1?: string;
  AI_confidence?: number;
};

export type Redundancy = {
  Title: string;
  policy_name: string;
  category: string;
  classification: string;
  classification_reason: string;
  time: string;
};

export type ClassificationSummary = {
  name: string;
  value: number;
};

export type TopPolicySummary = {
  policy_name: string;
  count: number;
};

export type PromptInsight = {
  policy_name: string;
  Title: string;
  classification_reason: string;
  first_seen_at: string;
};

export type RiskyUserDetail = {
  email: string;
  risk_count: number;
  risk_level: 'High' | 'Medium' | 'Low';
  first_violation: string;
  last_violation: string;
  trend: 'Increasing' | 'Decreasing' | 'Stable';
};

export type NonRiskyUserDetail = {
  email: string;
  total_alerts: number;
};

export type UserViolation = {
  Title: string;
  policy_name: string;
  behavior: string;
  severity: string;
  timestamp: string;
  whatNotToDoNextTime: string;
};

export type UserViolationTrendPoint = {
  date: string;
  count: number;
};

export type TriggeredPoliciesStats = {
  triggeredCount: number;
  notTriggeredCount: number;
  mostTriggered: string;
};

export type DailyPolicyTrend = { date: string; count: number };
export type TopTriggeredPolicy = { policy_name: string, count: number };
export type PolicyEffectivenessScore = { policy_name: string, score: number, true_positives: number, total: number };
export type TriggeredPolicyDetail = { policy_name: string; description: string; last_triggered_at: string; };
export type NotTriggeredPolicyDetail = { policy_name: string; description: string; };
export type EffectivenessTrendPoint = { date: string; score: number };
export type AlertTrendPoint = { date: string; 'True Positives': number; 'False Positives': number };
export type UserBehaviorPoint = { name: string; value: number; };

const isTableMissingError = (error: any) => {
  return error && (error.code === '42P01' || error.message?.includes('does not exist'));
};

/**
 * Standardized Date Filter logic
 * range 0 = All Time (Up to today)
 * range 1 = Today
 * range N = Last N days including today
 */
function getDateFilter(timeRange: number) {
  const endDate = endOfDay(new Date());

  if (timeRange === 0) {
    return { startDate: null, endDate };
  }

  const startDate = startOfDay(subDays(new Date(), timeRange - 1));
  return { startDate, endDate };
}

/**
 * Batch Fetching Helper to ensure all records are retrieved
 */
async function fetchAllWithBatching<T>(queryBuilder: any, dateColumn: string, startDate: Date | null, endDate: Date): Promise<T[]> {
  let allRecords: T[] = [];
  let from = 0;
  const batchSize = 1000;

  let query = queryBuilder.lte(dateColumn, endDate.toISOString());
  if (startDate) {
    query = query.gte(dateColumn, startDate.toISOString());
  }

  try {
    while (true) {
      const { data, error } = await query.range(from, from + batchSize - 1);
      if (error) throw error;
      if (!data || data.length === 0) break;
      allRecords.push(...data);
      if (data.length < batchSize) break;
      from += batchSize;
    }
    return allRecords;
  } catch (e: any) {
    if (!isTableMissingError(e)) console.error('Batch fetch error:', e);
    return [];
  }
}

export async function checkSupabaseConnection() {
  noStore();
  try {
    await supabaseAdmin.from('Policy').select('*', { count: 'exact', head: true }).throwOnError();
    return { status: 'Active' as const };
  } catch (e: any) {
    return { status: isTableMissingError(e) ? 'Active' as const : 'Inactive' as const };
  }
}

export async function getAlerts(): Promise<Alert[]> {
  noStore();
  return fetchAllWithBatching<any>(
    supabaseAdmin.from('alerts_processed').select(`
      Title, policy_name, classification, classification_reason, duplicate_count, risk_score,
      user_principal_name, email_sender, email_subject, email_recipient, first_seen_at, last_seen_at,
      fingerprint, behavior, SOP_Instructions, behavior_reason, Feedback_L1,
      evidence_createdDateTime, alert_upload_time, next_time(whatNotToDoNextTime)
    `),
    'first_seen_at', null, endOfDay(new Date())
  ).then(data => data.map(v => ({
    ...v,
    whatNotToDoNextTime: v.next_time?.whatNotToDoNextTime ?? ''
  })));
}

export async function getFalsePositiveAlerts(): Promise<Alert[]> {
  noStore();
  const alerts = await getAlerts();
  return alerts.filter(a => a.classification === 'False_Positive');
}

export async function getTruePositiveAlerts(): Promise<Alert[]> {
  noStore();
  const alerts = await getAlerts();
  return alerts.filter(a => a.classification === 'True_Positive');
}

export async function getTotalAlertsCount(timeRange: number = 0): Promise<number> {
  noStore();
  const { startDate, endDate } = getDateFilter(timeRange);
  let query = supabaseAdmin.from('alerts_processed').select('*', { count: 'exact', head: true }).lte('first_seen_at', endDate.toISOString());
  if (startDate) query = query.gte('first_seen_at', startDate.toISOString());
  const { count } = await query;
  return count ?? 0;
}

export async function getTotalRedundancyCount(timeRange: number = 0): Promise<number> {
  noStore();
  const { startDate, endDate } = getDateFilter(timeRange);
  let query = supabaseAdmin.from('redundancy').select('*', { count: 'exact', head: true }).lte('time', endDate.toISOString());
  if (startDate) query = query.gte('time', startDate.toISOString());
  const { count } = await query;
  return count ?? 0;
}

export async function getFalsePositiveCount(timeRange: number = 0): Promise<number> {
  noStore();
  const { startDate, endDate } = getDateFilter(timeRange);
  let query = supabaseAdmin.from('alerts_processed').select('*', { count: 'exact', head: true }).eq('classification', 'False_Positive').lte('first_seen_at', endDate.toISOString());
  if (startDate) query = query.gte('first_seen_at', startDate.toISOString());
  const { count } = await query;
  return count ?? 0;
}

export async function getTruePositiveCount(timeRange: number = 0): Promise<number> {
  noStore();
  const { startDate, endDate } = getDateFilter(timeRange);
  let query = supabaseAdmin.from('alerts_processed').select('*', { count: 'exact', head: true }).eq('classification', 'True_Positive').lte('first_seen_at', endDate.toISOString());
  if (startDate) query = query.gte('first_seen_at', startDate.toISOString());
  const { count } = await query;
  return count ?? 0;
}

export async function getPolicies(): Promise<Policy[]> {
  noStore();
  const { data } = await supabaseAdmin.from('Policy').select('Policy_ID, Policy_Name, Policy_Description');
  return data || [];
}

export async function getTotalPoliciesCount(): Promise<number> {
  noStore();
  const { count } = await supabaseAdmin.from('Policy').select('*', { count: 'exact', head: true });
  return count ?? 0;
}

export async function getTriggeredPoliciesStats(timeRange: number): Promise<TriggeredPoliciesStats> {
  noStore();
  const { startDate, endDate } = getDateFilter(timeRange);
  const alerts = await fetchAllWithBatching<{ policy_name: string }>(
    supabaseAdmin.from('alerts_processed').select('policy_name'),
    'first_seen_at', startDate, endDate
  );
  
  const allPolicies = await getPolicies();
  const triggeredNames = new Set(alerts.map(a => a.policy_name).filter(Boolean));
  const triggeredCount = triggeredNames.size;
  
  const counts = alerts.reduce((acc, a) => {
    if (a.policy_name) acc[a.policy_name] = (acc[a.policy_name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const mostTriggered = Object.entries(counts).sort((a,b) => b[1] - a[1])[0]?.[0] || 'N/A';

  return {
    triggeredCount,
    notTriggeredCount: Math.max(0, allPolicies.length - triggeredCount),
    mostTriggered
  };
}

export async function getDailyPolicyTrend(timeRange: number): Promise<DailyPolicyTrend[]> {
  noStore();
  const { startDate, endDate } = getDateFilter(timeRange);
  const alerts = await fetchAllWithBatching<{ first_seen_at: string, policy_name: string }>(
    supabaseAdmin.from('alerts_processed').select('first_seen_at, policy_name'),
    'first_seen_at', startDate, endDate
  );

  const daily: Record<string, Set<string>> = {};
  alerts.forEach(a => {
    const d = new Date(a.first_seen_at).toISOString().split('T')[0];
    if (!daily[d]) daily[d] = new Set();
    if (a.policy_name) daily[d].add(a.policy_name);
  });

  return Object.entries(daily)
    .map(([date, set]) => ({ date, count: set.size }))
    .sort((a,b) => a.date.localeCompare(b.date));
}

export async function getPolicyEffectivenessScores(timeRange: number): Promise<PolicyEffectivenessScore[]> {
  noStore();
  const { startDate, endDate } = getDateFilter(timeRange);
  const alerts = await fetchAllWithBatching<{ policy_name: string, classification: string }>(
    supabaseAdmin.from('alerts_processed').select('policy_name, classification'),
    'first_seen_at', startDate, endDate
  );

  const stats: Record<string, { tp: number, total: number }> = {};
  alerts.forEach(a => {
    if (!a.policy_name) return;
    if (!stats[a.policy_name]) stats[a.policy_name] = { tp: 0, total: 0 };
    stats[a.policy_name].total++;
    if (a.classification === 'True_Positive') stats[a.policy_name].tp++;
  });

  return Object.entries(stats).map(([name, s]) => ({
    policy_name: name,
    score: (s.tp / s.total) * 100,
    true_positives: s.tp,
    total: s.total
  })).sort((a,b) => b.score - a.score);
}

export async function getOverallEffectivenessTrend(timeRange: number): Promise<EffectivenessTrendPoint[]> {
  noStore();
  const { startDate, endDate } = getDateFilter(timeRange);
  const alerts = await fetchAllWithBatching<{ first_seen_at: string, classification: string }>(
    supabaseAdmin.from('alerts_processed').select('first_seen_at, classification'),
    'first_seen_at', startDate, endDate
  );

  const daily: Record<string, { tp: number, total: number }> = {};
  alerts.forEach(a => {
    const d = new Date(a.first_seen_at).toISOString().split('T')[0];
    if (!daily[d]) daily[d] = { tp: 0, total: 0 };
    daily[d].total++;
    if (a.classification === 'True_Positive') daily[d].tp++;
  });

  return Object.entries(daily).map(([date, s]) => ({
    date,
    score: Math.round((s.tp / s.total) * 100)
  })).sort((a,b) => a.date.localeCompare(b.date));
}

export async function getAlertsTrend(timeRange: number): Promise<AlertTrendPoint[]> {
  noStore();
  const { startDate, endDate } = getDateFilter(timeRange);
  const alerts = await fetchAllWithBatching<{ first_seen_at: string, classification: string }>(
    supabaseAdmin.from('alerts_processed').select('first_seen_at, classification'),
    'first_seen_at', startDate, endDate
  );

  const daily: Record<string, { tp: number, fp: number }> = {};
  alerts.forEach(a => {
    const d = new Date(a.first_seen_at).toISOString().split('T')[0];
    if (!daily[d]) daily[d] = { tp: 0, fp: 0 };
    if (a.classification === 'True_Positive') daily[d].tp++;
    else if (a.classification === 'False_Positive') daily[d].fp++;
  });

  return Object.entries(daily).map(([date, s]) => ({
    date,
    'True Positives': s.tp,
    'False Positives': s.fp
  })).sort((a,b) => a.date.localeCompare(b.date));
}

export async function getTopTriggeredPolicies(timeRange: number, limit: number = 5): Promise<TopTriggeredPolicy[]> {
  noStore();
  const { startDate, endDate } = getDateFilter(timeRange);
  const alerts = await fetchAllWithBatching<{ policy_name: string }>(
    supabaseAdmin.from('alerts_processed').select('policy_name'),
    'first_seen_at', startDate, endDate
  );

  const counts = alerts.reduce((acc, a) => {
    if (a.policy_name) acc[a.policy_name] = (acc[a.policy_name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(counts)
    .map(([policy_name, count]) => ({ policy_name, count }))
    .sort((a,b) => b.count - a.count)
    .slice(0, limit);
}

export async function getLowConfidenceAlerts(): Promise<Alert[]> {
  noStore();
  return fetchAllWithBatching<any>(
    supabaseAdmin.from('alerts_processed').select('Title, policy_name, classification, classification_reason, first_seen_at, "AI-confidence", fingerprint').lt('AI-confidence', 75),
    'first_seen_at', null, endOfDay(new Date())
  ).then(data => data.map(v => ({
    Title: v.Title,
    policy_name: v.policy_name,
    classification: v.classification,
    classification_reason: v.classification_reason,
    first_seen_at: v.first_seen_at,
    AI_confidence: v["AI-confidence"],
    fingerprint: v.fingerprint
  })));
}

export async function getTriggeredPoliciesDetails(timeRange: number): Promise<TriggeredPolicyDetail[]> {
  noStore();
  const { startDate, endDate } = getDateFilter(timeRange);
  const alerts = await fetchAllWithBatching<{ policy_name: string, first_seen_at: string }>(
    supabaseAdmin.from('alerts_processed').select('policy_name, first_seen_at'),
    'first_seen_at', startDate, endDate
  );

  const lastTriggered: Record<string, string> = {};
  alerts.forEach(a => {
    if (!a.policy_name) return;
    if (!lastTriggered[a.policy_name] || new Date(a.first_seen_at) > new Date(lastTriggered[a.policy_name])) {
      lastTriggered[a.policy_name] = a.first_seen_at;
    }
  });

  const policies = await getPolicies();
  return policies
    .filter(p => lastTriggered[p.Policy_Name])
    .map(p => ({
      policy_name: p.Policy_Name,
      description: p.Policy_Description,
      last_triggered_at: lastTriggered[p.Policy_Name]
    }));
}

export async function getNotTriggeredPoliciesDetails(timeRange: number): Promise<NotTriggeredPolicyDetail[]> {
  noStore();
  const { startDate, endDate } = getDateFilter(timeRange);
  const alerts = await fetchAllWithBatching<{ policy_name: string }>(
    supabaseAdmin.from('alerts_processed').select('policy_name'),
    'first_seen_at', startDate, endDate
  );

  const triggeredSet = new Set(alerts.map(a => a.policy_name));
  const policies = await getPolicies();
  return policies
    .filter(p => !triggeredSet.has(p.Policy_Name))
    .map(p => ({
      policy_name: p.Policy_Name,
      description: p.Policy_Description
    }));
}

export async function getAlertsClassificationSummaryForPieChart(): Promise<ClassificationSummary[]> {
  const tp = await getTruePositiveCount();
  const fp = await getFalsePositiveCount();
  return [
    { name: 'True Positive', value: tp },
    { name: 'False Positive', value: fp }
  ];
}

export async function getAlertsBreakdownSummaryForPieChart(): Promise<ClassificationSummary[]> {
  const actual = await getTotalAlertsCount();
  const redundant = await getTotalRedundancyCount();
  return [
    { name: 'Actual Alerts', value: actual },
    { name: 'Redundant Alerts', value: redundant }
  ];
}

export async function getUserBehaviorSummary(): Promise<UserBehaviorPoint[]> {
  noStore();
  const alerts = await fetchAllWithBatching<{ behavior: string }>(
    supabaseAdmin.from('alerts_processed').select('behavior').eq('classification', 'True_Positive'),
    'first_seen_at', null, endOfDay(new Date())
  );

  const counts = alerts.reduce((acc, a) => {
    const b = a.behavior || 'Unknown';
    acc[b] = (acc[b] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(counts).map(([name, value]) => ({ name, value }));
}

export async function getRiskyUsersDistribution(): Promise<ClassificationSummary[]> {
  const risky = await getTotalRiskyUsersCount();
  const alerts = await getAlerts();
  const total = new Set(alerts.map(a => a.email_sender).filter(Boolean)).size;
  return [
    { name: 'Risky Users', value: risky },
    { name: 'Non-Risky Users', value: Math.max(0, total - risky) }
  ];
}

export async function getProcessedAlertsTrendLastHour(): Promise<any[]> {
  noStore();
  const oneHourAgo = new Date();
  oneHourAgo.setHours(oneHourAgo.getHours() - 1);
  const { data } = await supabaseAdmin.from('processing_alerts').select('updated_at').gte('updated_at', oneHourAgo.toISOString());
  
  const buckets = Array.from({ length: 6 }, (_, i) => {
    const t = new Date(Date.now() - i * 10 * 60 * 1000);
    t.setSeconds(0, 0);
    return { time: t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), count: 0, raw: t };
  }).reverse();

  data?.forEach(a => {
    const at = new Date(a.updated_at);
    for (let i = buckets.length - 1; i >= 0; i--) {
      if (at >= buckets[i].raw) { buckets[i].count++; break; }
    }
  });

  return buckets.map(b => ({ time: b.time, count: b.count }));
}

export async function getSOPs(): Promise<SOP[]> {
  noStore();
  const { data } = await supabaseAdmin.from('SOP').select('*');
  return data || [];
}

export async function getRedundancyData(fingerprint: string): Promise<Redundancy[]> {
  noStore();
  const { data } = await supabaseAdmin.from('redundancy').select('*').eq('fingerprint', fingerprint);
  return data || [];
}

export async function updateAlertFeedback(fingerprint: string, feedback: string): Promise<{ success: boolean; error?: string }> {
  try {
    await supabaseAdmin.from('alerts_processed').update({ Feedback_L1: feedback }).eq('fingerprint', fingerprint).throwOnError();
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function getPromptLibraryInsights(): Promise<PromptInsight[]> {
  noStore();
  const data = await fetchAllWithBatching<any>(
    supabaseAdmin.from('alerts_processed').select('policy_name, Title, classification_reason, first_seen_at').eq('feedback_referral', 'yes'),
    'first_seen_at', null, endOfDay(new Date())
  );
  return data || [];
}

export async function getTotalRiskyUsersCount(): Promise<number> {
  const { count } = await supabaseAdmin.from('risky_users').select('*', { count: 'exact', head: true });
  if (count !== null) return count;
  const tps = await getTruePositiveAlerts();
  return new Set(tps.map(a => a.email_sender).filter(Boolean)).size;
}

export async function getRiskyUsersDetails(): Promise<RiskyUserDetail[]> {
  const alerts = await getTruePositiveAlerts();
  const userMap: Record<string, Alert[]> = {};
  alerts.forEach(a => {
    if (a.email_sender) {
      if (!userMap[a.email_sender]) userMap[a.email_sender] = [];
      userMap[a.email_sender].push(a);
    }
  });

  const now = new Date();
  const last7 = subDays(now, 7);
  const prev7 = subDays(now, 14);

  return Object.entries(userMap).map(([email, uAlerts]) => {
    const sorted = [...uAlerts].sort((a,b) => new Date(a.first_seen_at).getTime() - new Date(b.first_seen_at).getTime());
    const l7c = uAlerts.filter(a => isAfter(new Date(a.first_seen_at), last7)).length;
    const p7c = uAlerts.filter(a => isAfter(new Date(a.first_seen_at), prev7) && isBefore(new Date(a.first_seen_at), last7)).length;
    
    let trend: RiskyUserDetail['trend'] = 'Stable';
    if (l7c > p7c) trend = 'Increasing';
    else if (l7c < p7c) trend = 'Decreasing';

    return {
      email,
      risk_count: uAlerts.length,
      risk_level: uAlerts.length >= 6 ? 'High' : uAlerts.length >= 3 ? 'Medium' : 'Low',
      first_violation: sorted[0].first_seen_at,
      last_violation: sorted[sorted.length - 1].first_seen_at,
      trend
    };
  }).sort((a,b) => b.risk_count - a.risk_count);
}

export async function getMostViolatedPoliciesByRiskyUsers(): Promise<TopPolicySummary[]> {
  const alerts = await getTruePositiveAlerts();
  const counts: Record<string, number> = {};
  alerts.forEach(a => { if (a.policy_name) counts[a.policy_name] = (counts[a.policy_name] || 0) + 1; });
  return Object.entries(counts).map(([policy_name, count]) => ({ policy_name, count })).sort((a,b) => b.count - a.count).slice(0, 5);
}

export async function getNonRiskyUsersDetails(): Promise<NonRiskyUserDetail[]> {
  const alerts = await getAlerts();
  const risky = new Set((await getTruePositiveAlerts()).map(a => a.email_sender).filter(Boolean));
  const counts: Record<string, number> = {};
  alerts.forEach(a => { if (a.email_sender && !risky.has(a.email_sender)) counts[a.email_sender] = (counts[a.email_sender] || 0) + 1; });
  return Object.entries(counts).map(([email, total_alerts]) => ({ email, total_alerts })).sort((a,b) => b.total_alerts - a.total_alerts);
}

export async function getUserViolations(email: string): Promise<UserViolation[]> {
  const alerts = await getTruePositiveAlerts();
  return alerts.filter(a => a.email_sender === email).map(a => ({
    Title: a.Title, policy_name: a.policy_name, behavior: a.behavior || 'Unknown',
    severity: a.risk_score > 70 ? 'High' : a.risk_score > 30 ? 'Medium' : 'Low',
    timestamp: a.first_seen_at, whatNotToDoNextTime: a.whatNotToDoNextTime || ''
  }));
}

export async function getUserViolationTrend(email: string): Promise<UserViolationTrendPoint[]> {
  const alerts = (await getTruePositiveAlerts()).filter(a => a.email_sender === email);
  const daily: Record<string, number> = {};
  alerts.forEach(a => {
    const d = new Date(a.first_seen_at).toISOString().split('T')[0];
    daily[d] = (daily[d] || 0) + 1;
  });
  return Object.entries(daily).map(([date, count]) => ({ date, count })).sort((a,b) => a.date.localeCompare(b.date));
}

export async function getUserBehaviorDistribution(email: string): Promise<UserBehaviorPoint[]> {
  const alerts = (await getTruePositiveAlerts()).filter(a => a.email_sender === email);
  const counts: Record<string, number> = {};
  alerts.forEach(a => { const b = a.behavior || 'Unknown'; counts[b] = (counts[b] || 0) + 1; });
  return Object.entries(counts).map(([name, value]) => ({ name, value }));
}
