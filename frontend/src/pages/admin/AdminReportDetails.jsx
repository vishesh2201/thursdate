import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { adminAPI, authAPI } from '../../utils/api';

export default function AdminReportDetails() {
  const { reportId } = useParams();
  const [report, setReport] = useState(null);
  const [messages, setMessages] = useState([]);
  const [previousReports, setPreviousReports] = useState([]);
  const [totalReports, setTotalReports] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchReportDetails();
  }, [reportId]);

  const fetchReportDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminAPI.getReportDetails(reportId);
      setReport(data.report);
      setMessages(data.messages || []);
      setPreviousReports(data.previousReports || []);
      setTotalReports(data.totalReportsAgainstUser || 0);
      setAdminNotes(data.report.adminNotes || '');
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

  const handleUpdateStatus = async (newStatus) => {
    try {
      setUpdating(true);
      await adminAPI.updateReportStatus(reportId, newStatus, adminNotes);
      await fetchReportDetails();
      alert('Report status updated successfully');
    } catch (err) {
      alert('Failed to update report: ' + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveNotes = async () => {
    try {
      setUpdating(true);
      await adminAPI.updateReportStatus(reportId, report.status, adminNotes);
      alert('Notes saved successfully');
      await fetchReportDetails();
    } catch (err) {
      alert('Failed to save notes: ' + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = () => {
    authAPI.logout();
    navigate('/admin-login');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  if (loading) {
    return (
      <div className="h-screen flex flex-col bg-white font-sans">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-2">
            <button onClick={() => navigate('/admin/reports')} className="w-6 h-6 flex items-center justify-center">
              <img src="/backarrow.svg" alt="Back" width={24} height={24} />
            </button>
            <div className="text-gray-400 text-[14px] font-semibold mx-auto">
              Report Details
            </div>
            <button onClick={handleLogout} className="text-red-500 text-sm">
              Logout
            </button>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">Loading report...</div>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="h-screen flex flex-col bg-white font-sans">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-2">
            <button onClick={() => navigate('/admin/reports')} className="w-6 h-6 flex items-center justify-center">
              <img src="/backarrow.svg" alt="Back" width={24} height={24} />
            </button>
            <div className="text-gray-400 text-[14px] font-semibold mx-auto">
              Report Details
            </div>
            <button onClick={handleLogout} className="text-red-500 text-sm">
              Logout
            </button>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-red-500">{error || 'Report not found'}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white font-sans">
      {/* Top Bar */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => navigate('/admin/reports')} className="w-6 h-6 flex items-center justify-center">
            <img src="/backarrow.svg" alt="Back" width={24} height={24} />
          </button>
          <div className="text-gray-400 text-[14px] font-semibold mx-auto">
            Report #{reportId}
          </div>
          <button onClick={handleLogout} className="text-red-500 text-sm">
            Logout
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-20 px-4">
        <div className="max-w-md mx-auto w-full pt-4 space-y-4">
          
          {/* Status Badge */}
          <div className="flex justify-center">
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(report.status)}`}>
              {report.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>

          {/* Reported User Info */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="text-xs text-red-600 font-medium mb-2">REPORTED USER</div>
            <div className="flex items-start gap-3">
              {report.reportedUser.profilePicUrl ? (
                <img 
                  src={report.reportedUser.profilePicUrl} 
                  alt={report.reportedUser.firstName}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500 text-sm">
                    {report.reportedUser.firstName?.[0]}
                  </span>
                </div>
              )}
              <div className="flex-1">
                <div className="font-semibold text-gray-800">
                  {report.reportedUser.firstName} {report.reportedUser.lastName}
                </div>
                <div className="text-sm text-gray-600">{report.reportedUser.email}</div>
                {report.reportedUser.gender && (
                  <div className="text-xs text-gray-500">Gender: {report.reportedUser.gender}</div>
                )}
                {report.reportedUser.location && (
                  <div className="text-xs text-gray-500">Location: {report.reportedUser.location}</div>
                )}
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-red-200 text-sm text-red-700 font-medium">
              Total reports against this user: {totalReports}
            </div>
          </div>

          {/* Reporter Info (ADMIN ONLY - NOT VISIBLE TO USERS) */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="text-xs text-blue-600 font-medium mb-2">REPORTED BY (CONFIDENTIAL)</div>
            <div className="flex items-start gap-3">
              {report.reportedBy.profilePicUrl ? (
                <img 
                  src={report.reportedBy.profilePicUrl} 
                  alt={report.reportedBy.firstName}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500 text-sm">
                    {report.reportedBy.firstName?.[0]}
                  </span>
                </div>
              )}
              <div className="flex-1">
                <div className="font-semibold text-gray-800">
                  {report.reportedBy.firstName} {report.reportedBy.lastName}
                </div>
                <div className="text-sm text-gray-600">{report.reportedBy.email}</div>
              </div>
            </div>
          </div>

          {/* Report Details */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="text-xs text-gray-600 font-medium mb-3">REPORT DETAILS</div>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-gray-500 mb-1">Reason</div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-800">
                    {getReasonLabel(report.reason)}
                  </span>
                </div>
              </div>
              
              {report.description && (
                <div>
                  <div className="text-xs text-gray-500 mb-1">Description</div>
                  <div className="text-sm text-gray-700 bg-white p-3 rounded-lg">
                    {report.description}
                  </div>
                </div>
              )}

              <div>
                <div className="text-xs text-gray-500 mb-1">Reported At</div>
                <div className="text-sm text-gray-700">{formatDate(report.createdAt)}</div>
              </div>

              {report.reviewedAt && (
                <div>
                  <div className="text-xs text-gray-500 mb-1">Reviewed At</div>
                  <div className="text-sm text-gray-700">{formatDate(report.reviewedAt)}</div>
                </div>
              )}
            </div>
          </div>

          {/* Conversation Messages */}
          {messages.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="text-xs text-gray-600 font-medium mb-3">
                CONVERSATION CONTEXT (Last 50 messages)
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`p-3 rounded-lg ${
                      msg.sender_id === report.reportedUser.id 
                        ? 'bg-red-50 border border-red-100' 
                        : 'bg-blue-50 border border-blue-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">
                        {msg.sender_id === report.reportedUser.id 
                          ? `${report.reportedUser.firstName} (reported)` 
                          : `${report.reportedBy.firstName} (reporter)`}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(msg.created_at)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-700">
                      {msg.type === 'VOICE' ? '🎤 Voice message' : msg.content}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Previous Reports */}
          {previousReports.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <div className="text-xs text-yellow-700 font-medium mb-3">
                PREVIOUS REPORTS ON THIS USER ({previousReports.length})
              </div>
              <div className="space-y-2">
                {previousReports.map((prevReport) => (
                  <div key={prevReport.id} className="bg-white p-3 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-800">
                        {getReasonLabel(prevReport.reason)}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(prevReport.status)}`}>
                        {prevReport.status}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDate(prevReport.created_at)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Admin Notes */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="text-xs text-gray-600 font-medium mb-3">ADMIN NOTES (INTERNAL)</div>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Add internal notes about this report..."
              className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:border-blue-500"
              rows={4}
            />
            <button
              onClick={handleSaveNotes}
              disabled={updating}
              className="mt-2 w-full py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors disabled:opacity-50"
            >
              {updating ? 'Saving...' : 'Save Notes'}
            </button>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pb-4">
            <div className="text-xs text-gray-600 font-medium mb-2">UPDATE STATUS</div>
            
            {report.status === 'pending' && (
              <>
                <button
                  onClick={() => handleUpdateStatus('reviewed')}
                  disabled={updating}
                  className="w-full py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  {updating ? 'Updating...' : 'Mark as Reviewed'}
                </button>
                <button
                  onClick={() => handleUpdateStatus('action_taken')}
                  disabled={updating}
                  className="w-full py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  {updating ? 'Updating...' : 'Mark as Action Taken'}
                </button>
              </>
            )}

            {report.status === 'reviewed' && (
              <button
                onClick={() => handleUpdateStatus('action_taken')}
                disabled={updating}
                className="w-full py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                {updating ? 'Updating...' : 'Mark as Action Taken'}
              </button>
            )}

            {report.status === 'action_taken' && (
              <div className="text-center text-sm text-gray-500 py-3">
                This report has been marked as action taken
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
