import Workspace from "./pages/workspace";

function App(){
    return(
        // Overflow!
        <div style={{ backgroundColor: '#E3EBFF', height: '100vh', width: '100vw', overflow: 'hidden'}}>
            <Workspace />
        </div>    
    )
}

export default App;