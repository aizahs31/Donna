import { useEffect, useRef, useState } from 'react';

const TaskList = () => {
  const [tasks, setTasks] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const inputRef = useRef(null);
  const [draggedIndex, setDraggedIndex] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('tasks');
    if (saved) setTasks(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (tasks.length > 0) {
      localStorage.setItem('tasks', JSON.stringify(tasks));
    }
  }, [tasks]);

  useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAdding]);

  const addTask = () => {
    setIsAdding(true);
    setTasks([...tasks, { text: '', completed: false }]);
  };

  const finalizeTask = (index, text) => {
    if (text.trim() === '') {
      const updated = [...tasks];
      updated.splice(index, 1);
      setTasks(updated);
    } else {
      const updated = [...tasks];
      updated[index].text = text;
      setTasks(updated);
    }
    setIsAdding(false);
  };

  const toggleTask = (index) => {
    const updated = [...tasks];
    updated[index].completed = !updated[index].completed;
    setTasks(updated);
  };

  const styles = {
    wrapper: {
      marginTop: 0,
      paddingTop: 0,
      position: 'relative',
      minHeight: '250px',
    },
    title: {
      fontWeight: '600',
      fontSize: '1.125rem',
      marginTop: 0,
      padding: '0 0 8px',
      borderBottom: '1px solid var(--color-border)',
      width: '100%',
      lineHeight: '1',
    },
    list: {
      listStyle: 'none',
      padding: 0,
      marginTop: '0.5rem',
    },
    item: {
      marginBottom: '0.5rem',
      fontSize: '1rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      position: 'relative',
      transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
    },
    deleteBtn: {
      opacity: 0,
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: '#ff3b3b',
      marginLeft: 'auto',
      padding: '0 0.3rem',
      display: 'flex',
      alignItems: 'center',
      transition: 'opacity 0.2s',
      fontSize: '1.3rem',
    },
    deleteBtnVisible: {
      opacity: 1,
    },
    checkbox: {
      appearance: 'none',
      width: '1rem',
      height: '1rem',
      minWidth: '1rem',
      minHeight: '1rem',
      maxWidth: '1rem',
      maxHeight: '1rem',
      border: '2px solid var(--color-border-dark)',
      borderRadius: '2px',
      display: 'inline-block',
      position: 'relative',
      cursor: 'pointer',
      boxSizing: 'border-box',
    },
    checkboxChecked: {
      backgroundColor: 'var(--color-border-dark)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkmarkSvg: {
      width: '15px',
      height:'15px',
      stroke: 'var(--color-text-light)',
      strokeWidth: 3,
      fill: 'none',
    },
    text: (completed) => ({
      textDecoration: completed ? 'line-through' : 'none',
      flex: 1,
    }),
    input: {
      border: 'none',
      outline: 'none',
      fontSize: '1rem',
      background: 'transparent',
      color: 'inherit',
      caretColor: '#333',
      width: '100%',
    },
    
    dragHandle: {
      opacity: 0,
      cursor: 'grab',
      fontSize: '1.3rem',
      color: '#888',
      userSelect: 'none',
      transition: 'opacity 0.2s',
      display: 'flex',
      alignItems: 'center',
    },
    dragHandleVisible: {
      opacity: 1,
      color: '#1E1E1E',
    },
    dragging: {
      background: 'var(--color-accent-muted)',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      zIndex: 10,
    },
  };

  // Drag and drop handlers
  const handleDragStart = (index) => setDraggedIndex(index);
  const handleDragEnd = () => setDraggedIndex(null);
  const handleDragOver = (e, overIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === overIndex) return;
    const updated = [...tasks];
    const [moved] = updated.splice(draggedIndex, 1);
    updated.splice(overIndex, 0, moved);
    setDraggedIndex(overIndex);
    setTasks(updated);
  };

  return (
    <div style={styles.wrapper}
      onClick={() => {
        if (!isAdding) addTask();
      }}
    >
      <h2 style={styles.title}>Tasks</h2>
      <ul style={styles.list}>
        {tasks.map((task, index) => (
          <li
            key={index}
            style={{
              ...styles.item,
              ...(draggedIndex === index ? styles.dragging : {}),
            }}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragEnd={handleDragEnd}
            onDragOver={e => handleDragOver(e, index)}
            onMouseEnter={e => {
              e.currentTarget.querySelector('.drag-handle').style.opacity = 1;
              e.currentTarget.querySelector('.delete-btn').style.opacity = 1;
            }}
            onMouseLeave={e => {
              e.currentTarget.querySelector('.drag-handle').style.opacity = 0;
              e.currentTarget.querySelector('.delete-btn').style.opacity = 0;
            }}
            onClick={e => {
              e.stopPropagation();
              if (!isAdding) {
                setIsAdding(true);
                // If not already editing, set to edit this task
                setTasks(tasks => tasks.map((t, i) => i === index ? { ...t, editing: true } : { ...t, editing: false }));
              }
            }}
          >
            <span
              className="drag-handle"
              style={{
                ...styles.dragHandle,
                ...(draggedIndex === index ? styles.dragHandleVisible : {}),
              }}
              title="Drag to reorder"
              onMouseDown={e => e.stopPropagation()}
            >
              =
            </span>
            <div
              style={{
                ...styles.checkbox,
                ...(task.completed ? styles.checkboxChecked : {}),
              }}
              onClick={e => { e.stopPropagation(); toggleTask(index); }}
            >
              {task.completed && (
                <svg viewBox="0 0 24 24" style={styles.checkmarkSvg}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
            {task.completed ? (
              <span style={styles.text(task.completed)}>{task.text}</span>
            ) : (task.editing || (isAdding && index === tasks.length - 1 && task.text === '')) ? (
              <input
                ref={inputRef}
                style={styles.input}
                defaultValue={task.text}
                onBlur={e => finalizeTask(index, e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') finalizeTask(index, e.target.value);
                }}
                onClick={e => e.stopPropagation()}
                autoFocus
              />
            ) : (
              <span style={styles.text(task.completed)}>{task.text}</span>
            )}

            {/* Delete button at the right end, only visible on hover */}
            <button
              type="button"
              className="delete-btn"
              style={styles.deleteBtn}
              onClick={e => {
                e.stopPropagation();
                setTasks(tasks => {
                  const updated = [...tasks];
                  updated.splice(index, 1);
                  localStorage.setItem('tasks', JSON.stringify(updated));
                  return updated;
                });
              }}
              title="Delete task"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m5 0V4a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TaskList;
