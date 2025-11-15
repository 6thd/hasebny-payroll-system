
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation'; // Import useRouter
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllLeaveRequests, updateLeaveRequestStatus } from '@/app/actions/leave';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import type { LeaveRequest } from '@/types';
import { format } from 'date-fns';
import { ArrowLeft } from 'lucide-react'; // Import ArrowLeft icon

const statusColors: { [key: string]: string } = {
  pending: 'bg-yellow-500',
  approved: 'bg-green-500',
  rejected: 'bg-red-500',
};

export default function LeaveManagementDashboard() {
  const queryClient = useQueryClient();
  const router = useRouter(); // Initialize router
  const [filter, setFilter] = useState('pending');

  const { data: leaveRequests = [], isLoading, error } = useQuery<LeaveRequest[]>({
    queryKey: ['leaveRequests'],
    queryFn: async () => {
        const { requests, error } = await getAllLeaveRequests();
        if (error) {
            throw new Error(error);
        }
        return requests || [];
    },
  });

  const mutation = useMutation({
    mutationFn: ({ leaveId, status }: { leaveId: string, status: 'approved' | 'rejected' }) => 
      updateLeaveRequestStatus(leaveId, status),
    onSuccess: (data) => {
        if(data.success) {
            toast.success(`Leave request ${data.leaveRequest?.status}`);
            queryClient.invalidateQueries({ queryKey: ['leaveRequests'] });
        } else {
            toast.error(`Failed to update status: ${data.error}`);
        }
    },
    onError: (error) => {
        toast.error(`An error occurred: ${error.message}`);
    },
  });

  const handleStatusUpdate = (leaveId: string, status: 'approved' | 'rejected') => {
    mutation.mutate({ leaveId, status });
  };

  if (isLoading) return <p>Loading leave requests...</p>;
  if (error) return <p className="text-red-500">Error fetching leave requests: {error.message}</p>;

  const filteredRequests = leaveRequests.filter(req => filter === 'all' || req.status === filter);

  return (
    <div className="w-full mx-auto p-6 bg-card text-card-foreground rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Button>
          <h1 className="text-2xl font-bold">Leave Requests Management</h1>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')}>All</Button>
          <Button variant={filter === 'pending' ? 'default' : 'outline'} onClick={() => setFilter('pending')}>Pending</Button>
          <Button variant={filter === 'approved' ? 'default' : 'outline'} onClick={() => setFilter('approved')}>Approved</Button>
          <Button variant={filter === 'rejected' ? 'default' : 'outline'} onClick={() => setFilter('rejected')}>Rejected</Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Leave Type</TableHead>
            <TableHead>Dates</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredRequests.map((request) => (
            <TableRow key={request.id}>
              <TableCell>{request.employeeName}</TableCell>
              <TableCell>{request.leaveType}</TableCell>
              <TableCell>
                {format(new Date(request.startDate), 'PPP')} - {format(new Date(request.endDate), 'PPP')}
              </TableCell>
              <TableCell>
                <Badge className={`${statusColors[request.status]} text-white`}>{request.status}</Badge>
              </TableCell>
              <TableCell>
                {request.status === 'pending' && (
                  <div className="flex space-x-2">
                    <Button size="sm" variant="success" onClick={() => handleStatusUpdate(request.id, 'approved')} disabled={mutation.isPending}>
                      Approve
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleStatusUpdate(request.id, 'rejected')} disabled={mutation.isPending}>
                      Reject
                    </Button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
