import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  Play, 
  Pause, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Clock,
  Loader2,
  BarChart3,
  FileText,
  Download
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import clsx from 'clsx';

const BatchAnalyze = () => {
  const [channelLinks, setChannelLinks] = useState('');
  const [jobId, setJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pollingInterval, setPollingInterval] = useState(null);

  // Parse channel links from text input
  const parseChannelLinks = (text) => {
    return text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .filter((line, index, array) => array.indexOf(line) === index); // Remove duplicates
  };

  // Start batch analysis
  const startBatchAnalysis = async () => {
    const links = parseChannelLinks(channelLinks);
    
    if (links.length === 0) {
      toast.error('Please enter at least one valid Telegram channel link');
      return;
    }

    if (links.length > 20) {
      toast.error('Maximum 20 channels allowed per batch');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/batch/analyze', {
        channelLinks: links
      });

      if (response.data.success) {
        setJobId(response.data.jobId);
        toast.success(`Started analysis for ${response.data.totalChannels} channels`);
        startPolling(response.data.jobId);
      }
    } catch (error) {
      console.error('Batch analysis error:', error);
      toast.error(error.response?.data?.error || 'Failed to start batch analysis');
    } finally {
      setLoading(false);
    }
  };

  // Start polling for job status
  const startPolling = (jobId) => {
    // Clear any existing interval
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }

    const interval = setInterval(async () => {
      try {
        const response = await axios.get(`/batch/status/${jobId}`);
        setJobStatus(response.data.job);

        // Stop polling if job is completed
        if (response.data.job.status === 'completed') {
          clearInterval(interval);
          setPollingInterval(null);
          toast.success('Batch analysis completed!');
        }
      } catch (error) {
        console.error('Polling error:', error);
        // Job might have been cleaned up or not found
        if (error.response?.status === 404) {
          clearInterval(interval);
          setPollingInterval(null);
          setJobStatus(null);
        }
      }
    }, 2000); // Poll every 2 seconds

    setPollingInterval(interval);
  };

  // Cancel job
  const cancelJob = async () => {
    if (!jobId) return;

    try {
      await axios.post(`/batch/cancel/${jobId}`);
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
      setJobStatus(null);
      setJobId(null);
      toast.success('Job cancelled successfully');
    } catch (error) {
      console.error('Cancel job error:', error);
      toast.error(error.response?.data?.error || 'Failed to cancel job');
    }
  };

  // Clear all
  const clearAll = () => {
    setChannelLinks('');
    setJobId(null);
    setJobStatus(null);
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'processing': return 'text-blue-600 bg-blue-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getChannelStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'processing': return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Batch Channel Analysis</h1>
        <p className="mt-2 text-gray-600">
          Analyze multiple Telegram channels simultaneously. Enter one channel link per line.
        </p>
      </div>

      {/* Input Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="channelLinks" className="block text-sm font-medium text-gray-700 mb-2">
              Channel Links (one per line)
            </label>
            <textarea
              id="channelLinks"
              value={channelLinks}
              onChange={(e) => setChannelLinks(e.target.value)}
              placeholder="https://t.me/channel1&#10;https://t.me/channel2&#10;@channel3"
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              disabled={!!jobId || loading}
            />
            <p className="mt-1 text-sm text-gray-500">
              {parseChannelLinks(channelLinks).length} unique channels detected
            </p>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={startBatchAnalysis}
              disabled={!!jobId || loading || parseChannelLinks(channelLinks).length === 0}
              className="btn-primary flex items-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              <span>Start Analysis</span>
            </button>

            {jobId && (
              <button
                onClick={cancelJob}
                className="btn-secondary flex items-center space-x-2"
              >
                <Pause className="h-4 w-4" />
                <span>Cancel</span>
              </button>
            )}

            <button
              onClick={clearAll}
              className="btn-secondary flex items-center space-x-2"
            >
              <Trash2 className="h-4 w-4" />
              <span>Clear All</span>
            </button>
          </div>
        </div>
      </div>

      {/* Progress Section */}
      {jobStatus && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Analysis Progress</h2>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(jobStatus.status)}`}>
              {jobStatus.status.toUpperCase()}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{jobStatus.completed} / {jobStatus.total}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(jobStatus.completed / jobStatus.total) * 100}%` }}
              />
            </div>
          </div>

          {/* Channel List */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-gray-900">Channels</h3>
            <div className="max-h-64 overflow-y-auto">
              {jobStatus.channels.map((channel, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-md"
                >
                  <div className="flex items-center space-x-3">
                    {getChannelStatusIcon(channel.status)}
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {channel.link}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500 capitalize">
                    {channel.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results Section */}
      {jobStatus?.status === 'completed' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Analysis Results</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">
                {jobStatus.channels.filter(c => c.status === 'completed').length}
              </div>
              <div className="text-sm text-green-700">Completed</div>
            </div>
            
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-red-600">
                {jobStatus.channels.filter(c => c.status === 'failed').length}
              </div>
              <div className="text-sm text-red-700">Failed</div>
            </div>
            
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <BarChart3 className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600">
                {jobStatus.total}
              </div>
              <div className="text-sm text-blue-700">Total</div>
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={() => window.location.href = '/reports'}
              className="btn-primary flex items-center space-x-2"
            >
              <FileText className="h-4 w-4" />
              <span>View Reports</span>
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="btn-secondary flex items-center space-x-2"
            >
              <Play className="h-4 w-4" />
              <span>New Analysis</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchAnalyze;