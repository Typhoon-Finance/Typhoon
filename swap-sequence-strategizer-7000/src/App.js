import btcLogo from './btcLogo.svg';
import './App.css';
import StrategizerTable from './StrategizerTable'

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={btcLogo} className="App-logo" alt="logo" />
        <h4>
          Swap Sequence Strategizer 7000
        </h4>
      </header>
      <StrategizerTable />
    </div>
  );
}

export default App;
