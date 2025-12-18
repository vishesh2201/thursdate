import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

// --- Dummy Data ---
// This is a placeholder. You will replace this with data fetched from your API.
const dummyBlockedAccounts = [
  { id: 1, name: 'Jessica Miller', profilePicUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=80&q=80' },
  { id: 2, name: 'David Chen', profilePicUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=80&q=80' },
  { id: 3, name: 'Sophia Rodriguez', profilePicUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=80&q=80' },
  { id: 4, name: 'Michael Lee', profilePicUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=80&q=80' },
  { id: 5, name: 'Emily White', profilePicUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=80&q=80' },
];

export default function BlockedAccountsPage() {
  const navigate = useNavigate();
  // State to manage the list of blocked accounts
  const [blockedAccounts, setBlockedAccounts] = useState(dummyBlockedAccounts);

  // Future function to handle unblocking a user
  const handleUnblock = (accountId) => {
    // For now, it just filters the user from the local list.
    // Later, you will add an API call here.
    console.log(`Unblocking user with ID: ${accountId}`);
    setBlockedAccounts(currentAccounts =>
      currentAccounts.filter(account => account.id !== accountId)
    );
  };

  return (
    <div
      className="min-h-screen flex flex-col font-sans relative"
      style={{
        backgroundImage: "url('/bgs/faceverifybg.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="absolute inset-0 bg-black/40"></div>
      {/* Top Bar */}
      <div className="relative z-10 p-6 pt-12">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 className="flex-1 text-center text-xl font-semibold text-white">Blocked accounts</h1>
          <div style={{ width: 40 }}></div>
        </div>
      </div>

      {/* Blocked Accounts List */}
      <div className="relative z-10 flex-1 px-6 pb-6">
        {blockedAccounts.length > 0 ? (
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl overflow-hidden">
            {blockedAccounts.map((account, index) => (
              <div
                key={account.id}
                className={`flex items-center justify-between p-4 ${index < blockedAccounts.length - 1 ? 'border-b border-white/10' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <img
                    src={account.profilePicUrl}
                    alt={account.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <p className="font-semibold text-white">{account.name}</p>
                </div>
                <button
                  onClick={() => handleUnblock(account.id)}
                  className="bg-white text-black text-sm font-semibold px-4 py-2 rounded-lg hover:bg-white/90 transition-colors"
                >
                  Unblock
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-white/60">You haven't blocked any accounts.</p>
          </div>
        )}
      </div>
    </div>
  );
}