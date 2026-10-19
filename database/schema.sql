--
-- PostgreSQL database dump
--

\restrict PC6htbH5gE0YAix0cKWyROIHkwR5teuOubYCQaxe9mzcjQ3bEnaF7ehe2si2WHT

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
    assessment_info text
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
-- Name: obligations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.obligations (
    id integer NOT NULL,
    client_id integer NOT NULL,
    title character varying(200) NOT NULL,
    frequency character varying(20) NOT NULL,
    due_day integer NOT NULL,
    default_staff_id integer,
    reminder_days jsonb DEFAULT '[5, 1, 0]'::jsonb NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    authority character varying(50),
    document_type character varying(100),
    CONSTRAINT obligations_authority_check CHECK (((authority)::text = ANY ((ARRAY['TRA'::character varying, 'ZRA'::character varying, 'BPRA'::character varying, 'ALL'::character varying, 'TWO'::character varying])::text[]))),
    CONSTRAINT obligations_due_day_check CHECK (((due_day >= 1) AND (due_day <= 31))),
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
    CONSTRAINT reminder_logs_channel_check CHECK (((channel)::text = ANY ((ARRAY['whatsapp'::character varying, 'email'::character varying])::text[]))),
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
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'staff'::character varying])::text[])))
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
177	1	26	closing_updated	{"id": 26, "status": "overdue", "due_date": "2026-10-15", "client_id": 4, "closed_at": null, "closed_by": null, "created_at": "2026-10-20 01:23:32.647382", "updated_at": "2026-10-20 01:23:32.647382", "period_label": "2026-10", "obligation_id": 17, "proof_file_path": null, "reference_number": null, "assigned_staff_id": 2}	{"id": 26, "status": "closed", "due_date": "2026-10-15", "client_id": 4, "closed_at": "2026-10-20 00:59:25", "closed_by": 1, "created_at": "2026-10-20 01:23:32.647382", "updated_at": "2026-10-20 01:59:25.07499", "period_label": "2026-10", "obligation_id": 17, "proof_file_path": "/uploads/2026/10/proof_6ad6a0cd10f1b_report.pdf", "reference_number": "TRA-01-00292", "assigned_staff_id": 2}	127.0.0.1	2026-10-20 01:59:25.07928
178	1	43	closing_updated	{"id": 43, "status": "overdue", "due_date": "2026-10-15", "client_id": 2, "closed_at": null, "closed_by": null, "created_at": "2026-10-20 01:48:49.373636", "updated_at": "2026-10-20 01:48:49.373636", "period_label": "2026-10", "obligation_id": 21, "proof_file_path": null, "reference_number": null, "assigned_staff_id": 1}	{"id": 43, "status": "closed", "due_date": "2026-10-15", "client_id": 2, "closed_at": "2026-10-20 01:00:05", "closed_by": 1, "created_at": "2026-10-20 01:48:49.373636", "updated_at": "2026-10-20 02:00:05.193289", "period_label": "2026-10", "obligation_id": 21, "proof_file_path": "/uploads/2026/10/proof_6ad6a0f52eac5_report.pdf", "reference_number": "REF-010-0099", "assigned_staff_id": 1}	127.0.0.1	2026-10-20 02:00:05.197362
179	2	\N	login	\N	\N	127.0.0.1	2026-10-20 02:00:40.937132
180	2	31	closing_closed	{"id": 31, "status": "open", "due_date": "2026-12-15", "client_id": 5, "closed_at": null, "closed_by": null, "created_at": "2026-10-20 01:40:59.44842", "updated_at": "2026-10-20 01:40:59.44842", "period_label": "2026-Q4", "obligation_id": 19, "proof_file_path": null, "reference_number": null, "assigned_staff_id": 2}	{"id": 31, "status": "closed", "due_date": "2026-12-15", "client_id": 5, "closed_at": "2026-10-20 02:01:02.084619", "closed_by": 2, "created_at": "2026-10-20 01:40:59.44842", "updated_at": "2026-10-20 02:01:02.084619", "period_label": "2026-Q4", "obligation_id": 19, "proof_file_path": "/uploads/2026/10/proof_6ad6a12e13bd8_Sib-recovery-codes.pdf", "reference_number": "TRA-01-02020", "assigned_staff_id": 2}	127.0.0.1	2026-10-20 02:01:02.088911
181	1	\N	login	\N	\N	127.0.0.1	2026-10-20 02:04:54.484664
182	1	\N	login	\N	\N	127.0.0.1	2026-10-20 02:20:48.18147
183	1	\N	obligation_created	\N	{"obligation_id": 22}	127.0.0.1	2026-10-20 02:30:42.530505
184	1	28	closing_updated	{"id": 28, "status": "overdue", "due_date": "2026-10-15", "client_id": 4, "closed_at": null, "closed_by": null, "created_at": "2026-10-20 01:35:27.697409", "updated_at": "2026-10-20 01:35:27.697409", "period_label": "2026-10", "obligation_id": 18, "proof_file_path": null, "reference_number": null, "assigned_staff_id": 4}	{"id": 28, "status": "closed", "due_date": "2026-10-15", "client_id": 4, "closed_at": "2026-10-20 01:36:08", "closed_by": 1, "created_at": "2026-10-20 01:35:27.697409", "updated_at": "2026-10-20 02:36:08.25692", "period_label": "2026-10", "obligation_id": 18, "proof_file_path": "/uploads/2026/10/proof_6ad6a9683d9d0_leo.jpeg", "reference_number": "TEST", "assigned_staff_id": 4}	127.0.0.1	2026-10-20 02:36:08.26397
185	2	\N	login	\N	\N	127.0.0.1	2026-10-20 02:38:26.883859
\.


