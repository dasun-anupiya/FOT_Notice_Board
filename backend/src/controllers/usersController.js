import Joi from 'joi';
import { supabase } from '../db/supabaseClient.js';
import { hashPassword, comparePassword } from '../utils/hash.js';
import { generateToken } from '../middlewares/auth.js';

// ===============================
// VALIDATION SCHEMAS
// ===============================
const createUserSchema = Joi.object({
  UniversityEmail: Joi.string().email().required(),
  UserType: Joi.string().valid('Student', 'Staff', 'Admin').required(),
  Department: Joi.string().allow('', null).optional(),
  Designation: Joi.string().allow('', null).optional(),
  Batch: Joi.string().allow('', null).optional(),
  Password: Joi.string().min(6).required()
});

const updateUserSchema = Joi.object({
  UniversityEmail: Joi.string().email().optional(),
  UserType: Joi.string().valid('Student', 'Staff', 'Admin').optional(),
  Department: Joi.string().valid('IAT', 'ET', 'AT', 'ICT').allow(null),
  Designation: Joi.string().allow('', null),
  Batch: Joi.string().allow('', null),
  Password: Joi.string().min(6).optional()
});

// ===============================
// REGISTER
// ===============================
export async function registerUser(req, res, next) {
  try {
    console.log('Register request received:', req.body);
    const { error, value } = createUserSchema.validate(req.body);
    if (error) {
      console.error('Validation error:', error.message);
      return res.status(400).json({ message: error.message });
    }

    console.log('Checking if email exists:', value.UniversityEmail);
    const { data: exists, error: checkErr } = await supabase
      .from('User')
      .select('UserID')
      .eq('UniversityEmail', value.UniversityEmail)
      .single();

    if (exists) {
      console.log('Email already registered');
      return res.status(409).json({ message: 'Email already registered' });
    }

    console.log('Hashing password');
    const pwHash = await hashPassword(value.Password);

    // Try different column name variations for Supabase
    const payloadVariations = [
      // Try PascalCase (original schema)
      {
        UniversityEmail: value.UniversityEmail,
        UserType: value.UserType,
        PasswordHash: pwHash
      },
      // Try snake_case (common Supabase convention)
      {
        university_email: value.UniversityEmail,
        user_type: value.UserType,
        password_hash: pwHash
      },
      // Try lowercase
      {
        universityemail: value.UniversityEmail,
        usertype: value.UserType,
        passwordhash: pwHash
      }
    ];

    console.log('Attempting to insert user...');

    let data, insertErr;
    let payload = payloadVariations[0];

    // Try each variation until one works
    for (const attemptPayload of payloadVariations) {
      console.log('Trying payload:', JSON.stringify(attemptPayload, null, 2));
      const result = await supabase
        .from('User')
        .insert([attemptPayload])
        .select('*')
        .single();

      data = result.data;
      insertErr = result.error;

      if (!insertErr) {
        payload = attemptPayload;
        console.log('Success! Used payload:', JSON.stringify(attemptPayload, null, 2));
        break;
      }
    }

    // If it works, try to update with optional fields one by one if they exist
    if (!insertErr && data) {
      // Determine column naming convention based on what worked
      const isSnakeCase = payload.university_email !== undefined;

      const optionalFields = {
        Department: value.Department && value.Department.trim() !== '' ? value.Department : null,
        Designation: value.Designation && value.Designation.trim() !== '' ? value.Designation : null,
        Batch: value.Batch && value.Batch.trim() !== '' ? value.Batch : null
      };

      // Try to update with optional fields
      for (const [key, val] of Object.entries(optionalFields)) {
        if (val !== null) {
          try {
            // Try both naming conventions for each field
            const fieldNames = isSnakeCase
              ? [key.toLowerCase(), key]
              : [key, key.toLowerCase()];

            for (const fieldName of fieldNames) {
              const updateResult = await supabase
                .from('User')
                .update({ [fieldName]: val })
                .eq('UserID', data.UserID || data.userid || data.user_id);

              if (!updateResult.error) {
                data[key] = val;
                console.log(`Successfully set ${fieldName}`);
                break;
              } else {
                console.log(`${fieldName} column doesn't exist, trying next...`);
              }
            }
          } catch (e) {
            console.log(`${key} column doesn't exist in database, skipping`);
          }
        }
      }
    }

    if (insertErr) {
      console.error('Database insert error:', insertErr);
      throw insertErr;
    }

    delete data.PasswordHash;
    console.log('User created successfully');
    res.status(201).json(data);

  } catch (err) {
    console.error('Registration error:', err);
    next(err);
  }
}

