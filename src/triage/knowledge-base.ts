export interface SymptomMapping {
  keywords: string[];
  specialty: string;
  baseConfidence: number;
}

export const SYMPTOM_KNOWLEDGE_BASE: SymptomMapping[] = [
  // Dentistry
  { keywords: ["tooth", "teeth", "dental", "cavity", "gum", "molar", "toothache"], specialty: "dentistry", baseConfidence: 0.9 },
  // Dermatology
  { keywords: ["skin", "rash", "acne", "eczema", "mole", "dermatitis", "psoriasis", "itchy skin"], specialty: "dermatology", baseConfidence: 0.85 },
  // Orthopedics
  { keywords: ["bone", "fracture", "joint", "sprain", "wrist", "knee", "shoulder", "back pain", "spine", "hip", "broken", "broke", "arm", "swollen", "fell", "fall", "dislocation", "cast"], specialty: "orthopedics", baseConfidence: 0.85 },
  // Ophthalmology
  { keywords: ["eye", "vision", "blurry", "glasses", "contacts", "cataract", "glaucoma"], specialty: "ophthalmology", baseConfidence: 0.85 },
  // ENT
  { keywords: ["ear", "hearing", "throat", "sinus", "tonsil", "nose", "sore throat", "ear infection"], specialty: "ent", baseConfidence: 0.85 },
  // Cardiology
  { keywords: ["heart", "chest pain", "palpitation", "blood pressure", "cholesterol", "arrhythmia"], specialty: "cardiology", baseConfidence: 0.9 },
  // Psychiatry
  { keywords: ["anxiety", "depression", "mental health", "stress", "insomnia", "panic", "bipolar"], specialty: "psychiatry", baseConfidence: 0.85 },
  // Pediatrics
  { keywords: ["child", "pediatric", "infant", "toddler", "baby", "newborn"], specialty: "pediatrics", baseConfidence: 0.8 },
  // Obstetrics-Gynecology
  { keywords: ["pregnant", "pregnancy", "prenatal", "gynecolog", "period", "menstrual", "ovarian", "pap smear"], specialty: "obstetrics-gynecology", baseConfidence: 0.85 },
  // Gastroenterology
  { keywords: ["stomach", "digest", "nausea", "vomit", "diarrhea", "constipat", "abdominal", "acid reflux", "heartburn"], specialty: "gastroenterology", baseConfidence: 0.85 },
  // Neurology
  { keywords: ["headache", "migraine", "seizure", "numbness", "tingling", "nerve", "vertigo", "dizziness"], specialty: "neurology", baseConfidence: 0.85 },
  // Allergy-Immunology
  { keywords: ["allergy", "allergic", "hives", "sneez", "hay fever", "anaphylaxis", "food allergy"], specialty: "allergy-immunology", baseConfidence: 0.8 },
  // Endocrinology
  { keywords: ["diabetes", "thyroid", "hormone", "endocrine", "insulin", "metabolic"], specialty: "endocrinology", baseConfidence: 0.85 },
  // Urology
  { keywords: ["kidney", "urinary", "bladder", "urine", "prostate", "kidney stone"], specialty: "urology", baseConfidence: 0.85 },
  // Pulmonology
  { keywords: ["lung", "breathing", "cough", "asthma", "wheez", "pneumonia", "bronchitis"], specialty: "pulmonology", baseConfidence: 0.85 },
  // Rheumatology
  { keywords: ["arthritis", "lupus", "autoimmune", "fibromyalgia", "rheumat"], specialty: "rheumatology", baseConfidence: 0.8 },
  // Oncology
  { keywords: ["cancer", "tumor", "lump", "chemotherapy", "oncolog", "malignant"], specialty: "oncology", baseConfidence: 0.9 },
  // Hematology
  { keywords: ["blood disorder", "anemia", "clotting", "hemophilia", "platelet"], specialty: "hematology", baseConfidence: 0.8 },
  // Nephrology
  { keywords: ["kidney disease", "dialysis", "renal", "creatinine"], specialty: "nephrology", baseConfidence: 0.85 },
  // Infectious Disease
  { keywords: ["infection", "fever", "flu", "covid", "hiv", "hepatitis", "tuberculosis"], specialty: "infectious-disease", baseConfidence: 0.8 },
  // Physical Therapy
  { keywords: ["physical therapy", "rehabilitation", "mobility", "range of motion", "muscle weakness"], specialty: "physical-therapy", baseConfidence: 0.8 },
  // Podiatry
  { keywords: ["foot", "ankle", "heel", "bunion", "plantar", "ingrown toenail"], specialty: "podiatry", baseConfidence: 0.85 },
  // Sleep Medicine
  { keywords: ["sleep apnea", "snoring", "sleep disorder", "narcolepsy", "restless leg"], specialty: "sleep-medicine", baseConfidence: 0.8 },
  // Pain Management
  { keywords: ["chronic pain", "pain management", "nerve block", "fibromyalgia pain"], specialty: "pain-management", baseConfidence: 0.8 },
  // Geriatrics
  { keywords: ["elderly", "geriatric", "aging", "dementia", "alzheimer"], specialty: "geriatrics", baseConfidence: 0.8 },
  // Sports Medicine
  { keywords: ["sports injury", "athletic", "torn ligament", "concussion", "rotator cuff"], specialty: "sports-medicine", baseConfidence: 0.8 },
  // Plastic Surgery
  { keywords: ["cosmetic", "plastic surgery", "reconstruction", "scar", "burn"], specialty: "plastic-surgery", baseConfidence: 0.8 },
  // Vascular Surgery
  { keywords: ["varicose", "vein", "circulation", "peripheral artery", "blood clot"], specialty: "vascular-surgery", baseConfidence: 0.8 },
  // Urgent Care (general)
  { keywords: ["urgent", "walk-in", "minor injury", "stitches", "wound"], specialty: "urgent-care", baseConfidence: 0.7 },
  // General Practice / Primary Care (fallback-adjacent, but with specific keywords)
  { keywords: ["checkup", "physical exam", "wellness", "annual visit", "general"], specialty: "general-practice", baseConfidence: 0.6 },
  // Chiropractic
  { keywords: ["chiropractor", "spinal adjustment", "back alignment", "neck adjustment", "subluxation", "chiropractic"], specialty: "chiropractic", baseConfidence: 0.8 },
  // Audiology
  { keywords: ["hearing loss", "tinnitus", "ringing ears", "hearing aid", "audiologist", "ear ringing"], specialty: "audiology", baseConfidence: 0.8 },
  // Nutrition / Dietetics
  { keywords: ["nutrition", "diet", "weight loss", "obesity", "eating disorder", "dietitian", "meal plan", "bmi"], specialty: "nutrition", baseConfidence: 0.75 },
  // Occupational Therapy
  { keywords: ["occupational therapy", "hand therapy", "fine motor", "daily activities", "adaptive equipment"], specialty: "occupational-therapy", baseConfidence: 0.8 },
  // Speech Therapy
  { keywords: ["speech therapy", "stuttering", "swallowing difficulty", "speech delay", "language disorder", "aphasia"], specialty: "speech-therapy", baseConfidence: 0.8 },
  // Wound Care
  { keywords: ["wound care", "chronic wound", "diabetic ulcer", "pressure sore", "wound healing", "non-healing wound"], specialty: "wound-care", baseConfidence: 0.8 },
  // Fertility / Reproductive Endocrinology
  { keywords: ["fertility", "ivf", "infertility", "egg freezing", "reproductive", "conception", "miscarriage"], specialty: "reproductive-endocrinology", baseConfidence: 0.85 },
  // Genetics / Genetic Counseling
  { keywords: ["genetic testing", "genetic counseling", "hereditary", "family history", "genetic disorder", "dna test"], specialty: "genetics", baseConfidence: 0.8 },
  // Palliative Care
  { keywords: ["palliative", "end of life", "hospice", "comfort care", "terminal illness", "pain relief chronic"], specialty: "palliative-care", baseConfidence: 0.8 },
  // Addiction Medicine
  { keywords: ["addiction", "substance abuse", "alcohol dependence", "drug rehab", "opioid", "withdrawal", "sobriety"], specialty: "addiction-medicine", baseConfidence: 0.85 },
  // Neonatology
  { keywords: ["premature baby", "nicu", "neonatal", "newborn intensive", "preterm infant"], specialty: "neonatology", baseConfidence: 0.85 },
  // Interventional Radiology
  { keywords: ["interventional radiology", "embolization", "stent placement", "biopsy guided", "catheter procedure"], specialty: "interventional-radiology", baseConfidence: 0.8 },
  // Nuclear Medicine
  { keywords: ["nuclear medicine", "pet scan", "radioactive", "thyroid scan", "bone scan imaging"], specialty: "nuclear-medicine", baseConfidence: 0.8 },
  // Oral Surgery
  { keywords: ["wisdom teeth", "jaw surgery", "oral surgery", "tooth extraction", "dental implant", "impacted tooth"], specialty: "oral-surgery", baseConfidence: 0.85 },
  // Optometry
  { keywords: ["eye exam", "contact lens", "prescription glasses", "optometrist", "vision test", "eye checkup"], specialty: "optometry", baseConfidence: 0.8 },
  // Acupuncture
  { keywords: ["acupuncture", "dry needling", "meridian", "traditional chinese medicine", "tcm"], specialty: "acupuncture", baseConfidence: 0.75 },
  // Massage Therapy
  { keywords: ["massage therapy", "deep tissue", "muscle tension", "therapeutic massage", "myofascial release"], specialty: "massage-therapy", baseConfidence: 0.75 },
  // Bariatric Surgery
  { keywords: ["bariatric", "gastric bypass", "gastric sleeve", "weight loss surgery", "lap band"], specialty: "bariatric-surgery", baseConfidence: 0.85 },
  // Colorectal Surgery
  { keywords: ["colorectal", "hemorrhoid", "rectal bleeding", "colon polyp", "anal fissure", "colonoscopy"], specialty: "colorectal-surgery", baseConfidence: 0.85 },
  // Thoracic Surgery
  { keywords: ["thoracic surgery", "lung surgery", "chest surgery", "esophageal surgery", "mediastinal"], specialty: "thoracic-surgery", baseConfidence: 0.85 },
  // Hand Surgery
  { keywords: ["hand surgery", "carpal tunnel", "trigger finger", "hand fracture", "tendon repair", "dupuytren"], specialty: "hand-surgery", baseConfidence: 0.85 },
];
