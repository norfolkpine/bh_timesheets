'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TimesheetHeader } from '@/components/timesheet-header';
import { TimesheetList } from '@/components/timesheet-list';
import { TimesheetEntry } from '@/components/timesheet-entry';
import { TimesheetApproval } from '@/components/timesheet-approval';
import { timesheetService } from '@/services/timesheet';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Timesheet, User, UserRole } from '@/types/timesheet';

export default function TimesheetsPage() {
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'list' | 'entry' | 'approval'>('list');
  const [selectedTimesheet, setSelectedTimesheet] = useState<Timesheet | null>(null);
  const router = useRouter();

  // Mock current user - in a real app, this would come from authentication
  const [currentUser] = useState<User>({
    id: 'user1',
    name: 'John Doe',
    role: 'employee' as UserRole,
    email: 'john.doe@example.com',
  });

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

  const handleNewTimesheet = () => {
    router.push('/timesheets/new');
  };

  const handleViewTimesheets = () => {
    setActiveView('list');
    setSelectedTimesheet(null);
  };

  const handleViewApprovals = () => {
    setActiveView('approval');
  };

  const handleSaveTimesheet = async (updatedTimesheet: Timesheet) => {
    try {
      await timesheetService.updateTimesheet(updatedTimesheet.uuid, updatedTimesheet);
      await loadTimesheets();
      setActiveView('list');
      setSelectedTimesheet(null);
    } catch (err) {
      console.error('Error saving timesheet:', err);
      setError('Failed to save timesheet');
    }
  };

  const handleSubmitTimesheet = async (timesheet: Timesheet) => {
    try {
      await timesheetService.submitTimesheet(timesheet.uuid);
      await loadTimesheets();
      setActiveView('list');
      setSelectedTimesheet(null);
    } catch (err) {
      console.error('Error submitting timesheet:', err);
      setError('Failed to submit timesheet');
    }
  };

  const handleApproveTimesheet = async (timesheetId: string) => {
    try {
      await timesheetService.approveTimesheet(timesheetId);
      await loadTimesheets();
    } catch (err) {
      console.error('Error approving timesheet:', err);
      setError('Failed to approve timesheet');
    }
  };

  const handleRejectTimesheet = async (timesheetId: string, reason: string) => {
    try {
      await timesheetService.rejectTimesheet(timesheetId, reason);
      await loadTimesheets();
    } catch (err) {
      console.error('Error rejecting timesheet:', err);
      setError('Failed to reject timesheet');
    }
  };

  const handleMarkAsPaid = async (timesheetId: string) => {
    try {
      await timesheetService.markAsPaid(timesheetId);
      await loadTimesheets();
    } catch (err) {
      console.error('Error marking timesheet as paid:', err);
      setError('Failed to mark timesheet as paid');
    }
  };

  const handleSendForPayment = async (timesheetId: string) => {
    try {
      await timesheetService.sendForPayment(timesheetId);
      await loadTimesheets();
    } catch (err) {
      console.error('Error sending timesheet for payment:', err);
      setError('Failed to send timesheet for payment');
    }
  };

  const handleViewInvoice = (employeeName?: string) => {
    // Implement invoice viewing logic
    console.log('View invoice for:', employeeName);
  };

  const handleUndoApproval = async (timesheetId: string) => {
    try {
      await timesheetService.undoApproval(timesheetId);
      await loadTimesheets();
    } catch (err) {
      console.error('Error undoing approval:', err);
      setError('Failed to undo approval');
    }
  };

  return (
    <div className="container mx-auto py-8">
      <TimesheetHeader
        user={currentUser}
        onToggleRole={() => {
          // Implement role toggle logic
          console.log('Toggle role');
        }}
        onNewTimesheet={handleNewTimesheet}
        onViewTimesheets={handleViewTimesheets}
        onViewApprovals={handleViewApprovals}
        activeView={activeView}
      />

      <div className="mt-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <Tabs value={activeView} onValueChange={(value) => setActiveView(value as typeof activeView)}>
          <TabsList>
            <TabsTrigger value="list">My Timesheets</TabsTrigger>
            {currentUser.role === 'manager' && (
              <TabsTrigger value="approval">Approvals</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="list">
            <Card className="mt-4">
              <div className="p-6">
                <TimesheetList
                  onEditTimesheet={(timesheet) => {
                    setSelectedTimesheet(timesheet);
                    setActiveView('entry');
                  }}
                />
              </div>
            </Card>
          </TabsContent>

          {currentUser.role === 'manager' && (
            <TabsContent value="approval">
              <Card className="mt-4">
                <div className="p-6">
                  <TimesheetApproval
                    timesheets={timesheets}
                    onApprove={handleApproveTimesheet}
                    onReject={handleRejectTimesheet}
                    onMarkAsPaid={handleMarkAsPaid}
                    onSendForPayment={handleSendForPayment}
                    onViewInvoice={handleViewInvoice}
                    onUndoApproval={handleUndoApproval}
                  />
                </div>
              </Card>
            </TabsContent>
          )}
        </Tabs>

        {selectedTimesheet && (
          <div className="mt-8">
            <Card>
              <div className="p-6">
                <TimesheetEntry
                  timesheet={selectedTimesheet}
                  onSave={handleSaveTimesheet}
                  onSubmit={handleSubmitTimesheet}
                  onCancel={() => {
                    setSelectedTimesheet(null);
                    setActiveView('list');
                  }}
                />
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
} 