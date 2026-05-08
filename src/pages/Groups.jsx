import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { createGroup, addMember, getMembers, leaveGroup, getMyGroups } from '../api';

export default function Groups() {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    getMyGroups().then(res => {
      setGroups(res.data);
      localStorage.setItem('groups', JSON.stringify(res.data));
    }).catch(() => {});
  }, []);

  const saveGroups = (g) => {
    setGroups(g);
    localStorage.setItem('groups', JSON.stringify(g));
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await createGroup({ name: groupName });
      const updated = [...groups, res.data];
      saveGroups(updated);
      setGroupName('');
      setShowCreateModal(false);
      setSuccess('Group created!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectGroup = async (group) => {
    setSelectedGroup(group);
    try {
      const res = await getMembers(group.id);
      setMembers(res.data);
    } catch {
      setMembers([]);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await addMember(selectedGroup.id, { email: memberEmail });
      const res = await getMembers(selectedGroup.id);
      setMembers(res.data);
      setMemberEmail('');
      setShowAddMemberModal(false);
      setSuccess('Member added!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  const handleLeave = async (groupId) => {
    if (!confirm('Leave this group?')) return;
    try {
      await leaveGroup(groupId);
      const updated = groups.filter(g => g.id !== groupId);
      saveGroups(updated);
      if (selectedGroup?.id === groupId) { setSelectedGroup(null); setMembers([]); }
      setSuccess('Left group');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data || 'Failed to leave group');
    }
  };

  const getGroupInitials = (name) => name?.substring(0, 2).toUpperCase() || '??';

  return (
    <Layout>
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1>Groups</h1>
          <p>Manage your expense groups</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setError(''); setShowCreateModal(true); }}>
          + New Group
        </button>
      </div>

      {success && <div className="alert alert-success">✓ {success}</div>}
      {error && <div className="alert alert-error">⚠️ {error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: selectedGroup ? '1fr 1fr' : '1fr', gap: 20 }}>
        <div className="card">
          <div className="card-header">
            <h2>My Groups ({groups.length})</h2>
          </div>
          {groups.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">👥</div>
              <h3>No groups yet</h3>
              <p>Create a group to start splitting expenses</p>
            </div>
          ) : (
            <div>
              {groups.map((group) => (
                <div key={group.id} onClick={() => handleSelectGroup(group)}
                  style={{
                    padding: '14px 20px', borderBottom: '1px solid var(--border)',
                    cursor: 'pointer', background: selectedGroup?.id === group.id ? 'var(--green-dim)' : 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'background 0.15s'
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--green)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700 }}>
                      {getGroupInitials(group.name)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{group.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Created by {group.createdBy}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {selectedGroup?.id === group.id && <span className="badge badge-green">Selected</span>}
                    <button className="btn btn-sm btn-ghost" onClick={(e) => { e.stopPropagation(); handleLeave(group.id); }}>Leave</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedGroup && (
          <div className="card">
            <div className="card-header">
              <h2>{selectedGroup.name}</h2>
              <button className="btn btn-sm btn-outline" onClick={() => { setError(''); setShowAddMemberModal(true); }}>+ Add Member</button>
            </div>
            <div className="card-body">
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Members ({members.length})
                </div>
                {members.length === 0 ? (
                  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No members found</p>
                ) : (
                  <div>
                    {members.map((m) => (
                      <div key={m.userId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                        <div className="avatar" style={{ width: 32, height: 32, fontSize: 13 }}>{m.username?.charAt(0).toUpperCase()}</div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{m.username}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{m.email}</div>
                          {m.phone && <div style={{ fontSize: 12, color: 'var(--green)' }}>📱 {m.phone}</div>}
                        </div>
                        <span className="badge badge-gray" style={{ marginLeft: 'auto' }}>ID: {m.userId}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ background: 'var(--green-dim)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: 13, color: 'var(--green)' }}>
                💡 Use member IDs from above when settling payments
              </div>
            </div>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Group</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-error">⚠️ {error}</div>}
              <form onSubmit={handleCreateGroup}>
                <div className="form-group">
                  <label className="form-label">Group Name</label>
                  <input type="text" className="form-input" placeholder="e.g. Pokhara Trip" value={groupName} onChange={(e) => setGroupName(e.target.value)} required autoFocus />
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setShowCreateModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Creating...' : 'Create Group'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showAddMemberModal && (
        <div className="modal-overlay" onClick={() => setShowAddMemberModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Member to {selectedGroup?.name}</h3>
              <button className="modal-close" onClick={() => setShowAddMemberModal(false)}>×</button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-error">⚠️ {error}</div>}
              <form onSubmit={handleAddMember}>
                <div className="form-group">
                  <label className="form-label">Member Email</label>
                  <input type="email" className="form-input" placeholder="friend@example.com" value={memberEmail} onChange={(e) => setMemberEmail(e.target.value)} required autoFocus />
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>The person must already have a SplitSewa account</p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setShowAddMemberModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Adding...' : 'Add Member'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}