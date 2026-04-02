'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  getUserViolations,
  getUserViolationTrend,
  getUserBehaviorDistribution,
  RiskyUserDetail,
  UserViolation,
  UserViolationTrendPoint,
  UserBehaviorPoint
} from '@/app/actions';
import { UserViolationTrendChart } from './user-violation-trend-chart';
import { UserBehaviorDistributionChart } from './user-behavior-distribution-chart';
import { Button } from '@/components/ui/button';

interface RiskyUserDialogProps {
  user: RiskyUserDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RiskyUserDialog({ user, open, onOpenChange }: RiskyUserDialogProps) {
  const [violations, setViolations] = useState<UserViolation[]>([]);
  const [trendData, setTrendData] = useState<UserViolationTrendPoint[]>([]);
  const [behaviorData, setBehaviorData] = useState<UserBehaviorPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (user) {
        setLoading(true);
        const [userViolations, violationTrend, behaviorDistribution] = await Promise.all([
          getUserViolations(user.email),
          getUserViolationTrend(user.email),
          getUserBehaviorDistribution(user.email),
        ]);
        setViolations(userViolations);
        setTrendData(violationTrend);
        setBehaviorData(behaviorDistribution);
        setLoading(false);
      }
    }
    fetchData();
  }, [user]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl bg-[#292828]">
        <DialogHeader>
          <DialogTitle>Risky User Details: {user.email}</DialogTitle>
          <DialogDescription>
            A detailed view of the user's violations and behavior.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto p-4">
          <Card>
            <CardHeader>
              <CardTitle>Violation Trend</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-[250px] w-full" /> : <UserViolationTrendChart data={trendData} />}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Behavior Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-[250px] w-full" /> : <UserBehaviorDistributionChart data={behaviorData} />}
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Violated Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                    {[...Array(5)].map((_,i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : (
                <div className="overflow-auto max-h-96">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Alert Title</TableHead>
                        <TableHead>Policy Name</TableHead>
                        <TableHead>Behavior</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>What not to do next time</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {violations.map((violation, index) => (
                        <TableRow key={index}>
                          <TableCell>{violation.Title}</TableCell>
                          <TableCell>{violation.policy_name}</TableCell>
                          <TableCell>{violation.behavior}</TableCell>
                          <TableCell>{violation.severity}</TableCell>
                          <TableCell suppressHydrationWarning>{new Date(violation.timestamp).toLocaleString()}</TableCell>
                          <TableCell><div className="whitespace-pre-wrap break-words min-w-[200px]">{violation.whatNotToDoNextTime}</div></TableCell>
                           <TableCell>
                            <Button 
                                size="sm" 
                                onClick={() => {
                                    window.location.href = `mailto:${user.email}?body=${encodeURIComponent(violation.whatNotToDoNextTime || 'Please review your recent activity and adhere to our security policies.')}`;
                                }}
                            >
                                Escalate
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
