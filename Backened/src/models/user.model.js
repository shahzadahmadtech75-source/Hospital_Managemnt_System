import mongoose from 'mongoose';
import validator from 'validator';
import bcrypt from 'bcrypt';

/**
 * User Schema - Handles authentication and account identity
 * This model is responsible ONLY for user authentication and basic account management.
 * Role-specific professional data (medical records, appointments, etc.) will be in separate models.
 */
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: (value) => validator.isEmail(value),
        message: 'Please provide a valid email address',
      },
      index: true,
    },

    username: {
  type: String,
  required: [true, 'Username is required'],
  unique: true,
  trim: true,
  lowercase: true,
  minlength: [3, 'Username must be at least 3 characters long'],
  maxlength: [30, 'Username cannot exceed 30 characters'],
  match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'],
  index: true,
},

profileImage: {
  type: String,
  default: null,
},
// Add after profileImage field
profileImagePublicId: {
  type: String,
  default: null,
  select: false, // Hide by default
},

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false, // Prevents password from being returned in queries by default
    },

    



    role: {
      type: String,
      required: [true, 'User role is required'],
      enum: {
        values: ['admin', 'doctor', 'patient', 'nurse', 'receptionist', 'laboratorist'],
        message: 'Role must be one of: admin, doctor, patient, nurse, receptionist, laboratorist',
      },
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    refreshToken: {
      type: String,
      select: false, // Hide refresh token from queries by default for security
    },
    passwordChangedAt: {
      type: Date,
      select: false, // Hide sensitive timestamp by default
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
    toJSON: {
      transform: (doc, ret) => {
        delete ret.__v; // Remove __v version key from JSON output
        return ret;
      },
    },
    toObject: {
      transform: (doc, ret) => {
        delete ret.__v; // Remove __v version key from object output
        return ret;
      },
    },
  }
);

/**
 * Compare a plain text password with the stored hashed password
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) {
    throw new Error('Password is not available for comparison');
  }
  
  return await bcrypt.compare(candidatePassword, this.password);
};

/**
 * Check if the password was changed after a certain time
 * Useful for JWT token invalidation after password change
 
 */
userSchema.methods.isPasswordChangedAfter = function (timestamp) {
  if (!this.passwordChangedAt) {
    return false; // Password was never changed
  }
  
  const changedAt = new Date(this.passwordChangedAt);
  const issuedAt = new Date(timestamp);
  
  // Compare timestamps (password changed after token was issued)
  return changedAt.getTime() > issuedAt.getTime();
};

/**
 * Pre-save middleware to hash password before saving
 * Only runs when the password is modified
 */
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordChangedAt = new Date();
});

// Create and export the User model
const User = mongoose.model('User', userSchema);

export default User;