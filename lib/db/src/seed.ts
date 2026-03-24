import { db, universitiesTable, specializationsTable } from "./index";

const UNIVERSITIES = [
  // Turkey (20)
  { nameAr: "جامعة إسطنبول", nameEn: "Istanbul University", country: "Turkey", city: "Istanbul", website: "https://www.istanbul.edu.tr" },
  { nameAr: "جامعة الشرق الأوسط التقنية", nameEn: "Middle East Technical University", country: "Turkey", city: "Ankara", website: "https://www.metu.edu.tr" },
  { nameAr: "جامعة بوغازيتشي", nameEn: "Boğaziçi University", country: "Turkey", city: "Istanbul", website: "https://www.boun.edu.tr" },
  { nameAr: "جامعة أنقرة", nameEn: "Ankara University", country: "Turkey", city: "Ankara", website: "https://www.ankara.edu.tr" },
  { nameAr: "جامعة هاجيتيبي", nameEn: "Hacettepe University", country: "Turkey", city: "Ankara", website: "https://www.hacettepe.edu.tr" },
  { nameAr: "جامعة إيغي", nameEn: "Ege University", country: "Turkey", city: "Izmir", website: "https://www.ege.edu.tr" },
  { nameAr: "جامعة مرمرة", nameEn: "Marmara University", country: "Turkey", city: "Istanbul", website: "https://www.marmara.edu.tr" },
  { nameAr: "جامعة بيلكنت", nameEn: "Bilkent University", country: "Turkey", city: "Ankara", website: "https://www.bilkent.edu.tr" },
  { nameAr: "جامعة كوتش", nameEn: "Koç University", country: "Turkey", city: "Istanbul", website: "https://www.ku.edu.tr" },
  { nameAr: "جامعة سابانجي", nameEn: "Sabancı University", country: "Turkey", city: "Istanbul", website: "https://www.sabanciuniv.edu.tr" },
  { nameAr: "جامعة ييلديز للتكنولوجيا", nameEn: "Yıldız Technical University", country: "Turkey", city: "Istanbul", website: "https://www.yildiz.edu.tr" },
  { nameAr: "جامعة إسطنبول التقنية", nameEn: "Istanbul Technical University", country: "Turkey", city: "Istanbul", website: "https://www.itu.edu.tr" },
  { nameAr: "جامعة سلجوق", nameEn: "Selçuk University", country: "Turkey", city: "Konya", website: "https://www.selcuk.edu.tr" },
  { nameAr: "جامعة قرة دنيز التقنية", nameEn: "Karadeniz Technical University", country: "Turkey", city: "Trabzon", website: "https://www.ktu.edu.tr" },
  { nameAr: "جامعة جوكيورت", nameEn: "Çukurova University", country: "Turkey", city: "Adana", website: "https://www.cu.edu.tr" },
  { nameAr: "جامعة يدي تبه", nameEn: "Yeditepe University", country: "Turkey", city: "Istanbul", website: "https://www.yeditepe.edu.tr" },
  { nameAr: "جامعة إسطنبول شهير", nameEn: "Istanbul Şehir University", country: "Turkey", city: "Istanbul", website: "https://www.sehir.edu.tr" },
  { nameAr: "جامعة أتيليم", nameEn: "Atilim University", country: "Turkey", city: "Ankara", website: "https://www.atilim.edu.tr" },
  { nameAr: "جامعة بهجيشهير", nameEn: "Bahçeşehir University", country: "Turkey", city: "Istanbul", website: "https://www.bau.edu.tr" },
  { nameAr: "جامعة أوزيغين", nameEn: "Özyeğin University", country: "Turkey", city: "Istanbul", website: "https://www.ozyegin.edu.tr" },

  // Malaysia (15)
  { nameAr: "الجامعة الوطنية الماليزية", nameEn: "National University of Malaysia", country: "Malaysia", city: "Bangi", website: "https://www.ukm.my" },
  { nameAr: "جامعة مالايا", nameEn: "University of Malaya", country: "Malaysia", city: "Kuala Lumpur", website: "https://www.um.edu.my" },
  { nameAr: "جامعة بوترا الماليزية", nameEn: "Universiti Putra Malaysia", country: "Malaysia", city: "Serdang", website: "https://www.upm.edu.my" },
  { nameAr: "جامعة تكنولوجيا ماليزيا", nameEn: "Universiti Teknologi Malaysia", country: "Malaysia", city: "Johor Bahru", website: "https://www.utm.my" },
  { nameAr: "جامعة سانس ماليزيا", nameEn: "Universiti Sains Malaysia", country: "Malaysia", city: "Penang", website: "https://www.usm.my" },
  { nameAr: "جامعة تكنولوجيا مارا", nameEn: "Universiti Teknologi MARA", country: "Malaysia", city: "Shah Alam", website: "https://www.uitm.edu.my" },
  { nameAr: "جامعة مالايا المفتوحة", nameEn: "Open University Malaysia", country: "Malaysia", city: "Kuala Lumpur", website: "https://www.oum.edu.my" },
  { nameAr: "جامعة كوالالمبور", nameEn: "University of Kuala Lumpur", country: "Malaysia", city: "Kuala Lumpur", website: "https://www.unikl.edu.my" },
  { nameAr: "جامعة تايلور", nameEn: "Taylor's University", country: "Malaysia", city: "Subang Jaya", website: "https://www.taylors.edu.my" },
  { nameAr: "جامعة سونواي", nameEn: "Sunway University", country: "Malaysia", city: "Petaling Jaya", website: "https://www.sunway.edu.my" },
  { nameAr: "جامعة مانيجمنت وعلوم ماليزيا", nameEn: "Management and Science University", country: "Malaysia", city: "Shah Alam", website: "https://www.msu.edu.my" },
  { nameAr: "جامعة لينكولن ماليزيا", nameEn: "Lincoln University College", country: "Malaysia", city: "Petaling Jaya", website: "https://www.lincoln.edu.my" },
  { nameAr: "جامعة لايمكوك", nameEn: "AIMST University", country: "Malaysia", city: "Kedah", website: "https://www.aimst.edu.my" },
  { nameAr: "جامعة هيلب", nameEn: "HELP University", country: "Malaysia", city: "Kuala Lumpur", website: "https://www.help.edu.my" },
  { nameAr: "جامعة هيريوت وات ماليزيا", nameEn: "Heriot-Watt University Malaysia", country: "Malaysia", city: "Putrajaya", website: "https://www.hw.ac.uk/malaysia" },

  // Germany (15)
  { nameAr: "جامعة ميونيخ التقنية", nameEn: "Technical University of Munich", country: "Germany", city: "Munich", website: "https://www.tum.de" },
  { nameAr: "جامعة هايدلبرغ", nameEn: "Heidelberg University", country: "Germany", city: "Heidelberg", website: "https://www.uni-heidelberg.de" },
  { nameAr: "جامعة هامبورغ", nameEn: "University of Hamburg", country: "Germany", city: "Hamburg", website: "https://www.uni-hamburg.de" },
  { nameAr: "جامعة برلين التقنية", nameEn: "Technical University of Berlin", country: "Germany", city: "Berlin", website: "https://www.tu-berlin.de" },
  { nameAr: "جامعة فرانكفورت", nameEn: "Goethe University Frankfurt", country: "Germany", city: "Frankfurt", website: "https://www.goethe-university-frankfurt.de" },
  { nameAr: "جامعة كولونيا", nameEn: "University of Cologne", country: "Germany", city: "Cologne", website: "https://www.uni-koeln.de" },
  { nameAr: "جامعة مونستر", nameEn: "University of Münster", country: "Germany", city: "Münster", website: "https://www.uni-muenster.de" },
  { nameAr: "جامعة ماينتس يوهانس غوتنبرغ", nameEn: "Johannes Gutenberg University Mainz", country: "Germany", city: "Mainz", website: "https://www.uni-mainz.de" },
  { nameAr: "جامعة بون", nameEn: "University of Bonn", country: "Germany", city: "Bonn", website: "https://www.uni-bonn.de" },
  { nameAr: "جامعة تشيمنتس", nameEn: "Chemnitz University of Technology", country: "Germany", city: "Chemnitz", website: "https://www.tu-chemnitz.de" },
  { nameAr: "جامعة هانوفر", nameEn: "Leibniz University Hannover", country: "Germany", city: "Hannover", website: "https://www.uni-hannover.de" },
  { nameAr: "جامعة فريبورغ", nameEn: "University of Freiburg", country: "Germany", city: "Freiburg", website: "https://www.uni-freiburg.de" },
  { nameAr: "جامعة برلين الحرة", nameEn: "Free University of Berlin", country: "Germany", city: "Berlin", website: "https://www.fu-berlin.de" },
  { nameAr: "جامعة هومبولدت برلين", nameEn: "Humboldt University of Berlin", country: "Germany", city: "Berlin", website: "https://www.hu-berlin.de" },
  { nameAr: "جامعة دوسلدورف", nameEn: "University of Düsseldorf", country: "Germany", city: "Düsseldorf", website: "https://www.uni-duesseldorf.de" },

  // UK (15)
  { nameAr: "جامعة لندن الملكية", nameEn: "King's College London", country: "UK", city: "London", website: "https://www.kcl.ac.uk" },
  { nameAr: "جامعة مانشستر", nameEn: "University of Manchester", country: "UK", city: "Manchester", website: "https://www.manchester.ac.uk" },
  { nameAr: "جامعة برمنغهام", nameEn: "University of Birmingham", country: "UK", city: "Birmingham", website: "https://www.birmingham.ac.uk" },
  { nameAr: "جامعة ليدز", nameEn: "University of Leeds", country: "UK", city: "Leeds", website: "https://www.leeds.ac.uk" },
  { nameAr: "جامعة شيفيلد", nameEn: "University of Sheffield", country: "UK", city: "Sheffield", website: "https://www.sheffield.ac.uk" },
  { nameAr: "جامعة ليفربول", nameEn: "University of Liverpool", country: "UK", city: "Liverpool", website: "https://www.liverpool.ac.uk" },
  { nameAr: "جامعة نيوكاسل", nameEn: "Newcastle University", country: "UK", city: "Newcastle", website: "https://www.ncl.ac.uk" },
  { nameAr: "جامعة إدنبرة", nameEn: "University of Edinburgh", country: "UK", city: "Edinburgh", website: "https://www.ed.ac.uk" },
  { nameAr: "جامعة غلاسكو", nameEn: "University of Glasgow", country: "UK", city: "Glasgow", website: "https://www.gla.ac.uk" },
  { nameAr: "جامعة برستول", nameEn: "University of Bristol", country: "UK", city: "Bristol", website: "https://www.bristol.ac.uk" },
  { nameAr: "جامعة ساوثهامبتون", nameEn: "University of Southampton", country: "UK", city: "Southampton", website: "https://www.soton.ac.uk" },
  { nameAr: "جامعة نوتنغهام", nameEn: "University of Nottingham", country: "UK", city: "Nottingham", website: "https://www.nottingham.ac.uk" },
  { nameAr: "جامعة وارويك", nameEn: "University of Warwick", country: "UK", city: "Coventry", website: "https://www.warwick.ac.uk" },
  { nameAr: "جامعة إكستر", nameEn: "University of Exeter", country: "UK", city: "Exeter", website: "https://www.exeter.ac.uk" },
  { nameAr: "جامعة كارديف", nameEn: "Cardiff University", country: "UK", city: "Cardiff", website: "https://www.cardiff.ac.uk" },

  // Canada (15)
  { nameAr: "جامعة تورنتو", nameEn: "University of Toronto", country: "Canada", city: "Toronto", website: "https://www.utoronto.ca" },
  { nameAr: "جامعة ماكغيل", nameEn: "McGill University", country: "Canada", city: "Montreal", website: "https://www.mcgill.ca" },
  { nameAr: "جامعة كولومبيا البريطانية", nameEn: "University of British Columbia", country: "Canada", city: "Vancouver", website: "https://www.ubc.ca" },
  { nameAr: "جامعة ألبرتا", nameEn: "University of Alberta", country: "Canada", city: "Edmonton", website: "https://www.ualberta.ca" },
  { nameAr: "جامعة ووترلو", nameEn: "University of Waterloo", country: "Canada", city: "Waterloo", website: "https://www.uwaterloo.ca" },
  { nameAr: "جامعة كالغاري", nameEn: "University of Calgary", country: "Canada", city: "Calgary", website: "https://www.ucalgary.ca" },
  { nameAr: "جامعة ماكماستر", nameEn: "McMaster University", country: "Canada", city: "Hamilton", website: "https://www.mcmaster.ca" },
  { nameAr: "جامعة أوتاوا", nameEn: "University of Ottawa", country: "Canada", city: "Ottawa", website: "https://www.uottawa.ca" },
  { nameAr: "جامعة ويسترن أونتاريو", nameEen: "Western University", country: "Canada", city: "London", website: "https://www.uwo.ca" },
  { nameAr: "جامعة دالهوزي", nameEn: "Dalhousie University", country: "Canada", city: "Halifax", website: "https://www.dal.ca" },
  { nameAr: "جامعة كوينز", nameEn: "Queen's University", country: "Canada", city: "Kingston", website: "https://www.queensu.ca" },
  { nameAr: "جامعة مانيتوبا", nameEn: "University of Manitoba", country: "Canada", city: "Winnipeg", website: "https://www.umanitoba.ca" },
  { nameAr: "جامعة كونكورديا", nameEn: "Concordia University", country: "Canada", city: "Montreal", website: "https://www.concordia.ca" },
  { nameAr: "جامعة سيمون فريزر", nameEn: "Simon Fraser University", country: "Canada", city: "Burnaby", website: "https://www.sfu.ca" },
  { nameAr: "جامعة ريرسون", nameEn: "Toronto Metropolitan University", country: "Canada", city: "Toronto", website: "https://www.torontomu.ca" },

  // Australia (15)
  { nameAr: "جامعة ملبورن", nameEn: "University of Melbourne", country: "Australia", city: "Melbourne", website: "https://www.unimelb.edu.au" },
  { nameAr: "الجامعة الوطنية الأسترالية", nameEn: "Australian National University", country: "Australia", city: "Canberra", website: "https://www.anu.edu.au" },
  { nameAr: "جامعة سيدني", nameEn: "University of Sydney", country: "Australia", city: "Sydney", website: "https://www.sydney.edu.au" },
  { nameAr: "جامعة كوينزلاند", nameEn: "University of Queensland", country: "Australia", city: "Brisbane", website: "https://www.uq.edu.au" },
  { nameAr: "جامعة ويسترن أستراليا", nameEn: "University of Western Australia", country: "Australia", city: "Perth", website: "https://www.uwa.edu.au" },
  { nameAr: "جامعة أديلايد", nameEn: "University of Adelaide", country: "Australia", city: "Adelaide", website: "https://www.adelaide.edu.au" },
  { nameAr: "جامعة موناش", nameEn: "Monash University", country: "Australia", city: "Melbourne", website: "https://www.monash.edu" },
  { nameAr: "جامعة نيو ساوث ويلز", nameEn: "UNSW Sydney", country: "Australia", city: "Sydney", website: "https://www.unsw.edu.au" },
  { nameAr: "جامعة ماكواري", nameEn: "Macquarie University", country: "Australia", city: "Sydney", website: "https://www.mq.edu.au" },
  { nameAr: "جامعة ووللونغونغ", nameEn: "University of Wollongong", country: "Australia", city: "Wollongong", website: "https://www.uow.edu.au" },
  { nameAr: "جامعة لاتروب", nameEn: "La Trobe University", country: "Australia", city: "Melbourne", website: "https://www.latrobe.edu.au" },
  { nameAr: "جامعة ديكن", nameEn: "Deakin University", country: "Australia", city: "Geelong", website: "https://www.deakin.edu.au" },
  { nameAr: "جامعة رمب", nameEn: "RMIT University", country: "Australia", city: "Melbourne", website: "https://www.rmit.edu.au" },
  { nameAr: "جامعة غريفيث", nameEn: "Griffith University", country: "Australia", city: "Brisbane", website: "https://www.griffith.edu.au" },
  { nameAr: "جامعة كيرتن", nameEn: "Curtin University", country: "Australia", city: "Perth", website: "https://www.curtin.edu.au" },

  // USA (15)
  { nameAr: "جامعة هارفارد", nameEn: "Harvard University", country: "USA", city: "Cambridge", website: "https://www.harvard.edu" },
  { nameAr: "معهد ماساتشوستس للتكنولوجيا", nameEn: "MIT", country: "USA", city: "Cambridge", website: "https://www.mit.edu" },
  { nameAr: "جامعة ستانفورد", nameEn: "Stanford University", country: "USA", city: "Stanford", website: "https://www.stanford.edu" },
  { nameAr: "جامعة كاليفورنيا بيركلي", nameEn: "UC Berkeley", country: "USA", city: "Berkeley", website: "https://www.berkeley.edu" },
  { nameAr: "جامعة كولومبيا", nameEn: "Columbia University", country: "USA", city: "New York", website: "https://www.columbia.edu" },
  { nameAr: "جامعة شيكاغو", nameEn: "University of Chicago", country: "USA", city: "Chicago", website: "https://www.uchicago.edu" },
  { nameAr: "جامعة بنسلفانيا", nameEn: "University of Pennsylvania", country: "USA", city: "Philadelphia", website: "https://www.upenn.edu" },
  { nameAr: "جامعة كورنيل", nameEn: "Cornell University", country: "USA", city: "Ithaca", website: "https://www.cornell.edu" },
  { nameAr: "جامعة ييل", nameEn: "Yale University", country: "USA", city: "New Haven", website: "https://www.yale.edu" },
  { nameAr: "جامعة برينستون", nameEn: "Princeton University", country: "USA", city: "Princeton", website: "https://www.princeton.edu" },
  { nameAr: "جامعة ميشيغان", nameEn: "University of Michigan", country: "USA", city: "Ann Arbor", website: "https://www.umich.edu" },
  { nameAr: "جامعة كاليفورنيا لوس أنجلوس", nameEn: "UCLA", country: "USA", city: "Los Angeles", website: "https://www.ucla.edu" },
  { nameAr: "جامعة جورجتاون", nameEn: "Georgetown University", country: "USA", city: "Washington D.C.", website: "https://www.georgetown.edu" },
  { nameAr: "جامعة كاليفورنيا سان دييغو", nameEn: "UC San Diego", country: "USA", city: "San Diego", website: "https://www.ucsd.edu" },
  { nameAr: "جامعة نيويورك", nameEn: "New York University", country: "USA", city: "New York", website: "https://www.nyu.edu" },
] as const;

