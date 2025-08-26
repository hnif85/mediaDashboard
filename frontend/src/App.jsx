import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useParams } from 'react-router-dom';
import { 
  BarChart3, 
  Search, 
  FileText, 
  Shield, 
  AlertTriangle, 
  CheckCircle,
  Download,
  Eye,
  Users,
  TrendingUp,
  Calendar,
  ExternalLink,
  Loader2,
  RefreshCw,
  ArrowRight,
  Globe,
  MessageSquare,
  MessageCircle,
  Heart,
  List,
  Settings
} from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import toast, { Toaster } from 'react-hot-toast';
import axios from 'axios';
import { format } from 'date-fns';
import clsx from 'clsx';
import './index.css' // <-- PASTIKAN BARIS INI ADA
import BatchAnalyze from './components/BatchAnalyze';
import BatchAnalyzeModal from './components/BatchAnalyzeModal';
import QueueManager from './components/QueueManager';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const API_BASE_URL = 'http://localhost:3001/api';

// Configure axios defaults
axios.defaults.baseURL = API_BASE_URL;

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/analyze" element={<AnalyzePage />} />
          <Route path="/queue-manager" element={<QueueManager />} />
          <Route path="/" element={<Dashboard />} />
          <Route path="/analysis/:id" element={<AnalysisDetailPage />} />
        </Routes>
      </main>
    </div>
  );
}