--
-- Data for Name: assessments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.assessments (id, client_id, authority, reference_number, assessment_date, status, notes, created_at) FROM stdin;
\.


--
-- Data for Name: clients; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.clients (id, company_name, contact_person, phone, email, notes, created_by, created_at, updated_at, contract_start_date, contract_end_date, service_type, total_contract_amount, amount_paid, assessment_info) FROM stdin;
2	students	Hussein Abdulrahman	0658216348	husseinali2334@gmail.com		1	2026-10-19 00:21:11.747761	2026-10-19 00:21:24.95571	2026-10-19	2027-12-19	Audit	2000000.00	300000000.00	gjtnjjtgitg
3	compamy1	ABDALLA ABRAHMANI ABDALLA	0775892103	husseinali2334@gmail.com		1	2026-10-19 10:56:03.84802	2026-10-19 10:57:52.09271	2026-10-19	2027-01-01	Tax	2000000.00	150000.00	bgrengfngrngigni
5	Monthly Audit Report	Dotto Mohamedi Ally	0716498209	hawamfaki1@gmail.com		1	2026-10-20 01:40:31.594942	2026-10-20 01:40:31.594942	2026-10-25	2027-12-20	Audit	10000000.00	500008.00	
4	company 2	Sultan Abrahman Abdulla	0773154031	sultan@gmail.com		1	2026-10-20 00:08:22.594122	2026-10-20 01:44:47.137388	2026-10-20	2026-10-31	Registration	1000000.00	499985.00	there are many cases for registrations 
\.


