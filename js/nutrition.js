let _edamamSearchTimer = null;
/**
 * AnthrosAI — nutrition.js
 * Food tracking, AI scanner, Edamam search, encyclopedia
 */

'use strict';

// ── FOOD DATABASE ──────────────────────────────────────────
const FOOD_DB = [
  // PROTEIN
  {ico:"🐓",name:"Chicken Breast",cat:"protein",per:"100g",cals:165,p:31,c:0,f:3.6,fiber:0,zinc:1,iron:1,mag:29,calc:15,vitd:0},
  {ico:"🐓",name:"Chicken Thigh",cat:"protein",per:"100g",cals:209,p:26,c:0,f:11,fiber:0,zinc:2.4,iron:1.3,mag:22,calc:12,vitd:0},
  {ico:"🥩",name:"Beef Ribeye",cat:"protein",per:"100g",cals:291,p:24,c:0,f:21,fiber:0,zinc:5.4,iron:2.5,mag:20,calc:9,vitd:0},
  {ico:"🥩",name:"Beef Sirloin",cat:"protein",per:"100g",cals:207,p:26,c:0,f:11,fiber:0,zinc:4.8,iron:2.2,mag:22,calc:12,vitd:0},
  {ico:"🥩",name:"Beef Mince 80/20",cat:"protein",per:"100g",cals:254,p:17,c:0,f:20,fiber:0,zinc:4.2,iron:2.1,mag:18,calc:18,vitd:0},
  {ico:"🥩",name:"Beef Mince 90/10",cat:"protein",per:"100g",cals:196,p:21,c:0,f:12,fiber:0,zinc:4.8,iron:2.3,mag:21,calc:16,vitd:0},
  {ico:"🐟",name:"Salmon",cat:"protein",per:"100g",cals:208,p:20,c:0,f:13,fiber:0,zinc:0.6,iron:0.3,mag:27,calc:9,vitd:11.1},
  {ico:"🐟",name:"Tuna (canned)",cat:"protein",per:"100g",cals:116,p:26,c:0,f:1,fiber:0,zinc:0.9,iron:1.4,mag:31,calc:11,vitd:0},
  {ico:"🐟",name:"Mackerel",cat:"protein",per:"100g",cals:205,p:19,c:0,f:14,fiber:0,zinc:0.8,iron:1.6,mag:60,calc:12,vitd:16},
  {ico:"🐟",name:"Sardines",cat:"protein",per:"100g",cals:208,p:25,c:0,f:11,fiber:0,zinc:1.3,iron:2.9,mag:39,calc:382,vitd:4.8},
  {ico:"🦐",name:"Shrimp",cat:"protein",per:"100g",cals:99,p:24,c:0.2,f:0.3,fiber:0,zinc:1.5,iron:3,mag:35,calc:70,vitd:0},
  {ico:"🥚",name:"Whole Egg",cat:"protein",per:"1 egg (50g)",cals:72,p:6,c:0.4,f:5,fiber:0,zinc:0.6,iron:0.9,mag:6,calc:28,vitd:0.9},
  {ico:"🥚",name:"Egg White",cat:"protein",per:"1 white (33g)",cals:17,p:3.6,c:0.2,f:0.1,fiber:0,zinc:0,iron:0,mag:4,calc:2,vitd:0},
  {ico:"🧀",name:"Greek Yogurt 0%",cat:"dairy",per:"100g",cals:59,p:10,c:3.6,f:0.4,fiber:0,zinc:0.5,iron:0,mag:11,calc:111,vitd:0},
  {ico:"🧀",name:"Greek Yogurt Full",cat:"dairy",per:"100g",cals:97,p:9,c:3.9,f:5,fiber:0,zinc:0.5,iron:0,mag:11,calc:100,vitd:0},
  {ico:"🥛",name:"Kefir",cat:"dairy",per:"240ml",cals:150,p:9,c:12,f:5,fiber:0,zinc:1,iron:0.2,mag:26,calc:317,vitd:0},
  {ico:"🧀",name:"Cottage Cheese",cat:"dairy",per:"100g",cals:98,p:11,c:3.4,f:4.3,fiber:0,zinc:0.5,iron:0.1,mag:8,calc:83,vitd:0},
  {ico:"🧀",name:"Mozzarella",cat:"dairy",per:"100g",cals:280,p:18,c:2.2,f:22,fiber:0,zinc:2.9,iron:0.2,mag:20,calc:505,vitd:0},
  {ico:"🧀",name:"Parmesan",cat:"dairy",per:"28g",cals:111,p:10,c:0.9,f:7.3,fiber:0,zinc:1.3,iron:0.2,mag:12,calc:336,vitd:0},
  {ico:"💪",name:"Whey Protein",cat:"supps",per:"1 scoop (30g)",cals:120,p:24,c:3,f:1.5,fiber:0,zinc:0.5,iron:0.2,mag:15,calc:100,vitd:0},
  {ico:"💪",name:"Casein Protein",cat:"supps",per:"1 scoop (30g)",cals:115,p:24,c:3,f:1,fiber:0,zinc:0.5,iron:0.2,mag:15,calc:200,vitd:0},
  {ico:"🌱",name:"Tofu (firm)",cat:"protein",per:"100g",cals:76,p:8,c:1.9,f:4.2,fiber:0.3,zinc:1,iron:5.4,mag:37,calc:350,vitd:0},
  {ico:"🌱",name:"Tempeh",cat:"protein",per:"100g",cals:192,p:19,c:9,f:11,fiber:1.4,zinc:1.7,iron:2.7,mag:81,calc:111,vitd:0},
  {ico:"🫘",name:"Lentils (cooked)",cat:"protein",per:"100g",cals:116,p:9,c:20,f:0.4,fiber:7.9,zinc:1.3,iron:3.3,mag:36,calc:19,vitd:0},
  {ico:"🫘",name:"Chickpeas",cat:"protein",per:"100g",cals:164,p:9,c:27,f:2.6,fiber:7.6,zinc:1.5,iron:2.9,mag:48,calc:49,vitd:0},
  {ico:"🫘",name:"Black Beans",cat:"protein",per:"100g",cals:132,p:8.9,c:24,f:0.5,fiber:8.7,zinc:1,iron:2.1,mag:60,calc:27,vitd:0},
  {ico:"🦪",name:"Oysters",cat:"protein",per:"100g",cals:68,p:7,c:3.9,f:2.5,fiber:0,zinc:78,iron:5.5,mag:22,calc:45,vitd:0},
  // CARBS
  {ico:"🌾",name:"White Rice",cat:"carbs",per:"100g cooked",cals:130,p:2.7,c:28,f:0.3,fiber:0.4,zinc:0.5,iron:0.2,mag:12,calc:10,vitd:0},
  {ico:"🌾",name:"Brown Rice",cat:"carbs",per:"100g cooked",cals:123,p:2.6,c:26,f:1,fiber:1.8,zinc:0.6,iron:0.5,mag:44,calc:10,vitd:0},
  {ico:"🥣",name:"Oats",cat:"carbs",per:"100g dry",cals:389,p:17,c:66,f:7,fiber:10.6,zinc:4,iron:4.7,mag:177,calc:54,vitd:0},
  {ico:"🍠",name:"Sweet Potato",cat:"carbs",per:"100g",cals:86,p:1.6,c:20,f:0.1,fiber:3,zinc:0.3,iron:0.6,mag:25,calc:30,vitd:0},
  {ico:"🥔",name:"White Potato",cat:"carbs",per:"100g",cals:77,p:2,c:17,f:0.1,fiber:2.2,zinc:0.3,iron:0.8,mag:23,calc:12,vitd:0},
  {ico:"🍌",name:"Banana",cat:"fruit",per:"1 medium (120g)",cals:107,p:1.3,c:27,f:0.4,fiber:3.1,zinc:0.2,iron:0.3,mag:32,calc:6,vitd:0},
  {ico:"🫘",name:"Quinoa",cat:"carbs",per:"100g cooked",cals:120,p:4.4,c:22,f:1.9,fiber:2.8,zinc:1.1,iron:1.5,mag:64,calc:17,vitd:0},
  {ico:"🍞",name:"Whole Wheat Bread",cat:"carbs",per:"1 slice (30g)",cals:79,p:4,c:15,f:1,fiber:1.9,zinc:0.5,iron:1,mag:23,calc:24,vitd:0},
  {ico:"🍝",name:"Pasta (cooked)",cat:"carbs",per:"100g",cals:131,p:5,c:25,f:1.1,fiber:1.8,zinc:0.5,iron:1.3,mag:18,calc:7,vitd:0},
  {ico:"🫓",name:"Sourdough Bread",cat:"carbs",per:"1 slice (50g)",cals:130,p:5,c:25,f:1,fiber:1.5,zinc:0.6,iron:1.2,mag:18,calc:25,vitd:0},
  {ico:"🌽",name:"Corn",cat:"carbs",per:"100g",cals:86,p:3.2,c:19,f:1.2,fiber:2,zinc:0.5,iron:0.5,mag:37,calc:2,vitd:0},
  // FATS
  {ico:"🥑",name:"Avocado",cat:"fat",per:"1/2 (75g)",cals:120,p:1.5,c:6.4,f:11,fiber:4.8,zinc:0.5,iron:0.5,mag:22,calc:9,vitd:0},
  {ico:"🫒",name:"Olive Oil",cat:"fat",per:"1 tbsp (14g)",cals:119,p:0,c:0,f:13.5,fiber:0,zinc:0,iron:0,mag:0,calc:0,vitd:0},
  {ico:"🥥",name:"Coconut Oil",cat:"fat",per:"1 tbsp (13g)",cals:121,p:0,c:0,f:13.5,fiber:0,zinc:0,iron:0,mag:0,calc:0,vitd:0},
  {ico:"🧈",name:"Butter",cat:"fat",per:"1 tbsp (14g)",cals:102,p:0.1,c:0,f:11.5,fiber:0,zinc:0,iron:0,mag:0,calc:3,vitd:0.1},
  {ico:"🌰",name:"Almonds",cat:"fat",per:"28g (handful)",cals:164,p:6,c:6,f:14,fiber:3.5,zinc:0.9,iron:1.1,mag:76,calc:76,vitd:0},
  {ico:"🌰",name:"Walnuts",cat:"fat",per:"28g",cals:185,p:4.3,c:3.9,f:18.5,fiber:1.9,zinc:0.9,iron:0.8,mag:45,calc:28,vitd:0},
  {ico:"🌰",name:"Pumpkin Seeds",cat:"fat",per:"28g",cals:151,p:7,c:5,f:13,fiber:1.1,zinc:2.1,iron:4.2,mag:150,calc:12,vitd:0},
  {ico:"🌰",name:"Chia Seeds",cat:"fat",per:"28g",cals:138,p:4.7,c:12,f:8.7,fiber:9.8,zinc:1,iron:2.2,mag:95,calc:177,vitd:0},
  {ico:"🥜",name:"Peanut Butter",cat:"fat",per:"2 tbsp (32g)",cals:191,p:7,c:7,f:16,fiber:1.9,zinc:0.9,iron:0.6,mag:49,calc:17,vitd:0},
  // VEGETABLES
  {ico:"🥦",name:"Broccoli",cat:"veg",per:"100g",cals:34,p:2.8,c:6.6,f:0.4,fiber:2.6,zinc:0.4,iron:0.7,mag:21,calc:47,vitd:0},
  {ico:"🥬",name:"Spinach",cat:"veg",per:"100g",cals:23,p:2.9,c:3.6,f:0.4,fiber:2.2,zinc:0.5,iron:2.7,mag:79,calc:99,vitd:0},
  {ico:"🥬",name:"Kale",cat:"veg",per:"100g",cals:49,p:4.3,c:8.8,f:0.9,fiber:3.6,zinc:0.4,iron:1.5,mag:34,calc:150,vitd:0},
  {ico:"🫑",name:"Bell Pepper Red",cat:"veg",per:"100g",cals:31,p:1,c:7.2,f:0.3,fiber:2.1,zinc:0.2,iron:0.4,mag:12,calc:7,vitd:0},
  {ico:"🧅",name:"Onion",cat:"veg",per:"100g",cals:40,p:1.1,c:9.3,f:0.1,fiber:1.7,zinc:0.2,iron:0.2,mag:10,calc:23,vitd:0},
  {ico:"🍅",name:"Tomato",cat:"veg",per:"100g",cals:18,p:0.9,c:3.9,f:0.2,fiber:1.2,zinc:0.2,iron:0.3,mag:11,calc:10,vitd:0},
  {ico:"🥒",name:"Cucumber",cat:"veg",per:"100g",cals:15,p:0.7,c:3.6,f:0.1,fiber:0.5,zinc:0.2,iron:0.3,mag:13,calc:16,vitd:0},
  {ico:"🥕",name:"Carrot",cat:"veg",per:"100g",cals:41,p:0.9,c:10,f:0.2,fiber:2.8,zinc:0.2,iron:0.3,mag:12,calc:33,vitd:0},
  {ico:"🫛",name:"Asparagus",cat:"veg",per:"100g",cals:20,p:2.2,c:3.9,f:0.1,fiber:2.1,zinc:0.5,iron:2.1,mag:14,calc:24,vitd:0},
  {ico:"🧄",name:"Garlic",cat:"veg",per:"3 cloves (9g)",cals:13,p:0.6,c:3,f:0,fiber:0.2,zinc:0.1,iron:0.2,mag:2,calc:16,vitd:0},
  // FRUITS
  {ico:"🍓",name:"Strawberries",cat:"fruit",per:"100g",cals:32,p:0.7,c:7.7,f:0.3,fiber:2,zinc:0.1,iron:0.4,mag:13,calc:16,vitd:0},
  {ico:"🫐",name:"Blueberries",cat:"fruit",per:"100g",cals:57,p:0.7,c:14,f:0.3,fiber:2.4,zinc:0.2,iron:0.3,mag:6,calc:6,vitd:0},
  {ico:"🍊",name:"Orange",cat:"fruit",per:"1 medium (130g)",cals:62,p:1.2,c:15,f:0.2,fiber:3.1,zinc:0.1,iron:0.1,mag:13,calc:52,vitd:0},
  {ico:"🍎",name:"Apple",cat:"fruit",per:"1 medium (182g)",cals:95,p:0.5,c:25,f:0.3,fiber:4.4,zinc:0.1,iron:0.2,mag:9,calc:11,vitd:0},
  {ico:"🥝",name:"Kiwi",cat:"fruit",per:"1 medium (76g)",cals:46,p:0.9,c:11,f:0.4,fiber:2.3,zinc:0.1,iron:0.2,mag:17,calc:34,vitd:0},
  // DAIRY
  {ico:"🥛",name:"Whole Milk",cat:"dairy",per:"240ml",cals:149,p:8,c:12,f:8,fiber:0,zinc:1,iron:0.1,mag:27,calc:276,vitd:2.9},
  {ico:"🥛",name:"Skimmed Milk",cat:"dairy",per:"240ml",cals:83,p:8,c:12,f:0.2,fiber:0,zinc:1,iron:0.1,mag:24,calc:299,vitd:2.9},
  {ico:"🧀",name:"Cheddar",cat:"dairy",per:"28g",cals:113,p:7,c:0.4,f:9,fiber:0,zinc:1.1,iron:0.2,mag:8,calc:202,vitd:0.1},
  // SUPPLEMENTS
  {ico:"💊",name:"Creatine Monohydrate",cat:"supps",per:"5g",cals:0,p:0,c:0,f:0,fiber:0,zinc:0,iron:0,mag:0,calc:0,vitd:0},
  {ico:"💊",name:"ZMA (Zinc+Mag+B6)",cat:"supps",per:"3 caps",cals:5,p:0,c:0.5,f:0,fiber:0,zinc:30,iron:0,mag:450,calc:0,vitd:0},
  {ico:"💊",name:"Omega-3 Fish Oil",cat:"supps",per:"2 caps",cals:18,p:0,c:0,f:2,fiber:0,zinc:0,iron:0,mag:0,calc:0,vitd:0},
  {ico:"💊",name:"Vitamin D3 (4000 IU)",cat:"supps",per:"1 cap",cals:0,p:0,c:0,f:0,fiber:0,zinc:0,iron:0,mag:0,calc:0,vitd:100},
  {ico:"💊",name:"Magnesium Glycinate",cat:"supps",per:"2 caps",cals:0,p:0,c:0,f:0,fiber:0,zinc:0,iron:0,mag:200,calc:0,vitd:0},
];

