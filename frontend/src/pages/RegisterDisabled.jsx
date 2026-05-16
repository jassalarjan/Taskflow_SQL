import React from 'react';
import { Link } from 'react-router-dom';

export default function RegisterDisabled() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img 
              src="/logo.png" 
              alt="TaskFlow Logo" 
              className="w-16 h-16 object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Registration Disabled</h1>
          <p className="text-gray-600 mt-2">Public registration is not available</p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
          <div className="flex items-start">
            <svg className="w-6 h-6 text-yellow-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-yellow-800 mb-2">Self-Registration Not Allowed</h3>
              <p className="text-sm text-yellow-700">
                User accounts can only be created by administrators or HR personnel.
                Please contact your system administrator to request an account.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center text-sm text-gray-600">
          <p>Already have an account?</p>
          <Link to="/login" className="mt-2 inline-block text-blue-600 hover:text-blue-700 font-medium">
            Sign in here →
          </Link>
        </div>
      </div>
    </div>
  );
}
