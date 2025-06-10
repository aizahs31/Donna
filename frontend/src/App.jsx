import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Workspace from "./pages/workspace";
import Landing from "./pages/landing";
import { ThemeProvider } from './context/ThemeContext';
import ThemeToggle from './components/ThemeToggle';

function App() {
    return (
        <ThemeProvider>
            <Router>
                <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 1000 }}>
                    <ThemeToggle />
                </div>
                <Routes>
                    <Route path="/workspace" element={<Workspace />} />
                    <Route path="/" element={<Landing />} />
                </Routes>
            </Router>
        </ThemeProvider>
    );
}

export default App;