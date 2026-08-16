import express from 'express';


import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes.js';
import protectedRoutes from './routes/protected.routes.js';
import adminRoutes from './routes/admin.routes.js';
import staffRoutes from './routes/staff.routes.js';
import receptionistRoutes from './routes/receptionist.routes.js';
import patientProfileRoutes from './routes/patientProfile.routes.js';
import appointmentRoutes from './routes/appointment.routes.js';
import doctorProfileRoutes from './routes/doctorProfile.routes.js';
import nurseRoutes from './routes/nurse.routes.js';
import accountantRoutes from './routes/accountant.routes.js'
import publicRoutes from './routes/public.routes.js';
import emergencyRoutes from './routes/emergancy.routes.js';
import messageRoutes from './routes/message.routes.js';



const app = express();

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
  ? ['https://your-production-domain.com'] 
  : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  optionsSuccessStatus: 200,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());



app.use('/api/v1/public', publicRoutes);


// Use routes
app.use('/api/v1', emergencyRoutes);

// API routes
app.use('/api/v1/auth', authRoutes);
//Protected routes
app.use('/api/v1/protected', protectedRoutes);


// message routes
app.use('/api/v1/messages', messageRoutes);

app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/staff', staffRoutes);
app.use('/api/v1/receptionist', receptionistRoutes);
app.use('/api/v1/patient', patientProfileRoutes);
app.use('/api/v1/patient', appointmentRoutes);
app.use('/api/v1/doctor', doctorProfileRoutes);
// Nurse routes
app.use('/api/v1/nurse', nurseRoutes);
app.use('/api/v1/accountant', accountantRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Hospital Management System API is running',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});



export default app;