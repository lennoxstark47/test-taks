import React, { useState } from 'react';
import { TaskProvider, useTask } from './TaskContext';
import './App.css';

// Task Form Component
const TaskForm = () => {
  const [title, setTitle] = useState('');
  const { createTask, loading } = useTask();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (title.trim()) {
      await createTask(title.trim());
      setTitle('');
    }
  };

  return (
      <form onSubmit={handleSubmit} className="task-form">
        <div className="form-group">
          <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title..."
              disabled={loading}
              className="task-input"
          />
          <button type="submit" disabled={loading || !title.trim()} className="submit-btn">
            Add Task
          </button>
        </div>
      </form>
  );
};

// Task Item Component
const TaskItem = ({ task }) => {
  const { deleteTask } = useTask();

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#ffa500';
      case 'processing': return '#2196f3';
      case 'completed': return '#4caf50';
      case 'failed': return '#f44336';
      default: return '#666';
    }
  };

  return (
      <div className="task-item">
        <div className="task-header">
          <h3 className="task-title">{task.title}</h3>
          <div className="task-actions">
          <span
              className="task-status"
              style={{ color: getStatusColor(task.status) }}
          >
            {task.status.toUpperCase()}
          </span>
            <button
                onClick={() => deleteTask(task._id)}
                className="delete-btn"
                title="Delete task"
            >
              ×
            </button>
          </div>
        </div>

        <div className="task-details">
          <small className="task-time">
            Created: {new Date(task.createdAt).toLocaleString()}
          </small>
          {task.processedAt && (
              <small className="task-time">
                Processed: {new Date(task.processedAt).toLocaleString()}
              </small>
          )}
          {task.result && (
              <div className="task-result">
                <strong>Result:</strong> {task.result}
              </div>
          )}
        </div>
      </div>
  );
};

// Task List Component
const TaskList = () => {
  const { tasks, loading, error } = useTask();

  if (loading && tasks.length === 0) {
    return <div className="loading">Loading tasks...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  if (tasks.length === 0) {
    return <div className="empty">No tasks yet. Add one above!</div>;
  }

  return (
      <div className="task-list">
        {tasks.map(task => (
            <TaskItem key={task._id} task={task} />
        ))}
      </div>
  );
};

// Connection Status Component
const ConnectionStatus = () => {
  const { connected } = useTask();

  return (
      <div className={`connection-status ${connected ? 'connected' : 'disconnected'}`}>
        <span className="status-dot"></span>
        {connected ? 'Connected' : 'Disconnected'}
      </div>
  );
};

// Main App Component
const AppContent = () => {
  return (
      <div className="app">
        <header className="app-header">
          <h1>Task Queue Demo</h1>
          <p>Add tasks and watch them process in real-time with BullMQ, Socket.io, and MongoDB</p>
          <ConnectionStatus />
        </header>

        <main className="app-main">
          <TaskForm />
          <TaskList />
        </main>
      </div>
  );
};

// App with Provider
function App() {
  return (
      <TaskProvider>
        <AppContent />
      </TaskProvider>
  );
}

export default App;