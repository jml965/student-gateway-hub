export interface VisaInfo {
  code: string;
  nameAr: string;
  nameEn: string;
  visaRequired: boolean;
  visaType: string;
  processingDays: string;
  feesUSD: string;
  documentsAr: string[];
  documentsEn: string[];
  notesAr: string;
  notesEn: string;
  officialLink: string;
}

export const VISA_DATA: VisaInfo[] = [
  {
    code: "TR", nameAr: "تركيا", nameEn: "Turkey",
    visaRequired: false, visaType: "student",
    processingDays: "5-15", feesUSD: "50-80",
    documentsAr: ["جواز سفر ساري", "خطاب قبول من الجامعة", "إثبات الملاءة المالية", "صور شخصية", "تأمين صحي"],
    documentsEn: ["Valid passport", "University acceptance letter", "Proof of financial means", "Passport photos", "Health insurance"],
    notesAr: "معظم الجنسيات العربية تحتاج تأشيرة دراسة، تُقدَّم في السفارة التركية. إقامة الطالب تُجدَّد سنوياً.",
    notesEn: "Most Arab nationalities require a student visa applied at the Turkish embassy. Student residence renewed annually.",
    officialLink: "https://www.mfa.gov.tr/default.en.mfa"
  },
  {
    code: "DE", nameAr: "ألمانيا", nameEn: "Germany",
    visaRequired: true, visaType: "student",
    processingDays: "30-90", feesUSD: "75",
    documentsAr: ["جواز سفر ساري", "قبول جامعي", "إثبات مالي (10,332 يورو/سنة)", "شهادات دراسية معتمدة", "إجادة اللغة (ألمانية/إنجليزية)", "تأمين صحي", "صور شخصية"],
    documentsEn: ["Valid passport", "University admission", "Financial proof (€10,332/year)", "Certified academic transcripts", "Language proficiency (German/English)", "Health insurance", "Photos"],
    notesAr: "يجب فتح حساب بنكي محجوز (Sperrkonto) بـ 10,332 يورو قبل التقديم. التأشيرة تصدر لمدة 90 يوم وتُستبدل بإقامة الطالب.",
    notesEn: "Must open a blocked bank account (Sperrkonto) with €10,332 before applying. Visa issued for 90 days, replaced by student residence permit.",
    officialLink: "https://www.auswaertiges-amt.de/en"
  },
  {
    code: "GB", nameAr: "المملكة المتحدة", nameEn: "United Kingdom",
    visaRequired: true, visaType: "student",
    processingDays: "15-60", feesUSD: "490",
    documentsAr: ["جواز سفر ساري", "CAS (رقم تأكيد القبول)", "إثبات مالي", "شهادات دراسية", "إجادة الإنجليزية (IELTS/TOEFL)", "صور بيومترية"],
    documentsEn: ["Valid passport", "CAS (Confirmation of Acceptance for Studies)", "Financial proof", "Academic certificates", "English proficiency (IELTS/TOEFL)", "Biometric photos"],
    notesAr: "تأشيرة الطالب Student Visa، تُطلب بيانات بيومترية، ورسوم 490 جنيه إسترليني. مدة التأشيرة حتى نهاية الدراسة + شهرين.",
    notesEn: "Student Visa requires biometric data, £490 fee. Valid until end of course + 2 months. IELTS typically 6.0+ required.",
    officialLink: "https://www.gov.uk/student-visa"
  },
  {
    code: "US", nameAr: "الولايات المتحدة", nameEn: "United States",
    visaRequired: true, visaType: "F-1 Student",
    processingDays: "30-120", feesUSD: "350",
    documentsAr: ["جواز سفر ساري", "نموذج DS-160", "دفع رسوم SEVIS (350$)", "قبول جامعي وI-20", "إثبات مالي", "إثبات الارتباط بالبلد الأصلي", "مقابلة في السفارة"],
    documentsEn: ["Valid passport", "DS-160 form", "SEVIS fee ($350)", "Admission + I-20 form", "Financial proof", "Ties to home country", "Embassy interview"],
    notesAr: "تأشيرة F-1، لا تسمح بالعمل أكثر من 20 ساعة أسبوعياً. نسبة الرفض مرتفعة — يجب إثبات نية العودة.",
    notesEn: "F-1 visa, allows up to 20 hrs/week work on campus. High refusal rate — must prove intent to return home.",
    officialLink: "https://travel.state.gov/content/travel/en/us-visas/study.html"
  },
  {
    code: "CA", nameAr: "كندا", nameEen: "Canada",
    visaRequired: true, visaType: "Study Permit",
    processingDays: "60-180", feesUSD: "150",
    documentsAr: ["جواز سفر ساري", "قبول من مؤسسة معتمدة DLI", "إثبات مالي", "شهادات دراسية", "فحص طبي (إن لزم)", "صور بيومترية"],
    documentsEn: ["Valid passport", "Acceptance from DLI institution", "Financial proof", "Academic records", "Medical exam (if required)", "Biometric photos"],
    notesAr: "تصريح الدراسة Study Permit، يسمح بالعمل 24 ساعة أسبوعياً أثناء الدراسة. يمكن التقديم أونلاين.",
    notesEn: "Study Permit allows 24 hrs/week work during studies. Apply online via IRCC portal. Processing varies by country.",
    officialLink: "https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada.html"
  },
  {
    code: "AU", nameAr: "أستراليا", nameEen: "Australia",
    visaRequired: true, visaType: "Student Visa (500)",
    processingDays: "30-60", feesUSD: "650",
    documentsAr: ["جواز سفر ساري", "قبول جامعي CoE", "إثبات مالي", "تأمين صحي OSHC", "إجادة الإنجليزية (IELTS 6.0+)", "فحص طبي"],
    documentsEn: ["Valid passport", "University CoE", "Financial proof", "OSHC health insurance", "English proficiency (IELTS 6.0+)", "Medical exam"],
    notesAr: "تأشيرة الطالب (Subclass 500)، رسوم AUD 650. يسمح بالعمل 48 ساعة أسبوعياً. التأمين OSHC إلزامي.",
    notesEn: "Student Visa (500), AUD 650 fee. Allows 48 hrs/week work. OSHC health insurance mandatory.",
    officialLink: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/student-500"
  },
  {
    code: "FR", nameAr: "فرنسا", nameEen: "France",
    visaRequired: true, visaType: "student",
    processingDays: "15-45", feesUSD: "99",
    documentsAr: ["جواز سفر ساري", "قبول جامعي أو VLS-TS", "إثبات مالي (700 يورو/شهر)", "تأمين صحي", "وثيقة سكن", "صور شخصية"],
    documentsEn: ["Valid passport", "University admission or VLS-TS", "Financial proof (€700/month)", "Health insurance", "Accommodation proof", "Photos"],
    notesAr: "التأشيرة الطويلة للطالب VLS-TS، يجب التسجيل في الاتحاد الفرنسي للطلاب خلال 3 أشهر من الوصول.",
    notesEn: "Long-stay student visa VLS-TS. Must register with French student union (OFII) within 3 months of arrival.",
    officialLink: "https://france-visas.gouv.fr"
  },
  {
    code: "ES", nameAr: "إسبانيا", nameEen: "Spain",
    visaRequired: true, visaType: "student",
    processingDays: "30-60", feesUSD: "80",
    documentsAr: ["جواز سفر ساري", "قبول جامعي", "إثبات مالي (600 يورو/شهر)", "تأمين صحي شامل", "وثيقة سكن", "شهادات مترجمة ومصادق عليها"],
    documentsEn: ["Valid passport", "University admission", "Financial proof (€600/month)", "Full health insurance", "Accommodation proof", "Translated and certified certificates"],
    notesAr: "تأشيرة الدراسة للطلاب فوق 6 أشهر، رسوم 80 يورو. البرامج باللغة الإنجليزية متوفرة بشكل متزايد.",
    notesEn: "Study visa for courses over 6 months, €80 fee. English-taught programs increasingly available.",
    officialLink: "https://www.exteriores.gob.es"
  },
  {
    code: "IT", nameAr: "إيطاليا", nameEen: "Italy",
    visaRequired: true, visaType: "student",
    processingDays: "30-90", feesUSD: "116",
    documentsAr: ["جواز سفر ساري", "قبول جامعي", "إثبات مالي (5,800 يورو/سنة)", "تأمين صحي", "وثيقة سكن", "صور شخصية"],
    documentsEn: ["Valid passport", "University admission", "Financial proof (€5,800/year)", "Health insurance", "Accommodation proof", "Photos"],
    notesAr: "تأشيرة الدراسة Type D، رسوم 116 يورو. بعد الوصول يجب طلب إقامة الطالب (Permesso di Soggiorno) خلال 8 أيام.",
    notesEn: "Type D study visa, €116 fee. After arrival, must apply for Permesso di Soggiorno (residence permit) within 8 days.",
    officialLink: "https://vistoperitalia.esteri.it"
  },
  {
    code: "NL", nameAr: "هولندا", nameEen: "Netherlands",
    visaRequired: true, visaType: "student",
    processingDays: "30-60", feesUSD: "192",
    documentsAr: ["جواز سفر ساري", "خطاب قبول جامعي", "إثبات مالي (1,400+ يورو/شهر)", "تأمين صحي", "تغطية سكن"],
    documentsEn: ["Valid passport", "University admission letter", "Financial proof (€1,400+/month)", "Health insurance", "Housing coverage"],
    notesAr: "الجامعة عادةً تتقدم بطلب التأشيرة نيابة عنك (MVV). إجادة الإنجليزية مطلوبة لمعظم البرامج.",
    notesEn: "University usually applies for the MVV visa on your behalf. English proficiency required for most programs.",
    officialLink: "https://ind.nl/en/residence-permits/student"
  },
  {
    code: "SE", nameAr: "السويد", nameEen: "Sweden",
    visaRequired: true, visaType: "student",
    processingDays: "30-90", feesUSD: "100",
    documentsAr: ["جواز سفر ساري", "قبول جامعي", "إثبات مالي (8,650 SEK/شهر)", "تأمين صحي", "وثيقة سكن"],
    documentsEn: ["Valid passport", "University admission", "Financial proof (SEK 8,650/month)", "Health insurance", "Accommodation proof"],
    notesAr: "تصريح الإقامة للدراسة، يُطلب إلكترونياً. معظم البرامج باللغة الإنجليزية. الرسوم مجانية للمواطنين الأوروبيين.",
    notesEn: "Residence permit for studies, applied online. Most programs in English. EU citizens study free.",
    officialLink: "https://www.migrationsverket.se/en/Applying-for-a-permit/Studies.html"
  },
  {
    code: "CZ", nameAr: "جمهورية التشيك", nameEen: "Czech Republic",
    visaRequired: true, visaType: "student",
    processingDays: "30-60", feesUSD: "35",
    documentsAr: ["جواز سفر ساري", "قبول جامعي", "إثبات مالي (11,000 CZK/شهر)", "تأمين صحي", "وثيقة سكن", "فحص طبي"],
    documentsEn: ["Valid passport", "University admission", "Financial proof (CZK 11,000/month)", "Health insurance", "Accommodation proof", "Medical certificate"],
    notesAr: "تأشيرة الدراسة طويلة المدى، رسوم 35 يورو. بوهيميا وبراغ الأكثر استقطاباً للطلاب الدوليين.",
    notesEn: "Long-term study visa, €35 fee. Bohemia and Prague most popular for international students.",
    officialLink: "https://www.mzv.cz/jnp/en/information_for_aliens"
  },
  {
    code: "HU", nameAr: "هنغاريا", nameEen: "Hungary",
    visaRequired: true, visaType: "student",
    processingDays: "30-60", feesUSD: "50",
    documentsAr: ["جواز سفر ساري", "قبول جامعي أو منحة Stipendium Hungaricum", "إثبات مالي", "تأمين صحي", "وثيقة سكن", "فحص طبي"],
    documentsEn: ["Valid passport", "University admission or Stipendium Hungaricum scholarship", "Financial proof", "Health insurance", "Accommodation", "Medical exam"],
    notesAr: "منحة Stipendium Hungaricum الحكومية متاحة لكثير من الدول العربية. التأشيرة تُستبدل بإقامة طالب بعد الوصول.",
    notesEn: "Stipendium Hungaricum government scholarship available to many Arab countries. Visa replaced by student residence after arrival.",
    officialLink: "https://www.stipendiumhungaricum.hu"
  },
  {
    code: "PL", nameAr: "بولندا", nameEen: "Poland",
    visaRequired: true, visaType: "student",
    processingDays: "15-45", feesUSD: "35",
    documentsAr: ["جواز سفر ساري", "قبول جامعي", "إثبات مالي (701 PLN/شهر على الأقل)", "تأمين صحي", "وثيقة سكن"],
    documentsEn: ["Valid passport", "University admission", "Financial proof (min 701 PLN/month)", "Health insurance", "Accommodation proof"],
    notesAr: "رسوم تأشيرة منخفضة (35 يورو). تكاليف المعيشة من أقل في أوروبا. جامعات حكومية ذات جودة عالية.",
    notesEn: "Low visa fee (€35). Living costs among the lowest in Europe. Quality state universities available.",
    officialLink: "https://www.gov.pl/web/dyplomacja"
  },
  {
    code: "RO", nameAr: "رومانيا", nameEen: "Romania",
    visaRequired: true, visaType: "student",
    processingDays: "30-60", feesUSD: "120",
    documentsAr: ["جواز سفر ساري", "قبول جامعي", "إثبات مالي", "تأمين صحي", "وثيقة سكن", "شهادات مترجمة ومصادق عليها"],
    documentsEn: ["Valid passport", "University admission", "Financial proof", "Health insurance", "Accommodation", "Certified translated certificates"],
    notesAr: "رومانيا وجهة شعبية لدراسة الطب والصيدلة بتكاليف منخفضة مقارنة بأوروبا الغربية.",
    notesEn: "Romania popular for medicine and pharmacy with lower costs than Western Europe.",
    officialLink: "https://mae.ro"
  },
  {
    code: "MY", nameAr: "ماليزيا", nameEen: "Malaysia",
    visaRequired: true, visaType: "student pass",
    processingDays: "14-30", feesUSD: "60",
    documentsAr: ["جواز سفر ساري", "قبول جامعي", "كشف حساب بنكي", "فحص طبي", "صور شخصية", "شهادات دراسية"],
    documentsEn: ["Valid passport", "University admission", "Bank statement", "Medical exam", "Photos", "Academic certificates"],
    notesAr: "تصريح الطالب يُصدر عبر نظام eVISA. رسوم معيشية منخفضة وجودة تعليم جيدة. كوالالمبور وجهة شعبية جداً.",
    notesEn: "Student Pass issued via eVISA system. Low living costs, good education quality. Kuala Lumpur very popular.",
    officialLink: "https://educationmalaysia.gov.my"
  },
  {
    code: "CN", nameAr: "الصين", nameEen: "China",
    visaRequired: true, visaType: "X1/X2 Student",
    processingDays: "15-30", feesUSD: "140",
    documentsAr: ["جواز سفر ساري", "قبول جامعي (JW201/JW202)", "فحص طبي معتمد", "شهادة خلو سوابق", "صور شخصية", "كشف حساب بنكي"],
    documentsEn: ["Valid passport", "University admission (JW201/JW202)", "Certified medical exam", "Police clearance certificate", "Photos", "Bank statement"],
    notesAr: "التأشيرة X1 لأكثر من 180 يوم وX2 لأقل. المنح الصينية (CSC) متاحة بكثرة. اللغة الصينية مطلوبة لمعظم البرامج.",
    notesEn: "X1 visa for 180+ days, X2 for less. CSC scholarships widely available. Chinese language required for most programs.",
    officialLink: "https://www.csc.edu.cn/studyinchina"
  },
  {
    code: "JP", nameAr: "اليابان", nameEen: "Japan",
    visaRequired: true, visaType: "student (留学)",
    processingDays: "30-60", feesUSD: "0",
    documentsAr: ["جواز سفر ساري", "COE (شهادة أهلية) من الهجرة اليابانية", "قبول جامعي", "إثبات مالي", "وثيقة سكن"],
    documentsEn: ["Valid passport", "COE (Certificate of Eligibility) from Japanese immigration", "University admission", "Financial proof", "Accommodation"],
    notesAr: "تأشيرة الطالب مجانية. يُصدر COE من الجامعة. منح MEXT الحكومية متاحة. اليابانية مطلوبة في كثير من البرامج.",
    notesEn: "Student visa is free. COE issued by university. MEXT government scholarships available. Japanese required for many programs.",
    officialLink: "https://www.jasso.or.jp/en"
  },
  {
    code: "KR", nameAr: "كوريا الجنوبية", nameEen: "South Korea",
    visaRequired: true, visaType: "D-2 Student",
    processingDays: "14-30", feesUSD: "60",
    documentsAr: ["جواز سفر ساري", "قبول جامعي", "إثبات مالي (10,000,000 KRW)", "صور شخصية", "شهادات دراسية"],
    documentsEn: ["Valid passport", "University admission", "Financial proof (KRW 10,000,000)", "Photos", "Academic certificates"],
    notesAr: "منح KGSP الحكومية الكورية متاحة. اللغة الكورية مفيدة جداً. تكلفة المعيشة معقولة نسبياً.",
    notesEn: "KGSP government scholarships available. Korean language very helpful. Reasonable living costs.",
    officialLink: "https://www.studyinkorea.go.kr"
  },
  {
    code: "RU", nameAr: "روسيا", nameEen: "Russia",
    visaRequired: true, visaType: "student",
    processingDays: "15-30", feesUSD: "35",
    documentsAr: ["جواز سفر ساري", "دعوة من الجامعة الروسية", "فحص طبي (HIV وأمراض أخرى)", "شهادات مترجمة معتمدة", "صور شخصية", "وثيقة تأمين صحي"],
    documentsEn: ["Valid passport", "Invitation from Russian university", "Medical exam (HIV and others)", "Certified translated certificates", "Photos", "Health insurance"],
    notesAr: "الدعوة تُصدر عبر وزارة التعليم الروسية. منح الحكومة الروسية (Rossotrudnichestvo) متاحة. التدريس باللغة الروسية في الغالب.",
    notesEn: "Invitation issued through Russian Ministry of Education. Russian government scholarships (Rossotrudnichestvo) available. Mostly Russian-taught.",
    officialLink: "https://education-in-russia.com"
  },
  {
    code: "UA", nameAr: "أوكرانيا", nameEen: "Ukraine",
    visaRequired: true, visaType: "student",
    processingDays: "15-30", feesUSD: "65",
    documentsAr: ["جواز سفر ساري", "قبول جامعي", "كشف حساب بنكي", "فحص طبي", "شهادة خلو سوابق", "صور شخصية"],
    documentsEn: ["Valid passport", "University admission", "Bank statement", "Medical exam", "Police clearance", "Photos"],
    notesAr: "وجهة شعبية للطلاب العرب لدراسة الطب. تكاليف منخفضة. الوضع الأمني يجب التحقق منه بانتظام.",
    notesEn: "Popular destination for Arab medical students. Low costs. Security situation must be checked regularly.",
    officialLink: "https://studyinukraine.gov.ua"
  },
  {
    code: "JO", nameAr: "الأردن", nameEen: "Jordan",
    visaRequired: false, visaType: "student",
    processingDays: "7-14", feesUSD: "20",
    documentsAr: ["جواز سفر ساري", "قبول جامعي", "إثبات مالي", "شهادات دراسية", "فحص طبي"],
    documentsEn: ["Valid passport", "University admission", "Financial proof", "Academic records", "Medical exam"],
    notesAr: "معظم الجنسيات العربية لا تحتاج تأشيرة مسبقة للأردن. الإقامة الطلابية تُستخرج بعد الوصول.",
    notesEn: "Most Arab nationalities don't need prior visa for Jordan. Student residence obtained after arrival.",
    officialLink: "https://www.mfa.gov.jo"
  },
  {
    code: "EG", nameAr: "مصر", nameEen: "Egypt",
    visaRequired: false, visaType: "student",
    processingDays: "7-21", feesUSD: "25",
    documentsAr: ["جواز سفر ساري", "قبول جامعي", "كشف حساب بنكي", "صور شخصية", "شهادات دراسية"],
    documentsEn: ["Valid passport", "University admission", "Bank statement", "Photos", "Academic records"],
    notesAr: "الدول العربية معفاة من التأشيرة عادةً. الإقامة الطلابية تُستخرج من مكتب الجوازات. تكاليف المعيشة منخفضة جداً.",
    notesEn: "Arab countries usually visa-exempt. Student residence obtained from passport office. Very low living costs.",
    officialLink: "https://mohe.gov.eg"
  },
  {
    code: "MA", nameAr: "المغرب", nameEen: "Morocco",
    visaRequired: false, visaType: "student",
    processingDays: "7-21", feesUSD: "30",
    documentsAr: ["جواز سفر ساري", "قبول جامعي أو مدرسة عليا", "إثبات مالي", "وثيقة سكن", "صور شخصية"],
    documentsEn: ["Valid passport", "University or grande école admission", "Financial proof", "Accommodation", "Photos"],
    notesAr: "جنسيات عربية عديدة لا تحتاج تأشيرة. مراكش والرباط وجهات شعبية. برامج الهندسة والطب متميزة.",
    notesEn: "Many Arab nationalities don't need a visa. Marrakech and Rabat popular destinations. Engineering and medicine programs strong.",
    officialLink: "https://www.fmre.ma"
  },
  {
    code: "AE", nameAr: "الإمارات", nameEen: "UAE",
    visaRequired: false, visaType: "student",
    processingDays: "5-14", feesUSD: "100",
    documentsAr: ["جواز سفر ساري", "قبول جامعي", "إثبات مالي", "فحص طبي إلزامي", "تأمين صحي", "صور شخصية"],
    documentsEn: ["Valid passport", "University admission", "Financial proof", "Mandatory medical exam", "Health insurance", "Photos"],
    notesAr: "تصريح الإقامة الطلابية يُصدر من GDRFA. الفحص الطبي إلزامي. تكاليف المعيشة مرتفعة. جامعات دولية ذات جودة عالية.",
    notesEen: "Student residence permit issued by GDRFA. Medical exam mandatory. High living costs. International quality universities.",
    officialLink: "https://www.gdrfad.gov.ae"
  },
  {
    code: "LB", nameAr: "لبنان", nameEen: "Lebanon",
    visaRequired: false, visaType: "student",
    processingDays: "7-21", feesUSD: "17",
    documentsAr: ["جواز سفر ساري", "قبول جامعي", "كشف حساب بنكي", "وثيقة سكن", "صور شخصية"],
    documentsEn: ["Valid passport", "University admission", "Bank statement", "Accommodation", "Photos"],
    notesAr: "الجنسيات العربية معفاة من التأشيرة في الغالب. الوضع الاقتصادي يجب أخذه بعين الاعتبار. الجامعة الأمريكية في بيروت مشهورة عالمياً.",
    notesEen: "Arab nationalities mostly visa-exempt. Economic situation must be considered. AUB is world-renowned.",
    officialLink: "https://www.mehe.gov.lb"
  },
  {
    code: "KZ", nameAr: "كازاخستان", nameEen: "Kazakhstan",
    visaRequired: true, visaType: "student",
    processingDays: "15-30", feesUSD: "40",
    documentsAr: ["جواز سفر ساري", "دعوة من الجامعة", "كشف حساب بنكي", "فحص طبي", "شهادات دراسية", "صور شخصية"],
    documentsEn: ["Valid passport", "University invitation", "Bank statement", "Medical exam", "Academic certificates", "Photos"],
    notesAr: "وجهة متنامية للطلاب العرب. منح حكومية كازاخستانية متاحة. التدريس بالروسية أو الكازاخية أو الإنجليزية.",
    notesEen: "Growing destination for Arab students. Kazakh government scholarships available. Teaching in Russian, Kazakh, or English.",
    officialLink: "https://www.edu.gov.kz"
  },
  {
    code: "BA", nameAr: "البوسنة والهرسك", nameEen: "Bosnia and Herzegovina",
    visaRequired: true, visaType: "student",
    processingDays: "15-30", feesUSD: "25",
    documentsAr: ["جواز سفر ساري", "قبول جامعي", "إثبات مالي", "تأمين صحي", "وثيقة سكن", "شهادات مترجمة"],
    documentsEn: ["Valid passport", "University admission", "Financial proof", "Health insurance", "Accommodation", "Translated certificates"],
    notesAr: "سراييفو وجهة شعبية للطلاب المسلمين. تكاليف منخفضة. برامج الطب والهندسة متاحة باللغة الإنجليزية.",
    notesEen: "Sarajevo popular for Muslim students. Low costs. Medicine and engineering programs available in English.",
    officialLink: "https://www.mvp.gov.ba"
  },
  {
    code: "CY", nameAr: "قبرص", nameEen: "Cyprus",
    visaRequired: true, visaType: "student",
    processingDays: "15-45", feesUSD: "70",
    documentsAr: ["جواز سفر ساري", "قبول جامعي", "إثبات مالي (500 يورو/شهر)", "تأمين صحي", "وثيقة سكن", "صور شخصية"],
    documentsEn: ["Valid passport", "University admission", "Financial proof (€500/month)", "Health insurance", "Accommodation", "Photos"],
    notesAr: "بوابة للدراسة في الاتحاد الأوروبي. معظم البرامج باللغة الإنجليزية. ليماسول ونيقوسيا الأكثر استقطاباً.",
    notesEen: "Gateway to EU study. Most programs in English. Limassol and Nicosia most popular.",
    officialLink: "https://www.mfa.gov.cy"
  },
  {
    code: "BY", nameAr: "بيلاروسيا", nameEen: "Belarus",
    visaRequired: true, visaType: "student",
    processingDays: "15-30", feesUSD: "60",
    documentsAr: ["جواز سفر ساري", "دعوة من الجامعة", "كشف حساب بنكي", "فحص طبي (HIV)", "شهادة خلو سوابق", "صور شخصية"],
    documentsEn: ["Valid passport", "University invitation", "Bank statement", "Medical exam (HIV)", "Police clearance", "Photos"],
    notesAr: "تكاليف دراسة منخفضة جداً. جامعة بيلاروسيا الحكومية مشهورة في الطب. التدريس بالروسية أو الإنجليزية.",
    notesEen: "Very low study costs. Belarusian State University known for medicine. Teaching in Russian or English.",
    officialLink: "https://studyinbelarus.by"
  },
];

export function getVisaInfoText(lang: "ar" | "en"): string {
  return VISA_DATA.map(v => {
    const docs = lang === "ar" ? v.documentsAr.join("، ") : v.documentsEn.join(", ");
    const notes = lang === "ar" ? v.notesAr : v.notesEn;
    const dest = lang === "ar" ? v.nameAr : v.nameEn;
    return `${dest} (${v.code}): معالجة ${v.processingDays} يوم، رسوم ${v.feesUSD}$. الوثائق: ${docs}. ${notes}`;
  }).join("\n");
}
