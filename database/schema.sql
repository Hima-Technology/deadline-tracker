--
-- PostgreSQL database dump
--

\restrict Db5ZA5KZ66dIQVedfmTJEdITRY6d7RZ0K3eqN4Rue3AKNYMRiDPpbl36l0qvj12

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: activity_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.activity_logs (
    id integer NOT NULL,
    user_id integer,
    closing_id integer,
    action character varying(100) NOT NULL,
    old_value jsonb,
    new_value jsonb,
    ip_address character varying(45),
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.activity_logs OWNER TO postgres;

--
-- Name: activity_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.activity_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.activity_logs_id_seq OWNER TO postgres;

--
-- Name: activity_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.activity_logs_id_seq OWNED BY public.activity_logs.id;


--
-- Name: assessments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assessments (
    id integer NOT NULL,
    client_id integer,
    authority character varying(50),
    reference_number character varying(100),
    assessment_date date,
    status character varying(50),
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT assessments_authority_check CHECK (((authority)::text = ANY ((ARRAY['TRA'::character varying, 'ZRA'::character varying, 'BPRA'::character varying])::text[])))
);


ALTER TABLE public.assessments OWNER TO postgres;

--
-- Name: assessments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.assessments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.assessments_id_seq OWNER TO postgres;

--
-- Name: assessments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.assessments_id_seq OWNED BY public.assessments.id;


--
-- Name: clients; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.clients (
    id integer NOT NULL,
    company_name character varying(200) NOT NULL,
    contact_person character varying(150),
    phone character varying(30),
    email character varying(150),
    notes text,
    created_by integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    contract_start_date date,
    contract_end_date date,
    service_type character varying(100),
    total_contract_amount numeric(12,2) DEFAULT 0,
    amount_paid numeric(12,2) DEFAULT 0,
    assessment_info text,
    location character varying(50),
    tin character varying(50),
    company_registration_number character varying(100),
    business_type character varying(40),
    enabled_tax_types jsonb DEFAULT '[]'::jsonb NOT NULL,
    tra_number character varying(50),
    zra_number character varying(50),
    bpra_number character varying(50),
    zssf_number character varying(50),
    industry character varying(100),
    financial_year_start character varying(10) DEFAULT '12-31'::character varying,
    financial_year_end date,
    tra_username character varying(100),
    tra_password character varying(100),
    zra_username character varying(100),
    zra_password character varying(100),
    bpra_username character varying(100),
    bpra_password character varying(100),
    zssf_username character varying(100),
    zssf_password character varying(100),
    tra_reg_date date,
    zra_reg_date date,
    bpra_reg_date date,
    zssf_reg_date date,
    contract_signed_file character varying(255),
    zra_phone character varying(30),
    zssf_contract_file character varying(255),
    tra_phone character varying(30),
    auditor_id integer,
    tra_start_date date,
    tra_end_date date,
    tra_attachment character varying(255),
    zra_start_date date,
    zra_end_date date,
    zra_attachment character varying(255),
    bpra_start_date date,
    bpra_end_date date,
    bpra_attachment character varying(255),
    zssf_start_date date,
    zssf_end_date date,
    zssf_attachment character varying(255),
    CONSTRAINT clients_location_check CHECK (((location)::text = ANY ((ARRAY['Mainland'::character varying, 'Zanzibar'::character varying])::text[]))),
    CONSTRAINT clients_business_type_check CHECK (business_type IS NULL OR (business_type)::text = ANY (ARRAY['company', 'foreign_company', 'sole_proprietor', 'partnership', 'other']))
);


ALTER TABLE public.clients OWNER TO postgres;

--
-- Name: clients_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.clients_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.clients_id_seq OWNER TO postgres;

--
-- Name: clients_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.clients_id_seq OWNED BY public.clients.id;


--
-- Name: closings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.closings (
    id integer NOT NULL,
    obligation_id integer NOT NULL,
    client_id integer NOT NULL,
    assigned_staff_id integer,
    period_label character varying(20) NOT NULL,
    due_date date NOT NULL,
    status character varying(20) DEFAULT 'open'::character varying NOT NULL,
    closed_at timestamp without time zone,
    closed_by integer,
    reference_number character varying(100),
    proof_file_path character varying(255),
    authorities jsonb DEFAULT '[]'::jsonb NOT NULL,
    completion_notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT closings_status_check CHECK (((status)::text = ANY ((ARRAY['open'::character varying, 'due_soon'::character varying, 'overdue'::character varying, 'closed'::character varying])::text[])))
);


ALTER TABLE public.closings OWNER TO postgres;

--
-- Name: closings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.closings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.closings_id_seq OWNER TO postgres;

--
-- Name: closings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.closings_id_seq OWNED BY public.closings.id;


--
-- Name: notification_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notification_logs (
    id integer NOT NULL,
    user_id integer,
    closing_id integer,
    channel character varying(20),
    message text,
    status character varying(20) DEFAULT 'sent'::character varying,
    sent_at timestamp without time zone DEFAULT now(),
    staff_id integer,
    privilege_id integer,
    recipient character varying(100),
    CONSTRAINT notification_logs_channel_check CHECK (((channel)::text = ANY ((ARRAY['whatsapp'::character varying, 'sms'::character varying, 'email'::character varying])::text[])))
);


ALTER TABLE public.notification_logs OWNER TO postgres;

--
-- Name: notification_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notification_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notification_logs_id_seq OWNER TO postgres;

--
-- Name: notification_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notification_logs_id_seq OWNED BY public.notification_logs.id;


--
-- Name: obligation_assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.obligation_assignments (
    id integer NOT NULL,
    obligation_id integer,
    staff_id integer,
    role character varying(20),
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT obligation_assignments_role_check CHECK (((role)::text = ANY ((ARRAY['manage'::character varying, 'edit'::character varying, 'view'::character varying, 'upload'::character varying])::text[])))
);


ALTER TABLE public.obligation_assignments OWNER TO postgres;

--
-- Name: obligation_assignments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.obligation_assignments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.obligation_assignments_id_seq OWNER TO postgres;

--
-- Name: obligation_assignments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.obligation_assignments_id_seq OWNED BY public.obligation_assignments.id;


--
-- Name: obligations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.obligations (
    id integer NOT NULL,
    client_id integer NOT NULL,
    title character varying(200) NOT NULL,
    frequency character varying(20) NOT NULL,
    due_day integer NOT NULL,
    default_staff_id integer,
    reminder_days jsonb DEFAULT '[10, 7, 3, 1, 0]'::jsonb NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    authority character varying(50),
    document_type character varying(100),
    filing_status character varying(50) DEFAULT 'Not started'::character varying,
    confirmed_due_date date,
    rule_type character varying(100),
    requires_upload boolean DEFAULT false,
    instructions text,
    CONSTRAINT obligations_authority_check CHECK (((authority)::text = ANY ((ARRAY['TRA'::character varying, 'ZRA'::character varying, 'BPRA'::character varying, 'ZSSF'::character varying, 'ALL'::character varying, 'TWO'::character varying])::text[]))),
    CONSTRAINT obligations_due_day_check CHECK (((due_day >= 1) AND (due_day <= 31))),
    CONSTRAINT obligations_filing_status_check CHECK (((filing_status)::text = ANY ((ARRAY['Not started'::character varying, 'Waiting for client'::character varying, 'In preparation'::character varying, 'Under review'::character varying, 'Filed'::character varying, 'Rejected'::character varying, 'Amended'::character varying])::text[]))),
    CONSTRAINT obligations_frequency_check CHECK (((frequency)::text = ANY ((ARRAY['monthly'::character varying, 'quarterly'::character varying, 'annual'::character varying, 'one_off'::character varying])::text[])))
);


ALTER TABLE public.obligations OWNER TO postgres;

--
-- Name: obligations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.obligations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.obligations_id_seq OWNER TO postgres;

--
-- Name: obligations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.obligations_id_seq OWNED BY public.obligations.id;


--
-- Name: payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payments (
    id integer NOT NULL,
    client_id integer,
    amount numeric(12,2) NOT NULL,
    payment_date date DEFAULT CURRENT_DATE NOT NULL,
    receipt_number character varying(100),
    created_by integer,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.payments OWNER TO postgres;

--
-- Name: payments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payments_id_seq OWNER TO postgres;

--
-- Name: payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payments_id_seq OWNED BY public.payments.id;


--
-- Name: reminder_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reminder_logs (
    id integer NOT NULL,
    closing_id integer,
    channel character varying(20) NOT NULL,
    recipient character varying(150) NOT NULL,
    message_template character varying(100),
    status character varying(20) NOT NULL,
    provider_response text,
    sent_at timestamp without time zone DEFAULT now() NOT NULL,
    is_read boolean DEFAULT false,
    CONSTRAINT reminder_logs_channel_check CHECK (((channel)::text = ANY ((ARRAY['whatsapp'::character varying, 'email'::character varying, 'sms'::character varying])::text[]))),
    CONSTRAINT reminder_logs_status_check CHECK (((status)::text = ANY ((ARRAY['sent'::character varying, 'delivered'::character varying, 'failed'::character varying])::text[])))
);


ALTER TABLE public.reminder_logs OWNER TO postgres;

--
-- Name: reminder_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.reminder_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reminder_logs_id_seq OWNER TO postgres;

--
-- Name: reminder_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.reminder_logs_id_seq OWNED BY public.reminder_logs.id;


--
-- Name: settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.settings (
    id integer NOT NULL,
    key character varying(100) NOT NULL,
    value jsonb NOT NULL,
    updated_by integer,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.settings OWNER TO postgres;

--
-- Name: settings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.settings_id_seq OWNER TO postgres;

--
-- Name: settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.settings_id_seq OWNED BY public.settings.id;


--
-- Name: staff_privileges; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.staff_privileges (
    id integer NOT NULL,
    staff_id integer,
    client_id integer,
    task_type character varying(50) NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_by integer,
    created_at timestamp without time zone DEFAULT now(),
    permissions jsonb DEFAULT '[]'::jsonb
);


ALTER TABLE public.staff_privileges OWNER TO postgres;

--
-- Name: staff_privileges_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.staff_privileges_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.staff_privileges_id_seq OWNER TO postgres;

--
-- Name: staff_privileges_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.staff_privileges_id_seq OWNED BY public.staff_privileges.id;


--
-- Name: task_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.task_permissions (
    id integer NOT NULL,
    client_id integer NOT NULL,
    staff_id integer NOT NULL,
    role_type character varying(50) NOT NULL,
    can_view_passwords jsonb DEFAULT '[]'::jsonb NOT NULL,
    can_upload boolean DEFAULT false,
    created_by integer,
    granted_at timestamp without time zone DEFAULT now(),
    revoked_at timestamp without time zone,
    CONSTRAINT task_permissions_role_type_check CHECK (((role_type)::text = ANY ((ARRAY['tra_only'::character varying, 'zra_only'::character varying, 'bpra_only'::character varying, 'zssf_only'::character varying, 'tra_annual'::character varying, 'zra_annual'::character varying, 'bpra_annual'::character varying, 'zssf_annual'::character varying, 'all_authorities'::character varying, 'upload_only'::character varying, 'view_only'::character varying])::text[])))
);


ALTER TABLE public.task_permissions OWNER TO postgres;

--
-- Name: task_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.task_permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.task_permissions_id_seq OWNER TO postgres;

--
-- Name: task_permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.task_permissions_id_seq OWNED BY public.task_permissions.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name character varying(120) NOT NULL,
    email character varying(150) NOT NULL,
    phone character varying(30),
    password_hash character varying(255) NOT NULL,
    role character varying(20) DEFAULT 'staff'::character varying NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    avatar_path character varying(255),
    last_login_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    reset_token character varying(100),
    reset_token_expiry timestamp without time zone,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'staff'::character varying, 'auditor'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: activity_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs ALTER COLUMN id SET DEFAULT nextval('public.activity_logs_id_seq'::regclass);


--
-- Name: assessments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessments ALTER COLUMN id SET DEFAULT nextval('public.assessments_id_seq'::regclass);


--
-- Name: clients id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clients ALTER COLUMN id SET DEFAULT nextval('public.clients_id_seq'::regclass);


--
-- Name: closings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.closings ALTER COLUMN id SET DEFAULT nextval('public.closings_id_seq'::regclass);


--
-- Name: notification_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_logs ALTER COLUMN id SET DEFAULT nextval('public.notification_logs_id_seq'::regclass);


--
-- Name: obligation_assignments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.obligation_assignments ALTER COLUMN id SET DEFAULT nextval('public.obligation_assignments_id_seq'::regclass);


--
-- Name: obligations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.obligations ALTER COLUMN id SET DEFAULT nextval('public.obligations_id_seq'::regclass);


--
-- Name: payments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments ALTER COLUMN id SET DEFAULT nextval('public.payments_id_seq'::regclass);


--
-- Name: reminder_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reminder_logs ALTER COLUMN id SET DEFAULT nextval('public.reminder_logs_id_seq'::regclass);


--
-- Name: settings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settings ALTER COLUMN id SET DEFAULT nextval('public.settings_id_seq'::regclass);


--
-- Name: staff_privileges id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_privileges ALTER COLUMN id SET DEFAULT nextval('public.staff_privileges_id_seq'::regclass);


--
-- Name: task_permissions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_permissions ALTER COLUMN id SET DEFAULT nextval('public.task_permissions_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: activity_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.activity_logs (id, user_id, closing_id, action, old_value, new_value, ip_address, created_at) FROM stdin;
1	1	\N	login	\N	\N	127.0.0.1	2026-10-18 14:50:52.847385
2	1	\N	login	\N	\N	127.0.0.1	2026-10-18 15:07:30.625073
3	1	\N	login	\N	\N	127.0.0.1	2026-10-18 15:18:04.029462
4	1	\N	login	\N	\N	127.0.0.1	2026-10-18 15:18:34.762298
5	1	\N	login	\N	\N	127.0.0.1	2026-10-18 15:20:18.46592
6	1	\N	login	\N	\N	127.0.0.1	2026-10-18 15:24:59.787643
7	1	\N	login	\N	\N	127.0.0.1	2026-10-18 15:34:11.486769
8	1	\N	login	\N	\N	127.0.0.1	2026-10-18 15:34:29.43521
9	1	\N	login	\N	\N	127.0.0.1	2026-10-18 15:36:04.720711
10	1	\N	login	\N	\N	127.0.0.1	2026-10-18 15:36:23.165081
11	1	\N	login	\N	\N	127.0.0.1	2026-10-18 15:36:42.771341
12	1	\N	user_created	\N	{"user_id": 2}	127.0.0.1	2026-10-18 15:40:09.114245
13	1	\N	user_updated	\N	{"user_id": "2"}	127.0.0.1	2026-10-18 15:41:10.845266
14	1	\N	user_created	\N	{"user_id": 3}	127.0.0.1	2026-10-18 15:41:49.128169
15	1	\N	user_updated	\N	{"user_id": "2"}	127.0.0.1	2026-10-18 15:45:02.810616
16	1	\N	user_deleted	\N	{"user_id": "3"}	127.0.0.1	2026-10-18 15:45:18.489059
17	1	\N	login	\N	\N	127.0.0.1	2026-10-18 15:46:52.910983
18	1	\N	user_updated	\N	{"user_id": "2"}	127.0.0.1	2026-10-18 16:16:25.076652
19	1	\N	user_updated	\N	{"user_id": "2"}	127.0.0.1	2026-10-18 16:16:30.493873
20	1	\N	user_updated	\N	{"user_id": "2"}	127.0.0.1	2026-10-18 16:16:34.836702
21	1	\N	user_created	\N	{"user_id": 4}	127.0.0.1	2026-10-18 16:17:32.278692
22	1	\N	client_created	\N	{"client_id": 1}	127.0.0.1	2026-10-18 16:19:21.331098
23	1	\N	obligation_created	\N	{"obligation_id": 1}	127.0.0.1	2026-10-18 16:22:18.180328
24	1	\N	login	\N	\N	127.0.0.1	2026-10-18 16:25:35.5753
25	1	\N	obligation_updated	\N	{"obligation_id": "1"}	127.0.0.1	2026-10-18 16:28:07.088235
26	1	\N	client_updated	\N	{"client_id": "1"}	127.0.0.1	2026-10-18 16:28:40.13711
27	1	\N	login	\N	\N	127.0.0.1	2026-10-18 16:31:39.108489
28	1	\N	login	\N	\N	127.0.0.1	2026-10-18 16:34:14.813599
29	2	\N	login	\N	\N	127.0.0.1	2026-10-18 16:35:23.529002
30	1	\N	login	\N	\N	127.0.0.1	2026-10-18 16:40:15.957244
31	1	\N	client_deleted	\N	{"client_id": "1"}	127.0.0.1	2026-10-18 16:41:55.01269
32	1	\N	login	\N	\N	127.0.0.1	2026-10-18 16:43:51.748089
33	1	\N	user_updated	\N	{"user_id": "4"}	127.0.0.1	2026-10-18 16:44:19.283463
34	1	\N	user_updated	\N	{"user_id": "4"}	127.0.0.1	2026-10-18 16:44:22.409819
35	1	\N	user_created	\N	{"user_id": 5}	127.0.0.1	2026-10-18 16:45:00.945247
36	1	\N	user_updated	\N	{"user_id": "4"}	127.0.0.1	2026-10-18 17:34:38.606172
37	1	\N	user_updated	\N	{"user_id": "4"}	127.0.0.1	2026-10-18 17:41:18.295659
38	1	\N	user_updated	\N	{"user_id": "2"}	127.0.0.1	2026-10-18 17:41:41.837548
39	1	\N	login	\N	\N	127.0.0.1	2026-10-18 17:42:29.323313
40	1	\N	user_updated	\N	{"user_id": "2"}	127.0.0.1	2026-10-18 17:42:40.325078
41	2	\N	login	\N	\N	127.0.0.1	2026-10-18 17:42:55.831626
42	1	\N	login	\N	\N	127.0.0.1	2026-10-18 18:47:16.674516
43	1	\N	login	\N	\N	127.0.0.1	2026-10-18 20:07:34.578172
44	1	\N	login	\N	\N	127.0.0.1	2026-10-18 20:07:48.855329
45	1	\N	login	\N	\N	127.0.0.1	2026-10-18 20:18:46.636209
46	1	\N	login	\N	\N	127.0.0.1	2026-10-18 20:34:37.498062
47	1	\N	login	\N	\N	127.0.0.1	2026-10-18 20:40:27.429523
48	1	\N	login	\N	\N	127.0.0.1	2026-10-18 20:47:32.170413
49	2	\N	login	\N	\N	127.0.0.1	2026-10-18 20:50:25.540942
50	1	\N	login	\N	\N	127.0.0.1	2026-10-18 23:01:45.388349
51	1	\N	login	\N	\N	127.0.0.1	2026-10-18 23:02:07.717905
52	1	\N	user_deleted	\N	{"user_id": "5"}	127.0.0.1	2026-10-18 23:02:38.604466
53	1	\N	login	\N	\N	127.0.0.1	2026-10-18 23:32:51.542561
54	1	\N	login	\N	\N	127.0.0.1	2026-10-19 00:07:38.27114
55	1	\N	user_updated	\N	{"user_id": "4"}	127.0.0.1	2026-10-19 00:19:57.139909
56	1	\N	user_updated	\N	{"user_id": "4"}	127.0.0.1	2026-10-19 00:20:01.33378
57	1	\N	client_created	\N	{"client_id": 2}	127.0.0.1	2026-10-19 00:21:11.757916
58	1	\N	client_updated	\N	{"client_id": "2"}	127.0.0.1	2026-10-19 00:21:24.961692
59	1	\N	obligation_created	\N	{"obligation_id": 2}	127.0.0.1	2026-10-19 00:21:55.345242
60	1	\N	obligation_updated	\N	{"obligation_id": "2"}	127.0.0.1	2026-10-19 00:26:21.284338
61	1	\N	obligation_updated	\N	{"obligation_id": "2"}	127.0.0.1	2026-10-19 00:27:32.71263
62	1	\N	obligation_created	\N	{"obligation_id": 4}	127.0.0.1	2026-10-19 00:32:28.114397
63	1	\N	obligation_updated	\N	{"obligation_id": "2"}	127.0.0.1	2026-10-19 00:34:18.335802
64	1	\N	obligation_updated	\N	{"obligation_id": "2"}	127.0.0.1	2026-10-19 00:40:33.824042
65	1	\N	obligation_updated	\N	{"obligation_id": "2"}	127.0.0.1	2026-10-19 00:44:28.118829
66	1	\N	obligation_created	\N	{"obligation_id": 5}	127.0.0.1	2026-10-19 00:45:29.202666
67	1	\N	obligation_updated	\N	{"obligation_id": "4"}	127.0.0.1	2026-10-19 00:49:58.361149
68	1	\N	obligation_updated	\N	{"obligation_id": "2"}	127.0.0.1	2026-10-19 00:52:48.855996
69	1	\N	obligation_deleted	\N	{"obligation_id": "5"}	127.0.0.1	2026-10-19 00:53:46.163065
70	1	\N	obligation_updated	\N	{"obligation_id": "2"}	127.0.0.1	2026-10-19 00:54:04.536222
71	1	\N	obligation_updated	\N	{"obligation_id": "2"}	127.0.0.1	2026-10-19 00:55:58.601666
72	1	\N	obligation_updated	\N	{"obligation_id": "2"}	127.0.0.1	2026-10-19 01:01:09.979375
73	1	\N	obligation_updated	\N	{"obligation_id": "2"}	127.0.0.1	2026-10-19 01:03:37.780781
74	1	\N	obligation_updated	\N	{"obligation_id": "2"}	127.0.0.1	2026-10-19 01:03:57.636763
75	1	\N	obligation_created	\N	{"obligation_id": 6}	127.0.0.1	2026-10-19 01:04:28.688961
76	1	\N	obligation_updated	\N	{"obligation_id": "4"}	127.0.0.1	2026-10-19 01:04:51.043344
77	1	\N	login	\N	\N	127.0.0.1	2026-10-19 10:14:41.694656
78	1	\N	obligation_updated	\N	{"obligation_id": "2"}	127.0.0.1	2026-10-19 10:17:13.120794
79	1	\N	login	\N	\N	127.0.0.1	2026-10-19 10:24:48.510277
82	1	\N	login	\N	\N	127.0.0.1	2026-10-19 10:32:46.231933
89	1	\N	obligation_deleted	\N	{"obligation_id": "6"}	127.0.0.1	2026-10-19 10:51:16.372411
90	1	\N	client_created	\N	{"client_id": 3}	127.0.0.1	2026-10-19 10:56:03.869913
91	1	\N	client_updated	\N	{"client_id": "3"}	127.0.0.1	2026-10-19 10:57:52.095778
92	1	\N	login	\N	\N	127.0.0.1	2026-10-19 11:08:27.728198
93	2	\N	login	\N	\N	127.0.0.1	2026-10-19 11:12:07.292871
94	1	\N	login	\N	\N	127.0.0.1	2026-10-19 11:12:46.579716
95	1	\N	obligation_updated	\N	{"obligation_id": "4"}	127.0.0.1	2026-10-19 11:13:06.042911
96	2	\N	login	\N	\N	127.0.0.1	2026-10-19 11:13:25.147312
97	1	\N	login	\N	\N	127.0.0.1	2026-10-19 11:14:42.657069
98	1	\N	obligation_updated	\N	{"obligation_id": "2"}	127.0.0.1	2026-10-19 11:15:10.160127
99	1	\N	obligation_updated	\N	{"obligation_id": "4"}	127.0.0.1	2026-10-19 11:15:24.630344
100	2	\N	login	\N	\N	127.0.0.1	2026-10-19 11:15:41.096347
101	1	\N	login	\N	\N	127.0.0.1	2026-10-19 11:18:41.749028
102	1	\N	obligation_created	\N	{"obligation_id": 7}	127.0.0.1	2026-10-19 11:19:11.65685
103	1	\N	login	\N	\N	127.0.0.1	2026-10-19 11:22:13.509046
104	2	\N	login	\N	\N	127.0.0.1	2026-10-19 11:22:58.240657
105	2	\N	login	\N	\N	127.0.0.1	2026-10-19 11:26:03.674886
107	1	\N	login	\N	\N	127.0.0.1	2026-10-19 11:32:08.931781
108	1	\N	obligation_updated	\N	{"obligation_id": "2"}	127.0.0.1	2026-10-19 11:32:44.170172
109	1	\N	obligation_created	\N	{"obligation_id": 8}	127.0.0.1	2026-10-19 11:33:22.115729
110	1	\N	login	\N	\N	127.0.0.1	2026-10-19 11:48:41.290542
111	1	\N	login	\N	\N	127.0.0.1	2026-10-19 11:50:08.852549
112	2	\N	login	\N	\N	127.0.0.1	2026-10-19 11:53:41.009215
113	1	\N	login	\N	\N	127.0.0.1	2026-10-19 11:55:07.48349
114	2	\N	login	\N	\N	127.0.0.1	2026-10-19 12:05:37.828276
115	2	\N	login	\N	\N	127.0.0.1	2026-10-19 12:11:21.706835
116	1	\N	login	\N	\N	127.0.0.1	2026-10-19 12:11:51.166498
117	2	\N	login	\N	\N	127.0.0.1	2026-10-19 12:13:11.599915
118	1	\N	login	\N	\N	127.0.0.1	2026-10-19 12:18:02.187577
119	2	\N	login	\N	\N	127.0.0.1	2026-10-19 12:19:56.777117
120	2	\N	login	\N	\N	127.0.0.1	2026-10-19 12:24:12.106689
121	2	\N	login	\N	\N	127.0.0.1	2026-10-19 12:57:01.787369
122	1	\N	login	\N	\N	127.0.0.1	2026-10-19 13:02:58.748244
123	1	\N	login	\N	\N	127.0.0.1	2026-10-19 23:50:25.568018
124	1	\N	user_updated	\N	{"user_id": "4"}	127.0.0.1	2026-10-19 23:54:01.697034
125	1	\N	login	\N	\N	127.0.0.1	2026-10-19 23:54:32.561575
126	1	\N	user_updated	\N	{"user_id": "4"}	127.0.0.1	2026-10-19 23:55:18.268174
127	4	\N	login	\N	\N	127.0.0.1	2026-10-19 23:55:47.269813
128	1	\N	login	\N	\N	127.0.0.1	2026-10-19 23:57:24.05949
131	1	\N	obligation_deleted	\N	{"obligation_id": "4"}	127.0.0.1	2026-10-19 23:57:58.3909
132	1	\N	obligation_deleted	\N	{"obligation_id": "8"}	127.0.0.1	2026-10-19 23:58:02.666796
133	1	\N	obligation_deleted	\N	{"obligation_id": "7"}	127.0.0.1	2026-10-19 23:58:06.940591
134	1	\N	obligation_deleted	\N	{"obligation_id": "2"}	127.0.0.1	2026-10-19 23:58:10.840066
135	1	\N	obligation_created	\N	{"obligation_id": 9}	127.0.0.1	2026-10-19 23:59:51.599699
136	1	\N	obligation_updated	\N	{"obligation_id": "9"}	127.0.0.1	2026-10-20 00:01:59.220319
137	2	\N	login	\N	\N	127.0.0.1	2026-10-20 00:03:07.848533
138	1	\N	login	\N	\N	127.0.0.1	2026-10-20 00:04:49.760076
139	1	\N	obligation_deleted	\N	{"obligation_id": "9"}	127.0.0.1	2026-10-20 00:05:17.599231
140	1	\N	obligation_created	\N	{"obligation_id": 10}	127.0.0.1	2026-10-20 00:05:45.247465
141	1	\N	client_created	\N	{"client_id": 4}	127.0.0.1	2026-10-20 00:08:22.597977
142	1	\N	obligation_deleted	\N	{"obligation_id": "10"}	127.0.0.1	2026-10-20 00:09:26.041438
143	1	\N	obligation_created	\N	{"obligation_id": 12}	127.0.0.1	2026-10-20 00:09:53.258205
144	1	\N	login	\N	\N	127.0.0.1	2026-10-20 00:17:27.619636
145	1	\N	obligation_updated	\N	{"obligation_id": "12"}	127.0.0.1	2026-10-20 00:18:50.351561
146	1	\N	obligation_updated	\N	{"obligation_id": "12"}	127.0.0.1	2026-10-20 00:19:11.157724
147	4	\N	login	\N	\N	127.0.0.1	2026-10-20 00:26:29.655384
149	1	\N	login	\N	\N	127.0.0.1	2026-10-20 00:27:14.099563
150	1	\N	obligation_created	\N	{"obligation_id": 13}	127.0.0.1	2026-10-20 00:27:59.215258
151	1	\N	login	\N	\N	127.0.0.1	2026-10-20 00:35:52.519149
152	1	\N	obligation_deleted	\N	{"obligation_id": "13"}	127.0.0.1	2026-10-20 00:41:24.839683
153	1	\N	obligation_created	\N	{"obligation_id": 14}	127.0.0.1	2026-10-20 00:41:40.839853
154	1	\N	obligation_deleted	\N	{"obligation_id": "14"}	127.0.0.1	2026-10-20 00:50:23.72364
155	1	\N	obligation_created	\N	{"obligation_id": 15}	127.0.0.1	2026-10-20 00:50:53.717787
156	1	\N	login	\N	\N	127.0.0.1	2026-10-20 01:01:19.72732
157	2	\N	login	\N	\N	127.0.0.1	2026-10-20 01:06:28.384127
158	1	\N	login	\N	\N	127.0.0.1	2026-10-20 01:10:08.345919
159	1	\N	obligation_created	\N	{"obligation_id": 16}	127.0.0.1	2026-10-20 01:10:32.266285
160	2	\N	login	\N	\N	127.0.0.1	2026-10-20 01:11:44.274625
161	1	\N	login	\N	\N	127.0.0.1	2026-10-20 01:14:05.565301
162	1	\N	login	\N	\N	127.0.0.1	2026-10-20 01:22:48.16863
163	1	\N	obligation_deleted	\N	{"obligation_id": "12"}	127.0.0.1	2026-10-20 01:23:10.703826
164	1	\N	obligation_deleted	\N	{"obligation_id": "15"}	127.0.0.1	2026-10-20 01:23:13.65059
165	1	\N	obligation_deleted	\N	{"obligation_id": "16"}	127.0.0.1	2026-10-20 01:23:18.395625
166	1	\N	obligation_created	\N	{"obligation_id": 17}	127.0.0.1	2026-10-20 01:23:37.236641
167	1	\N	login	\N	\N	127.0.0.1	2026-10-20 01:32:19.8784
168	1	\N	user_created	\N	{"user_id": 6}	127.0.0.1	2026-10-20 01:33:57.182363
169	1	\N	client_updated	\N	{"client_id": "4"}	127.0.0.1	2026-10-20 01:34:49.470007
170	1	\N	obligation_created	\N	{"obligation_id": 18}	127.0.0.1	2026-10-20 01:35:31.89493
171	1	\N	client_created	\N	{"client_id": 5}	127.0.0.1	2026-10-20 01:40:31.603187
172	1	\N	obligation_created	\N	{"obligation_id": 19}	127.0.0.1	2026-10-20 01:40:59.458866
173	1	\N	obligation_updated	\N	{"obligation_id": "19"}	127.0.0.1	2026-10-20 01:42:18.475078
174	1	\N	client_updated	\N	{"client_id": "4"}	127.0.0.1	2026-10-20 01:44:47.145587
175	1	\N	obligation_created	\N	{"obligation_id": 20}	127.0.0.1	2026-10-20 01:45:50.979041
176	1	\N	obligation_created	\N	{"obligation_id": 21}	127.0.0.1	2026-10-20 01:48:53.425083
230	1	\N	client_deleted	\N	{"client_id": "7"}	127.0.0.1	2026-10-28 19:32:16.979468
231	1	\N	client_created	\N	{"client_id": 8}	127.0.0.1	2026-10-28 19:34:54.8779
233	1	\N	login	\N	\N	127.0.0.1	2026-10-28 20:16:45.699425
234	1	\N	login	\N	\N	127.0.0.1	2026-10-29 10:08:38.619828
235	1	\N	login	\N	\N	127.0.0.1	2026-10-29 10:17:46.007411
236	1	\N	client_created	\N	{"client_id": 9}	127.0.0.1	2026-10-29 10:21:13.398964
237	1	\N	client_created	\N	{"client_id": 10}	127.0.0.1	2026-10-29 10:21:49.635508
238	1	\N	client_created	\N	{"client_id": 11}	127.0.0.1	2026-10-29 10:21:56.048876
239	1	\N	client_created	\N	{"client_id": 12}	127.0.0.1	2026-10-29 10:21:59.781143
240	1	\N	client_created	\N	{"client_id": 13}	127.0.0.1	2026-10-29 10:23:15.938488
241	1	\N	client_created	\N	{"client_id": 14}	127.0.0.1	2026-10-29 10:25:54.980413
242	1	\N	client_deleted	\N	{"client_id": "9"}	127.0.0.1	2026-10-29 10:26:50.40248
243	1	\N	client_deleted	\N	{"client_id": "13"}	127.0.0.1	2026-10-29 10:26:54.446582
244	1	\N	client_deleted	\N	{"client_id": "12"}	127.0.0.1	2026-10-29 10:26:58.338064
245	1	\N	client_deleted	\N	{"client_id": "11"}	127.0.0.1	2026-10-29 10:27:02.515026
246	1	\N	client_deleted	\N	{"client_id": "10"}	127.0.0.1	2026-10-29 10:27:07.133723
247	1	\N	client_deleted	\N	{"client_id": "14"}	127.0.0.1	2026-10-29 10:27:11.212248
248	1	\N	client_created	\N	{"client_id": 15}	127.0.0.1	2026-10-29 10:27:33.181483
249	1	\N	client_created	\N	{"client_id": 16}	127.0.0.1	2026-10-29 10:28:31.627398
250	1	\N	client_created	\N	{"client_id": 17}	127.0.0.1	2026-10-29 10:29:40.656766
251	1	\N	client_permissions_updated	\N	{"client_id": 17}	127.0.0.1	2026-10-29 10:29:40.754872
252	1	\N	client_deleted	\N	{"client_id": "17"}	127.0.0.1	2026-10-29 10:29:50.088897
253	1	\N	client_deleted	\N	{"client_id": "16"}	127.0.0.1	2026-10-29 10:30:00.528136
254	1	\N	client_deleted	\N	{"client_id": "15"}	127.0.0.1	2026-10-29 10:30:05.325507
179	2	\N	login	\N	\N	127.0.0.1	2026-10-20 02:00:40.937132
181	1	\N	login	\N	\N	127.0.0.1	2026-10-20 02:04:54.484664
182	1	\N	login	\N	\N	127.0.0.1	2026-10-20 02:20:48.18147
183	1	\N	obligation_created	\N	{"obligation_id": 22}	127.0.0.1	2026-10-20 02:30:42.530505
185	2	\N	login	\N	\N	127.0.0.1	2026-10-20 02:38:26.883859
186	1	\N	login	\N	\N	127.0.0.1	2026-10-20 10:52:26.606786
187	1	\N	obligation_created	\N	{"obligation_id": 23}	127.0.0.1	2026-10-20 11:03:57.726005
188	1	\N	login	\N	\N	127.0.0.1	2026-10-21 23:06:24.942896
189	1	\N	login	\N	\N	127.0.0.1	2026-10-21 23:07:16.446589
190	1	\N	login	\N	\N	127.0.0.1	2026-10-21 23:16:10.343647
191	1	\N	login	\N	\N	127.0.0.1	2026-10-21 23:17:34.008514
192	1	\N	client_created	\N	{"client_id": 6}	127.0.0.1	2026-10-21 23:23:02.996532
193	1	\N	obligation_created	\N	{"obligation_id": 24}	127.0.0.1	2026-10-21 23:26:01.913637
194	2	\N	login	\N	\N	127.0.0.1	2026-10-21 23:28:28.635481
196	1	\N	login	\N	\N	127.0.0.1	2026-10-21 23:29:16.433165
198	1	\N	obligation_created	\N	{"obligation_id": 25}	127.0.0.1	2026-10-21 23:51:40.778062
199	1	\N	login	\N	\N	127.0.0.1	2026-10-23 18:44:07.721952
200	1	\N	login	\N	\N	127.0.0.1	2026-10-24 11:44:06.372007
201	1	\N	obligation_created	\N	{"obligation_id": 26}	127.0.0.1	2026-10-24 11:50:42.774087
202	1	\N	login	\N	\N	127.0.0.1	2026-10-24 12:13:48.537084
203	1	\N	login	\N	\N	127.0.0.1	2026-10-24 12:31:03.778923
204	1	\N	login	\N	\N	127.0.0.1	2026-10-27 11:08:27.698442
205	1	\N	login	\N	\N	127.0.0.1	2026-10-27 11:22:02.884552
206	1	\N	login	\N	\N	127.0.0.1	2026-10-27 11:31:03.898098
207	1	\N	login	\N	\N	127.0.0.1	2026-10-27 11:45:51.521157
208	1	\N	user_created	\N	{"user_id": 7}	127.0.0.1	2026-10-27 11:49:27.408781
209	7	\N	login	\N	\N	127.0.0.1	2026-10-27 11:49:52.886617
210	1	\N	login	\N	\N	127.0.0.1	2026-10-27 11:50:15.460784
211	1	\N	client_deleted	\N	{"client_id": "4"}	127.0.0.1	2026-10-27 12:03:49.766603
212	1	\N	login	\N	\N	127.0.0.1	2026-10-27 13:07:51.441913
213	1	\N	login	\N	\N	127.0.0.1	2026-10-27 13:20:34.24023
214	1	\N	obligation_deleted	\N	{"obligation_id": "25"}	127.0.0.1	2026-10-27 13:34:54.803607
215	1	\N	obligation_deleted	\N	{"obligation_id": "19"}	127.0.0.1	2026-10-27 13:34:59.483565
216	1	\N	login	\N	\N	127.0.0.1	2026-10-27 16:48:44.201149
217	1	\N	client_deleted	\N	{"client_id": "2"}	127.0.0.1	2026-10-27 17:00:19.062405
218	1	\N	client_deleted	\N	{"client_id": "5"}	127.0.0.1	2026-10-27 17:00:22.892529
219	1	\N	client_deleted	\N	{"client_id": "6"}	127.0.0.1	2026-10-27 17:00:27.741594
220	1	\N	client_deleted	\N	{"client_id": "3"}	127.0.0.1	2026-10-27 17:00:32.064092
221	1	\N	login	\N	\N	127.0.0.1	2026-10-27 17:19:13.597919
222	1	\N	client_created	\N	{"client_id": 7}	127.0.0.1	2026-10-27 17:31:34.965485
223	1	\N	client_updated	\N	{"client_id": "7"}	127.0.0.1	2026-10-27 17:31:54.014996
224	1	\N	client_updated	\N	{"client_id": "7"}	127.0.0.1	2026-10-27 17:32:57.19374
225	1	\N	client_updated	\N	{"client_id": "7"}	127.0.0.1	2026-10-27 17:33:24.534501
226	1	\N	login	\N	\N	127.0.0.1	2026-10-27 17:42:06.651592
227	1	\N	client_updated	\N	{"client_id": "7"}	127.0.0.1	2026-10-27 17:47:23.411609
228	1	\N	login	\N	\N	127.0.0.1	2026-10-28 11:23:13.191088
229	1	\N	login	\N	\N	127.0.0.1	2026-10-28 19:22:01.494937
232	1	\N	login	\N	\N	127.0.0.1	2026-10-28 19:55:04.666888
255	1	\N	client_created	\N	{"client_id": 18}	127.0.0.1	2026-10-29 10:30:36.717468
256	1	\N	client_permissions_updated	\N	{"client_id": 18}	127.0.0.1	2026-10-29 10:30:36.820506
257	1	\N	client_updated	\N	{"client_id": "18"}	127.0.0.1	2026-10-29 10:31:31.251991
258	1	\N	client_permissions_updated	\N	{"client_id": 18}	127.0.0.1	2026-10-29 10:31:31.405986
259	1	\N	client_updated	\N	{"client_id": "18"}	127.0.0.1	2026-10-29 10:32:25.105709
260	1	\N	client_permissions_updated	\N	{"client_id": 18}	127.0.0.1	2026-10-29 10:32:25.319852
261	1	\N	client_updated	\N	{"client_id": "18"}	127.0.0.1	2026-10-29 10:33:06.56549
262	1	\N	client_permissions_updated	\N	{"client_id": 18}	127.0.0.1	2026-10-29 10:33:06.687685
263	1	\N	client_updated	\N	{"client_id": "18"}	127.0.0.1	2026-10-29 10:35:23.488921
264	1	\N	client_permissions_updated	\N	{"client_id": 18}	127.0.0.1	2026-10-29 10:35:23.633539
265	1	\N	client_updated	\N	{"client_id": "18"}	127.0.0.1	2026-10-29 10:40:12.478164
266	1	\N	client_permissions_updated	\N	{"client_id": 18}	127.0.0.1	2026-10-29 10:40:12.595435
267	1	\N	client_updated	\N	{"client_id": "18"}	127.0.0.1	2026-10-29 10:41:22.862008
268	1	\N	client_permissions_updated	\N	{"client_id": 18}	127.0.0.1	2026-10-29 10:41:22.973984
269	1	\N	client_updated	\N	{"client_id": "18"}	127.0.0.1	2026-10-29 10:42:39.642575
270	1	\N	client_permissions_updated	\N	{"client_id": 18}	127.0.0.1	2026-10-29 10:42:39.735311
271	1	\N	client_created	\N	{"client_id": 19}	127.0.0.1	2026-10-29 10:45:14.6465
272	1	\N	client_permissions_updated	\N	{"client_id": 19}	127.0.0.1	2026-10-29 10:45:14.746171
273	1	\N	client_deleted	\N	{"client_id": "19"}	127.0.0.1	2026-10-29 10:47:53.757379
274	1	\N	client_updated	\N	{"client_id": "18"}	127.0.0.1	2026-10-29 10:48:31.580321
275	1	\N	client_permissions_updated	\N	{"client_id": 18}	127.0.0.1	2026-10-29 10:48:31.687401
276	1	\N	client_updated	\N	{"client_id": "18"}	127.0.0.1	2026-10-29 10:55:37.113764
277	1	\N	client_permissions_updated	\N	{"client_id": 18}	127.0.0.1	2026-10-29 10:55:37.321884
278	1	\N	client_updated	\N	{"client_id": "18"}	127.0.0.1	2026-10-29 11:10:38.891907
279	1	\N	client_permissions_updated	\N	{"client_id": 18}	127.0.0.1	2026-10-29 11:10:38.991598
280	1	\N	client_updated	\N	{"client_id": "18"}	127.0.0.1	2026-10-29 11:12:50.739358
281	1	\N	client_permissions_updated	\N	{"client_id": 18}	127.0.0.1	2026-10-29 11:12:50.866586
282	1	\N	client_created	\N	{"client_id": 20}	127.0.0.1	2026-10-29 11:35:11.278697
283	1	\N	client_created	\N	{"client_id": 21}	127.0.0.1	2026-10-29 11:37:12.379418
284	1	\N	client_deleted	\N	{"client_id": "21"}	127.0.0.1	2026-10-29 11:41:52.044406
285	1	\N	client_deleted	\N	{"client_id": "20"}	127.0.0.1	2026-10-29 11:41:56.126399
286	1	\N	client_created	\N	{"client_id": 22}	127.0.0.1	2026-10-29 11:43:12.574152
287	1	\N	login	\N	\N	127.0.0.1	2026-10-29 18:40:12.178868
288	1	\N	client_deleted	\N	{"client_id": "22"}	127.0.0.1	2026-10-29 18:40:30.293868
289	1	\N	client_created	\N	{"client_id": 23}	127.0.0.1	2026-10-29 18:41:52.650265
290	1	\N	client_deleted	\N	{"client_id": "23"}	127.0.0.1	2026-10-29 18:45:00.246907
291	1	\N	client_created	\N	{"client_id": 24}	127.0.0.1	2026-10-29 18:45:33.321721
292	1	\N	client_permissions_updated	\N	{"client_id": 24}	127.0.0.1	2026-10-29 18:45:33.429087
293	1	\N	client_updated	\N	{"client_id": "24"}	127.0.0.1	2026-10-29 18:46:40.592507
294	1	\N	client_permissions_updated	\N	{"client_id": 24}	127.0.0.1	2026-10-29 18:46:40.706203
295	1	\N	client_updated	\N	{"client_id": "24"}	127.0.0.1	2026-10-29 18:47:02.332395
296	1	\N	client_permissions_updated	\N	{"client_id": 24}	127.0.0.1	2026-10-29 18:47:02.458611
297	1	\N	client_updated	\N	{"client_id": "24"}	127.0.0.1	2026-10-29 18:47:34.691636
298	1	\N	client_permissions_updated	\N	{"client_id": 24}	127.0.0.1	2026-10-29 18:47:34.841991
299	1	\N	client_updated	\N	{"client_id": "18"}	127.0.0.1	2026-10-29 18:48:25.45737
300	1	\N	client_permissions_updated	\N	{"client_id": 18}	127.0.0.1	2026-10-29 18:48:25.668934
301	1	\N	client_updated	\N	{"client_id": "24"}	127.0.0.1	2026-10-29 18:54:28.980246
302	1	\N	client_permissions_updated	\N	{"client_id": 24}	127.0.0.1	2026-10-29 18:54:29.11221
303	1	\N	client_updated	\N	{"client_id": "18"}	127.0.0.1	2026-10-29 18:58:41.503465
304	1	\N	client_permissions_updated	\N	{"client_id": 18}	127.0.0.1	2026-10-29 18:58:41.607041
305	1	\N	client_updated	\N	{"client_id": "24"}	127.0.0.1	2026-10-29 18:59:18.509475
306	1	\N	client_permissions_updated	\N	{"client_id": 24}	127.0.0.1	2026-10-29 18:59:18.598839
307	1	\N	client_updated	\N	{"client_id": "24"}	127.0.0.1	2026-10-29 19:02:24.5137
308	1	\N	client_permissions_updated	\N	{"client_id": 24}	127.0.0.1	2026-10-29 19:02:24.637693
309	1	\N	client_deleted	\N	{"client_id": "24"}	127.0.0.1	2026-10-29 19:03:04.637033
310	1	\N	client_created	\N	{"client_id": 25}	127.0.0.1	2026-10-29 19:04:17.495123
311	1	\N	client_permissions_updated	\N	{"client_id": 25}	127.0.0.1	2026-10-29 19:04:17.600897
312	1	\N	client_updated	\N	{"client_id": "25"}	127.0.0.1	2026-10-29 19:04:54.616188
313	1	\N	client_permissions_updated	\N	{"client_id": 25}	127.0.0.1	2026-10-29 19:04:54.711028
314	1	\N	client_updated	\N	{"client_id": "25"}	127.0.0.1	2026-10-29 19:05:35.509007
315	1	\N	client_permissions_updated	\N	{"client_id": 25}	127.0.0.1	2026-10-29 19:05:35.616845
316	1	\N	client_deleted	\N	{"client_id": "25"}	127.0.0.1	2026-10-29 19:08:33.600178
317	1	\N	client_created	\N	{"client_id": 26}	127.0.0.1	2026-10-29 19:09:44.551448
318	1	\N	client_permissions_updated	\N	{"client_id": 26}	127.0.0.1	2026-10-29 19:09:44.651568
319	1	\N	client_updated	\N	{"client_id": "26"}	127.0.0.1	2026-10-29 19:12:42.014127
320	1	\N	client_permissions_updated	\N	{"client_id": 26}	127.0.0.1	2026-10-29 19:12:42.116211
321	1	\N	client_updated	\N	{"client_id": "18"}	127.0.0.1	2026-10-29 19:13:53.612481
322	1	\N	client_permissions_updated	\N	{"client_id": 18}	127.0.0.1	2026-10-29 19:13:53.761309
323	1	\N	login	\N	\N	127.0.0.1	2026-10-29 19:34:08.691683
324	1	\N	login	\N	\N	127.0.0.1	2026-10-29 19:38:33.136207
325	1	\N	login	\N	\N	127.0.0.1	2026-10-29 19:38:58.519723
326	1	\N	client_created	\N	{"client_id": 27}	127.0.0.1	2026-10-29 19:48:38.225429
327	1	\N	client_permissions_updated	\N	{"client_id": 27}	127.0.0.1	2026-10-29 19:48:38.356182
328	1	\N	login	\N	\N	127.0.0.1	2026-10-29 23:04:34.942959
329	1	\N	obligation_deleted	\N	{"obligation_id": "27"}	127.0.0.1	2026-10-29 23:10:07.907622
330	1	\N	login	\N	\N	127.0.0.1	2026-10-29 23:24:10.106431
331	1	\N	login	\N	\N	127.0.0.1	2026-10-30 16:46:55.443001
332	1	\N	login	\N	\N	127.0.0.1	2026-10-30 17:00:29.932829
333	1	\N	login	\N	\N	127.0.0.1	2026-10-30 17:09:17.104576
334	1	\N	login	\N	\N	127.0.0.1	2026-10-30 17:19:00.219513
335	2	\N	login	\N	\N	127.0.0.1	2026-10-30 17:20:48.230322
336	1	\N	login	\N	\N	127.0.0.1	2026-10-30 17:27:44.385626
337	2	\N	login	\N	\N	127.0.0.1	2026-10-30 17:30:14.88822
338	1	\N	login	\N	\N	127.0.0.1	2026-10-30 17:32:24.646959
339	1	\N	client_updated	\N	{"client_id": "8"}	127.0.0.1	2026-10-30 17:32:55.305768
340	1	\N	client_permissions_updated	\N	{"client_id": 8}	127.0.0.1	2026-10-30 17:32:55.563534
341	2	\N	login	\N	\N	127.0.0.1	2026-10-30 17:33:51.946758
342	1	\N	login	\N	\N	127.0.0.1	2026-10-30 17:45:53.582336
343	2	\N	login	\N	\N	127.0.0.1	2026-10-30 17:46:34.861923
344	1	\N	login	\N	\N	127.0.0.1	2026-10-30 17:47:01.693555
345	2	\N	login	\N	\N	127.0.0.1	2026-10-30 17:47:48.489003
346	1	\N	login	\N	\N	127.0.0.1	2026-10-30 17:48:56.608422
347	2	\N	login	\N	\N	127.0.0.1	2026-10-30 17:49:48.284516
348	1	\N	login	\N	\N	127.0.0.1	2026-10-30 18:05:05.430994
349	2	\N	login	\N	\N	127.0.0.1	2026-10-30 18:05:45.914501
350	1	\N	login	\N	\N	127.0.0.1	2026-10-30 18:07:40.205323
351	2	\N	login	\N	\N	127.0.0.1	2026-10-30 18:10:15.285852
352	1	\N	login	\N	\N	127.0.0.1	2026-10-30 18:10:45.503066
353	2	\N	login	\N	\N	127.0.0.1	2026-10-30 18:13:03.882661
354	1	\N	login	\N	\N	127.0.0.1	2026-10-30 18:13:32.134067
355	2	\N	login	\N	\N	127.0.0.1	2026-10-30 18:14:28.338976
356	2	\N	login	\N	\N	127.0.0.1	2026-10-30 19:33:57.003844
357	1	\N	login	\N	\N	127.0.0.1	2026-10-30 19:35:15.084786
358	2	\N	login	\N	\N	127.0.0.1	2026-10-30 19:38:09.803136
359	1	\N	login	\N	\N	127.0.0.1	2026-10-30 19:41:08.171464
360	2	\N	login	\N	\N	127.0.0.1	2026-10-30 20:11:03.062706
361	1	\N	login	\N	\N	127.0.0.1	2026-10-30 20:14:14.78432
362	2	\N	login	\N	\N	127.0.0.1	2026-10-30 20:15:26.516356
363	1	\N	login	\N	\N	127.0.0.1	2026-10-30 20:23:12.882939
364	1	\N	client_updated	\N	{"client_id": 8}	127.0.0.1	2026-10-30 20:23:54.294608
365	1	\N	client_permissions_updated	\N	{"client_id": 8}	127.0.0.1	2026-10-30 20:23:54.395335
366	1	\N	client_updated	\N	{"client_id": 26}	127.0.0.1	2026-10-30 20:24:36.389046
367	1	\N	client_permissions_updated	\N	{"client_id": 26}	127.0.0.1	2026-10-30 20:24:36.49119
368	1	\N	client_updated	\N	{"client_id": 26}	127.0.0.1	2026-10-30 20:25:08.374095
369	1	\N	client_permissions_updated	\N	{"client_id": 26}	127.0.0.1	2026-10-30 20:25:08.470949
370	1	\N	client_created	\N	{"client_id": 28}	127.0.0.1	2026-10-30 20:28:38.313645
371	1	\N	client_permissions_updated	\N	{"client_id": 28}	127.0.0.1	2026-10-30 20:28:38.416188
372	2	\N	login	\N	\N	127.0.0.1	2026-10-30 20:30:53.579573
\.


--
-- Data for Name: assessments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.assessments (id, client_id, authority, reference_number, assessment_date, status, notes, created_at) FROM stdin;
\.


--
-- Data for Name: clients; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.clients (id, company_name, contact_person, phone, email, notes, created_by, created_at, updated_at, contract_start_date, contract_end_date, service_type, total_contract_amount, amount_paid, assessment_info, location, tin, tra_number, zra_number, bpra_number, zssf_number, industry, financial_year_start, tra_username, tra_password, zra_username, zra_password, bpra_username, bpra_password, zssf_username, zssf_password, tra_reg_date, zra_reg_date, bpra_reg_date, zssf_reg_date, contract_signed_file, zra_phone, zssf_contract_file, tra_phone, auditor_id, tra_start_date, tra_end_date, tra_attachment, zra_start_date, zra_end_date, zra_attachment, bpra_start_date, bpra_end_date, bpra_attachment, zssf_start_date, zssf_end_date, zssf_attachment) FROM stdin;
26	coastline tour	MARCO CHRISTIAN JOSEPH	0765683291	hawamfaki1@gmail.com	\N	1	2026-10-29 19:09:44.544446	2026-10-30 20:25:08.371765	\N	\N	Audit	0.00	0.00	\N	Zanzibar	\N	\N	\N	\N	\N	tourism	2026-10-29	amin	••••••••	\N	\N	\N	\N	\N	\N	2026-10-29	\N	\N	\N	\N	\N	\N	0775892103	\N	2026-10-29	2026-12-31	tra_attachment_1793381108_HIMMA-Proposal-Shariya-Consultancy.pdf	\N	\N	zra_attachment_1793290362_SBC_Compliance_Register_Developer_Specification.pdf	\N	\N	\N	\N	\N	zssf_attachment_1793381076_sharia_business_consultant_.pdf
28	ujenzi company	KHAMIS ABDALLA ABRAHMANI	0658216348	khamis@gmail.com	\N	1	2026-10-30 20:28:38.302326	2026-10-30 20:28:38.302326	\N	\N	Audit	1000000.00	200000.00	\N	Mainland	\N	0778	\N	\N	\N	ujenzu	2026-10-30	khamis	khamis123	\N	\N	\N	\N	\N	\N	2026-01-30	\N	\N	\N	\N	\N	\N	0775892103	\N	2026-10-22	2026-12-31	tra_attachment_1793381318_admission-letter-APP-ZU-26-14844.pdf	\N	\N	\N	\N	\N	\N	\N	\N	\N
18	tourism 	MARCO CHRISTIAN JOSEPH	0765683291	marco@gmail.com	\N	1	2026-10-29 10:30:36.708924	2026-10-29 19:13:53.605073	\N	\N	Audit	1000000.00	450000.00	\N	Mainland	\N	\N	1234bb	1234hh	hh665-o	tourism	2026-10-29	amin	secret	amina	password	bauchenyforreally@gmail.com	Baucheny@1234	user	password	2026-01-01	2026-10-29	2026-10-15	2026-10-29	\N	0775892103	\N	0775892103	\N	2026-10-11	2026-10-29	tra_attachment_1793290433_HESLB_picha_600x800_1__jpg.jpeg	2026-10-29	2026-12-31	\N	2026-10-29	2026-12-31	\N	2026-10-29	2026-12-31	\N
27	students	Hussein Abdulrahman	0658216348	students	\N	1	2026-10-29 19:48:38.207648	2026-10-29 19:48:38.207648	\N	\N	Audit	0.00	0.00	\N	Zanzibar	\N	\N	\N	\N	\N	students	2026-10-29	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
8	hima	Hussein Abdulrahman	0775892103	hima@gmail.com	\N	1	2026-10-28 19:34:54.852534	2026-10-30 20:23:54.289542	\N	\N	Audit	1000000.00	800000.00	\N	Zanzibar	\N	0775892103	\N	\N	\N	software solutions	2026-10-30	user	••••••••	\N	\N	\N	\N	\N	\N	2026-10-28	\N	\N	\N	\N	\N	\N	0775892103	1	2026-10-04	2026-12-31	tra_attachment_1793381034_my_NIDA_with_verify_.pdf	\N	\N	\N	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: closings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.closings (id, obligation_id, client_id, assigned_staff_id, period_label, due_date, status, closed_at, closed_by, reference_number, proof_file_path, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: notification_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notification_logs (id, user_id, closing_id, channel, message, status, sent_at, staff_id, privilege_id, recipient) FROM stdin;
1	\N	\N	sms	Habari, umepangiwa jukumu jipya la mfumo: ANNUAL_PUBLISH	sent	2026-10-29 23:40:20.934116	2	4	0658216348
2	\N	\N	whatsapp	Habari, umepangiwa jukumu jipya la mfumo: ANNUAL_PUBLISH	sent	2026-10-29 23:40:20.934116	2	4	0658216348
3	\N	\N	email	Habari, umepangiwa jukumu jipya la mfumo: ANNUAL_PUBLISH	sent	2026-10-29 23:40:20.934116	2	4	husseinabdulrahman2334@gmail.com
4	\N	\N	sms	Habari, umepangiwa jukumu jipya la mfumo: ANNUAL_PUBLISH	sent	2026-10-29 23:41:12.127787	1	5	+255658216348
5	\N	\N	whatsapp	Habari, umepangiwa jukumu jipya la mfumo: ANNUAL_PUBLISH	sent	2026-10-29 23:41:12.127787	1	5	+255658216348
6	\N	\N	email	Habari, umepangiwa jukumu jipya la mfumo: ANNUAL_PUBLISH	sent	2026-10-29 23:41:12.127787	1	5	admin@sbc.local
7	\N	\N	sms	Habari, umepangiwa jukumu jipya la mfumo: VIEW_ALL	sent	2026-10-29 23:45:28.968005	4	6	0775892103
8	\N	\N	whatsapp	Habari, umepangiwa jukumu jipya la mfumo: VIEW_ALL	sent	2026-10-29 23:45:28.968005	4	6	0775892103
9	\N	\N	email	Habari, umepangiwa jukumu jipya la mfumo: VIEW_ALL	sent	2026-10-29 23:45:28.968005	4	6	husseinali2334@gmail.com
10	\N	\N	sms	Habari, umepangiwa jukumu jipya la mfumo: UPLOAD_TRA	sent	2026-10-30 16:52:21.865121	2	7	0658216348
11	\N	\N	whatsapp	Habari, umepangiwa jukumu jipya la mfumo: UPLOAD_TRA	sent	2026-10-30 16:52:21.865121	2	7	0658216348
12	\N	\N	email	Habari, umepangiwa jukumu jipya la mfumo: UPLOAD_TRA	sent	2026-10-30 16:52:21.865121	2	7	husseinabdulrahman2334@gmail.com
13	\N	\N	email	Habari, umepangiwa majukumu mapya ya mfumo. Tafadhali ingia kwenye mfumo kuona kazi zako.	sent	2026-10-30 17:09:56.644453	2	8	husseinabdulrahman2334@gmail.com
14	\N	\N	sms	Habari, umepangiwa majukumu mapya ya mfumo. Tafadhali ingia kwenye mfumo kuona kazi zako.	sent	2026-10-30 17:09:56.644453	2	8	0658216348
15	\N	\N	whatsapp	Habari, umepangiwa majukumu mapya ya mfumo. Tafadhali ingia kwenye mfumo kuona kazi zako.	sent	2026-10-30 17:09:56.644453	2	8	0658216348
16	\N	\N	email	Habari, majukumu yako kwenye mfumo yamefanyiwa mabadiliko. Tafadhali ingia kuangalia.	sent	2026-10-30 17:19:26.662654	2	8	husseinabdulrahman2334@gmail.com
17	\N	\N	sms	Habari, majukumu yako kwenye mfumo yamefanyiwa mabadiliko. Tafadhali ingia kuangalia.	sent	2026-10-30 17:19:26.662654	2	8	0658216348
18	\N	\N	whatsapp	Habari, majukumu yako kwenye mfumo yamefanyiwa mabadiliko. Tafadhali ingia kuangalia.	sent	2026-10-30 17:19:26.662654	2	8	0658216348
19	\N	\N	email	Habari, majukumu yako kwenye mfumo yamefanyiwa mabadiliko. Tafadhali ingia kuangalia.	sent	2026-10-30 17:33:17.919337	2	8	husseinabdulrahman2334@gmail.com
20	\N	\N	sms	Habari, majukumu yako kwenye mfumo yamefanyiwa mabadiliko. Tafadhali ingia kuangalia.	sent	2026-10-30 17:33:17.919337	2	8	0658216348
21	\N	\N	whatsapp	Habari, majukumu yako kwenye mfumo yamefanyiwa mabadiliko. Tafadhali ingia kuangalia.	sent	2026-10-30 17:33:17.919337	2	8	0658216348
22	\N	\N	email	Habari, majukumu yako kwenye mfumo yamefanyiwa mabadiliko. Tafadhali ingia kuangalia.	sent	2026-10-30 17:46:13.269775	2	8	husseinabdulrahman2334@gmail.com
23	\N	\N	sms	Habari, majukumu yako kwenye mfumo yamefanyiwa mabadiliko. Tafadhali ingia kuangalia.	sent	2026-10-30 17:46:13.269775	2	8	0658216348
24	\N	\N	whatsapp	Habari, majukumu yako kwenye mfumo yamefanyiwa mabadiliko. Tafadhali ingia kuangalia.	sent	2026-10-30 17:46:13.269775	2	8	0658216348
25	\N	\N	email	Habari, majukumu yako kwenye mfumo yamefanyiwa mabadiliko. Tafadhali ingia kuangalia.	sent	2026-10-30 17:47:26.834082	2	8	husseinabdulrahman2334@gmail.com
26	\N	\N	sms	Habari, majukumu yako kwenye mfumo yamefanyiwa mabadiliko. Tafadhali ingia kuangalia.	sent	2026-10-30 17:47:26.834082	2	8	0658216348
27	\N	\N	whatsapp	Habari, majukumu yako kwenye mfumo yamefanyiwa mabadiliko. Tafadhali ingia kuangalia.	sent	2026-10-30 17:47:26.834082	2	8	0658216348
28	\N	\N	email	Habari, majukumu yako kwenye mfumo yamefanyiwa mabadiliko. Tafadhali ingia kuangalia.	sent	2026-10-30 17:49:26.70546	2	8	husseinabdulrahman2334@gmail.com
29	\N	\N	sms	Habari, majukumu yako kwenye mfumo yamefanyiwa mabadiliko. Tafadhali ingia kuangalia.	sent	2026-10-30 17:49:26.70546	2	8	0658216348
30	\N	\N	whatsapp	Habari, majukumu yako kwenye mfumo yamefanyiwa mabadiliko. Tafadhali ingia kuangalia.	sent	2026-10-30 17:49:26.70546	2	8	0658216348
31	\N	\N	email	Habari, umepangiwa majukumu mapya ya mfumo. Tafadhali ingia kwenye mfumo kuona kazi zako.	sent	2026-10-30 18:12:29.81555	2	9	husseinabdulrahman2334@gmail.com
32	\N	\N	sms	Habari, umepangiwa majukumu mapya ya mfumo. Tafadhali ingia kwenye mfumo kuona kazi zako.	sent	2026-10-30 18:12:29.81555	2	9	0658216348
33	\N	\N	whatsapp	Habari, umepangiwa majukumu mapya ya mfumo. Tafadhali ingia kwenye mfumo kuona kazi zako.	sent	2026-10-30 18:12:29.81555	2	9	0658216348
34	\N	\N	email	Habari, majukumu yako kwenye mfumo yamefanyiwa mabadiliko. Tafadhali ingia kuangalia.	sent	2026-10-30 18:14:10.954174	2	9	husseinabdulrahman2334@gmail.com
35	\N	\N	sms	Habari, majukumu yako kwenye mfumo yamefanyiwa mabadiliko. Tafadhali ingia kuangalia.	sent	2026-10-30 18:14:10.954174	2	9	0658216348
36	\N	\N	whatsapp	Habari, majukumu yako kwenye mfumo yamefanyiwa mabadiliko. Tafadhali ingia kuangalia.	sent	2026-10-30 18:14:10.954174	2	9	0658216348
37	\N	\N	email	Habari, majukumu yako kwenye mfumo yamefanyiwa mabadiliko. Tafadhali ingia kuangalia.	sent	2026-10-30 20:14:34.541844	2	9	husseinabdulrahman2334@gmail.com
38	\N	\N	sms	Habari, majukumu yako kwenye mfumo yamefanyiwa mabadiliko. Tafadhali ingia kuangalia.	sent	2026-10-30 20:14:34.541844	2	9	0658216348
39	\N	\N	whatsapp	Habari, majukumu yako kwenye mfumo yamefanyiwa mabadiliko. Tafadhali ingia kuangalia.	sent	2026-10-30 20:14:34.541844	2	9	0658216348
40	\N	\N	email	Habari, majukumu yako kwenye mfumo yamefanyiwa mabadiliko. Tafadhali ingia kuangalia.	sent	2026-10-30 20:29:50.449554	2	9	husseinabdulrahman2334@gmail.com
41	\N	\N	sms	Habari, majukumu yako kwenye mfumo yamefanyiwa mabadiliko. Tafadhali ingia kuangalia.	sent	2026-10-30 20:29:50.449554	2	9	0658216348
42	\N	\N	whatsapp	Habari, majukumu yako kwenye mfumo yamefanyiwa mabadiliko. Tafadhali ingia kuangalia.	sent	2026-10-30 20:29:50.449554	2	9	0658216348
\.


--
-- Data for Name: obligation_assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.obligation_assignments (id, obligation_id, staff_id, role, created_at) FROM stdin;
\.


--
-- Data for Name: obligations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.obligations (id, client_id, title, frequency, due_day, default_staff_id, reminder_days, is_active, created_at, updated_at, authority, document_type, filing_status, confirmed_due_date, rule_type, requires_upload, instructions) FROM stdin;
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payments (id, client_id, amount, payment_date, receipt_number, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: reminder_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reminder_logs (id, closing_id, channel, recipient, message_template, status, provider_response, sent_at, is_read) FROM stdin;
\.


--
-- Data for Name: settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.settings (id, key, value, updated_by, updated_at) FROM stdin;
1	smtp	{"from": "", "host": "", "pass": "", "port": 587, "user": "", "from_name": ""}	1	2026-10-19 12:00:37.022865
2	whatsapp	{"token": "", "api_url": "https://graph.facebook.com/v20.0", "phone_id": ""}	1	2026-10-19 12:00:37.033234
3	reminder_rules	{"days": [30, 14, 7, 1, 0]}	1	2026-10-19 12:00:37.034016
\.


--
-- Data for Name: staff_privileges; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.staff_privileges (id, staff_id, client_id, task_type, description, is_active, created_by, created_at, permissions) FROM stdin;
8	2	8	upload_tra		t	1	2026-10-30 17:09:56.644453	["upload_tra", "view_clients", "view_passwords", "add_clients", "upload_zssf", "annual_zra", "annual_tra", "edit_clients", "upload_zra", "upload_bpra", "assign_tasks", "delete_clients"]
9	2	18	annual_zra		t	1	2026-10-30 18:12:29.81555	["annual_zra", "upload_zra"]
\.


--
-- Data for Name: task_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.task_permissions (id, client_id, staff_id, role_type, can_view_passwords, can_upload, created_by, granted_at, revoked_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, email, phone, password_hash, role, is_active, avatar_path, last_login_at, created_at, updated_at, reset_token, reset_token_expiry) FROM stdin;
4	ABDALLA ABRAHMANI ABDALLA	husseinali2334@gmail.com	0775892103	$2y$10$O72h.L6c5pwbDsqghDhLxOJF3WRvTD22V5YYoLb3B3FhENIieXEmK	staff	t	\N	\N	2026-10-18 16:17:32.277155	2026-10-19 23:55:18.263111	0b28bcdc857d7203468c574ccd5fda4d944044af89d802dbe922bc15fdf7fc70	2026-10-19 10:24:17
6	Ali Abdallah Abdulrahman	alidula2002@gmail.com	0775892103	$2y$10$1jjeimc5W8KRkB.zgxgFdeN9oBlR.mJKkCLKe2bJFyK3EjyeMOOb6	staff	t	\N	\N	2026-10-20 01:33:57.173597	2026-10-20 01:33:57.173597	\N	\N
1	Hussein Ali Abdulrahman	admin@sbc.local	+255658216348	$2y$10$Tdux5ImpVyQMiDnFx5k1Iu8yUDrSJThmbp9GTXvUFbbwiWFxbbIpe	admin	t	\N	2026-10-18 22:32:51	2026-10-18 13:04:38.166403	2026-10-20 10:57:14.005933	\N	\N
7	Sultan Abrahman Abdulla	email@gmail.com	0773154031	$2y$10$DWav2e.1LP1Ug0O0dissbuu5Us9HKLaT83YAcfhq6BqHG0qWNQsJO	auditor	t	\N	\N	2026-10-27 11:49:27.395552	2026-10-27 11:49:27.395552	\N	\N
2	Hussein Abdulrahman	husseinabdulrahman2334@gmail.com	0658216348	$2y$10$uGy1tSuQdWwiUE1jOAAhpecE5mwtcamtgsXdlzCn40hn9ErzHAcp6	staff	t	\N	2026-10-18 19:50:25	2026-10-18 15:40:09.100348	2026-10-30 20:32:50.114488	8e4b93f388677a77d2a8b954ab3328af1ea9f19861c5df997de0b1603b8cbfab	2026-10-23 18:02:34
\.


--
-- Name: activity_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.activity_logs_id_seq', 372, true);


--
-- Name: assessments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.assessments_id_seq', 1, false);


--
-- Name: clients_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.clients_id_seq', 28, true);


--
-- Name: closings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.closings_id_seq', 83, true);


--
-- Name: notification_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notification_logs_id_seq', 42, true);


--
-- Name: obligation_assignments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.obligation_assignments_id_seq', 1, false);


--
-- Name: obligations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.obligations_id_seq', 27, true);


--
-- Name: payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.payments_id_seq', 1, false);


--
-- Name: reminder_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.reminder_logs_id_seq', 44, true);


--
-- Name: settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.settings_id_seq', 9, true);


--
-- Name: staff_privileges_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.staff_privileges_id_seq', 9, true);


--
-- Name: task_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.task_permissions_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 7, true);


--
-- Name: activity_logs activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (id);


--
-- Name: assessments assessments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessments
    ADD CONSTRAINT assessments_pkey PRIMARY KEY (id);


--
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- Name: closings closings_obligation_id_period_label_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.closings
    ADD CONSTRAINT closings_obligation_id_period_label_key UNIQUE (obligation_id, period_label);


--
-- Name: closings closings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.closings
    ADD CONSTRAINT closings_pkey PRIMARY KEY (id);


--
-- Name: notification_logs notification_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_logs
    ADD CONSTRAINT notification_logs_pkey PRIMARY KEY (id);


--
-- Name: obligation_assignments obligation_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.obligation_assignments
    ADD CONSTRAINT obligation_assignments_pkey PRIMARY KEY (id);


--
-- Name: obligations obligations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.obligations
    ADD CONSTRAINT obligations_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: reminder_logs reminder_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reminder_logs
    ADD CONSTRAINT reminder_logs_pkey PRIMARY KEY (id);


--
-- Name: settings settings_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_key_key UNIQUE (key);


--
-- Name: settings settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_pkey PRIMARY KEY (id);


--
-- Name: staff_privileges staff_privileges_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_privileges
    ADD CONSTRAINT staff_privileges_pkey PRIMARY KEY (id);


--
-- Name: task_permissions task_permissions_client_id_staff_id_role_type_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_permissions
    ADD CONSTRAINT task_permissions_client_id_staff_id_role_type_key UNIQUE (client_id, staff_id, role_type);


--
-- Name: task_permissions task_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_permissions
    ADD CONSTRAINT task_permissions_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_closings_due; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_closings_due ON public.closings USING btree (due_date);


--
-- Name: idx_closings_staff; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_closings_staff ON public.closings USING btree (assigned_staff_id);


--
-- Name: idx_closings_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_closings_status ON public.closings USING btree (status);


--
-- Name: idx_task_perm_lookup; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_task_perm_lookup ON public.task_permissions USING btree (staff_id, client_id) WHERE (revoked_at IS NULL);


--
-- Name: activity_logs activity_logs_closing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_closing_id_fkey FOREIGN KEY (closing_id) REFERENCES public.closings(id) ON DELETE CASCADE;


--
-- Name: activity_logs activity_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: assessments assessments_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessments
    ADD CONSTRAINT assessments_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: clients clients_auditor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_auditor_id_fkey FOREIGN KEY (auditor_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: clients clients_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: closings closings_assigned_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.closings
    ADD CONSTRAINT closings_assigned_staff_id_fkey FOREIGN KEY (assigned_staff_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: closings closings_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.closings
    ADD CONSTRAINT closings_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: closings closings_closed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.closings
    ADD CONSTRAINT closings_closed_by_fkey FOREIGN KEY (closed_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: closings closings_obligation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.closings
    ADD CONSTRAINT closings_obligation_id_fkey FOREIGN KEY (obligation_id) REFERENCES public.obligations(id) ON DELETE CASCADE;


--
-- Name: notification_logs notification_logs_closing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_logs
    ADD CONSTRAINT notification_logs_closing_id_fkey FOREIGN KEY (closing_id) REFERENCES public.closings(id) ON DELETE CASCADE;


--
-- Name: notification_logs notification_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_logs
    ADD CONSTRAINT notification_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: obligation_assignments obligation_assignments_obligation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.obligation_assignments
    ADD CONSTRAINT obligation_assignments_obligation_id_fkey FOREIGN KEY (obligation_id) REFERENCES public.obligations(id) ON DELETE CASCADE;


--
-- Name: obligation_assignments obligation_assignments_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.obligation_assignments
    ADD CONSTRAINT obligation_assignments_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: obligations obligations_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.obligations
    ADD CONSTRAINT obligations_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: obligations obligations_default_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.obligations
    ADD CONSTRAINT obligations_default_staff_id_fkey FOREIGN KEY (default_staff_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: payments payments_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: payments payments_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: reminder_logs reminder_logs_closing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reminder_logs
    ADD CONSTRAINT reminder_logs_closing_id_fkey FOREIGN KEY (closing_id) REFERENCES public.closings(id) ON DELETE CASCADE;


--
-- Name: settings settings_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: staff_privileges staff_privileges_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_privileges
    ADD CONSTRAINT staff_privileges_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: staff_privileges staff_privileges_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_privileges
    ADD CONSTRAINT staff_privileges_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: staff_privileges staff_privileges_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_privileges
    ADD CONSTRAINT staff_privileges_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: task_permissions task_permissions_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_permissions
    ADD CONSTRAINT task_permissions_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: task_permissions task_permissions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_permissions
    ADD CONSTRAINT task_permissions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: task_permissions task_permissions_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_permissions
    ADD CONSTRAINT task_permissions_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: examinations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.examinations (
    id integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    client_id integer NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    exam_type character varying(30) NOT NULL
        CHECK (exam_type IN ('principal', 'penalties', 'interest')),
    frequency character varying(20) NOT NULL
        CHECK (frequency IN ('monthly', 'annual', 'quarterly', 'one_off')),
    exam_date date NOT NULL,
    attachment_path character varying(255),
    fee_amount numeric(14,2) NOT NULL DEFAULT 0 CHECK (fee_amount >= 0),
    fee_paid boolean NOT NULL DEFAULT false,
    created_by integer REFERENCES public.users(id) ON DELETE SET NULL,
    created_at timestamp without time zone NOT NULL DEFAULT now(),
    updated_at timestamp without time zone NOT NULL DEFAULT now()
);

CREATE INDEX examinations_client_date_idx
    ON public.examinations (client_id, exam_date DESC);

--
-- Name: client_documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.client_documents (
    id integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    client_id integer NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    uploaded_by integer REFERENCES public.users(id) ON DELETE SET NULL,
    uploader_name character varying(255) NOT NULL,
    uploader_role character varying(20) NOT NULL
        CHECK (uploader_role IN ('staff', 'auditor')),
    authority character varying(10) NOT NULL
        CHECK (authority IN ('TRA', 'ZRA', 'BPRA', 'ZSSF')),
    original_name character varying(255) NOT NULL,
    file_path character varying(500) NOT NULL,
    feedback text,
    feedback_by integer REFERENCES public.users(id) ON DELETE SET NULL,
    feedback_at timestamp without time zone,
    created_at timestamp without time zone NOT NULL DEFAULT now()
);

CREATE INDEX client_documents_client_role_idx
    ON public.client_documents (client_id, uploader_role, authority, created_at DESC);

--
-- Name: auditor_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auditor_messages (
    id integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    auditor_id integer NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    sender_id integer REFERENCES public.users(id) ON DELETE SET NULL,
    sender_role character varying(20) NOT NULL
        CHECK (sender_role IN ('admin', 'auditor')),
    sender_name character varying(120) NOT NULL,
    message text NOT NULL
        CHECK (length(trim(message)) BETWEEN 1 AND 5000),
    created_at timestamp without time zone NOT NULL DEFAULT now()
);

CREATE INDEX auditor_messages_thread_idx
    ON public.auditor_messages (auditor_id, created_at, id);

--

-- PostgreSQL database dump complete

\unrestrict Db5ZA5KZ66dIQVedfmTJEdITRY6d7RZ0K3eqN4Rue3AKNYMRiDPpbl36l0qvj12
