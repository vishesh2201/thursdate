import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI, authAPI } from '../../utils/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await adminAPI.getDashboardStats();
        setStats(data);
      } catch (err) {
        setError(err.message);
        if (err.message.includes('Admin access required')) {
          // Redirect to login if not admin
          authAPI.logout();
          navigate('/admin-login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [navigate]);

  const handleLogout = () => {
    authAPI.logout();
    navigate('/admin-login');
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col bg-white font-sans">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-2">
            <button onClick={() => navigate(-1)} className="w-6 h-6 flex items-center justify-center">
              <img src="/backarrow.svg" alt="Back" width={24} height={24} />
            </button>
            <div className="text-gray-400 text-[14px] font-semibold mx-auto">
              Admin Dashboard
            </div>
            <button onClick={handleLogout} className="text-red-500 text-sm">
              Logout
            </button>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex flex-col bg-white font-sans">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-2">
            <button onClick={() => navigate(-1)} className="w-6 h-6 flex items-center justify-center">
              <img src="/backarrow.svg" alt="Back" width={24} height={24} />
            </button>
            <div className="text-gray-400 text-[14px] font-semibold mx-auto">
              Admin Dashboard
            </div>
            <button onClick={handleLogout} className="text-red-500 text-sm">
              Logout
            </button>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-red-500 text-center">
            <div className="text-lg font-semibold mb-2">Error</div>
            <div className="text-sm">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white font-sans">
      {/* Top Bar */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => navigate(-1)} className="w-6 h-6 flex items-center justify-center">
            <img src="/backarrow.svg" alt="Back" width={24} height={24} />
          </button>
          <div className="text-gray-400 text-[14px] font-semibold mx-auto">
            Admin Dashboard
          </div>
          <button onClick={handleLogout} className="text-red-500 text-sm">
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto pb-20 px-4">
        <div className="max-w-md mx-auto w-full pt-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalUsers}</div>
              <div className="text-xs text-blue-500">Total Users</div>
            </div>
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.approvedUsers}</div>
              <div className="text-xs text-green-500">Approved</div>
            </div>
            <div className="bg-yellow-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.pendingUsers}</div>
              <div className="text-xs text-yellow-500">Pending</div>
            </div>
            <div className="bg-purple-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.recentRegistrations}</div>
              <div className="text-xs text-purple-500">New (7 days)</div>
            </div>
          </div>

          {/* Additional Stats */}
          <div className="bg-gray-50 rounded-xl p-4 mb-8">
            <div className="text-sm text-gray-600 mb-2">Additional Statistics</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Onboarding Complete:</span>
                <span className="font-semibold">{stats.completedOnboarding}</span>
              </div>
              <div className="flex justify-between">
                <span>With Profile Picture:</span>
                <span className="font-semibold">{stats.usersWithProfilePic}</span>
              </div>
              <div className="flex justify-between">
                <span>Approval Rate:</span>
                <span className="font-semibold">{stats.approvalRate}%</span>
              </div>
            </div>
          </div>

          {/* Navigation Cards */}
          <div className="space-y-4">
            <button
              onClick={() => navigate('/admin/reports')}
              className="w-full bg-red-500 text-white p-4 rounded-xl text-left hover:bg-red-600 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">User Reports</div>
                  <div className="text-sm opacity-90">Review reported users and take action</div>
                </div>
                <div className="text-2xl">→</div>
              </div>
            </button>

            <button
              onClick={() => navigate('/admin/waitlist')}
              className="w-full bg-yellow-500 text-white p-4 rounded-xl text-left hover:bg-yellow-600 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">Waitlist Management</div>
                  <div className="text-sm opacity-90">{stats.pendingUsers} users pending approval</div>
                </div>
                <div className="text-2xl">→</div>
              </div>
            </button>

            <button
              onClick={() => navigate('/admin/users')}
              className="w-full bg-blue-500 text-white p-4 rounded-xl text-left hover:bg-blue-600 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">All Users</div>
                  <div className="text-sm opacity-90">View and manage all users</div>
                </div>
                <div className="text-2xl">→</div>
              </div>
            </button>

            <button
              onClick={() => navigate('/admin/users', { state: { filter: 'approved' } })}
              className="w-full bg-green-500 text-white p-4 rounded-xl text-left hover:bg-green-600 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">Approved Users</div>
                  <div className="text-sm opacity-90">{stats.approvedUsers} approved users</div>
                </div>
                <div className="text-2xl">→</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 