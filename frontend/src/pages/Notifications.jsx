import { useEffect, useState } from 'react';
import api from '../api/axios';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data.data || []);
      setError('');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load notifications.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function markRead(id) {
    try {
      await api.patch(`/notifications/${id}/read`);
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to mark as read.');
    }
  }

  async function markAllRead() {
    try {
      await api.patch('/notifications/read-all');
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to mark all as read.');
    }
  }

  if (loading) {
    return (
      <section className="admin-page">
        <p>Loading...</p>
      </section>
    );
  }

  return (
    <section className="admin-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Inbox</p>
          <h1>Notifications</h1>
        </div>
        <button type="button" onClick={markAllRead}>
          Mark all read
        </button>
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {notifications.length === 0 ? (
        <p>No notifications.</p>
      ) : (
        <ul className="assigned-list">
          {notifications.map((notification) => (
            <li
              key={notification.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontWeight: notification.is_read ? 'normal' : 'bold',
              }}
            >
              <span>
                {notification.message}
                <br />
                <small>{new Date(notification.created_at).toLocaleString()}</small>
              </span>
              {!notification.is_read && (
                <button type="button" onClick={() => markRead(notification.id)}>
                  Mark read
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}