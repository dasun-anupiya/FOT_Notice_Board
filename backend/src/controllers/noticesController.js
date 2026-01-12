import Joi from 'joi';
import { supabase } from '../db/supabaseClient.js';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import { renderAndSaveNotice } from '../utils/noticeRenderer.js';
dotenv.config();

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || null;

// validation
const createNoticeSchema = Joi.object({
  Title: Joi.string().required(),
  Subtitle: Joi.string().allow('', null),
  Paragraph: Joi.string().allow('', null),
  VideoLink: Joi.string().uri().allow('', null),
  AudioLink: Joi.string().uri().allow('', null),
  WhoCanSee: Joi.string().required(), // should be validated to one of visibility_scope values
  StartDate: Joi.date().required(),
  EndDate: Joi.date().required(),
  LayoutID: Joi.number().optional(),
  AttachedLinks: Joi.array().items(Joi.string().uri()).optional() // list of external file/video/image links
});

export async function createNotice(req, res, next) {
  try {
    // text fields in body; files in req.files (multer)
    const body = req.body;
    // parse attached links sent as JSON string if Vite/form
    if (typeof body.AttachedLinks === 'string') {
      try { body.AttachedLinks = JSON.parse(body.AttachedLinks); } catch {}
    }

    // Map TemplateID to LayoutID if provided (frontend uses TemplateID, DB uses LayoutID)
    if (body.TemplateID !== undefined && body.LayoutID === undefined) {
      body.LayoutID = body.TemplateID;
    }

    const { error, value } = createNoticeSchema.validate(body, {
      allowUnknown: false, // Don't allow unknown fields
      stripUnknown: true   // Strip unknown fields
    });
    if (error) return res.status(400).json({ message: error.message });

    // Determine status based on user type
    // Staff and Admin can publish directly, Students need approval
    let noticeStatus = 'Pending Approval';
    const userType = req.user.userType || req.user.user_type || 'Student';
    
    if (userType === 'Staff' || userType === 'Admin') {
      // Staff/Admin can publish directly if Status is provided and is 'Published'
      if (body.Status === 'Published') {
        noticeStatus = 'Published';
      } else {
        // Default to Published for Staff/Admin unless explicitly set to Pending
        noticeStatus = body.Status === 'Pending Approval' ? 'Pending Approval' : 'Published';
      }
    } else {
      // Students always need approval
      noticeStatus = 'Pending Approval';
    }

    // Get userId - handle both naming conventions
    const userId = req.user.userId || req.user.UserID || req.user.user_id;
    if (!userId) {
      return res.status(401).json({ message: 'User ID not found in token' });
    }

    console.log('Creating notice with payload:', {
      Title: value.Title,
      WhoCanSee: value.WhoCanSee,
      StartDate: value.StartDate,
      EndDate: value.EndDate,
      Status: noticeStatus,
      UserID: userId
    });

    // Generate document filename
    const docFileName = value.Title.replace(/\s+/g, '_') + '_' + Date.now();
    
    // Based on actual table schema - all lowercase, no underscores
    // noticeid, title, documentfilename, whocansee, startdate, enddate, status, userid, layoutid
    const payload = {
      title: value.Title,
      documentfilename: docFileName, // Required field - NOT NULL in database
      whocansee: value.WhoCanSee,
      startdate: value.StartDate,
      enddate: value.EndDate,
      status: noticeStatus,
      userid: userId,
      layoutid: value.LayoutID || null
    };

    console.log('Inserting notice with payload:', payload);
    
    // Insert notice - using exact column names from schema (all lowercase)
    const result = await supabase
      .from('notice')
      .insert([payload])
      .select('*')
      .single();
    
    const notice = result.data;
    const insertErr = result.error;
    
    if (insertErr) {
      console.error('Insert error:', insertErr);
    } else {
      console.log('Successfully inserted notice:', notice?.noticeid || notice?.id);
    }

    if (insertErr || !notice) {
      console.error('Failed to insert notice:', insertErr);
      return res.status(500).json({ 
        message: 'Failed to create notice', 
        error: insertErr?.message || 'Database insertion failed',
        details: insertErr 
      });
    }

    // Get notice ID - from actual schema it's 'noticeid' (all lowercase)
    const noticeId = notice.noticeid || notice.NoticeID || notice.notice_id || notice.id;
    if (!noticeId) {
      console.error('Notice ID not found in created notice:', notice);
      return res.status(500).json({ message: 'Notice created but ID not found', notice });
    }

    console.log('Notice inserted successfully with ID:', noticeId);

    // handle attached links (external)
    // Files table schema: fileid, noticeid, filelocation (all lowercase)
    if (Array.isArray(value.AttachedLinks) && value.AttachedLinks.length > 0) {
      for (const link of value.AttachedLinks) {
        const linkPayload = { 
          noticeid: noticeId, 
          filelocation: link 
        };
        
        const { error: linkErr } = await supabase.from('files').insert([linkPayload]);
        if (linkErr) {
          console.error('Failed to insert link:', linkErr);
        } else {
          console.log('Successfully inserted link:', link);
        }
      }
    }

    // handle uploaded files (req.files) if present
    if (req.files && req.files.length > 0) {
      // if BUCKET configured, upload each to Supabase Storage
      for (const file of req.files) {
        const originalPath = file.path; // local temp path
        let publicUrl = null;

        if (BUCKET) {
          const key = `${noticeId}/${uuidv4()}_${file.originalname}`;
          const fileBytes = await fs.readFile(originalPath);
          const { data: uploadData, error: uploadErr } = await supabase.storage
            .from(BUCKET)
            .upload(key, fileBytes, { contentType: file.mimetype, upsert: false });

          if (uploadErr) {
            console.error('Supabase storage upload error', uploadErr);
          } else {
            // get public URL (make sure bucket permissions allow public or create signed URL)
            const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(key);
            publicUrl = publicData?.publicUrl;
          }
        } else {
          // if no bucket configured, you should store elsewhere. For now store path as local path
          publicUrl = `/uploads/${path.basename(originalPath)}`;
        }

        if (publicUrl) {
          // Try both naming conventions
          const filePayload = { 
            noticeid: noticeId, 
            filelocation: publicUrl 
          };
          
          const { error: fileErr } = await supabase.from('files').insert([filePayload]);
          if (fileErr) {
            console.error('Failed to insert file:', fileErr);
          } else {
            console.log('Successfully inserted file:', publicUrl);
          }
        }

        // cleanup local file
        await fs.unlink(originalPath).catch(() => {});
      }
    }

    // create a minimal document content record if you want to save subtitle/paragraph/video
    // could store in a new column or a separate table; for now we will create a Files row for text content as JSON link
    if (value.Subtitle || value.Paragraph || value.VideoLink || value.AudioLink) {
      const meta = { Subtitle: value.Subtitle, Paragraph: value.Paragraph, VideoLink: value.VideoLink, AudioLink: value.AudioLink };
      // Try both naming conventions
      const metaPayload = { 
        noticeid: noticeId, 
        filelocation: JSON.stringify(meta) 
      };
      
      const { error: metaErr } = await supabase.from('files').insert([metaPayload]);
      if (metaErr) {
        console.error('Failed to insert metadata:', metaErr);
      } else {
        console.log('Successfully inserted metadata');
      }
    }

    // Return notice with files - use 'noticeid' (all lowercase) from schema
    const { data: files, error: filesError } = await supabase
      .from('files')
      .select('*')
      .eq('noticeid', noticeId);
    
    if (filesError) {
      console.error('Error fetching files:', filesError);
    } else {
      console.log(`Successfully fetched ${files?.length || 0} file(s)`);
    }
    
    console.log('Notice created successfully:', noticeId);
    
    // Render and save notice if it's published (async, don't wait)
    if (noticeStatus === 'Published') {
      // Run rendering in background, don't block response
      renderAndSaveNotice(notice, value, value.LayoutID || 1)
        .then(renderResult => {
          if (renderResult.success) {
            console.log(`Notice rendered and saved: ${renderResult.filename}`);
          } else {
            console.warn('Failed to render notice:', renderResult.error);
          }
        })
        .catch(renderError => {
          console.error('Error rendering notice:', renderError);
          // Silently fail - rendering shouldn't block notice creation
        });
    }
    
    // Return response immediately, don't wait for rendering
    res.status(201).json({ ...notice, files: files || [] });
  } catch (err) {
    next(err);
  }
}

