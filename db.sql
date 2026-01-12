-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.Option (
  optionid integer NOT NULL DEFAULT nextval('"Option_optionid_seq"'::regclass),
  pollid integer,
  optiontext text NOT NULL,
  CONSTRAINT Option_pkey PRIMARY KEY (optionid),
  CONSTRAINT Option_pollid_fkey FOREIGN KEY (pollid) REFERENCES public.poll(pollid)
);
CREATE TABLE public.User (
  userid integer NOT NULL DEFAULT nextval('"User_userid_seq"'::regclass),
  universityemail text NOT NULL UNIQUE,
  usertype USER-DEFINED NOT NULL,
  department USER-DEFINED,
  designation text,
  batch text,
  passwordhash text NOT NULL,
  createdtimestamp timestamp without time zone DEFAULT now(),
  lastupdatedtimestamp timestamp without time zone DEFAULT now(),
  CONSTRAINT User_pkey PRIMARY KEY (userid)
);
CREATE TABLE public.files (
  fileid integer NOT NULL DEFAULT nextval('files_fileid_seq'::regclass),
  noticeid integer,
  filelocation text NOT NULL,
  CONSTRAINT files_pkey PRIMARY KEY (fileid),
  CONSTRAINT files_noticeid_fkey FOREIGN KEY (noticeid) REFERENCES public.notice(noticeid)
);
CREATE TABLE public.layout (
  layoutid integer NOT NULL DEFAULT nextval('layout_layoutid_seq'::regclass),
  layoutname text NOT NULL,
  layoutfilelocation text NOT NULL,
  CONSTRAINT layout_pkey PRIMARY KEY (layoutid)
);
CREATE TABLE public.notice (
  noticeid integer NOT NULL DEFAULT nextval('notice_noticeid_seq'::regclass),
  title text NOT NULL,
  documentfilename text NOT NULL,
  whocansee USER-DEFINED NOT NULL,
  startdate date NOT NULL,
  enddate date NOT NULL,
  status USER-DEFINED DEFAULT 'Pending Approval'::notice_status,
  userid integer,
  layoutid integer,
  createdtimestamp timestamp without time zone DEFAULT now(),
  lastupdatedtimestamp timestamp without time zone DEFAULT now(),
  CONSTRAINT notice_pkey PRIMARY KEY (noticeid),
  CONSTRAINT notice_userid_fkey FOREIGN KEY (userid) REFERENCES public.User(userid),
  CONSTRAINT notice_layoutid_fkey FOREIGN KEY (layoutid) REFERENCES public.layout(layoutid)
);
CREATE TABLE public.noticeresponse (
  responseid integer NOT NULL DEFAULT nextval('noticeresponse_responseid_seq'::regclass),
  noticeid integer,
  userid integer,
  response text NOT NULL,
  CONSTRAINT noticeresponse_pkey PRIMARY KEY (responseid),
  CONSTRAINT noticeresponse_noticeid_fkey FOREIGN KEY (noticeid) REFERENCES public.notice(noticeid),
  CONSTRAINT noticeresponse_userid_fkey FOREIGN KEY (userid) REFERENCES public.User(userid)
);
CREATE TABLE public.poll (
  pollid integer NOT NULL DEFAULT nextval('poll_pollid_seq'::regclass),
  question text NOT NULL,
  noofoptions integer NOT NULL,
  startdate date NOT NULL,
  enddate date NOT NULL,
  status USER-DEFINED DEFAULT 'Pending Approval'::poll_status,
  whocanresponse USER-DEFINED NOT NULL,
  whocanviewresults USER-DEFINED NOT NULL,
  userid integer,
  createdtimestamp timestamp without time zone DEFAULT now(),
  CONSTRAINT poll_pkey PRIMARY KEY (pollid),
  CONSTRAINT poll_userid_fkey FOREIGN KEY (userid) REFERENCES public.User(userid)
);
CREATE TABLE public.pollresponse (
  pollresponseid integer NOT NULL DEFAULT nextval('pollresponse_pollresponseid_seq'::regclass),
  pollid integer,
  optionid integer,
  userid integer,
  CONSTRAINT pollresponse_pkey PRIMARY KEY (pollresponseid),
  CONSTRAINT pollresponse_pollid_fkey FOREIGN KEY (pollid) REFERENCES public.poll(pollid),
  CONSTRAINT pollresponse_optionid_fkey FOREIGN KEY (optionid) REFERENCES public.Option(optionid),
  CONSTRAINT pollresponse_userid_fkey FOREIGN KEY (userid) REFERENCES public.User(userid)
);