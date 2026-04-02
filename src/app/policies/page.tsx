'use client';

import { useState, useEffect, FormEvent, useRef, useMemo } from 'react';
import { AppLayout } from '@/components/app-layout';
import { getPolicies, Policy } from '@/app/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Upload, ArrowUpDown } from 'lucide-react';
import { SupabaseStatus } from '@/components/supabase-status';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


const POLICIES_PER_PAGE = 5;
type SortableColumn = keyof Policy;

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [filter, setFilter] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: SortableColumn; direction: 'asc' | 'desc' } | null>({ key: 'Policy_ID', direction: 'asc' });

  useEffect(() => {
    const fetchPolicies = async () => {
      setLoading(true);
      const data = await getPolicies();
      setPolicies(data);
      setLoading(false);
    };
    fetchPolicies();
  }, []);
  
  const handleSort = (key: SortableColumn) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };
  
  const sortedAndFilteredPolicies = useMemo(() => {
    let filteredPolicies = policies;
    if (filter) {
      filteredPolicies = policies.filter(policy => 
        policy.Policy_Name.toLowerCase().includes(filter.toLowerCase()) ||
        policy.Policy_Description.toLowerCase().includes(filter.toLowerCase())
      );
    }

    if (sortConfig !== null) {
      return [...filteredPolicies].sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return filteredPolicies;
  }, [policies, filter, sortConfig]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpload = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedFile) {
      toast({
        variant: 'destructive',
        title: 'No file selected',
        description: 'Please select a document to upload.',
      });
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('fileName', selectedFile.name);
    formData.append('fileSize', selectedFile.size.toString());
    formData.append('fileType', selectedFile.type);
    formData.append('lastModified', new Date(selectedFile.lastModified).toISOString());

    try {
      const response = await fetch('https://tst-n8n3.app.n8n.cloud/webhook-test/policy', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed. Please try again.');
      }

      toast({
        title: 'Upload Successful',
        description: `"${selectedFile.name}" has been sent for processing.`,
      });

      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setIsDialogOpen(false);

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const totalPages = sortedAndFilteredPolicies.length > 0 ? Math.ceil(sortedAndFilteredPolicies.length / POLICIES_PER_PAGE) : 1;
  const startIndex = (currentPage - 1) * POLICIES_PER_PAGE;
  const endIndex = startIndex + POLICIES_PER_PAGE;
  const currentPolicies = sortedAndFilteredPolicies.slice(startIndex, endIndex);

  const handlePrevious = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNext = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const getSortIcon = (columnKey: SortableColumn) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      return <ArrowUpDown className="ml-2 h-4 w-4 opacity-30" />;
    }
    return <ArrowUpDown className="ml-2 h-4 w-4" />;
  };

  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <header className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Policies</h1>
          <div className="flex items-center gap-4">
            <SupabaseStatus />
            <ThemeSwitcher />
          </div>
        </header>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle>Data Loss Prevention Policies</CardTitle>
                    <CardDescription>
                      These are the policies currently enforced by the DLP system.
                    </CardDescription>
                  </div>
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Upload className="mr-2 h-4 w-4" />
                        Add Policy
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <form onSubmit={handleUpload}>
                        <DialogHeader>
                          <DialogTitle>Add a New Policy</DialogTitle>
                          <DialogDescription>
                            Upload a policy document. The document will be sent to the workflow for processing.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <Input
                            id="policy-document"
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            disabled={isUploading}
                          />
                        </div>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button type="button" variant="outline" disabled={isUploading}>
                              Cancel
                            </Button>
                          </DialogClose>
                          <Button type="submit" disabled={!selectedFile || isUploading}>
                            {isUploading ? 'Uploading...' : 'Upload'}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <Input
                      placeholder="Search policies..."
                      value={filter}
                      onChange={(e) => {
                        setFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="max-w-sm"
                    />
                  </div>
                  {loading ? (
                    <div className="space-y-2">
                      {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : sortedAndFilteredPolicies && sortedAndFilteredPolicies.length > 0 ? (
                    <>
                      <div className="overflow-hidden rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[120px]">
                                <Button variant="ghost" onClick={() => handleSort('Policy_ID')}>
                                  Policy ID
                                  {getSortIcon('Policy_ID')}
                                </Button>
                              </TableHead>
                              <TableHead>
                                <Button variant="ghost" onClick={() => handleSort('Policy_Name')}>
                                  Policy Name
                                  {getSortIcon('Policy_Name')}
                                </Button>
                              </TableHead>
                              <TableHead>Description</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {currentPolicies.map((policy) => (
                              <TableRow key={policy.Policy_ID}>
                                <TableCell className="font-medium">{policy.Policy_ID}</TableCell>
                                <TableCell>{policy.Policy_Name}</TableCell>
                                <TableCell className="text-muted-foreground">{policy.Policy_Description}</TableCell>
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
                            disabled={currentPage === totalPages || sortedAndFilteredPolicies.length === 0}
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
                  ) : (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>No Policies Found</AlertTitle>
                      <AlertDescription>
                        No policies found matching your search criteria.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>
              <p>This table lists all the data loss prevention policies currently in effect. You can add new policies or search for existing ones.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </AppLayout>
  );
}