--
-- Data for Name: closings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.closings (id, obligation_id, client_id, assigned_staff_id, period_label, due_date, status, closed_at, closed_by, reference_number, proof_file_path, created_at, updated_at) FROM stdin;
26	17	4	2	2026-10	2026-10-15	closed	2026-10-20 00:59:25	1	TRA-01-00292	/uploads/2026/10/proof_6ad6a0cd10f1b_report.pdf	2026-10-20 01:23:32.647382	2026-10-20 01:59:25.07499
31	19	5	2	2026-Q4	2026-12-15	closed	2026-10-20 02:01:02.084619	2	TRA-01-02020	/uploads/2026/10/proof_6ad6a12e13bd8_Sib-recovery-codes.pdf	2026-10-20 01:40:59.44842	2026-10-20 02:01:02.084619
43	21	2	1	2026-10	2026-10-15	closed	2026-10-20 01:00:05	1	REF-010-0099	/uploads/2026/10/proof_6ad6a0f52eac5_report.pdf	2026-10-20 01:48:49.373636	2026-10-20 02:00:05.193289
38	20	2	6	2026-10	2026-10-15	overdue	\N	\N	\N	\N	2026-10-20 01:45:46.845809	2026-10-20 01:45:46.845809
49	22	2	2	2026-10	2026-10-15	overdue	\N	\N	\N	\N	2026-10-20 02:30:38.307685	2026-10-20 02:30:38.307685
28	18	4	4	2026-10	2026-10-15	closed	2026-10-20 01:36:08	1	TEST	/uploads/2026/10/proof_6ad6a9683d9d0_leo.jpeg	2026-10-20 01:35:27.697409	2026-10-20 02:36:08.25692
\.