function Navigation() {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: 'Dashboard', icon: BarChart3 },
    { path: '/analyze', label: 'Analyze Channel', icon: Search },
    { path: '/queue-manager', label: 'Queue Manager', icon: Settings },
  ];

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900">Telegram Analyzer</span>
            </Link>
            
            <div className="flex space-x-4">
              {navItems.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  className={clsx(
                    'flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    location.pathname === path
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentAnalyses, setRecentAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBatchModal, setShowBatchModal] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, analysesRes] = await Promise.all([
        axios.get('/reports/stats'),
        axios.get('/analysis?limit=5')
      ]);
      
      setStats(statsRes.data.data);
      setRecentAnalyses(analysesRes.data.data);
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex space-x-4">
          <button
            onClick={fetchDashboardData}
            className="btn-secondary flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setShowBatchModal(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <List className="h-4 w-4" />
            <span>Batch Analyze</span>
          </button>
        </div>
      </div>

      {/* Recent Analyses */}
      <RecentAnalysesTable analyses={recentAnalyses} />

      {/* Batch Analyze Modal */}
      <BatchAnalyzeModal
        isOpen={showBatchModal}
        onClose={() => setShowBatchModal(false)}
      />
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    red: 'bg-red-50 text-red-600'
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

function RatingDistributionChart({ data }) {
  if (!data) return null;

  const chartData = {
    labels: Object.keys(data),
    datasets: [{
      data: Object.values(data),
      backgroundColor: [
        '#10B981', // Green for Legit
        '#F59E0B', // Yellow for Doubtful  
        '#EF4444'  // Red for Scam Risk
      ],
      borderWidth: 0
    }]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom'
      },
      title: {
        display: true,
        text: 'Rating Distribution'
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <Doughnut data={chartData} options={options} />
    </div>
  );
}

function TopScamIndicatorsChart({ data }) {
  if (!data || data.length === 0) return null;

  const chartData = {
    labels: data.map(item => item.indicator),
    datasets: [{
      label: 'Occurrences',
      data: data.map(item => item.count),
      backgroundColor: '#EF4444',
      borderColor: '#DC2626',
      borderWidth: 1
    }]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Top Scam Indicators'
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <Bar data={chartData} options={options} />
    </div>
  );
}

function RecentAnalysesTable({ analyses }) {
  const getRatingColor = (rating) => {
    switch (rating) {
      case 'Legit': return 'text-green-600 bg-green-100';
      case 'Doubtful': return 'text-yellow-600 bg-yellow-100';
      case 'Scam Risk': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Recent Analyses</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Channel
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Subscribers
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trust Score
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rating
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {analyses.map((analysis) => (
              <tr key={analysis.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                        <MessageSquare className="h-5 w-5 text-gray-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {analysis.channel_info?.title || analysis.channel_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        @{analysis.channel_name}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {parseInt(analysis.channel_info?.subscribers || 0).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {analysis.analysis_result?.verdict?.trustScore || 0}/100
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRatingColor(analysis.analysis_result?.verdict?.rating)}`}>
                    {analysis.analysis_result?.verdict?.rating || 'Unknown'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {format(new Date(analysis.created_at), 'MMM dd, yyyy')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <Link
                    to={`/analysis/${analysis.id}`}
                    className="text-primary-600 hover:text-primary-900 flex items-center space-x-1"
                  >
                    <Eye className="h-4 w-4" />
                    <span>View</span>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AnalyzePage() {
  const [channelLink, setChannelLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!channelLink.trim()) {
      toast.error('Please enter a Telegram channel link');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/analysis/analyze', {
        channelLink: channelLink.trim()
      });

      if (response.data.success) {
        setResult(response.data.data);
        toast.success(response.data.cached ? 'Analysis loaded from cache' : 'Analysis completed successfully');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      
      // Handle specific error types with better user messages
      if (error.response?.status === 429) {
        const retryAfter = error.response?.data?.retryAfter || 60;
        toast.error(`Rate limit reached. Please try again in ${retryAfter} seconds.`, {
          duration: 5000
        });
      } else if (error.response?.status === 502) {
        toast.error('Telegram API is temporarily unavailable. Please try again later.');
      } else if (error.response?.status === 400) {
        toast.error(error.response?.data?.message || 'Invalid channel link format');
      } else {
        toast.error(error.response?.data?.error || 'Analysis failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analyze Channel</h1>
        <p className="mt-2 text-gray-600">Enter a Telegram channel link to analyze its legitimacy and engagement.</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleAnalyze} className="space-y-4">
          <div>
            <label htmlFor="channelLink" className="block text-sm font-medium text-gray-700">
              Telegram Channel Link
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <input
                type="text"
                id="channelLink"
                value={channelLink}
                onChange={(e) => setChannelLink(e.target.value)}
                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-primary-500 focus:border-primary-500"
                placeholder="https://t.me/channelname or @channelname"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading}
                className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Analyze
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {result && <AnalysisResult analysis={result} />}
    </div>
  );
}

function AnalysisResult({ analysis }) {
  const result = analysis.analysis_result;
  const info = analysis.channel_info;

  const getRatingColor = (rating) => {
    switch (rating) {
      case 'Legit': return 'text-green-600 bg-green-100 border-green-200';
      case 'Doubtful': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'Scam Risk': return 'text-red-600 bg-red-100 border-red-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Channel Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center">
              <MessageSquare className="h-8 w-8 text-gray-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{info.title}</h2>
              <p className="text-gray-600">@{analysis.channel_name}</p>
              <div className="flex items-center space-x-4 mt-2">
                <span className="flex items-center text-sm text-gray-500">
                  <Users className="h-4 w-4 mr-1" />
                  {parseInt(info.subscribers).toLocaleString()} subscribers
                </span>
                {info.verified && (
                  <span className="flex items-center text-sm text-blue-600">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Verified
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold border ${getRatingColor(result.verdict.rating)}`}>
              {result.verdict.rating}
            </div>
            <div className={`text-3xl font-bold mt-2 ${getScoreColor(result.verdict.trustScore)}`}>
              {result.verdict.trustScore}/100
            </div>
            <div className="text-sm text-gray-500">Trust Score</div>
          </div>
        </div>
        
        {info.description && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-700">{info.description}</p>
          </div>
        )}
      </div>

      {/* Analysis Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <AnalysisSection
          title="Profile Check"
          score={result.profileCheck.score}
          items={[
            { label: 'Bio Consistency', value: result.profileCheck.bioConsistency },
            { label: 'External Links', value: result.profileCheck.externalLinks },
            { label: 'Owner Contact', value: result.profileCheck.ownerContact }
          ]}
        />
        
        <AnalysisSection
          title="Content Check"
          score={result.contentCheck.score}
          items={[
            { label: 'Relevance', value: result.contentCheck.relevance },
            { label: 'Activity Level', value: result.contentCheck.activityLevel },
            { label: 'Engagement Ratio', value: result.contentCheck.engagementMetrics.engagementRatio }
          ]}
        />
        
        <AnalysisSection
          title="Cross Check"
          score={result.crossCheck.score}
          items={[
            { label: 'Official References', value: result.crossCheck.officialReferences },
            { label: 'Inconsistencies', value: result.crossCheck.inconsistencies.length > 0 ? 'Found' : 'None' }
          ]}
        />
      </div>

      {/* Engagement Metrics */}
      <EngagementMetrics metrics={result.contentCheck.engagementMetrics} />

      {/* Scam Indicators */}
      {result.contentCheck.scamIndicators.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h3 className="text-lg font-semibold text-red-800">Scam Indicators Detected</h3>
          </div>
          <ul className="space-y-2">
            {result.contentCheck.scamIndicators.map((indicator, index) => (
              <li key={index} className="flex items-center space-x-2 text-red-700">
                <div className="h-2 w-2 bg-red-400 rounded-full"></div>
                <span>{indicator}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Verdict */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Analysis Verdict</h3>
        <p className="text-gray-700">{result.verdict.explanation}</p>
      </div>
    </div>
  );
}

function AnalysisSection({ title, score, items }) {
  const getScoreColor = (score) => {
    if (score >= 18) return 'text-green-600';
    if (score >= 10) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <span className={`text-xl font-bold ${getScoreColor(score)}`}>
          {score}/25
        </span>
      </div>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="flex justify-between">
            <span className="text-gray-600">{item.label}:</span>
            <span className="font-medium text-gray-900 capitalize">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EngagementMetrics({ metrics }) {
  if (!metrics) return null;

  const engagementCards = [
    {
      label: 'Average Views',
      value: metrics.avgViewsPerPost ? parseInt(metrics.avgViewsPerPost).toLocaleString() : 'N/A',
      icon: Eye,
      color: 'blue'
    },
    {
      label: 'Subscribers',
      value: metrics.subscriberCount ? parseInt(metrics.subscriberCount).toLocaleString() : 'N/A',
      icon: Users,
      color: 'green'
    },
    {
      label: 'Avg Comments',
      value: metrics.avgCommentsPerPost || 'N/A',
      icon: MessageCircle,
      color: 'purple'
    },
    {
      label: 'Avg Reactions',
      value: metrics.avgReactionsPerPost || 'N/A',
      icon: Heart,
      color: 'pink'
    },
    {
      label: 'Engagement Ratio',
      value: metrics.engagementRatio || 'N/A',
      icon: TrendingUp,
      color: 'orange'
    }
  ];

  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    pink: 'bg-pink-50 text-pink-600',
    orange: 'bg-orange-50 text-orange-600'
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Engagement Metrics</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {engagementCards.map((card, index) => (
          <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
            <div className={`inline-flex p-2 rounded-lg ${colorClasses[card.color]}`}>
              <card.icon className="h-5 w-5" />
            </div>
            <div className="mt-2">
              <div className="text-sm font-medium text-gray-600">{card.label}</div>
              <div className="text-lg font-bold text-gray-900">{card.value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReportsPage() {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    rating: '',
    page: 1,
    limit: 10
  });
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    fetchAnalyses();
  }, [filters]);

  const fetchAnalyses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.rating) params.append('rating', filters.rating);
      params.append('page', filters.page);
      params.append('limit', filters.limit);

      const response = await axios.get(`/analysis?${params}`);
      setAnalyses(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Fetch analyses error:', error);
      toast.error('Failed to load analyses');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.rating) params.append('rating', filters.rating);

      const response = await axios.get(`/reports/csv?${params}`, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `telegram-analysis-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Report exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export report');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
        <button
          onClick={handleExportCSV}
          className="btn-primary flex items-center space-x-2"
        >
          <Download className="h-4 w-4" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Rating
            </label>
            <select
              value={filters.rating}
              onChange={(e) => setFilters({ ...filters, rating: e.target.value, page: 1 })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Ratings</option>
              <option value="Legit">Legit</option>
              <option value="Doubtful">Doubtful</option>
              <option value="Scam Risk">Scam Risk</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      ) : (
        <>
          <RecentAnalysesTable analyses={analyses} />
          
          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between bg-white px-6 py-3 rounded-lg shadow">
              <div className="text-sm text-gray-700">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                  disabled={filters.page <= 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                  disabled={filters.page >= pagination.pages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function AnalysisDetailPage() {
  const { id } = useParams();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalysis();
  }, [id]);

  const fetchAnalysis = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/analysis/${id}`);
      setAnalysis(response.data.data);
    } catch (error) {
      console.error('Fetch analysis error:', error);
      toast.error('Failed to load analysis');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Analysis Not Found</h2>
        <p className="mt-2 text-gray-600">The requested analysis could not be found.</p>
        <Link to="/reports" className="mt-4 inline-flex items-center text-primary-600 hover:text-primary-700">
          <ArrowRight className="h-4 w-4 mr-1" />
          Back to Reports
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link to="/reports" className="text-primary-600 hover:text-primary-700">
          <ArrowRight className="h-5 w-5 transform rotate-180" />
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Analysis Details</h1>
      </div>
      
      <AnalysisResult analysis={analysis} />
    </div>
  );
}

export default App;