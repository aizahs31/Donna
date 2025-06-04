import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Workspace from "./pages/workspace";
import Landing from "./pages/landing";

function App(){
    return(
        <Router>
            <Routes>
                <Route path="/workspace" element={<Workspace />} />
                <Route path="/" element={<Landing />} />
            </Routes>
        </Router>
    )
}

export default App;