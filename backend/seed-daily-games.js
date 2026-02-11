require('dotenv').config();
const pool = require('./config/db');

// Sample games for seeding - Personality & Lifestyle Questions
const sampleGames = [
  // Communication & Personality
  {
    date: new Date().toISOString().split('T')[0], // Today
    question: 'Talking or Listening',
    option1_text: 'Talking',
    option1_image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400',
    option2_text: 'Listening',
    option2_image: 'https://images.unsplash.com/photo-1516534775068-ba3e7458af70?w=400'
  },
  {
    date: getDateOffset(1),
    question: 'Test the waters or Dive into the deep end',
    option1_text: 'Test the waters',
    option1_image: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=400',
    option2_text: 'Dive into the deep end',
    option2_image: 'https://images.unsplash.com/photo-1530053969600-caed2596d242?w=400'
  },
  {
    date: getDateOffset(2),
    question: 'Prefer to be Embarrassed or Afraid',
    option1_text: 'Embarrassed',
    option1_image: 'https://images.unsplash.com/photo-1584824486509-112e4181ff6b?w=400',
    option2_text: 'Afraid',
    option2_image: 'https://images.unsplash.com/photo-1578256458382-4c61a8e4d5c6?w=400'
  },
  {
    date: getDateOffset(3),
    question: 'Logic or Emotion (when making decisions)',
    option1_text: 'Logic',
    option1_image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400',
    option2_text: 'Emotion',
    option2_image: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=400'
  },
  
  // Daily Life & Habits
  {
    date: getDateOffset(4),
    question: 'Night person or Morning person',
    option1_text: 'Night person',
    option1_image: 'https://images.unsplash.com/photo-1494197436632-c1b1e8b0bea4?w=400',
    option2_text: 'Morning person',
    option2_image: 'https://images.unsplash.com/photo-1495214783159-3503fd1b572d?w=400'
  },
  {
    date: getDateOffset(5),
    question: 'Start work late or Leave work early',
    option1_text: 'Start work late',
    option1_image: 'https://images.unsplash.com/photo-1551244072-5d12893278ab?w=400',
    option2_text: 'Leave work early',
    option2_image: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=400'
  },
  {
    date: getDateOffset(6),
    question: 'Sleeping with door closed or door open',
    option1_text: 'Door closed',
    option1_image: 'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=400',
    option2_text: 'Door open',
    option2_image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400'
  },
  {
    date: getDateOffset(7),
    question: 'Soap or Body wash',
    option1_text: 'Soap',
    option1_image: 'https://images.unsplash.com/photo-1585128903994-c8a1f49e189b?w=400',
    option2_text: 'Body wash',
    option2_image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400'
  },
  
  // Food & Drink
  {
    date: getDateOffset(8),
    question: 'Specialized coffee or Instant coffee',
    option1_text: 'Specialized coffee',
    option1_image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400',
    option2_text: 'Instant coffee',
    option2_image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400'
  },
  {
    date: getDateOffset(9),
    question: 'Food you refuse to share',
    option1_text: 'Dessert',
    option1_image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400',
    option2_text: 'Fries',
    option2_image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400'
  },
  {
    date: getDateOffset(10),
    question: 'Spend on a Hotel or an Experience',
    option1_text: 'Hotel',
    option1_image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400',
    option2_text: 'Experience',
    option2_image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400'
  },
  
  // Tech & Lifestyle
  {
    date: getDateOffset(11),
    question: 'Android or iPhone',
    option1_text: 'Android',
    option1_image: 'https://images.unsplash.com/photo-1607252650355-f7fd0460ccdb?w=400',
    option2_text: 'iPhone',
    option2_image: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=400'
  },
  {
    date: getDateOffset(12),
    question: 'Sneakers or Sandals',
    option1_text: 'Sneakers',
    option1_image: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=400',
    option2_text: 'Sandals',
    option2_image: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=400'
  },
  {
    date: getDateOffset(13),
    question: "What's sexier?",
    option1_text: 'Flip-flops',
    option1_image: 'https://images.unsplash.com/photo-1561861422-a549073e547a?w=400',
    option2_text: 'High heels',
    option2_image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400'
  },
  {
    date: getDateOffset(14),
    question: 'Crocs or Birkenstocks',
    option1_text: 'Crocs',
    option1_image: 'https://images.unsplash.com/photo-1591719371135-41f7c1a9f3b4?w=400',
    option2_text: 'Birkenstocks',
    option2_image: 'https://images.unsplash.com/photo-1560343776-97e7d202ff0e?w=400'
  },
  {
    date: getDateOffset(15),
    question: 'Driver or Passenger',
    option1_text: 'Driver',
    option1_image: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=400',
    option2_text: 'Passenger',
    option2_image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400'
  },
  
  // Work & Money
  {
    date: getDateOffset(16),
    question: 'Sort by Price or Rating',
    option1_text: 'Price',
    option1_image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400',
    option2_text: 'Rating',
    option2_image: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=400'
  },
  {
    date: getDateOffset(17),
    question: "What's worse?",
    option1_text: 'Bad breath',
    option1_image: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=400',
    option2_text: 'Body odour',
    option2_image: 'https://images.unsplash.com/photo-1556229174-5e42a09e9e6d?w=400'
  },
  {
    date: getDateOffset(18),
    question: 'Win the Lottery or Land your Dream Job',
    option1_text: 'Win the Lottery',
    option1_image: 'https://images.unsplash.com/photo-1533067310686-39418a9186b4?w=400',
    option2_text: 'Land your Dream Job',
    option2_image: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=400'
  },
  {
    date: getDateOffset(19),
    question: 'Raise or Bonus',
    option1_text: 'Raise',
    option1_image: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=400',
    option2_text: 'Bonus',
    option2_image: 'https://images.unsplash.com/photo-1633158829875-e5316a358c6f?w=400'
  },
  
  // Social Life & Fun
  {
    date: getDateOffset(20),
    question: 'Attend a party or Host a party',
    option1_text: 'Attend a party',
    option1_image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400',
    option2_text: 'Host a party',
    option2_image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400'
  },
  {
    date: getDateOffset(21),
    question: 'Big wedding or Intimate ceremony',
    option1_text: 'Big wedding',
    option1_image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400',
    option2_text: 'Intimate ceremony',
    option2_image: 'https://images.unsplash.com/photo-1606800052052-1e99e0c69e07?w=400'
  },
  {
    date: getDateOffset(22),
    question: 'Rekindle a Friendship or Rekindle a Romance',
    option1_text: 'Rekindle a Friendship',
    option1_image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400',
    option2_text: 'Rekindle a Romance',
    option2_image: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=400'
  },
  {
    date: getDateOffset(23),
    question: 'Family style',
    option1_text: 'Large',
    option1_image: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=400',
    option2_text: 'Nuclear',
    option2_image: 'https://images.unsplash.com/photo-1609220136736-443140cffec6?w=400'
  },
  
  // Love & Relationships
  {
    date: getDateOffset(24),
    question: 'In the bedroom (behind closed doors)',
    option1_text: 'Loud',
    option1_image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=400',
    option2_text: 'Quiet',
    option2_image: 'https://images.unsplash.com/photo-1604881991720-f91add269bed?w=400'
  },
  {
    date: getDateOffset(25),
    question: 'Perfect first date spot',
    option1_text: 'Café',
    option1_image: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=400',
    option2_text: 'Restaurant',
    option2_image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400'
  },
  {
    date: getDateOffset(26),
    question: 'Would you want to be with',
    option1_text: 'The Smartest person',
    option1_image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400',
    option2_text: 'The Richest person',
    option2_image: 'https://images.unsplash.com/photo-1579621970795-87facc2f976d?w=400'
  },
  
  // Random & Fun
  {
    date: getDateOffset(27),
    question: 'Intense pain for 10 minutes or Dull pain for a day',
    option1_text: 'Intense pain for 10 min',
    option1_image: 'https://images.unsplash.com/photo-1584553735916-01b6bfd93be4?w=400',
    option2_text: 'Dull pain for a day',
    option2_image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400'
  },
  {
    date: getDateOffset(28),
    question: 'Pickleball',
    option1_text: 'Yay',
    option1_image: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=400',
    option2_text: 'Nay',
    option2_image: 'https://images.unsplash.com/photo-1595429812624-67c156abf050?w=400'
  },
  {
    date: getDateOffset(29),
    question: 'Movie Director',
    option1_text: 'Quentin Tarantino',
    option1_image: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400',
    option2_text: 'Guy Ritchie',
    option2_image: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400'
  },
  {
    date: getDateOffset(30),
    question: 'Movie Director',
    option1_text: 'Martin Scorsese',
    option1_image: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400',
    option2_text: 'Steven Spielberg',
    option2_image: 'https://images.unsplash.com/photo-1594908900066-3f47337549d8?w=400'
  },
  {
    date: getDateOffset(31),
    question: 'TV Show',
    option1_text: 'Friends',
    option1_image: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=400',
    option2_text: 'Game of Thrones',
    option2_image: 'https://images.unsplash.com/photo-1520716963369-61a25f00f2f2?w=400'
  },
  {
    date: getDateOffset(32),
    question: 'City',
    option1_text: 'New York',
    option1_image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400',
    option2_text: 'Paris',
    option2_image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400'
  },
  {
    date: getDateOffset(33),
    question: 'Sports',
    option1_text: 'Wimbledon Final',
    option1_image: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=400',
    option2_text: 'Cricket World Cup',
    option2_image: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=400'
  },
  {
    date: getDateOffset(34),
    question: 'Game of Thrones House',
    option1_text: 'Lannister',
    option1_image: 'https://images.unsplash.com/photo-1548222606-6c4f581fd09d?w=400',
    option2_text: 'Stark',
    option2_image: 'https://images.unsplash.com/photo-1551027197-6e0f82d8f137?w=400'
  },
  {
    date: getDateOffset(35),
    question: 'Which Friends character are you?',
    option1_text: 'Monica/Ross/Rachel',
    option1_image: 'https://images.unsplash.com/photo-1489980557514-251d61e3eeb6?w=400',
    option2_text: 'Chandler/Phoebe/Joey',
    option2_image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400'
  }
];

function getDateOffset(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

async function seedDailyGames() {
  try {
    console.log('Seeding daily games...');
    
    for (const game of sampleGames) {
      try {
        await pool.execute(
          `INSERT INTO daily_games (game_date, question, option1_text, option1_image, option2_text, option2_image) 
           VALUES (?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE 
           question = VALUES(question),
           option1_text = VALUES(option1_text),
           option1_image = VALUES(option1_image),
           option2_text = VALUES(option2_text),
           option2_image = VALUES(option2_image)`,
          [
            game.date,
            game.question,
            game.option1_text,
            game.option1_image,
            game.option2_text,
            game.option2_image
          ]
        );
        console.log(`✅ Added/Updated game for ${game.date}: ${game.question}`);
      } catch (error) {
        console.error(`❌ Failed to add game for ${game.date}:`, error.message);
      }
    }
    
    console.log('\n✅ Daily games seeding completed successfully');
    console.log(`Total games seeded: ${sampleGames.length} (36 days of questions)`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedDailyGames();
