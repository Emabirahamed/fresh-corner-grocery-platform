--
-- PostgreSQL database dump
--

\restrict aexupRWvh0Co1Kniwsga7puVhKzO6cKvKpcBbiWlvgKkepN4QDn7cnSolfBY77x

-- Dumped from database version 16.11 (Ubuntu 16.11-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.11 (Ubuntu 16.11-0ubuntu0.24.04.1)

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

--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.categories (id, name_en, name_bn, slug, description, image_url, icon_url, parent_id, display_order, is_active, created_at, updated_at) FROM stdin;
2	Vegetables	সবজি	vegetables	\N	\N	\N	\N	1	t	2026-02-16 16:03:37.052627	2026-02-16 16:03:37.052627
3	Fruits	ফলমূল	fruits	\N	\N	\N	\N	2	t	2026-02-16 16:03:37.052627	2026-02-16 16:03:37.052627
4	Rice & Grains	চাল ও শস্য	rice-grains	\N	\N	\N	\N	3	t	2026-02-16 16:03:37.052627	2026-02-16 16:03:37.052627
5	Fish & Meat	মাছ ও মাংস	fish-meat	\N	\N	\N	\N	4	t	2026-02-16 16:03:37.052627	2026-02-16 16:03:37.052627
6	Dairy & Eggs	দুগ্ধ ও ডিম	dairy-eggs	\N	\N	\N	\N	5	t	2026-02-16 16:03:37.052627	2026-02-16 16:03:37.052627
7	Spices	মশলা	spices	\N	\N	\N	\N	6	t	2026-02-16 16:03:37.052627	2026-02-16 16:03:37.052627
8	Leafy Vegetables	পাতা সবজি	leafy-vegetables	\N	\N	\N	2	11	t	2026-02-16 23:54:12.721462	2026-02-16 23:54:12.721462
9	Root Vegetables	মূল সবজি	root-vegetables	\N	\N	\N	2	12	t	2026-02-16 23:54:12.721462	2026-02-16 23:54:12.721462
10	Tropical Fruits	দেশি ফল	tropical-fruits	\N	\N	\N	3	21	t	2026-02-16 23:54:12.721462	2026-02-16 23:54:12.721462
11	Fish	মাছ	fish	\N	\N	\N	5	41	t	2026-02-16 23:54:12.721462	2026-02-16 23:54:12.721462
12	Meat	মাংস	meat	\N	\N	\N	5	42	t	2026-02-16 23:54:12.721462	2026-02-16 23:54:12.721462
13	Lentils & Dal	ডাল	lentils	\N	\N	\N	4	31	t	2026-02-16 23:54:12.721462	2026-02-16 23:54:12.721462
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.products (id, name_en, name_bn, slug, description_en, description_bn, category_id, sku, barcode, price, discount_price, discount_percentage, unit, unit_value, stock_quantity, min_order_quantity, max_order_quantity, image_url, images, is_available, is_featured, is_organic, tags, nutrition_info, created_at, updated_at) FROM stdin;
7	Carrot	গাজর	carrot	\N	\N	2	\N	\N	45.00	\N	0	kg	1.00	90	1	100	\N	\N	t	f	f	\N	\N	2026-02-15 19:48:21.778607	2026-02-16 16:08:24.665699
9	Spinach	পালং শাক	spinach	\N	\N	2	\N	\N	20.00	\N	0	kg	1.00	60	1	100	\N	\N	t	f	f	\N	\N	2026-02-15 19:48:21.778607	2026-02-16 16:08:24.665699
3	Tomato	টমেটো	tomato	\N	\N	2	\N	\N	50.00	\N	0	kg	1.00	79	1	100	\N	\N	t	f	f	\N	\N	2026-02-15 19:48:21.778607	2026-02-16 16:08:24.665699
8	Cucumber	শসা	cucumber	\N	\N	2	\N	\N	25.00	\N	0	kg	1.00	69	1	100	\N	\N	t	f	f	\N	\N	2026-02-15 19:48:21.778607	2026-02-16 16:08:24.665699
5	Banana	কলা	banana	\N	\N	3	\N	\N	40.00	\N	0	piece	1.00	149	1	100	\N	\N	t	f	f	\N	\N	2026-02-15 19:48:21.778607	2026-02-16 16:08:24.665699
4	Rice	চাল	rice	\N	\N	4	\N	\N	55.00	\N	0	kg	1.00	197	1	100	\N	\N	t	f	f	\N	\N	2026-02-15 19:48:21.778607	2026-02-16 16:08:24.665699
6	Onion	পেঁয়াজ	onion	\N	\N	2	\N	\N	35.00	\N	0	kg	1.00	118	1	100	\N	\N	t	f	f	\N	\N	2026-02-15 19:48:21.778607	2026-02-16 16:14:24.137331
10	Spinach	পালং শাক	palang-shak	\N	\N	8	\N	\N	20.00	\N	0	kg	1.00	50	1	100	\N	\N	t	f	f	\N	\N	2026-02-16 23:56:13.481849	2026-02-16 23:56:13.481849
11	Coriander	ধনেপাতা	dhone-pata	\N	\N	8	\N	\N	15.00	\N	0	piece	1.00	40	1	100	\N	\N	t	f	f	\N	\N	2026-02-16 23:56:13.481849	2026-02-16 23:56:13.481849
12	Green Chili	কাঁচা মরিচ	kacha-morich	\N	\N	8	\N	\N	10.00	\N	0	kg	1.00	100	1	100	\N	\N	t	f	f	\N	\N	2026-02-16 23:56:13.481849	2026-02-16 23:56:13.481849
13	Carrot	গাজর	gajar-2	\N	\N	9	\N	\N	45.00	\N	0	kg	1.00	60	1	100	\N	\N	t	f	f	\N	\N	2026-02-16 23:56:13.481849	2026-02-16 23:56:13.481849
14	Radish	মুলা	mula	\N	\N	9	\N	\N	20.00	\N	0	kg	1.00	45	1	100	\N	\N	t	f	f	\N	\N	2026-02-16 23:56:13.481849	2026-02-16 23:56:13.481849
15	Sweet Potato	মিষ্টি আলু	misti-alu	\N	\N	9	\N	\N	35.00	\N	0	kg	1.00	55	1	100	\N	\N	t	f	f	\N	\N	2026-02-16 23:56:13.481849	2026-02-16 23:56:13.481849
16	Mango	আম	am	\N	\N	10	\N	\N	80.00	\N	0	kg	1.00	30	1	100	\N	\N	t	f	f	\N	\N	2026-02-16 23:56:13.481849	2026-02-16 23:56:13.481849
17	Jackfruit	কাঁঠাল	kathal	\N	\N	10	\N	\N	60.00	\N	0	piece	1.00	20	1	100	\N	\N	t	f	f	\N	\N	2026-02-16 23:56:13.481849	2026-02-16 23:56:13.481849
18	Guava	পেয়ারা	peyara	\N	\N	10	\N	\N	50.00	\N	0	kg	1.00	40	1	100	\N	\N	t	f	f	\N	\N	2026-02-16 23:56:13.481849	2026-02-16 23:56:13.481849
19	Hilsa Fish	ইলিশ মাছ	ilish-mach	\N	\N	11	\N	\N	800.00	\N	0	kg	1.00	15	1	100	\N	\N	t	f	f	\N	\N	2026-02-16 23:56:13.481849	2026-02-16 23:56:13.481849
20	Rui Fish	রুই মাছ	rui-mach	\N	\N	11	\N	\N	250.00	\N	0	kg	1.00	20	1	100	\N	\N	t	f	f	\N	\N	2026-02-16 23:56:13.481849	2026-02-16 23:56:13.481849
21	Chicken	মুরগির মাংস	murgi	\N	\N	12	\N	\N	180.00	\N	0	kg	1.00	25	1	100	\N	\N	t	f	f	\N	\N	2026-02-16 23:56:13.481849	2026-02-16 23:56:13.481849
22	Beef	গরুর মাংস	gorur-mangsho	\N	\N	12	\N	\N	650.00	\N	0	kg	1.00	10	1	100	\N	\N	t	f	f	\N	\N	2026-02-16 23:56:13.481849	2026-02-16 23:56:13.481849
23	Masoor Dal	মসুর ডাল	mosur-dal	\N	\N	13	\N	\N	90.00	\N	0	kg	1.00	50	1	100	\N	\N	t	f	f	\N	\N	2026-02-16 23:56:13.481849	2026-02-16 23:56:13.481849
24	Mung Dal	মুগ ডাল	mug-dal	\N	\N	13	\N	\N	100.00	\N	0	kg	1.00	45	1	100	\N	\N	t	f	f	\N	\N	2026-02-16 23:56:13.481849	2026-02-16 23:56:13.481849
25	Milk	দুধ	dudh	\N	\N	6	\N	\N	70.00	\N	0	liter	1.00	30	1	100	\N	\N	t	f	f	\N	\N	2026-02-16 23:56:13.481849	2026-02-16 23:56:13.481849
26	Egg	ডিম	dim	\N	\N	6	\N	\N	12.00	\N	0	piece	1.00	200	1	100	\N	\N	t	f	f	\N	\N	2026-02-16 23:56:13.481849	2026-02-16 23:56:13.481849
27	Turmeric	হলুদ	holud	\N	\N	7	\N	\N	40.00	\N	0	kg	1.00	60	1	100	\N	\N	t	f	f	\N	\N	2026-02-16 23:56:13.481849	2026-02-16 23:56:13.481849
28	Cumin	জিরা	jira	\N	\N	7	\N	\N	120.00	\N	0	kg	1.00	30	1	100	\N	\N	t	f	f	\N	\N	2026-02-16 23:56:13.481849	2026-02-16 23:56:13.481849
2	Potato	আলু	potato	\N	\N	2	\N	\N	30.00	\N	0	kg	1.00	98	1	100	\N	\N	t	f	f	\N	\N	2026-02-15 19:48:21.778607	2026-02-17 13:19:12.754237
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, phone, email, password_hash, full_name, profile_picture, role, is_verified, is_active, email_verified, phone_verified, last_login, created_at, updated_at) FROM stdin;
2	+8801516525115	emabirahamed@gmail.com	\N	Abir	\N	admin	t	t	f	t	2026-02-17 00:34:26.76052	2026-02-16 03:46:18.644894	2026-02-17 00:36:51.104022
1	+8801712345678	\N	\N	\N	\N	customer	t	t	f	t	\N	2026-02-16 03:42:53.364922	2026-02-17 00:47:31.918907
3	+8800151652511	\N	\N	\N	\N	customer	t	t	f	t	\N	2026-02-17 01:18:48.74225	2026-02-17 01:18:48.74225
\.


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.categories_id_seq', 13, true);


--
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.products_id_seq', 28, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 3, true);


--
-- PostgreSQL database dump complete
--

\unrestrict aexupRWvh0Co1Kniwsga7puVhKzO6cKvKpcBbiWlvgKkepN4QDn7cnSolfBY77x

