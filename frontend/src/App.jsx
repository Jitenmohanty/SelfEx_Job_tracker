import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { JobProvider } from './context/JobContext';
import { Toaster } from 'react-hot-toast';

// Components
import Navbar from './components/layout/Navbar';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import JobList from './components/jobs/JobList';
import JobForm from './components/jobs/JobForm';
import PrivateRoute from './components/layout/PrivateRoute';

function App() {
  return (
    <Router>
      <AuthProvider>
        <JobProvider>
          <Navbar />
          <Toaster position="top-right" />
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route 
              path="/dashboard" 
              element={
                <PrivateRoute>
                  <JobList />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/jobs/add" 
              element={
                <PrivateRoute>
                  <JobForm />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/jobs/edit/:id" 
              element={
                <PrivateRoute>
                  <JobForm />
                </PrivateRoute>
              } 
            />
          </Routes>
        </JobProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
