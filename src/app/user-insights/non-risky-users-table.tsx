'use client';
import { useState, useMemo } from 'react';
import { NonRiskyUserDetail } from '@/app/actions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowUpDown } from 'lucide-react';

type SortableColumn = keyof NonRiskyUserDetail;
const PAGE_SIZE = 5;

export function NonRiskyUsersTable({ users }: { users: NonRiskyUserDetail[] }) {
    const [sortConfig, setSortConfig] = useState<{ key: SortableColumn; direction: 'asc' | 'desc' } | null>({ key: 'total_alerts', direction: 'desc' });
    const [currentPage, setCurrentPage] = useState(1);

    const handleSort = (key: SortableColumn) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
        setCurrentPage(1);
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

    const totalPages = sortedUsers.length > 0 ? Math.ceil(sortedUsers.length / PAGE_SIZE) : 1;
    const paginatedUsers = sortedUsers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    const handlePrevious = () => {
        setCurrentPage((prev) => Math.max(prev - 1, 1));
    };

    const handleNext = () => {
        setCurrentPage((prev) => Math.min(prev + 1, totalPages));
    };

    return (
        <>
            <div className="overflow-hidden rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead><Button variant="ghost" onClick={() => handleSort('email')}>User Email {getSortIcon('email')}</Button></TableHead>
                            <TableHead><Button variant="ghost" onClick={() => handleSort('total_alerts')}>Total Alerts {getSortIcon('total_alerts')}</Button></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedUsers.map(user => (
                            <TableRow key={user.email}>
                                <TableCell className="font-medium">{user.email}</TableCell>
                                <TableCell>{user.total_alerts}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2">
                    <Button
                        onClick={handlePrevious}
                        disabled={currentPage === 1}
                        variant="outline"
                        size="sm"
                    >
                        Previous
                    </Button>
                    <Button
                        onClick={handleNext}
                        disabled={currentPage === totalPages || sortedUsers.length === 0}
                        variant="outline"
                        size="sm"
                    >
                        Next
                    </Button>
                </div>
                <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                </div>
            </div>
        </>
    );
}
