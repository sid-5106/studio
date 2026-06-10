
'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { subDays, startOfDay, endOfDay } from 'date-fns';
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

export type AlertSummary = {
  category: string;
  [key: string]: string | number;
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

// Helper to check if a Supabase error is because a table is missing
const isTableMissingError = (error: any) => {
  return error && (error.code === '42P01' || error.message?.includes('does not exist'));
};

/**
 * Shared date filter logic for Policy Insights
 * range 0 = All Time
 * range 1 = Today
 * range N = Last N days including today
 */
function getDateFilter(timeRange: number) {
  const endDate = endOfDay(new Date());

  if (timeRange === 0) {
    return {
      startDate: null,
      endDate
    };
  }

  const startDate = startOfDay(subDays(new Date(), timeRange - 1));
  return {
    startDate,
    endDate
  };
}

export async function checkSupabaseConnection() {
  noStore();
  try {
    await supabaseAdmin.from('Policy').select('*', { count: 'exact', head: true }).throwOnError();
    return { status: 'Active' as const };
  } catch (e: any) {
    if (isTableMissingError(e)) {
      return { status: 'Active' as const };
    }
    console.error('Supabase connection check failed:', e);
    return { status: 'Inactive' as const };
  }
}

export async function getPolicies(): Promise<Policy[]> {
  noStore();
  try {
    const { data } = await supabaseAdmin
      .from('Policy')
      .select('Policy_ID, Policy_Name, Policy_Description')
      .throwOnError();

    return (data as Policy[]) || [];
  } catch (e: any) {
    if (!isTableMissingError(e)) console.error('Error fetching policies:', e);
    return [];
  }
}

export async function getSOPs(): Promise<SOP[]> {
  noStore();
  try {
    const { data } = await supabaseAdmin
      .from('SOP')
      .select('Policy_ID, Policy_Name, SOP')
      .throwOnError();

    return (data as SOP[]) || [];
  } catch (e: any) {
    if (!isTableMissingError(e)) console.error('Error fetching SOPs:', e);
    return [];
  }
}

export async function getTotalPoliciesCount(): Promise<number> {
  noStore();
  try {
    const { count } = await supabaseAdmin
      .from('Policy')
      .select('*', { count: 'exact', head: true })
      .throwOnError();

    return count ?? 0;
  } catch (e: any) {
    if (!isTableMissingError(e)) console.error('Error fetching policies count:', e);
    return 0;
  }
}

export async function getAlerts(): Promise<Alert[]> {
  noStore();
  let allAlerts: any[] = [];
  let from = 0;
  const batchSize = 1000;

  try {
    while (true) {
      const { data, error } = await supabaseAdmin
        .from('alerts_processed')
        .select(`
          Title,
          policy_name,
          classification,
          classification_reason,
          duplicate_count,
          risk_score,
          user_principal_name,
          email_sender,
          email_subject,
          email_recipient,
          first_seen_at,
          last_seen_at,
          fingerprint,
          behavior,
          SOP_Instructions,
          behavior_reason,
          Feedback_L1,
          evidence_createdDateTime,
          alert_upload_time,
          next_time(whatNotToDoNextTime)
        `)
        .range(from, from + batchSize - 1);

      if (error) throw error;
      if (!data || data.length === 0) break;

      allAlerts.push(...data);
      if (data.length < batchSize) break;
      from += batchSize;
    }

    const alerts = allAlerts.map((v: any) => {
        const { next_time, ...rest } = v;
        return {
            ...rest,
            whatNotToDoNextTime: next_time?.whatNotToDoNextTime ?? ''
        }
    });

    console.log("Total alerts fetched:", alerts.length);
    return alerts as Alert[];
  } catch (e: any) {
    if (!isTableMissingError(e)) console.error('Error fetching alerts:', e);
    return [];
  }
}

export async function getRedundancyData(fingerprint: string): Promise<Redundancy[]> {
  noStore();
  if (!fingerprint) return [];

  try {
    const { data } = await supabaseAdmin
      .from('redundancy')
      .select('Title, policy_name, category, classification, classification_reason, time')
      .eq('fingerprint', fingerprint)
      .throwOnError();

    return (data as Redundancy[]) || [];
  } catch (e: any) {
    if (!isTableMissingError(e)) console.error('Error fetching redundancy data:', e);
    return [];
  }
}

export async function getTotalAlertsCount(): Promise<number> {
  noStore();
  try {
    const { count } = await supabaseAdmin
      .from('alerts_processed')
      .select('*', { count: 'exact', head: true })
      .throwOnError();

    return count ?? 0;
  } catch (e: any) {
    if (!isTableMissingError(e)) console.error('Error fetching alerts count:', e);
    return 0;
  }
}

export async function getTotalRedundancyCount(): Promise<number> {
  noStore();
  try {
    const { count } = await supabaseAdmin
      .from('redundancy')
      .select('*', { count: 'exact', head: true })
      .throwOnError();

    return count ?? 0;
  } catch (e: any) {
    if (!isTableMissingError(e)) {
      console.error('Error fetching redundancy count:', e);
    }
    return 0;
  }
}

export async function getFalsePositiveCount(): Promise<number> {
  noStore();
  try {
    const { count } = await supabaseAdmin
      .from('alerts_processed')
      .select('*', { count: 'exact', head: true })
      .eq('classification', 'False_Positive')
      .throwOnError();

    return count ?? 0;
  } catch (e: any) {
    if (!isTableMissingError(e)) console.error('Error fetching false positive alerts count:', e);
    return 0;
  }
}

export async function getFalsePositiveAlerts(): Promise<Alert[]> {
  noStore();
  let allAlerts: any[] = [];
  let from = 0;
  const batchSize = 1000;

  try {
    while (true) {
      const { data, error } = await supabaseAdmin
        .from('alerts_processed')
        .select('*')
        .eq('classification', 'False_Positive')
        .range(from, from + batchSize - 1);

      if (error) throw error;
      if (!data || data.length === 0) break;

      allAlerts.push(...data);
      if (data.length < batchSize) break;
      from += batchSize;
    }

    return allAlerts as Alert[];
  } catch (e: any) {
    if (!isTableMissingError(e)) console.error('Error fetching false positive alerts:', e);
    return [];
  }
}

export async function getTruePositiveCount(): Promise<number> {
  noStore();
  try {
    const { count } = await supabaseAdmin
      .from('alerts_processed')
      .select('*', { count: 'exact', head: true })
      .eq('classification', 'True_Positive')
      .throwOnError();

    return count ?? 0;
  } catch (e: any) {
    if (!isTableMissingError(e)) console.error('Error fetching true positive alerts count:', e);
    return 0;
  }
}

export async function getTruePositiveAlerts(): Promise<Alert[]> {
  noStore();
  let allAlerts: any[] = [];
  let from = 0;
  const batchSize = 1000;

  try {
    while (true) {
      const { data, error } = await supabaseAdmin
        .from('alerts_processed')
        .select('*')
        .eq('classification', 'True_Positive')
        .range(from, from + batchSize - 1);

      if (error) throw error;
      if (!data || data.length === 0) break;

      allAlerts.push(...data);
      if (data.length < batchSize) break;
      from += batchSize;
    }

    return allAlerts as Alert[];
  } catch (e: any) {
    if (!isTableMissingError(e)) console.error('Error fetching true positive alerts:', e);
    return [];
  }
}

export async function updateAlertFeedback(fingerprint: string, feedback: string): Promise<{ success: boolean; error?: string }> {
  if (!fingerprint) {
    return { success: false, error: 'Fingerprint is required.' };
  }

  try {
    await supabaseAdmin
      .from('alerts_processed')
      .update({ Feedback_L1: feedback })
      .eq('fingerprint', fingerprint)
      .throwOnError();

    return { success: true };
  } catch (e: any) {
    console.error('Error updating feedback:', e);
    return { success: false, error: e.message };
  }
}

export async function getAlertsSummary(): Promise<AlertSummary[]> {
  noStore();
  let allData: any[] = [];
  let from = 0;
  const batchSize = 1000;

  try {
    while (true) {
        const { data, error } = await supabaseAdmin
        .from('alerts_processed')
        .select('category,classification')
        .range(from, from + batchSize - 1);

        if (error) throw error;
        if (!data || data.length === 0) break;
        allData.push(...data);
        if (data.length < batchSize) break;
        from += batchSize;
    }

    const summaryMap = allData.reduce(
      (acc, { category, classification }) => {
        if (!category || !classification) return acc;
        if (!acc[category]) {
          acc[category] = { category };
        }
        const currentCount = acc[category][classification] ? Number(acc[category][classification]) : 0;
        acc[category][classification] = currentCount + 1;
        return acc;
      },
      {} as Record<string, { category: string; [key: string]: string | number }>
    );

    return Object.values(summaryMap);
  } catch (e: any) {
    if (!isTableMissingError(e)) console.error('Error fetching alerts summary:', e);
    return [];
  }
}

export async function getAlertsClassificationSummaryForPieChart(): Promise<ClassificationSummary[]> {
  const total = await getTotalAlertsCount();
  const falsePositives = await getFalsePositiveCount();
  const truePositives = Math.max(0, total - falsePositives);

  return [
    { name: 'True Positive', value: truePositives },
    { name: 'False Positive', value: falsePositives },
  ];
}

export async function getTopPolicies(): Promise<TopPolicySummary[]> {
  noStore();
  let allData: any[] = [];
  let from = 0;
  const batchSize = 1000;

  try {
    while (true) {
        const { data, error } = await supabaseAdmin
        .from('alerts_processed')
        .select('policy_name')
        .range(from, from + batchSize - 1);

        if (error) throw error;
        if (!data || data.length === 0) break;
        allData.push(...data);
        if (data.length < batchSize) break;
        from += batchSize;
    }

    const summaryMap = allData.reduce(
      (acc, { policy_name }) => {
        if (!policy_name) return acc;
        acc[policy_name] = (acc[policy_name] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const sorted = Object.entries(summaryMap)
      .map(([policy_name, count]) => ({ policy_name, count }))
      .sort((a, b) => b.count - a.count);
    
    return sorted.slice(0, 5);
  } catch (e: any) {
    if (!isTableMissingError(e)) console.error('Error fetching alerts for top policies summary:', e);
    return [];
  }
}

export async function getAlertsBreakdownSummaryForPieChart(): Promise<ClassificationSummary[]> {
  const actualAlerts = await getTotalAlertsCount();
  const redundantAlerts = await getTotalRedundancyCount();

  return [
    { name: 'Actual Alerts', value: actualAlerts },
    { name: 'Redundant Alerts', value: redundantAlerts },
  ];
}

export type TriggeredPoliciesStats = {
  triggeredCount: number;
  notTriggeredCount: number;
  mostTriggered: string;
};

export async function getTriggeredPoliciesStats(timeRange: number): Promise<TriggeredPoliciesStats> {
  noStore();
  try {
    const allPolicies = await getPolicies();
    const totalPolicies = allPolicies.length;
    
    const { startDate, endDate } = getDateFilter(timeRange);

    let triggeredAlerts: any[] = [];
    let from = 0;
    const batchSize = 1000;

    while (true) {
        let query = supabaseAdmin
            .from('alerts_processed')
            .select('policy_name, first_seen_at')
            .lte('first_seen_at', endDate.toISOString());

        if (startDate) {
            query = query.gte('first_seen_at', startDate.toISOString());
        }

        const { data, error } = await query.range(from, from + batchSize - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        triggeredAlerts.push(...data);
        if (data.length < batchSize) break;
        from += batchSize;
    }
    
    if (triggeredAlerts.length === 0) {
       return { triggeredCount: 0, notTriggeredCount: totalPolicies, mostTriggered: 'N/A' };
    }

    const triggeredPolicyNames = new Set(triggeredAlerts.map(a => a.policy_name).filter(Boolean));
    const triggeredCount = triggeredPolicyNames.size;
    const notTriggeredCount = totalPolicies - triggeredCount;
    
    const policyCounts = triggeredAlerts.reduce((acc, { policy_name }) => {
      if (policy_name) {
        acc[policy_name] = (acc[policy_name] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const mostTriggered = Object.entries(policyCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A';

    return { triggeredCount, notTriggeredCount, mostTriggered };
  } catch (e: any) {
    if (!isTableMissingError(e)) console.error(`Error fetching triggered policies for range ${timeRange}:`, e);
    return { triggeredCount: 0, notTriggeredCount: 0, mostTriggered: 'N/A' };
  }
}

export type DailyPolicyTrend = { date: string; count: number };

export async function getDailyPolicyTrend(timeRange: number): Promise<DailyPolicyTrend[]> {
    noStore();
    try {
      const { startDate, endDate } = getDateFilter(timeRange);

      let triggeredAlerts: any[] = [];
      let from = 0;
      const batchSize = 1000;

      while (true) {
          let query = supabaseAdmin
              .from('alerts_processed')
              .select('first_seen_at, policy_name')
              .lte('first_seen_at', endDate.toISOString());

          if (startDate) {
            query = query.gte('first_seen_at', startDate.toISOString());
          }

          const { data, error } = await query.range(from, from + batchSize - 1);
          if (error) throw error;
          if (!data || data.length === 0) break;
          triggeredAlerts.push(...data);
          if (data.length < batchSize) break;
          from += batchSize;
      }

      if (triggeredAlerts.length === 0) return [];
      
      const dailyUniquePolicies: Record<string, Set<string>> = {};
      
      triggeredAlerts.forEach(({ first_seen_at, policy_name }) => {
          if (!first_seen_at || !policy_name) return;
          const date = new Date(first_seen_at).toISOString().split('T')[0];
          if (!dailyUniquePolicies[date]) {
              dailyUniquePolicies[date] = new Set<string>();
          }
          dailyUniquePolicies[date].add(policy_name);
      });

      const trend = Object.entries(dailyUniquePolicies)
          .map(([date, policies]) => ({
              date,
              count: policies.size,
          }))
          .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      return trend;
    } catch (e: any) {
      if (!isTableMissingError(e)) console.error('Error fetching daily policy trend:', e);
      return [];
    }
}

export type TopTriggeredPolicy = { policy_name: string, count: number };

export async function getTopTriggeredPolicies(timeRange: number, limit: number = 5): Promise<TopTriggeredPolicy[]> {
    noStore();
    try {
      const { startDate, endDate } = getDateFilter(timeRange);

      let triggeredAlerts: any[] = [];
      let from = 0;
      const batchSize = 1000;

      while (true) {
          let query = supabaseAdmin
              .from('alerts_processed')
              .select('policy_name, first_seen_at')
              .lte('first_seen_at', endDate.toISOString());

          if (startDate) {
            query = query.gte('first_seen_at', startDate.toISOString());
          }

          const { data, error } = await query.range(from, from + batchSize - 1);
          if (error) throw error;
          if (!data || data.length === 0) break;
          triggeredAlerts.push(...data);
          if (data.length < batchSize) break;
          from += batchSize;
      }
      
      if (triggeredAlerts.length === 0) return [];

      const summaryMap = triggeredAlerts.reduce(
          (acc, { policy_name }) => {
            if (!policy_name) return acc;
            acc[policy_name] = (acc[policy_name] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
      );
      
      const sorted = Object.entries(summaryMap)
          .map(([policy_name, count]) => ({ policy_name, count }))
          .sort((a, b) => b.count - a.count);
        
      return sorted.slice(0, limit);
    } catch (e: any) {
      if (!isTableMissingError(e)) console.error(`Error fetching top triggered policies for range ${timeRange}:`, e);
      return [];
    }
}

export type PolicyEffectivenessScore = { policy_name: string, score: number, true_positives: number, total: number };

export async function getPolicyEffectivenessScores(timeRange: number): Promise<PolicyEffectivenessScore[]> {
    noStore();
    try {
      const { startDate, endDate } = getDateFilter(timeRange);

      let triggeredAlerts: any[] = [];
      let from = 0;
      const batchSize = 1000;

      while (true) {
          let query = supabaseAdmin
              .from('alerts_processed')
              .select('policy_name, classification, first_seen_at')
              .lte('first_seen_at', endDate.toISOString());

          if (startDate) {
            query = query.gte('first_seen_at', startDate.toISOString());
          }

          const { data, error } = await query.range(from, from + batchSize - 1);
          if (error) throw error;
          if (!data || data.length === 0) break;
          triggeredAlerts.push(...data);
          if (data.length < batchSize) break;
          from += batchSize;
      }
      
      if (triggeredAlerts.length === 0) return [];

      const policyStats = triggeredAlerts.reduce((acc, alert) => {
          const { policy_name, classification } = alert;
          if (!policy_name) return acc;
          if (!acc[policy_name]) {
              acc[policy_name] = { true_positives: 0, total: 0 };
          }
          acc[policy_name].total++;
          if (classification === 'True_Positive') {
              acc[policy_name].true_positives++;
          }
          return acc;
      }, {} as Record<string, { true_positives: number, total: number }>);
      
      const scores = Object.entries(policyStats).map(([policy_name, stats]) => ({
          policy_name,
          score: stats.total > 0 ? (stats.true_positives / stats.total) * 100 : 0,
          true_positives: stats.true_positives,
          total: stats.total
      })).sort((a,b) => b.score - a.score);

      return scores;
    } catch (e: any) {
      if (!isTableMissingError(e)) console.error('Error fetching policy effectiveness data:', e);
      return [];
    }
}

export type TriggeredPolicyDetail = {
  policy_name: string;
  description: string;
  last_triggered_at: string;
};

export type NotTriggeredPolicyDetail = {
  policy_name: string;
  description: string;
};

export async function getTriggeredPoliciesDetails(timeRange: number): Promise<TriggeredPolicyDetail[]> {
  noStore();
  try {
    const { startDate, endDate } = getDateFilter(timeRange);
    
    let triggeredAlerts: any[] = [];
    let from = 0;
    const batchSize = 1000;

    while (true) {
        let query = supabaseAdmin
            .from('alerts_processed')
            .select('policy_name, first_seen_at')
            .lte('first_seen_at', endDate.toISOString());

        if (startDate) {
            query = query.gte('first_seen_at', startDate.toISOString());
        }

        const { data, error } = await query.range(from, from + batchSize - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        triggeredAlerts.push(...data);
        if (data.length < batchSize) break;
        from += batchSize;
    }

    if (triggeredAlerts.length === 0) return [];

    const lastTriggeredMap = triggeredAlerts.reduce((acc, alert) => {
      if (alert.policy_name) {
        const existing = acc[alert.policy_name];
        if (!existing || new Date(alert.first_seen_at) > new Date(existing)) {
          acc[alert.policy_name] = alert.first_seen_at;
        }
      }
      return acc;
    }, {} as Record<string, string>);

    const triggeredPolicyNames = Object.keys(lastTriggeredMap);

    if (triggeredPolicyNames.length === 0) return [];

    const { data: policies } = await supabaseAdmin
      .from('Policy')
      .select('Policy_Name, Policy_Description')
      .in('Policy_Name', triggeredPolicyNames)
      .throwOnError();

    if (!policies) return [];

    return policies.map(p => ({
      policy_name: p.Policy_Name,
      description: p.Policy_Description,
      last_triggered_at: lastTriggeredMap[p.Policy_Name]
    })).sort((a,b) => new Date(b.last_triggered_at).getTime() - new Date(a.last_triggered_at).getTime());
  } catch (e: any) {
    if (!isTableMissingError(e)) console.error(`Error fetching triggered policies details for range ${timeRange}:`, e);
    return [];
  }
}

export async function getNotTriggeredPoliciesDetails(timeRange: number): Promise<NotTriggeredPolicyDetail[]> {
  noStore();
  try {
    const { startDate, endDate } = getDateFilter(timeRange);

    const { data: allPolicies } = await supabaseAdmin
      .from('Policy')
      .select('Policy_Name, Policy_Description')
      .throwOnError();

    if (!allPolicies) return [];

    let triggeredAlerts: any[] = [];
    let from = 0;
    const batchSize = 1000;

    while (true) {
        let query = supabaseAdmin
            .from('alerts_processed')
            .select('policy_name, first_seen_at')
            .lte('first_seen_at', endDate.toISOString());

        if (startDate) {
            query = query.gte('first_seen_at', startDate.toISOString());
        }

        const { data, error } = await query.range(from, from + batchSize - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        triggeredAlerts.push(...data);
        if (data.length < batchSize) break;
        from += batchSize;
    }

    const triggeredPolicyNames = new Set(triggeredAlerts?.map(a => a.policy_name).filter(Boolean) || []);

    const notTriggeredPolicies = allPolicies.filter(p => !triggeredPolicyNames.has(p.Policy_Name));

    return notTriggeredPolicies.map(p => ({
      policy_name: p.Policy_Name,
      description: p.Policy_Description
    }));
  } catch (e: any) {
    if (!isTableMissingError(e)) console.error('Error in getNotTriggeredPoliciesDetails:', e);
    return [];
  }
}

export type EffectivenessTrendPoint = { date: string; score: number };

export async function getOverallEffectivenessTrend(timeRange: number): Promise<EffectivenessTrendPoint[]> {
    noStore();
    try {
      const { startDate, endDate } = getDateFilter(timeRange);

      let triggeredAlerts: any[] = [];
      let from = 0;
      const batchSize = 1000;

      while (true) {
          let query = supabaseAdmin
              .from('alerts_processed')
              .select('first_seen_at, classification')
              .lte('first_seen_at', endDate.toISOString());

          if (startDate) {
            query = query.gte('first_seen_at', startDate.toISOString());
          }

          const { data, error } = await query.range(from, from + batchSize - 1);
          if (error) throw error;
          if (!data || data.length === 0) break;
          triggeredAlerts.push(...data);
          if (data.length < batchSize) break;
          from += batchSize;
      }

      if (triggeredAlerts.length === 0) return [];
      
      const dailyStats: Record<string, { truePositives: number, total: number }> = {};
      
      triggeredAlerts.forEach(({ first_seen_at, classification }) => {
          if (!first_seen_at || !classification) return;
          const date = new Date(first_seen_at).toISOString().split('T')[0];
          if (!dailyStats[date]) {
              dailyStats[date] = { truePositives: 0, total: 0 };
          }
          dailyStats[date].total++;
          if (classification === 'True_Positive') {
              dailyStats[date].truePositives++;
          }
      });

      const trend = Object.entries(dailyStats)
          .map(([date, stats]) => ({
              date,
              score: stats.total > 0 ? Math.round((stats.truePositives / stats.total) * 100) : 0,
          }))
          .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      return trend;
    } catch (e: any) {
      if (!isTableMissingError(e)) console.error('Error fetching overall effectiveness trend:', e);
      return [];
    }
}

export type AlertTrendPoint = { date: string; 'True Positives': number; 'False Positives': number };

export async function getAlertsTrend(timeRange: number): Promise<AlertTrendPoint[]> {
    noStore();
    try {
      const { startDate, endDate } = getDateFilter(timeRange);

      let triggeredAlerts: any[] = [];
      let from = 0;
      const batchSize = 1000;

      while (true) {
          let query = supabaseAdmin
              .from('alerts_processed')
              .select('first_seen_at, classification')
              .lte('first_seen_at', endDate.toISOString());

          if (startDate) {
            query = query.gte('first_seen_at', startDate.toISOString());
          }

          const { data, error } = await query.range(from, from + batchSize - 1);
          if (error) throw error;
          if (!data || data.length === 0) break;
          triggeredAlerts.push(...data);
          if (data.length < batchSize) break;
          from += batchSize;
      }

      if (triggeredAlerts.length === 0) return [];
      
      const dailyStats: Record<string, { 'True Positives': number, 'False Positives': number }> = {};

      triggeredAlerts.forEach(({ first_seen_at, classification }) => {
          if (!first_seen_at || !classification) return;
          const date = new Date(first_seen_at).toISOString().split('T')[0];
          if (!dailyStats[date]) {
              dailyStats[date] = { 'True Positives': 0, 'False Positives': 0 };
          }
          if (classification === 'True_Positive') {
              dailyStats[date]['True Positives']++;
          } else if (classification === 'False_Positive') {
              dailyStats[date]['False Positives']++;
          }
      });

      return Object.entries(dailyStats)
          .map(([date, counts]) => ({ date, ...counts }))
          .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } catch (e: any) {
      if (!isTableMissingError(e)) console.error('Error fetching alerts trend:', e);
      return [];
    }
}

export async function getUserBehaviorSummary(): Promise<UserBehaviorPoint[]> {
  noStore();
  let allData: any[] = [];
  let from = 0;
  const batchSize = 1000;

  try {
    while (true) {
        const { data, error } = await supabaseAdmin
            .from('alerts_processed')
            .select('behavior, email_sender')
            .eq('classification', 'True_Positive')
            .not('email_sender', 'is', null)
            .range(from, from + batchSize - 1);

        if (error) throw error;
        if (!data || data.length === 0) break;
        allData.push(...data);
        if (data.length < batchSize) break;
        from += batchSize;
    }

    const behaviorCounts = allData.reduce((acc, alert) => {
      const behavior = alert.behavior || 'Unknown';
      acc[behavior] = (acc[behavior] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(behaviorCounts).map(([name, value]) => ({ name, value }));
  } catch (e: any) {
    if (!isTableMissingError(e)) console.error('Error fetching behavior summary:', e);
    return [];
  }
}

export type RiskyUserDetail = {
  email: string;
  risk_count: number;
  risk_level: 'High' | 'Medium' | 'Low';
  first_violation: string;
  last_violation: string;
  trend: 'Increasing' | 'Decreasing' | 'Stable';
};

export type UserViolation = {
  Title: string;
  policy_name: string;
  behavior: string;
  severity: number;
  timestamp: string;
  whatNotToDoNextTime: string;
};

export type UserViolationTrendPoint = {
  date: string;
  count: number;
};

export type UserBehaviorPoint = {
  name: string;
  value: number;
};

export async function getTotalRiskyUsersCount(): Promise<number> {
    noStore();
    try {
      const { count } = await supabaseAdmin
        .from('risky_users')
        .select('*', { count: 'exact', head: true })
        .throwOnError();
      return count ?? 0;
    } catch (e: any) {
      if (!isTableMissingError(e)) console.error('Error fetching total risky users count:', e);
      return 0;
    }
}

export async function getHighRiskUsersCount(): Promise<number> {
    noStore();
    try {
      const { data } = await supabaseAdmin
        .from('risky_users')
        .select('evidence_p1Sender_emailAddress', { count: 'exact' })
        .gte('risk_count', 6)
        .throwOnError();
      return data?.length ?? 0;
    } catch (e: any) {
      if (!isTableMissingError(e)) console.error('Error fetching high risk users count:', e);
      return 0;
    }
}

export async function getNewRiskyUsersCount(): Promise<number> {
    noStore();
    try {
      const { data: riskyUsers } = await supabaseAdmin
          .from('risky_users')
          .select('evidence_p1Sender_emailAddress')
          .throwOnError();
      
      if (!riskyUsers || riskyUsers.length === 0) {
          return 0;
      }
      const riskyUserEmails = riskyUsers.map(u => u.evidence_p1Sender_emailAddress).filter(Boolean);

      const { data } = await supabaseAdmin
          .from('alerts_processed')
          .select('email_sender, created_at')
          .eq('classification', 'True_Positive')
          .in('email_sender', riskyUserEmails)
          .throwOnError();
          
      if (!data) return 0;

      const firstViolations = data.reduce((acc, alert) => {
          if (!alert.email_sender) return acc;
          if (!acc[alert.email_sender] || new Date(alert.created_at) < new Date(acc[alert.email_sender])) {
              acc[alert.email_sender] = alert.created_at;
          }
          return acc;
      }, {} as Record<string, string>);

      const sevenDaysAgoDate = subDays(new Date(), 7);
      const newUsers = Object.values(firstViolations).filter(date => new Date(date) >= sevenDaysAgoDate);
      
      return newUsers.length;
    } catch (e: any) {
      if (!isTableMissingError(e)) console.error('Error in getNewRiskyUsersCount:', e);
      return 0;
    }
}

export async function getEscalatingUsersCount(): Promise<number> {
    noStore();
    try {
      const { data: riskyUsers } = await supabaseAdmin
          .from('risky_users')
          .select('evidence_p1Sender_emailAddress')
          .throwOnError();

      if (!riskyUsers || !riskyUsers.length) {
          return 0;
      }
      const riskyUserEmails = riskyUsers.map(u => u.evidence_p1Sender_emailAddress).filter(Boolean);

      const fourteenDaysAgo = subDays(new Date(), 14).toISOString();
      const sevenDaysAgo = subDays(new Date(), 7).toISOString();
      
      const { data: alerts } = await supabaseAdmin
          .from('alerts_processed')
          .select('email_sender, created_at')
          .eq('classification', 'True_Positive')
          .gte('created_at', fourteenDaysAgo)
          .in('email_sender', riskyUserEmails)
          .throwOnError();
      
      if (!alerts) return 0;

      const userViolations = alerts.reduce((acc, alert) => {
          if (!alert.email_sender) return acc;
          if (!acc[alert.email_sender]) {
              acc[alert.email_sender] = { recent: 0, previous: 0 };
          }
          if (new Date(alert.created_at) >= new Date(sevenDaysAgo)) {
              acc[alert.email_sender].recent++;
          } else {
              acc[alert.email_sender].previous++;
          }
          return acc;
      }, {} as Record<string, { recent: number; previous: number }>);
      
      let escalatingUsersCount = 0;
      for (const user in userViolations) {
          if (userViolations[user].recent > userViolations[user].previous) {
              escalatingUsersCount++;
          }
      }
      
      return escalatingUsersCount;
    } catch (e: any) {
      if (!isTableMissingError(e)) console.error('Error fetching alerts for escalating users:', e);
      return 0;
    }
}

export async function getRiskyUsersDetails(): Promise<RiskyUserDetail[]> {
    noStore();
    try {
      const { data: riskyUsers } = await supabaseAdmin
          .from('risky_users')
          .select('evidence_p1Sender_emailAddress, risk_count')
          .throwOnError();

      if (!riskyUsers) return [];

      const { data: alerts } = await supabaseAdmin
          .from('alerts_processed')
          .select('email_sender, created_at')
          .eq('classification', 'True_Positive')
          .throwOnError();
      
      if (!alerts) return [];
      
      const fourteenDaysAgo = subDays(new Date(), 14);
      const sevenDaysAgo = subDays(new Date(), 7);

      const userStats = alerts.reduce((acc, alert) => {
          const user = alert.email_sender;
          if (!user) return acc;
          
          if (!acc[user]) {
              acc[user] = {
                  first_violation: alert.created_at,
                  last_violation: alert.created_at,
                  recent_violations: 0,
                  previous_violations: 0,
              };
          }
          
          const alertDate = new Date(alert.created_at);
          if (alertDate < new Date(acc[user].first_violation)) {
              acc[user].first_violation = alert.created_at;
          }
          if (alertDate > new Date(acc[user].last_violation)) {
              acc[user].last_violation = alert.created_at;
          }
          
          if (alertDate >= sevenDaysAgo) {
              acc[user].recent_violations++;
          } else if (alertDate >= fourteenDaysAgo) {
              acc[user].previous_violations++;
          }
          
          return acc;
      }, {} as Record<string, {first_violation: string, last_violation: string, recent_violations: number, previous_violations: number}>);

      return riskyUsers.map(user => {
          const email = user.evidence_p1Sender_emailAddress;
          if(!email) return null;
          const stats = userStats[email];
          const risk_count = user.risk_count;

          let risk_level: 'High' | 'Medium' | 'Low';
          if (risk_count >= 6) risk_level = 'High';
          else if (risk_count >= 3) risk_level = 'Medium';
          else risk_level = 'Low';

          let trend: 'Increasing' | 'Decreasing' | 'Stable';
          if (!stats) {
              trend = 'Stable';
          } else if (stats.recent_violations > stats.previous_violations) {
              trend = 'Increasing';
          } else if (stats.recent_violations < stats.previous_violations) {
              trend = 'Decreasing';
          } else {
              trend = 'Stable';
          }

          return {
              email: email,
              risk_count: risk_count,
              risk_level,
              first_violation: stats ? stats.first_violation : 'N/A',
              last_violation: stats ? stats.last_violation : 'N/A',
              trend,
          };
      }).filter(Boolean) as RiskyUserDetail[];
    } catch (e: any) {
      if (!isTableMissingError(e)) console.error('Error in getRiskyUsersDetails:', e);
      return [];
    }
}

export async function getUserViolations(email: string): Promise<UserViolation[]> {
  noStore();
  try {
    const { data } = await supabaseAdmin
      .from('alerts_processed')
      .select(`
        Title,
        policy_name,
        behavior,
        risk_score,
        created_at,
        next_time (
          whatNotToDoNextTime
        )
      `)
      .eq('classification', 'True_Positive')
      .eq('email_sender', email)
      .order('created_at', { ascending: false })
      .throwOnError();

    if (!data || data.length === 0) {
      return [];
    }

    return data.map((v: any) => ({
      Title: v.Title,
      policy_name: v.policy_name ?? 'Unknown Policy',
      behavior: v.behavior ?? 'Unknown Behavior',
      severity: v.risk_score ?? 0,
      timestamp: v.created_at,
      whatNotToDoNextTime: v.next_time?.whatNotToDoNextTime ?? 'N/A',
    }));
  } catch (err: any) {
    if (!isTableMissingError(err)) console.error(`Error fetching violations for user ${email}:`, err);
    return [];
  }
}

export async function getUserViolationTrend(email: string): Promise<UserViolationTrendPoint[]> {
    noStore();
    try {
      const { data } = await supabaseAdmin
        .from('alerts_processed')
        .select('created_at')
        .eq('classification', 'True_Positive')
        .eq('email_sender', email)
        .throwOnError();

      if (!data) return [];

      const dailyCounts = data.reduce((acc, alert) => {
          const date = new Date(alert.created_at).toISOString().split('T')[0];
          acc[date] = (acc[date] || 0) + 1;
          return acc;
      }, {} as Record<string, number>);

      return Object.entries(dailyCounts).map(([date, count]) => ({ date, count })).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } catch (e: any) {
      if (!isTableMissingError(e)) console.error('Error fetching violation trend:', e);
      return [];
    }
}

export async function getUserBehaviorDistribution(email: string): Promise<UserBehaviorPoint[]> {
    noStore();
    try {
      const { data } = await supabaseAdmin
        .from('alerts_processed')
        .select('behavior')
        .eq('classification', 'True_Positive')
        .eq('email_sender', email)
        .throwOnError();

      if (!data) return [];

      const behaviorCounts = data.reduce((acc, alert) => {
          const behavior = alert.behavior || 'Unknown';
          acc[behavior] = (acc[behavior] || 0) + 1;
          return acc;
      }, {} as Record<string, number>);

      return Object.entries(behaviorCounts).map(([name, value]) => ({ name, value }));
    } catch (e: any) {
      if (!isTableMissingError(e)) console.error('Error fetching behavior distribution:', e);
      return [];
    }
}

export async function getMostViolatedPoliciesByRiskyUsers(): Promise<TopPolicySummary[]> {
  noStore();
  try {
    const { data: riskyUsers } = await supabaseAdmin
      .from('risky_users')
      .select('evidence_p1Sender_emailAddress')
      .throwOnError();
    
    if (!riskyUsers) return [];
    const riskyUserEmails = riskyUsers.map(u => u.evidence_p1Sender_emailAddress).filter(Boolean);

    if (riskyUserEmails.length === 0) return [];

    const { data } = await supabaseAdmin
      .from('alerts_processed')
      .select('policy_name')
      .eq('classification', 'True_Positive')
      .in('email_sender', riskyUserEmails)
      .throwOnError();

    if (!data) return [];
    
    const summaryMap = data.reduce(
      (acc, { policy_name }) => {
        if (!policy_name) return acc;
        acc[policy_name] = (acc[policy_name] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return Object.entries(summaryMap)
      .map(([policy_name, count]) => ({ policy_name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  } catch (e: any) {
    if (!isTableMissingError(e)) console.error('Error fetching most violated policies:', e);
    return [];
  }
}

export type UserDistributionSummary = {
  name: string;
  value: number;
};

export async function getRiskyUsersDistribution(): Promise<UserDistributionSummary[]> {
  noStore();
  try {
    const { data: allAlerts } = await supabaseAdmin
      .from('alerts_processed')
      .select('email_sender')
      .throwOnError();

    const totalUsers = new Set(allAlerts?.map(a => a.email_sender).filter(Boolean) || []).size;
    const riskyUsersCount = await getTotalRiskyUsersCount();
    const nonRiskyUsersCount = Math.max(0, totalUsers - riskyUsersCount);

    return [
      { name: 'Risky Users', value: riskyUsersCount },
      { name: 'Non-Risky Users', value: nonRiskyUsersCount },
    ];
  } catch (e: any) {
    if (!isTableMissingError(e)) console.error('Error in getRiskyUsersDistribution:', e);
    return [];
  }
}

export type NonRiskyUserDetail = {
  email: string;
  total_alerts: number;
};

export async function getNonRiskyUsersDetails(): Promise<NonRiskyUserDetail[]> {
  noStore();
  try {
    const { data: riskyUsers } = await supabaseAdmin
      .from('risky_users')
      .select('evidence_p1Sender_emailAddress')
      .throwOnError();

    const riskyUserEmails = new Set(riskyUsers?.map(u => u.evidence_p1Sender_emailAddress).filter(Boolean) || []);

    const { data: alerts } = await supabaseAdmin
      .from('alerts_processed')
      .select('email_sender')
      .throwOnError();

    if (!alerts) return [];

    const allUserAlerts = alerts.reduce((acc, alert) => {
      if (alert.email_sender && !riskyUserEmails.has(alert.email_sender)) {
        if (!acc[alert.email_sender]) {
          acc[alert.email_sender] = 0;
        }
        acc[alert.email_sender]++;
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(allUserAlerts).map(([email, total_alerts]) => ({
      email,
      total_alerts
    })).sort((a,b) => b.total_alerts - a.total_alerts);
  } catch (e: any) {
    if (!isTableMissingError(e)) console.error('Error in getNonRiskyUsersDetails:', e);
    return [];
  }
}

export type AIAnalyticsData = {
  Title: string;
  policy_name: string;
  total_tokens: number;
  cost_estimation: number;
  first_seen_at: string;
  classification: string;
  email_sender: string;
};

export async function getAIAnalyticsData(): Promise<AIAnalyticsData[]> {
  noStore();
  let allData: any[] = [];
  let from = 0;
  const batchSize = 1000;

  try {
    while (true) {
      const { data, error } = await supabaseAdmin
        .from('alerts_processed')
        .select('Title, policy_name, total_tokens: "Total Tokens", cost_estimation: "Cost Estimation for Tokens", first_seen_at, classification, email_sender')
        .range(from, from + batchSize - 1);
      
      if (error) throw error;
      if (!data || data.length === 0) break;
      allData.push(...data);
      if (data.length < batchSize) break;
      from += batchSize;
    }
    
    const mappedData = allData.map(d => ({
      ...d,
      total_tokens: Number(d.total_tokens) || 0,
      cost_estimation: Number(d.cost_estimation) || 0,
    }));

    return mappedData.filter(d => d.total_tokens != null && d.cost_estimation != null) as AIAnalyticsData[];
  } catch (e: any) {
    if (!isTableMissingError(e)) console.error('Error fetching AI analytics data:', e);
    return [];
  }
}

export type EfficiencyAlert = {
  classification: string;
  first_seen_at: string;
};

export async function getEfficiencyAlerts(): Promise<EfficiencyAlert[]> {
  noStore();
  let allData: any[] = [];
  let from = 0;
  const batchSize = 1000;

  try {
    while (true) {
      const { data, error } = await supabaseAdmin
        .from('alerts_processed')
        .select('classification, first_seen_at')
        .range(from, from + batchSize - 1);

      if (error) throw error;
      if (!data || data.length === 0) break;
      allData.push(...data);
      if (data.length < batchSize) break;
      from += batchSize;
    }
    return (allData as EfficiencyAlert[]) || [];
  } catch (e: any) {
    if (!isTableMissingError(e)) console.error('Error fetching efficiency alerts:', e);
    return [];
  }
}

export type AIEfficiencyData = {
  totalAITimeSeconds: number;
  totalManualTimeSeconds: number;
  totalTimeSavedSeconds: number;
  totalAlerts: number;
  aiTimeBreakdown: { name: string; value: number }[];
  cumulativeTimeSavedTrend: { date: string; hoursSaved: number }[];
};

export async function getAIEfficiencyData(): Promise<AIEfficiencyData> {
  const MANUAL_TIME_PER_ALERT_SECONDS = 300;
  const AI_TIME_TRUE_POSITIVE_SECONDS = 52.5;
  const AI_TIME_FALSE_POSITIVE_SECONDS = 42.5;
  const AI_TIME_REDUNDANT_SECONDS = 6.5;

  try {
    const [
      truePositiveCount,
      falsePositiveCount,
      redundantCount,
      efficiencyAlerts,
    ] = await Promise.all([
      getTruePositiveCount(),
      getFalsePositiveCount(),
      getTotalRedundancyCount(),
      getEfficiencyAlerts(),
    ]);

    const aiTimeForTruePositives = truePositiveCount * AI_TIME_TRUE_POSITIVE_SECONDS;
    const aiTimeForFalsePositives = falsePositiveCount * AI_TIME_FALSE_POSITIVE_SECONDS;
    const aiTimeForRedundant = redundantCount * AI_TIME_REDUNDANT_SECONDS;

    const totalAITimeSeconds = aiTimeForTruePositives + aiTimeForFalsePositives + aiTimeForRedundant;
    
    const totalAlerts = truePositiveCount + falsePositiveCount + redundantCount;
    const totalManualTimeSeconds = totalAlerts * MANUAL_TIME_PER_ALERT_SECONDS;
    const totalTimeSavedSeconds = Math.max(0, totalManualTimeSeconds - totalAITimeSeconds);

    const aiTimeBreakdown = [
      { name: 'True Positives', value: aiTimeForTruePositives },
      { name: 'False Positives', value: aiTimeForFalsePositives },
      { name: 'Redundant Alerts', value: aiTimeForRedundant },
    ];

    const dailyData: Record<string, { truePositives: number, falsePositives: number }> = {};
    efficiencyAlerts.forEach(alert => {
      if (!alert.first_seen_at) return;
      const date = new Date(alert.first_seen_at).toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = { truePositives: 0, falsePositives: 0 };
      }
      if (alert.classification === 'True_Positive') {
        dailyData[date].truePositives++;
      } else if (alert.classification === 'False_Positive') {
        dailyData[date].falsePositives++;
      }
    });

    const totalProcessedAlerts = truePositiveCount + falsePositiveCount;
    const redundantRatio = totalProcessedAlerts > 0 ? redundantCount / totalProcessedAlerts : 0;

    const sortedDates = Object.keys(dailyData).sort((a,b) => new Date(a.getTime()) - new Date(b.getTime()));
    let cumulativeHoursSaved = 0;
    const cumulativeTimeSavedTrend = sortedDates.map(date => {
        const dailyProcessed = dailyData[date].truePositives + dailyData[date].falsePositives;
        const dailyRedundant = Math.round(dailyProcessed * redundantRatio);
        
        const dailyAITime = (dailyData[date].truePositives * AI_TIME_TRUE_POSITIVE_SECONDS) +
                            (dailyData[date].falsePositives * AI_TIME_FALSE_POSITIVE_SECONDS) +
                            (dailyRedundant * AI_TIME_REDUNDANT_SECONDS);

        const dailyManualTime = (dailyProcessed + dailyRedundant) * MANUAL_TIME_PER_ALERT_SECONDS;
        
        const dailyTimeSaved = Math.max(0, dailyManualTime - dailyAITime);
        cumulativeHoursSaved += dailyTimeSaved / 3600;

        return {
            date,
            hoursSaved: parseFloat(cumulativeHoursSaved.toFixed(2))
        };
    });
    
    return {
      totalAITimeSeconds,
      totalManualTimeSeconds,
      totalTimeSavedSeconds,
      totalAlerts,
      aiTimeBreakdown,
      cumulativeTimeSavedTrend,
    };
  } catch (e: any) {
    console.error('Error in getAIEfficiencyData:', e);
    return {
      totalAITimeSeconds: 0,
      totalManualTimeSeconds: 0,
      totalTimeSavedSeconds: 0,
      totalAlerts: 0,
      aiTimeBreakdown: [],
      cumulativeTimeSavedTrend: [],
    };
  }
}

export async function getProcessedAlertsTrendLastHour(): Promise<ProcessedAlertsTrendPoint[]> {
  noStore();
  const oneHourAgo = new Date();
  oneHourAgo.setHours(oneHourAgo.getHours() - 1);

  try {
    const { data } = await supabaseAdmin
      .from('processing_alerts')
      .select('updated_at, status')
      .gte('updated_at', oneHourAgo.toISOString())
      .in('status', ['Completed', 'completed', 'Failed', 'failed'])
      .throwOnError();

    if (!data) return [];

    const now = new Date();
    const buckets = Array.from({ length: 6 }, (_, i) => {
        const bucketTime = new Date(now.getTime() - i * 10 * 60 * 1000);
        bucketTime.setSeconds(0,0);
        const minutes = bucketTime.getMinutes();
        bucketTime.setMinutes(Math.floor(minutes/10) * 10);
        return { time: bucketTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), count: 0, date: bucketTime };
    }).reverse();

    data.forEach(alert => {
      const alertTime = new Date(alert.updated_at);
      for(let i = buckets.length - 1; i >= 0; i--) {
          if(alertTime >= buckets[i].date) {
              buckets[i].count++;
              break;
          }
      }
    });

    return buckets.map(({time, count}) => ({time, count}));
  } catch (e: any) {
    if (!isTableMissingError(e)) console.error('Error fetching processed alerts trend:', e);
    return [];
  }
}

export type ProcessedAlertsTrendPoint = {
  time: string;
  count: number;
};

export async function getPromptLibraryInsights(): Promise<PromptInsight[]> {
  noStore();
  let allData: any[] = [];
  let from = 0;
  const batchSize = 1000;

  try {
    while (true) {
        const { data, error } = await supabaseAdmin
            .from('alerts_processed')
            .select('policy_name, Title, classification_reason, first_seen_at')
            .eq('feedback_referral', 'yes')
            .range(from, from + batchSize - 1);

        if (error) throw error;
        if (!data || data.length === 0) break;
        allData.push(...data);
        if (data.length < batchSize) break;
        from += batchSize;
    }
    return (allData as PromptInsight[]) || [];
  } catch (e: any) {
    if (!isTableMissingError(e)) console.error('Error fetching prompt library insights:', e);
    return [];
  }
}

export async function getLowConfidenceAlerts(): Promise<Alert[]> {
  noStore();
  let allAlerts: any[] = [];
  let from = 0;
  const batchSize = 1000;

  try {
    while (true) {
      const { data, error } = await supabaseAdmin
        .from('alerts_processed')
        .select(`
          Title,
          policy_name,
          classification,
          classification_reason,
          first_seen_at,
          "AI-confidence",
          fingerprint
        `)
        .lt('AI-confidence', 75)
        .range(from, from + batchSize - 1);

      if (error) throw error;
      if (!data || data.length === 0) break;

      allAlerts.push(...data);
      if (data.length < batchSize) break;
      from += batchSize;
    }

    return allAlerts.map(v => ({
        Title: v.Title,
        policy_name: v.policy_name,
        classification: v.classification,
        classification_reason: v.classification_reason,
        first_seen_at: v.first_seen_at,
        AI_confidence: v["AI-confidence"],
        fingerprint: v.fingerprint
    })) as Alert[];
  } catch (e: any) {
    if (!isTableMissingError(e)) console.error('Error fetching low confidence alerts:', e);
    return [];
  }
}