// ===============================
// LOGIN
// ===============================
export async function loginUser(req, res, next) {
  try {
    const { UniversityEmail, Password } = req.body;

    if (!UniversityEmail || !Password) {
      return res.status(400).json({ message: 'Email & Password required' });
    }

    // Try different column name variations
    let data, error;

    for (const emailCol of ['UniversityEmail', 'university_email', 'universityemail']) {
      for (const pwdCol of ['PasswordHash', 'password_hash', 'passwordhash']) {
        const result = await supabase
          .from('User')
          .select('*')
          .eq(emailCol, UniversityEmail)
          .single();

        if (!result.error && result.data) {
          // Find password field in the result
          const passwordField = result.data.PasswordHash || result.data.password_hash || result.data.passwordhash;
          if (passwordField) {
            const ok = await comparePassword(Password, passwordField);
            if (ok) {
              data = result.data;

              // Delete password fields
              if (data.PasswordHash) delete data.PasswordHash;
              if (data.password_hash) delete data.password_hash;
              if (data.passwordhash) delete data.passwordhash;

              const userId = data.UserID || data.userid || data.user_id;
              const userType = data.UserType || data.user_type || data.usertype;
              const email = data.UniversityEmail || data.university_email || data.universityemail;

              const token = generateToken({ userId, userType, email });
              res.json({ token, user: data });
              return;
            }
          }
        }
      }
    }

    return res.status(401).json({ message: 'Invalid credentials' });

  } catch (err) {
    next(err);
  }
}

// ===============================
// GET ALL USERS
// ===============================
export async function getAllUsers(req, res) {
  try {
    // Select all fields with wildcard - Supabase will only return fields that exist
    const { data, error } = await supabase
      .from('User')
      .select('*');

    if (error) throw error;

    // Clean up the data - remove sensitive fields
    const cleanedData = data.map(user => {
      const { PasswordHash, ...cleanUser } = user;
      return cleanUser;
    });

    res.json(cleanedData);

  } catch (err) {
    console.error('Error loading users:', err);
    res.status(500).json({ message: 'Failed to load users' });
  }
}

// ===============================
// GET SINGLE USER
// ===============================
export async function getUser(req, res, next) {
  try {
    const id = Number(req.params.id);

    const { data, error } = await supabase
      .from('User')
      .select('*')
      .eq('UserID', id)
      .single();

    if (error) return res.status(404).json({ message: 'User not found' });

    delete data.PasswordHash;
    res.json(data);

  } catch (err) {
    next(err);
  }
}

// ===============================
// UPDATE USER
// ===============================
export async function updateUser(req, res, next) {
  try {
    const id = Number(req.params.id);

    if (req.user.userId !== id && req.user.userType !== 'Admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const { error, value } = updateUserSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    const payload = { ...value };

    if (payload.Password) {
      payload.PasswordHash = await hashPassword(payload.Password);
      delete payload.Password;
    }

    const { data, error: updateErr } = await supabase
      .from('User')
      .update(payload)
      .eq('UserID', id)
      .select('*')
      .single();

    if (updateErr) return res.status(400).json({ message: updateErr.message });

    delete data.PasswordHash;
    res.json(data);

  } catch (err) {
    next(err);
  }
}

// ===============================
// DELETE USER
// ===============================
export async function deleteUser(req, res, next) {
  try {
    const id = Number(req.params.id);

    if (req.user.userId !== id && req.user.userType !== 'Admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const { data, error } = await supabase
      .from('User')
      .delete()
      .eq('UserID', id)
      .select('*')
      .single();

    if (error) return res.status(400).json({ message: error.message });

    delete data.PasswordHash;
    res.json({ success: true, deleted: data });

  } catch (err) {
    next(err);
  }
}

// ===============================
// RESET PASSWORD
// ===============================
export async function resetPassword(req, res, next) {
  try {
    const { UniversityEmail, Password } = req.body;

    if (!UniversityEmail || !Password) {
      return res.status(400).json({ message: 'Email & New Password required' });
    }

    if (Password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    console.log(`Reset password request for: ${UniversityEmail}`);
    const pwHash = await hashPassword(Password);

    let updated = false;
    let updateError = null;

    // Try variations of Email column and Password column
    const emailCols = ['UniversityEmail', 'university_email', 'universityemail'];
    const pswdCols = ['PasswordHash', 'password_hash', 'passwordhash'];

    for (const emailCol of emailCols) {
      for (const pswdCol of pswdCols) {
        const { data, error } = await supabase
          .from('User')
          .update({ [pswdCol]: pwHash })
          .eq(emailCol, UniversityEmail)
          .select();

        if (!error && data && data.length > 0) {
          updated = true;
          break;
        }
        if (error) {
          updateError = error;
        }
      }
      if (updated) break;
    }

    if (updated) {
      return res.json({ message: 'Password updated successfully' });
    } else {
      return res.status(404).json({ message: 'User not found or update failed' });
    }

  } catch (err) {
    next(err);
  }
}
