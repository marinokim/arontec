--
-- PostgreSQL database dump
--

\restrict x6DINAMqZMq54EfV9DLDMQ1vuQLC7OkAy0lz8itKlcnqy8b9OZvSNmn1riZBaS3

-- Dumped from database version 14.20 (Homebrew)
-- Dumped by pg_dump version 14.20 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
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
-- Name: carts; Type: TABLE; Schema: public; Owner: lab
--

CREATE TABLE public.carts (
    id integer NOT NULL,
    user_id integer,
    product_id integer,
    quantity integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.carts OWNER TO lab;

--
-- Name: carts_id_seq; Type: SEQUENCE; Schema: public; Owner: lab
--

CREATE SEQUENCE public.carts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.carts_id_seq OWNER TO lab;

--
-- Name: carts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: lab
--

ALTER SEQUENCE public.carts_id_seq OWNED BY public.carts.id;


--
-- Name: categories; Type: TABLE; Schema: public; Owner: lab
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    slug character varying(100) NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.categories OWNER TO lab;

--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: lab
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.categories_id_seq OWNER TO lab;

--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: lab
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: lab
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    content text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.notifications OWNER TO lab;

--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: lab
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.notifications_id_seq OWNER TO lab;

--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: lab
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: products; Type: TABLE; Schema: public; Owner: lab
--

CREATE TABLE public.products (
    id integer NOT NULL,
    category_id integer,
    brand character varying(100) NOT NULL,
    model_name character varying(255) NOT NULL,
    description text,
    image_url character varying(500),
    b2b_price numeric(10,2) NOT NULL,
    stock_quantity integer DEFAULT 0,
    is_available boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    detail_url text
);


ALTER TABLE public.products OWNER TO lab;

--
-- Name: products_id_seq; Type: SEQUENCE; Schema: public; Owner: lab
--

CREATE SEQUENCE public.products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.products_id_seq OWNER TO lab;

--
-- Name: products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: lab
--

ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;


--
-- Name: quote_items; Type: TABLE; Schema: public; Owner: lab
--

CREATE TABLE public.quote_items (
    id integer NOT NULL,
    quote_id integer,
    product_id integer,
    quantity integer NOT NULL,
    unit_price numeric(10,2) NOT NULL,
    subtotal numeric(12,2) NOT NULL
);


ALTER TABLE public.quote_items OWNER TO lab;

--
-- Name: quote_items_id_seq; Type: SEQUENCE; Schema: public; Owner: lab
--

CREATE SEQUENCE public.quote_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.quote_items_id_seq OWNER TO lab;

--
-- Name: quote_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: lab
--

ALTER SEQUENCE public.quote_items_id_seq OWNED BY public.quote_items.id;


--
-- Name: quotes; Type: TABLE; Schema: public; Owner: lab
--

CREATE TABLE public.quotes (
    id integer NOT NULL,
    user_id integer,
    quote_number character varying(50) NOT NULL,
    delivery_date date,
    notes text,
    status character varying(50) DEFAULT 'pending'::character varying,
    total_amount numeric(12,2),
    admin_notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.quotes OWNER TO lab;

--
-- Name: quotes_id_seq; Type: SEQUENCE; Schema: public; Owner: lab
--

CREATE SEQUENCE public.quotes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.quotes_id_seq OWNER TO lab;

--
-- Name: quotes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: lab
--

ALTER SEQUENCE public.quotes_id_seq OWNED BY public.quotes.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: lab
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    company_name character varying(255) NOT NULL,
    contact_person character varying(100) NOT NULL,
    phone character varying(20),
    business_number character varying(50),
    is_approved boolean DEFAULT false,
    is_admin boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.users OWNER TO lab;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: lab
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO lab;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: lab
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: carts id; Type: DEFAULT; Schema: public; Owner: lab
--

ALTER TABLE ONLY public.carts ALTER COLUMN id SET DEFAULT nextval('public.carts_id_seq'::regclass);


--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: lab
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: lab
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: products id; Type: DEFAULT; Schema: public; Owner: lab
--

ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);


--
-- Name: quote_items id; Type: DEFAULT; Schema: public; Owner: lab
--

ALTER TABLE ONLY public.quote_items ALTER COLUMN id SET DEFAULT nextval('public.quote_items_id_seq'::regclass);


--
-- Name: quotes id; Type: DEFAULT; Schema: public; Owner: lab
--

ALTER TABLE ONLY public.quotes ALTER COLUMN id SET DEFAULT nextval('public.quotes_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: lab
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: carts; Type: TABLE DATA; Schema: public; Owner: lab
--

COPY public.carts (id, user_id, product_id, quantity, created_at) FROM stdin;
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: lab
--

COPY public.categories (id, name, slug, description, created_at) FROM stdin;
1	Audio	audio	스피커, 헤드폰, 이어폰 등	2025-11-27 12:06:12.607985
2	Mobile	mobile	휴대폰 액세서리 및 주변기기	2025-11-27 12:06:12.607985
3	Beauty	beauty	미용 및 뷰티 제품	2025-11-27 12:06:12.607985
4	Other	other	생활용품 및 잡화	2025-11-27 12:06:12.607985
5	Food	food	Food and Beverages	2025-11-27 17:30:48.092062
6	Fashion	fashion	패션 의류 및 잡화	2025-11-27 18:18:23.390871
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: lab
--

COPY public.notifications (id, title, content, is_active, created_at, updated_at) FROM stdin;
1	시스템 오픈 안내	B2B SCM 시스템이 오픈되었습니다. 회원가입 후 관리자 승인을 받으시면 이용 가능합니다.	t	2025-11-27 12:06:12.621037	2025-11-27 12:06:12.621037
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: lab
--

COPY public.products (id, category_id, brand, model_name, description, image_url, b2b_price, stock_quantity, is_available, created_at, updated_at, detail_url) FROM stdin;
8	1	INKEL	IK-BT55C	무선충전,블루투스 시계, 라디오	https://ai.esmplus.com/sound2u/inkel/IK-BT55C.jpg	38000.00	300	t	2025-11-27 16:59:34.298473	2025-11-27 17:39:53.090321	https://ai.esmplus.com/sound2u/inkel/IK-BT55C.jpg
7	1	INKEL	IK-BT53	INKEL 레트로 블루투스 스피커 IK-BT53C	https://ai.esmplus.com/sound2u/inkel/IK-BT53.jpg	34000.00	300	t	2025-11-27 16:58:01.822154	2025-11-27 17:40:35.466391	https://ai.esmplus.com/sound2u/inkel/IK-BT53.jpg
9	3	나틴다	주름미백 2중 기능성 아이 링클 케어 크림 30g		https://img.welfaremall.co.kr/file/product/MALL_MIMG_17101421021.jpg	9000.00	10000	t	2025-11-27 17:16:07.416498	2025-11-27 17:42:12.029116	https://img.welfaremall.co.kr/file/image/2024/03/11/F_17101420907409.jpg
10	3	나튄다	건조함 걱정 없는 매직 레인보우 립스틱 3.5g 10종 택 1	차밍 코랄,블링 핑크,재즈 오렌지,믹싱 러브,터치 하트,키스 인 다크,베이비 피치,샤이 로즈 핑크,크로스 로즈,살사 댄스	https://img.welfaremall.co.kr/file/product/MALL_MIMG_17205933631.jpg	9000.00	10000	t	2025-11-27 18:05:19.865827	2025-11-27 18:05:19.865827	https://img.welfaremall.co.kr/file/image/2024/07/10/F_17205933605472.jpg
11	3	나튄다	리얼매직커버 선비비크림 50g		https://img.welfaremall.co.kr/file/product/MALL_MIMG_17205934401.jpg	9500.00	10000	t	2025-11-27 18:07:05.363376	2025-11-27 18:07:05.363376	https://img.welfaremall.co.kr/file/image/2024/07/10/F_17205934230134.jpg
12	3	더허브샵	드레스 퍼퓸 섬유 탈취제 100ml	"[제품구성]\n > 드레스 퍼퓸 섬유 탈취제 100ml\n[제품사양]\n > 향 종류: 프렌치라벤더, 옴니아 시크릿, 수국, 에끌라 그린티 앤 피치, 한라봉, 블랙체리, 다우니코튼\n           \n[제품특징]\n > 매일 세탁할 수 없는 섬유소재의 제품에 활용 가능\n > 자연유래 성분으로 만들어진 안전한 섬유 향수\n > 휴대하기 간편한100ml 아담한 사이즈\n > 취향별로 사용하는 7가지 다양한 향기"	https://gntimg.cafe24.com/info/gnt/193_sum.jpg	3630.00	10000	t	2025-11-27 18:08:43.133457	2025-11-27 18:08:43.133457	https://gntimg.cafe24.com/info/gnt/193_de.jpg
13	3	더허브샵	풋매너 신발냄새 탈취제 100ml	"[제품구성]\n > 풋매너 신발냄새 탈취제 100ml\n[제품사양]\n > 내용량: 100ml\n > 향: 페퍼민트+블랙체리+유칼립투스\n[제품특징]\n > 시그니처 향료 에센셜오일 함류\n > 악취제거에 효과적\n > 휴대하기 간편한 아담한 사이즈\n > 신발과 발 모두 사용 가능한 범용성"	https://gntimg.cafe24.com/info/gnt/194_sum.jpg	3630.00	10000	t	2025-11-27 18:09:44.518814	2025-11-27 18:09:44.518814	https://gntimg.cafe24.com/info/gnt/194_de.jpg
14	3	아베다	아베다 로즈마리 바디세트 30ml 4종 어메니티 여행용세트 (지퍼백포장)	"■구성 : SHAMPOO 30ml 1P, CONDITIONER 30ml 1P, SHOWER GEL 30ml 1P, BODY LOTION 30ml, 1P, 지퍼백\n■규격 : 150*120*30mm\n■재원 : 민트, 베르가뭇 etc.\n■지구를 보호하는 친환경 식물성 성분만을 사용하는 기업\n■꽃과 식물에서 찾은 에센스들로 할력 넘치는 쿨링감\n■샴푸, 컨디셔너, 바디워시, 바디로션 여행 필수품으로 구성"	https://img.welfaremall.co.kr/file/product/MALL_MIMG_17404655481.jpg	15000.00	2000	t	2025-11-27 18:11:20.95623	2025-11-27 18:11:20.95623	https://img.welfaremall.co.kr/file/image/2025/02/25/F_1740465543872.jpg
\.


--
-- Data for Name: quote_items; Type: TABLE DATA; Schema: public; Owner: lab
--

COPY public.quote_items (id, quote_id, product_id, quantity, unit_price, subtotal) FROM stdin;
\.


--
-- Data for Name: quotes; Type: TABLE DATA; Schema: public; Owner: lab
--

COPY public.quotes (id, user_id, quote_number, delivery_date, notes, status, total_amount, admin_notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: lab
--

COPY public.users (id, email, password_hash, company_name, contact_person, phone, business_number, is_approved, is_admin, created_at, updated_at) FROM stdin;
1	admin@arontec.com	$2a$10$jjzEdBwvOuBDw36Q8HrXGubcazICr1S37.5i8Dw/ciR85YG0gIIn.	아론텍코리아	관리자	031-947-4938	\N	t	t	2025-11-27 12:06:12.602414	2025-11-27 12:06:12.602414
2	twovol@naver.com	$2a$10$M44mTJXZ7Q7icORQCcy9EeFKegTUy83QLkTKWa1KICgYpZRfDYcqu	(주)마인드케이	김두권	010-5248-0066	123-44-444444	t	f	2025-11-27 12:11:22.480236	2025-11-27 12:11:22.480236
\.


--
-- Name: carts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: lab
--

SELECT pg_catalog.setval('public.carts_id_seq', 1, true);


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: lab
--

SELECT pg_catalog.setval('public.categories_id_seq', 6, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: lab
--

SELECT pg_catalog.setval('public.notifications_id_seq', 1, true);


--
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: lab
--

SELECT pg_catalog.setval('public.products_id_seq', 14, true);


--
-- Name: quote_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: lab
--

SELECT pg_catalog.setval('public.quote_items_id_seq', 1, false);


--
-- Name: quotes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: lab
--

SELECT pg_catalog.setval('public.quotes_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: lab
--

SELECT pg_catalog.setval('public.users_id_seq', 2, true);


--
-- Name: carts carts_pkey; Type: CONSTRAINT; Schema: public; Owner: lab
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_pkey PRIMARY KEY (id);


--
-- Name: carts carts_user_id_product_id_key; Type: CONSTRAINT; Schema: public; Owner: lab
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_product_id_key UNIQUE (user_id, product_id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: lab
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: categories categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: lab
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_slug_key UNIQUE (slug);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: lab
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: lab
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: quote_items quote_items_pkey; Type: CONSTRAINT; Schema: public; Owner: lab
--

ALTER TABLE ONLY public.quote_items
    ADD CONSTRAINT quote_items_pkey PRIMARY KEY (id);


--
-- Name: quotes quotes_pkey; Type: CONSTRAINT; Schema: public; Owner: lab
--

ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT quotes_pkey PRIMARY KEY (id);


--
-- Name: quotes quotes_quote_number_key; Type: CONSTRAINT; Schema: public; Owner: lab
--

ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT quotes_quote_number_key UNIQUE (quote_number);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: lab
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: lab
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_carts_user; Type: INDEX; Schema: public; Owner: lab
--

CREATE INDEX idx_carts_user ON public.carts USING btree (user_id);


--
-- Name: idx_products_available; Type: INDEX; Schema: public; Owner: lab
--

CREATE INDEX idx_products_available ON public.products USING btree (is_available);


--
-- Name: idx_products_category; Type: INDEX; Schema: public; Owner: lab
--

CREATE INDEX idx_products_category ON public.products USING btree (category_id);


--
-- Name: idx_quote_items_quote; Type: INDEX; Schema: public; Owner: lab
--

CREATE INDEX idx_quote_items_quote ON public.quote_items USING btree (quote_id);


--
-- Name: idx_quotes_status; Type: INDEX; Schema: public; Owner: lab
--

CREATE INDEX idx_quotes_status ON public.quotes USING btree (status);


--
-- Name: idx_quotes_user; Type: INDEX; Schema: public; Owner: lab
--

CREATE INDEX idx_quotes_user ON public.quotes USING btree (user_id);


--
-- Name: idx_users_approved; Type: INDEX; Schema: public; Owner: lab
--

CREATE INDEX idx_users_approved ON public.users USING btree (is_approved);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: lab
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: carts carts_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: lab
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: carts carts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: lab
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: products products_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: lab
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: quote_items quote_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: lab
--

ALTER TABLE ONLY public.quote_items
    ADD CONSTRAINT quote_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: quote_items quote_items_quote_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: lab
--

ALTER TABLE ONLY public.quote_items
    ADD CONSTRAINT quote_items_quote_id_fkey FOREIGN KEY (quote_id) REFERENCES public.quotes(id) ON DELETE CASCADE;


--
-- Name: quotes quotes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: lab
--

ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT quotes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

\unrestrict x6DINAMqZMq54EfV9DLDMQ1vuQLC7OkAy0lz8itKlcnqy8b9OZvSNmn1riZBaS3