// ── NUTRIENTS ENCYCLOPEDIA ─────────────────────────────────
const NUTRIENTS = [
  {ico:"🥩",nm:"Protein",dv:"50g/day",short:"Builds and repairs all muscle tissue",body:"Protein is made of amino acids — the building blocks of every cell. Without adequate protein, your body cannot repair muscle tissue after training, produce enzymes or hormones, or maintain immune function. Muscle loss accelerates dramatically when intake is insufficient.",foods:["Chicken","Eggs","Whey","Salmon","Greek Yogurt","Lentils","Beef","Tofu"],fact:"Athletes need 1.6–2.2g per kg of bodyweight daily for optimal muscle protein synthesis."},
  {ico:"🍞",nm:"Carbohydrates",dv:"275g/day",short:"Primary fuel for brain and muscles",body:"Carbohydrates are your body's preferred energy source, broken down into glucose to power your brain and muscles. Without them, your body enters gluconeogenesis — making glucose from muscle protein, causing muscle breakdown. Complex carbs also feed your gut microbiome via fiber.",foods:["Oats","Rice","Sweet Potato","Banana","Quinoa","Pasta"],fact:"Your brain alone consumes ~120g of glucose per day even at rest."},
  {ico:"🥑",nm:"Healthy Fats",dv:"78g/day",short:"Hormones, cell membranes and vitamin absorption",body:"Dietary fat is essential for absorbing vitamins A, D, E and K. It forms every cell membrane and is the raw material for testosterone, estrogen and cortisol. Without fat, your hormonal system collapses. Omega-3s reduce inflammation and support heart health.",foods:["Avocado","Salmon","Almonds","Olive Oil","Eggs","Walnuts","Chia Seeds"],fact:"Testosterone production drops significantly when fat falls below 15% of total calories."},
  {ico:"🦪",nm:"Zinc",dv:"11mg/day",short:"Immunity, testosterone and wound healing",body:"Zinc is involved in over 300 enzymatic reactions. Critical for immune function — without it, immune cells cannot multiply or fight pathogens. Zinc is also essential for testosterone synthesis; deficiency is directly linked to low T levels. Required for DNA synthesis, cell division and wound healing.",foods:["Oysters","Beef","Pumpkin Seeds","Cashews","Chickpeas","Lentils"],fact:"Oysters contain more zinc per serving than any other food — one oyster provides ~5mg."},
  {ico:"🩸",nm:"Iron",dv:"18mg/day",short:"Oxygen transport and energy production",body:"Iron is the core of hemoglobin — the protein that carries oxygen from your lungs to every cell. Without it, cells starve of oxygen, causing fatigue, brain fog and poor performance. Iron is also a cofactor in mitochondrial ATP synthesis.",foods:["Spinach","Red Meat","Lentils","Tofu","Quinoa","Dark Chocolate","Kidney Beans"],fact:"Heme iron from animals is absorbed 2–3x more efficiently than non-heme iron from plants."},
  {ico:"🥦",nm:"Magnesium",dv:"400mg/day",short:"Muscle, sleep quality and 300+ enzyme reactions",body:"Magnesium participates in over 300 biochemical reactions: energy production, protein synthesis, muscle contraction, nerve transmission and blood pressure. Without it, muscles cramp, sleep quality tanks (it regulates GABA), and anxiety increases. Over 50% of people are deficient.",foods:["Spinach","Almonds","Dark Chocolate","Avocado","Pumpkin Seeds","Black Beans"],fact:"Magnesium deficiency is the second most common nutritional deficiency in developed countries."},
  {ico:"🦴",nm:"Calcium",dv:"1000mg/day",short:"Bones, muscle contractions and nerve signals",body:"99% of your calcium is stored in bones and teeth. But it is also critical for every muscle contraction — including your heartbeat. Without it, your body leaches calcium from bones, leading to osteoporosis. Every single muscle movement requires calcium-triggered signaling.",foods:["Dairy","Kale","Sardines","Tofu","Almonds","Broccoli","Fortified Foods"],fact:"Your body cannot absorb calcium without adequate Vitamin D — they work as a team."},
  {ico:"☀️",nm:"Vitamin D",dv:"20µg/day",short:"Immunity, testosterone and bone density",body:"Vitamin D acts as a hormone, binding to receptors in virtually every cell. Essential for calcium absorption, immune modulation, testosterone production, mood regulation and muscle function. Over 1 billion people worldwide are deficient due to indoor lifestyles.",foods:["Sunlight","Salmon","Sardines","Egg Yolk","Fortified Milk","Mushrooms"],fact:"15–20 minutes of midday sun on your skin produces 10,000–20,000 IU of Vitamin D."},
  {ico:"🥕",nm:"Fiber",dv:"28g/day",short:"Gut health, satiety and blood sugar control",body:"Fiber feeds your gut microbiome — the 100 trillion bacteria that regulate immune function, mood (90% of serotonin is made in the gut), inflammation and metabolism. Soluble fiber slows glucose absorption, preventing blood sugar spikes. Without fiber, gut bacteria diversity collapses.",foods:["Lentils","Oats","Chia Seeds","Avocado","Broccoli","Apples","Black Beans"],fact:"People with diverse gut microbiomes have significantly lower rates of obesity and depression."},
  {ico:"🌿",nm:"Manganese",dv:"2.3mg/day",short:"Antioxidant defense and bone formation",body:"Manganese is a cofactor for superoxide dismutase, the main antioxidant enzyme that neutralizes free radicals damaging cells and accelerating aging. Also critical for bone formation, blood clotting, and carbohydrate and protein metabolism.",foods:["Oats","Brown Rice","Pineapple","Spinach","Tempeh","Tea"],fact:"Your body contains only 10–20mg of manganese total, but it is essential for dozens of enzymes."},
  {ico:"🍑",nm:"Boron",dv:"3mg/day",short:"Testosterone, bone health and brain function",body:"Boron significantly boosts testosterone — studies show up to 25% increase in free testosterone at 10mg per day in just one week. It enhances bone mineral density, improves cognitive function including memory and attention, and helps metabolize estrogen. Athletes and men over 30 benefit most.",foods:["Prunes","Raisins","Apricots","Avocado","Almonds","Walnuts"],fact:"A 2015 study showed 10mg of boron daily for 4 weeks significantly increased free testosterone and reduced estrogen."},
  {ico:"💊",nm:"Vitamin B12",dv:"2.4µg/day",short:"Nerve function, DNA and red blood cells",body:"B12 is essential for forming red blood cells, DNA synthesis and neurological function. Without it, nerves degenerate — causing tingling, numbness, memory loss and eventually permanent nerve damage. B12 is only found naturally in animal products, making vegans highly susceptible to deficiency.",foods:["Beef","Salmon","Eggs","Dairy","Liver","Sardines","Fortified Foods"],fact:"Neurological damage from B12 deficiency can become permanent if not treated within 6 months."},
  {ico:"🐟",nm:"Omega-3",dv:"1.6g/day",short:"Inflammation control and brain health",body:"EPA and DHA are the most potent natural anti-inflammatories available. Without them, chronic inflammation increases risk of heart disease, depression, cognitive decline and joint pain. DHA makes up 97% of the omega-3 fat in your brain and is critical for cognitive function.",foods:["Salmon","Mackerel","Sardines","Chia Seeds","Walnuts","Flaxseed"],fact:"The ideal omega-6 to omega-3 ratio is 4:1. Most Western diets are 15:1 or higher."},
  {ico:"🍌",nm:"Potassium",dv:"4700mg/day",short:"Muscle contractions and heart rhythm",body:"Potassium works opposite to sodium in a pump that powers every nerve impulse and muscle contraction — including your heartbeat. Without adequate potassium, muscles cramp, blood pressure rises and arrhythmias can develop. It is the most underconsumed mineral in modern diets.",foods:["Banana","Sweet Potato","Spinach","Avocado","Salmon","White Beans"],fact:"Less than 2% of Americans meet the recommended daily potassium intake."},
  {ico:"🍊",nm:"Vitamin C",dv:"90mg/day",short:"Collagen synthesis, immunity and antioxidant",body:"Vitamin C is required for synthesizing collagen — the most abundant protein in your body, forming tendons, ligaments, skin and blood vessels. Without it, wounds do not heal and connective tissue breaks down. It is also a powerful antioxidant that enhances iron absorption from plant foods.",foods:["Bell Peppers","Kiwi","Strawberries","Broccoli","Oranges","Papaya"],fact:"Bell peppers contain 3x more Vitamin C than oranges by weight."}
];