export async function getNotices(req, res, next) {
  try {
    // implement filtering: status, department, date range, whoCanSee, pagination, mine
    const { status, who, mine, page = 1, limit = 100 } = req.query;
    let query = supabase.from('notice').select('*');

    // Get current user info for visibility filtering
    const user = req.user || {};
    const userId = user.userId || user.user_id || null;
    const userType = user.userType || user.user_type || 'Student';
    
    // Fetch user department from database if userId is available
    let userDepartment = null;
    if (userId) {
      try {
        // Try both 'User' and 'user' table names, and different ID column names
        for (const tableName of ['User', 'user']) {
          for (const idCol of ['UserID', 'userid', 'user_id']) {
            try {
              const { data: userData, error: userErr } = await supabase
                .from(tableName)
                .select('department, Department')
                .eq(idCol, userId)
                .maybeSingle();
              
              if (!userErr && userData) {
                userDepartment = userData.department || userData.Department || userData.DEPARTMENT || null;
                if (userDepartment) break;
              }
            } catch (err) {
              // Try next combination
              continue;
            }
          }
          if (userDepartment) break;
        }
      } catch (err) {
        console.warn('Could not fetch user department:', err);
      }
    }

    const isMine = String(mine).toLowerCase() === 'true';

    // If viewing own notices, constrain by creator
    if (isMine && userId) {
      query = query.eq('userid', userId);
    }

    // Filter by status
    if (status && status !== 'all') {
      // Support comma-separated list e.g., "Published,Approved"
      const statuses = String(status)
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      if (statuses.length > 1) {
        query = query.in('status', statuses);
      } else {
        query = query.eq('status', statuses[0]);
      }
    } else {
      // Default behavior when no explicit status provided
      // If viewing own notices (mine=true): show all statuses
      // Else: Admin/Staff -> Published + Approved; Others -> Published only
      if (isMine) {
        // no status constraint
      } else if (userType === 'Admin' || userType === 'Staff') {
        query = query.in('status', ['Published', 'Approved']);
      } else {
        query = query.eq('status', 'Published');
      }
    }

    // Filter by visibility (whoCanSee) based on user
    // Visibility options: 'Everyone', 'Staff', 'IAT Department', 'AT Department', 'ET Department', 'ICT Department'
    const visibilityFilter = [];
    
    // Everyone can see notices visible to "Everyone"
    visibilityFilter.push('Everyone');
    
    // Staff and Admin can see notices visible to "Staff"
    if (userType === 'Staff' || userType === 'Admin') {
      visibilityFilter.push('Staff');
    }
    
    // Add department-specific visibility
    if (userDepartment) {
      // Map department to visibility scope format
      const deptMapping = {
        'IAT': 'IAT Department',
        'AT': 'AT Department',
        'ET': 'ET Department',
        'ICT': 'ICT Department'
      };
      const deptVisibility = deptMapping[userDepartment];
      if (deptVisibility) {
        visibilityFilter.push(deptVisibility);
      }
    }

    // Filter by visibility - skip when viewing own notices or when explicitly requesting Published
    const requestedStatuses = status ? String(status).split(',').map(s => s.trim()) : [];
    const includesPublished = requestedStatuses.some(s => s.toLowerCase() === 'published');
    const includesPending = requestedStatuses.some(s => s.toLowerCase() === 'pending approval' || s.toLowerCase() === 'pending');
    const isAdminOrStaffView = (userType === 'Admin' || userType === 'Staff');
    
    // Skip visibility filtering for:
    // - explicit Published requests (public board)
    // - admin/staff reviewing Pending Approval notices
    if (!isMine && !includesPublished && !(isAdminOrStaffView && includesPending)) {
      if (visibilityFilter.length > 0) {
        query = query.in('whocansee', visibilityFilter);
      }
    }

    // Additional who filter from query params (if admin wants to filter)
    if (who && (userType === 'Admin' || userType === 'Staff')) {
      query = query.eq('whocansee', who);
    }

    // Filter by date range - only show active notices unless viewing own notices or explicitly requesting Published
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    // Skip date filtering when:
    // - admin/staff reviewing Pending Approval, OR
    // - any user explicitly requesting Published
    if (!isMine && !(isAdminOrStaffView && includesPending) && !includesPublished) {
      query = query.lte('startdate', today); // Start date <= today
      query = query.gte('enddate', today); // End date >= today
    }
    
    // For noticeboard (Published notices), always filter out expired notices (enddate < today)
    if (includesPublished && !isMine) {
      query = query.gte('enddate', today); // End date >= today (not expired)
    }

    // Sort by lastupdatedtimestamp (most recently modified first), then by createdtimestamp
    query = query
      .order('lastupdatedtimestamp', { ascending: false })
      .order('createdtimestamp', { ascending: false });

    // Apply pagination if limit is specified and less than 100
    if (limit && limit < 100) {
      query = query.range((page - 1) * limit, page * limit - 1);
    }

    const { data, error } = await query;
    if (error) throw error;
    
    console.log(`Loaded ${data?.length || 0} notices for user type: ${userType}, department: ${userDepartment}`);
    res.json(data || []);
  } catch (err) {
    next(err);
  }
}

