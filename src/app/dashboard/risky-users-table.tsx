'use client';
import { useState, useMemo } from 'react';
import { RiskyUserDetail } from '@/app/actions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { RiskyUserDialog } from './risky-user-dialog';

type SortableColumn = keyof RiskyUserDetail;

export function RiskyUsersTable({ users }: { users: RiskyUserDetail[] }) {
    const [selectedUser, setSelectedUser] = useState<RiskyUserDetail | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: SortableColumn; direction: 'asc' | 'desc' } | null>({ key: 'risk_count', direction: 'desc' });

    const handleSort = (key: SortableColumn) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (columnKey: SortableColumn) => {
        if (!sortConfig || sortConfig.key !== columnKey) {
          return <ArrowUpDown className="ml-2 h-4 w-4 opacity-30" />;
        }
        return <ArrowUpDown className="ml-2 h-4 w-4" />;
    };

    const sortedUsers = useMemo(() => {
        if (!users) return [];
        let sortableUsers = [...users];
        if (sortConfig !== null) {
            sortableUsers.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableUsers;
    }, [users, sortConfig]);

    const getRiskLevelBadge = (level: 'High' | 'Medium' | 'Low') => {
        switch (level) {
            case 'High': return <Badge variant="destructive">High</Badge>;
            case 'Medium': return <Badge className="bg-yellow-500 text-black">Medium</Badge>;
            case 'Low': return <Badge className="bg-green-600 text-white">Low</Badge>;
        }
    };

    const getTrendIcon = (trend: 'Increasing' | 'Decreasing' | 'Stable') => {
        switch (trend) {
            case 'Increasing': return <span className="flex items-center text-red-500"><ArrowUp className="h-4 w-4 mr-1" /> Increasing</span>;
            case 'Decreasing': return <span className="flex items-center text-green-500"><ArrowDown className="h-4 w-4 mr-1" /> Decreasing</span>;
            case 'Stable': return <span className="flex items-center text-gray-500"><Minus className="h-4 w-4 mr-1" /> Stable</span>;
        }
    };
    
    const formatDate = (dateString: string) => {
        if (!dateString || dateString === 'N/A') return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString();
        } catch (e) {
            return dateString;
        }
    };

    return (
        <>
            <div className="overflow-hidden rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead><Button variant="ghost" onClick={() => handleSort('email')}>User Email {getSortIcon('email')}</Button></TableHead>
                            <TableHead><Button variant="ghost" onClick={() => handleSort('risk_count')}>Risk Count {getSortIcon('risk_count')}</Button></TableHead>
                            <TableHead><Button variant="ghost" onClick={() => handleSort('risk_level')}>Risk Level {getSortIcon('risk_level')}</Button></TableHead>
                            <TableHead><Button variant="ghost" onClick={() => handleSort('first_violation')}>First Violation {getSortIcon('first_violation')}</Button></TableHead>
                            <TableHead><Button variant="ghost" onClick={() => handleSort('last_violation')}>Last Violation {getSortIcon('last_violation')}</Button></TableHead>
                            <TableHead><Button variant="ghost" onClick={() => handleSort('trend')}>Risk Trend {getSortIcon('trend')}</Button></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedUsers.map(user => (
                            <TableRow key={user.email} onClick={() => setSelectedUser(user)} className="cursor-pointer">
                                <TableCell className="font-medium">{user.email}</TableCell>
                                <TableCell>{user.risk_count}</TableCell>
                                <TableCell>{getRiskLevelBadge(user.risk_level)}</TableCell>
                                <TableCell suppressHydrationWarning>{formatDate(user.first_violation)}</TableCell>
                                <TableCell suppressHydrationWarning>{formatDate(user.last_violation)}</TableCell>
                                <TableCell>{getTrendIcon(user.trend)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            {selectedUser && (
                <RiskyUserDialog 
                    user={selectedUser} 
                    open={!!selectedUser} 
                    onOpenChange={(open) => { if (!open) setSelectedUser(null); }}
                />
            )}
        </>
    );
}