// Global search instance (prevents _foodSearch undefined error)
window._foodSearch = null;
let _analyzedFood = null;
let _scannedFood = null;

function updateMacroDisplay() {
  totalCals = Object.values(foodLog).flat().reduce((a,b)=>a+b.cal,0);
  totalPro = Object.values(foodLog).flat().reduce((a,b)=>a+b.pro,0);
  totalCarb = Object.values(foodLog).flat().reduce((a,b)=>a+b.carb,0);
  totalFat = Object.values(foodLog).flat().reduce((a,b)=>a+b.fat,0);

  document.getElementById('ringNum').textContent = totalCals.toLocaleString();
  document.getElementById('proE').textContent = totalPro;
  document.getElementById('carbE').textContent = totalCarb;
  document.getElementById('fatE').textContent = totalFat;

  const pct = Math.min(1, totalCals / Math.max(1, U.calories));
  document.getElementById('ringCalFill').style.strokeDashoffset = 314 * (1-pct);

  document.getElementById('proFill').style.width = Math.min(100,(totalPro/Math.max(1,U.protein))*100)+'%';
  document.getElementById('carbFill').style.width = Math.min(100,(totalCarb/Math.max(1,U.carbs))*100)+'%';
  document.getElementById('fatFill').style.width = Math.min(100,(totalFat/Math.max(1,U.fats))*100)+'%';

  const left = Math.max(0, U.calories - totalCals);
  var e = function(id){ return document.getElementById(id); };
  if(e('stat4Cal')) e('stat4Cal').textContent = left.toLocaleString();
  if(e('nsEaten')) e('nsEaten').textContent = totalCals;
  if(e('nsLeft')) e('nsLeft').textContent = left;

  // V5 nutrition page elements
  if(e('msEaten')) e('msEaten').textContent = totalCals;
  if(e('msProtein')) e('msProtein').textContent = Math.round(totalPro);
  if(e('msProteinTarget')) e('msProteinTarget').textContent = U.protein || 0;
  if(e('msCarbs')) e('msCarbs').textContent = Math.round(totalCarb);
  if(e('msCarbsTarget')) e('msCarbsTarget').textContent = U.carbs || 0;
  if(e('msFat')) e('msFat').textContent = Math.round(totalFat);
  if(e('msFatTarget')) e('msFatTarget').textContent = U.fats || 0;
  if(e('barProtein')) e('barProtein').style.width = Math.min(100,(totalPro/Math.max(1,U.protein))*100)+'%';
  if(e('barCarbs')) e('barCarbs').style.width = Math.min(100,(totalCarb/Math.max(1,U.carbs))*100)+'%';
  if(e('barFat')) e('barFat').style.width = Math.min(100,(totalFat/Math.max(1,U.fats))*100)+'%';
  // V5 calorie ring
  if(e('ringCal')) {
    var calPct = Math.min(1, totalCals / Math.max(1, U.calories));
    e('ringCal').style.strokeDashoffset = 213.6 * (1 - calPct);
  }
  // V5 macro badges with color coding
  var setPctBadge = function(baseId, val, target) {
    var pct = Math.round((val/Math.max(1,target))*100);
    var pEl = e('pct' + baseId);
    var bEl = e('mbar-' + baseId.toLowerCase());
    if(pEl) { pEl.textContent = pct+'%'; pEl.className = 'mbadge-pct ' + (pct>=100?'red':pct>=70?'green':'grey'); }
    if(bEl) { bEl.style.width = Math.min(100,pct)+'%'; bEl.style.background = pct>=100?'#FF3B3B':pct>=70?'#34C759':'#636366'; }
  };
  setPctBadge('Energy', totalCals, U.calories||2000);
  setPctBadge('Protein', totalPro, U.protein||150);
  setPctBadge('Carbs', totalCarb, U.carbs||250);
  setPctBadge('Fat', totalFat, U.fats||65);
}

