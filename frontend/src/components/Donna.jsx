import { useState, useEffect, useRef } from "react";

const Donna = ({ calendarRef }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { from: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    const contextMessages = messages.slice(-10).map(m => ({
      role: m.from === "user" ? "user" : "model",
      parts: [{ text: m.text }]
    }));

    let tasks = [];
    try {
      tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    } catch (e) {
      console.warn("Failed to parse tasks from localStorage", e);
      tasks = [];
    }

    try {
      const res = await fetch('http://localhost:3000/chat', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          context: contextMessages,
          tasks: tasks
        })
      });

      const data = await res.json();
      const botMessage = { from: "bot", text: data.reply };
      setMessages((prev) => [...prev, botMessage]);
      
      // Handle different actions
      if (data.action) {
        switch (data.action) {
          case "calendar_created":
          case "calendar_deleted":
            // Reload calendar events
            if (calendarRef?.current) {
              calendarRef.current.reloadEvents();
            }
            break;
          case "task_added":
            // Add task to local storage
            if (data.taskData) {
              const existingTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
              const newTasks = [...existingTasks, data.taskData];
              localStorage.setItem('tasks', JSON.stringify(newTasks));
              // Trigger a custom event to notify Task component
              window.dispatchEvent(new CustomEvent('tasksUpdated'));
            }
            break;
          case "task_updated":
            // Update task in local storage
            if (data.taskData) {
              const existingTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
              const query = data.taskData.query.toLowerCase();
              const taskIndex = existingTasks.findIndex(task => 
                task.text.toLowerCase().includes(query)
              );
              if (taskIndex !== -1) {
                if (data.taskData.updates.text) {
                  existingTasks[taskIndex].text = data.taskData.updates.text;
                }
                if (data.taskData.updates.completed !== undefined) {
                  existingTasks[taskIndex].completed = data.taskData.updates.completed;
                }
                localStorage.setItem('tasks', JSON.stringify(existingTasks));
                window.dispatchEvent(new CustomEvent('tasksUpdated'));
              }
            }
            break;
          case "task_deleted":
            // Delete task from local storage
            if (data.query) {
              const existingTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
              const query = data.query.toLowerCase();
              const filteredTasks = existingTasks.filter(task => 
                !task.text.toLowerCase().includes(query)
              );
              localStorage.setItem('tasks', JSON.stringify(filteredTasks));
              window.dispatchEvent(new CustomEvent('tasksUpdated'));
            }
            break;
        }
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setMessages((prev) => [
        ...prev,
        { from: "bot", text: "Sorry, something went wrong." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const containerStyle = {
    backgroundColor: 'var(--color-bg-panel)',
    border: '2px solid var(--color-border)',
    padding: '1rem',
    borderRadius: '10px',
    height: '80vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  };

  const headerStyle = {
    fontSize: '1.125rem',
    fontWeight: '600',
    marginBottom: '0.75rem',
    borderBottom: '1px solid var(--color-border)',
    paddingBottom: '0.25rem',
    marginTop: '0',
  };

  const chatBoxStyle = {
    flexGrow: 1,
    overflowY: 'auto',
    paddingRight: '0.25rem',
    marginBottom: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  };

  const userMsgStyle = {
    alignSelf: 'flex-end',
    backgroundColor: 'var(--color-accent-muted)',
    color: '#222',
    padding: '0.5rem 0.75rem',
    borderRadius: '1rem 1rem 0 1rem',
    maxWidth: '75%',
    fontSize: '0.875rem',
    lineHeight: '1.2',
  };

  const botMsgStyle = {
    alignSelf: 'flex-start',
    color: 'var(--color-text-bot)',
    padding: '0.5rem 0.75rem',
    maxWidth: '75%',
    fontSize: '0.875rem',
    lineHeight: '1.2',
  };

  const inputWrapperStyle = {
    marginTop: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    alignItems: 'center',
  }

  const inputContainerStyle = {
    position: 'relative',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
  };

  const inputStyle = {
    width: '100%',
    padding: '0.75rem',
    backgroundColor: 'var(--color-accent-input)',
    borderRadius: '2rem',
    border: 'none',
    fontSize: '0.875rem',
    color: 'var(--color-text-main)',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const placeholderStyle = {
    color: 'var(--color-accent-placeholder)',
  };

  const sendButtonStyle = {
    backgroundColor: 'var(--color-btn-dark)',
    border: 'none',
    padding: '9px 9px 9px 8px',
    borderRadius: '11px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginLeft: '0.5rem',
  };


  return (
    <div style={containerStyle}>
      <h2 style={headerStyle}>Donna</h2>
      <div style={chatBoxStyle}>
        {messages.map((msg, index) =>
          msg.from === 'user' ? (
            <div key={index} style={userMsgStyle}>{msg.text}</div>
          ) : (
            <div key={index} style={botMsgStyle} dangerouslySetInnerHTML={{ __html: msg.text }} />
          )
        )}
        {loading && (
          <div style={botMsgStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                backgroundColor: '#666',
                animation: 'pulse 1.5s ease-in-out infinite'
              }}></div>
              <span>Donna is thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div style={inputWrapperStyle}>
        {/* Row: input + send button */}
        <div style={inputContainerStyle}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Talk to Donna"
            style={{ ...inputStyle, ...placeholderStyle }}
            onKeyDown={(e) => { if (e.key === 'Enter') sendMessage()}}
            disabled={loading}
          />
          <button 
            onClick={sendMessage} 
            style={{
              ...sendButtonStyle,
              opacity: loading ? 0.6 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }} 
            aria-label="Send message"
            disabled={loading}
          >
            <svg width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11.0694 18.5316C11.706 18.5316 12.1569 17.9831 12.484 17.134L18.2752 1.99912C18.4343 1.59219 18.5316 1.22953 18.5316 0.928774C18.5316 0.353824 18.169 0 17.5943 0C17.2937 0 16.9312 0.0884656 16.5246 0.247696L1.31737 6.07695C0.574712 6.36 0 6.81113 0 7.45684C0 8.27066 0.618885 8.54485 1.46766 8.80137L7.85112 10.6767L9.70782 16.9836C9.97305 17.877 10.2471 18.5316 11.0694 18.5316ZM8.24899 9.33213L2.14848 7.46571C2.00698 7.42148 1.96281 7.38608 1.96281 7.32418C1.96281 7.26225 1.99816 7.21801 2.13079 7.16495L14.0843 2.636C14.7916 2.37064 15.4724 2.01682 16.1266 1.71606C15.5431 2.19371 14.8181 2.75983 14.3318 3.24635L8.24899 9.33213ZM11.2109 16.5855C11.1401 16.5855 11.1047 16.5236 11.0605 16.3821L9.19501 10.2786L15.2779 4.19283C15.7553 3.71517 16.3477 2.97212 16.8162 2.37064C16.5157 3.04289 16.162 3.724 15.8879 4.44048L11.3611 16.3997C11.3081 16.5324 11.2727 16.5855 11.2109 16.5855Z" fill="#FEF9F1"/>
            </svg>
          </button>
        </div>
      </div>
      
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default Donna;