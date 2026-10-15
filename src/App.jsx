import { BrowserRouter, Routes, Route } from 'react-router-dom';
import WebsiteApp from './website/WebsiteApp';
import InventoryApp from './inventory/InventoryApp';
import './website/index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Website routes (main restaurant website) */}
        <Route path="/" element={<WebsiteApp />} />
        
        {/* Inventory system routes */}
        <Route path="/inventory/*" element={<InventoryApp />} />
        
        {/* Catch all route */}
        <Route path="*" element={<div className="p-6">Page Not Found</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;