function renderMealBlocks() {
  const c = document.getElementById('mealBlocks');
  if (!c) return;
  c.innerHTML = '';
  ['Breakfast','Lunch','Dinner','Snack'].forEach(meal => {
    const items = foodLog[meal];
    const mCals = items.reduce((a,b)=>a+b.cal,0);
    const blk = document.createElement('div');
    blk.className = 'meal-blk';
    const entriesHtml = items.map(f=>`
      <div class="food-entry-row">
        <div><div class="fer-name">${f.name}</div><div class="fer-macros">P:${f.pro}g · C:${f.carb}g · F:${f.fat}g</div></div>
        <div class="fer-cal">${f.cal}</div>
      </div>`).join('');
    blk.innerHTML = `
      <div class="meal-blk-hd" onclick="openFoodModal('${meal}')">
        <span class="meal-blk-name">${meal.toUpperCase()}</span>
        <span class="meal-blk-cals">${mCals>0?mCals+' kcal':'Add food +'}</span>
      </div>
      ${entriesHtml}
    `;
    c.appendChild(blk);
  });
}

function renderWater() {
  const c = document.getElementById('waterGlasses');
  if (!c) return;
  c.innerHTML = '';
  for (let i = 0; i < 8; i++) {
    const filled = i < waterGlasses;
    const g = document.createElement('div');
    g.className = 'wg-item' + (filled ? ' wg-filled' : '');
    g.onclick = () => { 
      waterGlasses = waterGlasses === i+1 ? i : i+1; 
      renderWater(); 
      var wc = document.getElementById('waterCount');
      var wb = document.getElementById('waterBar');
      if (wc) wc.textContent = waterGlasses;
      if (wb) wb.style.width = (waterGlasses/8*100) + '%';
    };
    g.innerHTML = `<svg viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 8 L27 8 L24 36 Q23 40 16 40 Q9 40 8 36 Z" 
            fill="${filled ? 'rgba(52,199,89,0.2)' : 'rgba(255,255,255,0.04)'}" 
            stroke="${filled ? '#34C759' : 'rgba(255,255,255,0.2)'}" stroke-width="1.5"/>
      ${filled ? `<path d="M8.5 28 L23.5 28 L22 36 Q21 39 16 39 Q11 39 10 36 Z" fill="${i<4?'#34C759':'#30D158'}" opacity="0.8"/>` : ''}
      <path d="M5 8 Q5 4 8 4 L24 4 Q27 4 27 8" fill="none" stroke="${filled?'#34C759':'rgba(255,255,255,0.15)'}" stroke-width="1.5"/>
      <text x="16" y="24" text-anchor="middle" font-size="11" fill="${filled?'#34C759':'rgba(255,255,255,0.2)'}">${filled?'💧':''}</text>
    </svg>`;
    c.appendChild(g);
  }
  // update count display
  var wc = document.getElementById('waterCount');
  var wb = document.getElementById('waterBar');
  if (wc) wc.textContent = waterGlasses;
  if (wb) wb.style.width = (waterGlasses/8*100) + '%';
}

function logFood() {
  const name = document.getElementById('m-fname').value.trim();
  const cal = parseInt(document.getElementById('m-cal').value)||0;
  const pro = parseFloat(document.getElementById('m-pro').value)||0;
  const carb = parseFloat(document.getElementById('m-carb').value)||0;
  const fat = parseFloat(document.getElementById('m-fat').value)||0;
  if (!name) { document.getElementById('m-fname').classList.add('error'); return; }
  foodLog[selectedMeal].push({name,cal,pro,carb,fat});
  updateMacroDisplay();
  renderMealBlocks();
  ['m-fname','m-cal','m-pro','m-carb','m-fat'].forEach(id => document.getElementById(id).value = '');
  closeFoodModal();
}

function selMealTab(el, meal) {
  document.querySelectorAll('#mealTabs .mtab').forEach(t => t.classList.remove('sel'));
  el.classList.add('sel');
  selectedMeal = meal;
}

function selMealTabByName(meal) {
  document.querySelectorAll('#mealTabs .mtab').forEach((t,i) => {
    const names = ['Breakfast','Lunch','Dinner','Snack'];
    t.classList.toggle('sel', names[i] === meal);
  });
}

function openFoodModal(meal) {
  if (meal) { selectedMeal = meal; selMealTabByName(meal); }
  document.getElementById('foodModalBg').classList.add('open');
}

function closeFoodModal() { document.getElementById('foodModalBg').classList.remove('open'); }

function renderFoodDB() {
  var list = document.getElementById('foodDbList');
  if (!list) return;
  var q = _foodSearch;
  var cat = _foodCat;
  
  var filtered = FOOD_DB.filter(function(f) {
    var matchCat = cat === 'all' || f.cat === cat;
    var matchSearch = !q || f.name.toLowerCase().indexOf(q) > -1;
    return matchCat && matchSearch;
  });

  var lbl = document.getElementById('foodsResultLabel');
  if (lbl) lbl.textContent = (q ? '"'+q+'" — ' : '') + filtered.length + ' foods';
  
  if (!filtered.length) {
    list.innerHTML = '<div style="text-align:center;color:var(--muted2);padding:32px;font-size:.85rem">No foods found for "' + q + '"</div>';
    return;
  }

  list.innerHTML = filtered.map(function(f, i) {
    var isFav = _favorites.some(function(fav){ return fav.name === f.name; });
    var realIdx = FOOD_DB.indexOf(f);
    return '<div class="food-row" onclick="quickLogFood(' + realIdx + ')">'
      + '<div class="food-row-ico">' + f.ico + '</div>'
      + '<div class="food-row-info">'
      + '<div class="food-row-name">' + f.name + '</div>'
      + '<div class="food-row-meta">' + f.per + ' · ' + f.cals + ' kcal · P:' + f.p + 'g C:' + f.c + 'g F:' + f.f + 'g</div>'
      + '</div>'
      + '<div class="food-row-right">'
      + '<span class="food-row-src">FG DB</span>'
      + '<button class="food-row-star" onclick="event.stopPropagation();toggleFavorite(' + realIdx + ')" title="' + (isFav?'Remove from favorites':'Add to favorites') + '">' + (isFav?'⭐':'☆') + '</button>'
      + '<button class="food-row-add" onclick="event.stopPropagation();quickLogFood(' + realIdx + ')">+</button>'
      + '</div>'
      + '</div>';
  }).join('');
}

function switchFoodsTab(tab, el) {
  _foodsTab = tab;
  document.querySelectorAll('.ftab').forEach(function(b){ b.classList.remove('ftab-sel'); });
  if (el) el.classList.add('ftab-sel');
  document.getElementById('foods-tab-all').style.display = tab==='all' ? 'block' : 'none';
  document.getElementById('foods-tab-favs').style.display = tab==='favs' ? 'block' : 'none';
  document.getElementById('foods-tab-custom').style.display = tab==='custom' ? 'block' : 'none';
  if (tab === 'favs') renderFavorites();
  if (tab === 'all') renderFoodDB();
}

function setFoodCat(cat, el) {
  _foodCat = cat;
  document.querySelectorAll('.cat-chip').forEach(function(c){ c.classList.remove('active'); });
  if (el) el.classList.add('active');
  renderFoodDB();
}

function foodsPageFilter(q) {
  _foodSearch = q.toLowerCase();
  if (_foodsTab !== 'all') switchFoodsTab('all', document.getElementById('ftab-all'));
  renderFoodDB();
}

function quickLogFood(idx) {
  var f = FOOD_DB[idx];
  if (!f) return;
  // Determine meal based on time
  var h = new Date().getHours();
  var meal = h < 11 ? 'Breakfast' : h < 14 ? 'Lunch' : h < 18 ? 'Dinner' : 'Snack';
  foodLog[meal].push({name: f.ico + ' ' + f.name, cal: f.cals, pro: f.p, carb: f.c, fat: f.f});
  updateMacroDisplay();
  renderMealBlocks();
  showToast(f.name + ' → ' + meal + ' ✓', 'ok');
}

