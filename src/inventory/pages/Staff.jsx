import { useState, useEffect } from 'react';
import api from '../services/api';
import Card from '../components/ui/Card';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import { useDomain } from '../context/DomainContext';

export default function Staff() {
  const { domain } = useDomain();
  const [staff, setStaff] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'kitchen'
  });

  const loadStaff = async () => {
    try {
      const res = await api.get('/users');
      setStaff(res.data);
    } catch (error) {
      console.error('Error loading staff:', error);
    }
  };

  useEffect(() => {
    loadStaff();
  }, [domain]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await api.put(`/users/${editingUser._id}`, formData);
      } else {
        await api.post('/users', formData);
      }
      setShowModal(false);
      setEditingUser(null);
      setFormData({ name: '', email: '', password: '', role: 'kitchen' });
      loadStaff();
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '', // Don't pre-fill password
      role: user.role
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        await api.delete(`/users/${id}`);
        loadStaff();
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { 
      key: 'role', 
      label: 'Role',
      render: (role) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          role === 'admin' ? 'bg-red-100 text-red-800' :
          role === 'accountant' ? 'bg-blue-100 text-blue-800' :
          'bg-green-100 text-green-800'
        }`}>
          {role.charAt(0).toUpperCase() + role.slice(1)}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, user) => (
        <div className="flex space-x-2">
          <button 
            onClick={() => handleEdit(user)}
            className="text-blue-400 hover:text-blue-300"
          >
            Edit
          </button>
          <button 
            onClick={() => handleDelete(user._id)}
            className="text-red-400 hover:text-red-300"
          >
            Delete
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Staff Management</h1>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700"
        >
          Add Staff Member
        </button>
      </div>

      <Card>
        <DataTable 
          data={staff} 
          columns={columns}
          defaultPageSize={10}
          pageSizeOptions={[10, 25, 50]}
          searchPlaceholder="Search staff..."
        />
      </Card>

      <Modal 
        isOpen={showModal} 
        onClose={() => {
          setShowModal(false);
          setEditingUser(null);
          setFormData({ name: '', email: '', password: '', role: 'kitchen' });
        }}
        title={editingUser ? 'Edit Staff Member' : 'Add Staff Member'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Name</label>
            <input
              type="text"
              required
              className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
            <input
              type="email"
              required
              className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Password {editingUser && '(leave blank to keep current)'}
            </label>
            <input
              type="password"
              required={!editingUser}
              className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Role</label>
            <select
              className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2"
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
            >
              <option value="kitchen">Kitchen Staff</option>
              <option value="cashier">Cashier</option>
              <option value="waiter">Waiter</option>
              <option value="accountant">Accountant</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="text-sm text-slate-400 p-3 bg-slate-800 rounded">
            <strong>Role Permissions:</strong>
            <ul className="mt-1 space-y-1">
              <li><strong>Kitchen:</strong> View order queue, mark orders done, submit usage, create requests</li>
              <li><strong>Cashier:</strong> Manage tables, place orders, generate bills</li>
              <li><strong>Waiter:</strong> View ready orders, serve tables, track orders</li>
              <li><strong>Accountant:</strong> All kitchen permissions + manage transactions, view analytics</li>
              <li><strong>Admin:</strong> Full access to all features including staff management</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-2">
            <button 
              type="button"
              onClick={() => {
                setShowModal(false);
                setEditingUser(null);
                setFormData({ name: '', email: '', password: '', role: 'kitchen' });
              }}
              className="px-4 py-2 border border-slate-600 rounded text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
            >
              {editingUser ? 'Update' : 'Create'} User
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}