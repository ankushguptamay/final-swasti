import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { YogaCategory } from "../Model/Master/yogaCategoryModel.js";

const categories = [
  "Yoga for weight loss",
  "Yoga for weight gain",
  "Yoga for height increase",
  "Yoga for muscle toning",
  "Yoga for body flexibility",
  "Yoga for core strength",
  "Yoga for body detox",
  "Yoga for better blood circulation",
  "Yoga for posture correction",
  "Yoga for increasing stamina",
  "Yoga for body alignment",
  "Yoga for improving metabolism",
  "Yoga for full-body transformation",
  "Yoga for improving endurance",
  "Yoga for body sculpting",
  "Yoga for stress relief",
  "Yoga for anxiety management",
  "Yoga for depression relief",
  "Yoga for emotional healing",
  "Yoga for mindfulness and awareness",
  "Yoga for anger management",
  "Yoga for self-confidence",
  "Yoga for self-love and acceptance",
  "Yoga for self-discipline",
  "Yoga for improving mood",
  "Yoga for overcoming negative thoughts",
  "Yoga for inner peace",
  "Yoga for reducing overthinking",
  "Yoga for better emotional control",
  "Yoga for positive thinking",
  "Yoga for insomnia relief",
  "Yoga for deep relaxation",
  "Yoga for overcoming nightmares",
  "Yoga for bedtime routine",
  "Yoga for peaceful sleep",
  "Yoga for managing sleep disorders",
  "Yoga for relieving restlessness",
  "Yoga for calming the nervous system",
  "Yoga for reducing bedtime anxiety",
  "Yoga for lucid dreaming",
  "Yoga for better digestion",
  "Yoga for relieving constipation",
  "Yoga for reducing bloating and gas",
  "Yoga for acid reflux relief",
  "Yoga for gut health improvement",
  "Yoga for IBS (Irritable Bowel Syndrome)",
  "Yoga for detoxifying the liver",
  "Yoga for improving appetite",
  "Yoga for reducing indigestion",
  "Yoga for gut microbiome balance",
  "Yoga for PCOS management",
  "Yoga for menstrual pain relief",
  "Yoga for balancing hormones",
  "Yoga for irregular periods",
  "Yoga for pregnancy (Prenatal Yoga)",
  "Yoga for postpartum recovery",
  "Yoga for menopause relief",
  "Yoga for increasing fertility",
  "Yoga for breast health",
  "Yoga for reducing PMS symptoms",
  "Yoga for boosting testosterone",
  "Yoga for prostate health",
  "Yoga for erectile dysfunction",
  "Yoga for increasing stamina",
  "Yoga for boosting sperm count",
  "Yoga for building muscle strength",
  "Yoga for reducing belly fat in men",
  "Yoga for hair growth in men",
  "Yoga for beard growth",
  "Yoga for kids",
  "Yoga for teenagers",
  "Yoga for adults",
  "Yoga for seniors",
  "Yoga for people in their 30s and 40s",
  "Yoga for healthy aging",
  "Yoga for improving bone health",
  "Yoga for increasing memory power in seniors",
  "Yoga for better focus in students",
  "Yoga for hyperactive children",
  "Yoga for high blood pressure",
  "Yoga for low blood pressure",
  "Yoga for diabetes control",
  "Yoga for thyroid health",
  "Yoga for heart health",
  "Yoga for kidney health",
  "Yoga for arthritis relief",
  "Yoga for back pain relief",
  "Yoga for knee pain relief",
  "Yoga for neck pain relief",
  "Yoga for migraine and headaches",
  "Yoga for asthma and lung health",
  "Yoga for immune system boost",
  "Yoga for sinusitis relief",
  "Yoga for hair growth",
  "Yoga for glowing skin",
  "Yoga for reducing acne",
  "Yoga for varicose veins relief",
  "Yoga for tinnitus (ringing ears)",
  "Yoga for better concentration at work",
  "Yoga for creative thinking",
  "Yoga for reducing workplace stress",
  "Yoga for boosting energy at work",
  "Yoga for improving memory",
  "Yoga for maintaining focus during long hours",
  "Yoga for relieving work-related tension",
  "Yoga for handling job-related anxiety",
  "Yoga for balancing work-life stress",
  "Yoga for chakra balancing",
  "Yoga for Kundalini awakening",
  "Yoga for third-eye activation",
  "Yoga for deep meditation",
  "Yoga for developing intuition",
  "Yoga for connecting with the universe",
  "Yoga for spiritual awakening",
  "Yoga for enlightenment",
  "Yoga for increasing life force energy (Prana)",
  "Yoga for runners",
  "Yoga for swimmers",
  "Yoga for football players",
  "Yoga for bodybuilders",
  "Yoga for martial artists",
  "Yoga for increasing speed and agility",
  "Yoga for muscle recovery",
  "Yoga for improving balance and coordination",
  "Yoga for increasing flexibility in athletes",
  "Yoga for reducing injuries in sports",
  "Yoga for post-injury recovery",
  "Yoga for cancer recovery",
  "Yoga for post-surgery healing",
  "Yoga for autoimmune diseases",
  "Yoga for addiction recovery",
  "Yoga for trauma healing",
  "Yoga for reducing chronic pain",
  "Yoga for post-illness rehabilitation",
  "Yoga for overcoming fear and phobias",
  "Yoga for emotional resilience",
  "Yoga for morning energy boost",
  "Yoga for bedtime relaxation",
  "Yoga for travel-related stress relief",
  "Yoga for reducing phone addiction",
  "Yoga for digital detox",
  "Yoga for better social interactions",
  "Yoga for breaking bad habits",
  "Yoga for gratitude and positivity",
  "Yoga for increasing patience",
  "Yoga for living a stress-free life",
  "Power Yoga for weight loss",
  "Yin Yoga for deep relaxation",
  "Restorative Yoga for healing",
  "Chair Yoga for office workers",
  "Acro Yoga for couples",
  "Prenatal Yoga for pregnancy",
  "Bikram Yoga (Hot Yoga)",
  "Laughter Yoga for happiness",
  "Aerial Yoga for flexibility",
  "Ashtanga Yoga for discipline",
];

const connectDB = (uri) => {
  mongoose
    .connect(uri, { dbName: process.env.DB_NAME })
    .then(async (data) => {
      console.log("Database Connected successfully!");
    })
    .catch((err) => {
      throw err;
    });
};

// Drop the entire database put it at line 8
// await mongoose.connection.db.dropDatabase();
// console.log("Database dropped");

async function createY_C(categories) {
  try {
    console.log(new Date());
    for (let i = 0; i < categories.length; i++) {
      await YogaCategory.findOneAndUpdate(
        { yogaCategory: categories[i] },
        { updatedAt: new Date() },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
    console.log(new Date());
  } catch (error) {
    console.error("Error updating documents:", error);
  }
}

createY_C(categories);

export { connectDB };