function toggleFavorite(idx) {
  var f = FOOD_DB[idx];
  if (!f) return;
  var existingIdx = _favorites.findIndex(function(fav){ return fav.name === f.name; });
  if (existingIdx > -1) {
    _favorites.splice(existingIdx, 1);
    showToast(f.name + ' removed from favorites', 'ok');
  } else {
    _favorites.push(f);
    showToast('⭐ ' + f.name + ' added to favorites!', 'ok');
  }
  renderFoodDB();
  renderFavorites();
}

function renderFavorites() {
  var list = document.getElementById('favoritesList');
  var empty = document.getElementById('favoritesEmpty');
  if (!list) return;
  if (!_favorites.length) {
    if (empty) empty.style.display = 'block';
    list.innerHTML = '';
    return;
  }
  if (empty) empty.style.display = 'none';
  list.innerHTML = _favorites.map(function(f, i) {
    var realIdx = FOOD_DB.indexOf(f);
    return '<div class="food-row" onclick="quickLogFood(' + realIdx + ')">'
      + '<div class="food-row-ico">' + f.ico + '</div>'
      + '<div class="food-row-info">'
      + '<div class="food-row-name">' + f.name + '</div>'
      + '<div class="food-row-meta">' + f.per + ' · ' + f.cals + ' kcal · P:' + f.p + 'g</div>'
      + '</div>'
      + '<div class="food-row-right">'
      + '<button class="food-row-star" onclick="event.stopPropagation();toggleFavorite(' + realIdx + ')">⭐</button>'
      + '<button class="food-row-add" onclick="event.stopPropagation();quickLogFood(' + realIdx + ')">+</button>'
      + '</div></div>';
  }).join('');
}

function openSuggestFood() {
  var m = document.getElementById('suggestFoodModal');
  if (m) { m.classList.add('open'); return; }
  showToast('Suggest Food feature coming soon!', 'ok');
}

function closeSuggestFood() {
  var m = document.getElementById('suggestFoodModal');
  if (m) m.classList.remove('open');
}

async function getSuggestions() {
  var diet = '';
  document.querySelectorAll('.sf-diet-btn.sel').forEach(function(b){ diet += b.dataset.val + ' '; });
  var cat = '';
  document.querySelectorAll('.sf-cat-btn.sel').forEach(function(b){ cat += b.dataset.val + ' '; });
  
  var loadBtn = document.getElementById('getSuggestionsBtn');
  if (loadBtn) { loadBtn.textContent = 'Getting suggestions...'; loadBtn.disabled = true; }
  
  var prompt = 'I am a ' + (U.weight||80) + 'kg person with a daily calorie target of ' + (U.calories||2000) + ' kcal. '
    + 'I have eaten ' + totalCals + ' kcal today. '
    + (diet ? 'Dietary preferences: ' + diet + '.' : '') + ' '
    + (cat ? 'I want food suggestions for: ' + cat + '.' : 'Suggest 5 foods for my next meal.') + ' '
    + 'List 5 specific foods with their approximate calories and macros. Be concise and practical.';
  
  try {
    var res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 600,
        messages: [{role: 'user', content: prompt}]
      })
    });
    var data = await res.json();
    var reply = data.content ? data.content.map(function(b){return b.text||'';}).join('') : 'Try again';
    var resultsEl = document.getElementById('suggestResults');
    if (resultsEl) {
      resultsEl.innerHTML = '<div style="white-space:pre-wrap;font-size:.85rem;line-height:1.6;background:var(--card);padding:14px;border-radius:12px">' + reply + '</div>';
    }
  } catch(e) {
    var resultsEl = document.getElementById('suggestResults');
    if (resultsEl) resultsEl.innerHTML = '<div style="color:var(--muted2);font-size:.8rem">AI suggestions only work inside Claude.ai</div>';
  }
  if (loadBtn) { loadBtn.textContent = 'GET SUGGESTIONS'; loadBtn.disabled = false; }
}

function toggleSFFilter(el) {
  el.classList.toggle('sel');
}

function qf(name, cal, pro, carb, fat) {
  document.getElementById('m-fname').value = name;
  document.getElementById('m-cal').value = cal;
  document.getElementById('m-pro').value = pro;
  document.getElementById('m-carb').value = carb;
  document.getElementById('m-fat').value = fat;
}

function buildNutrGrid(list) {
  var grid = document.getElementById('nlGrid');
  if (!grid) return;
  window._nutrList = list;
  grid.innerHTML = '';
  list.forEach(function(n, idx) {
    var card = document.createElement('div');
    card.className = 'nc-accordion';
    var header = document.createElement('div');
    header.className = 'nc-header';
    header.onclick = function(){ toggleNutrAccordion(header); };
    var ico = document.createElement('span');
    ico.className = 'nc-ico-sm';
    ico.textContent = n.ico;
    var nm = document.createElement('span');
    nm.className = 'nc-nm';
    nm.textContent = n.nm;
    var dv = document.createElement('span');
    dv.className = 'nc-dv-lbl';
    dv.textContent = n.dv || '';
    var btnWrap = document.createElement('div');
    btnWrap.style.cssText = 'display:flex;align-items:center;gap:6px;margin-left:auto';
    var menuBtn = document.createElement('button');
    menuBtn.className = 'nc-menu-btn';
    menuBtn.title = 'More';
    menuBtn.textContent = '⋮';
    (function(capturedN){ menuBtn.onclick = function(e){ e.stopPropagation(); openNutrMenu(menuBtn, capturedN); }; })(n);
    var chev = document.createElement('span');
    chev.className = 'nc-chev';
    chev.textContent = '›';
    btnWrap.appendChild(menuBtn);
    btnWrap.appendChild(chev);
    header.appendChild(ico);
    header.appendChild(nm);
    header.appendChild(dv);
    header.appendChild(btnWrap);
    var body = document.createElement('div');
    body.className = 'nc-body';
    body.style.display = 'none';
    var shortDiv = document.createElement('div'); shortDiv.className = 'nc-short'; shortDiv.textContent = n.short||'';
    var fullDiv = document.createElement('div'); fullDiv.className = 'nc-full'; fullDiv.textContent = (n.body||'').substring(0,200)+(n.body&&n.body.length>200?'…':'');
    var foodsDiv = document.createElement('div'); foodsDiv.className = 'nc-foods';
    foodsDiv.innerHTML = '<span class="nc-foods-lbl">🍽 Top foods: </span>' + (n.foods||[]).slice(0,4).join(', ');
    body.appendChild(shortDiv); body.appendChild(fullDiv); body.appendChild(foodsDiv);
    if (n.fact) { var factDiv = document.createElement('div'); factDiv.className = 'nc-fact'; factDiv.textContent = '💡 ' + n.fact; body.appendChild(factDiv); }
    card.appendChild(header); card.appendChild(body);
    grid.appendChild(card);
  });
}

function toggleNutrLib() {
  var el  = document.getElementById('nlCollapse');
  var tog = document.getElementById('nlToggle');
  if (!el) return;
  var opening = (el.style.display === 'none' || el.style.display === '');
  el.style.display = opening ? 'block' : 'none';
  if (tog) tog.textContent = opening ? '\u25b4' : '\u25be';
  if (opening) {
    var grid = document.getElementById('nlGrid');
    if (grid && grid.children.length === 0) buildNutrGrid(NUTRIENTS);
  }
}

function filterNutr(q) {
  buildNutrGrid(q ? NUTRIENTS.filter(function(n){ return n.nm.toLowerCase().includes(q.toLowerCase()) || n.short.toLowerCase().includes(q.toLowerCase()); }) : NUTRIENTS);
}

function toggleNutrAccordion(header) {
  var body = header.nextElementSibling;
  var chev = header.querySelector('.nc-chev');
  var isOpen = body.style.display !== 'none';
  // Close all others
  document.querySelectorAll('.nc-accordion .nc-body').forEach(function(b) {
    b.style.display = 'none';
    var c = b.previousElementSibling.querySelector('.nc-chev');
    if (c) c.textContent = '›';
  });
  if (!isOpen) {
    body.style.display = 'block';
    if (chev) chev.textContent = '∨';
  }
}

function openNutrDetail(n) {
  var modal = document.getElementById('nutrDetailModal');
  var content = document.getElementById('nutrDetailContent');
  if (!modal || !content) return;
  content.innerHTML = '<div class="modal-handle"></div><div class="nd-hero"><div class="nd-ico">'+n.ico+'</div><div class="nd-title">'+n.nm+'</div><div class="nd-sub">'+n.short+'</div></div><div class="nd-sec">What it does in your body</div><div class="nd-text">'+n.body+'</div><div class="nd-sec">Daily Value</div><div class="nd-dv">Recommended: '+n.dv+'</div><div class="nd-sec">Best food sources</div><div class="nd-chips">'+n.foods.map(function(f){return '<div class="nd-chip">'+f+'</div>';}).join('')+'</div><div class="nd-sec">Key fact</div><div class="nd-fact">💡 '+n.fact+'</div>';
  modal.classList.add('open');
}

function closeNutrModal() { var m = document.getElementById('nutrDetailModal'); if (m) m.classList.remove('open'); }

