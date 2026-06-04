import { Link } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';

export default function Navbar({ user }) {
  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* The SoulSync Name is always here */}
        <Link to="/" className="flex items-center text-xl font-bold text-[#2F4F4F] tracking-tight hover:opacity-80 transition-opacity">
          <img 
            src="/logo-svg1.png" 
            alt="SoulSync Logo" 
            className="w-6 h-6 mr-2 object-contain drop-shadow-sm" 
          />
          Soul<span className="text-[#1d6237]">Sync</span>
        </Link>
        
        {/* Only show the Profile and Logout if they are logged in */}
        {user ? (
          <div className="flex items-center space-x-4">
            <img 
              src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email}&background=2F4F4F&color=fff`} 
              alt="Profile" 
              className="w-8 h-8 rounded-full border border-gray-200"
            />
            <button 
              onClick={handleLogout}
              className="text-sm font-medium text-gray-500 hover:text-red-600 transition-colors"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <div className="text-sm font-medium text-gray-500">
            Find your focus
          </div>
        )}
        
      </div>
    </nav>
  );
}