type UniversityRow = {
  id: number;
  country: string;
};

function getSpecializations(uni: UniversityRow) {
  const feeBase: Record<string, number> = {
    Turkey: 3500, Malaysia: 6000, Germany: 1500,
    UK: 18000, Canada: 16000, Australia: 20000, USA: 28000,
  };
  const base = feeBase[uni.country] ?? 8000;

  const pools: Array<{ nameAr: string; nameEn: string; degree: "bachelor" | "master" | "phd" | "diploma"; years: number; mult: number; req: object }> = [
    { nameAr: "هندسة الحاسوب والمعلوماتية", nameEn: "Computer Science & Engineering", degree: "bachelor", years: 4, mult: 1.1, req: { minGpa: 3.0, english: "IELTS 6.0" } },
    { nameAr: "إدارة الأعمال الدولية", nameEn: "International Business Administration", degree: "bachelor", years: 4, mult: 1.0, req: { minGpa: 2.8, english: "IELTS 5.5" } },
    { nameAr: "الطب البشري", nameEn: "Medicine (MBBS)", degree: "bachelor", years: 6, mult: 2.5, req: { minGpa: 3.7, english: "IELTS 7.0", subjects: ["Biology", "Chemistry"] } },
    { nameAr: "القانون الدولي", nameEn: "International Law", degree: "bachelor", years: 4, mult: 1.0, req: { minGpa: 3.0, english: "IELTS 6.5" } },
    { nameAr: "الهندسة المعمارية", nameEn: "Architecture", degree: "bachelor", years: 5, mult: 1.15, req: { minGpa: 3.0, english: "IELTS 6.0", portfolio: true } },
    { nameAr: "علم النفس التطبيقي", nameEn: "Applied Psychology", degree: "bachelor", years: 4, mult: 0.9, req: { minGpa: 2.8, english: "IELTS 6.0" } },
    { nameAr: "ماجستير إدارة الأعمال (MBA)", nameEn: "Master of Business Administration", degree: "master", years: 2, mult: 1.3, req: { minGpa: 3.0, english: "IELTS 6.5", gmat: 550, experience: "2 years" } },
    { nameAr: "ماجستير علوم الحاسوب", nameEn: "MSc Computer Science", degree: "master", years: 2, mult: 1.2, req: { minGpa: 3.2, english: "IELTS 6.5" } },
    { nameAr: "دكتوراه الهندسة الكيميائية", nameEn: "PhD Chemical Engineering", degree: "phd", years: 4, mult: 0.3, req: { minGpa: 3.5, english: "IELTS 7.0", research: "proposal required" } },
    { nameAr: "ماجستير العلوم البيئية", nameEn: "MSc Environmental Sciences", degree: "master", years: 2, mult: 1.1, req: { minGpa: 3.0, english: "IELTS 6.5" } },
    { nameAr: "هندسة الطاقة المتجددة", nameEn: "Renewable Energy Engineering", degree: "bachelor", years: 4, mult: 1.05, req: { minGpa: 3.0, english: "IELTS 6.0" } },
    { nameAr: "الصحافة والإعلام الرقمي", nameEn: "Journalism & Digital Media", degree: "bachelor", years: 3, mult: 0.85, req: { minGpa: 2.7, english: "IELTS 6.0" } },
  ];

  // Pick 3-5 specializations per university deterministically
  const count = 3 + (uni.id % 3);
  const selected = pools.filter((_, i) => (i + uni.id) % pools.length < count);

  return selected.slice(0, count).map((s) => ({
    universityId: uni.id,
    nameAr: s.nameAr,
    nameEn: s.nameEn,
    degree: s.degree,
    durationYears: s.years,
    tuitionFee: String(Math.round(base * s.mult)),
    currency: uni.country === "Turkey" ? "USD" : uni.country === "Germany" ? "EUR" : uni.country === "UK" ? "GBP" : "USD",
    status: "active" as const,
    requirementsJson: s.req,
  }));
}

export async function seed() {
  console.log("Seeding 150 universities...");

  const existing = await db.select({ id: universitiesTable.id }).from(universitiesTable).limit(1);
  if (existing.length > 0) {
    console.log("Universities already seeded, skipping.");
    return;
  }

  const uniData = UNIVERSITIES.map((u) => ({
    nameAr: u.nameAr,
    nameEn: "nameEn" in u ? u.nameEn : (u as { nameEen?: string }).nameEen ?? u.nameAr,
    country: u.country,
    city: u.city,
    website: u.website,
    paymentMode: "platform" as const,
    status: "active" as const,
  }));

  const inserted = await db.insert(universitiesTable).values(uniData).returning({ id: universitiesTable.id, country: universitiesTable.country });
  console.log(`Inserted ${inserted.length} universities`);

  const allSpecs = inserted.flatMap((u) => getSpecializations(u));
  await db.insert(specializationsTable).values(allSpecs);
  console.log(`Inserted ${allSpecs.length} specializations`);

  console.log("Seed complete!");
}

seed().catch(console.error).finally(() => process.exit(0));