function renderDV() {
  var list = document.getElementById('dvList');
  if (!list) return;
  list.innerHTML = '';
  if (!isPro) {
    list.innerHTML = '<div class="pro-lock"><div class="plo-ico">🔒</div><div class="plo-title">PRO Feature</div><div class="plo-sub">Track zinc, iron, magnesium, calcium, vitamin D and fiber. Get red/grey warnings when you exceed daily targets.</div><button class="plo-btn" onclick="openPaywall()">👑 Unlock PRO</button></div>';
    return;
  }
  Object.keys(DV_REF).forEach(function(key) {
    var ref = DV_REF[key];
    var amt = microTotals[key] || 0;
    var pct = Math.round((amt / ref.dv) * 100);
    var isOver = pct > 100;
    var barColor = isOver ? '#FF3B3B' : (pct >= 70 ? 'var(--green)' : 'var(--water)');
    var pctClass = isOver ? 'over' : (pct >= 30 ? 'ok' : 'low');
    var row = document.createElement('div');
    row.className = 'dv-row';
    row.innerHTML = '<div class="dv-nm">'+ref.label+'</div><div class="dv-bar-bg"><div class="dv-bar-fill" style="width:'+Math.min(100,pct)+'%;background:'+barColor+'"></div></div><div class="dv-pct '+pctClass+'">'+pct+'% <span style="font-weight:400;font-family:var(--fb);font-size:.6rem">('+amt.toFixed(1)+ref.unit+')</span></div>';
    list.appendChild(row);
  });
}

function openAIAnalyzer() {
  var m = document.getElementById('aiAnalyzerModal');
  if (!m) { showToast('AI Scanner: tap the photo icon in + menu', 'ok'); return; }
  m.classList.add('open');
  var ua = document.getElementById('analyzerUploadArea');
  if (ua) ua.style.display = 'block';
}

function closeAIAnalyzer() {
  var m = document.getElementById('aiAnalyzerModal');
  if (m) m.classList.remove('open');
  var preview = document.getElementById('analyzerPreview');
  var result = document.getElementById('analyzerResult');
  var ua = document.getElementById('analyzerUploadArea');
  if (preview) preview.style.display = 'none';
  if (result) result.style.display = 'none';
  if (ua) ua.style.display = 'block';
}

async function scanFoodByText() {
  var inp = document.getElementById('scannerTextInput');
  if (!inp || !inp.value.trim()) { showToast('Describe what you ate first', 'err'); return; }
  var food = inp.value.trim();
  var btn = inp.nextElementSibling;
  if (btn) { btn.textContent = 'Analyzing...'; btn.disabled = true; }
  var resultEl   = document.getElementById('analyzerResult');
  var foodNameEl = document.getElementById('aFoodName');
  var macrosEl   = document.getElementById('aMacros');
  var confEl     = document.getElementById('aConfidence');
  try {
    var prompt = 'Estimate nutrition for: "' + food + '". Reply ONLY with valid JSON, no markdown: {"food_name":"","serving":"","calories":0,"protein_g":0,"carbs_g":0,"fat_g":0,"fiber_g":0,"confidence":"medium","notes":""}';
    var res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' },
      body: JSON.stringify({ model: 'llama-3.3-70b-versatile', max_tokens: 300, temperature: 0.1,
        messages: [{ role: 'system', content: 'You are a nutrition expert. Return ONLY valid JSON, no markdown.' }, { role: 'user', content: prompt }] })
    });
    var data = await res.json();
    if (data.error) throw new Error(data.error.message);
    var raw = (data.choices && data.choices[0]) ? data.choices[0].message.content : '';
    var text = raw.replace(/```json|```/g, '').trim();
    var result = JSON.parse(text);
    _analyzedFood = result;
    if (foodNameEl) foodNameEl.textContent = result.food_name;
    if (macrosEl) macrosEl.innerHTML =
      '<div style="text-align:center;background:var(--bg2);border-radius:10px;padding:8px"><div style="font-family:var(--ff);font-size:1.1rem;font-weight:800">' + result.calories + '</div><div style="font-size:.7rem;color:var(--muted2)">kcal</div></div>' +
      '<div style="text-align:center;background:var(--bg2);border-radius:10px;padding:8px"><div style="font-family:var(--ff);font-size:1.1rem;font-weight:800">' + result.protein_g + 'g</div><div style="font-size:.7rem;color:var(--pro)">Protein</div></div>' +
      '<div style="text-align:center;background:var(--bg2);border-radius:10px;padding:8px"><div style="font-family:var(--ff);font-size:1.1rem;font-weight:800">' + result.carbs_g + 'g</div><div style="font-size:.7rem;color:var(--carb)">Carbs</div></div>' +
      '<div style="text-align:center;background:var(--bg2);border-radius:10px;padding:8px"><div style="font-family:var(--ff);font-size:1.1rem;font-weight:800">' + result.fat_g + 'g</div><div style="font-size:.7rem;color:var(--fat)">Fat</div></div>';
    if (confEl) confEl.textContent = 'Confidence: ' + result.confidence + ' - ' + result.serving + (result.notes ? ' - ' + result.notes : '');
    if (resultEl) resultEl.style.display = 'block';
    showToast('Food analyzed!', 'ok');
  } catch(e) {
    showToast('Analysis error: ' + (e.message || 'check connection'), 'err');
  }
  if (btn) { btn.textContent = 'Analyze with Groq AI'; btn.disabled = false; }
}

async function analyzeFood(input) {
  if (!input.files || !input.files[0]) return;
  var file = input.files[0];
  var preview = document.getElementById('analyzerPreview');
  var img    = document.getElementById('analyzerImg');
  var status = document.getElementById('analyzerStatus');
  var ua     = document.getElementById('analyzerUploadArea');
  var reader = new FileReader();
  reader.onload = async function(e) {
    if (img)     img.src = e.target.result;
    if (preview) preview.style.display = 'block';
    if (ua)      ua.style.display = 'none';
    if (status)  { status.textContent = 'Analyzing with Groq Vision AI...'; status.style.display = 'block'; }
    try {
      var base64 = e.target.result.split(',')[1];
      var mimeType = file.type || 'image/jpeg';
      // Use Groq vision model — works anywhere, no Claude.ai required
      var res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer '
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-4-scout-17b-16e-instruct',
          max_tokens: 400,
          messages: [{
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: 'data:' + mimeType + ';base64,' + base64 } },
              { type: 'text', text: 'You are a nutrition expert. Analyze this food image and reply ONLY with valid JSON (no markdown, no extra text): {"food_name":"","serving":"1 serving","calories":0,"protein_g":0,"carbs_g":0,"fat_g":0,"fiber_g":0,"confidence":"high","notes":"brief tip"}' }
            ]
          }]
        })
      });
      var data = await res.json();
      if (data.error) throw new Error(data.error.message || 'Groq error');
      var raw = data.choices && data.choices[0] ? data.choices[0].message.content : '';
      var text = raw.replace(/```json|```/g, '').trim();
      var result = JSON.parse(text);
      _analyzedFood = result;
      var resultEl = document.getElementById('analyzerResult');
      if (resultEl) resultEl.style.display = 'block';
      var fn = document.getElementById('aFoodName');
      if (fn) fn.textContent = result.food_name;
      var am = document.getElementById('aMacros');
      if (am) am.innerHTML =
        '<div style="text-align:center;background:var(--bg2);border-radius:10px;padding:8px"><div style="font-family:var(--ff);font-size:1.1rem;font-weight:800">' + result.calories + '</div><div style="font-size:.7rem;color:var(--muted2)">kcal</div></div>' +
        '<div style="text-align:center;background:var(--bg2);border-radius:10px;padding:8px"><div style="font-family:var(--ff);font-size:1.1rem;font-weight:800">' + result.protein_g + 'g</div><div style="font-size:.7rem;color:var(--pro)">Protein</div></div>' +
        '<div style="text-align:center;background:var(--bg2);border-radius:10px;padding:8px"><div style="font-family:var(--ff);font-size:1.1rem;font-weight:800">' + result.carbs_g + 'g</div><div style="font-size:.7rem;color:var(--carb)">Carbs</div></div>' +
        '<div style="text-align:center;background:var(--bg2);border-radius:10px;padding:8px"><div style="font-family:var(--ff);font-size:1.1rem;font-weight:800">' + result.fat_g + 'g</div><div style="font-size:.7rem;color:var(--fat)">Fat</div></div>';
      var ac = document.getElementById('aConfidence');
      if (ac) ac.textContent = result.serving + (result.notes ? ' · ' + result.notes : '');
      if (status) status.style.display = 'none';
      showToast(result.food_name + ' analyzed!', 'ok');
    } catch(err) {
      if (status) status.textContent = 'Analysis failed: ' + (err.message || 'check connection');
      showToast('Groq Vision error — try text description', 'err');
    }
  };
  reader.readAsDataURL(file);
}