--
-- Data for Name: obligations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.obligations (id, client_id, title, frequency, due_day, default_staff_id, reminder_days, is_active, created_at, updated_at, authority, document_type) FROM stdin;
17	4	task test	monthly	15	2	[5, 1, 0]	t	2026-10-20 01:23:32.638638	2026-10-20 01:23:32.638638	\N	\N
18	4	ali test	monthly	15	4	[5, 1, 0]	t	2026-10-20 01:35:27.684884	2026-10-20 01:35:27.684884	\N	\N
19	5	audit	quarterly	15	2	[5, 1, 0]	t	2026-10-20 01:40:59.439538	2026-10-20 01:42:18.455613	\N	\N
20	2	harry	monthly	15	6	[5, 1, 0]	t	2026-10-20 01:45:46.832748	2026-10-20 01:45:46.832748	\N	\N
21	2	me admin	monthly	15	1	[5, 1, 0]	t	2026-10-20 01:48:49.361182	2026-10-20 01:48:49.361182	\N	\N
22	2	t	monthly	15	2	[5, 1, 0]	t	2026-10-20 02:30:38.275779	2026-10-20 02:30:38.275779	\N	\N
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payments (id, client_id, amount, payment_date, receipt_number, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: reminder_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reminder_logs (id, closing_id, channel, recipient, message_template, status, provider_response, sent_at) FROM stdin;
17	26	whatsapp	0658216348	reminder_d0	failed	Client error: `POST https://graph.facebook.com/v20.0/1336083899592072/messages` resulted in a `401 Unauthorized` response:\n{"error":{"message":"Authentication Error","code":190,"type":"OAuthException","fbtrace_id":"A1KJ9jOU_bR0_BqMI8uFX9H"}}\n	2026-10-20 01:23:34.200795
18	26	email	husseinabdulrahman2334@gmail.com	reminder_d0	sent	sent	2026-10-20 01:23:37.230805
19	28	whatsapp	0775892103	reminder_d0	failed	Client error: `POST https://graph.facebook.com/v20.0/1336083899592072/messages` resulted in a `401 Unauthorized` response:\n{"error":{"message":"Authentication Error","code":190,"type":"OAuthException","fbtrace_id":"AUaHLNMQq9JiLlfXp7EenpL"}}\n	2026-10-20 01:35:28.903116
20	28	email	husseinali2334@gmail.com	reminder_d0	sent	sent	2026-10-20 01:35:31.886441
21	38	whatsapp	0775892103	reminder_d0	failed	Client error: `POST https://graph.facebook.com/v20.0/1336083899592072/messages` resulted in a `401 Unauthorized` response:\n{"error":{"message":"Authentication Error","code":190,"type":"OAuthException","fbtrace_id":"AdsaFkR2q7wuO6R2lwCv5T3"}}\n	2026-10-20 01:45:48.016975
22	38	email	alidula2002@gmail.com	reminder_d0	sent	sent	2026-10-20 01:45:50.969707
23	43	whatsapp	+255658216348	reminder_d0	failed	Client error: `POST https://graph.facebook.com/v20.0/1336083899592072/messages` resulted in a `401 Unauthorized` response:\n{"error":{"message":"Authentication Error","code":190,"type":"OAuthException","fbtrace_id":"AP5Qgde6w00iMaMvIt2W6pv"}}\n	2026-10-20 01:48:50.516808
24	43	email	admin@sbc.local	reminder_d0	sent	sent	2026-10-20 01:48:53.419322
25	49	whatsapp	0658216348	reminder_d0	failed	Client error: `POST https://graph.facebook.com/v20.0/1336083899592072/messages` resulted in a `401 Unauthorized` response:\n{"error":{"message":"Authentication Error","code":190,"type":"OAuthException","fbtrace_id":"AugXhoey_MFloEzdv2Gq-VN"}}\n	2026-10-20 02:30:39.483569
26	49	email	husseinabdulrahman2334@gmail.com	reminder_d0	sent	sent	2026-10-20 02:30:42.522959
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
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, email, phone, password_hash, role, is_active, avatar_path, last_login_at, created_at, updated_at, reset_token, reset_token_expiry) FROM stdin;
2	Hussein Abdulrahman	husseinabdulrahman2334@gmail.com	0658216348	$2y$10$uGy1tSuQdWwiUE1jOAAhpecE5mwtcamtgsXdlzCn40hn9ErzHAcp6	staff	t	\N	2026-10-18 19:50:25	2026-10-18 15:40:09.100348	2026-10-19 13:00:28.910087	\N	\N
4	ABDALLA ABRAHMANI ABDALLA	husseinali2334@gmail.com	0775892103	$2y$10$O72h.L6c5pwbDsqghDhLxOJF3WRvTD22V5YYoLb3B3FhENIieXEmK	staff	t	\N	\N	2026-10-18 16:17:32.277155	2026-10-19 23:55:18.263111	0b28bcdc857d7203468c574ccd5fda4d944044af89d802dbe922bc15fdf7fc70	2026-10-19 10:24:17
1	Hussein Ali Abdulrahman	admin@sbc.local	+255658216348	$2y$10$Tdux5ImpVyQMiDnFx5k1Iu8yUDrSJThmbp9GTXvUFbbwiWFxbbIpe	admin	t	\N	2026-10-18 22:32:51	2026-10-18 13:04:38.166403	2026-10-20 00:00:23.069987	\N	\N
6	Ali Abdallah Abdulrahman	alidula2002@gmail.com	0775892103	$2y$10$1jjeimc5W8KRkB.zgxgFdeN9oBlR.mJKkCLKe2bJFyK3EjyeMOOb6	staff	t	\N	\N	2026-10-20 01:33:57.173597	2026-10-20 01:33:57.173597	\N	\N
\.


--
-- Name: activity_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.activity_logs_id_seq', 185, true);


--
-- Name: assessments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.assessments_id_seq', 1, false);


--
-- Name: clients_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.clients_id_seq', 5, true);


--
-- Name: closings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.closings_id_seq', 49, true);


--
-- Name: obligations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.obligations_id_seq', 22, true);


--
-- Name: payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.payments_id_seq', 1, false);


--
-- Name: reminder_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.reminder_logs_id_seq', 26, true);


--
-- Name: settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.settings_id_seq', 9, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 6, true);


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
-- PostgreSQL database dump complete
--

\unrestrict PC6htbH5gE0YAix0cKWyROIHkwR5teuOubYCQaxe9mzcjQ3bEnaF7ehe2si2WHT