export async function getNotice(req, res, next) {
  try {
    const id = Number(req.params.id);
    // Use 'noticeid' (all lowercase) from schema
    const { data, error } = await supabase
      .from('notice')
      .select('*')
      .eq('noticeid', id)
      .single();
    
    if (error || !data) return res.status(404).json({ message: 'Notice not found' });

    // get files - use 'noticeid' (all lowercase)
    const { data: files } = await supabase
      .from('files')
      .select('*')
      .eq('noticeid', id);
    
    res.json({ ...data, files: files || [] });
  } catch (err) {
    next(err);
  }
}

export async function updateNotice(req, res, next) {
  try {
    const id = Number(req.params.id);
    // Get existing notice - use 'noticeid' (all lowercase)
    const { data: existing, error: fetchError } = await supabase
      .from('notice')
      .select('*')
      .eq('noticeid', id)
      .single();
    
    if (fetchError || !existing) return res.status(404).json({ message: 'Not found' });

    // Check permissions - use 'userid' (all lowercase)
    const existingUserId = existing.userid || existing.UserID || existing.user_id;
    if (req.user.userId !== existingUserId && req.user.userType !== 'Admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Map input fields to lowercase column names
    const fieldMap = {
      'Title': 'title',
      'WhoCanSee': 'whocansee',
      'StartDate': 'startdate',
      'EndDate': 'enddate',
      'LayoutID': 'layoutid',
      'Status': 'status'
    };

    const updates = {};
    for (const [inputKey, dbKey] of Object.entries(fieldMap)) {
      if (req.body[inputKey] !== undefined) {
        updates[dbKey] = req.body[inputKey];
      }
    }

    // Enforce status change permissions: only Admin/Staff can change status
    const requesterType = req.user.userType || req.user.user_type || 'Student';
    const isAdminOrStaff = requesterType === 'Admin' || requesterType === 'Staff';
    if (!isAdminOrStaff && Object.prototype.hasOwnProperty.call(updates, 'status')) {
      delete updates.status;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    // Update using lowercase column names
    const { data, error } = await supabase
      .from('notice')
      .update(updates)
      .eq('noticeid', id)
      .select('*')
      .single();
    
    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function deleteNotice(req, res, next) {
  try {
    const id = Number(req.params.id);
    // Get existing notice - use 'noticeid' (all lowercase)
    const { data: existing, error: fetchError } = await supabase
      .from('notice')
      .select('*')
      .eq('noticeid', id)
      .single();
    
    if (fetchError || !existing) return res.status(404).json({ message: 'Not found' });

    // Check permissions - use 'userid' (all lowercase)
    const existingUserId = existing.userid || existing.UserID || existing.user_id;
    if (req.user.userId !== existingUserId && req.user.userType !== 'Admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Delete using 'noticeid' (all lowercase)
    const { data, error } = await supabase
      .from('notice')
      .delete()
      .eq('noticeid', id)
      .select('*')
      .single();
    
    if (error) throw error;
    res.json({ success: true, deleted: data });
  } catch (err) {
    next(err);
  }
}

export async function approveNotice(req, res, next) {
  try {
    // admin/staff endpoint to approve/reject/publish/unpublish/expire
    const id = Number(req.params.id);
    const { action } = req.body; // 'approve' | 'reject' | 'publish' | 'unpublish' | 'expire'
    
    // Check user permissions (allow owner-student to publish an already approved notice)
    const userType = req.user.userType || req.user.user_type || 'Student';
    const requesterId = req.user.userId;
    const isAdminOrStaff = userType === 'Admin' || userType === 'Staff';

    const map = {
      approve: 'Approved',
      reject: 'Rejected',
      publish: 'Published',
      unpublish: 'Approved', // Unpublish means changing from Published back to Approved
      expire: 'Expired'
    };
    
    if (!map[action]) {
      return res.status(400).json({ message: 'Invalid action. Allowed: approve, reject, publish, unpublish, expire' });
    }

    // Get existing notice to check current status and owner
    const { data: existing, error: fetchError } = await supabase
      .from('notice')
      .select('*')
      .eq('noticeid', id)
      .single();
    
    if (fetchError || !existing) {
      return res.status(404).json({ message: 'Notice not found' });
    }

    const isOwner = existing.userid === requesterId;
    const allowPublishByOwner = (action === 'publish' && isOwner && (existing.status === 'Approved' || existing.status === 'approved'));
    
    if (!isAdminOrStaff && !allowPublishByOwner) {
      return res.status(403).json({ message: 'Only Staff/Admin can perform this action' });
    }

    // Update using lowercase column names
    const { data, error } = await supabase
      .from('notice')
      .update({ status: map[action] })
      .eq('noticeid', id)
      .select('*')
      .single();
    
    if (error) throw error;
    
    // If notice is being published, render and save it (async, don't wait)
    if (map[action] === 'Published') {
      // Run rendering in background, don't block response
      renderAndSaveNotice(data, null, data.layoutid || 1)
        .then(renderResult => {
          if (renderResult.success) {
            console.log(`Notice rendered and saved: ${renderResult.filename}`);
          } else {
            console.warn('Failed to render notice:', renderResult.error);
          }
        })
        .catch(renderError => {
          console.error('Error rendering notice:', renderError);
          // Silently fail - rendering shouldn't block notice approval
        });
    }
    
    // If notice is being unpublished, optionally remove rendered file (optional)
    if (map[action] === 'Approved' && existing.status === 'Published') {
      console.log(`Notice ${id} unpublished - status changed from Published to Approved`);
    }
    
    // Return response immediately, don't wait for rendering
    res.json({ success: true, notice: data });
  } catch (err) {
    next(err);
  }
}

export async function createNoticeResponse(req, res, next) {
  try {
    const noticeId = Number(req.params.id);
    const { Response } = req.body;
    
    if (!Response) return res.status(400).json({ message: 'Response text required' });

    // Check if user already responded - use lowercase column names
    const { data: existing } = await supabase
      .from('noticeresponse')
      .select('*')
      .eq('noticeid', noticeId)
      .eq('userid', req.user.userId)
      .maybeSingle();
    
    if (existing) return res.status(409).json({ message: 'User already responded to this notice' });

    // Insert response - use lowercase column names (noticeid, userid, response)
    const { data, error } = await supabase
      .from('noticeresponse')
      .insert([{ noticeid: noticeId, userid: req.user.userId, response: Response }])
      .select('*')
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, response: data });
  } catch (err) {
    next(err);
  }
}

export async function getNoticeResponses(req, res, next) {
  try {
    const noticeId = Number(req.params.id);
    
    // Get responses with user information - use lowercase column names
    const { data: responses, error } = await supabase
      .from('noticeresponse')
      .select('*')
      .eq('noticeid', noticeId)
      .order('createdtimestamp', { ascending: false });

    if (error) throw error;

    // Fetch user information for each response
    const responsesWithUsers = await Promise.all(
      (responses || []).map(async (response) => {
        const userId = response.userid || response.UserID || response.user_id;
        if (!userId) return response;

        // Try to fetch user info
        let userInfo = null;
        for (const tableName of ['User', 'user']) {
          for (const idCol of ['UserID', 'userid', 'user_id']) {
            try {
              const { data: userData, error: userErr } = await supabase
                .from(tableName)
                .select('UniversityEmail, university_email, universityemail, UserType, user_type, usertype, Department, department, Designation, designation')
                .eq(idCol, userId)
                .maybeSingle();
              
              if (!userErr && userData) {
                userInfo = {
                  email: userData.UniversityEmail || userData.university_email || userData.universityemail || '',
                  userType: userData.UserType || userData.user_type || userData.usertype || '',
                  department: userData.Department || userData.department || '',
                  designation: userData.Designation || userData.designation || ''
                };
                break;
              }
            } catch (err) {
              continue;
            }
          }
          if (userInfo) break;
        }

        return { ...response, user: userInfo };
      })
    );

    res.json(responsesWithUsers || []);
  } catch (err) {
    next(err);
  }
}

export async function updateNoticeResponse(req, res, next) {
  try {
    const responseId = Number(req.params.responseId);
    const { Response } = req.body;
    
    if (!Response || !Response.trim()) {
      return res.status(400).json({ message: 'Response text required' });
    }

    // Get existing response - use lowercase column names
    const { data: response, error: fetchError } = await supabase
      .from('noticeresponse')
      .select('*')
      .eq('responseid', responseId)
      .single();

    if (fetchError || !response) {
      return res.status(404).json({ message: 'Response not found' });
    }

    // Only owner or admin can update - use 'userid' (all lowercase)
    const responseUserId = response.userid || response.UserID || response.user_id;
    if (req.user.userId !== responseUserId && req.user.userType !== 'Admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Update response - use lowercase column names
    const { data, error } = await supabase
      .from('noticeresponse')
      .update({ response: Response })
      .eq('responseid', responseId)
      .select('*')
      .single();

    if (error) throw error;
    res.json({ success: true, response: data });
  } catch (err) {
    next(err);
  }
}

export async function getAllResponses(req, res, next) {
  try {
    const userType = req.user.userType || req.user.user_type || 'Student';
    
    // Only Staff and Admin can view all responses
    if (userType !== 'Admin' && userType !== 'Staff') {
      return res.status(403).json({ message: 'Only Staff and Admin can view all responses' });
    }

    const { noticeId, userId, page = 1, limit = 100 } = req.query;
    
    // Try different table name variations (Supabase may use lowercase)
    let responses = null;
    let error = null;
    
    for (const tableName of ['NoticeResponse', 'noticeresponse', 'notice_response']) {
      try {
        let query = supabase.from(tableName).select('*');
        
        // Filter by notice if provided - try different column name variations
        if (noticeId) {
          const noticeIdNum = Number(noticeId);
          // Try lowercase first (most common in Supabase)
          query = query.eq('noticeid', noticeIdNum);
        }

        // Filter by user if provided
        if (userId) {
          const userIdNum = Number(userId);
          query = query.eq('userid', userIdNum);
        }

        // Order by ResponseID (descending) - NoticeResponse table doesn't have CreatedTimeStamp
        // Try both PascalCase and lowercase
        query = query.order('responseid', { ascending: false });

        const result = await query;
        if (!result.error && result.data) {
          responses = result.data;
          console.log(`Successfully fetched ${responses.length} responses from table: ${tableName}`);
          break;
        } else if (result.error) {
          error = result.error;
          console.warn(`Error with table ${tableName}:`, result.error.message);
          // Continue to next table name
        }
      } catch (err) {
        error = err;
        console.warn(`Exception with table ${tableName}:`, err.message);
        continue;
      }
    }
    
    if (error && !responses) {
      console.error('Error fetching responses from all table variations:', error);
      return res.status(500).json({ 
        message: 'Failed to fetch responses', 
        error: error.message || 'Unknown error',
        details: error 
      });
    }
    
    if (!responses) {
      responses = [];
    }

    // Apply pagination if needed
    let paginatedResponses = responses || [];
    if (limit && limit < 1000 && paginatedResponses.length > limit) {
      const start = (page - 1) * limit;
      const end = start + limit;
      paginatedResponses = paginatedResponses.slice(start, end);
    }

    // Fetch user and notice information for each response
    const responsesWithDetails = await Promise.all(
      (paginatedResponses || []).map(async (response) => {
        // Handle both PascalCase and lowercase column names
        const userId = response.UserID || response.userid || response.user_id;
        const noticeId = response.NoticeID || response.noticeid || response.notice_id;

        // Fetch user info
        let userInfo = null;
        if (userId) {
          for (const tableName of ['User', 'user']) {
            for (const idCol of ['UserID', 'userid', 'user_id']) {
              try {
                const { data: userData, error: userErr } = await supabase
                  .from(tableName)
                  .select('UniversityEmail, university_email, universityemail, UserType, user_type, usertype, Department, department, Designation, designation')
                  .eq(idCol, userId)
                  .maybeSingle();
                
                if (!userErr && userData) {
                  userInfo = {
                    email: userData.UniversityEmail || userData.university_email || userData.universityemail || '',
                    userType: userData.UserType || userData.user_type || userData.usertype || '',
                    department: userData.Department || userData.department || '',
                    designation: userData.Designation || userData.designation || ''
                  };
                  break;
                }
              } catch (err) {
                continue;
              }
            }
            if (userInfo) break;
          }
        }

        // Fetch notice info
        let noticeInfo = null;
        if (noticeId) {
          try {
            const { data: noticeData, error: noticeErr } = await supabase
              .from('notice')
              .select('title, Title, noticeid, NoticeID')
              .eq('noticeid', noticeId)
              .maybeSingle();
            
            if (!noticeErr && noticeData) {
              noticeInfo = {
                id: noticeData.noticeid || noticeData.NoticeID || noticeId,
                title: noticeData.title || noticeData.Title || ''
              };
            }
          } catch (err) {
            console.warn('Could not fetch notice info:', err);
          }
        }

        return {
          ...response,
          user: userInfo,
          notice: noticeInfo
        };
      })
    );

    res.json(responsesWithDetails || []);
  } catch (err) {
    next(err);
  }
}

export async function deleteNoticeResponse(req, res, next) {
  try {
    const responseId = Number(req.params.responseId);
    
    // Get response - use lowercase column names (responseid)
    const { data: response, error: fetchError } = await supabase
      .from('noticeresponse')
      .select('*')
      .eq('responseid', responseId)
      .single();

    if (fetchError || !response) return res.status(404).json({ message: 'Response not found' });

    // only owner or admin can delete - use 'userid' (all lowercase)
    const responseUserId = response.userid || response.UserID || response.user_id;
    if (req.user.userId !== responseUserId && req.user.userType !== 'Admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Delete using 'responseid' (all lowercase)
    const { error } = await supabase
      .from('noticeresponse')
      .delete()
      .eq('responseid', responseId);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
