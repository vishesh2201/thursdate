import { useNavigate } from 'react-router-dom';

const requestPacks = [
  { id: 'dr1', amount: 1, price: 299 },
  { id: 'dr2', amount: 5, price: 549 },
  { id: 'dr3', amount: 10, price: 999 },
];

export default function DirectRequestsPage() {
  const navigate = useNavigate();

  const handlePurchase = (pack) => {
    console.log(`Purchase initiated for ${pack.amount} Direct Request(s) at ₹${pack.price}`);
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
          <h1 className="flex-1 text-center text-xl font-semibold text-white">Direct Messages</h1>
          <div style={{ width: 40 }}></div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center px-6 pb-6 text-center">
        <p className="text-white/80 mb-6 text-left">
          Direct Messages are a way to let us know that you're really interested in connecting with another member.
        </p>

        <div className="w-full max-w-sm space-y-4">
          {requestPacks.map((pack) => (
            <button
              key={pack.id}
              onClick={() => handlePurchase(pack)}
              className="w-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white text-sm py-4 px-6 rounded-2xl transition-colors font-medium"
            >
              {pack.amount} Direct Request{pack.amount > 1 ? 's' : ''} for ₹ {pack.price}
            </button>
          ))}
        </div>

        <button
          onClick={() => navigate(-1)}
          className="mt-8 text-white/80 hover:text-white font-semibold"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}