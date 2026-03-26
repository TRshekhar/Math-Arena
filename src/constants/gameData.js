export const T1_COLOR = "#00e676";
export const T2_COLOR = "#ff1744";
export const AC_COLOR = "#40c4ff";
export const BG_DARK = "#060f1e";
export const BG_MID = "#0a1830";
export const BG_CARD = "#0f2040";

export const ROPE_STEP = 4;
export const WIN_L = 12;
export const WIN_R = 88;
export const Q_TIME = 25; // global fallback timer (seconds)

export const DIFF_COL = { easy: "#69f0ae", medium: "#ffab40", hard: "#ff5252" };

export const uid = () => Math.random().toString(36).slice(2, 9);
export const shuffle = (a) => [...a].sort(() => Math.random() - 0.5);

// Each question may have its own `timer` (seconds). Falls back to Q_TIME if absent.
export const DEFAULT_Q = [
{ id:'q1', type:'sub', q:'Rs. 5000 is divided into two parts such that if one part is invested at 4% and the other at 5%, the total annual interest is ₹223. How much was invested at 4%?', ans:'2700', diff:'medium', cat:'Arithmetic', timer:30 },

{ id:'q2', type:'sub', q:'If the volume of a sphere is 24416.64 cm³, find its surface area (π=3.14).', ans:'4069.44', diff:'hard', cat:'Geometry', timer:30 },

{ id:'q3', type:'sub', q:'Ruchi, Khushi and Teju can complete a work in 30, 40 and 60 days respectively. In how many days can Ruchi complete the work if assisted by both every third day?', ans:'85/4', diff:'hard', cat:'Time and Work', timer:35 },

{ id:'q4', type:'sub', q:'If the diameter of a sphere is 3.5 cm, what is its total surface area?', ans:'38.5', diff:'medium', cat:'Geometry', timer:25 },

{ id:'q5', type:'sub', q:'Calculate HCF of 12/5, 14/15, 16/17.', ans:'2/255', diff:'medium', cat:'Number Theory', timer:25 },

{ id:'q6', type:'sub', q:'Average marks of 60 students is 62. Boys average 60 and girls average 65. Find number of boys.', ans:'36', diff:'medium', cat:'Arithmetic', timer:25 },

{ id:'q7', type:'sub', q:'Find the nearest number greater than 87501 and divisible by 765.', ans:'87975', diff:'medium', cat:'Number Theory', timer:25 },

{ id:'q8', type:'sub', q:'A trader uses a faulty balance showing 1300 g as 1 kg and marks up cost by 15%. Find net profit percentage.', ans:'49.5%', diff:'hard', cat:'Profit & Loss', timer:35 },

{ id:'q9', type:'sub', q:'Difference between a 25% discount and successive discounts of 15% and 10% is ₹25. Find the amount of the bill.', ans:'1666.67', diff:'hard', cat:'Arithmetic', timer:35 },

{ id:'q10', type:'sub', q:'Find the correct combination of signs to balance: 20 * 2 * 50 * 5 * 115.', ans:'+, ×, −, =', diff:'medium', cat:'Logical Reasoning', timer:25 },

{ id:'q11', type:'sub', q:'If BREAK is written as 2182111 and COLOUR as 34124518, how will TRING be written?', ans:'20183147', diff:'hard', cat:'Coding Decoding', timer:30 },

{ id:'q12', type:'sub', q:'Statements: Some W are F. Some R are F. Which conclusion follows?', ans:'Neither conclusion follows', diff:'medium', cat:'Reasoning', timer:25 },

{ id:'q13', type:'sub', q:'A # B means mother, A @ B means son, A & B means brother, A % B means wife. If W # Q @ T & Y @ M % K, how is K related to W?', ans:'Father-in-law', diff:'hard', cat:'Reasoning', timer:30 },

{ id:'q14', type:'sub', q:'Which numbers and signs should be interchanged to correct: 14 × 6 ÷ 12 + 15 − 9 = 203?', ans:'15, 6, +, ÷', diff:'hard', cat:'Reasoning', timer:30 },

{ id:'q15', type:'sub', q:'Find the odd letter cluster among CGB, FYI, RKU, KDN.', ans:'CGB', diff:'easy', cat:'Reasoning', timer:20 },

{ id:'q16', type:'sub', q:'Boat speed in still water is 10 km/h and stream speed is 4 km/h. Upstream takes 4 hours more than downstream. Find the distance.', ans:'42', diff:'medium', cat:'Boats & Streams', timer:30 },

{ id:'q17', type:'sub', q:'If PIPE is written as 169165, what is the last digit of SWAN?', ans:'3', diff:'medium', cat:'Coding Decoding', timer:25 },

{ id:'q18', type:'sub', q:'Speed ratio of A and B is 5:7. After travelling downstream for 4 hours the distance between them is 24 km. Find distance between them after 6 hours moving in opposite directions.', ans:'240', diff:'hard', cat:'Boats & Streams', timer:35 },

{ id:'q19', type:'sub', q:'Packaging cost is 20% of orange cost. Orange price increases 30% and packaging decreases 50%. Find percentage change in packed orange cost.', ans:'14.66%', diff:'medium', cat:'Arithmetic', timer:30 },

{ id:'q20', type:'sub', q:'An accurate clock shows 8 AM. Through how many degrees will the hour hand rotate by 2 PM?', ans:'144', diff:'easy', cat:'Clock', timer:20 },

{ id:'q21', type:'sub', q:'Arun invested ₹8000 for 6 months, Kamal ₹4000 for 8 months, Vinay ₹8000 for 8 months. Total profit ₹4005. Find Kamal share.', ans:'1335', diff:'medium', cat:'Partnership', timer:30 },

{ id:'q22', type:'sub', q:'26 kg rice at ₹20/kg mixed with 30 kg at ₹36/kg and sold at ₹30/kg. Find profit percentage.', ans:'0%', diff:'medium', cat:'Profit & Loss', timer:30 },

{ id:'q23', type:'sub', q:'A, B, C rent a pasture. A uses 10 oxen for 7 months, B 12 oxen for 5 months, C 15 oxen for 3 months. Total rent ₹175. Find C share.', ans:'50', diff:'medium', cat:'Ratio', timer:30 },

{ id:'q24', type:'sub', q:'Given relation symbols: + mother, - brother, % father, × sister. Which expression shows P is maternal uncle of Q?', ans:'Q-N+M×P', diff:'hard', cat:'Reasoning', timer:30 },

{ id:'q25', type:'sub', q:'Find the next number in the series: 7, 26, 63, 124, 215, 342.', ans:'391', diff:'medium', cat:'Series', timer:25 },

{ id:'q26', type:'sub', q:'Difference between SI and CI for 2 years at 4% is ₹1. Find the principal.', ans:'625', diff:'medium', cat:'Interest', timer:25 },

{ id:'q27', type:'sub', q:'Angle of elevation of a tower changes from 30° to 60° after moving closer. Find the distance from the original point.', ans:'12', diff:'hard', cat:'Trigonometry', timer:35 },

{ id:'q28', type:'sub', q:'Boat P speed 40 km/h and boat Q speed x km/h. Using given upstream and downstream travel times find x + y.', ans:'70', diff:'hard', cat:'Boats & Streams', timer:35 },

{ id:'q29', type:'sub', q:'45 men can complete work in 16 days. After 6 days, 30 more men join. How many days to finish remaining work?', ans:'9', diff:'medium', cat:'Time and Work', timer:30 },

{ id:'q30', type:'sub', q:'X can complete work in 20 days and Y in 12 days. X works alone for 4 days then Y joins. Total time taken?', ans:'10', diff:'medium', cat:'Time and Work', timer:30 }
];;