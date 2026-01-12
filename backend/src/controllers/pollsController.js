import Joi from 'joi';
import { supabase } from '../db/supabaseClient.js';

// create poll schema
const createPollSchema = Joi.object({
  Question: Joi.string().required(),
  Options: Joi.array().items(Joi.string()).min(2).required(),
  StartDate: Joi.date().required(),
  EndDate: Joi.date().required(),
  WhoCanResponse: Joi.string().required(),
  WhoCanViewResults: Joi.string().required()
});

export async function createPoll(req, res, next) {
  try {
    const { error, value } = createPollSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    // Try different table and column name variations
    const pollPayloads = [
      {
        Question: value.Question,
        NoOfOptions: value.Options.length,
        StartDate: value.StartDate,
        EndDate: value.EndDate,
        Status: 'Pending Approval',
        WhoCanResponse: value.WhoCanResponse,
        WhoCanViewResults: value.WhoCanViewResults,
        UserID: req.user.userId
      },
      {
        question: value.Question,
        noofoptions: value.Options.length,
        startdate: value.StartDate,
        enddate: value.EndDate,
        status: 'Pending Approval',
        whocanresponse: value.WhoCanResponse,
        whocanviewresults: value.WhoCanViewResults,
        userid: req.user.userId
      }
    ];

    let poll = null;
    let pollErr = null;

    for (const tableName of ['Poll', 'poll']) {
      for (const payload of pollPayloads) {
        try {
          const result = await supabase.from(tableName).insert([payload]).select('*').single();
          if (!result.error && result.data) {
            poll = result.data;
            break;
          } else {
            pollErr = result.error;
          }
        } catch (err) {
          pollErr = err;
          continue;
        }
      }
      if (poll) break;
    }

    if (!poll) {
      console.error('Failed to create poll:', pollErr);
      throw pollErr || new Error('Failed to create poll');
    }

    const pollId = poll.PollID || poll.pollid || poll.poll_id || poll.id;

    // insert options - try different table and column name variations
    for (const opt of value.Options) {
      const optionPayloads = [
        { PollID: pollId, OptionText: opt },
        { pollid: pollId, optiontext: opt },
        { poll_id: pollId, option_text: opt }
      ];

      let optionInserted = false;
      for (const tableName of ['Option', 'option']) {
        for (const payload of optionPayloads) {
          try {
            const { error: optErr } = await supabase.from(tableName).insert([payload]);
            if (!optErr) {
              optionInserted = true;
              break;
            }
          } catch (err) {
            continue;
          }
        }
        if (optionInserted) break;
      }

      if (!optionInserted) {
        console.warn(`Failed to insert option: ${opt}`);
      }
    }

    res.status(201).json({ poll });
  } catch (err) {
    next(err);
  }
}

export async function getPolls(req, res, next) {
  try {
    const user = req.user || {};
    const userType = user.userType || user.user_type || 'Student';
    const userId = user.userId || user.user_id || null;

    // Fetch user department if available
    let userDepartment = null;
    if (userId) {
      try {
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
              continue;
            }
          }
          if (userDepartment) break;
        }
      } catch (err) {
        console.warn('Could not fetch user department:', err);
      }
    }

    // Try different table name variations
    let polls = null;
    let error = null;

    for (const tableName of ['Poll', 'poll']) {
      let query = supabase.from(tableName).select('*');

      // Order by pollid (chronological)
      query = query.order('pollid', { ascending: false });

      const result = await query;
      if (!result.error && result.data) {
        polls = result.data;
        console.log(`Successfully fetched ${polls.length} polls from table: ${tableName}`);
        break;
      } else if (result.error) {
        error = result.error;
        console.warn(`Error with table ${tableName}:`, result.error.message);
        // Continue to next table name
      }
    }

    if (error && !polls) {
      console.error('Error fetching polls from all table variations:', error);
      return res.status(500).json({
        message: 'Failed to fetch polls',
        error: error.message || 'Unknown error',
        details: error
      });
    }

    if (!polls) {
      polls = [];
      console.log('No polls found, returning empty array');
    }

    // Filter by visibility, status, and date range (similar to notices)
    // For regular users, only show Published polls that are active
    // For Staff/Admin, show Published and Approved polls
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const filteredPolls = polls.filter((poll) => {
      const pollStatus = poll.Status || poll.status || '';
      const whoCanResponse = poll.WhoCanResponse || poll.whocanresponse || '';
      const startDate = poll.StartDate || poll.startdate || poll.startDate;
      const endDate = poll.EndDate || poll.enddate || poll.endDate;

      // Status filtering
      const statusLower = pollStatus.toLowerCase();
      if (userType === 'Admin') {
        // Admin can see all polls
        return true;
      } else if (userType === 'Staff') {
        // Staff can see Published and Approved polls
        if (statusLower !== 'published' && statusLower !== 'approved') {
          return false;
        }
      } else {
        // Regular users only see Published polls
        if (statusLower !== 'published') {
          return false;
        }
      }

      // Date range filtering - only show active polls (not expired)
      // For "Respond to Polls" page, show polls that are currently active
      if (startDate && endDate) {
        try {
          // Poll should be active: startDate <= today <= endDate
          const startObj = new Date(startDate);
          const endObj = new Date(endDate);

          if (!isNaN(startObj.getTime()) && !isNaN(endObj.getTime())) {
            const start = startObj.toISOString().split('T')[0];
            const end = endObj.toISOString().split('T')[0];
            if (start > today || end < today) {
              return false; // Poll hasn't started yet or has expired
            }
          }
        } catch (e) {
          console.error('Date parsing error for poll:', poll, e);
          return false; // exclude invalid dates
        }
      }

      // Visibility filtering
      if (whoCanResponse === 'Everyone') {
        return true;
      }

      if (whoCanResponse === 'Staff' && (userType === 'Staff' || userType === 'Admin')) {
        return true;
      }

      // Department visibility
      if (userDepartment) {
        const deptMapping = {
          'IAT': 'IAT Department',
          'AT': 'AT Department',
          'ET': 'ET Department',
          'ICT': 'ICT Department'
        };
        const deptVisibility = deptMapping[userDepartment];
        if (deptVisibility && whoCanResponse === deptVisibility) {
          return true;
        }
      }

      return false;
    });

    res.json(filteredPolls);
  } catch (err) {
    next(err);
  }
}

