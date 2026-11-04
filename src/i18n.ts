export type Language = 'ku' | 'ar' | 'en';

export interface Translations {
  // Navigation
  nav_home: string;
  nav_programming: string;
  nav_posts: string;
  nav_electronics: string;
  theme_dark: string;
  theme_light: string;

  // Hero
  hero_badge: string;
  hero_title_prefix: string;
  hero_title_highlight: string;
  hero_desc: string;
  hero_btn_services: string;
  hero_btn_contact: string;

  // Services
  services_title: string;
  services_desc: string;
  service_web_title: string;
  service_web_desc: string;
  service_design_title: string;
  service_design_desc: string;
  service_auto_title: string;
  service_auto_desc: string;

  // About
  about_title: string;
  about_desc: string;
  about_stat_1_val: string;
  about_stat_1_lbl: string;
  about_stat_2_val: string;
  about_stat_2_lbl: string;
  about_stat_3_val: string;
  about_stat_3_lbl: string;

  // Posts Feed
  posts_feed_title: string;
  posts_feed_desc: string;
  posts_empty: string;
  read_more: string;
  read_less: string;
  code_snippet: string;
  copy_code: string;
  copied: string;

  // Contact
  contact_title: string;
  contact_desc: string;
  contact_btn_telegram: string;
  contact_btn_instagram: string;
  contact_btn_snapchat: string;
  contact_btn_tiktok: string;

  // Footer
  stats_unique: string;
  stats_today: string;
  stats_opens: string;
  copyright: string;

  // Programming Section
  prog_title: string;
  prog_desc: string;
  prog_tab_posts: string;
  prog_tab_html: string;
  prog_tab_python: string;
  prog_tab_encrypt: string;
  back_to_home: string;

  // Admin Modal
  admin_modal_title: string;
  admin_modal_subtitle: string;
  admin_email_label: string;
  admin_pw_label: string;
  admin_btn_login: string;
  admin_forgot_pw: string;
  admin_lockout_msg: string;
  admin_email_invalid: string;
  admin_pw_wrong: string;
  admin_attempts_left: string;
}

