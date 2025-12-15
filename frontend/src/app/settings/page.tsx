'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Toast from '@/components/ui/toast';
import { 
  User, 
  Lock, 
  Shield, 
  FileText, 
  LifeBuoy,
  Edit,
  X,
  CheckCircle,
  LogOut
} from 'lucide-react';

interface UserData {
  id: string;
  name: string;
  phone_number?: string;
  mykad_id?: string;
  phone_verified?: boolean;
  created_at: string;
  email?: string;
}

type EditModal = 'profile' | 'password' | null;

export default function SettingsPage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<EditModal>(null);
  const [formData, setFormData] = useState({
    name: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
    show: boolean;
  }>({
    message: '',
    type: 'success',
    show: false,
  });

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUserRole(payload.role);

      const endpoint = payload.role === 'admin' ? '/admin/profile' : '/participant/profile';
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) throw new Error('Failed to fetch user profile');

      const data: UserData = await res.json();
      setUser(data);
      setFormData({
        ...formData,
        name: data.name || '',
      });
    } catch (err) {
      console.error(err);
      setToast({
        message: 'Failed to load profile',
        type: 'error',
        show: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('access_token');
      const endpoint = userRole === 'admin' ? '/admin/profile' : '/participant/profile';

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: formData.name }),
      });

      if (!res.ok) throw new Error('Failed to update profile');

      setToast({
        message: 'Profile updated successfully!',
        type: 'success',
        show: true,
      });
      setActiveModal(null);
      fetchUser();
    } catch (err: any) {
      setToast({
        message: err.message || 'Failed to update profile',
        type: 'error',
        show: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      setToast({
        message: 'Passwords do not match',
        type: 'error',
        show: true,
      });
      return;
    }

    if (formData.newPassword.length < 6) {
      setToast({
        message: 'Password must be at least 6 characters',
        type: 'error',
        show: true,
      });
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('access_token');
      const endpoint = '/admin/password';

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          current_password: formData.currentPassword,
          new_password: formData.newPassword,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Failed to update password');
      }

      setToast({
        message: 'Password updated successfully!',
        type: 'success',
        show: true,
      });
      setActiveModal(null);
      setFormData({ ...formData, currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setToast({
        message: err.message || 'Failed to update password',
        type: 'error',
        show: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    const logoutRedirect = userRole === 'admin' ? '/admin/login' : '/auth/login';
    window.location.href = logoutRedirect;
  };

  const openModal = (modal: EditModal) => {
    setActiveModal(modal);
  };

  const closeModal = () => {
    setActiveModal(null);
    setFormData({
      ...formData,
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout title="Settings">
          <p className="text-gray-500 text-center py-12">Loading...</p>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout title="Settings">
        <Toast
          message={toast.message}
          type={toast.type}
          show={toast.show}
          onClose={() => setToast({ ...toast, show: false })}
        />

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Profile & Contact Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Profile Information */}
            <Card>
              <CardContent >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>
                  <Button
                    onClick={() => openModal('profile')}
                    variant="ghost"
                    size="sm"
                    className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Full Name</p>
                    <p className="font-medium text-gray-900">{user?.name || 'Not provided'}</p>
                  </div>

                  {userRole === 'participant' && user?.mykad_id && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">MyKad ID</p>
                      <p className="font-medium font-mono text-gray-900">{user.mykad_id}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-xs text-gray-500 mb-1">Member Since</p>
                    <p className="font-medium text-gray-900">
                      {new Date(user?.created_at || '').toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardContent >
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Contact Information</h2>

                <div className="space-y-4">
                  {user?.email && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Email Address</p>
                      <p className="font-medium text-gray-900">{user.email}</p>
                    </div>
                  )}

                  {userRole === 'participant' && user?.phone_number && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Phone Number</p>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{user.phone_number}</p>
                        {user.phone_verified && (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                            <CheckCircle className="w-3 h-3" />
                            Verified
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Security - Only for Admin */}
          {userRole === 'admin' && (
            <Card>
              <CardContent >
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Security</h2>
                <button
                  onClick={() => openModal('password')}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <Lock className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Change Password</p>
                      <p className="text-sm text-gray-500">Update your password regularly for security</p>
                    </div>
                  </div>
                  <Edit className="w-5 h-5 text-gray-400" />
                </button>
              </CardContent>
            </Card>
          )}

          {/* Legal & Support */}
          <Card>
            <CardContent >
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Legal & Support</h2>

              <div className="space-y-2">
                <button
                  onClick={() =>
                    window.open(
                      'https://www.programrose.org/wp-content/uploads/2024/11/ROSE-Privacy-Policy-202411-v1.1.pdf',
                      '_blank'
                    )
                  }
                  className="w-full flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="font-medium text-gray-900">Privacy Policy</span>
                </button>

                <button
                  onClick={() =>
                    window.open(
                      'https://www.programrose.org/wp-content/uploads/2024/10/ROSE-Terms-of-Service-202409-v1.0.pdf',
                      '_blank'
                    )
                  }
                  className="w-full flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left"
                >
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="font-medium text-gray-900">Terms of Service</span>
                </button>

                <button className="w-full flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <LifeBuoy className="w-5 h-5 text-orange-600" />
                  </div>
                  <span className="font-medium text-gray-900">Help & Support</span>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Logout */}
          <Button
            onClick={handleLogout}
            className="w-full bg-red-500 hover:bg-red-600 text-white h-12"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Log Out
          </Button>
        </div>

        {/* Edit Profile Modal */}
        {activeModal === 'profile' && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardContent >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">Edit Profile</h3>
                  <button
                    onClick={closeModal}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name
                    </label>
                    <Input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter your name"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={closeModal}
                      variant="outline"
                      className="flex-1"
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleUpdateProfile}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                      disabled={saving || !formData.name}
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Change Password Modal */}
        {activeModal === 'password' && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardContent >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">Change Password</h3>
                  <button
                    onClick={closeModal}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Password
                    </label>
                    <Input
                      type="password"
                      value={formData.currentPassword}
                      onChange={(e) =>
                        setFormData({ ...formData, currentPassword: e.target.value })
                      }
                      placeholder="Enter current password"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <Input
                      type="password"
                      value={formData.newPassword}
                      onChange={(e) =>
                        setFormData({ ...formData, newPassword: e.target.value })
                      }
                      placeholder="Enter new password"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <Input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        setFormData({ ...formData, confirmPassword: e.target.value })
                      }
                      placeholder="Re-enter new password"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={closeModal}
                      variant="outline"
                      className="flex-1"
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleUpdatePassword}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                      disabled={
                        saving ||
                        !formData.currentPassword ||
                        !formData.newPassword ||
                        !formData.confirmPassword
                      }
                    >
                      {saving ? 'Updating...' : 'Update Password'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}