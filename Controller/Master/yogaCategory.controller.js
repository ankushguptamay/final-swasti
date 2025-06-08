import dotenv from "dotenv";
dotenv.config();

import {
  compressImageFile,
  deleteSingleFile,
} from "../../Helper/fileHelper.js";
import {
  failureResponse,
  successResponse,
} from "../../MiddleWare/responseMiddleware.js";
import { validateYogaCategory } from "../../MiddleWare/Validation/master.js";
import { YogaCategory } from "../../Model/Master/yogaCategoryModel.js";
import { YogaTutorClass } from "../../Model/User/Services/YogaTutorClass/yogaTutorClassModel.js";
import { deleteFileToBunny, uploadFileToBunny } from "../../Util/bunny.js";
const bunnyFolderName = process.env.MASTER_FOLDER;
import fs from "fs";
import { getEmbedding } from "../../Util/AIFunction.js";
import cosineSimilarity from "cosine-similarity";
import { compareArrays } from "../../Helper/formatChange.js";

async function removeSomeWord(input) {
  const wordsToRemove = ["yoga", "for", "from", "to"];
  const regex = new RegExp(`\\b(${wordsToRemove.join("|")})\\b`, "gi");
  const cleaned = input
    .replace(regex, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  return cleaned;
}

async function finalQuery(input) {
  const cleanSearch = await removeSomeWord(input);
  const arr = cleanSearch.split(" ");
  const regexConditions = arr.map((term) => ({
    $or: [
      { yogaCategory: new RegExp(term, "i") },
      { description: new RegExp(term, "i") },
      { tags: new RegExp(term, "i") },
    ],
  }));
  const finalQuery = { $or: regexConditions.map((c) => c.$or).flat() };
  return finalQuery;
}

const newCat = [
  {
    _id: "67d950fcfba4c8f4cfd68bb2",
    newName: "Yoga for weight loss",
    tags: ["obesity", "fatloss", "weight loss", "hypothyroidism"],
  },
  {
    _id: "67d950fcfba4c8f4cfd68bb3",
    newName: "Yoga for weight gain",
    tags: ["muscle gain", "weight gain", "hyperthyroidism"],
  },
  {
    _id: "67d950fcfba4c8f4cfd68bb4",
    newName: "Yoga for height increase",
    tags: ["streching", "flexiblity"],
  },
  {
    _id: "67d950fcfba4c8f4cfd68bb5",
    newName: "Yoga for muscle toning",
    tags: ["strenght", "power yoga", "muscle toning"],
  },
  {
    _id: "67d950fcfba4c8f4cfd68bb6",
    newName: "Yoga for flexibility",
    tags: ["streching", "flexiblity"],
  },
  {
    _id: "67d950fcfba4c8f4cfd68bb7",
    newName: "Yoga for core strength",
    tags: ["core strenght", "abdominal muscles"],
  },
  {
    _id: "67d950fcfba4c8f4cfd68bb8",
    newName: "Yoga for body detox",
    tags: ["detox", "indigestion", "remove toxins"],
  },
  {
    _id: "67d950fcfba4c8f4cfd68bb9",
    newName: "Yoga for better blood circulation",
    tags: ["blood circulation"],
  },
  {
    _id: "67d950fcfba4c8f4cfd68bba",
    newName: "Yoga for posture correction",
    tags: ["posture", "pose", "body alignment"],
  },
  {
    _id: "67d950fcfba4c8f4cfd68bbb",
    newName: "Yoga for stamina",
    tags: ["vitality", "stamina", "vital power"],
  },
  {
    _id: "67d950fcfba4c8f4cfd68bbc",
    newName: "Yoga for body alignment",
    tags: ["posture correction", "pose", "body alignment"],
  },
  {
    _id: "67d950fcfba4c8f4cfd68bbd",
    newName: "Yoga for metabolism",
    tags: ["metabolism", "digestion", "indigestion"],
  },
  {
    _id: "67d950fcfba4c8f4cfd68bbe",
    newName: "Yoga for body transformation",
    tags: ["transform", "body changing", "body sculpting"],
  },
  {
    _id: "67d950fcfba4c8f4cfd68bbf",
    newName: "Yoga for endurance",
    tags: ["stamina", "vitality"],
  },
  {
    _id: "67d950fcfba4c8f4cfd68bc1",
    newName: "Yoga for stress",
    tags: ["stress", "anxeity", "transformation", "emotional Balance"],
  },
  {
    _id: "67d950fcfba4c8f4cfd68bc2",
    newName: "Yoga for anxiety",
    tags: ["stress", "anxeity", "transformation", "emotional Balance"],
  },
  {
    _id: "67d950fcfba4c8f4cfd68bc3",
    newName: "Yoga for depression",
    tags: ["stress", "anxeity", "transformation", "emotional Balance"],
  },
  {
    _id: "67d950fcfba4c8f4cfd68bc4",
    newName: "Yoga for emotional Balance",
    tags: [
      "stress",
      "anxeity",
      "transformation",
      "emotional Balance",
      "improve mood",
    ],
  },
  {
    _id: "67d950fcfba4c8f4cfd68bc5",
    newName: "Yoga for mindfulness and awareness",
    tags: ["awareness", "concious", "mindfulness"],
  },
  {
    _id: "67d950fcfba4c8f4cfd68bc6",
    newName: "Yoga for anger management",
    tags: ["furious", "anger", "High blood pressure", ""],
  },
  {
    _id: "67d950fcfba4c8f4cfd68bc7",
    newName: "Yoga for self-confidence",
    tags: ["Self-confidence", "discipline"],
  },
  {
    _id: "67d950fcfba4c8f4cfd68bc8",
    newName: "Yoga for self-love and acceptance",
    tags: ["love and acceptance", "self love", "self awareness"],
  },
  {
    _id: "67d950fcfba4c8f4cfd68bc9",
    newName: "Yoga for self-discipline",
    tags: ["Self-confidence", "discipline"],
  },
  {
    _id: "67d950fcfba4c8f4cfd68bcb",
    newName: "Yoga for overcoming negative thoughts",
    tags: ["negative thoughts", "negativity", ""],
  },
  {
    _id: "67d950fcfba4c8f4cfd68bcc",
    newName: "Yoga for inner peace",
    tags: ["peace", "blissfulness", "happiness"],
  },
  {
    _id: "67d950fcfba4c8f4cfd68bcd",
    newName: "Yoga for reducing overthinking",
    tags: ["overthinking", "tension", "anxiety", "too much thinking"],
  },
  {
    _id: "67d950fcfba4c8f4cfd68bce",
    newName: "Yoga for better emotional control",
    tags: [
      "stress",
      "anxeity",
      "transformation",
      "emotional Balance",
      "improve mood",
    ],
  },
  {
    _id: "67d950fcfba4c8f4cfd68bcf",
    newName: "Yoga for positive thinking",
    tags: ["positivity", "positveness", "positive thinking"],
  },
  {
    _id: "67d950fcfba4c8f4cfd68bd0",
    newName: "Yoga for sleep disorders",
    tags: [
      "sleep disorders",
      "insomia",
      "sleep apnea",
      "sound sleep",
      "good sleep",
      "peaceful sleep",
      "hot flashes",
      "head aches",
    ],
  },
  {
    _id: "67d950fcfba4c8f4cfd68bd1",
    newName: "Yoga for deep relaxation",
    tags: [
      "sound sleep",
      "good sleep",
      "peaceful sleep",
      "restlessness",
      "uneasiness",
    ],
  },
  {
    _id: "67d950fcfba4c8f4cfd68bd3",
    newName: "Yoga for bedtime routine",
    tags: ["sound sleep", "good sleep", "peaceful sleep", "night yoga"],
  },
  {
    _id: "67d950fcfba4c8f4cfd68bd6",
    newName: "Yoga for relieving restlessness",
    tags: ["restlessness", "uneasiness"],
  },
  {
    _id: "67d950fcfba4c8f4cfd68bd7",
    newName: "Yoga for Calm mind",
    tags: ["Nervous system", "mind", "brain"],
  },
  {
    _id: "67d950fcfba4c8f4cfd68bda",
    newName: "Yoga for digestion",
    tags: ["indigestion", "underdigestion", "acidity", "ulcer"],
  },
  {
    _id: "67d950fcfba4c8f4cfd68bdb",
    newName: "Yoga for constipation",
    tags: ["indigestion", "constipation", "stomach ache"],
  },
  {
    _id: "67d950fcfba4c8f4cfd68bdc",
    newName: "Yoga for bloating and gas",
    tags: ["bloating", "gas"],
  },
  {
    _id: "67d950fcfba4c8f4cfd68bdd",
    newName: "Yoga for acid reflux",
    tags: ["acidity", "acid", "reflux", "pitta", "ulcer"],
  },
  {
    _id: "67d950fcfba4c8f4cfd68bde",
    newName: "Yoga for gut health",
    tags: ["gut", "GI tract", "IBS", "indigestion", "ulcer"],
  },
  {
    _id: "67d950fcfba4c8f4cfd68bdf",
    newName: "Yoga for Irritable Bowel Syndrome",
    tags: [
      "gut",
      "GI tract",
      "IBS",
      "indigestion",
      "ulcer",
      "acidity",
      "acid",
      "reflux",
      "pitta",
    ],
  },
  {
    _id: "67d950fcfba4c8f4cfd68be0",
    newName: "Yoga for liver",
    tags: ["liver detox", "detox", "detoxify", "toxins"],
  },
  {
    _id: "67d950fcfba4c8f4cfd68be1",
    newName: "Yoga for appetite",
    tags: ["hunger", "hunger improvement", "appetite improvement"],
  },
  {
    _id: "67d950fcfba4c8f4cfd68be2",
    newName: "Yoga for reducing indigestion",
    tags: ["indigestion", "over digeston", "under-digestion"],
  },
  {
    _id: "67d950fcfba4c8f4cfd68be3",
    newName: "Yoga for gut microbiome balance",
    tags: ["microbiome", "micro"],
  },
  {
    _id: "67d950fcfba4c8f4cfd68be4",
    newName: "Yoga for PCOS management",
    tags: ["pcos", "pcod", "early menupause", ""],
  },
  {
    _id: "67d950fcfba4c8f4cfd68be5",
    newName: "Yoga for menstrual pain relief",
    tags: ["menstrual pain", "high blood loss", "cyst", "PCOD", "PCOS"],
  },
  {
    _id: "67d950fcfba4c8f4cfd68be6",
    newName: "Yoga for balancing hormones",
    tags: ["hormanal balance", "hormones", "endocrine system", "enzymes", ""],
  },
  {
    _id: "67d950fcfba4c8f4cfd68be7",
    newName: "Yoga for irregular periods",
    tags: ["acidity", "acid", "reflux", "pitta", "ulcer"],
  },
  {
    _id: "67d950fcfba4c8f4cfd68be8",
    newName: "Yoga for pregnancy",
    tags: [
      "Pregnant lady",
      "yoga for child birth",
      "pregnancy",
      "first timester",
      "second trimester",
      "third trimester",
    ],
  },
  {
    _id: "67d950fcfba4c8f4cfd68be9",
    newName: "Yoga for postpartum recovery",
    tags: ["after child birth", "pastpartum yoga"],
  },
  {
    _id: "67d950fcfba4c8f4cfd68bea",
    newName: "Yoga for menopause relief",
    tags: ["menopause"],
  },
  {
    _id: "67d950fcfba4c8f4cfd68beb",
    newName: "Yoga for increasing fertility",
    tags: ["fertility", "child birth"],
  },
  {
    _id: "67d950fdfba4c8f4cfd68bec",
    newName: "Yoga for breast health",
    tags: [
      "breast shape",
      "breast size",
      "saggy breast",
      "breast cancer",
      "breast disoredrs",
    ],
  },
  {
    _id: "67d950fdfba4c8f4cfd68bed",
    newName: "Yoga for reducing PMS symptoms",
    tags: [
      "menstrual disorders",
      "menstrual induced depression",
      "female reproductive organs",
    ],
  },
  {
    _id: "67d950fdfba4c8f4cfd68bee",
    newName: "Yoga for boosting testosterone",
    tags: [
      "male hormones",
      "masculine energy",
      "vitality",
      "stamina",
      "daily energy level",
    ],
  },
  {
    _id: "67d950fdfba4c8f4cfd68bef",
    newName: "Yoga for prostate health",
    tags: ["prostrate cancer", "prastrate disorder", "semen quality"],
  },
  {
    _id: "67d950fdfba4c8f4cfd68bf0",
    newName: "Yoga for erectile dysfunction",
    tags: ["sexaul disorder", "penis disorders", "loose penis"],
  },
  {
    _id: "67d950fdfba4c8f4cfd68bf1",
    newName: "Yoga for sperm",
    tags: ["sperm count", "sperm health", "semen consistency"],
  },
  {
    _id: "67d950fdfba4c8f4cfd68bf2",
    newName: "Yoga for muscle strength",
    tags: [
      "body builders",
      "gym going persons",
      "gym",
      "muscle gaining",
      "muscularity",
      "muscle tone",
      "muscle strenght",
    ],
  },
  {
    _id: "67d950fdfba4c8f4cfd68bf3",
    newName: "Yoga for belly fat",
    tags: [
      "reducing belly fat",
      "love handles",
      "belly tyres",
      "fat",
      "apple shape body",
      "pea shape body",
    ],
  },
  {
    _id: "67d950fdfba4c8f4cfd68bf4",
    newName: "Yoga for hair growth in men",
    tags: [
      "hairfall",
      "hairline",
      "declined hairline",
      "hair health",
      "hair thinning",
      "hair weekening",
    ],
  },
  {
    _id: "67d950fdfba4c8f4cfd68bf5",
    newName: "Yoga for beard growth",
    tags: ["beard", "good beard", "patchy beard", "facial hairs"],
  },
  {
    _id: "67d950fdfba4c8f4cfd68bf6",
    newName: "Yoga for kids",
    tags: ["childrens", "adhd", "boys", "girls", "infants"],
  },
  {
    _id: "67d950fdfba4c8f4cfd68bf7",
    newName: "Yoga for teenagers",
    tags: ["for teenagers", "12-18 years of people", "young children"],
  },
  {
    _id: "67d950fdfba4c8f4cfd68bf8",
    newName: "Yoga for adults",
    tags: [
      "old age",
      "mid aged",
      "young adults",
      "office going",
      "house wifes",
      "newly married",
      "Yoga for people in their 30s and 40s",
    ],
  },
  {
    _id: "67d950fdfba4c8f4cfd68bf9",
    newName: "Yoga for seniors",
    tags: [
      "senior citizens",
      "old people",
      "grand father",
      "grand mother",
      "old people",
    ],
  },
  {
    _id: "67d950fdfba4c8f4cfd68bfb",
    newName: "Yoga for healthy aging",
    tags: ["ageing process", "ageing reversal", "slow down ageing"],
  },
  {
    _id: "67d950fdfba4c8f4cfd68bfc",
    newName: "Yoga for bone health",
    tags: [
      "bone weekness",
      "artheritis",
      "bone pain",
      "bone shape",
      "bone marrow",
    ],
  },
  {
    _id: "67d950fdfba4c8f4cfd68bfd",
    newName: "Yoga for increasing memory power in seniors",
    tags: [
      "memory power",
      "recall power",
      "better focus",
      "better concentration",
    ],
  },
  {
    _id: "67d950fdfba4c8f4cfd68bfe",
    newName: "Yoga for better focus in students",
    tags: [
      "concentration",
      "better focus for study",
      "better concentration",
      "good focus",
    ],
  },
  {
    _id: "67d950fdfba4c8f4cfd68bff",
    newName: "Yoga for hyperactive children",
    tags: ["ADHD", "naugthy children", "attention seeker children"],
  },
  {
    _id: "67d950fdfba4c8f4cfd68c00",
    newName: "Yoga for high blood pressure",
    tags: ["hypertension", "high BP"],
  },
  {
    _id: "67d950fdfba4c8f4cfd68c01",
    newName: "Yoga for low blood pressure",
    tags: ["Low Blood Pressure", "low energy", "weekness", "low BP"],
  },
  {
    _id: "67d950fdfba4c8f4cfd68c02",
    newName: "Yoga for diabetes control",
    tags: [
      "diabetes type-1",
      "type-2",
      "diabetes mellitus",
      "sugar",
      "sugar level",
      "high bp",
      "low bp",
      "smelly urine",
    ],
  },
  {
    _id: "67d950fdfba4c8f4cfd68c03",
    newName: "Yoga for thyroid health",
    tags: [
      "thyroxin disorder",
      "thyroid",
      "hyperthyroidism",
      "hypothyroidism",
      "hormonal imbalance",
      "obesity",
      "diabeters",
    ],
  },
  {
    _id: "67d950fdfba4c8f4cfd68c04",
    newName: "Yoga for heart health",
    tags: [
      "CVD",
      "CAD",
      "Cardio-vascular-diseases",
      "coronary-artery diseases",
      "hypertension",
      "atherosclerosis",
      "chest pain",
      "stroke patient",
    ],
  },
  {
    _id: "67d950fdfba4c8f4cfd68c05",
    newName: "Yoga for kidney health",
    tags: [
      "renal health",
      "renal disorders",
      "urological disorders",
      "nephrons diseases",
      "micturation problems",
      "excreatory disorders",
    ],
  },
  {
    _id: "67d950fdfba4c8f4cfd68c06",
    newName: "Yoga for arthritis",
    tags: [
      "ostio",
      "knee pain",
      "back pain",
      "neck painb",
      "spondyolitris",
      "spondyolysthesis",
      "degeneration of cartilages",
    ],
  },
  {
    _id: "67d950fdfba4c8f4cfd68c07",
    newName: "Yoga for back pain",
    tags: [
      "lumbar",
      "thoracic",
      "cervical",
      "back pain",
      "siatica pain",
      "spondyolysthesis",
      "spondyolitis",
    ],
  },
  {
    _id: "67d950fdfba4c8f4cfd68c08",
    newName: "Yoga for knee pain",
    tags: ["arthretis", "ostio-artheritis", "rehumatoid arhteritis"],
  },
  {
    _id: "67d950fdfba4c8f4cfd68c09",
    newName: "Yoga for neck pain",
    tags: ["cervical spondyolitis", "cervical", "neck pain", "spinal pain"],
  },
  {
    _id: "67d950fdfba4c8f4cfd68c0a",
    newName: "Yoga for headaches",
    tags: ["migrane", "headaches", "cervical"],
  },
  {
    _id: "67d950fdfba4c8f4cfd68c0b",
    newName: "Yoga for lung health",
    tags: [
      "asthma",
      "bronchitis",
      "access mucus in lungs",
      "pulmonary disorders",
    ],
  },
  {
    _id: "67d950fdfba4c8f4cfd68c0c",
    newName: "Yoga for immunity",
    tags: ["better immunity", "immune system"],
  },
  {
    _id: "67d950fdfba4c8f4cfd68c0d",
    newName: "Yoga for sinusitis relief",
    tags: ["sinusitis", "running nose", "auto-immune disease", ""],
  },
  {
    _id: "67d950fdfba4c8f4cfd68c0e",
    newName: "Yoga for hair growth",
    tags: ["hair growth", "hair thinning", "week hairs"],
  },
  {
    _id: "67d950fdfba4c8f4cfd68c0f",
    newName: "Yoga for glowing skin",
    tags: ["clear skin", "bright skin", "pimple proof skin", "glowing skin"],
  },
  {
    _id: "67d950fdfba4c8f4cfd68c10",
    newName: "Yoga for reducing acne",
    tags: ["clear skin", "bright skin", "pimple proof skin", "glowing skin"],
  },
  {
    _id: "67d950fdfba4c8f4cfd68c11",
    newName: "Yoga for varicose veins relief",
    tags: ["varicose veins", "blue veins"],
  },
  {
    _id: "67d950fdfba4c8f4cfd68c12",
    newName: "Yoga for tinnitus",
    tags: ["ringing ears", "wistling ears", "tinnitus"],
  },
  {
    _id: "67d950fdfba4c8f4cfd68c13",
    newName: "Yoga for better concentration at work",
    tags: ["focus", "concentration", "dhyana"],
  },
  {
    _id: "67d950fdfba4c8f4cfd68c14",
    newName: "Yoga for creative thinking",
    tags: ["creative thinking", "thoughts", "ideas"],
  },
  {
    _id: "67d950fdfba4c8f4cfd68c15",
    newName: "Yoga for reducing workplace stress",
    tags: ["work place stress", "anxiety", "tension"],
  },
  {
    _id: "67d950fdfba4c8f4cfd68c16",
    newName: "Yoga for boosting energy at work",
    tags: ["energy gain", "health recovery", "boost energy"],
  },
  {
    _id: "67d950fdfba4c8f4cfd68c17",
    newName: "Yoga for improving memory",
    tags: ["memory"],
  },
  {
    _id: "67d950fdfba4c8f4cfd68c18",
    newName: "Yoga for focus",
    tags: [
      "long focus",
      "long concentration",
      "meditation",
      "focus for long hours",
    ],
  },
  {
    _id: "67d950fdfba4c8f4cfd68c19",
    newName: "Yoga for work-related tension",
    tags: ["work related tension", "office load"],
  },
  {
    _id: "67d950fdfba4c8f4cfd68c1a",
    newName: "Yoga for handling job-related anxiety",
    tags: ["work anxiety", "office load"],
  },
  {
    _id: "67d950fdfba4c8f4cfd68c1b",
    newName: "Yoga for work-life stress",
    tags: ["stress", "work-life", "office"],
  },
  {
    _id: "67d950fdfba4c8f4cfd68c1c",
    newName: "Yoga for chakra balancing",
    tags: ["chakra", "energy centers", "energy knots"],
  },
  {
    _id: "67d950fdfba4c8f4cfd68c1d",
    newName: "Yoga for Kundalini awakening",
    tags: ["kundalini", "spiritual yoga", "serpent power", "serpent energy"],
  },
  {
    _id: "67d950fdfba4c8f4cfd68c1e",
    newName: "Yoga for third-eye activation",
    tags: ["ajna chakra", "sixth sense", "eyebrow chakra"],
  },
  {
    _id: "67d950fdfba4c8f4cfd68c1f",
    newName: "Yoga for deep meditation",
    tags: ["meditation", "dhyana", "dharna", "focus", "concentration"],
  },
  {
    _id: "67d950fdfba4c8f4cfd68c20",
    newName: "Yoga for developing intuition",
    tags: ["developing intuition", "sixth sense"],
  },
  {
    _id: "67d950fdfba4c8f4cfd68c21",
    newName: "Yoga for connecting with the universe",
    tags: ["connecting with the universe"],
  },
  {
    _id: "67d950fdfba4c8f4cfd68c22",
    newName: "Yoga for spiritual awakening",
    tags: ["spiritual awakening"],
  },
  {
    _id: "67d950fdfba4c8f4cfd68c23",
    newName: "Yoga for enlightenment",
    tags: ["enlightenment"],
  },
  {
    _id: "67d950fdfba4c8f4cfd68c24",
    newName: "Yoga for increasing Prana",
    tags: ["life force", "prana"],
  },
  {
    _id: "67d950fdfba4c8f4cfd68c25",
    newName: "Yoga for runners",
    tags: ["runners", "running", "marathon"],
  },
  {
    _id: "67d950fdfba4c8f4cfd68c26",
    newName: "Yoga for swimmers",
    tags: ["swimmer", "swimming", "athelets"],
  },
  {
    _id: "67d950fdfba4c8f4cfd68c27",
    newName: "Yoga for football players",
    tags: ["football", "players", "sports"],
  },
  {
    _id: "67d950fdfba4c8f4cfd68c28",
    newName: "Yoga for bodybuilders",
    tags: ["body builders", "gym going persons", "gym"],
  },
  {
    _id: "67d950fdfba4c8f4cfd68c29",
    newName: "Yoga for martial artists",
    tags: ["for sports persons", "martial artist", "kung fu"],
  },
  {
    _id: "67d950fdfba4c8f4cfd68c2a",
    newName: "Yoga for agility",
    tags: ["agility", "speed", "fast reflex"],
  },
  {
    _id: "67d950fdfba4c8f4cfd68c2b",
    newName: "Yoga for muscle recovery",
    tags: ["muscle recovery"],
  },
  {
    _id: "67d950fdfba4c8f4cfd68c2c",
    newName: "Yoga for Mind-Body coordination",
    tags: ["improve balance and coordination"],
  },
  {
    _id: "67d950fdfba4c8f4cfd68c2d",
    newName: "Yoga for Athelets",
    tags: ["increasing flexibility in athletes", "sports person"],
  },
  {
    _id: "67d950fdfba4c8f4cfd68c2e",
    newName: "Yoga for reducing injuries in sports",
    tags: ["sports yoga", "sports injuries"],
  },
  {
    _id: "67d950fdfba4c8f4cfd68c2f",
    newName: "Yoga for post-injury",
    tags: ["injury recovery", "accident recovery", "surgery"],
  },
  {
    _id: "67d950fdfba4c8f4cfd68c30",
    newName: "Yoga for cancer",
    tags: ["coancer recovery"],
  },
  {
    _id: "67d950fdfba4c8f4cfd68c31",
    newName: "Yoga for post-surgery",
    tags: ["post-surgery healing", "post-operation"],
  },
  {
    _id: "67d950fdfba4c8f4cfd68c32",
    newName: "Yoga for autoimmune diseases",
    tags: ["immune system"],
  },
  {
    _id: "67d950fdfba4c8f4cfd68c33",
    newName: "Yoga for addiction",
    tags: ["bad habbits", "addiction", "addiction recovery"],
  },
  {
    _id: "67d950fdfba4c8f4cfd68c34",
    newName: "Yoga for trauma",
    tags: ["trauma", "accident"],
  },
  {
    _id: "67d950fdfba4c8f4cfd68c35",
    newName: "Yoga for pain",
    tags: ["chronic pain"],
  },
  {
    _id: "67d950fdfba4c8f4cfd68c36",
    newName: "Yoga for post-illness rehabilitation",
    tags: ["energy gain", "health recovery"],
  },
  {
    _id: "67d950fdfba4c8f4cfd68c37",
    newName: "Yoga for overcoming fear",
    tags: ["Phobias", "fear"],
  },
  {
    _id: "67d950fdfba4c8f4cfd68c38",
    newName: "Yoga for emotional resilience",
    tags: ["emotions", "thoughts"],
  },
  {
    _id: "67d950fdfba4c8f4cfd68c39",
    newName: "Yoga for Stamina",
    tags: ["morning energy", "vitallity", "and energetic start"],
  },
  {
    _id: "67d950fdfba4c8f4cfd68c3a",
    newName: "Yoga for bedtime relaxation",
    tags: ["night yoga", "yoga for good sleep"],
  },
  {
    _id: "67d950fdfba4c8f4cfd68c3b",
    newName: "Yoga for travelling",
    tags: ["travelling stress", "tiredness", "fatigue"],
  },
  {
    _id: "67d950fdfba4c8f4cfd68c3c",
    newName: "Yoga for digital detox",
    tags: ["mobile addiction", "gaming addiction", "digital addiction"],
  },
  {
    _id: "67d950fdfba4c8f4cfd68c3e",
    newName: "Yoga for society",
    tags: ["social interactions"],
  },
  {
    _id: "67d950fdfba4c8f4cfd68c40",
    newName: "Yoga for positivity",
    tags: ["gratitude", "positivity"],
  },
  {
    _id: "67d950fdfba4c8f4cfd68c41",
    newName: "Yoga for patience",
    tags: ["calm", "patience"],
  },
  {
    _id: "67d950fdfba4c8f4cfd68c43",
    newName: "Power Yoga",
    tags: ["weight loss", "strenght", "muscle tone"],
  },
  {
    _id: "67d950fdfba4c8f4cfd68c44",
    newName: "Yin Yoga",
    tags: ["yoga for deep relaxation"],
  },
  {
    _id: "67d950fdfba4c8f4cfd68c45",
    newName: "Yoga for healing",
    tags: ["restiorative yoga"],
  },
  {
    _id: "67d950fdfba4c8f4cfd68c46",
    newName: "Chair Yoga",
    tags: ["office yoga", "workers"],
  },
  {
    _id: "67d950fefba4c8f4cfd68c47",
    newName: "Acro Yoga",
    tags: ["Couple Yoga", "Partner yoga"],
  },
  {
    _id: "67d950fefba4c8f4cfd68c48",
    newName: "Prenatal Yoga",
    tags: ["Pregnancy"],
  },
  {
    _id: "67d950fefba4c8f4cfd68c49",
    newName: "Bikram Yoga",
    tags: ["Hot Yoga"],
  },
  {
    _id: "67d950fefba4c8f4cfd68c4a",
    newName: "Laughter Yoga",
    tags: ["happiness"],
  },
  {
    _id: "67d950fefba4c8f4cfd68c4b",
    newName: "Aerial Yoga",
    tags: ["flexibility"],
  },
  {
    _id: "67d950fefba4c8f4cfd68c4c",
    newName: "Ashtanga Yoga",
    tags: ["discipline"],
  },
];

const newUnique = [
  {
    _id: "67d950fcfba4c8f4cfd68bc0",
    newName: "Yoga for body transformation",
    tags: ["transform", "body changing", "body sculpting"],
  },
  {
    _id: "67d950fcfba4c8f4cfd68bca",
    newName: "Yoga for emotional Balance",
    tags: [
      "stress",
      "anxeity",
      "transformation",
      "emotional Balance",
      "improve mood",
    ],
  },
  {
    _id: "67d950fcfba4c8f4cfd68bd2",
    newName: "Yoga for sleep disorders",
    tags: [
      "sleep disorders",
      "insomia",
      "sleep apnea",
      "sound sleep",
      "good sleep",
      "peaceful sleep",
      "hot flashes",
      "head aches",
    ],
  },
  {
    _id: "67d950fcfba4c8f4cfd68bd4",
    newName: "Yoga for sleep disorders",
    tags: ["sound sleep", "good sleep", "peaceful sleep"],
  },
  {
    _id: "67d950fcfba4c8f4cfd68bd5",
    newName: "Yoga for sleep disorders",
    tags: [
      "sleep disorders",
      "insomia",
      "sleep apnea",
      "hot flashes",
      "head aches",
    ],
  },
  {
    _id: "67d950fcfba4c8f4cfd68bd8",
    newName: "Yoga for sleep disorders",
    tags: [
      "sleep disorders",
      "insomia",
      "sleep apnea",
      "hot flashes",
      "head aches",
    ],
  },
  {
    _id: "67d950fcfba4c8f4cfd68bd9",
    newName: "Yoga for sleep disorders",
    tags: [
      "sleep disorders",
      "insomia",
      "sleep apnea",
      "hot flashes",
      "head aches",
    ],
  },
  {
    _id: "67d950fdfba4c8f4cfd68bfa",
    newName: "Yoga for adults",
    tags: [
      "old age",
      "mid aged",
      "young adults",
      "office going",
      "house wifes",
      "newly married",
      "Yoga for people in their 30s and 40s",
    ],
  },
  {
    _id: "67d950fdfba4c8f4cfd68c3d",
    newName: "Yoga for digital detox",
    tags: ["mobile addiction", "gaming addiction", "digital addiction"],
  },
  {
    _id: "67d950fdfba4c8f4cfd68c3f",
    newName: "Yoga for addiction",
    tags: ["bad habbits", "addiction", "addiction recovery"],
  },
  {
    _id: "67d950fdfba4c8f4cfd68c42",
    newName: "Yoga for stress",
    tags: ["stress free life"],
  },
];

const addYogaCategory = async (req, res) => {
  try {
    // File should be exist
    if (!req.file)
      return failureResponse(res, 400, "Please..upload an image!", null);
    // Body Validation
    const { error } = validateYogaCategory(req.body);
    if (error) {
      deleteSingleFile(req.file.path); // Delete file from server
      return failureResponse(res, 400, error.details[0].message, null);
    }
    const yogaCategory = req.body.yogaCategory;
    // Find in data
    const category = await YogaCategory.findOne({ yogaCategory }).lean();
    if (category) {
      deleteSingleFile(req.file.path); // Delete file from server
      return failureResponse(res, 400, "Category already exist!");
    }
    // Upload file to bunny
    const fileStream = fs.createReadStream(req.file.path);
    await uploadFileToBunny(bunnyFolderName, fileStream, req.file.filename);
    // Delete file from server
    deleteSingleFile(req.file.path);
    const image = {
      fileName: req.file.filename,
      url: `${process.env.SHOW_BUNNY_FILE_HOSTNAME}/${bunnyFolderName}/${req.file.filename}`,
    };
    // Get Embedding
    const filterCategory = await removeSomeWord(yogaCategory);
    const combinedText = `${filterCategory} ${req.body.tags.join(" ")}`;
    const embedding = await getEmbedding(combinedText);
    // Create or update
    await YogaCategory.create({
      yogaCategory,
      description: req.body.description,
      tags: req.body.tags,
      image,
      embedding,
    });
    return successResponse(res, 201, `Added successfully!`);
  } catch (err) {
    failureResponse(res);
  }
};

const getYogaCategory = async (req, res) => {
  try {
    const search = req.query.search?.trim();
    const resultPerPage = req.query.resultPerPage
      ? parseInt(req.query.resultPerPage)
      : 20;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const skip = (page - 1) * resultPerPage;

    //Search
    const query = {};
    if (search) {
      const startWith = new RegExp("^" + search.toLowerCase(), "i");
      query.yogaCategory = startWith;
    }
    const [yogaCategory, totalYogaCategory] = await Promise.all([
      YogaCategory.find(query)
        .sort({ yogaCategory: 1 })
        .skip(skip)
        .limit(resultPerPage)
        .select("_id yogaCategory")
        .lean(),
      YogaCategory.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalYogaCategory / resultPerPage) || 0;
    return successResponse(res, 200, `Successfully!`, {
      data: yogaCategory,
      totalPages,
      currentPage: page,
    });
  } catch (err) {
    failureResponse(res);
  }
};

const yogaCategoryDetails = async (req, res) => {
  try {
    const yogaCategory = await YogaCategory.findById(req.params.id)
      .select("yogaCategory description image")
      .lean();
    if (!yogaCategory) {
      return failureResponse(
        res,
        400,
        `This YogaCategory is not present!`,
        null
      );
    }
    yogaCategory.image = yogaCategory.image
      ? yogaCategory.image.url || null
      : null;
    return successResponse(res, 200, `Successfully!`, { yogaCategory });
  } catch (err) {
    failureResponse(res);
  }
};

const getYogaCategoryWithImage = async (req, res) => {
  try {
    const resultPerPage = req.query.resultPerPage
      ? parseInt(req.query.resultPerPage)
      : 20;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const skip = (page - 1) * resultPerPage;

    //Search
    let query,
      yogaCategory,
      data = {},
      totalYogaCategory = {};
    if (req.query.search) {
      const queryForSearch = await finalQuery(req.query.search); // Query for first search
      const someCat = await YogaCategory.find(queryForSearch) // Search any data present
        .select("_id yogaCategory image")
        .lean();
      if (someCat.length > 2) {
        console.log("here");
        if (someCat.length >= 5) {
          yogaCategory = someCat.slice(0, 5);
        } else {
          const requiredResult = 5 - someCat.length;
          const result = await YogaCategory.aggregate([
            { $sample: { size: requiredResult } },
            { $project: { _id: 1, yogaCategory: 1, image: 1 } },
          ]);
          yogaCategory = [...someCat, ...result];
        }
      } else {
        // If not present data in query search then do embedded search
        const filterSearch = await removeSomeWord(req.query.search);
        const userEmbedding = await getEmbedding(filterSearch);
        const allCategory = await YogaCategory.find()
          .select("_id yogaCategory image embedding")
          .lean();
        const scoredCategories = allCategory.map((cat) => ({
          ...cat,
          similarity: cosineSimilarity(userEmbedding, cat.embedding),
        }));
        scoredCategories.sort((a, b) => b.similarity - a.similarity); // Descending order
        yogaCategory = scoredCategories.slice(0, 5); // Top 5 categories
      }
    } else {
      [yogaCategory, totalYogaCategory] = await Promise.all([
        YogaCategory.find()
          .sort({ yogaCategory: 1 })
          .skip(skip)
          .limit(resultPerPage)
          .select("_id yogaCategory image")
          .lean(),
        YogaCategory.countDocuments(query),
      ]);
      const totalPages = Math.ceil(totalYogaCategory / resultPerPage) || 0;
      data.totalPages = totalPages;
      data.currentPage = page;
    }
    // Optimized Parallel Counting for numberOfClass
    await Promise.all(
      yogaCategory.map(async (cat) => {
        const queryForYogaTutor = {
          yogaCategory: { $in: [cat._id] },
          classStartTimeInUTC: {
            $gte: new Date(new Date().toISOString().split("T")[0]),
          },
          isDelete: false,
        };
        const numberOfClass = await YogaTutorClass.countDocuments(
          queryForYogaTutor
        );

        cat.numberOfClass = numberOfClass;
        cat.image = cat.image ? cat.image.url || null : null;
        delete cat.similarity; // Only present if search was done
        delete cat.embedding;
      })
    );
    data.data = yogaCategory;
    return successResponse(res, 200, `Successfully!`, data);
  } catch (err) {
    console.log(err.message);
    failureResponse(res);
  }
};

const updateYogaCategoryImage = async (req, res) => {
  try {
    // File should be exist
    if (!req.file)
      return failureResponse(res, 400, "Please..upload an image!", null);
    const id = req.params.id;
    const yogaCategories = await YogaCategory.findById(id).lean();
    if (!yogaCategories) {
      deleteSingleFile(req.file.path); // Delete file from server
      return failureResponse(
        res,
        400,
        `This yoga category is not present!`,
        null
      );
    }
    // Upload file to bunny
    const fileStream = fs.createReadStream(req.file.path);
    await uploadFileToBunny(bunnyFolderName, fileStream, req.file.filename);
    // Delete file from server
    deleteSingleFile(req.file.path);
    const image = {
      fileName: req.file.filename,
      url: `${process.env.SHOW_BUNNY_FILE_HOSTNAME}/${bunnyFolderName}/${req.file.filename}`,
    };
    // Delete file from bunny if exist
    if (yogaCategories.image && yogaCategories.image.fileName) {
      deleteFileToBunny(bunnyFolderName, yogaCategories.image.fileName);
    }
    // Update record
    await YogaCategory.updateOne({ _id: id }, { $set: { image } });
    return successResponse(res, 201, `Updated successfully!`);
  } catch (err) {
    failureResponse(res);
  }
};

const deleteYogaCategory = async (req, res) => {
  try {
    const yogaCategory = await YogaCategory.findOne({ _id: req.params.id });
    if (!yogaCategory) {
      return failureResponse(
        res,
        400,
        `This yoga category is not present!`,
        null
      );
    }
    // Delete from all place
    await YogaTutorClass.updateMany(
      { yogaCategory: yogaCategory._id },
      { $pull: { yogaCategory: yogaCategory._id } }
    );
    // Delete image
    if (yogaCategory.image && yogaCategory.image.fileName) {
      deleteFileToBunny(bunnyFolderName, yogaCategory.image.fileName);
    }
    // delete
    await YogaCategory.deleteOne({ _id: req.params.id });
    return successResponse(res, 200, `Deleted successfully!`);
  } catch (err) {
    failureResponse(res);
  }
};

const updateYogaCategory = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateYogaCategory(req.body);
    if (error) {
      return failureResponse(res, 400, error.details[0].message, null);
    }
    const { yogaCategory, tags, description } = req.body;
    // Find Category
    const category = await YogaCategory.findById(req.params.id).lean();
    if (!category) {
      return failureResponse(
        res,
        400,
        `This yoga category is not present!`,
        null
      );
    }
    // Check is new category present
    if (category.yogaCategory !== yogaCategory) {
      const category = await YogaCategory.findOne({ yogaCategory })
        .select("_id")
        .lean();
      if (category) {
        return failureResponse(
          res,
          400,
          `This yoga category is already present!`,
          null
        );
      }
    }
    // Compare tags
    let embedding = category.embedding;
    const tagCam = await compareArrays(category.tags, tags);
    if (category.yogaCategory !== yogaCategory || !tagCam) {
      // Get Embedding
      const filterCategory = await removeSomeWord(yogaCategory);
      const combinedText = `${filterCategory} ${tags.join(" ")}`;
      embedding = await getEmbedding(combinedText);
    }
    // Update
    await YogaCategory.updateOne(
      { _id: req.params.id },
      {
        $set: {
          yogaCategory,
          tags,
          embedding,
          description,
        },
      }
    );
    return successResponse(res, 200, `Updated successfully!`);
  } catch (err) {
    failureResponse(res);
  }
};

export {
  addYogaCategory,
  getYogaCategory,
  yogaCategoryDetails,
  updateYogaCategoryImage,
  deleteYogaCategory,
  getYogaCategoryWithImage,
  updateYogaCategory,
};
