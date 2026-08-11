import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Leaf } from 'lucide-react';

export default function Login() {
  const setUserRole = useStore((state) => state.setUserRole);
  const setActiveTab = useStore((state) => state.setActiveTab);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (username === 'Admin' && password === '0908483968aA') {
      setUserRole('admin');
      setActiveTab('pos');
    } else if (username === 'nhanvien' && password === 'nhanvien@!123') {
      setUserRole('staff');
      setActiveTab('pos');
    } else if (username === 'bep' && password === 'bep@!123') {
      setUserRole('kitchen');
      setActiveTab('kitchen');
    } else {
      setError('Tên đăng nhập hoặc mật khẩu không đúng');
    }
  };

  return (
    <div className="min-h-screen bg-lime-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-lime-100 p-4 rounded-full w-24 h-24 flex items-center justify-center overflow-hidden">
            <img src="/logo.jpg" alt="Logo" className="w-full h-full object-contain" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Tiệm Chay Giác Ngộ</h1>
        <p className="text-gray-500 mb-8">Hệ thống Quản lý Bán hàng POS</p>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Tên đăng nhập"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent transition-all"
              required
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent transition-all"
              required
            />
          </div>
          
          {error && (
            <p className="text-red-500 text-sm text-left">{error}</p>
          )}

          <button
            type="submit"
            className="w-full bg-lime-600 hover:bg-lime-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors mt-4"
          >
            Đăng nhập
          </button>
        </form>
      </div>
    </div>
  );
}
