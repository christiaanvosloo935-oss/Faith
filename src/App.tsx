import { HashRouter, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { ToastProvider } from './components/ui';
import Today from './pages/Today';
import Prayers from './pages/Prayers';
import CirclePage from './pages/Circle';
import Walk from './pages/Walk';
import Places from './pages/Places';
import Sermons from './pages/Sermons';
import SermonEditor from './pages/SermonEditor';
import SermonView from './pages/SermonView';
import Receive from './pages/Receive';
import Settings from './pages/Settings';
import Join from './pages/Join';

export default function App() {
  return (
    <ToastProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Today />} />
            <Route path="prayer" element={<Prayers />} />
            <Route path="circle" element={<CirclePage />} />
            <Route path="walk" element={<Walk />} />
            <Route path="places" element={<Places />} />
            <Route path="sermons" element={<Sermons />} />
            <Route path="sermons/new" element={<SermonEditor />} />
            <Route path="sermons/:id" element={<SermonView />} />
            <Route path="sermons/:id/edit" element={<SermonEditor />} />
            <Route path="receive/:payload" element={<Receive />} />
            <Route path="join/:token" element={<Join />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<Today />} />
          </Route>
        </Routes>
      </HashRouter>
    </ToastProvider>
  );
}