export const translations: Record<Language, Translations> = {
  ku: {
    nav_home: 'سەرەکی',
    nav_programming: 'بەرنامەسازی',
    nav_posts: 'پۆستەکان',
    nav_electronics: 'ئەلیکترۆن',
    theme_dark: 'تاریک',
    theme_light: 'ڕووناک',

    hero_badge: 'داهێنان لە تەکنەلۆژیا و دیزاین',
    hero_title_prefix: 'خزمەتگوزارییە پێشکەوتووەکانی',
    hero_title_highlight: 'ئەیوبی بۆ بازرگانی و تەکنەلۆژیا',
    hero_desc: 'دروستکردنی وێبسایت و ئەپی مۆبایل، دیزاینی گرافیک و ڤیدیۆ، ئۆتۆمەیشن و سیستەمە دەستکردەکان بە بەرزترین کوالێتی و ستاندارد.',
    hero_btn_services: 'خزمەتگوزارییەکانمان',
    hero_btn_contact: 'پەیوەندیکردن',

    services_title: 'خزمەتگوزارییە سەرەکییەکان',
    services_desc: 'چارەسەری تەکنەلۆژی و بازرگانی گشتگیر بۆ گەشەپێدانی پڕۆژەکەت.',
    service_web_title: 'پەرەپێدانی وێبسایت و ئەپڵیکەیشن',
    service_web_desc: 'دروستکردنی وێبسایتی خێرا، ئەپی مۆبایل، و سیستەمی بەڕێوەبردن بە نوێترین تەکنەلۆژیا.',
    service_design_title: 'دیزاینی بینراو و براندینگ',
    service_design_desc: 'دروستکردنی لۆگۆ، مۆشن گرافیک، مۆنتاژی ڤیدیۆ و کەرەستەی ڕیکلامی سەرنجڕاکێش.',
    service_auto_title: 'ئۆتۆمەیشن و هۆشمەندی دەستکرد',
    service_auto_desc: 'ئۆتۆماتیککردنی کارە دووبارەکان، تێکەڵکردنی ژیری دەستکرد و سیستەمی پاراستن.',

    about_title: 'دەربارەی ئێمە',
    about_desc: 'پلاتفۆرمی فەرمی ئەیوبی لە ساڵی ٢٠٢٦ بە ئامانجی پێشکەشکردنی چارەسەری تەکنەلۆژی و بازرگانی بەرز دروستکراوە.',
    about_stat_1_val: '+١٠٠',
    about_stat_1_lbl: 'پڕۆژەی تەواوکراو',
    about_stat_2_val: '٪٩٩',
    about_stat_2_lbl: 'ڕەزامەندی کڕیاران',
    about_stat_3_val: '٢٤/٧',
    about_stat_3_lbl: 'پشتیوانی بەردەوام',

    posts_feed_title: 'دوایین پۆست و ڕاگەیەندراوەکان',
    posts_feed_desc: 'ئاگاداری دوایین پڕۆژە، ئۆفەر و بابەتە تەکنەلۆژییەکان بە.',
    posts_empty: 'هێشتا هیچ پۆستێک لەم بەشەدا بڵاونەکراوەتەوە.',
    read_more: 'زیاتر ببینە',
    read_less: 'کەمتر',
    code_snippet: 'نموونە کۆد',
    copy_code: 'کۆپیکردن',
    copied: 'کۆپیکرا',

    contact_title: 'پەیوەندیمان پێوە بکە',
    contact_desc: 'بۆ هەر داواکارییەک، پرسیارێک یان دەستپێکردنی پڕۆژە دەتوانیت پەیوەندیمان پێوە بکەیت.',
    contact_btn_telegram: 'تیلیگرام',
    contact_btn_instagram: 'ئینستاگرام',
    contact_btn_snapchat: 'سناپچات',
    contact_btn_tiktok: 'تیکتۆک',

    stats_unique: 'سەردانیکەری جیاواز',
    stats_today: 'سەردانیکەری ئەمڕۆ',
    stats_opens: 'جار کراوەتەوە',
    copyright: 'مافی پارێزراوە',

    prog_title: 'بەشی بەرنامەسازی',
    prog_desc: 'فێرکاری، نموونە کۆدەکان، ڕەنکردنی کۆد و ستۆدیۆی ئینکریپت.',
    prog_tab_posts: 'پۆستەکانی بەرنامەسازی',
    prog_tab_html: 'ڕەنکردنی HTML / JS',
    prog_tab_python: 'ڕەنکردنی پایتۆن',
    prog_tab_encrypt: 'ئینکریپت و پاراستنی کۆد',
    back_to_home: 'گەڕانەوە بۆ سەرەکی',

    admin_modal_title: 'چوونەژوورەوەی ئەدمین',
    admin_modal_subtitle: 'تایبەت بە بەڕێوەبەری فەرمی پلاتفۆرم',
    admin_email_label: 'ئیمەیڵی بەڕێوەبەر:',
    admin_pw_label: 'وشەی نهێنی یان Master PIN:',
    admin_btn_login: 'چوونەژوورەوە',
    admin_forgot_pw: 'وشەی نهێنیت لەبیرچووە؟',
    admin_lockout_msg: '٣ جار هەوڵی هەڵەت دا! ٤٥ چرکە چاوەڕێ بکە.',
    admin_email_invalid: 'ئەم ئیمەیڵە ڕێگەپێدراو نییە یان هەڵەیە',
    admin_pw_wrong: 'وشەی نهێنی هەڵەیە',
    admin_attempts_left: 'هەوڵی تر ماوە',
  },

  ar: {
    nav_home: 'الرئيسية',
    nav_programming: 'البرمجة',
    nav_posts: 'المنشورات',
    nav_electronics: 'الإلكترونيات',
    theme_dark: 'داكن',
    theme_light: 'فاتح',

    hero_badge: 'الابتكار في التكنولوجيا والتصميم',
    hero_title_prefix: 'الخدمات المتقدمة من',
    hero_title_highlight: 'أيوبي للتجارة والتكنولوجيا',
    hero_desc: 'تطوير المواقع وتطبيقات الهاتف، التصميم الجرافيكي والمونتاج، الأتمتة وحلول الذكاء الاصطناعي بأعلى معايير الجودة.',
    hero_btn_services: 'خدماتنا',
    hero_btn_contact: 'اتصل بنا',

    services_title: 'خدماتنا الرئيسية',
    services_desc: 'حلول تكنولوجية وتجارية شاملة لتطوير وتوسيع أعمالك.',
    service_web_title: 'تطوير المواقع والتطبيقات',
    service_web_desc: 'بناء مواقع سريعة وتطبيقات هواتف ذكية بأحدث التقنيات الحديثة.',
    service_design_title: 'التصميم البصري والهوية',
    service_design_desc: 'تصميم الشعارات، الموشن جرافيك، تحرير الفيديو والمواد الإعلانية الجذابة.',
    service_auto_title: 'الأتمتة والذكاء الاصطناعي',
    service_auto_desc: 'أتمتة المهام اليومية، دمج الذكاء الاصطناعي وحماية الأنظمة الرقمية.',

    about_title: 'من نحن',
    about_desc: 'منصة أيوبي الرسمية تأسست بهدف تقديم حلول برمجية وتجارية متطورة تلبي تطلعات المستقبل.',
    about_stat_1_val: '+١٠٠',
    about_stat_1_lbl: 'مشروع مكتمل',
    about_stat_2_val: '٩٩٪',
    about_stat_2_lbl: 'رضا العملاء',
    about_stat_3_val: '٢٤/٧',
    about_stat_3_lbl: 'دعم مستمر',

    posts_feed_title: 'أحدث المنشورات والإعلانات',
    posts_feed_desc: 'ابق على اطلاع بآخر المشاريع والعروض التقنية.',
    posts_empty: 'لم يتم نشر أي مقالات في هذا القسم حتى الآن.',
    read_more: 'قراءة المزيد',
    read_less: 'عرض أقل',
    code_snippet: 'كود برمجي',
    copy_code: 'نسخ الكود',
    copied: 'تم النسخ',

    contact_title: 'تواصل معنا',
    contact_desc: 'لأي استفسار أو لبدء مشروع جديد، يمكنك التواصل معنا عبر المنصات التالية.',
    contact_btn_telegram: 'تيليجرام',
    contact_btn_instagram: 'إنستغرام',
    contact_btn_snapchat: 'سناب شات',
    contact_btn_tiktok: 'تيك توك',

    stats_unique: 'زائر فريد',
    stats_today: 'زوار اليوم',
    stats_opens: 'مرات الفتح',
    copyright: 'جميع الحقوق محفوظة',

    prog_title: 'قسم البرمجة',
    prog_desc: 'دروس، أكواد برمجية، مشغلات الأكواد واستوديو التشفير والحماية.',
    prog_tab_posts: 'منشورات البرمجة',
    prog_tab_html: 'تشغيل HTML / JS',
    prog_tab_python: 'تشغيل Python',
    prog_tab_encrypt: 'تشفير وحماية الأكواد',
    back_to_home: 'العودة للرئيسية',

    admin_modal_title: 'تسجيل دخول الإدارة',
    admin_modal_subtitle: 'مخصص للمسؤول المعتمد للمنصة',
    admin_email_label: 'البريد الإلكتروني للمسؤول:',
    admin_pw_label: 'كلمة المرور أو Master PIN:',
    admin_btn_login: 'دخول',
    admin_forgot_pw: 'هل نسيت كلمة المرور؟',
    admin_lockout_msg: 'محاولات غير صحيحة متعددة! يرجى الانتظار ٤٥ ثانية.',
    admin_email_invalid: 'هذا البريد غير مصرح به أو غير صحيح',
    admin_pw_wrong: 'كلمة المرور غير صحيحة',
    admin_attempts_left: 'محاولات متبقية',
  },

  en: {
    nav_home: 'Home',
    nav_programming: 'Programming',
    nav_posts: 'Posts',
    nav_electronics: 'Electronics',
    theme_dark: 'Dark',
    theme_light: 'Light',

    hero_badge: 'Innovation in Technology & Design',
    hero_title_prefix: 'Advanced Services by',
    hero_title_highlight: 'Ayoubi Technology & Commerce',
    hero_desc: 'Web & mobile app development, visual design, video production, automation, and AI systems built to the highest quality standards.',
    hero_btn_services: 'Our Services',
    hero_btn_contact: 'Contact Us',

    services_title: 'Core Services',
    services_desc: 'Comprehensive technology and business solutions to elevate your projects.',
    service_web_title: 'Web & Mobile App Development',
    service_web_desc: 'High-performance websites, mobile apps, and administrative platforms built with modern technologies.',
    service_design_title: 'Visual Design & Branding',
    service_design_desc: 'Logo design, motion graphics, video editing, and high-impact digital advertising assets.',
    service_auto_title: 'Automation & Artificial Intelligence',
    service_auto_desc: 'Workflow automation, AI system integrations, and digital security solutions.',

    about_title: 'About Us',
    about_desc: 'Ayoubi official platform is committed to delivering world-class digital, software, and commercial solutions.',
    about_stat_1_val: '100+',
    about_stat_1_lbl: 'Projects Completed',
    about_stat_2_val: '99%',
    about_stat_2_lbl: 'Client Satisfaction',
    about_stat_3_val: '24/7',
    about_stat_3_lbl: 'Continuous Support',

    posts_feed_title: 'Latest Posts & Announcements',
    posts_feed_desc: 'Stay informed with our latest news, projects, and tech insights.',
    posts_empty: 'No posts published in this section yet.',
    read_more: 'Read more',
    read_less: 'Show less',
    code_snippet: 'Code Snippet',
    copy_code: 'Copy Code',
    copied: 'Copied',

    contact_title: 'Get in Touch',
    contact_desc: 'For inquiries, consultations, or starting your next project, reach out anytime.',
    contact_btn_telegram: 'Telegram',
    contact_btn_instagram: 'Instagram',
    contact_btn_snapchat: 'Snapchat',
    contact_btn_tiktok: 'TikTok',

    stats_unique: 'Unique Visitors',
    stats_today: "Today's Visitors",
    stats_opens: 'Total Views',
    copyright: 'All Rights Reserved',

    prog_title: 'Programming Lab',
    prog_desc: 'Tutorials, code snippets, interactive runners, and code encryption studio.',
    prog_tab_posts: 'Programming Posts',
    prog_tab_html: 'Run HTML / JS',
    prog_tab_python: 'Run Python',
    prog_tab_encrypt: 'Code Encryption',
    back_to_home: 'Back to Home',

    admin_modal_title: 'Admin Sign In',
    admin_modal_subtitle: 'Restricted to authorized system administrators',
    admin_email_label: 'Administrator Email:',
    admin_pw_label: 'Password or Master PIN:',
    admin_btn_login: 'Sign In',
    admin_forgot_pw: 'Forgot Password?',
    admin_lockout_msg: 'Too many failed attempts! Please wait 45 seconds.',
    admin_email_invalid: 'This email is not authorized or incorrect',
    admin_pw_wrong: 'Incorrect password or PIN',
    admin_attempts_left: 'attempts left',
  },
};
