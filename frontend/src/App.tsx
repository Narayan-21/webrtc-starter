import './App.css'
import {BrowserRouter, Routes, Route} from 'react-router-dom';
import Sender from './components/Sender';
import Receiver from './components/Receiver';


function App() {

  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route Component={Sender} path='/sender'/>
          <Route Component={Receiver} path='/receiver'/>
        </Routes>
      </BrowserRouter>
    </div>
  )
}

export default App
