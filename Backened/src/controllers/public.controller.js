import Department from "../models/department.model.js";
import DoctorProfile from "../models/doctorProfile.model.js";

export const getPublicDepartments = async (req, res) => {
  try {
    const departments = await Department.find().sort({ name: 1 });

    // Count doctors for each department by department name
    const departmentsWithCount = await Promise.all(
      departments.map(async (dept) => {
        const doctorCount = await DoctorProfile.countDocuments({ 
          department: dept.name 
        });
        return {
          ...dept.toObject(),
          doctors: doctorCount,  // Add doctor count as a number
        };
      })
    );

    res.status(200).json({
      success: true,
      count: departmentsWithCount.length,
      data: departmentsWithCount,
    });
  } catch (error) {
    console.error('Error fetching public departments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch departments',
      error: error.message,
    });
  }
};

// Get all doctors (public)
export const getPublicDoctors = async (req, res) => {
  try {
    const doctors = await DoctorProfile.find()
      .populate('user', 'profileImage')
      .sort({ fullName: 1 });

    // Format response
    const formattedDoctors = doctors.map(doctor => ({
      _id: doctor._id,
      fullName: doctor.fullName,
      department: doctor.department,
      specialization: doctor.specialization,
      qualification: doctor.qualification,
      experienceYears: doctor.experienceYears,
      consultationFee: doctor.consultationFee,
      description: doctor.description,
      isAvailable: doctor.isAvailable,
      profileImage: doctor.profileImage || doctor.user?.profileImage || null,
    }));

    res.status(200).json({
      success: true,
      count: formattedDoctors.length,
      data: formattedDoctors,
    });
  } catch (error) {
    console.error('Error fetching public doctors:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch doctors',
      error: error.message,
    });
  }
};

// Get doctors by department (public)
export const getPublicDoctorsByDepartment = async (req, res) => {
  try {
    const { departmentId } = req.params;

    // Find department to get name
    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found',
      });
    }

    const doctors = await DoctorProfile.find({ department: department.name })
      .populate('user', 'profileImage')
      .sort({ fullName: 1 });

    const formattedDoctors = doctors.map(doctor => ({
      _id: doctor._id,
      fullName: doctor.fullName,
      department: doctor.department,
      specialization: doctor.specialization,
      qualification: doctor.qualification,
      experienceYears: doctor.experienceYears,
      consultationFee: doctor.consultationFee,
      description: doctor.description,
      isAvailable: doctor.isAvailable,
      profileImage: doctor.profileImage || doctor.user?.profileImage || null,
    }));

    res.status(200).json({
      success: true,
      count: formattedDoctors.length,
      data: formattedDoctors,
    });
  } catch (error) {
    console.error('Error fetching doctors by department:', error);
    
    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid department ID format',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to fetch doctors',
      error: error.message,
    });
  }
};