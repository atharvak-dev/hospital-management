import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Stethoscope } from 'lucide-react';
import PasswordInput from '../components/common/PasswordInput';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await login(username, password);
            navigate('/');
        } catch (err) {
            const data = err.response?.data;
            if (data?.error === 'pending') {
                setError('⏳ Your account is awaiting admin approval. Please check back later.');
            } else if (data?.error === 'rejected') {
                setError('❌ Your account has been rejected by the admin. Please contact the hospital.');
            } else {
                setError('Invalid username or password');
            }
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
                <div className="p-8">
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                            <Stethoscope className="w-8 h-8 text-blue-600" />
                        </div>
                        <h2 className="text-3xl font-extrabold text-gray-900">Welcome Back</h2>
                        <p className="mt-2 text-sm text-gray-600">Sign in to access the hospital portal</p>
                    </div>

                    {error && (
                        <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4">
                            <p className="text-red-700 text-sm">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Username</label>
                            <input
                                type="text"
                                required
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Password</label>
                            <PasswordInput
                                name="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="mt-1 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                        >
                            Sign In
                        </button>
                    </form>

                    <div className="mt-6 text-center text-xs text-gray-500 space-y-1">
                        <p className="font-medium">Demo Credentials:</p>
                        <p>admin / password123 &nbsp;|&nbsp; doctor / password123</p>
                        <p>nurse / password123 &nbsp;|&nbsp; reception / password123</p>
                    </div>

                    <p className="mt-4 text-center text-sm text-gray-600">
                        New user?{' '}
                        <a href="/signup" className="text-blue-600 hover:underline font-medium">Create an account</a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
