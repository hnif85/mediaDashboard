import React, { useState, useEffect, useRef } from 'react';
import { 
  BarChart3, 
  Play, 
  Pause, 
  Trash2, 
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import clsx from 'clsx';

const QueueManager = () => {
  const [queueStatus, setQueueStatus] = useState(null);
  const [activeJobs, setActiveJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pollingInterval, setPollingInterval] = useState(null);
  
  // Use refs to track latest state for interval callback
  const queueStatusRef = useRef(null);
  const activeJobsRef = useRef([]);

  // Fetch queue status
  const fetchQueueStatus = async () => {
    try {
      const [statusRes, jobsRes] = await Promise.all([
        axios.get('/batch/queue-status'),
        axios.get('/batch/active')
      ]);

      const newQueueStatus = statusRes.data;
      const newActiveJobs = jobsRes.data.activeJobs;

      setQueueStatus(newQueueStatus);
      setActiveJobs(newActiveJobs);
      
      // Update refs with latest values
      queueStatusRef.current = newQueueStatus;
      activeJobsRef.current = newActiveJobs;

      // Resume polling if there are new jobs and polling was stopped
      if (!pollingInterval && (newQueueStatus.queueLength > 0 || newActiveJobs.length > 0)) {
        startPolling();
      }

    } catch (error) {
      console.error('Queue status error:', error);
      toast.error('Failed to fetch queue status');
    } finally {
      setLoading(false);
    }
  };

  // Start polling
  const startPolling = () => {
    const interval = setInterval(async () => {
      await fetchQueueStatus();
      
      // Stop polling if queue is empty and no active jobs (use refs for latest values)
      if (queueStatusRef.current?.queueLength === 0 && activeJobsRef.current.length === 0) {
        stopPolling();
      }
    }, 3000); // Poll every 3 seconds
    setPollingInterval(interval);
  };

  // Stop polling
  const stopPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  };

  // Toggle polling
  const togglePolling = () => {
    if (pollingInterval) {
      stopPolling();
    } else {
      startPolling();
    }
  };

  // Cancel job
  const cancelJob = async (jobId) => {
    try {
      await axios.post(`/batch/cancel/${jobId}`);
      toast.success('Job cancelled successfully');
      fetchQueueStatus(); // Refresh status
    } catch (error) {
      console.error('Cancel job error:', error);
      toast.error(error.response?.data?.error || 'Failed to cancel job');
    }
  };

  // Clean up on unmount
  useEffect(() => {
    fetchQueueStatus();
    startPolling();

    return () => {
      stopPolling();
    };
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'processing': return 'text-blue-600 bg-blue-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'processing': return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'failed': return <XCircle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Queue Manager</h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={togglePolling}
            className={clsx(
              'btn-secondary flex items-center space-x-2',
              pollingInterval && 'bg-blue-100 text-blue-700'
            )}
          >
            {pollingInterval ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            <span>{pollingInterval ? 'Pause' : 'Resume'} Auto-Refresh</span>
          </button>
          
          <button
            onClick={fetchQueueStatus}
            className="btn-secondary flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Queue Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="inline-flex p-3 rounded-lg bg-blue-50 text-blue-600 mb-3">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {queueStatus?.queueLength || 0}
          </div>
          <div className="text-sm text-gray-600">Pending Jobs</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="inline-flex p-3 rounded-lg bg-green-50 text-green-600 mb-3">
            <Play className="h-6 w-6" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {queueStatus?.activeJobs?.length || 0}
          </div>
          <div className="text-sm text-gray-600">Active Jobs</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="inline-flex p-3 rounded-lg bg-purple-50 text-purple-600 mb-3">
            <Loader2 className="h-6 w-6" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {queueStatus?.processing ? 'Yes' : 'No'}
          </div>
          <div className="text-sm text-gray-600">Processing</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="inline-flex p-3 rounded-lg bg-gray-50 text-gray-600 mb-3">
            <Clock className="h-6 w-6" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {activeJobs.reduce((total, job) => total + job.total, 0)}
          </div>
          <div className="text-sm text-gray-600">Total Channels</div>
        </div>
      </div>

      {/* Active Jobs */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Active Jobs</h2>
        </div>
        
        {activeJobs.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>No active jobs</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Job ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Channels
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Started
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {activeJobs.map((job) => (
                  <tr key={job.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {job.id.slice(-8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                        {getStatusIcon(job.status)}
                        <span className="ml-1">{job.status.toUpperCase()}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary-600 h-2 rounded-full"
                            style={{ width: `${(job.completed / job.total) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">
                          {job.completed}/{job.total}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {job.total}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(job.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => cancelJob(job.id)}
                        className="text-red-600 hover:text-red-900 flex items-center space-x-1"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Cancel</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* System Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">System Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-2">Queue Information</h3>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Queue Length</dt>
                <dd className="text-sm font-medium">{queueStatus?.queueLength || 0}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Active Jobs</dt>
                <dd className="text-sm font-medium">{queueStatus?.activeJobs?.length || 0}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Processing</dt>
                <dd className="text-sm font-medium">{queueStatus?.processing ? 'Yes' : 'No'}</dd>
              </div>
            </dl>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-2">Performance</h3>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Max Concurrent</dt>
                <dd className="text-sm font-medium">2 channels</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Rate Limit</dt>
                <dd className="text-sm font-medium">1 request/sec</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Auto Refresh</dt>
                <dd className="text-sm font-medium">{pollingInterval ? 'Enabled' : 'Disabled'}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QueueManager;