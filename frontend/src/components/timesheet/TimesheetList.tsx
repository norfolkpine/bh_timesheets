'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { timesheetService, TimesheetResponse } from '@/services/timesheet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  submitted: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  pending_payment: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-purple-100 text-purple-800',
};

export default function TimesheetList() {
  const [timesheets, setTimesheets] = useState<TimesheetResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadTimesheets();
  }, []);

  const loadTimesheets = async () => {
    try {
      setLoading(true);
      const data = await timesheetService.getTimesheets();
      setTimesheets(data);
      setError(null);
    } catch (err) {
      setError('Failed to load timesheets');
      console.error('Error loading timesheets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    router.push('/timesheets/new');
  };

  if (loading) {
    return <div>Loading timesheets...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">My Timesheets</h1>
        <Button onClick={handleCreateNew}>Create New Timesheet</Button>
      </div>

      <div className="grid gap-4">
        {timesheets.map((timesheet) => (
          <Card key={timesheet.uuid} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">
                {format(new Date(timesheet.week_starting), 'MMMM d, yyyy')}
              </CardTitle>
              <Badge className={statusColors[timesheet.status]}>
                {timesheet.status.replace('_', ' ').toUpperCase()}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Project</p>
                  <p className="font-medium">{timesheet.project.name}</p>
                  <p className="text-sm text-gray-500">Client</p>
                  <p className="font-medium">{timesheet.project.customer.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Hours</p>
                  <p className="font-medium">{timesheet.total_hours}</p>
                  {timesheet.submitted_at && (
                    <>
                      <p className="text-sm text-gray-500">Submitted</p>
                      <p className="font-medium">
                        {format(new Date(timesheet.submitted_at), 'MMM d, yyyy')}
                      </p>
                    </>
                  )}
                </div>
              </div>
              <div className="mt-4 flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/timesheets/${timesheet.uuid}`)}
                >
                  View Details
                </Button>
                {timesheet.status === 'draft' && (
                  <Button
                    variant="default"
                    onClick={() => router.push(`/timesheets/${timesheet.uuid}/edit`)}
                  >
                    Edit
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {timesheets.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No timesheets found</p>
            <Button onClick={handleCreateNew} className="mt-4">
              Create Your First Timesheet
            </Button>
          </div>
        )}
      </div>
    </div>
  );
} 