import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Workspace from "./pages/workspace";
import Landing from "./pages/landing";
import { WorkspaceThemeProvider } from './context/ThemeContext';

function App() {
    return (
        <Router>
            <Routes>
                <Route
                    path="/workspace"
                    element={
                        <WorkspaceThemeProvider>
                            <Workspace />
                        </WorkspaceThemeProvider>
                    }
                />
                <Route
                    path="/"
                    element={
                            <Landing />
                    }
                />
            </Routes>
        </Router>
    );
}

export default App;