export async function getPoll(req, res, next) {
  try {
    const id = Number(req.params.id);

    // Try different table and column name variations
    let poll = null;
    for (const tableName of ['Poll', 'poll']) {
      for (const idCol of ['PollID', 'pollid', 'poll_id']) {
        try {
          const { data, error } = await supabase.from(tableName).select('*').eq(idCol, id).single();
          if (!error && data) {
            poll = data;
            break;
          }
        } catch (err) {
          continue;
        }
      }
      if (poll) break;
    }

    if (!poll) return res.status(404).json({ message: 'Poll not found' });

    const pollId = poll.PollID || poll.pollid || poll.poll_id || poll.id;

    // Get options - try different table and column name variations
    let options = null;
    for (const tableName of ['Option', 'option']) {
      for (const idCol of ['PollID', 'pollid', 'poll_id']) {
        try {
          const { data, error } = await supabase.from(tableName).select('*').eq(idCol, pollId);
          if (!error && data) {
            options = data;
            break;
          }
        } catch (err) {
          continue;
        }
      }
      if (options) break;
    }

    res.json({ poll, options: options || [] });
  } catch (err) {
    next(err);
  }
}

export async function votePoll(req, res, next) {
  try {
    const pollId = Number(req.params.id);
    const optionId = req.body.OptionID || req.body.optionid || req.body.option_id;
    if (!optionId) return res.status(400).json({ message: 'OptionID required' });

    // ensure user hasn't voted - try different table and column name variations
    let existing = null;
    for (const tableName of ['PollResponse', 'pollresponse', 'poll_response']) {
      for (const pollIdCol of ['PollID', 'pollid', 'poll_id']) {
        for (const userIdCol of ['UserID', 'userid', 'user_id']) {
          try {
            const { data, error } = await supabase
              .from(tableName)
              .select('*')
              .eq(pollIdCol, pollId)
              .eq(userIdCol, req.user.userId)
              .maybeSingle();
            if (!error && data) {
              existing = data;
              break;
            }
          } catch (err) {
            continue;
          }
        }
        if (existing) break;
      }
      if (existing) break;
    }

    if (existing) return res.status(409).json({ message: 'User already voted' });

    // insert response - try different table and column name variations
    const responsePayloads = [
      { PollID: pollId, OptionID: optionId, UserID: req.user.userId },
      { pollid: pollId, optionid: optionId, userid: req.user.userId },
      { poll_id: pollId, option_id: optionId, user_id: req.user.userId }
    ];

    let response = null;
    let error = null;
    for (const tableName of ['PollResponse', 'pollresponse', 'poll_response']) {
      for (const payload of responsePayloads) {
        try {
          const { data, err } = await supabase.from(tableName).insert([payload]).select('*').single();
          if (!err && data) {
            response = data;
            break;
          } else {
            error = err;
          }
        } catch (err) {
          error = err;
          continue;
        }
      }
      if (response) break;
    }

    if (!response) {
      console.error('Failed to vote:', error);
      throw error || new Error('Failed to vote');
    }

    res.json({ success: true, response });
  } catch (err) {
    next(err);
  }
}

