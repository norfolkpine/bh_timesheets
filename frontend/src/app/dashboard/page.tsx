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

export default function DashboardPage() {
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
      setTimesheets(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError('Failed to load timesheets');
      console.error('Error loading timesheets:', err);
      setTimesheets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    router.push('/timesheets/new');
  };

  // Calculate statistics
  const pendingCount = Array.isArray(timesheets) ? timesheets.filter(t => t.status === 'submitted').length : 0;
  const totalHours = Array.isArray(timesheets) ? timesheets.reduce((sum, t) => sum + (t.total_hours || 0), 0) : 0;

  return (
    <div className="container mx-auto py-8">
      <div className="grid gap-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-2">Welcome to Your Dashboard</h1>
          <p className="text-gray-600">Manage your timesheets and track your work hours.</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Create Timesheet</CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={handleCreateNew} className="w-full">
                New Timesheet
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Pending Approval</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-sm text-gray-500">Timesheets waiting for approval</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Total Hours This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{totalHours}</p>
              <p className="text-sm text-gray-500">Hours logged this month</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Timesheets */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Recent Timesheets</h2>
          </div>
          <div className="p-6">
            {loading ? (
              <div>Loading timesheets...</div>
            ) : error ? (
              <div className="text-red-500">{error}</div>
            ) : !Array.isArray(timesheets) ? (
              <div className="text-red-500">Invalid timesheet data received</div>
            ) : timesheets.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No timesheets found</p>
                <Button onClick={handleCreateNew} className="mt-4">
                  Create Your First Timesheet
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {timesheets.slice(0, 5).map((timesheet) => (
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

                {timesheets.length > 5 && (
                  <div className="text-center">
                    <Button
                      variant="outline"
                      onClick={() => router.push('/timesheets')}
                    >
                      View All Timesheets
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 