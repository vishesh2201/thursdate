import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI, authAPI } from '../../utils/api';

export default function AdminReports() {
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchReports();
  }, [statusFilter]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminAPI.getAllReports(statusFilter);
      setReports(data.reports);
      setStats({
        total: data.total,
        pending: data.pending,
        reviewed: data.reviewed,
        actionTaken: data.actionTaken
      });
    } catch (err) {
      setError(err.message);
      if (err.message.includes('Admin access required')) {
        authAPI.logout();
        navigate('/admin-login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authAPI.logout();
    navigate('/admin-login');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'reviewed':
        return 'bg-blue-100 text-blue-700';
      case 'action_taken':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getReasonLabel = (reason) => {
    const labels = {
      'inappropriate_messages': 'Inappropriate Messages',
      'fake_profile': 'Fake Profile',
      'harassment': 'Harassment',
      'spam': 'Spam',
      'other': 'Other'
    };
    return labels[reason] || reason;
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col bg-white font-sans">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-2">
            <button onClick={() => navigate('/admin')} className="w-6 h-6 flex items-center justify-center">
              <img src="/backarrow.svg" alt="Back" width={24} height={24} />
            </button>
            <div className="text-gray-400 text-[14px] font-semibold mx-auto">
              User Reports
            </div>
            <button onClick={handleLogout} className="text-red-500 text-sm">
              Logout
            </button>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">Loading reports...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white font-sans">
      {/* Top Bar */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => navigate('/admin')} className="w-6 h-6 flex items-center justify-center">
            <img src="/backarrow.svg" alt="Back" width={24} height={24} />
          </button>
          <div className="text-gray-400 text-[14px] font-semibold mx-auto">
            User Reports
          </div>
          <button onClick={handleLogout} className="text-red-500 text-sm">
            Logout
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-20 px-4">
        <div className="max-w-md mx-auto w-full pt-4">
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4">
              {error}
            </div>
          )}

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-4 gap-2 mb-6">
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <div className="text-lg font-bold text-gray-800">{stats.total}</div>
                <div className="text-xs text-gray-500">Total</div>
              </div>
              <div className="bg-yellow-50 rounded-xl p-3 text-center">
                <div className="text-lg font-bold text-yellow-600">{stats.pending}</div>
                <div className="text-xs text-yellow-600">Pending</div>
              </div>
              <div className="bg-blue-50 rounded-xl p-3 text-center">
                <div className="text-lg font-bold text-blue-600">{stats.reviewed}</div>
                <div className="text-xs text-blue-600">Reviewed</div>
              </div>
              <div className="bg-green-50 rounded-xl p-3 text-center">
                <div className="text-lg font-bold text-green-600">{stats.actionTaken}</div>
                <div className="text-xs text-green-600">Action</div>
              </div>
            </div>
          )}

          {/* Filter */}
          <div className="mb-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
            >
              <option value="">All Reports</option>
              <option value="pending">Pending Only</option>
              <option value="reviewed">Reviewed Only</option>
              <option value="action_taken">Action Taken</option>
            </select>
          </div>

          {/* Reports List */}
          {reports.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg mb-2">No reports found</div>
              <div className="text-gray-500 text-sm">
                {statusFilter ? 'Try changing the filter' : 'All clear! No reports yet.'}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => (
                <button
                  key={report.id}
                  onClick={() => navigate(`/admin/reports/${report.id}`)}
                  className="w-full bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-500 hover:shadow-md transition-all text-left"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800 text-sm mb-1">
                        {report.reportedUser.firstName} {report.reportedUser.lastName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {report.reportedUser.email}
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                      {report.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Reason */}
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="text-sm text-gray-700 font-medium">
                      {getReasonLabel(report.reason)}
                    </span>
                  </div>

                  {/* Description Preview */}
                  {report.description && (
                    <div className="text-xs text-gray-600 mb-2 line-clamp-2">
                      "{report.description}"
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100">
                    <span>Reported {formatDate(report.createdAt)}</span>
                    <span className="font-medium">{report.totalReportsAgainstUser} total reports</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
