import { useState } from 'react';

const Task = () => {
  const [tasks, setTasks] = useState([
    { text: 'Task 1', completed: true },
    { text: 'Task 2', completed: false },
    { text: 'Task 3', completed: false },
  ]);

  const toggleTask = (index) => {
    const updated = [...tasks];
    updated[index].completed = !updated[index].completed;
    setTasks(updated);
  };
  
  const titleStyle = {
    fontWeight: '600',
    fontSize: '1.125rem',
    marginBottom: '0.5rem',
    borderBottom: '1px solid #ccc',
    paddingBottom: '0.25rem',
  };

  const taskListStyle = {
    listStyle: 'none',
    padding: 0,
    marginTop: '0.5rem',
  };

  const taskItemStyle = {
    marginBottom: '0.5rem',
    fontSize: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  };

  return (
    <div>
      <h2 style={titleStyle}>Tasks</h2>
      <ul style={taskListStyle}>
        {tasks.map((task, index) => (
          <li key={index} style={taskItemStyle}>
            <input
              type="checkbox"
              checked={task.completed}
              onChange={() => toggleTask(index)}
            />
            <span style={{ textDecoration: task.completed ? 'line-through' : 'none' }}>
              {task.text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Task;