function logScannedFoodTo(meal) {
  if (!_scannedFood) return;
  var d = _scannedFood;
  if (!foodLog[meal]) foodLog[meal] = [];
  foodLog[meal].push({name: d.name, cal: d.cals, pro: d.p, carb: d.c, fat: d.f, fiber: d.fiber||0});
  totalCals += d.cals; totalPro += d.p; totalCarb += d.c; totalFat += d.f;
  updateMacroDisplay(); renderMealBlocks(); saveAppState();
  closeFoodScanner();
  showToast(d.name + ' added to ' + meal + ' ✓', 'ok');
}

function logAnalyzedFood(meal) {
  if (!_analyzedFood) return;
  // Use existing logFood system
  var entries = window._dailyEntries || (window._dailyEntries = {});
  var today = new Date().toDateString();
  if (!entries[today]) entries[today] = [];
  entries[today].push({
    name: '📸 ' + _analyzedFood.food_name,
    cals: _analyzedFood.calories || 0,
    pro: _analyzedFood.protein_g || 0,
    carb: _analyzedFood.carbs_g || 0,
    fat: _analyzedFood.fat_g || 0,
    meal: meal
  });
  // Update nutrition display if on nutrition page
  var nsEaten = document.getElementById('nsEaten');
  if (nsEaten) {
    var total = entries[today].reduce(function(s,f){return s+f.cals;},0);
    nsEaten.textContent = total;
    var nsLeft = document.getElementById('nsLeft');
    if (nsLeft && typeof U !== 'undefined') nsLeft.textContent = Math.max(0, (U.calories||2000) - total);
  }
  closeAIAnalyzer();
  showToast(_analyzedFood.food_name + ' → ' + meal + ' ✓', 'ok');
}

function openFoodScanner() {
  var m=document.getElementById('foodScannerModal'); if(m) m.classList.add('open');
  var pr=document.getElementById('scanPreview'); if(pr) pr.style.display='none';
  var res=document.getElementById('scanResult'); if(res) res.innerHTML='';
  _scannedFood=null;
}

function closeFoodScanner() {
  var m=document.getElementById('foodScannerModal'); if(m) m.classList.remove('open');
}

function onScanFileChange(inp) {
  var file=inp.files[0]; if(!file) return;
  var r=new FileReader();
  r.onload=function(e){
    var img=document.getElementById('scanImg'); if(img){img.src=e.target.result;img.parentElement.style.display='block';}
    var pr=document.getElementById('scanPreview'); if(pr) pr.style.display='block';
    document.getElementById('scanAnalyzeBtn').style.display='block';
  };
  r.readAsDataURL(file);
}

async function runFoodScan() {
  var nameInp=document.getElementById('scanFoodName');
  var foodName=(nameInp&&nameInp.value.trim()) || 'the food in the photo';
  var btn=document.getElementById('scanAnalyzeBtn');
  if(btn){btn.disabled=true; btn.textContent='Analyzing...';}
    var fmt = 'FOOD: [name] | CALS: [n] | P: [n]g | C: [n]g | F: [n]g | FIBER: [n]g | TIP: [1 sentence on missing nutrient + fix]';
  var prompt = 'Analyze food: "' + foodName + '". Reply EXACTLY: ' + fmt;
  try {
    var res=await fetch('https://api.groq.com/openai/v1/chat/completions',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '},
      body:JSON.stringify({model:'llama-3.3-70b-versatile',max_tokens:200,temperature:0.2,
        messages:[
          {role:'system',content:'Nutrition expert. Always reply in the exact format. Be precise.'},
          {role:'user',content:prompt}
        ]})
    });
    var d=await res.json();
    var txt=d.choices&&d.choices[0]?d.choices[0].message.content:'';
    _scannedFood=parseScan(txt);
    renderScanResult(_scannedFood);
  } catch(e){
    var res=document.getElementById('scanResult');
    if(res) res.innerHTML='<div style="color:#FF3B3B;font-size:.8rem;padding:8px">⚠️ Error — check connection</div>';
  }
  if(btn){btn.disabled=false; btn.textContent='Analyze 🔍';}
}

function parseScan(txt) {
  var r={name:'Food',cals:0,p:0,c:0,f:0,fiber:0,tip:''};
  var foodM=txt.match(/FOOD:\s*([^|\n]+)/i); if(foodM) r.name=foodM[1].trim();
  var cm=txt.match(/CALS?:\s*([\d.]+)/i);     if(cm)    r.cals=+cm[1];
  var pm=txt.match(/P:\s*([\d.]+)/i);          if(pm)    r.p=+pm[1];
  var km=txt.match(/C:\s*([\d.]+)/i);          if(km)    r.c=+km[1];
  var fm=txt.match(/F:\s*([\d.]+)/i);          if(fm)    r.f=+fm[1];
  var fibm=txt.match(/FIBER:\s*([\d.]+)/i);    if(fibm)  r.fiber=+fibm[1];
  var tipm=txt.match(/TIP:\s*(.+)/i);           if(tipm)  r.tip=tipm[1].trim();
  return r;
}

function renderScanResult(r) {
  var el = document.getElementById('scanResult'); if (!el) return;
  var imgSrc = document.getElementById('scanImg') ? document.getElementById('scanImg').src : '';
  var hasImg = imgSrc && imgSrc.length > 50;
  el.innerHTML =
    '<div class="scan-result-card">' +
      '<div style="padding:14px">' +
        (hasImg ? '<img class="scan-result-img" src="' + imgSrc + '" alt="food">' : '') +
        '<div class="scan-food-title">' + r.name + '</div>' +
        '<div class="scan-serving-label">AI estimate per serving</div>' +
        '<div class="scan-macro-row">' +
          '<div class="scan-macro-box"><div class="scan-macro-val">' + r.cals + '</div><div class="scan-macro-lbl">kcal</div></div>' +
          '<div class="scan-macro-box"><div class="scan-macro-val" style="color:var(--pro)">' + r.p + 'g</div><div class="scan-macro-lbl">protein</div></div>' +
          '<div class="scan-macro-box"><div class="scan-macro-val" style="color:var(--carb)">' + r.c + 'g</div><div class="scan-macro-lbl">carbs</div></div>' +
          '<div class="scan-macro-box"><div class="scan-macro-val" style="color:var(--fat)">' + r.f + 'g</div><div class="scan-macro-lbl">fat</div></div>' +
        '</div>' +
        (r.tip ? '<div class="scan-tip-box">💡 ' + r.tip + '</div>' : '') +
        '<div style="font-size:.8rem;font-weight:700;margin-bottom:8px">Add to meal:</div>' +
        '<div class="scan-add-meal-grid">' +
          '<button class="scan-meal-btn" onclick="logScannedFoodTo(\"Breakfast\")">🌅 Breakfast</button>' +
          '<button class="scan-meal-btn" onclick="logScannedFoodTo(\"Lunch\")">☀️ Lunch</button>' +
          '<button class="scan-meal-btn" onclick="logScannedFoodTo(\"Dinner\")">🌙 Dinner</button>' +
          '<button class="scan-meal-btn" onclick="logScannedFoodTo(\"Snack\")">🍎 Snack</button>' +
        '</div>' +
        '<button class="scan-improve-btn" onclick="runFoodScan()">✦ Re-analyze</button>' +
      '</div>' +
    '</div>';
}

function logScannedFood() {
  if(!_scannedFood) return;
  var d=_scannedFood;
  if(!foodLog[selectedMeal]) foodLog[selectedMeal]=[];
  foodLog[selectedMeal].push({name:d.name,cal:d.cals,pro:d.p,carb:d.c,fat:d.f,fiber:d.fiber||0});
  totalCals+=d.cals; totalPro+=d.p; totalCarb+=d.c; totalFat+=d.f;
  updateMacroDisplay(); renderMealBlocks(); saveAppState();
  closeFoodScanner();
  showToast(d.name+' → '+selectedMeal+' ✓','ok');
}

async function fetchEdamam(query) {
  if (!query || query.length < 2) return [];
  try {
    var base = 'https://api.edamam.com/api/food-database/v2/parser'
      + '?app_id=' + EDAMAM_APP_ID + '&app_key=' + EDAMAM_APP_KEY
      + '&ingr=' + encodeURIComponent(query) + '&nutrition-type=logging&category=generic-foods';
    var url = 'https://corsproxy.io/?' + encodeURIComponent(base);
    var res = await fetch(url);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    var data = await res.json();
    if (!data.hints || !data.hints.length) return [];
    return data.hints.slice(0, 10).map(function(h) {
      var n = h.food.nutrients || {};
      return { id: h.food.foodId, name: h.food.label, ico: '>', per: '100g',
        cals: Math.round(n.ENERC_KCAL || 0), p: Math.round(n.PROCNT || 0),
        c: Math.round(n.CHOCDF || 0), f: Math.round(n.FAT || 0),
        fiber: Math.round(n.FIBTG || 0), source: 'Edamam' };
    });
  } catch(e) { return []; }
}

async function fetchEdamamNutrition(foodId, measureUri) {
  try {
    const body = {
      ingredients: [{
        quantity: 100,
        measureURI: measureUri || 'http://www.edamam.com/ontologies/edamam.owl#Measure_gram',
        foodId: foodId
      }]
    };
    const url = `https://api.edamam.com/api/food-database/v2/nutrients?app_id=${EDAMAM_APP_ID}&app_key=${EDAMAM_APP_KEY}`;
    const res = await fetch(url, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(body)
    });
    const data = await res.json();
    return data.totalNutrients || {};
  } catch(e) {
    return {};
  }
}