export async function getPollResults(req, res, next) {
  try {
    const id = Number(req.params.id);

    // get poll details - try variations
    let poll = null;
    for (const tableName of ['Poll', 'poll']) {
      const { data, error } = await supabase.from(tableName).select('*').eq(req.params.id ? 'PollID' : 'pollid', id).maybeSingle();
      if (!error && data) {
        poll = data;
        break;
      }
      // Fallback for ID column name if table found but ID mismatch
      if (!poll && !error) {
        const { data: data2 } = await supabase.from(tableName).select('*').eq('pollid', id).maybeSingle();
        if (data2) { poll = data2; break; }
      }
    }

    // If still not found, try robust search like getPoll
    if (!poll) {
      for (const tableName of ['Poll', 'poll']) {
        for (const idCol of ['PollID', 'pollid', 'poll_id']) {
          const { data } = await supabase.from(tableName).select('*').eq(idCol, id).maybeSingle();
          if (data) { poll = data; break; }
        }
        if (poll) break;
      }
    }

    if (!poll) return res.status(404).json({ message: 'Poll not found' });
    const pollId = poll.PollID || poll.pollid || poll.poll_id || poll.id;

    // get all options - try variations
    let options = null;
    for (const tableName of ['Option', 'option']) {
      for (const idCol of ['PollID', 'pollid', 'poll_id']) {
        const { data, error } = await supabase.from(tableName).select('*').eq(idCol, pollId);
        if (!error && data && data.length > 0) { options = data; break; }
      }
      if (options) break;
    }
    if (!options) options = [];

    // get all responses - try variations
    let responses = null;
    for (const tableName of ['PollResponse', 'pollresponse', 'poll_response']) {
      for (const idCol of ['PollID', 'pollid', 'poll_id']) {
        const { data, error } = await supabase.from(tableName).select('*').eq(idCol, pollId);
        if (!error && data) { responses = data; break; }
      }
      if (responses) break;
    }
    if (!responses) responses = [];

    // count votes for each option
    const voteCounts = {};
    options.forEach(opt => {
      const optId = opt.OptionID || opt.optionid || opt.option_id || opt.id;
      voteCounts[optId] = 0;
    });

    responses.forEach(response => {
      const respOptId = response.OptionID || response.optionid || response.option_id;
      if (voteCounts[respOptId] !== undefined) {
        voteCounts[respOptId]++;
      }
    });

    // check if current user has voted
    let userVoted = false;
    if (req.user && req.user.userId) {
      for (const tableName of ['PollResponse', 'pollresponse', 'poll_response']) {
        for (const idCol of ['PollID', 'pollid', 'poll_id']) {
          for (const userIdCol of ['UserID', 'userid', 'user_id']) {
            const { data } = await supabase.from(tableName).select('*')
              .eq(idCol, pollId)
              .eq(userIdCol, req.user.userId)
              .maybeSingle();
            if (data) { userVoted = true; break; }
          }
          if (userVoted) break;
        }
        if (userVoted) break;
      }
    }

    // format results
    const results = options.map(opt => ({
      OptionID: opt.OptionID || opt.optionid || opt.option_id,
      OptionText: opt.OptionText || opt.optiontext || opt.option_text,
      VoteCount: voteCounts[opt.OptionID || opt.optionid || opt.option_id] || 0
    }));

    res.json({ poll, results, totalVotes: responses.length, userVoted });
  } catch (err) {
    next(err);
  }
}

export async function updatePollStatus(req, res, next) {
  try {
    // admin endpoint to approve/reject/publish/expire
    const id = Number(req.params.id);
    const { action } = req.body; // 'approve' | 'reject' | 'publish' | 'expire'
    const map = {
      approve: 'Approved',
      reject: 'Rejected',
      publish: 'Published',
      expire: 'Expired'
    };
    if (!map[action]) return res.status(400).json({ message: 'Invalid action' });

    const { data, error } = await supabase.from('Poll').update({ Status: map[action] }).eq('PollID', id).select('*').single();
    if (error) throw error;
    res.json({ success: true, poll: data });
  } catch (err) {
    next(err);
  }
}

export async function updatePoll(req, res, next) {
  try {
    const id = Number(req.params.id);
    // only creator or admin can update
    const { data: existing } = await supabase.from('Poll').select('*').eq('PollID', id).single();
    if (!existing) return res.status(404).json({ message: 'Poll not found' });

    if (req.user.userId !== existing.UserID && req.user.userType !== 'Admin') return res.status(403).json({ message: 'Forbidden' });

    // basic update fields allowed
    const allowed = ['Question', 'StartDate', 'EndDate', 'WhoCanResponse', 'WhoCanViewResults', 'Status'];
    const updates = {};
    for (const k of allowed) {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    }

    const { data, error } = await supabase.from('Poll').update(updates).eq('PollID', id).select('*').single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function deletePoll(req, res, next) {
  try {
    const id = Number(req.params.id);
    const { data: existing } = await supabase.from('Poll').select('*').eq('PollID', id).single();
    if (!existing) return res.status(404).json({ message: 'Poll not found' });

    if (req.user.userId !== existing.UserID && req.user.userType !== 'Admin') return res.status(403).json({ message: 'Forbidden' });

    const { data, error } = await supabase.from('Poll').delete().eq('PollID', id).select('*').single();
    if (error) throw error;
    res.json({ success: true, deleted: data });
  } catch (err) {
    next(err);
  }
}