async function onFoodSearch(val) {
  const resultsEl = document.getElementById('foodSearchResults');
  if (!resultsEl) return;
  if (!val || val.length < 2) {
    resultsEl.style.display = 'none';
    return;
  }
  // Also filter local FOOD_DB immediately
  const localMatches = FOOD_DB.filter(f => f.name.toLowerCase().includes(val.toLowerCase())).slice(0, 5);
  renderFoodSearchResults(localMatches, resultsEl, val, true);
  
  clearTimeout(_edamamSearchTimer);
  _edamamSearchTimer = setTimeout(async () => {
    const results = await fetchEdamam(val);
    _edamamResults = results;
    if (results.length > 0) {
      renderFoodSearchResults(results, resultsEl, val, false);
    } else if (localMatches.length === 0) {
      resultsEl.innerHTML = '<div class="food-sr-empty">No foods found for \"' + val + '\"</div>';
      resultsEl.style.display = 'block';
    }
  }, 400);
}

function renderFoodSearchResults(results, container, query, isLocal) {
  if (!container) return;
  if (!results.length) return;
  const html = results.map(f => `
    <div class="food-sr-row" onclick="selectSearchFood(${JSON.stringify(f).replace(/"/g,'&quot;')})">
      <div class="food-sr-ico">${f.ico || '🍽️'}</div>
      <div class="food-sr-info">
        <div class="food-sr-name">${f.name}</div>
        <div class="food-sr-meta">${f.cals} kcal · P:${f.p}g C:${f.c}g F:${f.f}g · ${f.per || '100g'}
          <span class="food-sr-src ${isLocal ? 'src-local' : 'src-edamam'}">${isLocal ? 'Local' : 'Edamam'}</span>
        </div>
      </div>
      <div class="food-sr-add">+</div>
    </div>
  `).join('');
  container.innerHTML = html;
  container.style.display = 'block';
}

function selectSearchFood(food) {
  // Close dropdown
  const el = document.getElementById('foodSearchResults');
  if (el) el.style.display = 'none';
  const inp = document.getElementById('foodSearchInput');
  if (inp) inp.value = '';
  
  // Log to selected meal
  const meal = selectedMeal || 'Breakfast';
  foodLog[meal].push({
    name: food.name, cal: food.cals, pro: food.p,
    carb: food.c, fat: food.f, fiber: food.fiber || 0
  });
  totalCals += food.cals; totalPro += food.p;
  totalCarb += food.c; totalFat += food.f;
  
  updateMacroDisplay();
  renderMealBlocks();
  saveAppState();
  showToast(food.name + ' added to ' + meal + ' ✓', 'ok');
}

function openFoodSearch() {
  showToast('Type in the search bar above 🔍', 'ok');
}

function openFoodSearchModal() {
  // Focus the search bar in the foods page
  showPage('foods', document.getElementById('nav-foods'));
  setTimeout(function(){ 
    var inp = document.getElementById('foodsPageSearch');
    if (inp) inp.focus();
  }, 100);
}

function openDailyReport() {
  const modal = document.getElementById('dailyReportModal');
  if (!modal) return;
  renderDailyReport();
  modal.classList.add('open');
}

function openNutrMenu(btn, nutr) {
  var old = document.getElementById('nutrCtxMenu');
  if (old) { old.remove(); if (old._nutrKey === nutr.nm) return; }
  var menu = document.createElement('div');
  menu.id = 'nutrCtxMenu';
  menu._nutrKey = nutr.nm;
  menu.className = 'nutr-ctx-menu';
  var items = [
    {icon:'📖', text:'Learn More', fn: function(){ openNutrDetail(nutr); }},
    {icon:'🎯', text:'Set Goal',   fn: function(){ showToast('Set goal coming soon','ok'); }},
    {icon:'📓', text:'Add to Diary', fn: function(){ addNutrToDiary(nutr); }}
  ];
  items.forEach(function(item) {
    var d = document.createElement('div');
    d.className = 'ncm-item';
    d.textContent = item.icon + ' ' + item.text;
    d.onclick = function() { item.fn(); menu.remove(); };
    menu.appendChild(d);
  });
  var rect = btn.getBoundingClientRect();
  menu.style.cssText = 'position:fixed;z-index:9999;background:var(--card);border:1px solid var(--border);border-radius:12px;padding:4px;min-width:160px;box-shadow:0 8px 24px rgba(0,0,0,0.5);top:' + (rect.bottom+4) + 'px;right:' + (window.innerWidth-rect.right) + 'px';
  document.body.appendChild(menu);
  setTimeout(function() {
    document.addEventListener('click', function rm(){ if(menu.parentNode) menu.remove(); document.removeEventListener('click', rm); });
  }, 10);
}

function rm(){ if(menu.parentNode) menu.remove(); document.removeEventListener('click', rm); }

function addNutrToDiary(nutr) {
  showToast('📓 ' + nutr.nm + ' noted in diary', 'ok');
}

function filterFoodDB(q) {
  currentFoodSearch = q.toLowerCase();
  renderFoodDB();
}

function filterFoodCat(cat, el) {
  currentFoodCat = cat;
  document.querySelectorAll('.cat-chip').forEach(function(c){ c.classList.remove('active'); });
  if(el) el.classList.add('active');
  renderFoodDB();
}

function quickAddFoodByIdx(idx) { quickLogFood(idx); }

function quickAddFromDB(name) {
  var food = FOOD_DB.find(function(f){ return f.name === name; });
  if (!food) return;
  // Default to current meal time
  var hour = new Date().getHours();
  var meal = hour < 11 ? 'Breakfast' : hour < 15 ? 'Lunch' : hour < 20 ? 'Dinner' : 'Snacks';
  addFoodToMeal(meal, {
    name: food.ico + ' ' + food.name,
    cals: food.cals, protein: food.p, carbs: food.c, fat: food.f, fiber: food.fiber,
    zinc: food.zinc, iron: food.iron, mag: food.mag, calc: food.calc, vitd: food.vitd
  });
  showToast('Added ' + food.name + ' to ' + meal, 'ok');
}

function createCustomFood() {
  openFoodModal('Snacks');
}

function toggleMealSection(meal) {
  var items = document.getElementById('mi-' + meal.toLowerCase());
  var chev = document.getElementById('chev-' + meal.toLowerCase());
  if (!items) return;
  var visible = items.style.display !== 'none';
  items.style.display = visible ? 'none' : 'flex';
  if (chev) chev.textContent = visible ? '›' : '▾';
}



// ── Window bindings ──
window.renderFoodDB = renderFoodDB;
window.switchFoodsTab = switchFoodsTab;
window.quickAddFromDB = quickAddFromDB;
window.openAIAnalyzer = openAIAnalyzer;
window.onScanFileChange = onScanFileChange;
window.qf = qf;
window.renderMealBlocks = renderMealBlocks;
window.selMealTabByName = selMealTabByName;
window.analyzeFood = analyzeFood;
window.onFoodSearch = onFoodSearch;
window.closeNutrModal = closeNutrModal;
window.filterFoodCat = filterFoodCat;
window.toggleNutrLib = toggleNutrLib;
window.runFoodScan = runFoodScan;
window.closeAIAnalyzer = closeAIAnalyzer;
window.scanFoodByText = scanFoodByText;
window.openDailyReport = openDailyReport;
window.renderScanResult = renderScanResult;
window.foodsPageFilter = foodsPageFilter;
window.logFood = logFood;
window.parseScan = parseScan;
window.toggleMealSection = toggleMealSection;
window.quickAddFoodByIdx = quickAddFoodByIdx;
window.openNutrMenu = openNutrMenu;
window.toggleNutrAccordion = toggleNutrAccordion;
window.buildNutrGrid = buildNutrGrid;
window.renderDV = renderDV;
window.closeFoodScanner = closeFoodScanner;
window.closeFoodModal = closeFoodModal;
window.filterNutr = filterNutr;
window.fetchEdamam = fetchEdamam;
window.logAnalyzedFood = logAnalyzedFood;
window.logScannedFood = logScannedFood;
window.renderFavorites = renderFavorites;
window.renderWater = renderWater;
window.openFoodSearch = openFoodSearch;
window.addNutrToDiary = addNutrToDiary;
window.createCustomFood = createCustomFood;
window.openFoodScanner = openFoodScanner;
window.openFoodSearchModal = openFoodSearchModal;
window.logScannedFoodTo = logScannedFoodTo;
window.selectSearchFood = selectSearchFood;
window.openNutrDetail = openNutrDetail;
window.getSuggestions = getSuggestions;
window.rm = rm;
window.toggleFavorite = toggleFavorite;
window.updateMacroDisplay = updateMacroDisplay;
window.openFoodModal = openFoodModal;
window.renderFoodSearchResults = renderFoodSearchResults;
window.selMealTab = selMealTab;
window.openSuggestFood = openSuggestFood;
window.fetchEdamamNutrition = fetchEdamamNutrition;
window.closeSuggestFood = closeSuggestFood;
window.filterFoodDB = filterFoodDB;
window.setFoodCat = setFoodCat;
window.toggleSFFilter = toggleSFFilter;
window.quickLogFood = quickLogFood;
